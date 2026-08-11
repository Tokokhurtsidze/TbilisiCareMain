import type { Comment, Deed, OfficialPost, ProofType, UserDoc } from "@/types";

// Single flip to remove every fake/seed citizen and post before a real launch —
// set NEXT_PUBLIC_SHOW_DEMO_CONTENT=false. Consumers should read this instead
// of importing the DEMO_* arrays directly where the content is user-facing
// (leaderboard rows, feed posts) so nothing hardcodes fake people permanently.
export const SHOW_DEMO_CONTENT = process.env.NEXT_PUBLIC_SHOW_DEMO_CONTENT !== "false";

const avMale = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&top=shortHair,shortFlat,shortRound,shortWaved,sides,caesar&facialHairChance=30`;

const avFemale = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&top=longHair,straight01,straight02,curly,bigHair,bob,dreads,frida,fro&facialHairChance=0`;

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
    consentSpotlight: true,
    photoURL: avMale("giorgi-m"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 220,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avFemale("nino-f"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avMale("levan-m"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 160,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avFemale("mariam-f"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 140,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avMale("davit-m"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avFemale("tamar-f"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avMale("nika-m"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 80,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avFemale("salome-f"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 70,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avMale("irakli-m"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avFemale("tinatin-f"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avMale("avto-m"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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
    consentSpotlight: true,
    photoURL: avFemale("ana-f"),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    currentStreak: 0,
    longestStreak: 0,
    lastDeedDate: null,
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

// ---- Official Posts ----

const TBILISI_IMAGES = {
  cleanup: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop",
  community: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop",
  park: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=900&auto=format&fit=crop",
  city: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&auto=format&fit=crop",
};

// Shorthand for a 3-language string — every OfficialPost field shown to users
// must be filled in ka/en/ru, never just one language.
const L = (ka: string, en: string, ru: string) => ({ ka, en, ru });

export const DEMO_OFFICIAL_POSTS: OfficialPost[] = [
  {
    id: "official-1",
    tag: "milestone",
    title: L(
      "50,000 კარგი საქმე თბილისში! 🎉",
      "50,000 Good Deeds in Tbilisi! 🎉",
      "50 000 добрых дел в Тбилиси! 🎉",
    ),
    body: L(
      "ამ კვირას ჩვენმა საზოგადოებამ გადალახა 50,000 დადასტურებული კარგი საქმის ნიშნული. ყოველი აღებული ნაგავი, ყოველი გამოკვებილი ცხოველი, ყოველი დახმარებული მეზობელი — ყველაფერი გაითვალისწინა. გმადლობთ, თბილისო.",
      "This week our community crossed 50,000 verified good deeds. Every piece of litter picked up, every stray fed, every neighbor helped — it all counted. Thank you, Tbilisi.",
      "На этой неделе наше сообщество превысило отметку 50 000 подтверждённых добрых дел. Каждый убранный мусор, каждое покормленное животное, каждый помощь соседу — всё это засчиталось. Спасибо, Тбилиси.",
    ),
    imageUrl: TBILISI_IMAGES.community,
    stats: [
      { label: L("სულ საქმეები", "Total Deeds", "Всего дел"), value: "50,000+" },
      { label: L("აქტიური მოქალაქე", "Active Citizens", "Активных граждан"), value: "10,124" },
      { label: L("მიღებული ქულა", "Care Points Earned", "Заработано баллов"), value: "312K" },
    ],
    ctaLabel: L("ლიდერბორდი", "See Leaderboard", "Смотреть лидерборд"),
    ctaHref: "/app/leaderboard",
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "official-2",
    tag: "announcement",
    title: L(
      "მერია მადლობას გიხდით 🏛️",
      "City Hall Says Thank You 🏛️",
      "Мэрия говорит спасибо 🏛️",
    ),
    body: L(
      "ვაკის უბანმა ამ თვეში გადალახა 5,000 დადასტურებული კარგი საქმის ნიშნული. მერია აღნიშნავს ყველა მოქალაქეს, ვინც ნაგავი აკრიფა, ცხოველები გამოკვება და მეზობლებს დაეხმარა.",
      "Vake district crossed 5,000 verified good deeds this month. City Hall recognizes every citizen who picked up litter, fed strays, and cared for their neighbors.",
      "Район Ваке в этом месяце превысил 5 000 подтверждённых добрых дел. Мэрия отмечает каждого гражданина, кто убирал мусор, кормил животных и заботился о соседях.",
    ),
    stats: [
      { label: L("უბანი", "District", "Район"), value: "Vake" },
      { label: L("საქმეები", "Deeds", "Дел"), value: "5,000+" },
      { label: L("მოქალაქეები", "Citizens", "Граждан"), value: "1,240" },
    ],
    ctaLabel: L("ლიდერბორდი", "See Leaderboard", "Смотреть лидерборд"),
    ctaHref: "/app/leaderboard",
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
  },
  {
    id: "official-3",
    tag: "spotlight",
    title: L(
      "კვირის მოქალაქე: გიორგი ბერიძე 🏆",
      "Citizen of the Week: Giorgi Beridze 🏆",
      "Гражданин недели: Гиорги Беридзе 🏆",
    ),
    body: L(
      "გიორგიმ ამ კვირას შეასრულა 47 დადასტურებული საქმე ვაკესა და საბურთალოში — ნაგვის აღება, ხეების მოვლა და უფროსების დახმარება. ასეთია დარაჯის სახე.",
      "Giorgi completed 47 verified deeds this week across Vake and Saburtalo — litter cleanup, tree care, and senior assistance. This is what a Guardian looks like.",
      "Гиорги на этой неделе выполнил 47 подтверждённых дел в Ваке и Сабуртало — уборка мусора, забота о деревьях и помощь пожилым. Вот как выглядит настоящий Guardian.",
    ),
    imageUrl: TBILISI_IMAGES.cleanup,
    authorName: "Giorgi Beridze",
    authorPhotoURL: avMale("giorgi-m"),
    source: "ai",
    stats: [
      { label: L("საქმეები ამ კვირას", "Deeds This Week", "Дел за неделю"), value: "47" },
      { label: L("სულ ქულები", "Total Points", "Всего баллов"), value: "18,420" },
      { label: L("უბანი", "District", "Район"), value: "Vake" },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 40,
  },
  {
    id: "official-4",
    tag: "event",
    title: L(
      "ქალაქის დასუფთავება: შაბათს, 10:00 🌿",
      "City-Wide Cleanup: Saturday 10am 🌿",
      "Уборка по всему городу: субботу в 10:00 🌿",
    ),
    body: L(
      "შემოგვიერთდი ათასობით თბილისელს ჩვენს ყველაზე მასშტაბურ ორგანიზებულ დასუფთავებაში. ყველა 6 უბანი, 200+ მოხალისე, 3 საათი. შაბათს ორმაგი ქულა.",
      "Join thousands of Tbilisi citizens for our biggest organized cleanup yet. All 6 districts, 200+ volunteers, 3 hours. Earn double CP all day Saturday.",
      "Присоединяйся к тысячам жителей Тбилиси в нашей самой масштабной уборке. Все 6 районов, 200+ волонтёров, 3 часа. В субботу баллы начисляются вдвойне.",
    ),
    imageUrl: TBILISI_IMAGES.park,
    stats: [
      { label: L("თარიღი", "Date", "Дата"), value: "Sat" },
      { label: L("დაწყება", "Starts", "Начало"), value: "10:00" },
      { label: L("ბონუსი", "Bonus", "Бонус"), value: "2× CP" },
    ],
    ctaLabel: L("ვერთვები", "I'm In", "Я в деле"),
    ctaHref: "/app/submit",
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: "official-5",
    tag: "announcement",
    title: L(
      "TbilisiCare ყველა 6 უბანში",
      "TbilisiCare Now in All 6 Districts",
      "TbilisiCare теперь во всех 6 районах",
    ),
    body: L(
      "ჩვენ ოფიციალურად გავიფართოვეთ გლდანსა და დიდ დიღომში. თბილისის ყველა უბანს ახლა აქვს აქტიური საქმეების დადასტურება და ლოკალური ლიდერბორდი. მოგესალმებით, ახალი მეზობლები.",
      "We've officially expanded to Gldani and Didi Dighomi. Every district of Tbilisi now has active deed verification and local leaderboards. Welcome, new neighbors.",
      "Мы официально расширились на Глдани и Диди Дигоми. Теперь в каждом районе Тбилиси есть проверка дел и локальный лидерборд. Приветствуем новых соседей.",
    ),
    imageUrl: TBILISI_IMAGES.city,
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
  {
    id: "official-6",
    tag: "program",
    title: L(
      "სწავლა და დასაქმება: ახალი ჯგუფი იწყება 🎓",
      "Learn and Get Employed: New Cohort Opens 🎓",
      "Учись и работай: открыт новый набор 🎓",
    ),
    body: L(
      "მერიის სამუშაო გადამზადების პროგრამა ისევ იწყებს რეგისტრაციას — უფასო კურსები ხელობებში, IT-ის საფუძვლებში და მასპინძლობაში, გარანტირებული გასაუბრებით პარტნიორ დამსაქმებლებთან კურსდამთავრებულთათვის. აქტიურ CareCitizens-ს პრიორიტეტული ადგილი ექნება.",
      "City Hall's job-training program is enrolling again — free courses in trades, IT basics, and hospitality, with guaranteed interviews at partner employers on graduation. Active CareCitizens get priority placement.",
      "Программа профессиональной подготовки мэрии снова открыла набор — бесплатные курсы по рабочим специальностям, основам IT и гостеприимству, с гарантированным собеседованием у партнёров-работодателей после выпуска. Активные CareCitizens получают приоритет.",
    ),
    imageUrl: TBILISI_IMAGES.community,
    stats: [
      { label: L("ხანგრძლივობა", "Duration", "Длительность"), value: "6 wk" },
      { label: L("კურსდამთავრებული", "Graduates", "Выпускников"), value: "1,860" },
      { label: L("დასაქმებული", "Hired", "Устроено"), value: "72%" },
    ],
    ctaLabel: L("გაიგე მეტი", "Learn More", "Узнать больше"),
    ctaHref: "https://www.dasakmdi.ge/",
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "official-7",
    tag: "spotlight",
    title: L(
      "თამარი დებას ბებია ტამუნას ეხმარება 💙",
      "Tamar Helps babo Tamuna With Groceries 💙",
      "Тамар помогает бабо Тамуне с покупками 💙",
    ),
    body: L(
      "თამარ გელაშვილი კვირაში ორჯერ დადის საყიდლებზე თავისი 84 წლის მეზობლისთვის საბურთალოში. AI-ს დადასტურებული საქმე, გულითადი მზრუნველობით.",
      "Tamar Gelashvili makes the grocery run twice a week for her 84-year-old neighbor in Saburtalo. AI-verified deed, done with heart.",
      "Тамар Гелашвили два раза в неделю делает покупки для своей 84-летней соседки в Сабуртало. Дело подтверждено AI, сделано с душой.",
    ),
    imageUrl: TBILISI_IMAGES.community,
    authorName: "Tamar Gelashvili",
    authorPhotoURL: avFemale("tamar-f"),
    source: "ai",
    stats: [
      { label: L("ტიპი", "Task", "Задача"), value: "Senior help" },
      { label: L("მიღებული ქულა", "Points Earned", "Получено баллов"), value: "+25" },
      { label: L("უბანი", "District", "Район"), value: "Saburtalo" },
    ],
    ctaLabel: L("საქმის ნახვა", "View Deed", "Смотреть дело"),
    ctaHref: "/app/leaderboard",
    createdAt: Date.now() - 1000 * 60 * 60 * 22,
  },
  {
    id: "official-8",
    tag: "spotlight",
    title: L(
      "ნინო ყოველ დილას მაწანწალას აჭმევს 🐾",
      "Nino Feeds a Stray Every Single Morning 🐾",
      "Нино каждое утро кормит бездомную собаку 🐾",
    ),
    body: L(
      "ნინო კაპანაძემ საბურთალოში ერთი და იმავე ძაღლისთვის საკვების დარეგულარება 4 თვეზე მეტია. მცირე ჩვევა, დიდი გავლენა.",
      "Nino Kapanadze has kept a regular feeding routine for the same dog in Saburtalo for over 4 months. Small habit, big impact.",
      "Нино Капанадзе уже больше 4 месяцев регулярно кормит одну и ту же собаку в Сабуртало. Маленькая привычка — большой эффект.",
    ),
    imageUrl: P.stray,
    authorName: "Nino Kapanadze",
    authorPhotoURL: avFemale("nino-f"),
    source: "ai",
    stats: [
      { label: L("ტიპი", "Task", "Задача"), value: "Stray feeding" },
      { label: L("მიღებული ქულა", "Points Earned", "Получено баллов"), value: "+5" },
      { label: L("უბანი", "District", "Район"), value: "Saburtalo" },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 55,
  },
  {
    id: "official-9",
    tag: "spotlight",
    title: L(
      "ლევანმა სიონის მახლობლად გრაფიტი გაწმინდა 🎨",
      "Levan Cleared Graffiti Near Sioni 🎨",
      "Леван убрал графити возле Сиони 🎨",
    ),
    body: L(
      "ლევან წიკლაურმა 3 საათი დახარჯა ისტორიულ ზონაში მემკვიდრეობის ფასადებზე გრაფიტის წასაშლელად ძველ თბილისში. AI-ს დადასტურდა როგორც ნამდვილი „მანამდე და შემდეგ“ ცვლილება.",
      "Levan Tsiklauri spent 3 hours removing graffiti from heritage facades near Sioni in Old Tbilisi. AI-verified as a genuine before/after change.",
      "Леван Циклаури потратил 3 часа на удаление графити с исторических фасадов возле Сиони в Старом Тбилиси. Подтверждено AI как настоящее изменение «до/после».",
    ),
    imageUrl: TBILISI_IMAGES.cleanup,
    authorName: "Levan Tsiklauri",
    authorPhotoURL: avMale("levan-m"),
    source: "ai",
    stats: [
      { label: L("ტიპი", "Task", "Задача"), value: "Graffiti" },
      { label: L("მიღებული ქულა", "Points Earned", "Получено баллов"), value: "+60" },
      { label: L("უბანი", "District", "Район"), value: "Old Tbilisi" },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 130,
  },
];

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
