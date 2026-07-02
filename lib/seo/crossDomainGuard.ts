/**
 * Cross-domain ownership guard — enforces "one URL = one brand = one canonical
 * domain". Canonical tags alone are not enough (the middleware also 301s), but
 * this guard makes the invariants build-failing so the registry and middleware
 * can never silently drift into cross-domain duplicates.
 *
 * Static checks (always run):
 *  - Every page's canonical host equals its brand's canonical domain host.
 *  - No public path or canonical leaks the internal "/agiworks" prefix.
 *  - Registry ↔ domains config agreement (SEO_BRANDS domain == CANONICAL_DOMAIN).
 *  - No indexable path is owned by both brands with conflicting domains.
 *
 * CI-only module: not imported by the Next app graph.
 */

import {
  AGI_INTERNAL_PREFIX,
  CANONICAL_DOMAIN,
  type BrandKey,
} from "@/config/seo/domains";
import { SEO_BRANDS } from "@/config/seo/brands";
import { PAGE_REGISTRY, type SeoPage } from "@/config/seo/pageRegistry";
import { canonicalForPage } from "./canonical";
import { isPageIndexable } from "@/config/seo/indexing";
import { blocker, info, type Finding } from "./findings";

export interface CrossDomainPageInput {
  id: string;
  brand: BrandKey;
  /** Public (clean) path. */
  path: string;
  /** Absolute canonical URL (may be deliberately wrong in fixtures). */
  canonical: string;
  indexable: boolean;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function expectedHost(brand: BrandKey): string {
  return hostOf(CANONICAL_DOMAIN[brand]) ?? "";
}

/** Core check operating on explicit inputs (so fixtures can inject bad data). */
export function checkCrossDomainOwnership(
  pages: CrossDomainPageInput[]
): Finding[] {
  const findings: Finding[] = [];

  // Registry ↔ domains config agreement.
  (Object.keys(SEO_BRANDS) as BrandKey[]).forEach((brand) => {
    if (SEO_BRANDS[brand].canonicalDomain !== CANONICAL_DOMAIN[brand]) {
      findings.push(
        blocker(
          "DOMAIN_CONFIG_DRIFT",
          `SEO_BRANDS.${brand}.canonicalDomain (${SEO_BRANDS[brand].canonicalDomain}) != CANONICAL_DOMAIN.${brand} (${CANONICAL_DOMAIN[brand]})`,
          { brand }
        )
      );
    }
  });

  // Ownership map: which brands claim each indexable public path.
  const claims = new Map<string, Set<BrandKey>>();

  for (const p of pages) {
    const meta = { brand: p.brand, pageId: p.id, path: p.path };
    const canonHost = hostOf(p.canonical);
    const wantHost = expectedHost(p.brand);

    if (!canonHost) {
      findings.push(blocker("INVALID_CANONICAL", `Canonical is not a valid URL: "${p.canonical}"`, meta));
    } else if (canonHost !== wantHost) {
      findings.push(
        blocker(
          "CROSS_DOMAIN_CANONICAL",
          `Canonical host "${canonHost}" != brand host "${wantHost}"`,
          { ...meta, detail: p.canonical }
        )
      );
    }

    if (p.path.startsWith(AGI_INTERNAL_PREFIX)) {
      findings.push(
        blocker("INTERNAL_PREFIX_IN_PATH", `Public path leaks internal prefix: "${p.path}"`, meta)
      );
    }
    if (p.canonical.includes(AGI_INTERNAL_PREFIX)) {
      findings.push(
        blocker("INTERNAL_PREFIX_IN_CANONICAL", `Canonical leaks internal prefix: "${p.canonical}"`, meta)
      );
    }

    if (p.indexable) {
      const set = claims.get(p.path) ?? new Set<BrandKey>();
      set.add(p.brand);
      claims.set(p.path, set);
    }
  }

  // Same public path indexable under both brands with different canonical
  // domains → cross-domain duplicate. (Distinct domains make the same clean path
  // legitimately exist once per brand, so this is only flagged when the canonical
  // host does not match the owning brand — already covered above. Here we flag
  // any indexable path where a brand's canonical points at the *other* brand.)
  for (const p of pages) {
    if (!p.indexable) continue;
    const canonHost = hostOf(p.canonical);
    const foreignBrand = (Object.keys(CANONICAL_DOMAIN) as BrandKey[]).find(
      (b) => b !== p.brand && hostOf(CANONICAL_DOMAIN[b]) === canonHost
    );
    if (foreignBrand) {
      findings.push(
        blocker(
          "FOREIGN_BRAND_CANONICAL",
          `${p.brand} page "${p.path}" canonicalizes to ${foreignBrand} domain`,
          { brand: p.brand, pageId: p.id, path: p.path, detail: p.canonical }
        )
      );
    }
  }

  if (findings.length === 0) {
    findings.push(info("CROSS_DOMAIN_OK", `Cross-domain ownership verified for ${pages.length} pages`));
  }

  return findings;
}

/** Build inputs from the real registry and run the guard. */
export function checkRegistryCrossDomain(pages: SeoPage[] = PAGE_REGISTRY): Finding[] {
  const inputs: CrossDomainPageInput[] = pages.map((p) => ({
    id: p.id,
    brand: p.brand,
    path: p.path,
    canonical: canonicalForPage(p),
    indexable: isPageIndexable(p),
  }));
  return checkCrossDomainOwnership(inputs);
}
