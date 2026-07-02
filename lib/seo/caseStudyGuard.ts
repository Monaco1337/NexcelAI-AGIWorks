/**
 * Case-study guard — enforces "real work only, no fake metrics".
 *
 * Blocks on:
 *  - id / brand / systemSlug integrity (must reference a real system).
 *  - thin content (missing challenge/approach/summary).
 *  - banned phrases (ranking guarantees, superlatives, placeholders).
 *  - fake metrics in outcomes/text (numeric performance claims) unless the case
 *    study sets `verifiedMetrics: true`.
 *  - cross-domain near-duplicate case studies (NEXCEL vs AGI must differ).
 *  - a case study flagged indexable (approved + manualIndexApproval) that still
 *    has any blocker.
 *
 * Includes negative-fixture self-tests. CI-only module: not imported by the app.
 */

import { CASE_STUDIES, type CaseStudy } from "@/data/caseStudies";
import { SYSTEM_SLUGS } from "@/lib/systems-slugs";
import { scanBannedPhrases } from "./contentRules";
import { checkDuplicates, type DuplicateInput } from "./duplicateGuard";
import { blocker, warning, info, hasBlockers, type Finding } from "./findings";

/** Numeric performance-claim shapes that count as "metrics". */
const FAKE_METRIC_PATTERNS: RegExp[] = [
  /[+\-]\s?\d+(?:[.,]\d+)?\s?%/,
  /\b\d+(?:[.,]\d+)?\s?%/,
  /\b\d+(?:[.,]\d+)?\s?x\b/i,
  /(?:€|eur)\s?\d/i,
  /\b\d+(?:[.,]\d+)?\s?(?:€|eur)\b/i,
  /\b\d{2,}\s?(?:kunden|leads|nutzer|user|projekte|downloads|anfragen|umsatz)\b/i,
  /\bspart\s+\d/i,
  /\b\d+\s?(?:stunden|tage|wochen)\s+(?:gespart|schneller)\b/i,
];

function caseStudyText(cs: Pick<CaseStudy, "title" | "summary" | "challenge" | "approach" | "outcomes" | "tags">): string {
  return [
    cs.title,
    cs.summary,
    cs.challenge,
    cs.approach,
    ...cs.outcomes.map((o) => `${o.label} ${o.value}`),
    ...cs.tags,
  ].join("\n");
}

export function scanFakeMetrics(text: string): string[] {
  const hits: string[] = [];
  for (const re of FAKE_METRIC_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(m[0].trim());
  }
  return hits;
}

function checkOne(cs: CaseStudy): Finding[] {
  const findings: Finding[] = [];
  const meta = { brand: cs.brand, pageId: cs.id, path: `/projekte/${cs.slug}` };

  if (cs.id !== `${cs.brand}:${cs.slug}`) {
    findings.push(blocker("CS_ID_MISMATCH", `id "${cs.id}" != "${cs.brand}:${cs.slug}"`, meta));
  }
  if (!(SYSTEM_SLUGS as readonly string[]).includes(cs.systemSlug)) {
    findings.push(blocker("CS_UNKNOWN_SYSTEM", `systemSlug "${cs.systemSlug}" not in system catalog`, meta));
  }
  if (!cs.challenge.trim() || !cs.approach.trim() || !cs.summary.trim()) {
    findings.push(blocker("CS_THIN_CONTENT", "Missing summary/challenge/approach", meta));
  }

  const text = caseStudyText(cs);
  for (const { code, hit } of scanBannedPhrases(text)) {
    findings.push(blocker(code, `Banned phrase in case study: "${hit}"`, meta));
  }

  if (!cs.verifiedMetrics) {
    for (const hit of scanFakeMetrics(text)) {
      findings.push(
        blocker(
          "CS_FAKE_METRIC",
          `Numeric metric "${hit}" requires verifiedMetrics: true (real, verifiable)`,
          meta
        )
      );
    }
  }

  // Indexable-but-broken safety: an approved+cleared case study must be clean.
  if (cs.approved && cs.manualIndexApproval && hasBlockers(findings)) {
    findings.push(
      blocker("CS_INDEXABLE_WITH_BLOCKERS", "Case study is indexable but has blockers", meta)
    );
  }

  return findings;
}

export function checkCaseStudies(studies: CaseStudy[] = CASE_STUDIES): Finding[] {
  const findings: Finding[] = [];
  for (const cs of studies) findings.push(...checkOne(cs));

  // Cross-domain / within-brand duplicate protection across case studies.
  const dupInputs: DuplicateInput[] = studies.map((cs) => ({
    id: cs.id,
    brand: cs.brand,
    path: `/projekte/${cs.slug}`,
    text: caseStudyText(cs),
  }));
  findings.push(...checkDuplicates(dupInputs));

  // Self-tests: negative fixtures the guard MUST reject.
  const fakeMetricHits = scanFakeMetrics("Umsatz +300% und 5x mehr Leads in 30 Tagen gespart");
  const dupSelf = checkDuplicates([
    { id: "nexcel:x", brand: "nexcel", path: "/projekte/x", text: "Identisches Fallbeispiel Text Systemarchitektur Plattform" },
    { id: "agiworks:x", brand: "agiworks", path: "/projekte/x", text: "Identisches Fallbeispiel Text Systemarchitektur Plattform" },
  ]);
  if (fakeMetricHits.length > 0 && hasBlockers(dupSelf)) {
    findings.push(info("GUARD_SELFTEST_OK", "case-studies: negative fixtures correctly flagged"));
  } else {
    findings.push(blocker("GUARD_SELFTEST_FAILED", "case-study guard failed on known-bad fixtures"));
  }

  const indexableCount = studies.filter((c) => c.approved && c.manualIndexApproval).length;
  if (!hasBlockers(findings)) {
    findings.push(
      info(
        "CASE_STUDIES_OK",
        `${studies.length} case studies validated (${indexableCount} indexable, real-only, no fake metrics)`
      )
    );
    if (indexableCount === 0) {
      findings.push(
        warning("CASE_STUDIES_NONE_INDEXABLE", "No case studies are indexable yet (deny-by-default)")
      );
    }
  }
  return findings;
}
