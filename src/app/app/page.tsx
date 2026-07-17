"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import {
  Trash2,
  Dog,
  HeartHandshake,
  SprayCan,
  Trees,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { OfficialPostCard } from "@/components/OfficialPostCard";
import { RealStoryCard } from "@/components/RealStoryCard";
import { NewsRail } from "@/components/NewsRail";
import { TASK_TYPES, LEVELS, levelFor, type OfficialPost } from "@/types";
import { DEMO_OFFICIAL_POSTS, SHOW_DEMO_CONTENT } from "@/lib/demo-data";
import type { CommunityFeedItem } from "@/app/api/community-feed/route";

const ICONS = {
  "trash-2": Trash2,
  dog: Dog,
  "heart-handshake": HeartHandshake,
  "spray-can": SprayCan,
  trees: Trees,
} as const;

type FeedItem =
  | { kind: "official"; id: string; ts: number; data: OfficialPost }
  | { kind: "story";    id: string; ts: number; data: CommunityFeedItem };

export default function HomePage() {
  const { userDoc } = useAuth();
  const { t } = useI18n();
  const [officialPosts, setOfficialPosts] = useState<OfficialPost[]>([]);
  const [communityStories, setCommunityStories] = useState<CommunityFeedItem[]>([]);

  useEffect(() => {
    fetch("/api/community-feed")
      .then((r) => r.json())
      .then((data) => setCommunityStories(data.items ?? []))
      .catch(() => {});
  }, []);

  // City Hall announcements + AI-generated deed-doer spotlights — the only
  // source of "posts" on the feed; there is no free-text user post feature,
  // and raw deed submissions are never shown directly (only via a spotlight).
  useEffect(() => {
    const q = query(
      collection(db(), "officialPosts"),
      orderBy("createdAt", "desc"),
      limit(30),
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setOfficialPosts(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as OfficialPost),
        ),
      () => setOfficialPosts([]),
    );
    return () => unsub();
  }, []);

  const feed: FeedItem[] = [
    ...officialPosts.map((o) => ({ kind: "official" as const, id: o.id, ts: o.createdAt, data: o })),
    ...(SHOW_DEMO_CONTENT ? DEMO_OFFICIAL_POSTS : []).map((o) => ({ kind: "official" as const, id: o.id, ts: o.createdAt, data: o })),
    ...communityStories.map((s) => ({ kind: "story" as const, id: s.id, ts: s.publishedAt, data: s })),
  ].sort((a, b) => b.ts - a.ts);

  const level = levelFor(userDoc?.carePoints ?? 0);
  const points = userDoc?.carePoints ?? 0;
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1);
  const xpPct = nextLevel
    ? Math.min(100, Math.round(((points - level.threshold) / (nextLevel.threshold - level.threshold)) * 100))
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-ink-secondary text-sm">{t("feed.you")}</p>
        {SHOW_DEMO_CONTENT && (
          <span className="text-[10px] font-bold tracking-widest text-brand bg-brand-soft px-2 py-0.5 rounded-full">
            {t("demo.badge")}
          </span>
        )}
      </div>

      {/* XP Card */}
      <Card className="deed-approved-shimmer">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`level-badge level-badge--${level.level}`}>
                {level.level}
              </div>
              <div>
                <p className="text-[11px] text-ink-secondary uppercase tracking-wider font-semibold">{t("home.level")}</p>
                <p className="font-bold text-ink-primary leading-tight">{t(level.key)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-ink-secondary uppercase tracking-wider font-semibold">{t("home.points")}</p>
              <p className="text-3xl font-extrabold text-brand tabular-nums leading-tight">
                {points.toLocaleString()}
              </p>
            </div>
          </div>

          {nextLevel ? (
            <div>
              <div className="flex justify-between text-xs text-ink-secondary mb-2">
                <span className="font-medium">{points.toLocaleString()} / {nextLevel.threshold.toLocaleString()} CP</span>
                <span className="font-semibold text-brand">{xpPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover xp-bar-fill"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <p className="text-xs text-ink-secondary mt-2">
                <span className="font-semibold text-ink-primary">{(nextLevel.threshold - points).toLocaleString()} CP</span>
                {" "}to {t(nextLevel.key)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-brand font-bold tracking-wide text-center pt-1">✦ MAX LEVEL ✦</p>
          )}
        </div>
      </Card>

      <section>
        <div className="grid grid-cols-5 gap-2">
          {TASK_TYPES.map((task) => {
            const Icon = ICONS[task.icon as keyof typeof ICONS];
            return (
              <Link
                key={task.id}
                href={`/app/submit?type=${task.id}`}
                className="rounded-xl bg-surface-elevated border border-line p-2.5 flex flex-col items-center gap-1.5 hover:border-brand hover:bg-brand-soft hover:shadow-[var(--shadow-md)] transition-all duration-200 group"
                title={t(`task.${task.id}`)}
              >
                <Icon size={22} className="text-brand group-hover:scale-110 transition-transform duration-200" strokeWidth={1.6} />
                <span className="text-[9px] font-semibold text-ink-secondary text-center leading-tight line-clamp-1">
                  {t(`task.${task.id}`)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <NewsRail />

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-secondary mb-3">{t("feed.title")}</h2>
        <div className="space-y-4">
          {feed.map((item) =>
            item.kind === "official" ? (
              <OfficialPostCard key={`o-${item.id}`} post={item.data} />
            ) : (
              <RealStoryCard key={`s-${item.id}`} item={item.data} />
            ),
          )}
        </div>
      </section>
    </div>
  );
}
