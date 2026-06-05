"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Crown, Medal, Trophy } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { DEMO_USERS } from "@/lib/demo-data";
import type { UserDoc } from "@/types";

function Avatar({ user, size = 10 }: { user: UserDoc; size?: number }) {
  const cls = `h-${size} w-${size} rounded-full object-cover bg-surface-subtle`;
  return user.photoURL ? (
    <Image src={user.photoURL} alt="" width={size * 4} height={size * 4} className={cls} />
  ) : (
    <div className={`${cls} grid place-items-center text-ink-secondary font-bold text-sm`}>
      {user.fullName?.[0] ?? "?"}
    </div>
  );
}

function PodiumCard({
  user: u,
  rank,
  isYou,
  label,
}: {
  user: UserDoc;
  rank: 1 | 2 | 3;
  isYou: boolean;
  label: string;
}) {
  const rankClass = rank === 1 ? "rank-gold" : rank === 2 ? "rank-silver" : "rank-bronze";
  const isFirst = rank === 1;

  return (
    <div className={`flex flex-col items-center gap-2 animate-pop-in ${isFirst ? "stagger-1" : rank === 2 ? "" : "stagger-2"}`}>
      {isFirst && <Crown size={22} className="text-amber-400 animate-hero-float" />}
      <div className={`relative rounded-2xl border border-line bg-surface-elevated p-4 w-full text-center transition-all duration-200 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 ${isFirst ? "ring-2 ring-amber-400/40 shadow-[0_4px_20px_rgba(245,158,11,0.15)]" : ""}`}>
        <div className={`inline-flex h-7 w-7 rounded-full items-center justify-center text-xs font-extrabold mb-3 ${rankClass}`}>
          {rank}
        </div>
        <div className="flex justify-center mb-2">
          <Avatar user={u} size={isFirst ? 14 : 12} />
        </div>
        <p className="font-bold text-sm truncate leading-tight">{u.fullName}</p>
        {isYou && (
          <span className="text-[10px] text-brand font-bold">({label})</span>
        )}
        <p className="text-xs text-ink-secondary mt-0.5">{u.district ?? "Tbilisi"}</p>
        <p className={`font-extrabold mt-2 tabular-nums ${isFirst ? "text-xl text-brand" : "text-base text-ink-primary"}`}>
          {u.carePoints.toLocaleString()}
        </p>
      </div>
      {/* Podium base */}
      <div className={`w-full rounded-b-xl ${rankClass} ${isFirst ? "h-4" : "h-2"} opacity-70`} />
    </div>
  );
}

export default function LeaderboardPage() {
  const { t } = useI18n();
  const { user, userDoc } = useAuth();
  const [realRows, setRealRows] = useState<UserDoc[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db(), "users"),
          orderBy("carePoints", "desc"),
          limit(50),
        );
        const snap = await getDocs(q);
        setRealRows(snap.docs.map((d) => d.data() as UserDoc));
      } catch {
        setRealRows([]);
      }
    })();
  }, []);

  const map = new Map<string, UserDoc>();
  for (const u of DEMO_USERS) map.set(u.id, u);
  for (const u of realRows) map.set(u.id, u);
  if (user && userDoc) map.set(user.uid, { ...userDoc, id: user.uid });
  const rows = [...map.values()].sort((a, b) => b.carePoints - a.carePoints);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 50);
  const youLabel = t("leaderboard.you");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("leaderboard.title")}</h1>
        <span className="text-[10px] font-bold tracking-widest text-brand bg-brand-soft px-2 py-0.5 rounded-full">
          {t("demo.badge")}
        </span>
      </div>

      {/* Podium — top 3 */}
      {top3.length >= 3 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={17} className="text-brand" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-secondary">{t("leaderboard.top5")}</h2>
          </div>
          {/* 2nd | 1st | 3rd layout */}
          <div className="grid grid-cols-3 gap-2 items-end">
            <PodiumCard user={top3[1]} rank={2} isYou={top3[1].id === user?.uid} label={youLabel} />
            <PodiumCard user={top3[0]} rank={1} isYou={top3[0].id === user?.uid} label={youLabel} />
            <PodiumCard user={top3[2]} rank={3} isYou={top3[2].id === user?.uid} label={youLabel} />
          </div>
        </section>
      )}

      {/* Rest of top 50 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Medal size={17} className="text-brand" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-secondary">{t("leaderboard.top50")}</h2>
        </div>
        <ul className="rounded-2xl bg-surface-elevated border border-line divide-y divide-line overflow-hidden">
          {rest.map((u, i) => (
            <li
              key={u.id}
              className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-subtle ${
                u.id === user?.uid ? "bg-brand-soft" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-ink-secondary text-sm tabular-nums font-medium">{i + 4}</span>
                <Avatar user={u} size={8} />
                <div className="min-w-0">
                  <span className="truncate font-medium text-sm">{u.fullName}</span>
                  {u.id === user?.uid && (
                    <span className="ml-2 text-xs text-brand font-bold">({youLabel})</span>
                  )}
                  <p className="text-xs text-ink-secondary">{u.district ?? "Tbilisi"}</p>
                </div>
              </div>
              <span className="text-brand font-bold tabular-nums text-sm">{u.carePoints.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
