"use client";

import { Sparkles, Camera, ShieldCheck, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  const { t } = useI18n();
  const steps = [
    { icon: Sparkles, body: t("page.about.how1") },
    { icon: Camera, body: t("page.about.how2") },
    { icon: ShieldCheck, body: t("page.about.how3") },
    { icon: Trophy, body: t("page.about.how4") },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("page.about.title")}</h1>
        <p className="text-ink-secondary mt-1">{t("page.about.tagline")}</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-2">{t("page.about.mission")}</h2>
        <p className="text-ink-secondary leading-relaxed">
          {t("page.about.missionBody")}
        </p>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("page.about.how")}</h2>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-line p-4"
            >
              <span className="h-8 w-8 rounded-lg bg-brand-soft text-brand grid place-items-center font-semibold">
                {i + 1}
              </span>
              <s.icon size={18} className="text-brand" />
              <span className="text-sm">{s.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("page.about.stats")}</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat n="10,124" label={t("page.about.stat1")} />
          <Stat n="48,210" label={t("page.about.stat2")} />
          <Stat n="6" label={t("page.about.stat3")} />
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-line p-4 text-center">
      <p className="text-2xl font-bold text-brand">{n}</p>
      <p className="text-xs text-ink-secondary mt-1">{label}</p>
    </div>
  );
}
