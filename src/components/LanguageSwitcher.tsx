"use client";

import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/types";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "ka", label: "ქართული" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-xl bg-surface-subtle p-1" role="group">
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          onClick={() => setLocale(o.code)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            locale === o.code
              ? "bg-surface-base text-brand shadow-sm"
              : "text-ink-secondary"
          }`}
          aria-pressed={locale === o.code}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
