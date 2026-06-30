# Admin Panel + Email OTP Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-less admin panel secured by 6-digit email OTP (Gmail/nodemailer), with deed moderation and a read-only user list.

**Architecture:** API routes generate/verify OTPs stored in Firestore `adminOtps/{email}`. Successful verification issues a signed JWT in an HTTP-only cookie. Next.js middleware guards all `/admin/*` routes server-side. Admin pages are Server Components; only interactive elements are Client Components.

**Tech Stack:** nodemailer (Gmail SMTP), jose (JWT sign/verify), Firebase Admin SDK (Firestore), Next.js 14 App Router, TypeScript

## Global Constraints

- Next.js 14.2.15 — `cookies()` is synchronous (no `await`); `searchParams` in pages is synchronous
- `firebase-admin` server-only — never import in Client Components (`"use client"`)
- Admin panel is English-only — no i18n
- OTP: 6-digit, `crypto.randomInt(100000, 999999)`, 10-minute expiry, single-use
- JWT: HS256, 8-hour expiry, cookie name `admin_token`, httpOnly, SameSite=strict
- Admin whitelist: `ADMIN_EMAILS` env var, comma-separated, case-insensitive
- Path alias `@/*` maps to `./src/*`

---

### Task 1: Install Dependencies + Env Vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`
- Modify: `.env.local.example`

**Interfaces:**
- Produces: `nodemailer` and `jose` available as imports in all subsequent tasks

- [ ] **Step 1: Install packages**

```bash
npm install nodemailer jose
npm install --save-dev @types/nodemailer
```

Expected: packages added, package.json updated.

- [ ] **Step 2: Generate ADMIN_JWT_SECRET**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output — this is your secret.

- [ ] **Step 3: Add env vars to .env.local**

Append to `.env.local`:
```env
# --- Admin Panel ---
ADMIN_EMAILS=khurtsidzetoko@gmail.com
ADMIN_JWT_SECRET=<paste generated secret here>
```

- [ ] **Step 4: Add placeholders to .env.local.example**

Append to `.env.local.example`:
```env
# --- Admin Panel ---
ADMIN_EMAILS=
ADMIN_JWT_SECRET=
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run typecheck
```

Expected: passes (or only pre-existing errors, none new).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.local.example
git commit -m "chore: install nodemailer and jose for admin OTP auth"
```

---

### Task 2: Core Utilities — mailer.ts + admin-auth.ts

**Files:**
- Create: `src/lib/mailer.ts`
- Create: `src/lib/admin-auth.ts`

**Interfaces:**
- Produces:
  - `sendOtpEmail(to: string, otp: string): Promise<void>`
  - `isAdminEmail(email: string): boolean`
  - `signAdminToken(email: string): Promise<string>`
  - `verifyAdminToken(token: string): Promise<{ email: string; role: string } | null>`
  - `getAdminSession(): Promise<{ email: string; role: string } | null>`

- [ ] **Step 1: Create src/lib/mailer.ts**

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"TbilisiCare Admin" <${process.env.GMAIL_USER}>`,
    to,
    subject: "TbilisiCare Admin — Your Login Code",
    text: `Your admin login code is: ${otp}\n\nExpires in 10 minutes. Do not share this code.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#1a1a2e">TbilisiCare Admin Login</h2>
        <p>Your one-time login code:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563eb;padding:16px 0">
          ${otp}
        </div>
        <p style="color:#666;font-size:14px">Expires in 10 minutes. Do not share this code.</p>
      </div>
    `,
  });
}
```

- [ ] **Step 2: Create src/lib/admin-auth.ts**

```typescript
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";
const JWT_ALG = "HS256";
const JWT_EXPIRY = "8h";

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s) throw new Error("ADMIN_JWT_SECRET not set");
  return new TextEncoder().encode(s);
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function signAdminToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<{ email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { email: string; role: string };
  } catch {
    return null;
  }
}

// For use in Server Components and Route Handlers (Node.js runtime only).
// Do NOT call from middleware — middleware cannot use next/headers.
export async function getAdminSession(): Promise<{
  email: string;
  role: string;
} | null> {
  const cookieStore = cookies(); // synchronous in Next.js 14
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
```

- [ ] **Step 3: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mailer.ts src/lib/admin-auth.ts
git commit -m "feat(admin): add mailer and admin-auth utility modules"
```

---

### Task 3: Next.js Middleware — /admin/* Guard

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `jose` directly (cannot use `src/lib/admin-auth.ts` — that file imports `next/headers` which is unavailable in Edge middleware)
- Produces: all `/admin/*` requests except `/admin/login` are gated by JWT cookie check; invalid/missing cookie → redirect to `/admin/login`

- [ ] **Step 1: Create src/middleware.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/admin/:path*"],
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? "");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Manual test — unauthenticated redirect**

