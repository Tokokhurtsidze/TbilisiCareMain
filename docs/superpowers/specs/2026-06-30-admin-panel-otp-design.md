# Admin Panel + Email OTP Login — Design Spec
**Date:** 2026-06-30  
**Project:** TbilisiCare  
**Status:** Approved

---

## Overview

Add a password-less admin panel secured by email OTP. Admins enter only their email, receive a 6-digit OTP via Gmail, paste it, and get an 8-hour session cookie. The panel provides deed moderation (approve/reject) and a read-only user list.

---

## 1. Auth Architecture

### Admin whitelist
`ADMIN_EMAILS` env var — comma-separated list of allowed emails.  
Example: `ADMIN_EMAILS=admin@tbilisicare.ge,mod@tbilisicare.ge`

### OTP storage
Firestore collection: `adminOtps/{email}`  
```ts
{
  otp: string,        // 6-digit, crypto-random
  expiresAt: number,  // Date.now() + 10 * 60 * 1000
  used: boolean
}
```
OTP expires in 10 minutes. Marked `used: true` after successful verification (prevents replay).

### Session
JWT signed with `ADMIN_JWT_SECRET` (min 32-char random string in env).  
Payload: `{ email: string, role: "admin", iat, exp }`  
Expiry: 8 hours.  
Delivered as HTTP-only, SameSite=strict, Secure cookie named `admin_token`.

### Middleware guard
`src/middleware.ts` — matches `/admin/:path*` (excluding `/admin/login`).  
Verifies `admin_token` cookie with `jose`. Redirects to `/admin/login` if missing or invalid.

---

## 2. API Routes

### `POST /api/admin/send-otp`
**Body:** `{ email: string }`  
**Logic:**
1. Reject if email not in `ADMIN_EMAILS` — return 403
2. Generate 6-digit OTP via `crypto.randomInt(100000, 999999)`
3. Write to `adminOtps/{email}` with `expiresAt = now + 10min`, `used: false`
4. Send email via nodemailer (Gmail SMTP, `GMAIL_USER` + `GMAIL_APP_PASSWORD`)
5. Return `200 { ok: true }` — never reveal OTP in response

**Rate limiting:** If an un-expired, unused OTP exists for the email, return `429 { error: "rate_limited", retryAfter: <seconds remaining> }`. The login UI displays a countdown. Prevents OTP spam.

### `POST /api/admin/verify-otp`
**Body:** `{ email: string, otp: string }`  
**Logic:**
1. Fetch `adminOtps/{email}` — 404 if missing
2. Check `used === false` — 400 if already used
3. Check `expiresAt > now` — 400 if expired
4. Check `otp === stored.otp` — 401 if wrong (constant-time compare)
5. Mark `used: true` in Firestore
6. Sign JWT with `jose` (`HS256`, 8h)
7. Set `admin_token` cookie (httpOnly, secure, sameSite: strict, maxAge: 8h)
8. Return `200 { ok: true }`

### `POST /api/admin/logout`
Clears `admin_token` cookie. Returns `200`.

### `POST /api/admin/deeds/[id]/action`
**Body:** `{ action: "approve" | "reject" }`  
**Auth:** Middleware already guards `/admin/*` — additionally verify cookie in route handler.  
**Approve logic:**
1. Fetch `deeds/{id}`, read `userId` and `pointsAwarded`
2. Set `deeds/{id}.status = "approved"`, `deeds/{id}.validatedAt = now`
3. Increment `users/{userId}.carePoints` by `pointsAwarded` (Firestore `increment`)
4. Recalculate level from `LEVELS` thresholds, update `users/{userId}.level`

**Reject logic:**
1. Set `deeds/{id}.status = "rejected"`

---

## 3. Pages & UI

### `/admin/login`
Two-step single-page flow (no navigation between steps).

**Step 1 — Email:**
- Email input + "Send OTP" button
- On success: transition to Step 2, show "Check your inbox" message

**Step 2 — OTP:**
- 6-digit OTP input (auto-focus, numeric keyboard)
- "Verify" button
- "Resend" link (respects rate limit — shows countdown if blocked)
- On success: `router.push("/admin")`

No i18n required for admin panel (English only).

### `/admin` — Dashboard
Server component. Shows:
- Count of pending deeds
- Count of total registered users
- Count of approved deeds this week

### `/admin/deeds` — Deed Moderation
Server component with filter tabs: **Pending** (default) / Approved / Rejected.

Table columns: Author | Type | Points | Proof (thumbnail) | Date | Actions  
Actions (Pending only): **Approve** button, **Reject** button — POST to `/api/admin/deeds/[id]/action`, optimistic UI update.

### `/admin/users` — User List
Server component. Table: Name | Email | Points | Level | Joined  
Read-only in v1.

### Admin Layout (`/admin/layout.tsx`)
- No AppShell — standalone layout
- Dark sidebar nav: Dashboard / Deeds / Users / Logout
- Visually distinct from user app (dark background, monospace accents)

---

## 4. New Files

```
src/
  app/
    admin/
      layout.tsx              # dark sidebar layout
      page.tsx                # dashboard
      login/
        page.tsx              # OTP login flow
      deeds/
        page.tsx              # deed moderation
      users/
        page.tsx              # user list
    api/
      admin/
        send-otp/route.ts
        verify-otp/route.ts
        logout/route.ts
        deeds/[id]/action/route.ts
  lib/
    admin-auth.ts             # verifyAdminCookie() helper
    mailer.ts                 # nodemailer transporter singleton
  middleware.ts               # /admin/* guard (new file, root of src/)
```

---

## 5. New Env Vars

```env
ADMIN_EMAILS=admin@tbilisicare.ge
ADMIN_JWT_SECRET=<min 32 random chars>
# GMAIL_USER and GMAIL_APP_PASSWORD already added
```

---

## 6. New Dependencies

```
nodemailer        # Gmail SMTP
@types/nodemailer # types
jose              # JWT sign/verify (Edge-compatible)
```

---

## 7. Security Notes

- OTP is 6 digits from `crypto.randomInt` (not Math.random)
- Constant-time OTP comparison to prevent timing attacks
- `used` flag prevents OTP replay
- 10-minute OTP window, 8-hour session
- HTTP-only cookie — not accessible to JS
- Middleware runs on every `/admin/*` request server-side
- `ADMIN_EMAILS` checked on both send-otp and as secondary guard on verify-otp

---

## 8. Out of Scope (v1)

- Ban/suspend users from admin panel
- Admin activity audit log
- Multiple admin roles / permissions
- Admin-created official posts
- CV validation Cloud Function (separate feature)
