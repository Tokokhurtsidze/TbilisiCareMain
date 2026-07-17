import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { DeedActions } from "./DeedActions";

type FilterTab = "pending" | "review" | "approved" | "rejected";

async function getDeeds(filter: FilterTab) {
  const db = adminDb();
  const snap = await db
    .collection("deeds")
    .where("status", "==", filter)
    .limit(50)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export default async function AdminDeedsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const filter = (["pending", "review", "approved", "rejected"].includes(
    searchParams.filter ?? ""
  )
    ? searchParams.filter
    : "review") as FilterTab;

  const deeds = await getDeeds(filter);
  const tabs: FilterTab[] = ["review", "pending", "approved", "rejected"];

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">Deed Moderation</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <a
            key={tab}
            href={`/admin/deeds?filter=${tab}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </a>
        ))}
      </div>

      {deeds.length === 0 ? (
        <p className="text-gray-500">No {filter} deeds.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-4 py-3">Author</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Type</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Points</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Proof</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">AI recommends</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">AI confidence</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">AI note</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Date</th>
                {(filter === "pending" || filter === "review") && (
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(deeds as any[]).map((deed) => (
                <tr
                  key={deed.id}
                  className={`border-b border-gray-800 last:border-0 ${
                    deed.aiRecommendation === "approve"
                      ? "bg-green-950/20"
                      : deed.aiRecommendation === "reject"
                        ? "bg-red-950/20"
                        : ""
                  }`}
                >
                  <td className="px-4 py-3 text-white">{deed.authorName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{deed.taskTypeId}</td>
                  <td className="px-4 py-3 text-gray-300">{deed.pointsAwarded}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {deed.proofBeforeUrl && (
                        <a
                          href={deed.proofBeforeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs"
                        >
                          Before
                        </a>
                      )}
                      {deed.proofUrl ? (
                        <a
                          href={deed.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs"
                        >
                          {deed.proofBeforeUrl ? "After" : "View"}
                        </a>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {deed.aiRecommendation === "approve" ? (
                      <span className="text-xs font-medium text-green-400">Approve · {deed.pointsAwarded} CP</span>
                    ) : deed.aiRecommendation === "reject" ? (
                      <span className="text-xs font-medium text-red-400">Reject</span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {typeof deed.cvConfidence === "number"
                      ? `${Math.round(deed.cvConfidence * 100)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate">
                    {deed.rejectionReason ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {typeof deed.createdAt === "number"
                      ? new Date(deed.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  {(filter === "pending" || filter === "review") && (
                    <td className="px-4 py-3">
                      <DeedActions deedId={deed.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
