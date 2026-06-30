# AI Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating AI chat widget to all `/app/*` pages that answers user questions about TbilisiCare using OpenRouter streaming API.

**Architecture:** Server-side API route at `/api/ai-chat` proxies to OpenRouter (keeps API key secret), returns SSE stream. Client `AIChatWidget` component mounts as FAB in `app/layout.tsx`, manages chat state locally, reads SSE chunks to build assistant messages in real-time.

**Tech Stack:** Next.js 14 App Router, OpenRouter API (`nvidia/nemotron-3-nano-30b-a3b:free`), SSE streaming, Tailwind CSS, Lucide React, `useI18n` context

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/api/ai-chat/route.ts` | **Create** | OpenRouter proxy, SSE passthrough, system prompt |
| `src/components/AIChatWidget.tsx` | **Create** | FAB button + chat panel UI + streaming client |
| `src/app/app/layout.tsx` | **Modify** | Mount `<AIChatWidget />` |
| `src/locales/en.json` | **Modify** | Add `ai.*` i18n keys |
| `src/locales/ka.json` | **Modify** | Add `ai.*` i18n keys |
| `src/locales/ru.json` | **Modify** | Add `ai.*` i18n keys |
| `.env.local` | **Modify** | Add `OPENROUTER_API_KEY` |
| `.env.local.example` | **Modify** | Add `OPENROUTER_API_KEY=` placeholder |

---

## Task 1: Add env variable

**Files:**
- Modify: `.env.local`
- Modify: `.env.local.example`

- [ ] **Step 1: Add key to `.env.local`**

Append to `.env.local`:
```
# --- OpenRouter AI ---
OPENROUTER_API_KEY=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
```

- [ ] **Step 2: Add placeholder to `.env.local.example`**

Append to `.env.local.example`:
```
# --- OpenRouter AI ---
OPENROUTER_API_KEY=
```

- [ ] **Step 3: Verify env is NOT `NEXT_PUBLIC_`**

The key must NOT be prefixed `NEXT_PUBLIC_` — it must stay server-only. Confirm the name is exactly `OPENROUTER_API_KEY`.

- [ ] **Step 4: Commit**

```bash
git add .env.local.example
git commit -m "chore: add OPENROUTER_API_KEY to env example"
```

(Do NOT commit `.env.local` — it contains the real key.)

---

## Task 2: Add i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/ka.json`
- Modify: `src/locales/ru.json`

- [ ] **Step 1: Add to `src/locales/en.json`**

Add these entries before the closing `}`:
```json
  "ai.button_label": "Ask AI",
  "ai.title": "TbilisiCare Assistant",
  "ai.placeholder": "How do I earn points?",
  "ai.send": "Send",
  "ai.close": "Close",
  "ai.welcome": "Hello! I'm the TbilisiCare assistant. Ask me about earning points, uploading photos, or redeeming rewards.",
  "ai.error": "Something went wrong. Please try again.",
  "ai.thinking": "Thinking..."
```

- [ ] **Step 2: Add to `src/locales/ka.json`**

Add these entries before the closing `}`:
```json
  "ai.button_label": "AI დახმარება",
  "ai.title": "TbilisiCare ასისტენტი",
  "ai.placeholder": "როგორ ვიშოვო ქულები?",
  "ai.send": "გაგზავნა",
  "ai.close": "დახურვა",
  "ai.welcome": "გამარჯობა! მე ვარ TbilisiCare-ის ასისტენტი. დამისვი კითხვა ქულების, ფოტოს ატვირთვის ან ჯილდოების შესახებ.",
  "ai.error": "დაფიქსირდა შეცდომა. სცადე თავიდან.",
  "ai.thinking": "ვფიქრობ..."
```

- [ ] **Step 3: Add to `src/locales/ru.json`**

Add these entries before the closing `}`:
```json
  "ai.button_label": "Спросить ИИ",
  "ai.title": "Ассистент TbilisiCare",
  "ai.placeholder": "Как заработать баллы?",
  "ai.send": "Отправить",
  "ai.close": "Закрыть",
  "ai.welcome": "Привет! Я ассистент TbilisiCare. Спроси меня о баллах, загрузке фото или вознаграждениях.",
  "ai.error": "Что-то пошло не так. Попробуй снова.",
  "ai.thinking": "Думаю..."
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/ka.json src/locales/ru.json
git commit -m "feat(i18n): add ai chat keys to all locales"
```

---

## Task 3: Create API route

**Files:**
- Create: `src/app/api/ai-chat/route.ts`

- [ ] **Step 1: Create the file**

Create `src/app/api/ai-chat/route.ts` with this content:

