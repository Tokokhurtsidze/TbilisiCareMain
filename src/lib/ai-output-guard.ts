import type { Locale } from "@/types";

// Shared quality gate for free-tier OpenRouter output across every route
// that generates user-facing text (ai-chat, city-hall-post cron). Two
// failure modes observed in practice: (1) stray characters from an
// unrelated script (e.g. Chinese) mixed into Georgian/Russian text, and
// (2) a degenerate repetition loop that fills the response with the same
// short phrase hundreds of times.

const ASCII = "\\u0020-\\u007E";
const PUNCTUATION = "\\u2000-\\u206F";
const EMOJI = "\\u2600-\\u27BF\\u{1F300}-\\u{1FAFF}\\u200D\\uFE0F";
const GEORGIAN = "\\u10A0-\\u10FF\\u1C90-\\u1CBF\\u2D00-\\u2D2F";
const CYRILLIC = "\\u0400-\\u04FF";

const SCRIPT_ALLOW: Record<Locale, RegExp> = {
  ka: new RegExp(`^[${ASCII}${PUNCTUATION}${EMOJI}${GEORGIAN}\\n\\r]*$`, "u"),
  ru: new RegExp(`^[${ASCII}${PUNCTUATION}${EMOJI}${CYRILLIC}\\n\\r]*$`, "u"),
  en: new RegExp(`^[${ASCII}${PUNCTUATION}${EMOJI}\\n\\r]*$`, "u"),
};

export function hasCleanScript(text: string, locale: Locale): boolean {
  return SCRIPT_ALLOW[locale].test(text);
}

// hasCleanScript alone lets a model that ignores the "reply only in Georgian"
// instruction and answers in plain English slip through — ASCII is (rightly)
// allowed inside ka/ru text for brand names and numbers, so an all-ASCII
// reply never trips the disallowed-character check. This requires the
// target script to actually make up a real share of the letters used.
const GEORGIAN_LETTER = /[Ⴀ-ჿᲐ-Ჿⴀ-⴯]/gu;
const CYRILLIC_LETTER = /[Ѐ-ӿ]/gu;
const LATIN_LETTER = /[A-Za-z]/g;

export function hasEnoughTargetScript(text: string, locale: Locale): boolean {
  if (locale === "en") return true; // Latin-only is exactly what's expected
  const georgian = (text.match(GEORGIAN_LETTER) ?? []).length;
  const cyrillic = (text.match(CYRILLIC_LETTER) ?? []).length;
  const latin = (text.match(LATIN_LETTER) ?? []).length;
  const total = georgian + cyrillic + latin;
  if (total < 15) return true; // too short a sample to judge meaningfully
  const target = locale === "ka" ? georgian : cyrillic;
  return target / total >= 0.4;
}

// Low unique-8-gram ratio over a long response means the model is looping
// on the same short phrase — real prose (even repetitive-sounding prose)
// scores much higher than a degenerate loop does.
export function looksRepetitive(text: string): boolean {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 200) return false;

  const n = 8;
  const stride = 4;
  const grams = new Set<string>();
  let total = 0;
  for (let i = 0; i + n <= clean.length; i += stride) {
    grams.add(clean.slice(i, i + n));
    total++;
  }
  if (total === 0) return false;
  return grams.size / total < 0.25;
}

export function isCleanOutput(text: string, locale: Locale): boolean {
  return hasCleanScript(text, locale) && hasEnoughTargetScript(text, locale) && !looksRepetitive(text);
}
