import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { checkRegisterRateLimit } from "@/lib/rate-limit";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Account creation is proxied through this route (instead of the client
// calling Identity Toolkit directly) so we can cap signups per IP —
// slows down scripted mass account creation. On success we mint a custom
// token; the client finishes the sign-in with signInWithCustomToken.
export async function POST(req: NextRequest) {
  const { email, password, name } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const ip = clientIp(req);
  const limit = await checkRegisterRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 },
    );
  }

  try {
    const user = await adminAuth().createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: name || undefined,
    });
    const customToken = await adminAuth().createCustomToken(user.uid);
    return NextResponse.json({ customToken });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      return NextResponse.json({ error: "email_in_use" }, { status: 409 });
    }
    if (code === "auth/invalid-password" || code === "auth/invalid-email") {
      return NextResponse.json({ error: code.replace("auth/", "") }, { status: 400 });
    }
    console.error("[register] unexpected error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}
