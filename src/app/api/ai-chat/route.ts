import { NextRequest } from "next/server";
import { LEVELS, TASK_TYPES } from "@/types";

// OpenRouter's free-tier models are backed by different third-party inference
// providers, each with their own independent rate limits — any single free
// model can go down for a while even when the others are fine. So instead of
// pinning one model, try a short list in order and fall through on failure.
// OPENROUTER_CHAT_MODEL (if set) is tried first, ahead of the built-in list.
//
// Ordering is based on actually testing each candidate's ka/en/ru output, not
// just availability — the nvidia nemotron family (including the large "super"
// and "ultra" variants) reliably IGNORED the "reply only in <language>"
// instruction and produced garbled mixed-language text, so it's kept only as
// a last-resort fallback rather than trusted as primary.
const FALLBACK_MODELS = [
  "tencent/hy3:free",
  "google/gemma-4-26b-a4b-it:free",
  "poolside/laguna-m.1:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];
const CANDIDATE_MODELS = process.env.OPENROUTER_CHAT_MODEL
  ? [process.env.OPENROUTER_CHAT_MODEL, ...FALLBACK_MODELS]
  : FALLBACK_MODELS;

const pointsList = TASK_TYPES.map((t) => `- ${t.id}: ${t.minPoints}-${t.maxPoints} CP`).join("\n");
const levelsList = LEVELS.map((l) => `- ${l.key.replace("level.", "")}: ${l.threshold.toLocaleString()} CP`).join("\n");

const SYSTEM_PROMPT = `You are TbilisiCare Assistant. TbilisiCare is an app where Tbilisi residents earn CarePoints by doing good deeds. Points have no cash value and cannot be redeemed for anything — they exist purely to rank citizens on the leaderboard and earn public recognition.

FACTS ABOUT THE APP:

How to submit a deed:
1. Open the app and tap Submit.
2. Pick a deed type from the list.
3. Upload proof — a photo is required. Litter cleanup, graffiti removal, and tree care need BOTH a before photo and an after photo so AI can verify a real change happened; stray feeding and senior help need one proof photo.
4. Add a short caption and your location.
5. Tap Submit. An AI vision model checks the proof in under a minute.
6. There is no fixed payout — AI assesses the real effort/scale shown and picks points within the deed type's range. The AI can instantly reject obvious fraud, but it can NEVER award points on its own: every deed it doesn't reject goes to a human admin, who confirms (or overrides) the AI's recommendation before any CarePoints are credited. This is strict by design so points can't be gamed.

CarePoints range per deed type:
${pointsList}

User levels (total CarePoints needed):
${levelsList}

Navigation tabs: Home (feed), Submit, Leaderboard, Profile.

The feed shows City Hall announcements, the "Learn and Get Employed" job-training program, and AI-generated spotlights featuring citizens who had a deed approved — there is no free-text user posting feature and no marketplace/rewards-redemption feature.

RULES:
- Never share or guess any other user's personal information.
- If the question is not about TbilisiCare, say: "I can only help with TbilisiCare questions."
- Give clear, direct, helpful answers. Do not add unnecessary disclaimers.`;

export async function POST(req: NextRequest) {
  const { messages, locale } = (await req.json()) as {
    messages: { role: string; content: string }[];
    locale: string;
  };

  const localeLabel =
    locale === "ka"
      ? "Georgian (ქართული)"
      : locale === "ru"
        ? "Russian (Русский)"
        : "English";

  const systemContent = `YOU MUST REPLY ONLY IN ${localeLabel.toUpperCase()}. Use no other language, not even one word.\n\n${SYSTEM_PROMPT}`;

  let lastError: { model: string; status: number; body: string } | null = null;

  for (const model of CANDIDATE_MODELS) {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://tbilisicare.ge",
        "X-Title": "TbilisiCare",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: systemContent }, ...messages],
      }),
    });

    if (upstream.ok) {
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Not ok — log the real reason (rate limit, deprecated slug, etc.) and
    // try the next candidate instead of failing the whole request.
    const body = await upstream.text().catch(() => "");
    lastError = { model, status: upstream.status, body };
    console.error(`[ai-chat] ${model} failed (${upstream.status}): ${body.slice(0, 300)}`);
  }

  console.error("[ai-chat] all candidate models failed", lastError);
  return new Response(JSON.stringify({ error: "AI service unavailable" }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}
