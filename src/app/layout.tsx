import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme-context";
import { SuppressExtensionWarnings } from "@/components/SuppressExtensionWarnings";

export const metadata: Metadata = {
  title: {
    default: "TbilisiCare — Good Deeds, Rewarded",
    template: "%s | TbilisiCare",
  },
  description:
    "Join 10,000+ Tbilisi citizens earning real rewards for helping their city. Pick up litter, feed strays, help seniors — every deed counts.",
  metadataBase: new URL("https://tbilisicare.ge"),
  keywords: [
    "Tbilisi",
    "civic platform",
    "good deeds",
    "volunteer",
    "Georgia",
    "rewards",
    "community",
    "TbilisiCare",
  ],
  authors: [{ name: "TbilisiCare" }],
  creator: "TbilisiCare",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    url: "https://tbilisicare.ge",
    siteName: "TbilisiCare",
    title: "TbilisiCare — Good Deeds, Rewarded",
    description:
      "Join 10,000+ Tbilisi citizens earning real rewards for helping their city.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TbilisiCare — Good Deeds, Rewarded",
    description: "Good deeds earn real rewards in Tbilisi.",
    creator: "@tbilisicare",
  },
  alternates: {
    canonical: "https://tbilisicare.ge",
    languages: {
      "ka-GE": "https://tbilisicare.ge",
      "en-US": "https://tbilisicare.ge/en",
      "ru-RU": "https://tbilisicare.ge/ru",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1426" },
  ],
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TbilisiCare",
    url: "https://tbilisicare.ge",
    logo: "https://tbilisicare.ge/icon.png",
    sameAs: [
      "https://www.facebook.com/tbilisicare",
      "https://www.instagram.com/tbilisicare",
      "https://twitter.com/tbilisicare",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tbilisi",
      addressCountry: "GE",
    },
    foundingDate: "2024",
    description:
      "A civic gamification platform where Tbilisi residents earn real rewards for verified good deeds.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TbilisiCare",
    url: "https://tbilisicare.ge",
    description:
      "Tbilisi's civic community platform — earn CarePoints for good deeds, redeem real rewards.",
    applicationCategory: "SocialNetworkingApplication",
    operatingSystem: "Web, iOS, Android",
    offers: { "@type": "Offer", price: "0", priceCurrency: "GEL" },
    inLanguage: ["ka", "en", "ru"],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "10124",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TbilisiCare",
    url: "https://tbilisicare.ge",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://tbilisicare.ge/app?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var o=console.error.bind(console);console.error=function(){var m=arguments[0];if(typeof m==='string'&&(m.indexOf('bis_skin_checked')!==-1||m.indexOf('bis_register')!==-1||m.indexOf('data-gr-')!==-1||m.indexOf('data-new-gr-')!==-1||m.indexOf('__processed_')!==-1||m.indexOf('Cross-Origin-Opener-Policy')!==-1))return;o.apply(console,arguments)};})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body suppressHydrationWarning>
        <SuppressExtensionWarnings />
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
