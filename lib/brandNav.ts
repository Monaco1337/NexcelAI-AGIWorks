import type { BrandId } from "@/types/brand";

const AGIWORKS_PREFIX = "/agiworks";

/**
 * Normalizes an internal href to its CLEAN public form.
 *
 * Public URLs are always clean (no `/agiworks` prefix). On agiworks.de the
 * middleware rewrites clean paths onto the internal `/agiworks/*` app subtree,
 * so a `/agiworks` prefix must never appear in a rendered anchor. This helper
 * therefore strips the internal prefix defensively and NEVER adds it — both
 * brands render clean public hrefs. The `brandId` argument is kept for a stable
 * call-site API but no longer changes the output.
 */
export function resolveBrandNavHref(href: string, _brandId: BrandId): string {
  if (!href || href === "#") return href;
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }
  // "/agiworks" → "/"
  if (href === AGIWORKS_PREFIX) return "/";
  // "/agiworks/preise" → "/preise"
  if (href.startsWith(`${AGIWORKS_PREFIX}/`)) {
    return href.slice(AGIWORKS_PREFIX.length) || "/";
  }
  // "/agiworks#systeme" → "/#systeme"
  if (href.startsWith(`${AGIWORKS_PREFIX}#`)) {
    return `/${href.slice(AGIWORKS_PREFIX.length)}`;
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
