import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TbilisiCare",
    short_name: "TbilisiCare",
    description: "Good deeds, recognized. Tbilisi's civic community platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0052cc",
    orientation: "portrait",
    categories: ["social", "lifestyle", "utilities"],
    icons: [{ src: "/logo.ico", sizes: "256x99", type: "image/x-icon" }],
  };
}
