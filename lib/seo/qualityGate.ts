/**
 * Quality gate — decides whether a page is allowed to be indexable, independent
 * of (and stricter than) the raw indexing policy. Even an approved +
 * manualIndexApproval page must pass content quality before it may be indexed.
 *
 * Deterministic + score-based. Runs on registry data plus optional content
 * findings (from contentRules) and optional rendered body. Designed so broken
 * fixtures FAIL.
 *
 * CI-only module: not imported by the Next app graph.
 */

import type { SeoPage, SeoPageType } from "@/config/seo/pageRegistry";
import { blocker, warning, info, type Finding } from "./findings";
import { analyzeContent, type ContentInput } from "./contentRules";

export interface QualityContext {
  /** Cities to check for stuffing (brand areaServed). */
  cities?: string[];
  /** Optional visible body text for the page. */
  bodyText?: string;
  /** Optional visible FAQ. */
  faq?: { question: string; answer: string }[];
}

export interface QualityResult {
  pageId: string;
  score: number;
  threshold: number;
  /** Final verdict: may this page be indexed? */
  canIndex: boolean;
  findings: Finding[];
}

/** Minimum score per page type for indexability. */
const TYPE_THRESHOLDS: Record<SeoPageType, number> = {
  home: 80,
  money: 80,
  // Location pages must clear a high bar before indexing (real local
  // differentiation, no generic city template).
  location: 90,
  // Knowledge/editorial pages carry E-E-A-T weight; hold a high bar too.
  knowledge: 80,
  // System pages are commercial detail pages; same bar as money pages.
  system: 80,
  tool: 70,
  content: 70,
  legal: 50,
};

const WARNING_PENALTY = 8;
const BLOCKER_PENALTY = 40;

export function getIndexabilityStatus(
  page: SeoPage,
  context: QualityContext = {}
): QualityResult {
  const findings: Finding[] = [];

  const contentInput: ContentInput = {
    brand: page.brand,
    pageId: page.id,
    path: page.path,
    title: page.title,
    description: page.description,
    bodyText: context.bodyText,
    faq: context.faq,
  };

  // Content rules (banned phrases, superlatives, lengths, stuffing, weak FAQ).
  findings.push(...analyzeContent(contentInput, context.cities ?? []));

  // Registry-level gate flags.
  if (!page.approved) {
    findings.push(blocker("NOT_APPROVED", "Page is not approved", pageMeta(page)));
  }
  if (!page.manualIndexApproval) {
    findings.push(
      blocker("NO_MANUAL_INDEX_APPROVAL", "manualIndexApproval is false", pageMeta(page))
    );
  }
  if (!page.quality || page.quality.index !== true) {
    findings.push(
      blocker("QUALITY_INDEX_FALSE", "quality.index is not true", pageMeta(page))
    );
  }

  const threshold = TYPE_THRESHOLDS[page.type];
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;

  let score = 100 - warnings * WARNING_PENALTY - blockers * BLOCKER_PENALTY;
  score = Math.max(0, Math.min(100, score));

  const canIndex = blockers === 0 && score >= threshold;

  if (canIndex) {
    findings.push(
      info("QUALITY_OK", `Indexable (score ${score} ≥ ${threshold})`, pageMeta(page))
    );
  } else if (blockers === 0) {
    findings.push(
      warning(
        "QUALITY_BELOW_THRESHOLD",
        `Score ${score} < ${threshold} for type "${page.type}"`,
        pageMeta(page)
      )
    );
  }

  return { pageId: page.id, score, threshold, canIndex, findings };
}

function pageMeta(page: SeoPage): Partial<Finding> {
  return { brand: page.brand, pageId: page.id, path: page.path };
}

export { TYPE_THRESHOLDS };
