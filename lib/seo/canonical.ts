/**
 * Canonical URL builder.
 *
 * Rules:
 *  - AGI canonicals ALWAYS use https://www.agiworks.de
 *  - NEXCEL canonicals ALWAYS use https://www.nexcelai.de
 *  - The internal /agiworks prefix is stripped from AGI public canonicals.
 *  - Never emit a cross-domain canonical (AGI page never canonicalizes to a
 *    NEXCEL URL or vice versa).
 */

import { getCanonicalDomain, type BrandKey } from "@/config/seo/brands";
import { cleanAgiPath, toAbsoluteUrl } from "@/config/seo/domains";
import type { SeoPage } from "@/config/seo/pageRegistry";

/** Normalize any path (possibly internal /agiworks/*) to a clean public path. */
export function toCleanPublicPath(path: string): string {
  const clean = cleanAgiPath(path || "/") || "/";
  if (clean === "/") return "/";
  // Drop query/hash and trailing slash for a stable canonical.
  const noHashQuery = clean.split(/[?#]/)[0];
  return noHashQuery.replace(/\/$/, "") || "/";
}

/** Build an absolute canonical URL for a brand + (possibly internal) path. */
export function buildCanonical(brand: BrandKey, path: string): string {
  const cleanPath = toCleanPublicPath(path);
  return toAbsoluteUrl(brand, cleanPath);
}

/** Canonical URL for a registry page. */
export function canonicalForPage(page: SeoPage): string {
  return toAbsoluteUrl(page.brand, page.path);
}

/** Origin only (no path), e.g. for metadataBase. */
export function canonicalOrigin(brand: BrandKey): string {
  return getCanonicalDomain(brand);
}
