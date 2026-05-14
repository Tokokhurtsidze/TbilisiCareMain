"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Bus,
  Camera,
  Car,
  Coffee,
  Handshake,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Sticker,
  Ticket,
  Trophy,
  UserPlus,
  Wifi,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TbilisiLogo } from "@/components/TbilisiLogo";
import { DEMO_NEWS, NEWS_GRADIENTS } from "@/lib/demo-data";
import { SOCIAL_LINKS } from "@/lib/site-links";
import { relativeTime } from "@/lib/utils";

const REWARD_PREVIEW = [
  { icon: Sticker, nameKey: "reward.sticker", cost: 20 },
  { icon: Coffee, nameKey: "reward.coffee", cost: 100 },
  { icon: Car, nameKey: "reward.parking", cost: 150 },
  { icon: Bus, nameKey: "reward.metro", cost: 200 },
  { icon: Ticket, nameKey: "reward.cinema", cost: 300 },
] as const;

type PartnerEntry = {
  name: string;
  Icon?: typeof Smartphone;
  logo?: boolean;
};

const PARTNERS: PartnerEntry[] = [
  { name: "Tbilisi City Hall", logo: true },
  { name: "Magti", Icon: Smartphone },
  { name: "Silknet", Icon: Wifi },
  { name: "Lilo Mall", Icon: ShoppingBag },
];

