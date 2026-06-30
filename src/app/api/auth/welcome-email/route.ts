import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string = (body.email ?? "").trim();
    const name: string = (body.name ?? "").trim();

    if (!email) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    await sendWelcomeEmail(email, name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[welcome-email]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
