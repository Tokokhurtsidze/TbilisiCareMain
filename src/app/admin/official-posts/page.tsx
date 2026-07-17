import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { OfficialPostForm } from "./OfficialPostForm";
import { DeletePostButton } from "./DeletePostButton";

async function getOfficialPosts() {
  const db = adminDb();
  const snap = await db.collection("officialPosts").limit(50).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export default async function AdminOfficialPostsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const posts = await getOfficialPosts();

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">Official Posts</h1>

      <OfficialPostForm />

      {posts.length === 0 ? (
        <p className="text-gray-500">No official posts yet.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-4 py-3">Title</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Tag</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Source</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Author</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Date</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(posts as any[]).map((p) => (
                <tr key={p.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white max-w-[280px] truncate">
                    {typeof p.title === "string" ? p.title : p.title?.en ?? p.title?.ka ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{p.tag}</td>
                  <td className="px-4 py-3 text-gray-300">{p.source ?? "admin"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.authorName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {typeof p.createdAt === "number" ? new Date(p.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <DeletePostButton id={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
