/**
 * Indexing policy — the ONLY place that decides index vs. noindex.
 *
 * Deny-by-default. A page is only ever "index, follow" when it is approved,
 * manually cleared for indexing, AND passes the content quality gate.
 *
 * Truth table:
 *   not approved                                   → noindex, follow
 *   approved, no manualIndexApproval               → noindex, follow
 *   approved + manualIndexApproval, quality false  → noindex, follow
 *   approved + manualIndexApproval + quality true  → index,   follow
 */

import type { SeoPage, SeoPageQuality } from "./pageRegistry";

export interface RobotsDirective {
  index: boolean;
  follow: boolean;
}

export const NOINDEX_FOLLOW: RobotsDirective = { index: false, follow: true };
export const INDEX_FOLLOW: RobotsDirective = { index: true, follow: true };

/**
 * Resolve robots directive for a page. `qualityOverride` lets callers supply a
 * freshly computed quality verdict (Phase 2 quality gate); when omitted the
 * page's stored `quality` is used.
 */
export function getRobotsForPage(
  page: Pick<SeoPage, "approved" | "manualIndexApproval" | "quality">,
  qualityOverride?: SeoPageQuality
): RobotsDirective {
  const quality = qualityOverride ?? page.quality;

  if (!page.approved) return NOINDEX_FOLLOW;
  if (!page.manualIndexApproval) return NOINDEX_FOLLOW;
  if (!quality || quality.index !== true) return NOINDEX_FOLLOW;

  return INDEX_FOLLOW;
}

/** Convenience predicate used by sitemap generation. */
export function isPageIndexable(
  page: Pick<SeoPage, "approved" | "manualIndexApproval" | "quality">,
  qualityOverride?: SeoPageQuality
): boolean {
  return getRobotsForPage(page, qualityOverride).index;
}
