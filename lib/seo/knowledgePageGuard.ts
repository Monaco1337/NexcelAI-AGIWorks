/**
 * Knowledge-page guard (Phase 8) — keeps AEO/GEO editorial content trustworthy.
 *
 * Blocks on:
 *  - id / path integrity (id === `${brand}:/wissen/${slug}`).
 *  - thin structure (min sections / FAQ / takeaways; AEO answer + intro present).
 *  - E-E-A-T: a real author must resolve (explicit authorName, if set, non-empty)
 *    and dates must be valid ISO with dateModified ≥ datePublished.
 *  - banned phrases (ranking guarantees, superlatives, placeholders).
 *  - invented numeric metrics (%, €, "3x", "N Kunden", "spart N …").
 *  - internal links that do not resolve to a registered same-brand route.
 *  - cross-domain near-duplicate topics (AGI vs NEXCEL must differ).
 *  - GENERIC template: two same-brand pages that are near-identical.
 *  - an indexable page (approved + manualIndexApproval) that still has blockers.
 *
 * Includes a negative-fixture self-test. CI-only module: not imported by the app.
 */

import { KNOWLEDGE_PAGES, type KnowledgePage } from "@/data/knowledgePages";
import { PAGE_REGISTRY } from "@/config/seo/pageRegistry";
import type { BrandKey } from "@/config/seo/domains";
import { scanBannedPhrases } from "./contentRules";
import { scanFakeMetrics } from "./caseStudyGuard";
import { checkDuplicates, type DuplicateInput } from "./duplicateGuard";
import { fingerprint, similarity } from "./contentFingerprint";
import { blocker, warning, info, hasBlockers, type Finding } from "./findings";

const MIN_SECTIONS = 3;
const MIN_FAQ = 4;
const MIN_TAKEAWAYS = 3;
/** Same-brand pages more similar than this are a generic template. */
const GENERIC_TEMPLATE_MAX = 0.7;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function knowledgeBody(kp: KnowledgePage): string {
  return [
    kp.title,
    kp.description,
    kp.aeoAnswer,
    ...kp.takeaways,
    ...kp.sections.map((s) => `${s.heading} ${s.body}`),
    ...kp.faq.map((f) => `${f.question} ${f.answer}`),
    ...kp.tags,
  ].join("\n");
}

function dupText(kp: KnowledgePage): string {
  return [kp.title, kp.description, kp.aeoAnswer, kp.sections[0]?.body ?? ""].join("\n");
}

function knownBrandPaths(brand: BrandKey): Set<string> {
  return new Set(PAGE_REGISTRY.filter((p) => p.brand === brand).map((p) => p.path));
}

function checkOne(kp: KnowledgePage): Finding[] {
  const findings: Finding[] = [];
  const meta = { brand: kp.brand, pageId: kp.id, path: kp.path };

  if (kp.id !== `${kp.brand}:${kp.path}`) {
    findings.push(blocker("KP_ID_MISMATCH", `id "${kp.id}" != "${kp.brand}:${kp.path}"`, meta));
  }
  if (kp.path !== `/wissen/${kp.slug}`) {
    findings.push(blocker("KP_PATH_MISMATCH", `path "${kp.path}" != "/wissen/${kp.slug}"`, meta));
  }

  // Structure minimums.
  if (kp.sections.length < MIN_SECTIONS)
    findings.push(blocker("KP_TOO_FEW_SECTIONS", `${kp.sections.length} sections (< ${MIN_SECTIONS})`, meta));
  if (kp.faq.length < MIN_FAQ)
    findings.push(blocker("KP_TOO_FEW_FAQ", `${kp.faq.length} FAQ (< ${MIN_FAQ})`, meta));
  if (kp.takeaways.length < MIN_TAKEAWAYS)
    findings.push(blocker("KP_TOO_FEW_TAKEAWAYS", `${kp.takeaways.length} takeaways (< ${MIN_TAKEAWAYS})`, meta));
  if (!kp.aeoAnswer.trim() || !kp.heroIntro.trim() || !kp.description.trim())
    findings.push(blocker("KP_THIN_CONTENT", "Missing aeoAnswer/heroIntro/description", meta));
  if (kp.sections.some((s) => !s.heading.trim() || !s.body.trim()))
    findings.push(blocker("KP_EMPTY_SECTION", "A section has an empty heading or body", meta));

  // E-E-A-T: real author + valid dates.
  if (kp.authorName !== undefined && !kp.authorName.trim())
    findings.push(blocker("KP_EMPTY_AUTHOR", "authorName is set but empty (no real author)", meta));
  if (!ISO_DATE.test(kp.datePublished) || !ISO_DATE.test(kp.dateModified)) {
    findings.push(blocker("KP_INVALID_DATE", "datePublished/dateModified must be YYYY-MM-DD", meta));
  } else if (kp.dateModified < kp.datePublished) {
    findings.push(blocker("KP_DATE_ORDER", "dateModified is before datePublished", meta));
  }

  // Banned phrases + fake metrics across the whole page text.
  const fullText = knowledgeBody(kp);
  for (const { code, hit } of scanBannedPhrases(fullText)) {
    findings.push(blocker(code, `Banned phrase in knowledge page: "${hit}"`, meta));
  }
  for (const hit of scanFakeMetrics(fullText)) {
    findings.push(blocker("KP_FAKE_METRIC", `Numeric claim "${hit}" is not allowed on knowledge pages`, meta));
  }

  // Internal links must resolve to a registered same-brand route.
  const known = knownBrandPaths(kp.brand);
  for (const rel of kp.relatedPaths) {
    if (!known.has(rel)) {
      findings.push(blocker("KP_BROKEN_INTERNAL_LINK", `relatedPath "${rel}" is not a registered ${kp.brand} route`, meta));
    }
  }

  if (kp.approved && kp.manualIndexApproval && hasBlockers(findings)) {
    findings.push(blocker("KP_INDEXABLE_WITH_BLOCKERS", "Knowledge page is indexable but has blockers", meta));
  }

  return findings;
}

