import { adminDb } from "@/lib/firebase-admin";

// Server-only abuse guards, backed by Firestore (Admin SDK bypasses security
// rules, and no client ever needs to read these docs — there's no rule to
// add). Two independent guards live here:
//  - registration: caps how many accounts a single IP can create per hour,
//    to slow down scripted mass account creation.
//  - login: locks out an email after 3 consecutive failed attempts, with an
//    escalating cooldown, to slow down password brute-forcing.

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_PER_IP = 5;

const LOGIN_MAX_FAILURES = 3;
const LOGIN_BASE_LOCKOUT_MS = 60 * 1000;
const LOGIN_MAX_LOCKOUT_MS = 15 * 60 * 1000;

export async function checkRegisterRateLimit(
  ip: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const db = adminDb();
  const ref = db.collection("_rateLimits").doc(`register_${ip}`);

  return db.runTransaction(async (tx) => {
    const now = Date.now();
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as { count: number; windowStart: number }) : null;

    if (!data || now - data.windowStart > REGISTER_WINDOW_MS) {
      tx.set(ref, { count: 1, windowStart: now });
      return { allowed: true };
    }
    if (data.count >= REGISTER_MAX_PER_IP) {
      const retryAfterSeconds = Math.ceil((data.windowStart + REGISTER_WINDOW_MS - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }
    tx.update(ref, { count: data.count + 1 });
    return { allowed: true };
  });
}

type LoginGuardDoc = { failCount: number; lockUntil: number | null; lockCount: number };

export async function checkLoginLockout(
  emailKey: string,
): Promise<{ locked: boolean; retryAfterSeconds?: number }> {
  const db = adminDb();
  const snap = await db.collection("_rateLimits").doc(`login_${emailKey}`).get();
  if (!snap.exists) return { locked: false };

  const data = snap.data() as LoginGuardDoc;
  const now = Date.now();
  if (data.lockUntil && data.lockUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((data.lockUntil - now) / 1000) };
  }
  return { locked: false };
}

export async function recordLoginFailure(
  emailKey: string,
): Promise<{ locked: boolean; retryAfterSeconds?: number; attemptsRemaining?: number }> {
  const db = adminDb();
  const ref = db.collection("_rateLimits").doc(`login_${emailKey}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? (snap.data() as LoginGuardDoc) : null;
    const failCount = (prev?.failCount ?? 0) + 1;

    if (failCount >= LOGIN_MAX_FAILURES) {
      const lockCount = (prev?.lockCount ?? 0) + 1;
      const lockUntil =
        Date.now() + Math.min(LOGIN_BASE_LOCKOUT_MS * 2 ** (lockCount - 1), LOGIN_MAX_LOCKOUT_MS);
      tx.set(ref, { failCount: 0, lockUntil, lockCount });
      return { locked: true, retryAfterSeconds: Math.ceil((lockUntil - Date.now()) / 1000) };
    }

    tx.set(ref, { failCount, lockUntil: null, lockCount: prev?.lockCount ?? 0 });
    return { locked: false, attemptsRemaining: LOGIN_MAX_FAILURES - failCount };
  });
}

export async function recordLoginSuccess(emailKey: string): Promise<void> {
  await adminDb().collection("_rateLimits").doc(`login_${emailKey}`).delete().catch(() => {});
}
