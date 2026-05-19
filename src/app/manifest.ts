import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TbilisiCare",
    short_name: "TbilisiCare",
    description: "Good deeds, rewarded. Tbilisi's civic community platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0052cc",
    orientation: "portrait",
    categories: ["social", "lifestyle", "utilities"],
    icons: [
      { src: "/icon.png",        sizes: "64x64",   type: "image/png" },
      { src: "/icon.png",        sizes: "192x192", type: "image/png" },
      { src: "/icon.png",        sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
