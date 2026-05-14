"use client";

import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("page.privacy.title")}</h1>
        <p className="text-xs text-ink-secondary mt-1">{t("page.privacy.updated")}</p>
      </div>
      <Card>
        <p className="text-ink-primary leading-relaxed">{t("page.privacy.body")}</p>
      </Card>
    </div>
  );
}
