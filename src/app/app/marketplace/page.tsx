"use client";

import { useState } from "react";
import {
  Bus,
  Car,
  Coffee,
  Shirt,
  Ticket,
  Lock,
  Sticker,
  CheckCircle2,
  Copy,
  X,
} from "lucide-react";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { levelFor, type Reward } from "@/types";

type RewardItem = Reward & { icon: keyof typeof ICONS; descKey?: string };

const REWARDS: RewardItem[] = [
  {
    id: "demo-sticker",
    partnerId: "tbilisi-care",
    category: "apparel",
    nameKey: "reward.sticker",
    descKey: "reward.sticker.desc",
    costInPoints: 5,
    inventoryRemaining: 999,
    minUserLevel: 1,
    icon: "sticker",
  },
  {
    id: "coffee",
    partnerId: "partner-cafe",
    category: "food",
    nameKey: "reward.coffee",
    costInPoints: 10,
    inventoryRemaining: 80,
    minUserLevel: 1,
    icon: "coffee",
  },
  {
    id: "parking",
    partnerId: "city-hall",
    category: "parking",
    nameKey: "reward.parking",
    costInPoints: 15,
    inventoryRemaining: 50,
    minUserLevel: 1,
    icon: "car",
  },
  {
    id: "metro",
    partnerId: "city-hall",
    category: "transport",
    nameKey: "reward.metro",
    costInPoints: 20,
    inventoryRemaining: 999,
    minUserLevel: 1,
    icon: "bus",
  },
  {
    id: "cinema",
    partnerId: "partner-cinema",
    category: "events",
    nameKey: "reward.cinema",
    costInPoints: 30,
    inventoryRemaining: 25,
    minUserLevel: 1,
    icon: "ticket",
  },
  {
    id: "hoodie",
    partnerId: "partner-apparel",
    category: "apparel",
    nameKey: "reward.hoodie",
    costInPoints: 50,
    inventoryRemaining: 10,
    minUserLevel: 1,
    icon: "shirt",
  },
];

const ICONS = {
  sticker: Sticker,
  bus: Bus,
  car: Car,
  coffee: Coffee,
  shirt: Shirt,
  ticket: Ticket,
} as const;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 9; i++) {
    if (i === 3 || i === 6) out += "-";
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

type Stage =
  | { kind: "idle" }
  | { kind: "confirm"; reward: RewardItem }
  | { kind: "redeeming"; reward: RewardItem }
  | { kind: "success"; reward: RewardItem; code: string; balance: number }
  | { kind: "error"; message: string };

export default function MarketplacePage() {
  const { t } = useI18n();
  const { user, userDoc } = useAuth();
  const [stage, setStage] = useState<Stage>({ kind: "idle" });

  const points = userDoc?.carePoints ?? 0;
  const userLevel = levelFor(points).level;

  const redeem = async (reward: RewardItem) => {
    if (!user) return;
    setStage({ kind: "redeeming", reward });
    try {
      const code = generateCode();
      let newBalance = 0;
      await runTransaction(db(), async (tx) => {
        const userRef = doc(db(), "users", user.uid);
        const snap = await tx.get(userRef);
        const current = (snap.data()?.carePoints as number) ?? 0;
        if (current < reward.costInPoints) {
          throw new Error("not-enough");
        }
        newBalance = current - reward.costInPoints;
        tx.update(userRef, { carePoints: newBalance });
        const redemptionRef = doc(collection(db(), "redemptions"));
        tx.set(redemptionRef, {
          userId: user.uid,
          rewardId: reward.id,
          nameKey: reward.nameKey,
          costInPoints: reward.costInPoints,
          voucherCode: code,
          redeemedAt: serverTimestamp(),
        });
      });
      setStage({ kind: "success", reward, code, balance: newBalance });
    } catch (e) {
      const msg =
        (e as Error).message === "not-enough"
          ? t("market.notEnough")
          : (e as Error).message;
      setStage({ kind: "error", message: msg });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("market.title")}</h1>
        <span className="text-brand font-semibold">
          {points} {t("home.points")}
        </span>
      </div>

      <div className="grid gap-3">
        {REWARDS.map((r) => {
          const Icon = ICONS[r.icon];
          const locked = userLevel < r.minUserLevel;
          const out = r.inventoryRemaining <= 0;
          const cantAfford = points < r.costInPoints;
          return (
            <Card key={r.id}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-soft text-brand grid place-items-center">
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{t(r.nameKey)}</p>
                  <p className="text-sm text-ink-secondary">
                    {r.costInPoints} {t("home.points")}
                  </p>
                  {r.descKey && (
                    <p className="text-xs text-ink-secondary mt-0.5 italic">
                      {t(r.descKey)}
                    </p>
                  )}
                </div>
                {locked ? (
                  <Button variant="ghost" size="sm" disabled>
                    <Lock size={14} />
                    {t("market.locked", { level: r.minUserLevel })}
                  </Button>
                ) : out ? (
                  <Button variant="ghost" size="sm" disabled>
                    {t("market.out")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={cantAfford}
                    onClick={() => setStage({ kind: "confirm", reward: r })}
                  >
                    {t("market.redeem")}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {stage.kind !== "idle" && (
        <RedeemModal stage={stage} setStage={setStage} onConfirm={redeem} />
      )}
    </div>
  );
}

function RedeemModal({
  stage,
  setStage,
  onConfirm,
}: {
  stage: Exclude<Stage, { kind: "idle" }>;
  setStage: (s: Stage) => void;
  onConfirm: (r: RewardItem) => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const close = () => setStage({ kind: "idle" });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-5"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface-base border border-line p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label={t("market.success.close")}
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-lg hover:bg-surface-subtle"
        >
          <X size={18} />
        </button>

        {(stage.kind === "confirm" || stage.kind === "redeeming") && (
          <>
            <h2 className="text-lg font-bold mb-2">{t("market.confirm.title")}</h2>
            <p className="text-sm text-ink-secondary mb-5">
              {t("market.confirm.body", {
                cost: stage.reward.costInPoints,
                name: t(stage.reward.nameKey),
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={close}
                disabled={stage.kind === "redeeming"}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1"
                loading={stage.kind === "redeeming"}
                onClick={() => onConfirm(stage.reward)}
              >
                {t("market.confirm.confirm")}
              </Button>
            </div>
          </>
        )}

        {stage.kind === "success" && (
          <div className="text-center">
            <CheckCircle2 size={56} className="text-success mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-1">{t("market.success.title")}</h2>
            <p className="text-sm text-ink-secondary mb-4">
              {t(stage.reward.nameKey)} · {t("market.success.body")}
            </p>
            <div className="rounded-xl bg-surface-subtle border border-line p-4 mb-3">
              <p className="font-mono text-xl font-bold tracking-wider text-ink-primary">
                {stage.code}
              </p>
            </div>
            <p className="text-xs text-ink-secondary mb-4">
              {t("market.afterBalance", { balance: stage.balance })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(stage.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    /* noop */
                  }
                }}
              >
                <Copy size={14} />
                {copied ? t("market.success.copied") : t("market.success.copy")}
              </Button>
              <Button className="flex-1" onClick={close}>
                {t("market.success.close")}
              </Button>
            </div>
          </div>
        )}

        {stage.kind === "error" && (
          <>
            <h2 className="text-lg font-bold mb-2 text-danger">
              {stage.message}
            </h2>
            <Button className="w-full" onClick={close}>
              {t("market.success.close")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
