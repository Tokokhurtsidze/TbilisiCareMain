import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/app/profile", "/app/submit"],
      },
    ],
    sitemap: "https://tbilisicare.ge/sitemap.xml",
    host: "https://tbilisicare.ge",
  };
}
