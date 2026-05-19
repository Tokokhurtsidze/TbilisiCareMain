import { NextResponse } from "next/server";

export interface CommunityFeedItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  publishedAt: number;
  source: string;
  sourceUrl: string;
}

function extractText(xml: string, tag: string): string {
  const cdata = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)
  );
  if (cdata) return cdata[1].trim();
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  return plain ? plain[1].trim() : "";
}

function extractImage(xml: string): string | null {
  return (
    xml.match(/<media:content[^>]+url="([^"]+)"/)?.[1] ??
    xml.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] ??
    xml.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ??
    xml.match(/<img[^>]+src="([^"]+)"/)?.[1] ??
    null
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SOURCES = [
  { url: "https://oc-media.org/feed/",  name: "OC Media",      siteUrl: "https://oc-media.org" },
  { url: "https://civil.ge/feed",        name: "Civil Georgia", siteUrl: "https://civil.ge" },
];

export const revalidate = 3600;

export async function GET() {
  const allItems: CommunityFeedItem[] = [];

  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { "User-Agent": "TbilisiCare/1.0 (+https://tbilisicare.ge)" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

      for (let i = 0; i < Math.min(matches.length, 6); i++) {
        const item = matches[i][1];
        const title = stripHtml(extractText(item, "title"));
        const rawDesc = extractText(item, "description") || extractText(item, "content:encoded");
        const description = stripHtml(rawDesc).slice(0, 220).trimEnd();
        const url =
          extractText(item, "link") ||
          item.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1] ||
          "";
        const imageUrl = extractImage(item);
        const pubDate = extractText(item, "pubDate");
        const publishedAt = pubDate
          ? new Date(pubDate).getTime()
          : Date.now() - i * 3_600_000;

        if (!title || !url) continue;

        allItems.push({
          id: `${src.name.replace(/\s/g, "-").toLowerCase()}-${i}-${publishedAt}`,
          title,
          description: description + (description.length === 220 ? "…" : ""),
          url,
          imageUrl,
          publishedAt,
          source: src.name,
          sourceUrl: src.siteUrl,
        });
      }
    } catch {
      // source unavailable — skip silently
    }
  }

  // Sort newest first, return top 10
  allItems.sort((a, b) => b.publishedAt - a.publishedAt);

  return NextResponse.json({ items: allItems.slice(0, 10) });
}
