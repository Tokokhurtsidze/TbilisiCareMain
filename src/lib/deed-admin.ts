import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { LEVELS, TASK_TYPES, type Locale, type Localized, type TaskTypeId } from "@/types";
import { computeStreak, isoWeekId, weekStartMs, STREAK_MILESTONES } from "@/lib/week";

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

// Mirrors src/locales/{ka,en,ru}.json's "level.*" strings — hand-written here
// too since this runs server-side (Admin SDK) with no i18n context available.
const LEVEL_TITLES: Record<string, Localized> = {
  "level.bystander": L("უბრალო მაცქერალი", "Innocent Bystander", "Невинный наблюдатель"),
  "level.neighbor": L("გაღვიძებული მეზობელი", "Awakened Neighbor", "Пробуждённый сосед"),
  "level.active": L("აქტიური მოქალაქე", "Active Citizen", "Активный гражданин"),
  "level.pillar": L("საზოგადოების საყრდენი", "Community Pillar", "Опора сообщества"),
  "level.hero": L("უბნის გმირი", "District Hero", "Герой района"),
  "level.guardian": L("თბილისის მცველი", "Guardian of Tbilisi", "Хранитель Тбилиси"),
};

// Round-number CarePoints thresholds worth celebrating on their own, distinct
// from the level thresholds (a citizen can cross one of these mid-level).
const POINT_MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

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

  const streak = computeStreak(
    userData.lastDeedDate ?? null,
    userData.currentStreak ?? 0,
    userData.longestStreak ?? 0,
  );
  const milestoneBonus = streak.isNewDay ? (STREAK_MILESTONES[streak.currentStreak] ?? 0) : 0;
  const challengeBonus = await weeklyChallengeBonus(db, userId, deed.taskTypeId as TaskTypeId);
  const bonus = milestoneBonus + challengeBonus;

  const oldPoints = userData.carePoints ?? 0;
  const oldLevel = userData.level ?? 1;
  const newPoints = oldPoints + points + bonus;
  const newLevel =
    [...LEVELS].reverse().find((l) => newPoints >= l.threshold)?.level ?? 1;

  const crossedPointMilestone = POINT_MILESTONES.filter((m) => oldPoints < m && newPoints >= m).at(-1) ?? null;
  const leveledUp = newLevel > oldLevel;

  const tasks: Promise<unknown>[] = [
    deedRef.update({
      status: "approved",
      validatedAt: Date.now(),
      cvConfidence,
      pointsAwarded: points,
      rejectionReason: null,
    }),
    userRef.update({
      carePoints: FieldValue.increment(points + bonus),
      level: newLevel,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastDeedDate: streak.lastDeedDate,
    }),
    // Real, live counters for the landing page — replaces made-up marketing
    // numbers with actual usage as soon as there is any.
    db.doc("stats/global").set(
      { totalPoints: FieldValue.increment(points + bonus), approvedDeeds: FieldValue.increment(1) },
      { merge: true },
    ),
  ];

  // Citizens can opt out of the public spotlight (profile setting) — points
  // are unaffected either way, only the public photo/name post is skipped.
  if (userData.consentSpotlight !== false) {
    tasks.push(createSpotlightPost(db, deedId, deed, points, deed.taskTypeId as TaskTypeId));

    // Level-up and round-number CarePoints milestones both get their own
    // celebration post — real, server-computed numbers, never fabricated.
    if (leveledUp || crossedPointMilestone) {
      tasks.push(createMilestonePost(db, deedId, deed, newPoints, newLevel, leveledUp, crossedPointMilestone));
    }
  }

  await Promise.all(tasks);
}

