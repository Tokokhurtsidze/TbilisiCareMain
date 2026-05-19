# TbilisiCare — CLAUDE.md

Gamified civic platform where Tbilisi residents earn points for good deeds.

## Stack

- **Next.js 14** App Router + TypeScript 5.6 + React 18.3
- **Firebase**: Auth (Google), Firestore, Storage, Admin SDK
- **UI**: Tailwind CSS 3.4, Lucide React icons, FiraGO font (Georgian)
- **i18n**: Georgian (ka), English (en), Russian (ru) — `src/locales/`

## Dev Commands

```bash
npm run dev        # localhost:3000
npm run build
npm run lint
npm run typecheck  # tsc --noEmit
```

## Project Structure

```
src/
  app/             # Next.js App Router pages
    auth/          # login, register
    app/           # protected routes (home, submit, leaderboard, marketplace, profile, news)
  components/      # UI components (AppShell, DeedCard, PostCard, etc.)
  lib/             # firebase.ts, firebase-admin.ts, auth-context.tsx, i18n.tsx
  locales/         # ka.json, en.json, ru.json
  types/           # index.ts (UserDoc, Deed, TaskType, Level)
```

## Key Architecture Notes

- Path alias: `@/*` → `./src/*`
- `firebase-admin.ts` is server-only — never import in client components
- Deed flow: user submits → Firestore `deeds/{id}` status=`pending` → CV validation via Cloud Function (not implemented yet)
- Points/level stored denormalized on `users/{uid}`

## Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users/{uid}` | profile, carePoints, level, reputationScore |
| `deeds/{id}` | proof submissions (pending/approved/rejected) |
| `rewards/{id}` | marketplace catalog |
| `redemptions/{id}` | created server-side on reward redeem |

## Intentional Gaps (not implemented yet)

- CV validation Cloud Function
- Phone OTP / reCAPTCHA
- Atomic reward redemption (point deduction)
- Tbilisi Card / parking API integration

## Env Setup

Copy `.env.local.example` → `.env.local` and fill Firebase web SDK keys.
