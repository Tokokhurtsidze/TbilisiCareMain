"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Camera,
  Handshake,
  Heart,
  LogIn,
  Menu,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trophy,
  UserPlus,
  Wifi,
  X,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TbilisiLogo } from "@/components/TbilisiLogo";
import { DEMO_NEWS } from "@/lib/demo-data";
import { SOCIAL_LINKS } from "@/lib/site-links";
import { relativeTime } from "@/lib/utils";

const HERO_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=520&h=380&fit=crop&q=80",
    alt: "Volunteers in community",
  },
  {
    src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=520&h=380&fit=crop&q=80",
    alt: "Community cleanup",
  },
  {
    src: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=520&h=380&fit=crop&q=80",
    alt: "Community gathering",
  },
  {
    src: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=520&h=380&fit=crop&q=80",
    alt: "Environmental volunteering",
  },
];

const NEWS_PHOTOS = [
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1593113616828-6f22bca04804?w=600&h=280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=600&h=280&fit=crop&q=80",
];

type PartnerEntry = { name: string; Icon?: typeof Smartphone; logo?: boolean };
const PARTNERS: PartnerEntry[] = [
  { name: "Tbilisi City Hall", logo: true },
  { name: "Magti",     Icon: Smartphone },
  { name: "Silknet",   Icon: Wifi },
  { name: "Lilo Mall", Icon: ShoppingBag },
];

