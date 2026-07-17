import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { LEVELS, type Locale, type Localized } from "@/types";

// Server-only (Admin SDK). Shared by the manual admin moderation route and
// the AI validation route so points are only ever awarded in one place.

const L = (ka: string, en: string, ru: string): Localized => ({ ka, en, ru });

// Spotlight copy is templated (not translated on the fly), so every phrase
// needed is hand-written in all 3 site languages up front.
const TASK_LABELS: Record<string, Localized> = {
  litter: L("ნაგვის აღება", "cleaning up litter", "уборку мусора"),
  "stray-feeding": L("მაწანწალას გამოკვება", "feeding a stray animal", "кормление бездомного животного"),
  "senior-help": L("უფროსის დახმარება", "helping a senior citizen", "помощь пожилому человеку"),
  graffiti: L("გრაფიტის წაშლა", "removing graffiti", "удаление графити"),
  "tree-care": L("ხის მოვლა", "caring for a tree", "заботу о дереве"),
};

export async function approveDeed(
  db: Firestore,
  deedId: string,
  userId: string,
  points: number,
  cvConfidence: number | null,
): Promise<void> {
  const deedRef = db.collection("deeds").doc(deedId);
  const userRef = db.collection("users").doc(userId);
  const [deedSnap, userSnap] = await Promise.all([deedRef.get(), userRef.get()]);
  if (!userSnap.exists) throw new Error("user_not_found");
  const deed = deedSnap.data() ?? {};
  const userData = userSnap.data() ?? {};

  const newPoints = (userData.carePoints ?? 0) + points;
  const newLevel =
    [...LEVELS].reverse().find((l) => newPoints >= l.threshold)?.level ?? 1;

  const tasks: Promise<unknown>[] = [
    deedRef.update({
      status: "approved",
      validatedAt: Date.now(),
      cvConfidence,
      pointsAwarded: points,
      rejectionReason: null,
    }),
    userRef.update({
      carePoints: FieldValue.increment(points),
      level: newLevel,
    }),
    // Real, live counters for the landing page — replaces made-up marketing
    // numbers with actual usage as soon as there is any.
    db.doc("stats/global").set(
      { totalPoints: FieldValue.increment(points), approvedDeeds: FieldValue.increment(1) },
      { merge: true },
    ),
  ];

  // Citizens can opt out of the public spotlight (profile setting) — points
  // are unaffected either way, only the public photo/name post is skipped.
  if (userData.consentSpotlight !== false) {
    tasks.push(createSpotlightPost(db, deedId, deed, points));
  }

  await Promise.all(tasks);
}

// Every approved deed — AI or human-approved — gets an AI-authored spotlight
// post featuring the citizen's photo, so good-deed-doers are surfaced on the
// main feed the same way regardless of who validated them.
async function createSpotlightPost(
  db: Firestore,
  deedId: string,
  deed: Record<string, unknown>,
  points: number,
): Promise<void> {
  const taskLabel = TASK_LABELS[deed.taskTypeId as string] ?? L("კარგი საქმე", "a good deed", "доброе дело");
  const authorName = (deed.authorName as string) || "A citizen";
  const locales: Locale[] = ["ka", "en", "ru"];

  const title: Localized = { ka: "", en: "", ru: "" };
  const body: Localized = { ka: "", en: "", ru: "" };
  for (const l of locales) {
    title[l] =
      l === "ka" ? `${authorName}-მ ახლახან დაეხმარა თბილისს 🌟`
      : l === "ru" ? `${authorName} только что помог(ла) Тбилиси 🌟`
      : `${authorName} just helped Tbilisi 🌟`;
    body[l] =
      l === "ka" ? `დადასტურებულია: ${authorName} შეასრულა ${taskLabel.ka}. AI-ს დადასტურებული მტკიცებულება, +${points} CarePoints მიღებულია.`
      : l === "ru" ? `Подтверждено: ${authorName} выполнил(а) ${taskLabel.ru}. Доказательство проверено AI, начислено +${points} CarePoints.`
      : `Verified: ${authorName} completed ${taskLabel.en}. AI-checked proof, +${points} CarePoints awarded.`;
  }

  await db.collection("officialPosts").add({
    tag: "spotlight",
    title,
    body,
    imageUrl: (deed.proofUrl as string) ?? null,
    authorName,
    authorPhotoURL: (deed.authorPhotoURL as string) ?? null,
    ctaLabel: L("საქმის ნახვა", "View deed", "Смотреть дело"),
    ctaHref: `/app/deed/${deedId}`,
    source: "ai",
    createdAt: Date.now(),
  });
}

export async function rejectDeed(
  db: Firestore,
  deedId: string,
  cvConfidence: number | null,
  reason: string | null,
): Promise<void> {
  await db.collection("deeds").doc(deedId).update({
    status: "rejected",
    validatedAt: Date.now(),
    cvConfidence,
    rejectionReason: reason,
  });
}

// AI never awards points directly — even a confident "looks legit" verdict
// only becomes a *recommendation* an admin must confirm. This is the only
// path into "review" now, so every deed with points on the line gets a human
// sign-off before anything is credited. suggestedPoints is written onto
// pointsAwarded so the existing admin Approve button awards exactly that.
export async function flagForReview(
  db: Firestore,
  deedId: string,
  cvConfidence: number | null,
  reason: string | null,
  aiRecommendation: "approve" | "reject" | null = null,
  suggestedPoints: number | null = null,
): Promise<void> {
  const update: Record<string, unknown> = {
    status: "review",
    cvConfidence,
    rejectionReason: reason,
    aiRecommendation,
  };
  if (suggestedPoints != null) update.pointsAwarded = suggestedPoints;
  await db.collection("deeds").doc(deedId).update(update);
}
