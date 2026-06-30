import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { isAdminEmail } from "@/lib/admin-auth";
import { sendOtpEmail } from "@/lib/mailer";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email: string = (body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = adminDb();
  const ref = db.collection("adminOtps").doc(email);
  const snap = await ref.get();

  if (snap.exists) {
    const data = snap.data()!;
    if (!data.used && data.expiresAt > Date.now()) {
      const retryAfter = Math.ceil((data.expiresAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "rate_limited", retryAfter },
        { status: 429 }
      );
    }
  }

  const otp = String(randomInt(100000, 999999));

  await ref.set({
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    used: false,
  });

  await sendOtpEmail(email, otp);

  return NextResponse.json({ ok: true });
}
