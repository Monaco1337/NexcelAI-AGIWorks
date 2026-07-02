/**
 * Money-page guard (Phase 6) — keeps commercial pages safe and non-duplicate.
 *
 * Blocks on:
 *  - id / path / collection ↔ brand integrity (AGI→/leistungen, NEXCEL→/loesungen).
 *  - unknown systemSlug (when set).
 *  - thin structure (min modules / FAQ / process / industries / decision).
 *  - banned phrases (ranking guarantees, superlatives, placeholders).
 *  - invented numeric metrics without attestation.
 *  - internal links that do not resolve to a registered same-brand route.
 *  - cross-domain near-duplicate money pages (AGI vs NEXCEL must differ).
 *  - an indexable money page (approved + manualIndexApproval) that still has blockers.
 *
 * Includes negative-fixture self-tests. CI-only module: not imported by the app.
 */

import { MONEY_PAGES, type MoneyPage } from "@/data/moneyPages";
import { PAGE_REGISTRY } from "@/config/seo/pageRegistry";
import { SYSTEM_SLUGS } from "@/lib/systems-slugs";
import type { BrandKey } from "@/config/seo/domains";
import { scanBannedPhrases } from "./contentRules";
import { scanFakeMetrics } from "./caseStudyGuard";
import { checkDuplicates, type DuplicateInput } from "./duplicateGuard";
import { blocker, warning, info, hasBlockers, type Finding } from "./findings";

const MIN_MODULES = 6;
const MIN_FAQ = 5;
const MIN_PROCESS = 4;
const MIN_INDUSTRIES = 3;
const MIN_APPROACH = 4;

const COLLECTION_FOR_BRAND: Record<BrandKey, MoneyPage["collection"]> = {
  agiworks: "leistungen",
  nexcel: "loesungen",
};

function moneyText(mp: MoneyPage): string {
  return [mp.title, mp.description, mp.aeoAnswer, mp.problem, mp.solutionIntro].join("\n");
}

/** Registered same-brand routes (core + money siblings). */
function knownBrandPaths(brand: BrandKey): Set<string> {
  return new Set(PAGE_REGISTRY.filter((p) => p.brand === brand).map((p) => p.path));
}

