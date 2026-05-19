"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import type { CommunityFeedItem } from "@/app/api/community-feed/route";

const SOURCE_COLORS: Record<string, string> = {
  "OC Media":      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-700/30",
  "Civil Georgia": "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-900/20 dark:border-sky-700/30",
};

export function RealStoryCard({ item }: { item: CommunityFeedItem }) {
  const badgeClass = SOURCE_COLORS[item.source] ?? "text-ink-secondary bg-surface-subtle border-line";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl bg-surface-elevated border border-line overflow-hidden card-hover focus-visible:ring-2 focus-visible:ring-brand"
      aria-label={item.title}
    >
      {/* Image */}
      {item.imageUrl && (
        <div className="relative overflow-hidden" style={{ maxHeight: 220 }}>
          <img
            src={item.imageUrl}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: 220 }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-3.5 pb-4">
        {/* Source + date row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg border ${badgeClass}`}>
            <Newspaper size={10} strokeWidth={2.2} />
            {item.source}
          </span>
          <time className="text-xs text-ink-secondary">
            {relativeTime(item.publishedAt, "en")}
          </time>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm leading-snug mb-1.5 text-ink-primary group-hover:text-brand transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}

        {/* Read more */}
        <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-brand">
          Read full story
          <ExternalLink size={11} strokeWidth={2.2} />
        </div>
      </div>
    </a>
  );
}
