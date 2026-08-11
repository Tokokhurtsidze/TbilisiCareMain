import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { TASK_TYPES, type TaskTypeId } from "@/types";

const VALID_TASK_TYPES = TASK_TYPES.map((t) => t.id);

// Doc id is the ISO week ("2026-W03") — one challenge per week, same
// hand-authored trust boundary as officialPosts (Admin SDK only, never
// client-writable — see firestore.rules).
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const week = typeof body.week === "string" ? body.week.trim() : "";
  const taskTypeId = body.taskTypeId as TaskTypeId;
  const targetCount = Number(body.targetCount);
  const bonusPoints = Number(body.bonusPoints);

  if (!/^\d{4}-W\d{2}$/.test(week)) {
    return NextResponse.json({ error: "invalid_week" }, { status: 400 });
  }
  if (!VALID_TASK_TYPES.includes(taskTypeId)) {
    return NextResponse.json({ error: "invalid_task_type" }, { status: 400 });
  }
  if (!Number.isInteger(targetCount) || targetCount < 1) {
    return NextResponse.json({ error: "invalid_target_count" }, { status: 400 });
  }
  if (!Number.isInteger(bonusPoints) || bonusPoints < 0) {
    return NextResponse.json({ error: "invalid_bonus_points" }, { status: 400 });
  }

  await adminDb().collection("weeklyChallenges").doc(week).set({
    taskTypeId,
    targetCount,
    bonusPoints,
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true, id: week });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { week } = await req.json().catch(() => ({}));
  if (!week) return NextResponse.json({ error: "missing_week" }, { status: 400 });

  await adminDb().collection("weeklyChallenges").doc(week).delete();
  return NextResponse.json({ ok: true });
}
