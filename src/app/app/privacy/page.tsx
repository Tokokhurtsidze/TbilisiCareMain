"use client";

import { Lock, Database, Eye, MapPin, Share2, Trash2, Mail, Server, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t } = useI18n();

  const collected = [
    { label: t("privacy.c1.label"), detail: t("privacy.c1.detail") },
    { label: t("privacy.c2.label"), detail: t("privacy.c2.detail") },
    { label: t("privacy.c3.label"), detail: t("privacy.c3.detail") },
    { label: t("privacy.c4.label"), detail: t("privacy.c4.detail") },
    { label: t("privacy.c5.label"), detail: t("privacy.c5.detail") },
    { label: t("privacy.c6.label"), detail: t("privacy.c6.detail") },
  ];

  const useItems = [
    t("privacy.use.1"),
    t("privacy.use.2"),
    t("privacy.use.3"),
    t("privacy.use.4"),
    t("privacy.use.5"),
  ];

  const storeItems = [
    t("privacy.store.1"),
    t("privacy.store.2"),
    t("privacy.store.3"),
    t("privacy.store.4"),
    t("privacy.store.5"),
  ];

  const rights = [
    { Icon: Eye,    title: t("privacy.r1.title"), body: t("privacy.r1.body") },
    { Icon: Trash2, title: t("privacy.r2.title"), body: t("privacy.r2.body") },
    { Icon: Lock,   title: t("privacy.r3.title"), body: t("privacy.r3.body") },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0f7a55] via-[#0d6b4a] to-[#085c3e] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/15 grid place-items-center shrink-0">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{t("page.privacy.title")}</h1>
            <p className="text-white/70 text-sm mt-1">{t("page.privacy.updated")}</p>
            <p className="text-white/80 text-sm mt-3 leading-relaxed max-w-lg">{t("privacy.hero.desc")}</p>
          </div>
        </div>
      </div>

      {/* Data collected */}
      <div className="rounded-2xl border border-line bg-surface-elevated p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">
            <Database size={17} />
          </div>
          <h2 className="font-semibold">{t("privacy.collected.title")}</h2>
        </div>
        <div className="space-y-0">
          {collected.map(({ label, detail }) => (
            <div key={label} className="flex items-start gap-3 py-2.5 border-b border-line last:border-0 last:pb-0">
              <div className="h-2 w-2 rounded-full bg-brand mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-ink-secondary mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How we use + Storage */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface-elevated p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">
              <Eye size={17} />
            </div>
            <h2 className="font-semibold text-sm">{t("privacy.use.title")}</h2>
          </div>
          <ul className="space-y-2 text-sm text-ink-secondary">
            {useItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck size={13} className="text-brand mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface-elevated p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">
              <Server size={17} />
            </div>
            <h2 className="font-semibold text-sm">{t("privacy.store.title")}</h2>
          </div>
          <ul className="space-y-2 text-sm text-ink-secondary">
            {storeItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Lock size={13} className="text-brand mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Third parties */}
      <div className="rounded-2xl border border-line bg-surface-elevated p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">
            <Share2 size={17} />
          </div>
          <h2 className="font-semibold">{t("privacy.third.title")}</h2>
        </div>
        <p className="text-sm text-ink-secondary leading-relaxed">{t("privacy.third.body")}</p>
      </div>

      {/* GPS note */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0">
            <MapPin size={17} />
          </div>
          <div>
            <h2 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-1">{t("privacy.gps.title")}</h2>
            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">{t("privacy.gps.body")}</p>
          </div>
        </div>
      </div>

      {/* Rights */}
      <div>
        <h2 className="font-semibold mb-3">{t("privacy.rights.title")}</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {rights.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-line bg-surface-elevated p-4">
              <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center mb-3">
                <Icon size={17} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="rounded-2xl border border-line bg-surface-elevated p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">
            <Mail size={17} />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("privacy.contact.q")}</p>
            <p className="text-xs text-ink-secondary">{t("privacy.contact.sub")}</p>
          </div>
        </div>
        <Link href="/app/contact" className="text-sm font-semibold text-brand hover:underline underline-offset-2">
          {t("page.contact.title")} →
        </Link>
      </div>
    </div>
  );
}
