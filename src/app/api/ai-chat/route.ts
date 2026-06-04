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

  const systemContent = `STRICT LANGUAGE RULE: You MUST reply ONLY in ${localeLabel}. Do NOT use any other language in your response, not even one word. If the user writes in a different language, still reply ONLY in ${localeLabel}.\n\n${SYSTEM_PROMPT}\n\nREMINDER: Every single word of your reply must be in ${localeLabel}. No exceptions.`;

  const upstream = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://tbilisicare.ge",
        "X-Title": "TbilisiCare",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        stream: true,
        messages: [{ role: "system", content: systemContent }, ...messages],
      }),
    }
  );

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "AI service unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