// Checks the current ISO week's admin-authored challenge (if any) against
// this task type, and awards its bonus the moment the user's approved count
// for that type this week reaches the target — once per user per week.
// Counting the not-yet-committed current deed as +1 (rather than awaiting
// deedRef.update first) keeps this on the same read-then-write shape as the
// rest of approveDeed, no extra round trip needed.
async function weeklyChallengeBonus(
  db: Firestore,
  userId: string,
  taskTypeId: TaskTypeId | undefined,
): Promise<number> {
  if (!taskTypeId) return 0;
  const week = isoWeekId();
  const challengeRef = db.collection("weeklyChallenges").doc(week);
  const challengeSnap = await challengeRef.get();
  if (!challengeSnap.exists) return 0;
  const challenge = challengeSnap.data() ?? {};
  if (challenge.taskTypeId !== taskTypeId) return 0;

  const completionRef = challengeRef.collection("completions").doc(userId);
  const completionSnap = await completionRef.get();
  if (completionSnap.exists) return 0; // already awarded this week

  const priorCount = (
    await db
      .collection("deeds")
      .where("userId", "==", userId)
      .where("taskTypeId", "==", taskTypeId)
      .where("status", "==", "approved")
      .where("createdAt", ">=", Timestamp.fromMillis(weekStartMs()))
      .count()
      .get()
  ).data().count;
  const countIncludingThisOne = priorCount + 1;

  const targetCount = (challenge.targetCount as number) ?? Infinity;
  if (countIncludingThisOne < targetCount) return 0;

  const bonusPoints = (challenge.bonusPoints as number) ?? 0;
  await completionRef.set({ awardedAt: Date.now(), bonusPoints });
  return bonusPoints;
}

