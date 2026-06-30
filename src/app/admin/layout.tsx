"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileCheck, Users, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/deeds", label: "Deeds", icon: FileCheck, exact: false },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Login page renders standalone — no sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <p className="text-white font-bold text-sm">TbilisiCare</p>
          <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
