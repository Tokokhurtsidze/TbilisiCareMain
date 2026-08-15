import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isCleanOutput } from "@/lib/ai-output-guard";
import type { Localized } from "@/types";

// Runs 3x/week (see vercel.json crons) to pull City Hall's own official news
// (tbilisi.gov.ge/news — real projects, real officials, real dates) into the
// feed, translated into en/ru. ka is the site's own original text, never
// AI-rewritten, so it can never drift from what City Hall actually said —
// only en/ru go through translation.

const LISTING_URL = "https://tbilisi.gov.ge/news";
const ORIGIN = "https://tbilisi.gov.ge";
const MAX_PER_RUN = 3; // cap backlog catch-up; remainder rolls to the next run
const STATE_DOC = "cityHallFeedState/tbilisi-gov-ge";

const FALLBACK_MODELS = [
  "dots-studio/dots-3-note-preview:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];
const CANDIDATE_MODELS = process.env.OPENROUTER_CHAT_MODEL
  ? [process.env.OPENROUTER_CHAT_MODEL, ...FALLBACK_MODELS]
  : FALLBACK_MODELS;

// ---- HTML/text helpers ----

function decodeEntities(s: string): string {
  return s
    .replace(/&bdquo;|&ldquo;|&rdquo;/g, '"')
    .replace(/&laquo;|&raquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

// First 2 sentences, hard-capped — plain truncation, no AI rewriting.
function summarize(text: string, maxLen = 360): string {
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const base = sentences.length >= 40 ? sentences : text; // guard against a too-short split
  return base.length > maxLen ? base.slice(0, maxLen).trimEnd() + "…" : base;
}

type ListingEntry = { id: number; title: string };

function parseListing(html: string): ListingEntry[] {
  const items: ListingEntry[] = [];
  const re = /<li class="news card" onclick="window\.open\('\/news\/(\d+)'[\s\S]*?<div class="title">([^<]+)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    items.push({ id: Number(m[1]), title: decodeEntities(m[2]).trim() });
  }
  return items;
}

function parseArticleBody(html: string): string | null {
  const m = html.match(/<div class="textual-news[^"]*">[\s\S]*?<div class="body">([\s\S]*?)<\/div>\s*<\/div>/);
  return m ? stripHtml(m[1]) : null;
}

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

async function translate(kaTitle: string, kaBody: string): Promise<{ en: { title: string; body: string }; ru: { title: string; body: string } } | null> {
  const prompt = `Translate this REAL official Tbilisi City Hall news item from Georgian into English and Russian. Stay strictly faithful to the facts (names, numbers, locations, dates) — do not add, remove, or embellish anything.

Georgian title: ${kaTitle}
Georgian body: ${kaBody}

Reply with ONLY strict JSON, no markdown: {"en":{"title":"...","body":"..."},"ru":{"title":"...","body":"..."}}`;

  let lastError: string | null = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://tbilisicare.ge",
          "X-Title": "TbilisiCare",
        },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        lastError = `${model} http ${res.status}`;
        continue;
      }
      const data = await res.json();
      const raw: string = data.choices?.[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        lastError = `${model}: no json`;
        continue;
      }
      const parsed = JSON.parse(match[0]);
      const en = parsed.en ?? {};
      const ru = parsed.ru ?? {};
      if (!isNonEmpty(en.title) || !isNonEmpty(en.body) || !isNonEmpty(ru.title) || !isNonEmpty(ru.body)) {
        lastError = `${model}: missing fields`;
        continue;
      }
      if (
        !isCleanOutput(en.title, "en") ||
        !isCleanOutput(en.body, "en") ||
        !isCleanOutput(ru.title, "ru") ||
        !isCleanOutput(ru.body, "ru")
      ) {
        lastError = `${model}: garbled/repetitive output rejected`;
        continue;
      }
      return { en, ru };
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  console.error("[city-hall-post] translation failed", lastError);
  return null;
}

const CTA_LABEL: Localized = { ka: "სრული სტატია", en: "Read full article", ru: "Читать полностью" };

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const db = adminDb();
  const stateRef = db.doc(STATE_DOC);
  const stateSnap = await stateRef.get();
  const lastId: number = stateSnap.exists ? (stateSnap.data()?.lastId ?? 0) : 0;

  const listingRes = await fetch(LISTING_URL, {
    headers: { "User-Agent": "TbilisiCare/1.0 (+https://tbilisicare.ge)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!listingRes.ok) {
    return NextResponse.json({ error: "listing_fetch_failed", status: listingRes.status }, { status: 502 });
  }
  const listingHtml = await listingRes.text();
  const entries = parseListing(listingHtml).filter((e) => e.id > lastId);

  if (entries.length === 0) {
    return NextResponse.json({ ok: true, published: 0, reason: "no_new_items" });
  }

  // Oldest-first so the feed's chronological order matches City Hall's own,
  // and so a failure partway through doesn't advance lastId past a skipped item.
  entries.sort((a, b) => a.id - b.id);
  const batch = entries.slice(0, MAX_PER_RUN);

  const published: number[] = [];
  for (const entry of batch) {
    const articleRes = await fetch(`${ORIGIN}/news/${entry.id}`, {
      headers: { "User-Agent": "TbilisiCare/1.0 (+https://tbilisicare.ge)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!articleRes.ok) break;
    const articleHtml = await articleRes.text();
    const fullBody = parseArticleBody(articleHtml);
    if (!fullBody) break;

    const kaTitle = entry.title;
    const kaBody = summarize(fullBody);

    const translated = await translate(kaTitle, kaBody);
    if (!translated) break;

    const title: Localized = { ka: kaTitle, en: translated.en.title, ru: translated.ru.title };
    const body: Localized = { ka: kaBody, en: translated.en.body, ru: translated.ru.body };

    await db.collection("officialPosts").add({
      tag: "announcement",
      title,
      body,
      imageUrl: `${ORIGIN}/news/main-image/${entry.id}x400x240`,
      ctaLabel: CTA_LABEL,
      ctaHref: `${ORIGIN}/news/${entry.id}`,
      authorName: "Tbilisi City Hall",
      authorPhotoURL: null,
      source: "ai",
      createdAt: Date.now(),
    });

    published.push(entry.id);
    await stateRef.set({ lastId: entry.id }, { merge: true });
  }

  return NextResponse.json({ ok: true, published: published.length, ids: published });
}
