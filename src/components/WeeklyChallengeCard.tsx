"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getCountFromServer,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { Trash2, Dog, HeartHandshake, SprayCan, Trees, Flame } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { isoWeekId, weekStartMs } from "@/lib/week";
import { TASK_TYPES, type WeeklyChallenge } from "@/types";

const ICONS = {
  "trash-2": Trash2,
  dog: Dog,
  "heart-handshake": HeartHandshake,
  "spray-can": SprayCan,
  trees: Trees,
} as const;

export function WeeklyChallengeCard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [challenge, setChallenge] = useState<WeeklyChallenge | null | undefined>(undefined);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const week = isoWeekId();
    const unsub = onSnapshot(
      doc(db(), "weeklyChallenges", week),
      (snap) => setChallenge(snap.exists() ? ({ id: snap.id, ...snap.data() } as WeeklyChallenge) : null),
      () => setChallenge(null),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !challenge) return;
    const q = query(
      collection(db(), "deeds"),
      where("userId", "==", user.uid),
      where("taskTypeId", "==", challenge.taskTypeId),
      where("status", "==", "approved"),
      where("createdAt", ">=", Timestamp.fromMillis(weekStartMs())),
    );
    getCountFromServer(q)
      .then((snap) => setCount(snap.data().count))
      .catch(() => setCount(0));
  }, [user, challenge]);

  if (!challenge) return null;

  const iconKey = TASK_TYPES.find((tt) => tt.id === challenge.taskTypeId)?.icon as keyof typeof ICONS | undefined;
  const Icon = iconKey ? ICONS[iconKey] : Trees;
  const pct = Math.min(100, Math.round((count / challenge.targetCount) * 100));
  const done = count >= challenge.targetCount;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-brand-soft grid place-items-center shrink-0">
          <Icon size={18} className="text-brand" strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-ink-secondary font-semibold">{t("challenge.title")}</p>
          <p className="text-sm font-bold text-ink-primary truncate">{t(`task.${challenge.taskTypeId}`)}</p>
        </div>
      </div>
      <div className="flex justify-between text-xs text-ink-secondary mb-2">
        <span className="font-medium">{count} / {challenge.targetCount}</span>
        <span className="font-semibold text-brand">+{challenge.bonusPoints} CP</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {done && (
        <p className="flex items-center gap-1 text-xs text-warning font-semibold mt-2">
          <Flame size={12} /> {t("challenge.completed")}
        </p>
      )}
    </Card>
  );
}
