"use client";

import Link from "next/link";
import { BadgeCheck, ArrowRight, Megaphone, Trophy, Gift, CalendarDays, Star } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { TbilisiLogo } from "./TbilisiLogo";
import type { OfficialPost, OfficialPostTag } from "@/types";

const TAG_META: Record<OfficialPostTag, { label: string; Icon: typeof Megaphone; color: string }> = {
  announcement: { label: "Announcement", Icon: Megaphone,   color: "text-brand bg-brand-soft border-brand/20" },
  milestone:    { label: "Milestone",     Icon: Trophy,      color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30 dark:text-amber-400" },
  spotlight:    { label: "Spotlight",     Icon: Star,        color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700/30 dark:text-purple-400" },
  reward:       { label: "New Reward",    Icon: Gift,        color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-400" },
  event:        { label: "Event",         Icon: CalendarDays, color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700/30 dark:text-rose-400" },
};

export function OfficialPostCard({ post }: { post: OfficialPost }) {
  const meta = TAG_META[post.tag];
  const TagIcon = meta.Icon;

  return (
    <article className="rounded-2xl bg-surface-elevated border border-line overflow-hidden card-hover">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-line/60">
        <div className="h-10 w-10 rounded-xl bg-brand grid place-items-center shrink-0 shadow-[var(--shadow-brand)]">
          <TbilisiLogo size={28} className="brightness-0 invert" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm leading-tight">TbilisiCare</p>
            <BadgeCheck size={15} className="text-brand shrink-0" fill="currentColor" />
          </div>
          <p className="text-xs text-ink-secondary">Official · {relativeTime(post.createdAt, "en")}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${meta.color}`}>
          <TagIcon size={11} strokeWidth={2.2} />
          {meta.label}
        </span>
      </header>

      {/* Image */}
      {post.imageUrl && (
        <div className="relative overflow-hidden" style={{ maxHeight: 280 }}>
          <img
            src={post.imageUrl}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: 280 }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Body */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="font-extrabold text-base leading-snug mb-2 tracking-tight">{post.title}</h3>
        <p className="text-sm text-ink-secondary leading-relaxed">{post.body}</p>
      </div>

      {/* Stats */}
      {post.stats && post.stats.length > 0 && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {post.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-surface-subtle border border-line px-3 py-2.5 text-center"
              >
                <p className="font-extrabold text-base text-brand tabular-nums leading-tight">{s.value}</p>
                <p className="text-[10px] text-ink-secondary font-medium mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {post.ctaLabel && post.ctaHref && (
        <div className="px-4 pb-4">
          <Link
            href={post.ctaHref}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-colors shadow-[var(--shadow-brand)]"
          >
            {post.ctaLabel}
            <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>
      )}
    </article>
  );
}