export default function LandingClient() {
  const { t, locale, setLocale } = useI18n();
  const LOCALES = ["ka", "en", "ru"] as const;
  const cycleLocale = () => {
    const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];
    setLocale(next);
  };
  const [menuOpen, setMenuOpen] = useState(false);

  // Real, live counts — no more made-up marketing numbers. 0 is shown
  // honestly rather than papered over; it's the truth until it isn't.
  const [stats, setStats] = useState<{ citizens: number; deeds: number; points: number; districts: number } | null>(null);
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ citizens: 0, deeds: 0, points: 0, districts: 6 }));
  }, []);
  const fmt = (n: number | undefined) => (n === undefined ? "—" : n.toLocaleString());

  return (
    <main className="min-h-screen bg-white dark:bg-surface-base overflow-x-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header suppressHydrationWarning className="sticky top-0 z-30 bg-surface-base/90 backdrop-blur border-b border-line">
        <div suppressHydrationWarning className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <TbilisiLogo size={40} className="shrink-0" />

          {/* Desktop controls */}
          <div suppressHydrationWarning className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={cycleLocale}
              className="h-8 px-2.5 rounded-lg text-xs font-bold tracking-wide text-ink-secondary hover:text-brand hover:bg-surface-subtle transition-colors"
              aria-label="Switch language"
            >
              {locale.toUpperCase()}
            </button>
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">{t("auth.signin")}</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">{t("auth.signup")}</Button>
            </Link>
          </div>

          {/* Mobile: burger only — sign-up/sign-in/lang/theme all live in the drawer */}
          <button
            onClick={() => setMenuOpen(true)}
            className="sm:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-surface-subtle transition-colors shrink-0"
            aria-label={t("site.menu")}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`sm:hidden fixed top-0 right-0 bottom-0 w-64 max-w-[85%] z-50 bg-surface-base border-l border-line transition-transform ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label={t("site.menu")}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-line">
          <span className="font-semibold">{t("site.menu")}</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="h-10 w-10 grid place-items-center rounded-lg hover:bg-surface-subtle"
            aria-label={t("common.close")}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="block">
            <Button size="md" className="w-full">
              <UserPlus size={17} />
              {t("auth.signup")}
            </Button>
          </Link>
          <button
            onClick={cycleLocale}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-ink-primary hover:bg-surface-subtle transition-colors"
          >
            <span>{t("profile.language")}</span>
            <span className="text-brand font-bold">{locale.toUpperCase()}</span>
          </button>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-ink-primary">
            <span>{t("profile.theme")}</span>
            <ThemeToggle />
          </div>
          <Link
            href="/auth/login"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-primary hover:bg-surface-subtle transition-colors"
          >
            <LogIn size={17} />
            {t("auth.signin")}
          </Link>
        </div>
      </div>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="hero-atmosphere max-w-7xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/8 border border-brand/20 text-brand text-sm font-semibold mb-6 animate-slide-up">
            <Sparkles size={14} />
            {t("app.tagline")}
          </div>
          <h1 className="font-display text-5xl lg:text-6xl font-semibold leading-[1.08] text-ink-primary tracking-tight mb-5 animate-slide-up stagger-1">
            {t("landing.headline")}
          </h1>
          <p className="text-lg text-ink-secondary leading-relaxed max-w-md mb-8 animate-slide-up stagger-2">
            {t("landing.sub")}
          </p>
          <div className="flex items-center gap-3 flex-wrap animate-slide-up stagger-3">
            <Link href="/auth/register">
              <Button size="lg" className="shadow-[var(--shadow-brand)]">
                <UserPlus size={17} />
                {t("landing.cta")}
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="ghost">{t("auth.signin")}</Button>
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-10 flex items-start gap-8 flex-wrap animate-slide-up stagger-4">
            {[
              { n: fmt(stats?.citizens), label: t("landing.stats.citizens") },
              { n: fmt(stats?.deeds), label: t("landing.stats.deeds") },
              { n: String(stats?.districts ?? 6), label: t("landing.stats.districts") },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="font-display text-2xl font-semibold text-brand leading-none">{n}</p>
                <p className="text-xs text-ink-secondary mt-1 max-w-[7rem]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — staggered photo collage */}
        <div className="relative z-10 animate-scale-in stagger-2">
          {/* Decorative border frames — desktop only, they overlap awkwardly on narrow phones */}
          <div className="hidden sm:block absolute top-4 left-4 w-[48%] h-[48%] border-2 border-brand/40 rounded-2xl pointer-events-none z-10" />
          <div className="hidden sm:block absolute bottom-0 right-2 w-[50%] h-[52%] border-2 border-brand/30 rounded-2xl pointer-events-none z-10" />

          <div className="grid grid-cols-2 gap-3">
            <div className="relative w-full h-52 rounded-2xl shadow-md overflow-hidden">
              <Image fill priority sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" src={HERO_PHOTOS[0].src} alt={HERO_PHOTOS[0].alt} />
            </div>
            <div className="relative w-full h-52 rounded-2xl shadow-md overflow-hidden mt-8">
              <Image fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" src={HERO_PHOTOS[1].src} alt={HERO_PHOTOS[1].alt} />
            </div>
            <div className="relative w-full h-52 rounded-2xl shadow-md overflow-hidden -mt-4">
              <Image fill priority sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" src={HERO_PHOTOS[2].src} alt={HERO_PHOTOS[2].alt} />
            </div>
            <div className="relative w-full h-52 rounded-2xl shadow-md overflow-hidden mt-4">
              <Image fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" src={HERO_PHOTOS[3].src} alt={HERO_PHOTOS[3].alt} />
            </div>
          </div>

          {/* Blue accent square */}
          <div className="absolute -bottom-4 left-[44%] w-14 h-14 bg-brand rounded-xl -z-10 animate-hero-float" />
          <div className="absolute -top-3 right-0 w-8 h-8 bg-brand/30 rounded-lg -z-10" />
        </div>
      </section>

      {/* ── STATS BAND ─────────────────────────────────────────────────── */}
      <section className="bg-surface-elevated border-y border-line">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { n: fmt(stats?.citizens), label: t("landing.stats.citizens") },
              { n: fmt(stats?.deeds), label: t("landing.stats.deeds") },
              { n: fmt(stats?.points), label: t("landing.stats.points") },
              { n: String(stats?.districts ?? 6), label: t("landing.stats.districts") },
            ].map(({ n, label }) => (
              <div key={label} className="text-center py-2">
                <p className="text-3xl font-extrabold text-brand tracking-tight">{n}</p>
                <p className="text-xs text-ink-secondary mt-1 font-medium uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / MISSION ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
        {/* Photo with blue accent */}
        <div className="relative hidden lg:block">
          <div className="relative w-full h-[420px] rounded-3xl shadow-lg overflow-hidden">
            <Image fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=680&h=520&fit=crop&q=80" alt="Tbilisi community" />
          </div>
          {/* Blue accent rectangle (bottom-left, like reference) */}
          <div className="absolute -bottom-5 -left-5 w-28 h-28 bg-brand rounded-2xl -z-10" />
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-brand/20 rounded-xl -z-10" />
        </div>

        {/* Text */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">{t("landing.how.title")}</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink-primary mb-4">{t("landing.how.sub")}</h2>
          <p className="text-ink-secondary leading-relaxed mb-8">
            {t("landing.sub")}
          </p>
          <ol className="space-y-4">
            {[
              { Icon: UserPlus, title: t("landing.how.s1.title"), body: t("landing.how.s1.body") },
              { Icon: Heart,    title: t("landing.how.s2.title"), body: t("landing.how.s2.body") },
              { Icon: Camera,   title: t("landing.how.s3.title"), body: t("landing.how.s3.body") },
              { Icon: Trophy,   title: t("landing.how.s4.title"), body: t("landing.how.s4.body") },
            ].map(({ Icon, title, body }, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-brand text-white grid place-items-center shrink-0 shadow-[var(--shadow-brand)]">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-ink-primary">{title}</p>
                  <p className="text-sm text-ink-secondary mt-0.5 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── NEWS ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-1">{t("landing.news.title")}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight">{t("landing.news.title")}</h2>
          </div>
          <Link href="/auth/register" className="hidden sm:inline-flex items-center gap-1 text-sm text-brand font-semibold hover:underline underline-offset-2">
            {t("landing.news.cta")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {DEMO_NEWS.slice(0, 3).map((n, idx) => (
            <article key={n.id} className="rounded-3xl overflow-hidden border border-line bg-white dark:bg-surface-elevated hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
              <div className="relative h-44 overflow-hidden">
                <Image
                  fill
                  sizes="(max-width:640px) 100vw, 33vw"
                  src={NEWS_PHOTOS[idx % NEWS_PHOTOS.length]}
                  alt=""
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Date badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                  <span>{relativeTime(Date.now() - n.ageHours * 3600 * 1000, locale)}</span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-brand font-bold mb-2">{t(`news.cat.${n.category}`)}</p>
                <h3 className="font-bold text-sm leading-snug mb-2 text-ink-primary">{t(n.titleKey)}</h3>
                <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">{t(n.bodyKey)}</p>
                <Link href="/auth/register" className="inline-flex items-center gap-1 text-xs text-brand font-semibold mt-3 hover:underline underline-offset-2">
                  {t("landing.news.cta")} <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── PARTNERS ───────────────────────────────────────────────────── */}
      <section className="bg-surface-elevated border-y border-line">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-semibold">{t("landing.partners.title")}</h2>
            <p className="text-ink-secondary mt-1 text-sm">{t("landing.partners.sub")}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PARTNERS.map((p) => (
              <div key={p.name} className="rounded-2xl border border-line bg-white dark:bg-surface-base p-5 flex flex-col items-center justify-center gap-2 min-h-[100px] hover:shadow-md hover:border-brand/30 transition-all duration-200">
                <div className="h-12 w-auto max-w-full grid place-items-center px-2">
                  {p.logo ? <TbilisiLogo size={28} /> : p.Icon ? <p.Icon size={28} className="text-brand" strokeWidth={1.5} /> : <Building2 size={28} className="text-brand" />}
                </div>
                <p className="text-sm font-semibold text-center">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-center tracking-tight mb-8">{t("landing.testimonials.title")}</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <Quote text={t("landing.testimonials.q1")} author={t("landing.testimonials.q1.author")} seed="nino-vake" />
          <Quote text={t("landing.testimonials.q2")} author={t("landing.testimonials.q2.author")} seed="giorgi-saburtalo" />
          <Quote text={t("landing.testimonials.q3")} author={t("landing.testimonials.q3.author")} seed="babo-tamuna" />
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-brand text-white p-8 sm:p-12 text-center shadow-[var(--shadow-brand)]">
          {/* Background photo with overlay */}
          <Image
            fill
            sizes="100vw"
            src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&h=500&fit=crop&q=60"
            alt=""
            aria-hidden
            className="object-cover mix-blend-overlay opacity-20 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand via-[#0063f7] to-brand-hover opacity-90 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-3 tracking-tight">{t("landing.final.title")}</h2>
            <p className="opacity-80 mb-8 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">{t("landing.final.sub")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="!bg-white !text-brand hover:!bg-white/90 shadow-lg font-bold w-full sm:w-auto">
                  <UserPlus size={18} />
                  {t("landing.cta")}
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle2 size={14} />
                <span>{t("landing.final.trust")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-line bg-surface-elevated">
        <div className="max-w-7xl mx-auto px-6 py-10 grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TbilisiLogo size={36} className="shrink-0" />
            </div>
            <p className="text-sm text-ink-secondary mb-4">{t("landing.footer.tagline")}</p>
            <ul className="flex gap-2 flex-wrap">
              {SOCIAL_LINKS.map(({ id, url, label, Icon }) => (
                <li key={id}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="h-10 w-10 grid place-items-center rounded-xl bg-surface-base hover:bg-brand-soft hover:text-brand transition">
                    <Icon size={17} strokeWidth={1.7} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:text-right text-sm text-ink-secondary">
            <p className="flex items-center sm:justify-end gap-2 mb-2">
              <Handshake size={14} /> {t("site.cityhall")}
            </p>
            <p>{t("landing.footer.copyright")}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <p className="text-xs text-ink-secondary/70 border-t border-line pt-4">{t("site.disclaimer")}</p>
        </div>
      </footer>
    </main>
  );
}

function Quote({ text, author, seed }: { text: string; author: string; seed: string }) {
  return (
    <figure className="rounded-2xl border border-line bg-white dark:bg-surface-elevated p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="text-brand text-3xl font-serif leading-none mb-3 opacity-30">&ldquo;</div>
      <blockquote className="text-sm leading-relaxed text-ink-primary">{text}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 pt-4 border-t border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`}
          alt=""
          className="h-9 w-9 rounded-full bg-surface-subtle"
        />
        <span className="text-sm font-medium text-ink-secondary">{author}</span>
      </figcaption>
    </figure>
  );
}
