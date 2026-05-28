import type { BrandId } from "@/types/brand";

const AGIWORKS_PREFIX = "/agiworks";

/**
 * Path segments that exist under the AGI Works site tree (mirror of main IA where needed).
 * Routes not listed here stay on the global app (e.g. /impressum, /datenschutz).
 */
const AGIWORKS_OWNED_FIRST_SEGMENTS = new Set([
  "systeme",
  "kontakt",
  "arbeitsweise",
  "systemanalyse",
  "ueber-mich",
  "preiskalkulator",
]);

/**
 * Rewrites internal hrefs when the active brand is AGI Works so navbar and search stay in /agiworks.
 */
export function resolveBrandNavHref(href: string, brandId: BrandId): string {
  if (brandId !== "agiworks") return href;
  if (!href || href === "#") return href;
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }
  if (href.startsWith(AGIWORKS_PREFIX)) return href;

  // /#anchor → /agiworks#anchor
  if (href.startsWith("/#")) {
    return `${AGIWORKS_PREFIX}${href.slice(1)}`;
  }

  const hashIndex = href.indexOf("#");
  const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";

  const cleanPath = pathPart || "/";
  if (cleanPath === "/") {
    return `${AGIWORKS_PREFIX}${hash}`;
  }

  const segments = cleanPath.replace(/^\//, "").split("/").filter(Boolean);
  const first = segments[0];
  if (first && AGIWORKS_OWNED_FIRST_SEGMENTS.has(first)) {
    return `${AGIWORKS_PREFIX}/${segments.join("/")}${hash}`;
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
