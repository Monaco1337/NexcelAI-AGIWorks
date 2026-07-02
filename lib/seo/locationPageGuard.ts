/**
 * Location-page guard (Phase 7) — keeps NRW city pages honest and distinct.
 *
 * Blocks on:
 *  - id / path integrity (id === `${brand}:/standorte/${slug}`).
 *  - fake local-SEO signals (reuses the shared checkLocation on the full body:
 *    office/branch claims, opening hours, geo coordinates, "Büro in <Stadt>").
 *  - thin structure (min services / FAQ / process / industries; ≥1 nearby city).
 *  - missing / non-differentiating localContext (must name the city, real facts).
 *  - banned phrases (ranking guarantees, superlatives, placeholders).
 *  - invented numeric metrics.
 *  - internal links / nearby-city links that do not resolve to a real same-brand
 *    location page or registered route.
 *  - cross-domain near-duplicate city pages (AGI vs NEXCEL must differ).
 *  - GENERIC city template: two same-brand city pages that are near-identical.
 *  - an indexable location page (approved + manualIndexApproval) with blockers.
 *
 * Includes a negative-fixture self-test. CI-only module: not imported by the app.
 */

import { LOCATION_PAGES, type LocationPage } from "@/data/locationPages";
import { PAGE_REGISTRY } from "@/config/seo/pageRegistry";
import type { BrandKey } from "@/config/seo/domains";
import { scanBannedPhrases } from "./contentRules";
import { scanFakeMetrics } from "./caseStudyGuard";
import { checkLocation } from "./locationGuard";
import { checkDuplicates, type DuplicateInput } from "./duplicateGuard";
import { fingerprint, similarity } from "./contentFingerprint";
import { blocker, warning, info, hasBlockers, type Finding } from "./findings";

const MIN_SERVICES = 3;
const MIN_FAQ = 5;
const MIN_PROCESS = 3;
const MIN_INDUSTRIES = 3;
const MIN_NEARBY = 1;
const MIN_LOCALCONTEXT = 120;
/** Same-brand city pages more similar than this are a generic template. */
const GENERIC_TEMPLATE_MAX = 0.7;

/** Full body text of a location page (data-driven; template chrome excluded). */
export function locationBody(lp: LocationPage): string {
  return [
    lp.title,
    lp.description,
    lp.h1,
    lp.heroIntro,
    lp.aeoAnswer,
    lp.localContext,
    ...lp.services.map((s) => `${s.title} ${s.description ?? ""}`),
    ...lp.industries,
    ...lp.process.map((p) => `${p.title} ${p.description}`),
    ...lp.faq.map((f) => `${f.question} ${f.answer}`),
  ].join("\n");
}

/** Compact text for duplicate/similarity comparison. */
function dupText(lp: LocationPage): string {
  return [lp.title, lp.description, lp.aeoAnswer, lp.localContext].join("\n");
}

/** Body text per pageId, for the registry location check (full DOM coverage). */
export function locationBodies(pages: LocationPage[] = LOCATION_PAGES): Record<string, string> {
  const map: Record<string, string> = {};
  for (const lp of pages) map[lp.id] = locationBody(lp);
  return map;
}

function knownBrandPaths(brand: BrandKey): Set<string> {
  return new Set(PAGE_REGISTRY.filter((p) => p.brand === brand).map((p) => p.path));
}

function checkOne(lp: LocationPage, brandSlugs: Set<string>): Finding[] {
  const findings: Finding[] = [];
  const meta = { brand: lp.brand, pageId: lp.id, path: lp.path };

  if (lp.id !== `${lp.brand}:${lp.path}`) {
    findings.push(blocker("LP_ID_MISMATCH", `id "${lp.id}" != "${lp.brand}:${lp.path}"`, meta));
  }
  if (lp.path !== `/standorte/${lp.slug}`) {
    findings.push(blocker("LP_PATH_MISMATCH", `path "${lp.path}" != "/standorte/${lp.slug}"`, meta));
  }
  if (!lp.city.trim() || !lp.region.trim()) {
    findings.push(blocker("LP_MISSING_CITY", "city/region must be set", meta));
  }

  // Structure minimums.
  if (lp.services.length < MIN_SERVICES)
    findings.push(blocker("LP_TOO_FEW_SERVICES", `${lp.services.length} services (< ${MIN_SERVICES})`, meta));
  if (lp.faq.length < MIN_FAQ)
    findings.push(blocker("LP_TOO_FEW_FAQ", `${lp.faq.length} FAQ (< ${MIN_FAQ})`, meta));
  if (lp.process.length < MIN_PROCESS)
    findings.push(blocker("LP_TOO_FEW_PROCESS", `${lp.process.length} process steps (< ${MIN_PROCESS})`, meta));
  if (lp.industries.length < MIN_INDUSTRIES)
    findings.push(blocker("LP_TOO_FEW_INDUSTRIES", `${lp.industries.length} industries (< ${MIN_INDUSTRIES})`, meta));
  if (lp.nearbyCities.length < MIN_NEARBY)
    findings.push(blocker("LP_NO_NEARBY", `${lp.nearbyCities.length} nearby cities (< ${MIN_NEARBY})`, meta));

  // Real local differentiation: localContext must be substantive AND name the city.
  const lc = lp.localContext.trim();
  if (lc.length < MIN_LOCALCONTEXT)
    findings.push(blocker("LP_THIN_LOCAL_CONTEXT", `localContext ${lc.length} chars (< ${MIN_LOCALCONTEXT})`, meta));
  if (!lc.toLowerCase().includes(lp.city.toLowerCase()))
    findings.push(blocker("LP_GENERIC_LOCAL_CONTEXT", `localContext does not mention "${lp.city}"`, meta));
  if (!lp.aeoAnswer.trim() || !lp.heroIntro.trim())
    findings.push(blocker("LP_THIN_CONTENT", "Missing aeoAnswer/heroIntro", meta));

  // Fake local-SEO signals on the whole body (reuses the shared location guard).
  findings.push(...checkLocation({ brand: lp.brand, pageId: lp.id, path: lp.path, text: locationBody(lp) }));

  // Banned phrases + fake metrics.
  const fullText = locationBody(lp);
  for (const { code, hit } of scanBannedPhrases(fullText)) {
    findings.push(blocker(code, `Banned phrase in location page: "${hit}"`, meta));
  }
  for (const hit of scanFakeMetrics(fullText)) {
    findings.push(blocker("LP_FAKE_METRIC", `Numeric claim "${hit}" is not allowed on location pages`, meta));
  }

  // Internal links resolve to a registered same-brand route.
  const known = knownBrandPaths(lp.brand);
  for (const rel of lp.relatedPaths) {
    if (!known.has(rel)) {
      findings.push(blocker("LP_BROKEN_INTERNAL_LINK", `relatedPath "${rel}" is not a registered ${lp.brand} route`, meta));
    }
  }
  // Nearby city links resolve to a real same-brand location page (not self).
  for (const slug of lp.nearbyCities) {
    if (slug === lp.slug) {
      findings.push(blocker("LP_SELF_NEARBY", `nearby city "${slug}" links to itself`, meta));
    } else if (!brandSlugs.has(slug)) {
      findings.push(blocker("LP_BROKEN_NEARBY", `nearby city "${slug}" has no ${lp.brand} location page`, meta));
    }
  }

  if (lp.approved && lp.manualIndexApproval && hasBlockers(findings)) {
    findings.push(blocker("LP_INDEXABLE_WITH_BLOCKERS", "Location page is indexable but has blockers", meta));
  }

  return findings;
}

