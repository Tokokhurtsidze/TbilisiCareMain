"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Menu,
  X,
  User,
  Home,
  PlusCircle,
  Trophy,
  ShoppingBag,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "./AppSidebar";
import { TbilisiLogo } from "./TbilisiLogo";

const HEADER_LINKS: { href: string; Icon: LucideIcon; key: string }[] = [
  { href: "/app", Icon: Home, key: "nav.home" },
  { href: "/app/submit", Icon: PlusCircle, key: "nav.submit" },
  { href: "/app/leaderboard", Icon: Trophy, key: "nav.leaderboard" },
  { href: "/app/marketplace", Icon: ShoppingBag, key: "nav.market" },
  { href: "/app/news", Icon: Newspaper, key: "site.news" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { userDoc } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface-base/95 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto h-14 flex items-center px-4 gap-3">
          <button
            className="md:hidden h-10 w-10 grid place-items-center rounded-lg hover:bg-surface-subtle"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("site.menu")}
          >
            <Menu size={22} />
          </button>

          <Link href="/app" className="flex items-center gap-2 mr-auto">
            <TbilisiLogo size={36} className="shrink-0" />
            <span className="font-semibold">{t("app.name")}</span>
            <span className="ml-2 text-[10px] font-bold tracking-widest text-brand bg-brand-soft px-2 py-0.5 rounded-full">
              {t("demo.badge")}
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-1 mr-3"
            aria-label="Quick links"
          >
            {HEADER_LINKS.map(({ href, Icon, key }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  title={t(key)}
                  aria-label={t(key)}
                  aria-current={active ? "page" : undefined}
                  className={`h-10 w-10 grid place-items-center rounded-xl transition ${
                    active
                      ? "bg-brand text-white"
                      : "text-ink-secondary hover:bg-surface-subtle hover:text-brand"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.7} />
                </Link>
              );
            })}
          </nav>

          <Link
            href="/app/profile"
            className="h-9 w-9 rounded-full bg-surface-subtle grid place-items-center overflow-hidden hover:ring-2 hover:ring-brand transition"
            aria-label={t("profile.title")}
          >
            {userDoc?.photoURL ? (
              <img
                src={userDoc.photoURL}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={18} className="text-ink-secondary" />
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto md:flex md:gap-6 px-4 md:px-6">
        <aside className="hidden md:block w-60 shrink-0 pt-6">
          <div className="sticky top-20">
            <AppSidebar />
          </div>
        </aside>

        <main
          className={`flex-1 min-w-0 max-w-2xl mx-auto md:mx-0 w-full pt-6 pb-24 md:pb-10 ${
            userDoc?.elderMode ? "elder-mode" : ""
          }`}
        >
          {children}
        </main>
      </div>

      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85%] z-50 bg-surface-base border-r border-line transition-transform ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label={t("site.menu")}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-line">
          <span className="font-semibold">{t("site.menu")}</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="h-10 w-10 grid place-items-center rounded-lg hover:bg-surface-subtle"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-3.5rem)]">
          <AppSidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>
    </>
  );
}
