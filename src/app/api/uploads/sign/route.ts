import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { supabaseAdmin, PROOF_BUCKET } from "@/lib/supabase-admin";

type Body = {
  kind: "deed" | "avatar";
  deedId?: string;
  slot?: "before" | "after";
  contentType?: string;
};

export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const contentType = body.contentType || "";
  const ext = contentType.startsWith("video/") ? "mp4" : "jpg";

  let path: string;
  if (body.kind === "avatar") {
    path = `users/${uid}/photo.${ext}`;
  } else if (body.kind === "deed") {
    if (!body.deedId || (body.slot !== "before" && body.slot !== "after")) {
      return NextResponse.json({ error: "missing_deedId_or_slot" }, { status: 400 });
    }
    path = `deeds/${uid}/${body.deedId}/${body.slot}.${ext}`;
  } else {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  const bucket = supabaseAdmin().storage.from(PROOF_BUCKET);
  const { data, error } = await bucket.createSignedUploadUrl(path, { upsert: true });
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "sign_failed" }, { status: 500 });
  }

  const { data: pub } = bucket.getPublicUrl(path);
  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl: pub.publicUrl });
}
