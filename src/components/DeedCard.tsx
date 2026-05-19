"use client";

import Link from "next/link";
import { MessageCircle, Award } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toMs, relativeTime } from "@/lib/utils";
import { LEVELS, type Deed } from "@/types";

export function DeedCard({ deed }: { deed: Deed }) {
  const { t, locale } = useI18n();
  const levelKey =
    LEVELS.find((l) => l.level === deed.authorLevel)?.key ?? "level.bystander";

  return (
    <article className="rounded-2xl bg-surface-elevated border border-line overflow-hidden deed-approved-shimmer card-hover">
      <header className="relative z-10 flex items-center gap-3 px-4 py-3.5">
        {deed.authorPhotoURL ? (
          <img
            src={deed.authorPhotoURL}
            alt=""
            className="h-10 w-10 rounded-full object-cover bg-surface-subtle ring-2 ring-surface-base"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-brand-soft grid place-items-center text-brand font-bold ring-2 ring-surface-base">
            {deed.authorName?.[0] ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate leading-tight">{deed.authorName}</p>
          <p className="text-xs text-ink-secondary mt-0.5">
            {t(levelKey)} · <span className="font-medium text-brand">{deed.authorPoints.toLocaleString()}</span> {t("home.points")}
          </p>
        </div>
        <time className="text-xs text-ink-secondary shrink-0">
          {relativeTime(toMs(deed.createdAt), locale)}
        </time>
      </header>

      {deed.caption && (
        <p className="relative z-10 px-4 pb-3 text-sm text-ink-primary whitespace-pre-wrap leading-relaxed">
          {deed.caption}
        </p>
      )}

      {deed.proofUrl ? (
        <Link href={`/app/deed/${deed.id}`} className="block bg-black relative">
          {deed.proofType === "video" ? (
            <video
              src={deed.proofUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[460px] bg-black"
            />
          ) : (
            <img
              src={deed.proofUrl}
              alt=""
              className="w-full max-h-[460px] object-cover bg-black"
              loading="lazy"
            />
          )}
        </Link>
      ) : (
        <Link
          href={`/app/deed/${deed.id}`}
          className="block bg-gradient-to-br from-brand-soft via-surface-elevated to-surface-subtle p-10 text-center hover:opacity-90 transition-opacity"
        >
          <div className="h-14 w-14 rounded-2xl bg-brand-soft border border-brand/20 grid place-items-center mx-auto mb-3">
            <Award size={28} className="text-brand" />
          </div>
          <p className="text-sm text-ink-secondary font-medium">{t("submit.noProof")}</p>
        </Link>
      )}

      <div className="relative z-10 px-4 py-3 flex items-center justify-between gap-3 border-t border-line/60">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-soft px-2.5 py-1.5 rounded-lg border border-brand/15 whitespace-nowrap">
            <Award size={12} strokeWidth={2} className="shrink-0" />
            {t(`task.${deed.taskTypeId}`)}
          </span>
          <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-lg whitespace-nowrap">
            +{deed.pointsAwarded} CP
          </span>
        </div>
        <Link
          href={`/app/deed/${deed.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-brand transition-colors font-medium shrink-0 whitespace-nowrap"
        >
          <MessageCircle size={14} />
          {deed.commentCount === 1
            ? t("deed.comment.one")
            : t("deed.comments", { n: deed.commentCount ?? 0 })}
        </Link>
      </div>
    </article>
  );
}