Start dev server: `npm run dev`

Navigate to `http://localhost:3000/admin` in browser without a cookie → confirm redirect to `/admin/login`.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(admin): add middleware guard for /admin/* routes"
```

---

### Task 4: API — POST /api/admin/send-otp

**Files:**
- Create: `src/app/api/admin/send-otp/route.ts`

**Interfaces:**
- Consumes: `isAdminEmail(email)` from `@/lib/admin-auth`, `sendOtpEmail(to, otp)` from `@/lib/mailer`, `adminDb()` from `@/lib/firebase-admin`
- Produces:
  - `POST /api/admin/send-otp` body `{ email }`
  - → `200 { ok: true }` on success
  - → `400 { error: "missing_email" }` if no email
  - → `403 { error: "forbidden" }` if not in ADMIN_EMAILS
  - → `429 { error: "rate_limited", retryAfter: <seconds> }` if un-expired OTP exists

- [ ] **Step 1: Create route**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Manual test**

```bash
# Non-admin email → 403
curl -s -X POST http://localhost:3000/api/admin/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"random@example.com"}'
# Expected: {"error":"forbidden"}

# Admin email → 200 + email arrives in inbox
curl -s -X POST http://localhost:3000/api/admin/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"khurtsidzetoko@gmail.com"}'
# Expected: {"ok":true}

# Call again immediately → 429
curl -s -X POST http://localhost:3000/api/admin/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"khurtsidzetoko@gmail.com"}'
# Expected: {"error":"rate_limited","retryAfter":<N>}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/send-otp/route.ts
git commit -m "feat(admin): add send-otp API route with rate limiting"
```

---

### Task 5: API — POST /api/admin/verify-otp

**Files:**
- Create: `src/app/api/admin/verify-otp/route.ts`

**Interfaces:**
- Consumes: `signAdminToken(email)` and `isAdminEmail(email)` from `@/lib/admin-auth`, `adminDb()` from `@/lib/firebase-admin`
- Produces:
  - `POST /api/admin/verify-otp` body `{ email, otp }`
  - → `200 { ok: true }` + sets `admin_token` HTTP-only cookie on success
  - → `400 { error: "otp_expired" | "otp_already_used" | "missing_fields" }`
  - → `401 { error: "invalid_otp" }`
  - → `403 { error: "forbidden" }`
  - → `404 { error: "not_found" }` if no OTP doc exists

- [ ] **Step 1: Create route**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Manual test**

Use the OTP from Task 4's test (check inbox):

```bash
# Correct OTP → 200 + Set-Cookie header visible in -v output
curl -s -v -X POST http://localhost:3000/api/admin/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"khurtsidzetoko@gmail.com","otp":"REPLACE_WITH_OTP"}'
# Expected: {"ok":true} and Set-Cookie: admin_token=...

# Same OTP again → 400 already used
curl -s -X POST http://localhost:3000/api/admin/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"khurtsidzetoko@gmail.com","otp":"REPLACE_WITH_OTP"}'
# Expected: {"error":"otp_already_used"}

# Wrong OTP → 401
curl -s -X POST http://localhost:3000/api/admin/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"khurtsidzetoko@gmail.com","otp":"000000"}'
# Expected: {"error":"invalid_otp"}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/verify-otp/route.ts
git commit -m "feat(admin): add verify-otp route with JWT cookie issuance"
```

---

### Task 6: API — Logout + Deed Action Routes

**Files:**
- Create: `src/app/api/admin/logout/route.ts`
- Create: `src/app/api/admin/deeds/[id]/action/route.ts`

**Interfaces:**
- Consumes: `getAdminSession()` from `@/lib/admin-auth`, `adminDb()` from `@/lib/firebase-admin`, `LEVELS` from `@/types`
- Produces:
  - `POST /api/admin/logout` → clears `admin_token` cookie, `200 { ok: true }`
  - `POST /api/admin/deeds/[id]/action` body `{ action: "approve" | "reject" }`
    - approve: sets `deeds/{id}.status = "approved"`, increments `users/{uid}.carePoints`, recalculates level
    - reject: sets `deeds/{id}.status = "rejected"`

- [ ] **Step 1: Create src/app/api/admin/logout/route.ts**

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return res;
}
```

- [ ] **Step 2: Create src/app/api/admin/deeds/[id]/action/route.ts**

```typescript
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
```

- [ ] **Step 3: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/logout/route.ts src/app/api/admin/deeds/[id]/action/route.ts
git commit -m "feat(admin): add logout and deed approve/reject API routes"
```

---

### Task 7: Admin Login Page

**Files:**
- Create: `src/app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/send-otp`, `POST /api/admin/verify-otp`
- Produces: Two-step OTP login UI (email → OTP), redirects to `/admin` on success

- [ ] **Step 1: Create src/app/admin/login/page.tsx**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const t = setInterval(() => setRetryAfter((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [retryAfter]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setRetryAfter(data.retryAfter ?? 60);
          setError(`OTP already sent. Retry in ${data.retryAfter}s.`);
        } else if (res.status === 403) {
          setError("Email not authorized as admin.");
        } else {
          setError("Failed to send OTP. Try again.");
        }
        return;
      }
      setStep("otp");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          invalid_otp: "Wrong code. Check your email.",
          otp_expired: "Code expired. Request a new one.",
          otp_already_used: "Code already used. Request a new one.",
        };
        setError(msgs[data.error] ?? "Verification failed.");
        return;
      }
      router.push("/admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-white text-2xl font-bold mb-1">Admin Login</h1>
        <p className="text-gray-400 text-sm mb-8">TbilisiCare Admin Panel</p>

        {step === "email" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">
                Admin email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !email}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition-colors"
            >
              {busy ? "Sending…" : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-gray-400 text-sm">
              Code sent to <span className="text-white">{email}</span>
            </p>
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">
                6-digit code
              </label>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors tracking-[0.5em] text-xl text-center font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition-colors"
            >
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(null); }}
              disabled={retryAfter > 0}
              className="w-full text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-colors"
            >
              {retryAfter > 0 ? `Resend in ${retryAfter}s` : "Resend code"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Manual test in browser**

1. Go to `http://localhost:3000/admin` — confirm redirect to `/admin/login`
2. Enter `khurtsidzetoko@gmail.com` → Send Code → check Gmail inbox for OTP
3. Enter the OTP → Verify → confirm redirect to `/admin`
4. Test wrong OTP: request new code, enter `000000` → confirm "Wrong code" error
5. Test resend rate limit: request code, immediately try to request again → confirm countdown appears

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/login/page.tsx
git commit -m "feat(admin): add two-step OTP login page"
```

---

### Task 8: Admin Layout + Sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/logout`, `usePathname` from `next/navigation`
- Produces: Dark sidebar layout for all `/admin/*` pages; login page gets no sidebar (detected by pathname)

- [ ] **Step 1: Create src/app/admin/layout.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileCheck, Users, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/deeds", label: "Deeds", icon: FileCheck, exact: false },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Login page renders standalone — no sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <p className="text-white font-bold text-sm">TbilisiCare</p>
          <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Manual test in browser**

1. Go to `/admin` (logged in) — confirm dark sidebar visible, Dashboard link active
2. Click Deeds — confirm Deeds link becomes active
3. Go to `/admin/login` — confirm no sidebar (just the login card)
4. Click Logout — confirm cookie cleared, redirect to `/admin/login`

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat(admin): add dark sidebar admin layout"
```

---

### Task 9: Admin Dashboard Page

**Files:**
- Create: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `getAdminSession()` from `@/lib/admin-auth`, `adminDb()` from `@/lib/firebase-admin`
- Produces: Server Component showing pending deed count, total users count, total approved deeds count

- [ ] **Step 1: Create src/app/admin/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FileCheck, Users, Clock } from "lucide-react";

async function getStats() {
  const db = adminDb();
  const [pendingSnap, usersSnap, approvedSnap] = await Promise.all([
    db.collection("deeds").where("status", "==", "pending").count().get(),
    db.collection("users").count().get(),
    db.collection("deeds").where("status", "==", "approved").count().get(),
  ]);
  return {
    pending: pendingSnap.data().count,
    totalUsers: usersSnap.data().count,
    approved: approvedSnap.data().count,
  };
}

export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const stats = await getStats();

  const cards = [
    { label: "Pending Deeds", value: stats.pending, icon: Clock, color: "text-yellow-400" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Approved Deeds", value: stats.approved, icon: FileCheck, color: "text-green-400" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">
        Logged in as <span className="text-white">{session.email}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon size={20} className={color} />
              <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <p className="text-white text-4xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Manual test in browser**

Navigate to `http://localhost:3000/admin` — confirm three stat cards render with real Firestore counts.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): add dashboard with live Firestore stats"
```

---

### Task 10: Admin Deed Moderation Page

**Files:**
- Create: `src/app/admin/deeds/page.tsx`
- Create: `src/app/admin/deeds/DeedActions.tsx`

**Interfaces:**
- Consumes: `getAdminSession()` from `@/lib/admin-auth`, `adminDb()` from `@/lib/firebase-admin`, `POST /api/admin/deeds/[id]/action`
- Produces: Server Component deed list with Pending/Approved/Rejected filter tabs; Client Component approve/reject buttons that call the action API and refresh the page

- [ ] **Step 1: Create src/app/admin/deeds/DeedActions.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeedActions({ deedId }: { deedId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const act = async (action: "approve" | "reject") => {
    setBusy(true);
    try {
      await fetch(`/api/admin/deeds/${deedId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("approve")}
        disabled={busy}
        className="px-3 py-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
      >
        Approve
      </button>
      <button
        onClick={() => act("reject")}
        disabled={busy}
        className="px-3 py-1 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
      >
        Reject
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/admin/deeds/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { DeedActions } from "./DeedActions";

type FilterTab = "pending" | "approved" | "rejected";

async function getDeeds(filter: FilterTab) {
  const db = adminDb();
  const snap = await db
    .collection("deeds")
    .where("status", "==", filter)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default async function AdminDeedsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const filter = (["pending", "approved", "rejected"].includes(
    searchParams.filter ?? ""
  )
    ? searchParams.filter
    : "pending") as FilterTab;

  const deeds = await getDeeds(filter);
  const tabs: FilterTab[] = ["pending", "approved", "rejected"];

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">Deed Moderation</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <a
            key={tab}
            href={`/admin/deeds?filter=${tab}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </a>
        ))}
      </div>

      {deeds.length === 0 ? (
        <p className="text-gray-500">No {filter} deeds.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-4 py-3">Author</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Type</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Points</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Proof</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Date</th>
                {filter === "pending" && (
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(deeds as any[]).map((deed) => (
                <tr key={deed.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white">{deed.authorName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{deed.taskTypeId}</td>
                  <td className="px-4 py-3 text-gray-300">{deed.pointsAwarded}</td>
                  <td className="px-4 py-3">
                    {deed.proofUrl ? (
                      <a
                        href={deed.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {typeof deed.createdAt === "number"
                      ? new Date(deed.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  {filter === "pending" && (
                    <td className="px-4 py-3">
                      <DeedActions deedId={deed.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 4: Manual test in browser**

1. Go to `http://localhost:3000/admin/deeds` — confirm pending list renders
2. Click Approve on a deed → row disappears, check Firestore: `deeds/{id}.status = "approved"` and `users/{uid}.carePoints` incremented
3. Click Rejected tab — confirm rejected deeds appear, no action buttons
4. Click Reject on a pending deed → row disappears, check Firestore: `deeds/{id}.status = "rejected"`

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/deeds/page.tsx src/app/admin/deeds/DeedActions.tsx
git commit -m "feat(admin): add deed moderation page with approve/reject"
```

---

### Task 11: Admin Users Page

**Files:**
- Create: `src/app/admin/users/page.tsx`

**Interfaces:**
- Consumes: `getAdminSession()` from `@/lib/admin-auth`, `adminDb()` from `@/lib/firebase-admin`, `LEVELS` from `@/types`
- Produces: Server Component read-only user table sorted by carePoints desc

- [ ] **Step 1: Create src/app/admin/users/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { LEVELS } from "@/types";

async function getUsers() {
  const db = adminDb();
  const snap = await db
    .collection("users")
    .orderBy("carePoints", "desc")
    .limit(100)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const users = await getUsers();

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">
        Users <span className="text-gray-500 text-lg font-normal">({users.length})</span>
      </h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-4 py-3">Name</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Points</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Level</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">District</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users as any[]).map((u) => {
              const levelLabel =
                LEVELS.find((l) => l.level === u.level)?.key ?? "—";
              return (
                <tr key={u.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white">{u.fullName || "—"}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono">{u.carePoints ?? 0}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{levelLabel}</td>
                  <td className="px-4 py-3 text-gray-400">{u.district ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {typeof u.createdAt === "number"
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Manual test in browser**

Navigate to `http://localhost:3000/admin/users` — confirm user list sorted by points descending, level key shows correctly (e.g., `level.neighbor`).

- [ ] **Step 4: Final build check**

```bash
npm run build
```

Expected: builds without errors. Fix any type or lint errors before marking complete.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): add read-only users list page"
```
