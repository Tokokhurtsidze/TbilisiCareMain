// Streak + weekly-challenge date math, anchored to Asia/Tbilisi so a deed
// submitted near midnight doesn't get attributed to the wrong day/week
// depending on the server's or the client device's own timezone.

const TZ = "Asia/Tbilisi";

// "YYYY-MM-DD" for the given instant, as a calendar date in Asia/Tbilisi.
export function tbilisiDateStr(ts: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(ts));
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

// ISO week id (e.g. "2026-W03") for the given instant's Tbilisi calendar date.
export function isoWeekId(ts: number = Date.now()): string {
  const [y, m, d] = tbilisiDateStr(ts).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Epoch ms for the Monday 00:00 (Tbilisi) that starts the given instant's week.
// Used to scope "deeds this week" queries.
export function weekStartMs(ts: number = Date.now()): number {
  const [y, m, d] = tbilisiDateStr(ts).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum);
  return date.getTime();
}

export type StreakUpdate = {
  currentStreak: number;
  longestStreak: number;
  lastDeedDate: string;
  isNewDay: boolean;
};

// Pure function: given the user's existing streak state, what does today's
// approved deed do to it? One streak-worthy day per calendar day — a second
// deed on the same day doesn't inflate the streak further.
export function computeStreak(
  lastDeedDate: string | null,
  currentStreak: number,
  longestStreak: number,
  nowTs: number = Date.now(),
): StreakUpdate {
  const today = tbilisiDateStr(nowTs);
  if (lastDeedDate === today) {
    return { currentStreak, longestStreak, lastDeedDate: today, isNewDay: false };
  }
  const yesterday = addDays(today, -1);
  const next = lastDeedDate === yesterday ? currentStreak + 1 : 1;
  return {
    currentStreak: next,
    longestStreak: Math.max(longestStreak, next),
    lastDeedDate: today,
    isNewDay: true,
  };
}

// Bonus CarePoints awarded the moment a streak hits one of these lengths.
export const STREAK_MILESTONES: Record<number, number> = {
  3: 10,
  7: 25,
  30: 100,
};