function checkOne(mp: MoneyPage): Finding[] {
  const findings: Finding[] = [];
  const meta = { brand: mp.brand, pageId: mp.id, path: mp.path };

  if (mp.id !== `${mp.brand}:${mp.path}`) {
    findings.push(blocker("MP_ID_MISMATCH", `id "${mp.id}" != "${mp.brand}:${mp.path}"`, meta));
  }
  const expectedCollection = COLLECTION_FOR_BRAND[mp.brand];
  if (mp.collection !== expectedCollection) {
    findings.push(
      blocker("MP_WRONG_COLLECTION", `${mp.brand} must use "${expectedCollection}", got "${mp.collection}"`, meta)
    );
  }
  if (mp.path !== `/${mp.collection}/${mp.slug}`) {
    findings.push(blocker("MP_PATH_MISMATCH", `path "${mp.path}" != "/${mp.collection}/${mp.slug}"`, meta));
  }
  if (mp.systemSlug && !(SYSTEM_SLUGS as readonly string[]).includes(mp.systemSlug)) {
    findings.push(blocker("MP_UNKNOWN_SYSTEM", `systemSlug "${mp.systemSlug}" not in system catalog`, meta));
  }

  // Structure minimums.
  if (mp.modules.length < MIN_MODULES)
    findings.push(blocker("MP_TOO_FEW_MODULES", `${mp.modules.length} modules (< ${MIN_MODULES})`, meta));
  if (mp.faq.length < MIN_FAQ)
    findings.push(blocker("MP_TOO_FEW_FAQ", `${mp.faq.length} FAQ (< ${MIN_FAQ})`, meta));
  if (mp.process.length < MIN_PROCESS)
    findings.push(blocker("MP_TOO_FEW_PROCESS", `${mp.process.length} process steps (< ${MIN_PROCESS})`, meta));
  if (mp.industries.length < MIN_INDUSTRIES)
    findings.push(blocker("MP_TOO_FEW_INDUSTRIES", `${mp.industries.length} industries (< ${MIN_INDUSTRIES})`, meta));
  if (mp.approach.length < MIN_APPROACH)
    findings.push(blocker("MP_TOO_FEW_APPROACH", `${mp.approach.length} approach points (< ${MIN_APPROACH})`, meta));
  if (!mp.aeoAnswer.trim() || !mp.problem.trim() || !mp.solutionIntro.trim())
    findings.push(blocker("MP_THIN_CONTENT", "Missing aeoAnswer/problem/solutionIntro", meta));
  if (mp.decision.suitable.length < 2 || mp.decision.notSuitable.length < 1 || !mp.decision.alternative.trim())
    findings.push(blocker("MP_WEAK_DECISION", "Decision matrix incomplete", meta));

  // Banned phrases + fake metrics across the whole page text.
  const fullText = [
    moneyText(mp),
    ...mp.modules.map((m) => `${m.title} ${m.description ?? ""}`),
    ...mp.approach,
    ...mp.industries,
    ...mp.decision.suitable,
    ...mp.decision.notSuitable,
    mp.decision.alternative,
    mp.costNote,
    ...mp.process.map((p) => `${p.title} ${p.description}`),
    ...mp.faq.map((f) => `${f.question} ${f.answer}`),
  ].join("\n");

  for (const { code, hit } of scanBannedPhrases(fullText)) {
    findings.push(blocker(code, `Banned phrase in money page: "${hit}"`, meta));
  }
  for (const hit of scanFakeMetrics(fullText)) {
    findings.push(blocker("MP_FAKE_METRIC", `Numeric performance claim "${hit}" is not allowed on money pages`, meta));
  }

  // Internal links must resolve to a registered same-brand route.
  const known = knownBrandPaths(mp.brand);
  for (const rel of mp.relatedPaths) {
    if (!known.has(rel)) {
      findings.push(blocker("MP_BROKEN_INTERNAL_LINK", `relatedPath "${rel}" is not a registered ${mp.brand} route`, meta));
    }
  }

  // Indexable-but-broken safety.
  if (mp.approved && mp.manualIndexApproval && hasBlockers(findings)) {
    findings.push(blocker("MP_INDEXABLE_WITH_BLOCKERS", "Money page is indexable but has blockers", meta));
  }

  return findings;
}

export function checkMoneyPages(pages: MoneyPage[] = MONEY_PAGES): Finding[] {
  const findings: Finding[] = [];
  for (const mp of pages) findings.push(...checkOne(mp));

  // Cross-domain / within-brand duplicate protection across money pages.
  const dupInputs: DuplicateInput[] = pages.map((mp) => ({
    id: mp.id,
    brand: mp.brand,
    path: mp.path,
    text: moneyText(mp),
  }));
  findings.push(...checkDuplicates(dupInputs));

  // Self-tests: negative fixtures the guard MUST reject.
  const bannedHit = scanBannedPhrases("Wir sind die beste Agentur und garantiert Platz 1 bei Google");
  const dupSelf = checkDuplicates([
    { id: "agiworks:/leistungen/x", brand: "agiworks", path: "/leistungen/x", text: "Identischer Money Page Text Systemarchitektur und Plattform Umsetzung" },
    { id: "nexcel:/loesungen/x", brand: "nexcel", path: "/loesungen/x", text: "Identischer Money Page Text Systemarchitektur und Plattform Umsetzung" },
  ]);
  if (bannedHit.length > 0 && hasBlockers(dupSelf)) {
    findings.push(info("GUARD_SELFTEST_OK", "money-pages: negative fixtures correctly flagged"));
  } else {
    findings.push(blocker("GUARD_SELFTEST_FAILED", "money-page guard failed on known-bad fixtures"));
  }

  const indexable = pages.filter((p) => p.approved && p.manualIndexApproval).length;
  const agi = pages.filter((p) => p.brand === "agiworks").length;
  const nexcel = pages.filter((p) => p.brand === "nexcel").length;
  if (!hasBlockers(findings)) {
    findings.push(
      info(
        "MONEY_PAGES_OK",
        `${pages.length} money pages validated (AGI ${agi} /leistungen, NEXCEL ${nexcel} /loesungen; ${indexable} indexable)`
      )
    );
    if (indexable === 0) {
      findings.push(warning("MONEY_PAGES_NONE_INDEXABLE", "All money pages are candidate/noindex (deny-by-default)"));
    }
  }
  return findings;
}
