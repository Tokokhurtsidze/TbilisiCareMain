"use client";

import { Handshake, Sparkles, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils";
import { DEMO_NEWS, NEWS_GRADIENTS, type NewsItem } from "@/lib/demo-data";
import { TbilisiLogo } from "@/components/TbilisiLogo";

const ICONS = {
  partner: Handshake,
  milestone: Sparkles,
  event: Calendar,
} as const;

export default function NewsPage() {
  const { t, locale } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("page.news.title")}</h1>
        <p className="text-ink-secondary mt-1">{t("page.news.sub")}</p>
      </div>

      <div className="space-y-3">
        {DEMO_NEWS.map((n) => (
          <NewsRow
            key={n.id}
            item={n}
            ago={relativeTime(Date.now() - n.ageHours * 3600 * 1000, locale)}
          />
        ))}
      </div>
    </div>
  );
}

function NewsRow({ item, ago }: { item: NewsItem; ago: string }) {
  const { t } = useI18n();
  return (
    <article className="rounded-2xl overflow-hidden border border-line bg-surface-elevated flex">
      <div
        className={`w-24 sm:w-32 bg-gradient-to-br ${NEWS_GRADIENTS[item.category]} grid place-items-center shrink-0`}
      >
        {item.category === "city" ? (
          <div className="bg-white/95 rounded-full p-2 grid place-items-center">
            <TbilisiLogo size={42} />
          </div>
        ) : (
          (() => {
            const Icon = ICONS[item.category as keyof typeof ICONS];
            return <Icon size={32} className="text-white opacity-90" strokeWidth={1.5} />;
          })()
        )}
      </div>
      <div className="flex-1 p-4 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink-secondary font-semibold mb-1">
          {t(`news.cat.${item.category}`)} · {ago}
        </p>
        <h2 className="font-semibold leading-snug mb-1">{t(item.titleKey)}</h2>
        <p className="text-sm text-ink-secondary">{t(item.bodyKey)}</p>
      </div>
    </article>
  );
}
