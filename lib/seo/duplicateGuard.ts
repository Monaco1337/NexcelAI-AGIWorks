/**
 * Duplicate protection — flags near-duplicate content.
 *
 * Two thresholds:
 *  - CROSS-DOMAIN: content that is too similar between the two brands is a
 *    BLOCKER. The whole point of two brands is that each is distinct; near-
 *    identical cross-domain content is a duplicate-content / cannibalization
 *    risk and undermines brand separation.
 *  - WITHIN-BRAND: very similar pages inside one brand are a WARNING (legal
 *    boilerplate legitimately overlaps, so this is not auto-blocking).
 *
 * CI-only module: not imported by the Next app graph.
 */

import type { BrandKey } from "@/config/seo/domains";
import { blocker, warning, type Finding } from "./findings";
import { fingerprint, similarity, type Fingerprint } from "./contentFingerprint";

export interface DuplicateInput {
  id: string;
  brand: BrandKey;
  path: string;
  /** Text to compare (title + description [+ body]). */
  text: string;
  /** Legal/boilerplate pages overlap by nature; relax within-brand checks. */
  isBoilerplate?: boolean;
}

export interface DuplicateThresholds {
  crossDomain: number;
  withinBrand: number;
}

export const DEFAULT_DUPLICATE_THRESHOLDS: DuplicateThresholds = {
  crossDomain: 0.6,
  withinBrand: 0.85,
};

export function checkDuplicates(
  inputs: DuplicateInput[],
  thresholds: DuplicateThresholds = DEFAULT_DUPLICATE_THRESHOLDS
): Finding[] {
  const findings: Finding[] = [];
  const fps: (Fingerprint & { meta: DuplicateInput })[] = inputs.map((i) => ({
    ...fingerprint(i.id, i.text),
    meta: i,
  }));

  for (let i = 0; i < fps.length; i++) {
    for (let j = i + 1; j < fps.length; j++) {
      const a = fps[i];
      const b = fps[j];
      const sim = similarity(a, b);
      const crossDomain = a.meta.brand !== b.meta.brand;

      if (crossDomain) {
        if (sim >= thresholds.crossDomain) {
          findings.push(
            blocker(
              "CROSS_DOMAIN_DUPLICATE",
              `Cross-domain content too similar (${sim.toFixed(2)} ≥ ${thresholds.crossDomain}): ${a.meta.id} ↔ ${b.meta.id}`,
              { detail: `${a.meta.path} (${a.meta.brand}) vs ${b.meta.path} (${b.meta.brand})` }
            )
          );
        }
      } else {
        const bothBoilerplate = a.meta.isBoilerplate && b.meta.isBoilerplate;
        if (!bothBoilerplate && sim >= thresholds.withinBrand) {
          findings.push(
            warning(
              "WITHIN_BRAND_DUPLICATE",
              `Within-brand content very similar (${sim.toFixed(2)} ≥ ${thresholds.withinBrand}): ${a.meta.id} ↔ ${b.meta.id}`,
              { brand: a.meta.brand, detail: `${a.meta.path} vs ${b.meta.path}` }
            )
          );
        }
      }
    }
  }

  return findings;
}
