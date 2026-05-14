# Tbilisi Care — Starter App

Gamified civic platform. Next.js 14 (App Router) + Firebase (Auth, Firestore, Storage).

## Stack
- Next.js 14, TypeScript, Tailwind CSS, App Router (client-side data fetching for starter)
- Firebase: Auth (Google), Firestore, Storage
- i18n: Georgian (default), English, Russian — Mkhedruli-aware typography (FiraGO)
- Light + Dark mode (pure white / deep navy)

## Setup

1. `npm install`
2. Create a Firebase project at console.firebase.google.com
   - Enable **Authentication → Google**
   - Enable **Firestore** (production mode)
   - Enable **Storage**
3. Copy `.env.local.example` → `.env.local` and fill in the Firebase web SDK values from project settings.
4. (Optional, for server-side admin) Generate a service account key and paste the JSON (single line) into `FIREBASE_SERVICE_ACCOUNT_KEY`.
5. Deploy rules: `firebase deploy --only firestore:rules,storage`
6. `npm run dev` → http://localhost:3000

## What's included
- Landing page (`/`)
- Google sign-in (`/auth/login`)
- Protected app shell (`/app`) with bottom nav
- Home dashboard with points + level
- Deed submission (before/after video upload to Storage, doc created in Firestore as `pending`)
- Leaderboard (Top 5 Hall of Honor + Top 50 Honor Roll)
- Reward marketplace (mocked rewards)
- Profile with language, theme, elder mode, leaderboard consent

## What's NOT included (intentional — separate work)
- The Computer Vision validation pipeline (see blueprint §2.2 — runs server-side on Triton, async-triggered by a Firestore `onCreate` Cloud Function)
- Phone OTP (Firebase phone auth needs reCAPTCHA setup; scaffold in `auth-context` is Google-only)
- Reward redemption transactions (needs server-side function to atomically deduct points + decrement inventory)
- Tbilisi Card / parking API integration (requires City Hall partnership)

## Project structure
```
src/
  app/
    page.tsx              # landing
    auth/login/page.tsx
    app/
      layout.tsx          # protected shell
      page.tsx            # home
      submit/page.tsx
      leaderboard/page.tsx
      marketplace/page.tsx
      profile/page.tsx
    layout.tsx, globals.css
  components/
    BottomNav.tsx, LanguageSwitcher.tsx, ThemeToggle.tsx
    ui/Button.tsx, ui/Card.tsx
  lib/
    firebase.ts           # client SDK
    firebase-admin.ts     # admin SDK (server only)
    auth-context.tsx
    i18n.tsx
    theme-context.tsx
  locales/
    ka.json, en.json, ru.json
  types/index.ts          # UserDoc, Deed, TaskType, Level
firestore.rules
storage.rules
firebase.json
```

## Firestore collections (matches blueprint Appendix A)
- `users/{uid}` — profile + denormalized `carePoints`, `level`, `reputationScore`
- `deeds/{id}` — proof-of-good-deed submissions
- `rewards/{id}` — marketplace catalog
- `redemptions/{id}` — server-created on successful redeem

## Next steps to productionize
1. Add a Cloud Function on `deeds/onCreate` to:
   - Run CV validation (Vertex AI / Triton endpoint)
   - Update deed `status` + atomically increment user `carePoints`
   - Recompute `level` from thresholds
2. Add a `redeemReward` callable Function for atomic point deduction.
3. Self-host the FiraGO font in `/public/fonts` (currently loaded from CDN).
4. Add Firebase App Check to block API abuse.
5. Wire phone OTP with reCAPTCHA v3.
