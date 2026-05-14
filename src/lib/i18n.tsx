"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import ka from "@/locales/ka.json";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";
import type { Locale } from "@/types";

const DICTS: Record<Locale, Record<string, string>> = { ka, en, ru };

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ka");

  useEffect(() => {
    const saved = (typeof window !== "undefined"
      ? localStorage.getItem("locale")
      : null) as Locale | null;
    if (saved && DICTS[saved]) setLocaleState(saved);
    document.documentElement.lang = saved ?? "ka";
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    let str = DICTS[locale][key] ?? DICTS.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  };

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be inside I18nProvider");
  return v;
}
