"use client";

import Link from "next/link";
import { BadgeCheck, ArrowRight, Megaphone, Trophy, Gift, CalendarDays, Star, Sparkles, GraduationCap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils";
import { TbilisiLogo } from "./TbilisiLogo";
import { UserAvatar } from "./UserAvatar";
import type { OfficialPost, OfficialPostTag } from "@/types";

const TAG_META: Record<OfficialPostTag, { tKey: string; Icon: typeof Megaphone; color: string }> = {
  announcement: { tKey: "officialPost.tag.announcement", Icon: Megaphone,    color: "text-brand bg-brand-soft border-brand/20" },
  milestone:    { tKey: "officialPost.tag.milestone",     Icon: Trophy,      color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30 dark:text-amber-400" },
  spotlight:    { tKey: "officialPost.tag.spotlight",     Icon: Star,        color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700/30 dark:text-purple-400" },
  reward:       { tKey: "officialPost.tag.reward",        Icon: Gift,        color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-400" },
  event:        { tKey: "officialPost.tag.event",         Icon: CalendarDays, color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700/30 dark:text-rose-400" },
  program:      { tKey: "officialPost.tag.program",       Icon: GraduationCap, color: "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-700/30 dark:text-teal-400" },
};

export function OfficialPostCard({ post }: { post: OfficialPost }) {
  const { t, locale } = useI18n();
  const meta = TAG_META[post.tag];
  const TagIcon = meta.Icon;

  const title = post.title[locale] ?? post.title.en;
  const body = post.body[locale] ?? post.body.en;
  const ctaLabel = post.ctaLabel ? post.ctaLabel[locale] ?? post.ctaLabel.en : null;

  return (
    <article className="rounded-2xl bg-surface-elevated border border-line overflow-hidden card-hover">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-line/60">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {post.authorPhotoURL ? (
            <UserAvatar src={post.authorPhotoURL} size={8} className="ring-2 ring-surface-base shrink-0" />
          ) : (
            <TbilisiLogo size={24} className="shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <p className="font-bold text-xs sm:text-sm leading-none text-ink-primary">{post.authorName ?? "TbilisiCare"}</p>
              <BadgeCheck size={13} className="text-brand shrink-0" fill="currentColor" />
            </div>
            <p className="text-[10px] sm:text-[11px] text-ink-secondary flex items-center gap-1 mt-0.5 leading-none whitespace-nowrap">
              {post.source === "ai" ? <Sparkles size={9} className="text-brand shrink-0" /> : null}
              <span>
                {post.source === "ai" ? t("officialPost.verifiedByAi") : t("officialPost.official")} · {relativeTime(post.createdAt, locale)}
              </span>
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${meta.color}`}>
          <TagIcon size={10} strokeWidth={2.2} className="shrink-0" />
          <span>{t(meta.tKey)}</span>
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
        <h3 className="font-extrabold text-base leading-snug mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-ink-secondary leading-relaxed">{body}</p>
      </div>

      {/* Stats */}
      {post.stats && post.stats.length > 0 && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {post.stats.map((s) => (
              <div
                key={s.label[locale] ?? s.label.en}
                className="rounded-xl bg-surface-subtle border border-line px-3 py-2.5 text-center"
              >
                <p className="font-extrabold text-base text-brand tabular-nums leading-tight">{s.value}</p>
                <p className="text-[10px] text-ink-secondary font-medium mt-0.5 uppercase tracking-wide">
                  {s.label[locale] ?? s.label.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA — external links (real City Hall / partner sites) open in a new tab */}
      {ctaLabel && post.ctaHref && (
        <div className="px-4 pb-4">
          {post.ctaHref.startsWith("http") ? (
            <a
              href={post.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-colors shadow-[var(--shadow-brand)]"
            >
              {ctaLabel}
              <ArrowRight size={15} strokeWidth={2.2} />
            </a>
          ) : (
            <Link
              href={post.ctaHref}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-colors shadow-[var(--shadow-brand)]"
            >
              {ctaLabel}
              <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
