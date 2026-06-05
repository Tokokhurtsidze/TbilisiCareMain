"use client";

import { useEffect } from "react";

// Browser extensions (e.g. Honey, Grammarly) inject `bis_skin_checked` into
// DOM elements after SSR, causing React hydration warnings we cannot prevent.
// This component silences those specific warnings globally.
export function SuppressExtensionWarnings() {
  useEffect(() => {
    const orig = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (
        msg.includes("bis_skin_checked") ||
        msg.includes("bis_register") ||
        msg.includes("data-gr-") ||
        msg.includes("data-new-gr-") ||
        msg.includes("__processed_")
      ) return;
      orig(...args);
    };
    return () => {
      console.error = orig;
    };
  }, []);
  return null;
}
