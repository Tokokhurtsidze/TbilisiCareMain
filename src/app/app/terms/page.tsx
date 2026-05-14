"use client";

import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("page.terms.title")}</h1>
        <p className="text-xs text-ink-secondary mt-1">{t("page.terms.updated")}</p>
      </div>
      <Card>
        <p className="text-ink-primary leading-relaxed">{t("page.terms.body")}</p>
      </Card>
    </div>
  );
}
