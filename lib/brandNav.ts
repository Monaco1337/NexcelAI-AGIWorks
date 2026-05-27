import type { BrandId } from "@/types/brand";

const BLAZE_PREFIX = "/blaze";

/**
 * Path segments that exist under the Blaze site tree (mirror of main IA where needed).
 * Routes not listed here stay on the global app (e.g. /preiskalkulator, /impressum).
 */
const BLAZE_OWNED_FIRST_SEGMENTS = new Set([
  "systeme",
  "kontakt",
  "arbeitsweise",
  "systemanalyse",
]);

/**
 * Rewrites internal hrefs when the active brand is Blaze so navbar and search stay in /blaze.
 */
export function resolveBrandNavHref(href: string, brandId: BrandId): string {
  if (brandId !== "blaze") return href;
  if (!href || href === "#") return href;
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }
  if (href.startsWith(BLAZE_PREFIX)) return href;

  // /#anchor → /blaze#anchor
  if (href.startsWith("/#")) {
    return `${BLAZE_PREFIX}${href.slice(1)}`;
  }

  const hashIndex = href.indexOf("#");
  const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";

  const cleanPath = pathPart || "/";
  if (cleanPath === "/") {
    return `${BLAZE_PREFIX}${hash}`;
  }

  const segments = cleanPath.replace(/^\//, "").split("/").filter(Boolean);
  const first = segments[0];
  if (first && BLAZE_OWNED_FIRST_SEGMENTS.has(first)) {
    return `${BLAZE_PREFIX}/${segments.join("/")}${hash}`;
  }

  return href;
}

/**
 * Active state for pill / mobile nav: home is exact match only; deeper routes use prefix match.
 */
export function isBrandNavItemActive(
  pathname: string | null | undefined,
  itemHref: string,
  brandHomeHref: string
): boolean {
  if (!pathname) return false;
  const p = pathname.replace(/\/$/, "") || "/";
  const item = itemHref.replace(/\/$/, "") || "/";
  const home = brandHomeHref.replace(/\/$/, "") || "/";

  if (item === home) {
    return p === home;
  }
  return p === item || p.startsWith(`${item}/`);
}
