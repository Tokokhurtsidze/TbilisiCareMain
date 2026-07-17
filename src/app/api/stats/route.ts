import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Real, live platform numbers for the landing/about pages — replaces the
// hardcoded marketing figures ("10,124 citizens" etc.) that were never
// actually true. Citizens/deeds use Firestore's count() aggregation; total
// points is a running counter maintained in deed-admin.ts on every approval
// (Firestore has no server-side SUM aggregation).
export async function GET() {
  const db = adminDb();

  const [citizensSnap, deedsSnap, statsSnap] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("deeds").where("status", "==", "approved").count().get(),
    db.doc("stats/global").get(),
  ]);

  return NextResponse.json({
    citizens: citizensSnap.data().count,
    deeds: deedsSnap.data().count,
    points: statsSnap.data()?.totalPoints ?? 0,
    // District count is a fact about Tbilisi's structure, not a usage metric.
    districts: 6,
  });
}
