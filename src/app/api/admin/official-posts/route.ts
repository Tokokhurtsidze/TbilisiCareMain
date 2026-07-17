import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { Locale, Localized, OfficialPostTag } from "@/types";

const VALID_TAGS: OfficialPostTag[] = ["announcement", "milestone", "spotlight", "reward", "event", "program"];
const LOCALES: Locale[] = ["ka", "en", "ru"];

// Every post shown on the feed must have all 3 site languages — this reads
// {titleKa, titleEn, titleRu} from the form and requires each to be filled in.
function readLocalized(body: Record<string, unknown>, field: string, maxLen: number): Localized | null {
  const out: Partial<Localized> = {};
  for (const l of LOCALES) {
    const raw = body[`${field}${l[0].toUpperCase()}${l.slice(1)}`];
    const val = typeof raw === "string" ? raw.trim().slice(0, maxLen) : "";
    if (!val) return null;
    out[l] = val;
  }
  return out as Localized;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = readLocalized(body, "title", 200);
  const text = readLocalized(body, "body", 2000);
  const tag: OfficialPostTag = VALID_TAGS.includes(body.tag) ? body.tag : "announcement";
  const imageUrl = typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;
  const ctaLabel = readLocalized(body, "ctaLabel", 60);
  const ctaHref = typeof body.ctaHref === "string" && body.ctaHref.trim() ? body.ctaHref.trim() : null;

  if (!title || !text) {
    return NextResponse.json({ error: "title_and_body_required_in_all_languages" }, { status: 400 });
  }

  const db = adminDb();
  const ref = await db.collection("officialPosts").add({
    tag,
    title,
    body: text,
    imageUrl,
    ctaLabel,
    ctaHref,
    authorName: null,
    authorPhotoURL: null,
    source: "admin",
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true, id: ref.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  await adminDb().collection("officialPosts").doc(id).delete();
  return NextResponse.json({ ok: true });
}
