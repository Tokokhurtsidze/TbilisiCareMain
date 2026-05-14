export function toMs(t: unknown): number {
  if (typeof t === "number") return t;
  if (t && typeof t === "object" && "toMillis" in t) {
    return (t as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export function relativeTime(ms: number, locale: string): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return locale === "ka" ? "ახლახან" : locale === "ru" ? "только что" : "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
