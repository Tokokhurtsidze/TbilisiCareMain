"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
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
import { DeedCard } from "@/components/DeedCard";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { NewsRail } from "@/components/NewsRail";
import { TASK_TYPES, levelFor, type Deed, type Post } from "@/types";
import { DEMO_DEEDS, DEMO_POSTS } from "@/lib/demo-data";
import { toMs } from "@/lib/utils";

const ICONS = {
  "trash-2": Trash2,
  dog: Dog,
  "heart-handshake": HeartHandshake,
  "spray-can": SprayCan,
  trees: Trees,
} as const;

type FeedItem =
  | { kind: "deed"; id: string; ts: number; data: Deed }
  | { kind: "post"; id: string; ts: number; data: Post };

export default function HomePage() {
  const { userDoc } = useAuth();
  const { t } = useI18n();
  const [realDeeds, setRealDeeds] = useState<Deed[]>([]);
  const [realPosts, setRealPosts] = useState<Post[]>([]);

  useEffect(() => {
    const q = query(
      collection(db(), "deeds"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(30),
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setRealDeeds(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Deed),
        ),
      () => setRealDeeds([]),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db(), "posts"),
      orderBy("createdAt", "desc"),
      limit(30),
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setRealPosts(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Post),
        ),
      () => setRealPosts([]),
    );
    return () => unsub();
  }, []);

  const feed: FeedItem[] = [
    ...realDeeds.map((d) => ({ kind: "deed" as const, id: d.id, ts: toMs(d.createdAt), data: d })),
    ...DEMO_DEEDS.map((d) => ({ kind: "deed" as const, id: d.id, ts: toMs(d.createdAt), data: d })),
    ...realPosts.map((p) => ({ kind: "post" as const, id: p.id, ts: toMs(p.createdAt), data: p })),
    ...DEMO_POSTS.map((p) => ({ kind: "post" as const, id: p.id, ts: toMs(p.createdAt), data: p })),
  ].sort((a, b) => b.ts - a.ts);

  const level = levelFor(userDoc?.carePoints ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-ink-secondary text-sm">{t("feed.you")}</p>
        <span className="text-[10px] font-bold tracking-widest text-brand bg-brand-soft px-2 py-0.5 rounded-full">
          {t("demo.badge")}
        </span>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-secondary">{t("home.points")}</p>
            <p className="text-3xl font-bold text-brand">
              {userDoc?.carePoints ?? 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-secondary">{t("home.level")}</p>
            <p className="text-base font-semibold">{t(level.key)}</p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="text-base font-semibold mb-3">{t("home.today")}</h2>
        <div className="grid grid-cols-5 gap-2">
          {TASK_TYPES.map((task) => {
            const Icon = ICONS[task.icon as keyof typeof ICONS];
            return (
              <Link
                key={task.id}
                href={`/app/submit?type=${task.id}`}
                className="rounded-xl bg-surface-elevated border border-line p-2.5 flex flex-col items-center gap-1 hover:border-brand transition"
                title={t(`task.${task.id}`)}
              >
                <Icon size={22} className="text-brand" strokeWidth={1.6} />
                <span className="text-[10px] text-ink-secondary">
                  +{task.basePoints}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <NewsRail />

      <PostComposer />

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("feed.title")}</h2>
        <div className="space-y-4">
          {feed.map((item) =>
            item.kind === "deed" ? (
              <DeedCard key={`d-${item.id}`} deed={item.data} />
            ) : (
              <PostCard key={`p-${item.id}`} post={item.data} />
            ),
          )}
        </div>
      </section>
    </div>
  );
}
