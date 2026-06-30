import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { LEVELS } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action: string = body.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const db = adminDb();
  const deedRef = db.collection("deeds").doc(params.id);
  const deedSnap = await deedRef.get();

  if (!deedSnap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const deed = deedSnap.data()!;

  if (action === "reject") {
    await deedRef.update({ status: "rejected" });
    return NextResponse.json({ ok: true });
  }

  // approve
  const userRef = db.collection("users").doc(deed.userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const userData = userSnap.data()!;
  const newPoints = (userData.carePoints ?? 0) + (deed.pointsAwarded ?? 0);
  const newLevel =
    [...LEVELS].reverse().find((l) => newPoints >= l.threshold)?.level ?? 1;

  await Promise.all([
    deedRef.update({ status: "approved", validatedAt: Date.now() }),
    userRef.update({
      carePoints: FieldValue.increment(deed.pointsAwarded ?? 0),
      level: newLevel,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
