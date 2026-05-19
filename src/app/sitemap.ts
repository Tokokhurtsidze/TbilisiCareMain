import type { MetadataRoute } from "next";

const BASE = "https://tbilisicare.ge";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE,                      lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/auth/login`,      lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/auth/register`,   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/app`,             lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/app/leaderboard`, lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${BASE}/app/marketplace`, lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/app/news`,        lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/app/submit`,      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`,           lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/partners`,        lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
