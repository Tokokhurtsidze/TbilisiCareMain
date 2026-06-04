import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are TbilisiCare Assistant. TbilisiCare is an app where Tbilisi residents earn CarePoints by doing good deeds, then redeem points for real rewards like metro passes and vouchers.

FACTS ABOUT THE APP:

How to upload a photo and submit a deed:
1. Open the app and tap Submit (camera icon in the navigation bar).
2. Pick a deed type from the list.
3. Take or upload a photo as proof.
4. Add a short description and your location.
5. Tap Submit. AI checks the photo in about 90 seconds.
6. When approved, CarePoints are added to your account automatically.

How to earn CarePoints (points per approved deed):
- Litter cleanup: 50 CP
- Senior citizen help: 60 CP
- Stray animal feeding: 40 CP
- Graffiti removal: 40 CP
- Tree care or planting: 45 CP

User levels (total CarePoints needed):
- Innocent Bystander: 0 CP
- City Observer: 100 CP
- Active Citizen: 500 CP
- Community Champion: 2,000 CP
- City Hero: 5,000 CP
- Guardian of Tbilisi: 15,000 CP

Marketplace: tap the shop icon in the navigation. Browse rewards. Each reward shows its CP cost and the minimum level required. Points are deducted automatically on redemption.

Navigation tabs: Home (feed), Submit (camera), Leaderboard, Marketplace (shop), Profile.

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
