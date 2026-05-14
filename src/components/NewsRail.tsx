"use client";

import { Newspaper, Handshake, Sparkles, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils";
import { DEMO_NEWS, NEWS_GRADIENTS, type NewsItem } from "@/lib/demo-data";
import { TbilisiLogo } from "@/components/TbilisiLogo";

const ICONS = {
  partner: Handshake,
  milestone: Sparkles,
  event: Calendar,
} as const;

export function NewsRail() {
  const { t, locale } = useI18n();
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold inline-flex items-center gap-2">
          <Newspaper size={18} className="text-brand" />
          {t("news.title")}
        </h2>
        <span className="text-xs text-ink-secondary">{t("news.sub")}</span>
      </div>

      <div
        className="-mx-5 px-5 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {DEMO_NEWS.map((n) => (
          <NewsCard key={n.id} item={n} ago={relativeTime(Date.now() - n.ageHours * 3600 * 1000, locale)} />
        ))}
      </div>
    </section>
  );
}

function NewsCard({ item, ago }: { item: NewsItem; ago: string }) {
  const { t } = useI18n();
  return (
    <article className="snap-start shrink-0 w-[260px] rounded-2xl border border-line overflow-hidden bg-surface-elevated">
      <div
        className={`h-28 bg-gradient-to-br ${NEWS_GRADIENTS[item.category]} grid place-items-center`}
      >
        {item.category === "city" ? (
          <div className="bg-white/95 rounded-full p-2 grid place-items-center">
            <TbilisiLogo size={42} />
          </div>
        ) : (
          (() => {
            const Icon = ICONS[item.category as keyof typeof ICONS];
            return <Icon size={36} className="text-white opacity-90" strokeWidth={1.5} />;
          })()
        )}
      </div>
      <div className="p-3">
        <p className="text-[11px] uppercase tracking-wide text-ink-secondary font-semibold mb-1">
          {t(`news.cat.${item.category}`)} · {ago}
        </p>
        <h3 className="font-semibold text-sm leading-snug mb-1">
          {t(item.titleKey)}
        </h3>
        <p className="text-xs text-ink-secondary line-clamp-3">{t(item.bodyKey)}</p>
      </div>
    </article>
  );
}
