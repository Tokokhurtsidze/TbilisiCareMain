import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  type LucideIcon,
} from "lucide-react";

export type SocialLink = {
  id: string;
  url: string;
  label: string;
  Icon: LucideIcon;
};

// Replace these URLs once real handles are registered.
export const SOCIAL_LINKS: SocialLink[] = [
  { id: "facebook", url: "https://facebook.com/tbilisicare", label: "Facebook", Icon: Facebook },
  { id: "instagram", url: "https://instagram.com/tbilisicare", label: "Instagram", Icon: Instagram },
  { id: "twitter", url: "https://x.com/tbilisicare", label: "X (Twitter)", Icon: Twitter },
  { id: "linkedin", url: "https://linkedin.com/company/tbilisicare", label: "LinkedIn", Icon: Linkedin },
  { id: "youtube", url: "https://youtube.com/@tbilisicare", label: "YouTube", Icon: Youtube },
];

export type InfoLink = {
  id: string;
  href: string;
  labelKey: string;
  external?: boolean;
};

export const INFO_LINKS: InfoLink[] = [
  { id: "about", href: "/app/about", labelKey: "site.about" },
  { id: "news", href: "/app/news", labelKey: "site.news" },
  { id: "partners", href: "/app/partners", labelKey: "site.partners" },
  { id: "cityhall", href: "https://tbilisi.gov.ge", labelKey: "site.cityhall", external: true },
  { id: "privacy", href: "/app/privacy", labelKey: "site.privacy" },
  { id: "terms", href: "/app/terms", labelKey: "site.terms" },
  { id: "contact", href: "/app/contact", labelKey: "site.contact" },
];
