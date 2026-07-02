/**
 * Content rules — deterministic, factual quality checks.
 *
 * Enforces the brand-safety policy: no ranking guarantees, no unsupported
 * superlatives, no keyword/city stuffing, no thin content, no template
 * placeholders, no weak FAQ answers. All checks are language-aware (German +
 * common English) and return Finding[].
 *
 * CI-only module: not imported by the Next app graph.
 */

import type { BrandKey } from "@/config/seo/domains";
import { blocker, warning, type Finding } from "./findings";

export interface ContentInput {
  brand: BrandKey;
  pageId: string;
  path: string;
  title: string;
  description: string;
  /** Optional visible body text (rendered HTML → text). */
  bodyText?: string;
  /** Optional visible FAQ pairs. */
  faq?: { question: string; answer: string }[];
}

/** Ranking guarantees / manipulative SEO promises → always a blocker. */
const RANKING_GUARANTEE_PATTERNS: RegExp[] = [
  /\bgarant\w*\s+(platz|rang|ranking|position)\s*(1|eins|#?1)\b/i,
  /\b(platz|rang|position)\s*1\s+(bei|auf)\s+google\b/i,
  /\b#\s*1\s+(bei|on|auf)\s+google\b/i,
  /\bgarant\w*\s+\w*rank/i,
  /\bguaranteed\s+(rank|ranking|first\s+page|top\s+\d)/i,
  /\btop[-\s]?1\s+garant/i,
  /\bsofort\s+auf\s+seite\s*1\b/i,
];

/** Unsupported superlatives / absolute market claims → blocker. */
const SUPERLATIVE_PATTERNS: RegExp[] = [
  /\b(welt(weit)?\s+f(ü|u)hrend)\b/i,
  /\bmarktf(ü|u)hrer\b/i,
  /\bnummer\s*1\b/i,
  /\bdie\s+beste\s+(agentur|l(ö|o)sung|software|wahl)\b/i,
  /\b(das\s+)?beste\s+der\s+welt\b/i,
  /\bunschlagbar\b/i,
  /\b#1\b/,
  /\bworld[-\s]?class\b/i,
  /\bbest[-\s]?in[-\s]?class\b/i,
];

/** Template placeholders that must never ship. */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\{\{\s*\w+\s*\}\}/,
  /\[\s*(stadt|city|ort|region|keyword|brand)\s*\]/i,
  /\bLOREM\s+IPSUM\b/i,
  /\bTODO\b|\bPLACEHOLDER\b|\bXXX\b/,
];

const MIN_TITLE = 15;
const MAX_TITLE = 65;
const MIN_DESC = 50;
const MAX_DESC = 165;
/** City-name repetition threshold within a single text block. */
const CITY_STUFFING_MAX = 4;
/** Minimum visible FAQ answer length (chars) to count as substantive. */
const MIN_FAQ_ANSWER = 40;

