"use client";

import {
  FileText,
  ShieldAlert,
  Coins,
  Ban,
  RefreshCw,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useI18n();

  const neverItems = [
    t("terms.never.1"),
    t("terms.never.2"),
    t("terms.never.3"),
    t("terms.never.4"),
  ];

  const sections = [
    {
      Icon: CheckCircle2,
      title: t("terms.s1.title"),
      body: t("terms.s1.body"),
    },
    {
      Icon: ShieldAlert,
      title: t("terms.s2.title"),
      items: [
        t("terms.s2.1"),
        t("terms.s2.2"),
        t("terms.s2.3"),
        t("terms.s2.4"),
        t("terms.s2.5"),
      ],
    },
    {
      Icon: Coins,
      title: t("terms.s3.title"),
      items: [
        t("terms.s3.1"),
        t("terms.s3.2"),
        t("terms.s3.3"),
        t("terms.s3.4"),
        t("terms.s3.5"),
      ],
    },
    {
      Icon: Ban,
      title: t("terms.s4.title"),
      body: t("terms.s4.body"),
    },
    {
      Icon: RefreshCw,
      title: t("terms.s5.title"),
      body: t("terms.s5.body"),
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-brand via-[#0063f7] to-brand-hover p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/15 grid place-items-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{t("page.terms.title")}</h1>
            <p className="text-white/70 text-sm mt-1">{t("page.terms.updated")}</p>
            <p className="text-white/80 text-sm mt-3 leading-relaxed max-w-lg">{t("terms.hero.desc")}</p>
          </div>
        </div>
      </div>

      {/* Never do this */}
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <XCircle size={18} className="text-red-500 shrink-0" />
          <h2 className="font-semibold text-red-700 dark:text-red-400 text-sm uppercase tracking-wide">
            {t("terms.never.title")}
          </h2>
        </div>
        <ul className="space-y-2">
          {neverItems.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-red-700 dark:text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map(({ Icon, title, body, items }) => (
          <div key={title} className="rounded-2xl border border-line bg-surface-elevated p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">
                <Icon size={17} />
              </div>
              <h2 className="font-semibold">{title}</h2>
            </div>
            {body && <p className="text-sm text-ink-secondary leading-relaxed">{body}</p>}
            {items && (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                    <CheckCircle2 size={14} className="text-brand mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="rounded-2xl border border-line bg-surface-elevated p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">
            <Mail size={17} />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("terms.contact.q")}</p>
            <p className="text-xs text-ink-secondary">{t("terms.contact.sub")}</p>
          </div>
        </div>
        <Link href="/app/contact" className="text-sm font-semibold text-brand hover:underline underline-offset-2">
          {t("page.contact.title")} →
        </Link>
      </div>
    </div>
  );
}
