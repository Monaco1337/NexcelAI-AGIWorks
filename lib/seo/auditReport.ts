/**
 * Production-readiness audit (Phase 9 — final audit).
 *
 * Aggregates system-level invariants that must hold before go-live, on top of the
 * individual guards. Hard invariants (blockers):
 *
 *  - Every page the registry marks indexable MUST also pass the LIVE quality gate
 *    (score ≥ type threshold, zero content blockers). Registry and gate may never
 *    disagree in the indexable direction.
 *  - Every indexable page's canonical host equals its own brand host.
 *  - Each brand has at least one indexable page (sitemap is never empty).
 *
 * It also emits a readiness summary (counts per brand/type, indexable vs
 * candidate) and a GO / NO-GO verdict. CI-only module.
 */

import { PAGE_REGISTRY, type SeoPage, type SeoPageType } from "@/config/seo/pageRegistry";
import { SEO_BRANDS } from "@/config/seo/brands";
import { CANONICAL_DOMAIN, type BrandKey } from "@/config/seo/domains";
import { isPageIndexable } from "@/config/seo/indexing";
import { getIndexabilityStatus } from "./qualityGate";
import { canonicalForPage } from "./canonical";
import { blocker, warning, info, hasBlockers, type Finding } from "./findings";

const BRANDS: BrandKey[] = ["nexcel", "agiworks"];
const TYPES: SeoPageType[] = ["home", "money", "location", "knowledge", "tool", "content", "legal"];

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

export function auditReadiness(pages: SeoPage[] = PAGE_REGISTRY): Finding[] {
  const findings: Finding[] = [];
  const indexable = pages.filter((p) => isPageIndexable(p));

  // Invariant 1: registry-indexable ⇒ passes the live quality gate.
  for (const p of indexable) {
    const res = getIndexabilityStatus(p, { cities: SEO_BRANDS[p.brand].areaServed });
    if (!res.canIndex) {
      findings.push(
        blocker(
          "READINESS_INDEXABLE_FAILS_GATE",
          `Indexable page fails live gate (score ${res.score} < ${res.threshold} or has blockers)`,
          { brand: p.brand, pageId: p.id, path: p.path }
        )
      );
    }
  }

  // Invariant 2: indexable canonical host == brand host.
  for (const p of indexable) {
    const host = hostOf(canonicalForPage(p));
    const want = hostOf(CANONICAL_DOMAIN[p.brand]);
    if (host !== want) {
      findings.push(
        blocker("READINESS_CANONICAL_HOST", `Canonical host "${host}" != brand host "${want}"`, {
          brand: p.brand,
          pageId: p.id,
          path: p.path,
        })
      );
    }
  }

  // Invariant 3: each brand has ≥ 1 indexable page.
  for (const b of BRANDS) {
    const n = indexable.filter((p) => p.brand === b).length;
    if (n === 0) findings.push(blocker("READINESS_NO_INDEXABLE", `Brand ${b} has no indexable pages`, { brand: b }));
  }

  // Deny-by-default reaffirmation: scalable content ships as candidate.
  const scalable = pages.filter((p) => p.type === "money" || p.type === "location" || p.type === "knowledge");
  const leakedCandidates = scalable.filter((p) => isPageIndexable(p) && !(p.approved && p.manualIndexApproval));
  if (leakedCandidates.length > 0) {
    for (const p of leakedCandidates) {
      findings.push(blocker("READINESS_CANDIDATE_INDEXED", "Candidate content is indexable without approval", { brand: p.brand, pageId: p.id, path: p.path }));
    }
  }

  // Readiness summary (info) — counts per brand and per type.
  for (const b of BRANDS) {
    const bp = pages.filter((p) => p.brand === b);
    const idx = bp.filter((p) => isPageIndexable(p)).length;
    findings.push(info("READINESS_BRAND", `${SEO_BRANDS[b].publicName}: ${bp.length} pages, ${idx} indexable, ${bp.length - idx} candidate/noindex`, { brand: b }));
  }
  for (const t of TYPES) {
    const tp = pages.filter((p) => p.type === t);
    if (tp.length === 0) continue;
    const idx = tp.filter((p) => isPageIndexable(p)).length;
    findings.push(info("READINESS_TYPE", `type "${t}": ${tp.length} pages (${idx} indexable, ${tp.length - idx} candidate)`));
  }

  // Verdict.
  if (!hasBlockers(findings)) {
    findings.push(
      info(
        "READINESS_GO",
        `GO: ${indexable.length} indexable pages pass the live gate; ${pages.length - indexable.length} candidate pages are noindex by design.`
      )
    );
    findings.push(warning("READINESS_MANUAL_STEP", "Go-live still requires the manual deploy checklist (robots/sitemap host check, Search Console)."));
  }
  return findings;
}
