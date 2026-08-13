import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { rejectDeed, flagForReview } from "@/lib/deed-admin";
import { TASK_TYPES, type TaskTypeId } from "@/types";

// Vision model used to grade proof photos. Configurable so it can be swapped
// without a redeploy if OpenRouter deprecates a model.
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || "openai/gpt-4o-mini";

// AI can auto-REJECT confident fraud (no points at stake, just blocking junk
// fast) but can never auto-AWARD points — every "looks legit" verdict is only
// a recommendation an admin must confirm before anything is credited. This is
// the strict, no-auto-trust-the-AI policy: getting points always needs a human.
const REJECT_THRESHOLD = 0.6;

const DEFAULT_REVIEW_POINTS = 10;

// The citizen no longer declares a category — the model both classifies which
// known task type the before/after pair matches and scores it inside that
// type's point range, in one call.
type Verdict = {
  verdict: "approve" | "reject" | "review";
  confidence: number;
  reason: string;
  points: number;
  taskTypeId: TaskTypeId | null;
};

type DeedRecord = {
  userId: string;
  status: string;
  proofUrl: string | null;
  proofBeforeUrl: string | null;
};

export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { deedId } = (await req.json().catch(() => ({}))) as { deedId?: string };
  if (!deedId) {
    return NextResponse.json({ error: "missing_deedId" }, { status: 400 });
  }

  const db = adminDb();
  const deedRef = db.collection("deeds").doc(deedId);
  const snap = await deedRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const deed = snap.data() as DeedRecord;
  if (deed.userId !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (deed.status !== "pending") {
    // Already decided (e.g. retried request) — return the existing outcome
    // instead of re-running the model and double-crediting points.
    return NextResponse.json({ status: deed.status });
  }

  if (!deed.proofUrl || !deed.proofBeforeUrl) {
    await rejectDeed(db, deedId, 0, "missing_proof");
    return NextResponse.json({ status: "rejected", reason: "missing_proof" });
  }

  let verdict: Verdict;
  try {
    verdict = await runVisionCheck(deed);
  } catch {
    // Model call failed or returned junk — always fall back to a human
    // moderator instead of guessing.
    await flagForReview(db, deedId, null, "ai_unavailable", null, DEFAULT_REVIEW_POINTS, null);
    return NextResponse.json({ status: "review", reason: "ai_unavailable" });
  }

  if (verdict.verdict === "reject" && verdict.confidence >= REJECT_THRESHOLD) {
    await rejectDeed(db, deedId, verdict.confidence, verdict.reason, verdict.taskTypeId);
    return NextResponse.json({
      status: "rejected",
      confidence: verdict.confidence,
      reason: verdict.reason,
    });
  }

  // Everything else — including a confident "approve" — only ever becomes a
  // recommendation. An admin has to confirm it in the review queue before the
  // citizen actually gets any points; the AI cannot award points on its own.
  const recommendation = verdict.verdict === "reject" ? "reject" : "approve";
  await flagForReview(db, deedId, verdict.confidence, verdict.reason, recommendation, verdict.points, verdict.taskTypeId);
  return NextResponse.json({
    status: "review",
    confidence: verdict.confidence,
    reason: verdict.reason,
    aiRecommendation: recommendation,
    suggestedPoints: verdict.points,
  });
}

async function runVisionCheck(deed: DeedRecord): Promise<Verdict> {
  const images = [
    { type: "image_url", image_url: { url: deed.proofBeforeUrl } },
    { type: "image_url", image_url: { url: deed.proofUrl } },
  ];

  const categoryList = TASK_TYPES.map(
    (t) => `- "${t.id}": ${t.minPoints}-${t.maxPoints} points`,
  ).join("\n");
  const validIds = TASK_TYPES.map((t) => `"${t.id}"`).join(" | ");

  const prompt = `You are a strict fraud-detection reviewer for a civic good-deeds app. The FIRST image is claimed to be BEFORE the deed, the SECOND is AFTER. The citizen did not declare a category — you must classify it yourself into whichever of these best matches what the photos show:
${categoryList}
Check: (1) both images show the same real physical location, (2) there is a genuine visible improvement/action consistent with the category you pick, (3) neither image looks staged, stock, screenshotted, or AI-generated. Default to "review" if you are not confident either way. If the proof looks legitimate, also assess how much real effort/scale is visible and pick an integer "points" inside the chosen category's range (low end = minimal token effort, high end = substantial, clearly time-consuming effort). If you would reject, set "points" to 0 and pick your best-guess category anyway. Reply with ONLY strict JSON, no markdown: {"verdict":"approve"|"reject"|"review","taskTypeId":${validIds},"confidence":0-1,"points":integer,"reason":"short reason"}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://tbilisicare.ge",
      "X-Title": "TbilisiCare",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...images] }],
    }),
  });

  if (!res.ok) throw new Error(`vision model http ${res.status}`);

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json in vision response");

  const parsed = JSON.parse(match[0]);
  const confidence =
    typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
  const verdict: Verdict["verdict"] = ["approve", "reject", "review"].includes(parsed.verdict)
    ? parsed.verdict
    : "review";
  const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 300) : "unspecified";

  const task = TASK_TYPES.find((t) => t.id === parsed.taskTypeId) ?? null;
  const taskTypeId: TaskTypeId | null = task?.id ?? null;

  const points =
    verdict === "reject" || !task
      ? 0
      : typeof parsed.points === "number"
        ? Math.max(task.minPoints, Math.min(task.maxPoints, Math.round(parsed.points)))
        : Math.round((task.minPoints + task.maxPoints) / 2);

  return { verdict, confidence, reason, points, taskTypeId };
}
