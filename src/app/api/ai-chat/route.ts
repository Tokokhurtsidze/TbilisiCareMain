import { NextRequest } from "next/server";
import { LEVELS, TASK_TYPES, type Locale } from "@/types";
import { isCleanOutput } from "@/lib/ai-output-guard";

// OpenRouter's free-tier models are backed by different third-party inference
// providers, each with their own independent rate limits — any single free
// model can go down for a while even when the others are fine. So instead of
// pinning one model, try a short list in order and fall through on failure.
// OPENROUTER_CHAT_MODEL (if set) is tried first, ahead of the built-in list.
//
// Ordering is based on actually testing each candidate on real open-ended
// Georgian chat prompts (not just translation of given text, which is an
// easier task) — gpt-oss-20b was the only one that reliably stayed in
// Georgian and avoided repetition loops; the others each failed a different
// way at least once (dots-studio: degenerate repetition loop,
// nemotron-3-ultra: mixed in stray Russian/Korean words, nemotron-3-super:
// ignored the "reply only in Georgian" instruction and answered in English).
// Kept as lower-priority fallbacks anyway since a bad roll isn't guaranteed
// every time and the isCleanOutput() guard below rejects a bad one either way.
const FALLBACK_MODELS = [
  "openai/gpt-oss-20b:free",
  "dots-studio/dots-3-note-preview:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
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

// Fakes an SSE delta stream from a single already-validated string, in the
// exact shape the client parser expects — lets us replay a typing effect
// without re-introducing the raw, unvalidated streaming this replaced.
function fakeDeltaStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const words = content.split(/(\s+)/); // keep whitespace tokens so spacing survives
  return new ReadableStream({
    async start(controller) {
      for (const word of words) {
        const chunk = { choices: [{ delta: { content: word } }] };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

export async function POST(req: NextRequest) {
  const { messages, locale: rawLocale } = (await req.json()) as {
    messages: { role: string; content: string }[];
    locale: string;
  };
  const locale: Locale = rawLocale === "ka" || rawLocale === "ru" ? rawLocale : "en";

  const localeLabel =
    locale === "ka" ? "Georgian (ქართული)" : locale === "ru" ? "Russian (Русский)" : "English";

  const systemContent = `YOU MUST REPLY ONLY IN ${localeLabel.toUpperCase()}. Use no other language, not even one word.\n\n${SYSTEM_PROMPT}`;

  let lastError: string | null = null;

  for (const model of CANDIDATE_MODELS) {
    try {
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
          max_tokens: 700,
          frequency_penalty: 0.4,
          messages: [{ role: "system", content: systemContent }, ...messages],
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!upstream.ok) {
        lastError = `${model} http ${upstream.status}`;
        continue;
      }

      const data = await upstream.json();
      const content: string = data.choices?.[0]?.message?.content ?? "";

      // Free-tier models occasionally garble output (stray characters from
      // an unrelated script) or fall into a degenerate repetition loop —
      // reject and fall through to the next candidate instead of shipping
      // broken text to the user.
      if (!content.trim() || !isCleanOutput(content, locale)) {
        lastError = `${model}: garbled/repetitive output rejected`;
        continue;
      }

      return new Response(fakeDeltaStream(content), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  console.error("[ai-chat] all candidate models failed", lastError);
  return new Response(JSON.stringify({ error: "AI service unavailable" }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}
