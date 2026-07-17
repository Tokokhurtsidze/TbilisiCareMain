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
    app/           # protected routes (home, submit, leaderboard, profile, news)
  components/      # UI components (AppShell, OfficialPostCard, etc.)
  lib/             # firebase.ts, firebase-admin.ts, auth-context.tsx, i18n.tsx
  locales/         # ka.json, en.json, ru.json
  types/           # index.ts (UserDoc, Deed, TaskType, Level)
```

## Key Architecture Notes

- Path alias: `@/*` → `./src/*`
- `firebase-admin.ts` is server-only — never import in client components
- Deed flow: user submits (proof mandatory; visual-change task types require before+after photos) → Firestore `deeds/{id}` status=`pending` → `POST /api/deeds/validate` runs an AI vision check (OpenRouter) → `approved` (points awarded server-side)/`rejected`/`review` (queued for the admin panel). See `src/lib/deed-admin.ts`.
- Points/level are written server-only (Admin SDK) — Firestore rules block clients from writing `carePoints`/`level` or self-approving a deed. Points exist purely for the leaderboard/rating; there is no redemption or exchange feature.
- Feed content: no user-authored free-text posts (removed). The feed shows approved deeds (`DeedCard`) and `officialPosts/{id}` — either hand-written City Hall announcements (`/admin/official-posts`) or AI-generated deed-doer spotlights auto-created on every deed approval (`src/lib/deed-admin.ts`).

## Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users/{uid}` | profile, carePoints, level, reputationScore |
| `deeds/{id}` | proof submissions (pending/approved/rejected/review) |

## Intentional Gaps (not implemented yet)

- Phone OTP / reCAPTCHA
- Cloud Function trigger for comment-count denormalization (currently best-effort client update)

## Env Setup

Copy `.env.local.example` → `.env.local` and fill Firebase web SDK keys.
