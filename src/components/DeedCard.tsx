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
    <article className="rounded-2xl bg-surface-elevated border border-line overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        {deed.authorPhotoURL ? (
          <img
            src={deed.authorPhotoURL}
            alt=""
            className="h-10 w-10 rounded-full object-cover bg-surface-subtle"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-surface-subtle grid place-items-center text-ink-secondary font-semibold">
            {deed.authorName?.[0] ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{deed.authorName}</p>
          <p className="text-xs text-ink-secondary">
            {t(levelKey)} · {deed.authorPoints} {t("home.points")}
          </p>
        </div>
        <time className="text-xs text-ink-secondary">
          {relativeTime(toMs(deed.createdAt), locale)}
        </time>
      </header>

      {deed.caption && (
        <p className="px-4 pb-2 text-sm text-ink-primary whitespace-pre-wrap">
          {deed.caption}
        </p>
      )}

      {deed.proofUrl ? (
        <Link href={`/app/deed/${deed.id}`} className="block bg-black">
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
          className="block bg-gradient-to-br from-brand-soft to-surface-elevated p-8 text-center"
        >
          <Award size={36} className="text-brand mx-auto mb-2" />
          <p className="text-sm text-ink-secondary">{t("submit.noProof")}</p>
        </Link>
      )}

      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand bg-brand-soft px-2.5 py-1 rounded-full">
            <Award size={14} />
            {t(`task.${deed.taskTypeId}`)}
          </span>
          <span className="text-sm font-semibold text-success">
            {t("deed.points", { n: deed.pointsAwarded })}
          </span>
        </div>
        <Link
          href={`/app/deed/${deed.id}`}
          className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-brand"
        >
          <MessageCircle size={16} />
          {deed.commentCount === 1
            ? t("deed.comment.one")
            : t("deed.comments", { n: deed.commentCount ?? 0 })}
        </Link>
      </div>
    </article>
  );
}
