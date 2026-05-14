"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useI18n } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-surface-subtle text-ink-primary hover:bg-brand-soft transition"
      aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      <span className="text-sm font-medium">
        {theme === "dark" ? t("theme.light") : t("theme.dark")}
      </span>
    </button>
  );
}
