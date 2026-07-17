import type { Metadata } from "next";
import LandingClient from "./_landing";

export const metadata: Metadata = {
  title: "TbilisiCare — Good Deeds, Recognized",
  description:
    "Join 10,000+ Tbilisi citizens earning CarePoints for good deeds. Pick up litter, feed stray animals, help seniors — climb the leaderboard with Tbilisi's civic platform.",
  alternates: { canonical: "https://tbilisicare.ge" },
  openGraph: {
    title: "TbilisiCare — Good Deeds, Recognized",
    description:
      "10,000+ citizens. 48,000+ good deeds. Real recognition. Join Tbilisi's civic community.",
    url: "https://tbilisicare.ge",
    type: "website",
  },
};

export default function Page() {
  return <LandingClient />;
}
