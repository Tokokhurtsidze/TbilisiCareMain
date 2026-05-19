import type { Metadata } from "next";
import LandingClient from "./_landing";

export const metadata: Metadata = {
  title: "TbilisiCare — Good Deeds, Rewarded",
  description:
    "Join 10,000+ Tbilisi citizens earning CarePoints for good deeds. Pick up litter, feed stray animals, help seniors — redeem real rewards with Tbilisi's civic platform.",
  alternates: { canonical: "https://tbilisicare.ge" },
  openGraph: {
    title: "TbilisiCare — Good Deeds, Rewarded",
    description:
      "10,000+ citizens. 48,000+ good deeds. Real rewards. Join Tbilisi's civic community.",
    url: "https://tbilisicare.ge",
    type: "website",
  },
};

export default function Page() {
  return <LandingClient />;
}
