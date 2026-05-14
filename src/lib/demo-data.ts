import type { Comment, Deed, Post, ProofType, UserDoc } from "@/types";

const av = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

// Public sample videos (Google CDN, stable for years, small enough for demo).
const V = {
  street:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  park:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  city:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  short:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
};

// Public sample photos (Unsplash CDN, stable IDs).
const P = {
  trash:
    "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=900&auto=format&fit=crop",
  tree:
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&auto=format&fit=crop",
  stray:
    "https://images.unsplash.com/photo-1494256997604-768d1f608cac?w=900&auto=format&fit=crop",
};

export const DEMO_USERS: UserDoc[] = [
  {
    id: "demo-u1",
    fullName: "Giorgi Beridze",
    preferredLocale: "ka",
    district: "Vake",
    carePoints: 18420,
    level: 6,
    reputationScore: 92,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("giorgi-beridze"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 220,
  },
  {
    id: "demo-u2",
    fullName: "Nino Kapanadze",
    preferredLocale: "ka",
    district: "Saburtalo",
    carePoints: 12780,
    level: 5,
    reputationScore: 89,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("nino-kapanadze"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
  },
  {
    id: "demo-u3",
    fullName: "Levan Tsiklauri",
    preferredLocale: "ka",
    district: "Old Tbilisi",
    carePoints: 9450,
    level: 5,
    reputationScore: 87,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("levan-tsiklauri"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 160,
  },
  {
    id: "demo-u4",
    fullName: "Mariam Khelaia",
    preferredLocale: "en",
    district: "Vake",
    carePoints: 7320,
    level: 5,
    reputationScore: 85,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("mariam-khelaia"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 140,
  },
  {
    id: "demo-u5",
    fullName: "Davit Maisuradze",
    preferredLocale: "ka",
    district: "Isani",
    carePoints: 5610,
    level: 5,
    reputationScore: 80,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("davit-maisuradze"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
  },
  {
    id: "demo-u6",
    fullName: "Tamar Gelashvili",
    preferredLocale: "ka",
    district: "Saburtalo",
    carePoints: 3940,
    level: 4,
    reputationScore: 78,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("tamar-gelashvili"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100,
  },
  {
    id: "demo-u7",
    fullName: "Nika Chkheidze",
    preferredLocale: "ka",
    district: "Gldani",
    carePoints: 2870,
    level: 4,
    reputationScore: 74,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("nika-chkheidze"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 80,
  },
  {
    id: "demo-u8",
    fullName: "Salome Lortkipanidze",
    preferredLocale: "ka",
    district: "Vake",
    carePoints: 2210,
    level: 4,
    reputationScore: 72,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("salome-lortkipanidze"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 70,
  },
  {
    id: "demo-u9",
    fullName: "Irakli Gogichaishvili",
    preferredLocale: "ka",
    district: "Saburtalo",
    carePoints: 1480,
    level: 3,
    reputationScore: 68,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("irakli-gogichaishvili"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
  },
  {
    id: "demo-u10",
    fullName: "Tinatin Bagrationi",
    preferredLocale: "ru",
    district: "Old Tbilisi",
    carePoints: 980,
    level: 3,
    reputationScore: 65,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("tinatin-bagrationi"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
  },
  {
    id: "demo-u11",
    fullName: "Avto Kobakhidze",
    preferredLocale: "ka",
    district: "Isani",
    carePoints: 720,
    level: 2,
    reputationScore: 60,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("avto-kobakhidze"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
  },
  {
    id: "demo-u12",
    fullName: "Ana Tatarashvili",
    preferredLocale: "en",
    district: "Vake",
    carePoints: 410,
    level: 2,
    reputationScore: 58,
    elderMode: false,
    consentLeaderboard: true,
    photoURL: av("ana-tatarashvili"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
];

const userById = (id: string) => DEMO_USERS.find((u) => u.id === id)!;

function makeDeed(
  id: string,
  userId: string,
  taskTypeId: Deed["taskTypeId"],
  points: number,
  proofType: ProofType,
  proofUrl: string,
  caption: string | null,
  hoursAgo: number,
  commentCount: number,
): Deed {
  const u = userById(userId);
  return {
    id,
    userId,
    authorName: u.fullName,
    authorPhotoURL: u.photoURL,
    authorPoints: u.carePoints,
    authorLevel: u.level,
    taskTypeId,
    status: "approved",
    declaredLat: 41.7151 + Math.random() * 0.05,
    declaredLng: 44.8271 + Math.random() * 0.05,
    proofType,
    proofUrl,
    cvConfidence: 0.93,
    pointsAwarded: points,
    caption,
    commentCount,
    createdAt: Date.now() - 1000 * 60 * 60 * hoursAgo,
    validatedAt: Date.now() - 1000 * 60 * 60 * hoursAgo + 90 * 1000,
  };
}

export const DEMO_DEEDS: Deed[] = [
  makeDeed("demo-d1", "demo-u1", "litter", 15, "video", V.street, "Cleaned the corner by Vake park entrance 💪", 2, 3),
  makeDeed("demo-d2", "demo-u2", "stray-feeding", 5, "image", P.stray, "Same little friend, every morning.", 5, 2),
  makeDeed("demo-d3", "demo-u4", "tree-care", 15, "image", P.tree, "Watered the lindens on Chavchavadze ave.", 9, 1),
  makeDeed("demo-d4", "demo-u3", "graffiti", 60, "video", V.short, "Heritage zone cleanup near Sioni — 3 hours well spent.", 14, 4),
  makeDeed("demo-d5", "demo-u6", "senior-help", 25, "video", V.park, "Grocery run for babo Tamuna 💙", 22, 2),
  makeDeed("demo-d6", "demo-u8", "litter", 10, "image", P.trash, null, 30, 0),
];

function makeComment(
  id: string,
  userId: string,
  text: string,
  hoursAgo: number,
): Comment {
  const u = userById(userId);
  return {
    id,
    userId,
    authorName: u.fullName,
    authorPhotoURL: u.photoURL,
    text,
    createdAt: Date.now() - 1000 * 60 * 60 * hoursAgo,
  };
}

export const DEMO_COMMENTS: Record<string, Comment[]> = {
  "demo-d1": [
    makeComment("c1", "demo-u2", "Beautiful work, Vake looks cleaner already!", 1.5),
    makeComment("c2", "demo-u5", "Joining you next weekend.", 1),
    makeComment("c3", "demo-u9", "ბრავო! 👏", 0.5),
  ],
  "demo-d2": [
    makeComment("c4", "demo-u4", "These dogs deserve all the love.", 4),
    makeComment("c5", "demo-u7", "Where is this? I'll bring food too.", 3),
  ],
  "demo-d3": [
    makeComment("c6", "demo-u1", "The lindens by the boulevard, right?", 8),
  ],
  "demo-d4": [
    makeComment("c7", "demo-u2", "Heritage zone — double points well earned.", 13),
    makeComment("c8", "demo-u10", "Молодец!", 12),
    makeComment("c9", "demo-u6", "How long did this take?", 10),
    makeComment("c10", "demo-u3", "About 3 hours. Worth every minute.", 9),
  ],
  "demo-d5": [
    makeComment("c11", "demo-u12", "This is what community looks like.", 20),
    makeComment("c12", "demo-u8", "Babo Tamuna is everyone's grandma 💙", 18),
  ],
  "demo-d6": [],
};

// ---- Posts ----

function makePost(
  id: string,
  userId: string,
  text: string,
  hoursAgo: number,
  commentCount: number,
  media?: { type: ProofType; url: string },
): Post {
  const u = userById(userId);
  return {
    id,
    userId,
    authorName: u.fullName,
    authorPhotoURL: u.photoURL,
    authorPoints: u.carePoints,
    authorLevel: u.level,
    text,
    mediaType: media?.type ?? null,
    mediaUrl: media?.url ?? null,
    commentCount,
    createdAt: Date.now() - 1000 * 60 * 60 * hoursAgo,
  };
}

export const DEMO_POSTS: Post[] = [
  makePost(
    "demo-p1",
    "demo-u2",
    "Reminder: heavy rain forecast for the weekend — check on neighbors with leaky roofs in Old Tbilisi 🌧️",
    1,
    2,
  ),
  makePost(
    "demo-p2",
    "demo-u4",
    "Just redeemed 100 CP for a free coffee at Coffeesta on Chavchavadze. Small thing, big smile.",
    4,
    1,
    { type: "image", url: P.tree },
  ),
  makePost(
    "demo-p3",
    "demo-u1",
    "Anyone want to organize a Sunday cleanup in Mtatsminda Park? DM me, we'll bring extra gloves and bags.",
    10,
    3,
  ),
  makePost(
    "demo-p4",
    "demo-u10",
    "Видела сегодня значок Tbilisi Care на пальто прохожего — приятно. Чувствую, что нас становится больше.",
    24,
    0,
  ),
];

export const DEMO_POST_COMMENTS: Record<string, Comment[]> = {
  "demo-p1": [
    makeComment("pc1", "demo-u5", "Already checked on babo Nato — she's fine. Roof tiles holding.", 0.8),
    makeComment("pc2", "demo-u8", "Thanks for the heads up 💙", 0.5),
  ],
  "demo-p2": [
    makeComment("pc3", "demo-u7", "The rewards are starting to feel real — nice!", 3),
  ],
  "demo-p3": [
    makeComment("pc4", "demo-u6", "Count me in, what time?", 8),
    makeComment("pc5", "demo-u1", "10am at the funicular base. See you there!", 7),
    makeComment("pc6", "demo-u9", "I'll bring water for everyone.", 6),
  ],
  "demo-p4": [],
};

// ---- News ----

export type NewsItem = {
  id: string;
  category: "city" | "partner" | "milestone" | "event";
  titleKey: string;
  bodyKey: string;
  ageHours: number;
};

export const DEMO_NEWS: NewsItem[] = [
  {
    id: "n1",
    category: "city",
    titleKey: "news.pilot.title",
    bodyKey: "news.pilot.body",
    ageHours: 6,
  },
  {
    id: "n2",
    category: "milestone",
    titleKey: "news.milestone.title",
    bodyKey: "news.milestone.body",
    ageHours: 36,
  },
  {
    id: "n3",
    category: "partner",
    titleKey: "news.partner.title",
    bodyKey: "news.partner.body",
    ageHours: 72,
  },
  {
    id: "n4",
    category: "event",
    titleKey: "news.cotyOpen.title",
    bodyKey: "news.cotyOpen.body",
    ageHours: 110,
  },
];

export const NEWS_GRADIENTS: Record<NewsItem["category"], string> = {
  city: "from-[#0052CC] to-[#5B8DEF]",
  partner: "from-[#1B873F] to-[#3FB572]",
  milestone: "from-[#B7791F] to-[#E0A84A]",
  event: "from-[#7C3AED] to-[#A78BFA]",
};
