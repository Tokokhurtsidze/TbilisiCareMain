import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { sendWelcomeEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all Firebase Auth users (handles pagination)
    const sent: string[] = [];
    const failed: string[] = [];
    let pageToken: string | undefined;

    do {
      const result = await adminAuth().listUsers(1000, pageToken);
      pageToken = result.pageToken;

      for (const user of result.users) {
        if (!user.email) continue;
        try {
          const userDoc = await adminDb().collection("users").doc(user.uid).get();
          const name = userDoc.exists ? (userDoc.data()?.fullName ?? "") : (user.displayName ?? "");
          await sendWelcomeEmail(user.email, name);
          sent.push(user.email);
        } catch (e) {
          console.error("[bulk-welcome] failed for", user.email, e);
          failed.push(user.email);
        }
      }
    } while (pageToken);

    return NextResponse.json({ ok: true, sent: sent.length, failed: failed.length, failedEmails: failed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[bulk-welcome]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
