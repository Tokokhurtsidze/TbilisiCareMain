"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen grid place-items-center text-ink-secondary">
        Loading…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <AppShell>{children}</AppShell>
      <BottomNav />
    </div>
  );
}
