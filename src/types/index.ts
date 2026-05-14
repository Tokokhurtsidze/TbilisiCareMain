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
  photoURL: string | null;
  createdAt: number;
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
  cvConfidence: number | null;
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

export type Post = {
  id: string;
  userId: string;
  authorName: string;
  authorPhotoURL: string | null;
  authorPoints: number;
  authorLevel: number;
  text: string;
  mediaType: ProofType | null;
  mediaUrl: string | null;
  commentCount: number;
  createdAt: unknown;
  editedAt?: unknown;
};

export type TaskTypeId =
  | "litter"
  | "stray-feeding"
  | "senior-help"
  | "graffiti"
  | "tree-care";

export type TaskType = {
  id: TaskTypeId;
  basePoints: number;
  icon: string;
  maxDaily: number;
};

export const TASK_TYPES: TaskType[] = [
  { id: "litter", basePoints: 10, icon: "trash-2", maxDaily: 5 },
  { id: "stray-feeding", basePoints: 5, icon: "dog", maxDaily: 3 },
  { id: "senior-help", basePoints: 25, icon: "heart-handshake", maxDaily: 2 },
  { id: "graffiti", basePoints: 30, icon: "spray-can", maxDaily: 2 },
  { id: "tree-care", basePoints: 15, icon: "trees", maxDaily: 3 },
];

export type Reward = {
  id: string;
  partnerId: string;
  category: "transport" | "parking" | "apparel" | "food" | "events" | "sport";
  nameKey: string;
  costInPoints: number;
  inventoryRemaining: number;
  minUserLevel: number;
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
