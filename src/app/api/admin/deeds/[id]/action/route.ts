import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { approveDeed, rejectDeed } from "@/lib/deed-admin";

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
    await rejectDeed(db, params.id, deed.cvConfidence ?? null, "manual_reject");
    return NextResponse.json({ ok: true });
  }

  try {
    await approveDeed(db, params.id, deed.userId, deed.pointsAwarded ?? 0, deed.cvConfidence ?? null);
  } catch (e) {
    if ((e as Error).message === "user_not_found") {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
