import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { isoWeekId } from "@/lib/week";
import { WeeklyChallengeForm } from "./WeeklyChallengeForm";
import { DeleteChallengeButton } from "./DeleteChallengeButton";

async function getChallenges() {
  const db = adminDb();
  const snap = await db.collection("weeklyChallenges").orderBy("createdAt", "desc").limit(20).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default async function AdminWeeklyChallengePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const challenges = await getChallenges();
  const currentWeek = isoWeekId();

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">Weekly Challenge</h1>

      <WeeklyChallengeForm currentWeek={currentWeek} />

      {challenges.length === 0 ? (
        <p className="text-gray-500">No weekly challenges yet.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-4 py-3">Week</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Task type</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Target</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Bonus</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(challenges as any[]).map((c) => (
                <tr key={c.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white">
                    {c.id} {c.id === currentWeek && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-blue-400">current</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{c.taskTypeId}</td>
                  <td className="px-4 py-3 text-gray-300">{c.targetCount}</td>
                  <td className="px-4 py-3 text-gray-300">+{c.bonusPoints} CP</td>
                  <td className="px-4 py-3">
                    <DeleteChallengeButton week={c.id} />
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
