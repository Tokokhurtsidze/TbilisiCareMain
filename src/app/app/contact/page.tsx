"use client";

import { Mail, MapPin, Handshake, LifeBuoy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { SOCIAL_LINKS } from "@/lib/site-links";

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">{t("page.contact.title")}</h1>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand grid place-items-center">
              <Mail size={18} />
            </div>
            <h2 className="font-semibold">{t("page.contact.support")}</h2>
          </div>
          <a href="mailto:hello@tbilisicare.ge" className="text-brand text-sm">
            hello@tbilisicare.ge
          </a>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand grid place-items-center">
              <Handshake size={18} />
            </div>
            <h2 className="font-semibold">{t("page.contact.partnerships")}</h2>
          </div>
          <a href="mailto:partners@tbilisicare.ge" className="text-brand text-sm">
            partners@tbilisicare.ge
          </a>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand grid place-items-center">
              <MapPin size={18} />
            </div>
            <h2 className="font-semibold">{t("page.contact.address")}</h2>
          </div>
          <p className="text-sm text-ink-secondary">
            {t("page.contact.addressBody")}
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand grid place-items-center">
              <LifeBuoy size={18} />
            </div>
            <h2 className="font-semibold">{t("site.follow")}</h2>
          </div>
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
        </Card>
      </div>
    </div>
  );
}
