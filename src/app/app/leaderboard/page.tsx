"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Crown, Medal } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { DEMO_USERS } from "@/lib/demo-data";
import type { UserDoc } from "@/types";

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

  // Merge real + demo, dedupe by id, sort by points desc.
  const map = new Map<string, UserDoc>();
  for (const u of DEMO_USERS) map.set(u.id, u);
  for (const u of realRows) map.set(u.id, u);
  if (user && userDoc) map.set(user.uid, { ...userDoc, id: user.uid });
  const rows = [...map.values()].sort((a, b) => b.carePoints - a.carePoints);

  const top5 = rows.slice(0, 5);
  const rest = rows.slice(5, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("leaderboard.title")}</h1>
        <span className="text-[10px] font-bold tracking-widest text-brand bg-brand-soft px-2 py-0.5 rounded-full">
          {t("demo.badge")}
        </span>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Crown size={18} className="text-brand" />
          <h2 className="font-semibold">{t("leaderboard.top5")}</h2>
        </div>
        <div className="space-y-2">
          {top5.map((u, i) => (
            <Card key={u.id} className="!p-4">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-brand text-white grid place-items-center font-bold">
                  {i + 1}
                </span>
                {u.photoURL ? (
                  <img
                    src={u.photoURL}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover bg-surface-subtle"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-surface-subtle" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {u.fullName}
                    {u.id === user?.uid && (
                      <span className="ml-2 text-xs text-brand font-semibold">
                        ({t("leaderboard.you")})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {u.district ?? "Tbilisi"}
                  </p>
                </div>
                <span className="text-brand font-bold">{u.carePoints}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Medal size={18} className="text-brand" />
          <h2 className="font-semibold">{t("leaderboard.top50")}</h2>
        </div>
        <ul className="rounded-2xl bg-surface-elevated border border-line divide-y divide-line">
          {rest.map((u, i) => (
            <li
              key={u.id}
              className={`flex items-center justify-between px-4 py-3 ${
                u.id === user?.uid ? "bg-brand-soft" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 text-ink-secondary text-sm tabular-nums">
                  {i + 6}
                </span>
                <span className="truncate">
                  {u.fullName}
                  {u.id === user?.uid && (
                    <span className="ml-2 text-xs text-brand font-semibold">
                      ({t("leaderboard.you")})
                    </span>
                  )}
                </span>
              </div>
              <span className="text-ink-primary font-semibold">{u.carePoints}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