function matchAny(text: string, patterns: RegExp[]): string[] {
  const hits: string[] = [];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

function base(input: ContentInput): Partial<Finding> {
  return { brand: input.brand, pageId: input.pageId, path: input.path };
}

export function checkRankingGuarantees(input: ContentInput): Finding[] {
  const haystack = `${input.title}\n${input.description}\n${input.bodyText ?? ""}`;
  return matchAny(haystack, RANKING_GUARANTEE_PATTERNS).map((hit) =>
    blocker("RANKING_GUARANTEE", `Ranking guarantee / manipulative claim: "${hit}"`, base(input))
  );
}

export function checkSuperlatives(input: ContentInput): Finding[] {
  const haystack = `${input.title}\n${input.description}\n${input.bodyText ?? ""}`;
  return matchAny(haystack, SUPERLATIVE_PATTERNS).map((hit) =>
    blocker("UNSUPPORTED_SUPERLATIVE", `Unsupported superlative / absolute claim: "${hit}"`, base(input))
  );
}

export function checkPlaceholders(input: ContentInput): Finding[] {
  const haystack = `${input.title}\n${input.description}\n${input.bodyText ?? ""}`;
  return matchAny(haystack, PLACEHOLDER_PATTERNS).map((hit) =>
    blocker("TEMPLATE_PLACEHOLDER", `Unresolved template placeholder: "${hit}"`, base(input))
  );
}

export function checkTitleDescription(input: ContentInput): Finding[] {
  const findings: Finding[] = [];
  const t = input.title?.trim() ?? "";
  const d = input.description?.trim() ?? "";

  if (!t) findings.push(blocker("MISSING_TITLE", "Title is empty", base(input)));
  else if (t.length < MIN_TITLE)
    findings.push(warning("TITLE_TOO_SHORT", `Title ${t.length} chars (< ${MIN_TITLE})`, base(input)));
  else if (t.length > MAX_TITLE)
    findings.push(warning("TITLE_TOO_LONG", `Title ${t.length} chars (> ${MAX_TITLE})`, base(input)));

  if (!d) findings.push(blocker("MISSING_DESCRIPTION", "Description is empty", base(input)));
  else if (d.length < MIN_DESC)
    findings.push(warning("DESC_TOO_SHORT", `Description ${d.length} chars (< ${MIN_DESC})`, base(input)));
  else if (d.length > MAX_DESC)
    findings.push(warning("DESC_TOO_LONG", `Description ${d.length} chars (> ${MAX_DESC})`, base(input)));

  return findings;
}

export function checkCityStuffing(input: ContentInput, cities: string[]): Finding[] {
  const haystack = `${input.title}\n${input.description}\n${input.bodyText ?? ""}`.toLowerCase();
  const findings: Finding[] = [];
  for (const city of cities) {
    const c = city.toLowerCase();
    if (!c) continue;
    const count = haystack.split(c).length - 1;
    if (count > CITY_STUFFING_MAX) {
      findings.push(
        warning(
          "CITY_STUFFING",
          `City "${city}" repeated ${count}× (> ${CITY_STUFFING_MAX})`,
          base(input)
        )
      );
    }
  }
  return findings;
}

export function checkWeakFaq(input: ContentInput): Finding[] {
  if (!input.faq || input.faq.length === 0) return [];
  const findings: Finding[] = [];
  input.faq.forEach((item, i) => {
    const a = item.answer?.trim() ?? "";
    if (a.length < MIN_FAQ_ANSWER) {
      findings.push(
        warning(
          "WEAK_FAQ_ANSWER",
          `FAQ #${i + 1} answer too short (${a.length} < ${MIN_FAQ_ANSWER} chars)`,
          base(input)
        )
      );
    }
  });
  return findings;
}

/** Aggregate all content rules for one page. */
export function analyzeContent(input: ContentInput, cities: string[] = []): Finding[] {
  return [
    ...checkRankingGuarantees(input),
    ...checkSuperlatives(input),
    ...checkPlaceholders(input),
    ...checkTitleDescription(input),
    ...checkCityStuffing(input, cities),
    ...checkWeakFaq(input),
  ];
}

/**
 * Scan raw text (e.g. a component source file) for banned phrases. Returns the
 * matched code + hit for each violation. Reused by the templates guard.
 */
export function scanBannedPhrases(text: string): { code: string; hit: string }[] {
  const out: { code: string; hit: string }[] = [];
  for (const hit of matchAny(text, RANKING_GUARANTEE_PATTERNS)) out.push({ code: "RANKING_GUARANTEE", hit });
  for (const hit of matchAny(text, SUPERLATIVE_PATTERNS)) out.push({ code: "UNSUPPORTED_SUPERLATIVE", hit });
  for (const hit of matchAny(text, PLACEHOLDER_PATTERNS)) out.push({ code: "TEMPLATE_PLACEHOLDER", hit });
  return out;
}

export const CONTENT_RULE_LIMITS = {
  MIN_TITLE,
  MAX_TITLE,
  MIN_DESC,
  MAX_DESC,
  CITY_STUFFING_MAX,
  MIN_FAQ_ANSWER,
} as const;
