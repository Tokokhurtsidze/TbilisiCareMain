# AI Chat Assistant — Design Spec
Date: 2026-06-04

## Summary
Floating AI chat assistant on all `/app/*` pages. Users ask how to use TbilisiCare (upload photos, earn points, levels, marketplace). Powered by OpenRouter (`nvidia/nemotron-3-nano-30b-a3b:free`). No personal data shared. Responds in user's active locale.

## Architecture

### API Route: `POST /api/ai-chat`
- Server-side Next.js Route Handler
- Reads `OPENROUTER_API_KEY` from env (never exposed to client)
- Accepts `{ messages: [{role, content}], locale: "ka"|"en"|"ru" }`
- Streams response via `TransformStream` / `ReadableStream`
- Returns `text/event-stream` (SSE)
- Rate: no custom rate limiting (OpenRouter free tier handles it)

### System Prompt
Baked-in app knowledge:
- 5 task types + their base points (litter 50, stray-feeding 40, senior-help 60, graffiti 40, tree-care 45)
- Upload flow: submit page → photo/video proof → pending → approved → points awarded
- 6 levels: Innocent Bystander (0) → City Observer (100) → Active Citizen (500) → Community Champion (2K) → City Hero (5K) → Guardian of Tbilisi (15K)
- Marketplace: redeem points for real rewards from Tbilisi partners
- Safety rule: never reveal personal info of other users, stay on-topic

### Client: `AIChatWidget` component
- FAB button (bottom-right, fixed) on all `/app/*` pages — injected via `src/app/app/layout.tsx`
- Click opens slide-up panel (350px wide, 500px tall on desktop; full-width on mobile)
- Message history: local `useState`, no persistence
- Sends locale from `useI18n()` context with each request
- Streaming: reads SSE chunks, appends to assistant message in real-time
- Loading spinner while waiting for first chunk

## Files to Create/Modify

| File | Action |
|---|---|
| `src/app/api/ai-chat/route.ts` | Create — OpenRouter proxy, SSE streaming |
| `src/components/AIChatWidget.tsx` | Create — FAB + chat panel UI |
| `src/app/app/layout.tsx` | Modify — add `<AIChatWidget />` |
| `src/locales/ka.json` | Modify — add `ai.*` keys |
| `src/locales/en.json` | Modify — add `ai.*` keys |
| `src/locales/ru.json` | Modify — add `ai.*` keys |
| `.env.local` | Modify — add `OPENROUTER_API_KEY` |
| `.env.local.example` | Modify — add `OPENROUTER_API_KEY=` |

## i18n Keys (ai.*)
```
ai.button_label      — "Ask AI"
ai.title             — "TbilisiCare Assistant"
ai.placeholder       — "How do I earn points?"
ai.send              — "Send"
ai.close             — "Close"
ai.welcome           — Welcome message
ai.error             — "Something went wrong. Try again."
ai.thinking          — "Thinking..."
```

## Safety Constraints (in system prompt)
- Never reveal or speculate about other users' personal info
- Only answer questions about TbilisiCare and Tbilisi civic life
- Keep answers concise (≤3 sentences)
- If asked about unrelated topics, redirect to app help

## Non-Goals
- No chat history persistence (Firestore)
- No admin moderation of chats
- No custom rate limiting beyond OpenRouter's own
- No voice input