// Every approved deed — AI or human-approved — gets an AI-authored spotlight
// post featuring the citizen's photo, so good-deed-doers are surfaced on the
// main feed the same way regardless of who validated them.
async function createSpotlightPost(
  db: Firestore,
  deedId: string,
  deed: Record<string, unknown>,
  points: number,
  taskTypeId: TaskTypeId | undefined,
): Promise<void> {
  const taskLabel = TASK_LABELS[deed.taskTypeId as string] ?? L("კარგი საქმე", "a good deed", "доброе дело");
  const authorName = (deed.authorName as string) || "A citizen";
  const locales: Locale[] = ["ka", "en", "ru"];

  // Effort at (or above) the top of its task type's range is called out with
  // stronger copy — same real pointsAwarded number either way, no fabrication.
  const task = TASK_TYPES.find((t) => t.id === taskTypeId);
  const isExceptional = !!task && points >= task.maxPoints;

  const title: Localized = { ka: "", en: "", ru: "" };
  const body: Localized = { ka: "", en: "", ru: "" };
  for (const l of locales) {
    title[l] = isExceptional
      ? (l === "ka" ? `${authorName}-მ საოცარი საქმე გააკეთა 🌟`
        : l === "ru" ? `${authorName} совершил(а) нечто потрясающее 🌟`
        : `${authorName} did something amazing 🌟`)
      : (l === "ka" ? `${authorName}-მ ახლახან დაეხმარა თბილისს 🌟`
        : l === "ru" ? `${authorName} только что помог(ла) Тбилиси 🌟`
        : `${authorName} just helped Tbilisi 🌟`);
    body[l] = isExceptional
      ? (l === "ka" ? `გამორჩეული ძალისხმევა: ${authorName} შეასრულა ${taskLabel.ka} ყველაზე მაღალი შედეგით. AI-ს დადასტურებული მტკიცებულება, +${points} CarePoints მიღებულია.`
        : l === "ru" ? `Выдающееся усилие: ${authorName} выполнил(а) ${taskLabel.ru} с максимальным результатом. Доказательство проверено AI, начислено +${points} CarePoints.`
        : `Outstanding effort: ${authorName} completed ${taskLabel.en} at the top of its range. AI-checked proof, +${points} CarePoints awarded.`)
      : (l === "ka" ? `დადასტურებულია: ${authorName} შეასრულა ${taskLabel.ka}. AI-ს დადასტურებული მტკიცებულება, +${points} CarePoints მიღებულია.`
        : l === "ru" ? `Подтверждено: ${authorName} выполнил(а) ${taskLabel.ru}. Доказательство проверено AI, начислено +${points} CarePoints.`
        : `Verified: ${authorName} completed ${taskLabel.en}. AI-checked proof, +${points} CarePoints awarded.`);
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

// Level-ups and round-number CarePoints thresholds each get their own
// milestone post — separate from the per-deed spotlight above, since these
// celebrate the citizen's cumulative standing, not just this one submission.
async function createMilestonePost(
  db: Firestore,
  deedId: string,
  deed: Record<string, unknown>,
  totalPoints: number,
  newLevel: number,
  leveledUp: boolean,
  crossedPointMilestone: number | null,
): Promise<void> {
  const authorName = (deed.authorName as string) || "A citizen";
  const levelKey = LEVELS.find((l) => l.level === newLevel)?.key ?? "level.bystander";
  const levelTitle = LEVEL_TITLES[levelKey] ?? LEVEL_TITLES["level.bystander"];
  const locales: Locale[] = ["ka", "en", "ru"];

  const title: Localized = { ka: "", en: "", ru: "" };
  const body: Localized = { ka: "", en: "", ru: "" };
  for (const l of locales) {
    title[l] = leveledUp
      ? (l === "ka" ? `${authorName}-მ ახალ დონეს მიაღწია 🏆`
        : l === "ru" ? `${authorName} достиг(ла) нового уровня 🏆`
        : `${authorName} reached a new level 🏆`)
      : (l === "ka" ? `${authorName}-მ ახალ ნიშნულს მიაღწია 🏆`
        : l === "ru" ? `${authorName} достиг(ла) новой отметки 🏆`
        : `${authorName} hit a new milestone 🏆`);

    const levelPart = leveledUp
      ? (l === "ka" ? `ახლა არის „${levelTitle.ka}“ (დონე ${newLevel}). `
        : l === "ru" ? `Теперь на уровне «${levelTitle.ru}» (уровень ${newLevel}). `
        : `Now at "${levelTitle.en}" (level ${newLevel}). `)
      : "";
    const pointsPart = crossedPointMilestone
      ? (l === "ka" ? `${crossedPointMilestone.toLocaleString()}+ CarePoints გადალახა!`
        : l === "ru" ? `Преодолел(а) отметку в ${crossedPointMilestone.toLocaleString()}+ CarePoints!`
        : `Crossed ${crossedPointMilestone.toLocaleString()}+ CarePoints!`)
      : (l === "ka" ? `სულ ${totalPoints.toLocaleString()} CarePoints.`
        : l === "ru" ? `Всего ${totalPoints.toLocaleString()} CarePoints.`
        : `${totalPoints.toLocaleString()} CarePoints total.`);
    body[l] = `${levelPart}${pointsPart}`;
  }

  await db.collection("officialPosts").add({
    tag: "milestone",
    title,
    body,
    imageUrl: null,
    authorName,
    authorPhotoURL: (deed.authorPhotoURL as string) ?? null,
    stats: [{ label: L("სულ ქულა", "Total CarePoints", "Всего баллов"), value: totalPoints.toLocaleString() }],
    ctaLabel: L("ლიდერბორდის ნახვა", "See Leaderboard", "Смотреть рейтинг"),
    ctaHref: "/app/leaderboard",
    source: "ai",
    createdAt: Date.now(),
  });
}

export async function rejectDeed(
  db: Firestore,
  deedId: string,
  cvConfidence: number | null,
  reason: string | null,
  taskTypeId?: TaskTypeId | null,
): Promise<void> {
  const update: Record<string, unknown> = {
    status: "rejected",
    validatedAt: Date.now(),
    cvConfidence,
    rejectionReason: reason,
  };
  if (taskTypeId !== undefined) update.taskTypeId = taskTypeId;
  await db.collection("deeds").doc(deedId).update(update);
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
  taskTypeId?: TaskTypeId | null,
): Promise<void> {
  const update: Record<string, unknown> = {
    status: "review",
    cvConfidence,
    rejectionReason: reason,
    aiRecommendation,
  };
  if (suggestedPoints != null) update.pointsAwarded = suggestedPoints;
  if (taskTypeId !== undefined) update.taskTypeId = taskTypeId;
  await db.collection("deeds").doc(deedId).update(update);
}
