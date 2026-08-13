import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { checkLoginLockout, recordLoginFailure, recordLoginSuccess } from "@/lib/rate-limit";

// Email/password sign-in is proxied through this route (instead of the client
// calling Identity Toolkit directly) so failed attempts can be locked out
// server-side — a client-only counter would just get cleared with
// localStorage. On success we mint a custom token; the client finishes the
// sign-in with signInWithCustomToken.
export async function POST(req: NextRequest) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const emailKey = email.trim().toLowerCase();

  const lock = await checkLoginLockout(emailKey);
  if (lock.locked) {
    return NextResponse.json(
      { error: "locked", retryAfterSeconds: lock.retryAfterSeconds },
      { status: 429 },
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const idpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailKey, password, returnSecureToken: true }),
    },
  );
  const idpData = await idpRes.json().catch(() => ({}));

  if (!idpRes.ok) {
    const result = await recordLoginFailure(emailKey);
    return NextResponse.json(
      {
        error: idpData.error?.message ?? "sign_in_failed",
        locked: result.locked,
        retryAfterSeconds: result.retryAfterSeconds,
        attemptsRemaining: result.attemptsRemaining,
      },
      { status: result.locked ? 429 : 401 },
    );
  }

  await recordLoginSuccess(emailKey);
  const customToken = await adminAuth().createCustomToken(idpData.localId);
  return NextResponse.json({ customToken });
}