/** Same-brand generic-template detection: near-identical city pages block. */
function checkGenericTemplate(pages: LocationPage[]): Finding[] {
  const findings: Finding[] = [];
  const fps = pages.map((lp) => ({ lp, fp: fingerprint(lp.id, locationBody(lp)) }));
  for (let i = 0; i < fps.length; i++) {
    for (let j = i + 1; j < fps.length; j++) {
      const a = fps[i];
      const b = fps[j];
      if (a.lp.brand !== b.lp.brand) continue;
      const sim = similarity(a.fp, b.fp);
      if (sim >= GENERIC_TEMPLATE_MAX) {
        findings.push(
          blocker(
            "LP_GENERIC_CITY_TEMPLATE",
            `Same-brand city pages near-identical (${sim.toFixed(2)} ≥ ${GENERIC_TEMPLATE_MAX}): ${a.lp.id} ↔ ${b.lp.id}`,
            { brand: a.lp.brand, detail: `${a.lp.path} vs ${b.lp.path}` }
          )
        );
      }
    }
  }
  return findings;
}

export function checkLocationPages(pages: LocationPage[] = LOCATION_PAGES): Finding[] {
  const findings: Finding[] = [];
  const slugsByBrand: Record<BrandKey, Set<string>> = { nexcel: new Set(), agiworks: new Set() };
  for (const lp of pages) slugsByBrand[lp.brand].add(lp.slug);

  for (const lp of pages) findings.push(...checkOne(lp, slugsByBrand[lp.brand]));

  // Cross-domain / within-brand near-duplicate protection.
  const dupInputs: DuplicateInput[] = pages.map((lp) => ({ id: lp.id, brand: lp.brand, path: lp.path, text: dupText(lp) }));
  findings.push(...checkDuplicates(dupInputs));

  // Generic-city-template (same brand, near-identical) → blocker.
  findings.push(...checkGenericTemplate(pages));

  // Self-test: negative fixtures the guard MUST reject.
  const bannedHit = scanBannedPhrases("weltweit führend und garantiert Platz 1 bei Google");
  const officeHit = checkLocation({
    brand: "agiworks",
    pageId: "test",
    path: "/standorte/test",
    text: "Besuchen Sie uns in unserem Büro in Dortmund, Öffnungszeiten Mo-Fr.",
  });
  const genericSelf = checkGenericTemplate([
    { ...pages[0], id: "agiworks:/standorte/a", slug: "a", path: "/standorte/a", brand: "agiworks" },
    { ...pages[0], id: "agiworks:/standorte/b", slug: "b", path: "/standorte/b", brand: "agiworks" },
  ]);
  if (bannedHit.length > 0 && hasBlockers(officeHit) && hasBlockers(genericSelf)) {
    findings.push(info("GUARD_SELFTEST_OK", "location-pages: negative fixtures correctly flagged"));
  } else {
    findings.push(blocker("GUARD_SELFTEST_FAILED", "location-page guard failed on known-bad fixtures"));
  }

  const indexable = pages.filter((p) => p.approved && p.manualIndexApproval).length;
  const agi = pages.filter((p) => p.brand === "agiworks").length;
  const nexcel = pages.filter((p) => p.brand === "nexcel").length;
  if (!hasBlockers(findings)) {
    findings.push(
      info(
        "LOCATION_PAGES_OK",
        `${pages.length} location pages validated (AGI ${agi}, NEXCEL ${nexcel}; ${indexable} indexable)`
      )
    );
    if (indexable === 0) {
      findings.push(warning("LOCATION_PAGES_NONE_INDEXABLE", "All location pages are candidate/noindex (deny-by-default)"));
    }
  }
  return findings;
}