export default function Landing() {
  const { t, locale } = useI18n();

  return (
    <main className="min-h-screen bg-surface-base">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-base/90 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <TbilisiLogo size={40} className="shrink-0" />
            <span className="font-semibold">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <ThemeToggle />
            <Link href="/auth/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                {t("auth.signin")}
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">{t("auth.signup")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 pt-12 sm:pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-soft text-brand text-sm font-medium mb-6">
          <Sparkles size={16} />
          {t("app.tagline")}
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] text-ink-primary">
          {t("landing.headline")}
        </h1>
        <p className="mt-5 text-lg text-ink-secondary max-w-xl mx-auto">
          {t("landing.sub")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/auth/register">
            <Button size="lg">
              <UserPlus size={18} />
              {t("landing.cta")}
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="ghost">
              {t("auth.signin")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-5 py-8">
        <p className="text-center text-sm text-ink-secondary mb-5">
          {t("landing.stats.title")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat n="10,124" label={t("landing.stats.citizens")} />
          <Stat n="48,210" label={t("landing.stats.deeds")} />
          <Stat n="312K" label={t("landing.stats.points")} />
          <Stat n="6" label={t("landing.stats.districts")} />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">{t("landing.how.title")}</h2>
          <p className="text-ink-secondary mt-1">{t("landing.how.sub")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Step n={1} icon={<UserPlus size={22} />} title={t("landing.how.s1.title")} body={t("landing.how.s1.body")} />
          <Step n={2} icon={<Heart size={22} />} title={t("landing.how.s2.title")} body={t("landing.how.s2.body")} />
          <Step n={3} icon={<Camera size={22} />} title={t("landing.how.s3.title")} body={t("landing.how.s3.body")} />
          <Step n={4} icon={<Trophy size={22} />} title={t("landing.how.s4.title")} body={t("landing.how.s4.body")} />
        </div>
      </section>

      {/* Rewards preview */}
      <section className="bg-surface-elevated border-y border-line">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">{t("landing.rewards.title")}</h2>
            <p className="text-ink-secondary mt-1">{t("landing.rewards.sub")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {REWARD_PREVIEW.map((r, i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-surface-base p-4 text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-soft text-brand grid place-items-center mx-auto mb-3">
                  <r.icon size={22} />
                </div>
                <p className="font-semibold text-sm">{t(r.nameKey)}</p>
                <p className="text-xs text-brand font-bold mt-1">
                  {r.cost} {t("home.points")}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/auth/register">
              <Button>
                {t("landing.rewards.cta")} <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* News preview */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">{t("landing.news.title")}</h2>
          </div>
          <Link
            href="/auth/register"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-brand font-semibold"
          >
            {t("landing.news.cta")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {DEMO_NEWS.slice(0, 3).map((n) => (
            <article
              key={n.id}
              className="rounded-2xl overflow-hidden border border-line bg-surface-elevated"
            >
              <div
                className={`h-28 bg-gradient-to-br ${NEWS_GRADIENTS[n.category]} grid place-items-center`}
              >
                {n.category === "city" ? (
                  <div className="bg-white/95 rounded-full p-2">
                    <TbilisiLogo size={36} />
                  </div>
                ) : (
                  <Sparkles size={32} className="text-white opacity-90" />
                )}
              </div>
              <div className="p-4">
                <p className="text-[11px] uppercase tracking-wide text-ink-secondary font-semibold mb-1">
                  {t(`news.cat.${n.category}`)} ·{" "}
                  {relativeTime(Date.now() - n.ageHours * 3600 * 1000, locale)}
                </p>
                <h3 className="font-semibold text-sm leading-snug mb-1">
                  {t(n.titleKey)}
                </h3>
                <p className="text-xs text-ink-secondary line-clamp-3">
                  {t(n.bodyKey)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="bg-surface-elevated border-y border-line">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">{t("landing.partners.title")}</h2>
            <p className="text-ink-secondary mt-1">{t("landing.partners.sub")}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PARTNERS.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-line bg-surface-base p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]"
              >
                <div className="h-14 w-14 grid place-items-center">
                  {p.logo ? (
                    <TbilisiLogo size={48} />
                  ) : p.Icon ? (
                    <p.Icon size={32} className="text-brand" strokeWidth={1.5} />
                  ) : (
                    <Building2 size={32} className="text-brand" />
                  )}
                </div>
                <p className="text-sm font-semibold">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("landing.testimonials.title")}
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Quote
            text={t("landing.testimonials.q1")}
            author={t("landing.testimonials.q1.author")}
            seed="nino-vake"
          />
          <Quote
            text={t("landing.testimonials.q2")}
            author={t("landing.testimonials.q2.author")}
            seed="giorgi-saburtalo"
          />
          <Quote
            text={t("landing.testimonials.q3")}
            author={t("landing.testimonials.q3.author")}
            seed="babo-tamuna"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-5 py-16 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-brand to-brand-hover p-10 text-white">
          <h2 className="text-3xl font-bold mb-2">{t("landing.final.title")}</h2>
          <p className="opacity-90 mb-6">{t("landing.final.sub")}</p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="!bg-white !text-brand hover:!bg-white/90"
            >
              <UserPlus size={18} />
              {t("landing.cta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-5xl mx-auto px-5 py-10 grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TbilisiLogo size={32} className="shrink-0" />
              <span className="font-semibold">{t("app.name")}</span>
            </div>
            <p className="text-sm text-ink-secondary mb-4">
              {t("landing.footer.tagline")}
            </p>
            <ul className="flex gap-2 flex-wrap">
              {SOCIAL_LINKS.map(({ id, url, label, Icon }) => (
                <li key={id}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-10 w-10 grid place-items-center rounded-xl bg-surface-subtle hover:bg-brand-soft hover:text-brand transition"
                  >
                    <Icon size={18} strokeWidth={1.7} />
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
      </footer>
    </main>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-line p-5 text-center">
      <p className="text-3xl font-bold text-brand">{n}</p>
      <p className="text-xs text-ink-secondary mt-1">{label}</p>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-elevated p-5 relative">
      <span className="absolute top-3 right-4 text-5xl font-bold text-brand-soft leading-none">
        {n}
      </span>
      <div className="relative h-10 w-10 rounded-xl bg-brand-soft text-brand grid place-items-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold mb-1 relative">{title}</h3>
      <p className="text-sm text-ink-secondary relative">{body}</p>
    </div>
  );
}

function Quote({
  text,
  author,
  seed,
}: {
  text: string;
  author: string;
  seed: string;
}) {
  return (
    <figure className="rounded-2xl border border-line bg-surface-elevated p-5">
      <blockquote className="text-sm leading-relaxed text-ink-primary">
        &ldquo;{text}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`}
          alt=""
          className="h-9 w-9 rounded-full bg-surface-subtle"
        />
        <span className="text-sm text-ink-secondary">{author}</span>
      </figcaption>
    </figure>
  );
}
