import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signAdminToken, isAdminEmail } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

const COOKIE_NAME = "admin_token";
const EIGHT_HOURS_SECONDS = 8 * 60 * 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email: string = (body.email ?? "").trim().toLowerCase();
  const otp: string = (body.otp ?? "").trim();

  if (!email || !otp) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = adminDb();
  const ref = db.collection("adminOtps").doc(email);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = snap.data()!;

  if (data.used) {
    return NextResponse.json({ error: "otp_already_used" }, { status: 400 });
  }

  if (data.expiresAt < Date.now()) {
    return NextResponse.json({ error: "otp_expired" }, { status: 400 });
  }

  const expected = Buffer.from(String(data.otp), "utf8");
  const provided = Buffer.from(otp, "utf8");
  const match =
    expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!match) {
    return NextResponse.json({ error: "invalid_otp" }, { status: 401 });
  }

  await ref.update({ used: true });

  const token = await signAdminToken(email);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: EIGHT_HOURS_SECONDS,
    path: "/",
  });

  return res;
}
