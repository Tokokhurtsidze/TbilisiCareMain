"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  ShoppingBag,
  User,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SOCIAL_LINKS, INFO_LINKS } from "@/lib/site-links";
import { TbilisiLogo } from "@/components/TbilisiLogo";

const PRIMARY = [
  { href: "/app", icon: Home, key: "nav.home" },
  { href: "/app/leaderboard", icon: Trophy, key: "nav.leaderboard" },
  { href: "/app/submit", icon: PlusCircle, key: "nav.submit" },
  { href: "/app/marketplace", icon: ShoppingBag, key: "nav.market" },
  { href: "/app/profile", icon: User, key: "nav.profile" },
] as const;

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      <ul className="space-y-1">
        {PRIMARY.map(({ href, icon: Icon, key }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-brand text-white"
                    : "text-ink-primary hover:bg-surface-subtle"
                }`}
              >
                <Icon size={20} strokeWidth={1.7} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>

      <section>
        <p className="px-3 mb-2 text-[11px] uppercase tracking-widest text-ink-secondary font-semibold">
          {t("site.menu")}
        </p>
        <ul className="space-y-0.5">
          {INFO_LINKS.map((link) =>
            link.external ? (
              <li key={link.id}>
                <a
                  href={link.href}
                  onClick={onNavigate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle"
                >
                  <span className="flex items-center gap-2">
                    {link.id === "cityhall" && <TbilisiLogo size={18} />}
                    {t(link.labelKey)}
                  </span>
                  <ExternalLink size={13} className="opacity-60" />
                </a>
              </li>
            ) : (
              <li key={link.id}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="flex items-center px-3 py-2 rounded-lg text-sm text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle"
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ),
          )}
        </ul>
      </section>

      <section>
        <p className="px-3 mb-2 text-[11px] uppercase tracking-widest text-ink-secondary font-semibold">
          {t("site.follow")}
        </p>
        <ul className="flex gap-2 px-3 flex-wrap">
          {SOCIAL_LINKS.map(({ id, url, label, Icon }) => (
            <li key={id}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="h-10 w-10 grid place-items-center rounded-xl bg-surface-subtle hover:bg-brand-soft hover:text-brand transition"
              >
                <Icon size={18} strokeWidth={1.7} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="px-3 text-xs text-ink-secondary">{t("site.copyright")}</p>
    </nav>
  );
}
