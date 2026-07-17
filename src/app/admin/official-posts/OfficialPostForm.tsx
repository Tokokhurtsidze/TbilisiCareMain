"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TAGS = ["announcement", "milestone", "spotlight", "reward", "event", "program"] as const;
const LOCALES = [
  { key: "Ka", label: "Georgian" },
  { key: "En", label: "English" },
  { key: "Ru", label: "Russian" },
] as const;

type ThreeLang = { Ka: string; En: string; Ru: string };
const empty3 = (): ThreeLang => ({ Ka: "", En: "", Ru: "" });

export function OfficialPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState<ThreeLang>(empty3());
  const [body, setBody] = useState<ThreeLang>(empty3());
  const [tag, setTag] = useState<(typeof TAGS)[number]>("announcement");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState<ThreeLang>(empty3());
  const [ctaHref, setCtaHref] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const allFilled = (v: ThreeLang) => v.Ka.trim() && v.En.trim() && v.Ru.trim();
  const ready = allFilled(title) && allFilled(body);
  const ctaStarted = ctaLabel.Ka.trim() || ctaLabel.En.trim() || ctaLabel.Ru.trim();

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/official-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleKa: title.Ka, titleEn: title.En, titleRu: title.Ru,
          bodyKa: body.Ka, bodyEn: body.En, bodyRu: body.Ru,
          tag,
          imageUrl,
          ctaLabelKa: ctaLabel.Ka, ctaLabelEn: ctaLabel.En, ctaLabelRu: ctaLabel.Ru,
          ctaHref,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Failed to publish");
      setTitle(empty3());
      setBody(empty3());
      setImageUrl("");
      setCtaLabel(empty3());
      setCtaHref("");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm">New City Hall post</p>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value as (typeof TAGS)[number])}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <p className="text-gray-500 text-xs">
        Every post must be written in all 3 languages — the feed shows whichever language the viewer has selected.
      </p>

      {LOCALES.map(({ key, label }) => (
        <div key={key} className="border border-gray-800 rounded-lg p-3 space-y-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{label}</p>
          <input
            value={title[key]}
            onChange={(e) => setTitle((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={`Title (${label})`}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500"
          />
          <textarea
            value={body[key]}
            onChange={(e) => setBody((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={`Body (${label})`}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none"
          />
          <input
            value={ctaLabel[key]}
            onChange={(e) => setCtaLabel((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={`CTA label (${label}, optional)`}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500"
          />
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3">
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500"
        />
        <input
          value={ctaHref}
          onChange={(e) => setCtaHref(e.target.value)}
          placeholder="CTA link (required if any CTA label set)"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500"
        />
      </div>

      {ctaStarted && !allFilled(ctaLabel) && (
        <p className="text-amber-400 text-xs">Fill in the CTA label for all 3 languages, or clear all of them.</p>
      )}
      {err && <p className="text-red-400 text-xs">{err}</p>}

      <button
        onClick={submit}
        disabled={busy || !ready}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {busy ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