/** Same-brand generic-template detection: near-identical pages block. */
function checkGenericTemplate(pages: KnowledgePage[]): Finding[] {
  const findings: Finding[] = [];
  const fps = pages.map((kp) => ({ kp, fp: fingerprint(kp.id, knowledgeBody(kp)) }));
  for (let i = 0; i < fps.length; i++) {
    for (let j = i + 1; j < fps.length; j++) {
      const a = fps[i];
      const b = fps[j];
      if (a.kp.brand !== b.kp.brand) continue;
      const sim = similarity(a.fp, b.fp);
      if (sim >= GENERIC_TEMPLATE_MAX) {
        findings.push(
          blocker(
            "KP_GENERIC_TEMPLATE",
            `Same-brand knowledge pages near-identical (${sim.toFixed(2)} ≥ ${GENERIC_TEMPLATE_MAX}): ${a.kp.id} ↔ ${b.kp.id}`,
            { brand: a.kp.brand, detail: `${a.kp.path} vs ${b.kp.path}` }
          )
        );
      }
    }
  }
  return findings;
}

export function checkKnowledgePages(pages: KnowledgePage[] = KNOWLEDGE_PAGES): Finding[] {
  const findings: Finding[] = [];
  for (const kp of pages) findings.push(...checkOne(kp));

  // Cross-domain / within-brand near-duplicate protection.
  const dupInputs: DuplicateInput[] = pages.map((kp) => ({ id: kp.id, brand: kp.brand, path: kp.path, text: dupText(kp) }));
  findings.push(...checkDuplicates(dupInputs));

  // Generic-template (same brand, near-identical) → blocker.
  findings.push(...checkGenericTemplate(pages));

  // Self-test: negative fixtures the guard MUST reject.
  const bannedHit = scanBannedPhrases("weltweit führend und garantiert Platz 1 bei Google");
  const metricHit = scanFakeMetrics("Wir steigern die Conversion um 42% und sparen 10 Stunden");
  const genericSelf = checkGenericTemplate([
    { ...pages[0], id: "agiworks:/wissen/a", slug: "a", path: "/wissen/a", brand: "agiworks" },
    { ...pages[0], id: "agiworks:/wissen/b", slug: "b", path: "/wissen/b", brand: "agiworks" },
  ]);
  if (bannedHit.length > 0 && metricHit.length > 0 && hasBlockers(genericSelf)) {
    findings.push(info("GUARD_SELFTEST_OK", "knowledge-pages: negative fixtures correctly flagged"));
  } else {
    findings.push(blocker("GUARD_SELFTEST_FAILED", "knowledge-page guard failed on known-bad fixtures"));
  }

  const indexable = pages.filter((p) => p.approved && p.manualIndexApproval).length;
  const agi = pages.filter((p) => p.brand === "agiworks").length;
  const nexcel = pages.filter((p) => p.brand === "nexcel").length;
  if (!hasBlockers(findings)) {
    findings.push(
      info(
        "KNOWLEDGE_PAGES_OK",
        `${pages.length} knowledge pages validated (AGI ${agi}, NEXCEL ${nexcel}; ${indexable} indexable)`
      )
    );
    if (indexable === 0) {
      findings.push(warning("KNOWLEDGE_PAGES_NONE_INDEXABLE", "All knowledge pages are candidate/noindex (deny-by-default)"));
    }
  }
  return findings;
}
