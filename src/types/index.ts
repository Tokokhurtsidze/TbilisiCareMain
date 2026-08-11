export type Locale = "ka" | "en" | "ru";

export type UserDoc = {
  id: string;
  fullName: string;
  preferredLocale: Locale;
  district: string | null;
  carePoints: number;
  level: number;
  reputationScore: number;
  elderMode: boolean;
  consentLeaderboard: boolean;
  // Opt-out for the AI auto-spotlight feature (publishes photo + name on an
  // approved deed). Off just skips the public post — points are unaffected.
  consentSpotlight: boolean;
  photoURL: string | null;
  createdAt: number;
  // Consecutive-day approved-deed streak — written server-only (Admin SDK)
  // in deed-admin.ts, same trust boundary as carePoints/level.
  currentStreak: number;
  longestStreak: number;
  // "YYYY-MM-DD" in Asia/Tbilisi of the last approved deed; null until the
  // user's first one. Day-granularity string, not a Timestamp, so streak
  // math never depends on time-of-day or the reader's own timezone.
  lastDeedDate: string | null;
};

export type DeedStatus = "pending" | "approved" | "rejected" | "review";

export type ProofType = "image" | "video";

export type Deed = {
  id: string;
  userId: string;
  authorName: string;
  authorPhotoURL: string | null;
  authorPoints: number;
  authorLevel: number;
  taskTypeId: TaskTypeId;
  status: DeedStatus;
  declaredLat: number | null;
  declaredLng: number | null;
  proofType: ProofType | null;
  proofUrl: string | null;
  proofBeforeUrl?: string | null;
  cvConfidence: number | null;
  rejectionReason?: string | null;
  // AI never auto-awards points — this is its recommendation for the admin
  // reviewing the "review" queue; null once a human has decided either way.
  aiRecommendation?: "approve" | "reject" | null;
  pointsAwarded: number;
  caption: string | null;
  commentCount: number;
  createdAt: unknown; // Firestore Timestamp or number
  validatedAt: unknown;
};

export type Comment = {
  id: string;
  userId: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  createdAt: unknown;
};

export type TaskTypeId =
  | "litter"
  | "stray-feeding"
  | "senior-help"
  | "graffiti"
  | "tree-care";

export type TaskType = {
  id: TaskTypeId;
  // There is no fixed payout — the AI vision check assesses the actual effort
  // and scale visible in the proof and awards a value inside this range.
  minPoints: number;
  maxPoints: number;
  icon: string;
  maxDaily: number;
  // Visual-change deeds require a before + after photo pair so AI can verify
  // the deed actually happened; others need only one proof shot.
  beforeAfter: boolean;
};

export const TASK_TYPES: TaskType[] = [
  { id: "litter", minPoints: 5, maxPoints: 20, icon: "trash-2", maxDaily: 5, beforeAfter: true },
  { id: "stray-feeding", minPoints: 3, maxPoints: 10, icon: "dog", maxDaily: 3, beforeAfter: false },
  { id: "senior-help", minPoints: 15, maxPoints: 40, icon: "heart-handshake", maxDaily: 2, beforeAfter: false },
  { id: "graffiti", minPoints: 20, maxPoints: 50, icon: "spray-can", maxDaily: 2, beforeAfter: true },
  { id: "tree-care", minPoints: 8, maxPoints: 25, icon: "trees", maxDaily: 3, beforeAfter: true },
];

export function midpointPoints(t: TaskType): number {
  return Math.round((t.minPoints + t.maxPoints) / 2);
}

export type OfficialPostTag =
  | "announcement"
  | "milestone"
  | "spotlight"
  | "reward"
  | "event"
  | "program";

// Every user-facing string on an OfficialPost must carry all 3 site languages —
// there is no on-the-fly translation, so text missing a locale renders blank.
export type Localized = Record<Locale, string>;

export type OfficialPost = {
  id: string;
  tag: OfficialPostTag;
  title: Localized;
  body: Localized;
  imageUrl?: string;
  stats?: { label: Localized; value: string }[];
  ctaLabel?: Localized;
  ctaHref?: string;
  createdAt: number;
  // Present on AI-generated deed-doer spotlights — renders the citizen's photo
  // instead of the TbilisiCare brand mark. Absent on hand-written City Hall posts.
  authorName?: string | null;
  authorPhotoURL?: string | null;
  source?: "admin" | "ai";
};

// Admin-authored, one per ISO week (doc id e.g. "2026-W03") — same
// hand-written pattern as OfficialPost, never AI-generated. Client reads it
// to render a progress bar; only the Admin SDK ever writes it.
export type WeeklyChallenge = {
  id: string;
  taskTypeId: TaskTypeId;
  targetCount: number;
  bonusPoints: number;
  createdAt: number;
};

export type Level = {
  level: number;
  threshold: number;
  key: string;
};

export const LEVELS: Level[] = [
  { level: 1, threshold: 0, key: "level.bystander" },
  { level: 2, threshold: 100, key: "level.neighbor" },
  { level: 3, threshold: 500, key: "level.active" },
  { level: 4, threshold: 2000, key: "level.pillar" },
  { level: 5, threshold: 5000, key: "level.hero" },
  { level: 6, threshold: 15000, key: "level.guardian" },
];

export function levelFor(points: number): Level {
  return [...LEVELS].reverse().find((l) => points >= l.threshold) ?? LEVELS[0];
}
