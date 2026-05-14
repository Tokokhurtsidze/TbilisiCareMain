"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, ShoppingBag, User, PlusCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    { href: "/app", icon: Home, label: t("nav.home") },
    { href: "/app/leaderboard", icon: Trophy, label: t("nav.leaderboard") },
    { href: "/app/submit", icon: PlusCircle, label: t("nav.submit"), accent: true },
    { href: "/app/marketplace", icon: ShoppingBag, label: t("nav.market") },
    { href: "/app/profile", icon: User, label: t("nav.profile") },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-base/95 backdrop-blur border-t border-line"
      aria-label="Primary"
    >
      <ul className="max-w-xl mx-auto grid grid-cols-5">
        {items.map(({ href, icon: Icon, label, accent }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-1 py-2 min-h-[60px] ${
                  active ? "text-brand" : "text-ink-secondary"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={accent ? 32 : 24}
                  strokeWidth={1.7}
                  className={accent ? "text-brand" : ""}
                />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
