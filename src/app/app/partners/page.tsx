"use client";

import { Building2, Smartphone, Wifi, ShoppingBag, Film, Coffee, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TbilisiLogo } from "@/components/TbilisiLogo";

type PartnerVisual =
  | { kind: "icon"; Icon: typeof Building2 }
  | { kind: "logo" };

const PUBLIC: { name: string; visual: PartnerVisual; sector: string }[] = [
  { name: "Tbilisi City Hall", visual: { kind: "logo" }, sector: "Government" },
  { name: "Tbilisi Transport Company", visual: { kind: "icon", Icon: Building2 }, sector: "Transport" },
];

const PRIVATE: { name: string; visual: PartnerVisual; sector: string }[] = [
  { name: "Magti", visual: { kind: "icon", Icon: Smartphone }, sector: "Telecom" },
  { name: "Silknet", visual: { kind: "icon", Icon: Wifi }, sector: "Telecom" },
  { name: "Lilo Mall", visual: { kind: "icon", Icon: ShoppingBag }, sector: "Retail" },
  { name: "Cavea Cinemas", visual: { kind: "icon", Icon: Film }, sector: "Events" },
  { name: "Coffeesta", visual: { kind: "icon", Icon: Coffee }, sector: "F&B" },
];

export default function PartnersPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("page.partners.title")}</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("page.partners.public")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {PUBLIC.map((p) => (
            <PartnerCard key={p.name} {...p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("page.partners.private")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {PRIVATE.map((p) => (
            <PartnerCard key={p.name} {...p} />
          ))}
        </div>
      </section>

      <Card>
        <h3 className="font-semibold mb-1">{t("page.partners.cta")}</h3>
        <p className="text-sm text-ink-secondary mb-4">
          {t("page.partners.ctaBody")}
        </p>
        <a href="/app/contact">
          <Button size="md">
            <Mail size={16} />
            {t("page.contact.title")}
          </Button>
        </a>
      </Card>
    </div>
  );
}

function PartnerCard({
  name,
  visual,
  sector,
}: {
  name: string;
  visual: PartnerVisual;
  sector: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-elevated p-4 flex items-center gap-3">
      <div className="h-14 w-14 rounded-xl bg-surface-base border border-line grid place-items-center overflow-hidden">
        {visual.kind === "logo" ? (
          <TbilisiLogo size={40} />
        ) : (
          <visual.Icon size={24} className="text-brand" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold truncate">{name}</p>
        <p className="text-xs text-ink-secondary">{sector}</p>
      </div>
    </div>
  );
}
