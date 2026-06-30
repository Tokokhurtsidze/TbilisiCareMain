import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FileCheck, Users, Clock } from "lucide-react";
import { BulkWelcomeButton } from "./BulkWelcomeButton";

async function getStats() {
  const db = adminDb();
  const [pendingSnap, usersSnap, approvedSnap] = await Promise.all([
    db.collection("deeds").where("status", "==", "pending").count().get(),
    db.collection("users").count().get(),
    db.collection("deeds").where("status", "==", "approved").count().get(),
  ]);
  return {
    pending: pendingSnap.data().count,
    totalUsers: usersSnap.data().count,
    approved: approvedSnap.data().count,
  };
}

export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const stats = await getStats();

  const cards = [
    { label: "Pending Deeds", value: stats.pending, icon: Clock, color: "text-yellow-400" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Approved Deeds", value: stats.approved, icon: FileCheck, color: "text-green-400" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">
        Logged in as <span className="text-white">{session.email}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon size={20} className={color} />
              <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <p className="text-white text-4xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <BulkWelcomeButton />
    </div>
  );
}