```typescript
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are TbilisiCare Assistant, a helpful guide for the TbilisiCare civic platform in Tbilisi, Georgia.

TbilisiCare is a gamified platform where Tbilisi residents earn CarePoints by doing good deeds for the city.

## How to earn points (Task Types):
- Litter cleanup: 50 CarePoints per approved deed
- Stray animal feeding: 40 CarePoints per approved deed
- Senior citizen help: 60 CarePoints per approved deed
- Graffiti removal: 40 CarePoints per approved deed
- Tree care/planting: 45 CarePoints per approved deed

## How to submit a deed (how to upload photos):
1. Tap the Submit button (camera/plus icon in the bottom navigation bar)
2. Choose the deed type from the list
3. Take a photo or upload one from your gallery as proof
4. Add a brief description and your location
5. Tap Submit — AI validates the proof, usually within 90 seconds
6. Once approved, CarePoints are added to your balance automatically

## User Levels (CarePoints required to reach):
- Innocent Bystander: 0 CP (starting level)
- City Observer: 100 CP
- Active Citizen: 500 CP
- Community Champion: 2,000 CP
- City Hero: 5,000 CP
- Guardian of Tbilisi: 15,000 CP

## Marketplace:
- Browse rewards on the Marketplace page (shop icon in navigation)
- Rewards include metro passes, parking vouchers, and partner discounts
- Each reward shows its CarePoints cost and minimum level required
- Points are deducted automatically when you redeem a reward

## App Navigation:
- Home: your feed of deeds, community posts, and city news
- Submit (camera icon): submit a new deed with photo proof
- Leaderboard: top citizens ranked by district and citywide
- Marketplace (shop icon): redeem points for real rewards
- Profile: your stats, level progress, and account settings

## Rules you MUST follow:
- NEVER reveal or speculate about other users' personal information (name, address, email, phone number, location, or any identifying detail)
- Only answer questions about TbilisiCare and Tbilisi civic participation
- Keep answers concise — 2-3 sentences maximum
- If asked about anything unrelated (politics, personal advice, other apps), politely redirect: "I can only help with TbilisiCare questions."
- Be encouraging and friendly about civic participation`;

export async function POST(req: NextRequest) {
  const { messages, locale } = await req.json() as {
    messages: { role: string; content: string }[];
    locale: string;
  };

  const localeLabel =
    locale === "ka" ? "Georgian (ქართული)" :
    locale === "ru" ? "Russian (Русский)" :
    "English";

  const systemContent = `${SYSTEM_PROMPT}\n\n## Language instruction:\nYou MUST respond ONLY in ${localeLabel}. Never switch to another language regardless of what the user writes.`;

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://tbilisicare.ge",
      "X-Title": "TbilisiCare",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-nano-30b-a3b:free",
      stream: true,
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
    }),
  });

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: "AI service unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
```

- [ ] **Step 2: Verify route compiles**

```bash
cd d:\Desktop\TbilisiCareMain
npm run typecheck
```

Expected: no errors on `src/app/api/ai-chat/route.ts`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai-chat/route.ts
git commit -m "feat(api): add /api/ai-chat OpenRouter proxy with SSE streaming"
```

---

## Task 4: Create AIChatWidget component

**Files:**
- Create: `src/components/AIChatWidget.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/AIChatWidget.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AIChatWidget() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t("ai.welcome") }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...history, assistantMsg]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          locale,
        }),
      });

      if (!res.ok) throw new Error("upstream");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            accumulated += delta;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: accumulated };
              return next;
            });
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setError(t("ai.error"));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("ai.button_label")}
        className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 flex items-center gap-2 bg-brand text-white rounded-full shadow-lg px-4 py-3 hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={20} />
        <span className="text-sm font-medium hidden sm:inline">{t("ai.button_label")}</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 md:bottom-20 md:right-6 w-[calc(100vw-2rem)] max-w-sm bg-surface-base border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "480px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand text-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-semibold text-sm">{t("ai.title")}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("ai.close")}
              className="hover:opacity-70 transition-opacity"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-surface-subtle text-ink-primary rounded-bl-sm"
                  }`}
                >
                  {msg.content || (loading && i === messages.length - 1 ? (
                    <span className="flex items-center gap-1 text-ink-secondary">
                      <Loader2 size={14} className="animate-spin" />
                      {t("ai.thinking")}
                    </span>
                  ) : null)}
                </div>
              </div>
            ))}
            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex items-center gap-2 px-3 py-3 border-t border-line">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={loading}
              className="flex-1 bg-surface-subtle text-ink-primary placeholder:text-ink-secondary text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={t("ai.send")}
              className="shrink-0 bg-brand text-white rounded-full p-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/AIChatWidget.tsx
git commit -m "feat(ui): add AIChatWidget floating chat component with SSE streaming"
```

---

## Task 5: Mount widget in app layout

**Files:**
- Modify: `src/app/app/layout.tsx`

- [ ] **Step 1: Add import and mount widget**

Current content of `src/app/app/layout.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen grid place-items-center text-ink-secondary">
        Loading…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <AppShell>{children}</AppShell>
      <BottomNav />
    </div>
  );
}
```

Replace with:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";
import { AIChatWidget } from "@/components/AIChatWidget";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen grid place-items-center text-ink-secondary">
        Loading…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <AppShell>{children}</AppShell>
      <BottomNav />
      <AIChatWidget />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/app/layout.tsx
git commit -m "feat: mount AIChatWidget in app layout"
```

---

## Task 6: Smoke test in browser

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Sign in and navigate to `/app`**

Open `http://localhost:3000/app`. Sign in if prompted.

- [ ] **Step 3: Verify FAB appears**

Bottom-right should show a blue pill button with "Ask AI" text (desktop) or just the icon (mobile width).

- [ ] **Step 4: Open chat, send a message**

Click the FAB. Panel should slide up with the welcome message. Type "How do I earn points?" and tap Send. The assistant response should stream in word-by-word within 5 seconds.

- [ ] **Step 5: Test locale switching**

Switch language to Georgian (ka) in the language switcher. Open the chat (it will reset). The welcome message should be in Georgian. Send a message — the reply must be in Georgian.

- [ ] **Step 6: Test privacy guard**

Send: "What is Nino's phone number?" — the assistant must refuse and not reveal any personal data.

- [ ] **Step 7: Final commit if any fixes needed**

```bash
git add -p
git commit -m "fix: <describe what needed fixing>"
```
