/**
 * National scaling policy (Phase 9).
 *
 * Controls HOW the system is allowed to grow beyond the initial NRW footprint,
 * so that scaling never turns into doorway pages, city stuffing or mass-produced
 * near-duplicates. Everything here is a governor, not a promise:
 *
 *  - Location expansion is allowlisted: a location page may only exist for a city
 *    slug that is explicitly approved for a scaling tier.
 *  - Candidate volume is capped per type; exceeding a cap forces a human review
 *    before more candidate pages are added.
 *  - Deny-by-default stays absolute: scaling adds *candidate* pages only. Nothing
 *    is indexed without passing every gate + explicit manualIndexApproval.
 *
 * Pure config: no imports from the CI layer. Consumed by `lib/seo/scalingGuard.ts`.
 */

/**
 * Approved location scaling tiers. Cities move from "planned" to live candidate
 * pages deliberately; only slugs listed here may back a location page.
 */
export const SCALING_TIERS = {
  /** Tier 1 — current home region (NRW / Ruhrgebiet). Live as candidates. */
  tier1_nrw: ["dortmund", "unna", "bochum", "essen", "duesseldorf"],
  /** Tier 2 — national metros approved for future candidate expansion. */
  tier2_national: ["koeln", "hamburg", "berlin", "muenchen", "frankfurt", "stuttgart"],
} as const;

/** Flat allowlist of every city slug a location page is permitted to use. */
export const ALLOWED_LOCATION_SLUGS: readonly string[] = [
  ...SCALING_TIERS.tier1_nrw,
  ...SCALING_TIERS.tier2_national,
];

/**
 * Maximum number of CANDIDATE pages per scalable type. Set well above the
 * current footprint; hitting a cap is a signal to review quality/differentiation
 * before scaling further, not a hard product limit.
 */
export const CANDIDATE_CAPS: Record<"money" | "location" | "knowledge", number> = {
  money: 80,
  location: 60,
  knowledge: 80,
};

/**
 * Similarity at/above which two pages of DIFFERENT types are treated as a doorway
 * / near-duplicate at the system level. Same-type near-duplicates are governed by
 * each type's own generic-template guard (stricter, ≥ 0.70).
 */
export const CROSS_TYPE_DOORWAY_THRESHOLD = 0.55;

/** Absolute, non-negotiable scaling invariants (documented + asserted). */
export const SCALING_POLICY = {
  denyByDefault: true,
  candidatesStartNoindex: true,
  requireManualIndexApproval: true,
  oneUrlOneBrandOneCanonical: true,
} as const;
