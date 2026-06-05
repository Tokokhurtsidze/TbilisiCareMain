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
    icons: [],
  };
}
