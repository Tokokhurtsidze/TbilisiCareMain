import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { LEVELS } from "@/types";

async function getUsers() {
  const db = adminDb();
  const snap = await db
    .collection("users")
    .orderBy("carePoints", "desc")
    .limit(100)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const users = await getUsers();

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">
        Users <span className="text-gray-500 text-lg font-normal">({users.length})</span>
      </h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-4 py-3">Name</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Points</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Level</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">District</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users as any[]).map((u) => {
              const levelLabel =
                LEVELS.find((l) => l.level === u.level)?.key ?? "—";
              return (
                <tr key={u.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white">{u.fullName || "—"}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono">{u.carePoints ?? 0}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{levelLabel}</td>
                  <td className="px-4 py-3 text-gray-400">{u.district ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {typeof u.createdAt === "number"
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
