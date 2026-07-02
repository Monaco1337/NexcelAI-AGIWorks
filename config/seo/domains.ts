/**
 * Single source of truth for host → brand → canonical-domain mapping.
 *
 * Used by middleware.ts (cross-domain URL ownership), the metadata engine,
 * canonical builder, robots/sitemap/llms routes and (Phase 2) the SEO-CI guards.
 *
 * Rule of the whole system: every public URL belongs to exactly one brand and
 * exactly one canonical domain. Canonical tags alone are NOT sufficient — the
 * middleware enforces ownership with hard 301s. This file defines what "owned"
 * means so middleware and CI never disagree.
 */

export type BrandKey = "nexcel" | "agiworks";

/** Internal app-tree prefix under which AGI Works pages physically live. */
export const AGI_INTERNAL_PREFIX = "/agiworks";

/** Production hosts per brand. Keep lowercase, no port, no protocol. */
export const NEXCEL_HOSTS: ReadonlySet<string> = new Set([
  "nexcelai.de",
  "www.nexcelai.de",
]);

export const AGIWORKS_HOSTS: ReadonlySet<string> = new Set([
  "agiworks.de",
  "www.agiworks.de",
]);

/** Canonical, fully-qualified production origin per brand (always www). */
export const CANONICAL_DOMAIN: Record<BrandKey, string> = {
  nexcel: "https://www.nexcelai.de",
  agiworks: "https://www.agiworks.de",
};

/**
 * Normalize a raw Host header into a bare hostname:
 * strips protocol, port and surrounding whitespace, lowercases.
 */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return "";
  return host.trim().toLowerCase().split(":")[0];
}

/**
 * Development / preview hosts that must be exempt from cross-domain enforcement
 * so that `localhost` and Vercel preview deployments keep working normally.
 */
export function isLocalOrPreviewHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  if (!h) return true;
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h.endsWith(".vercel.app") ||
    h.endsWith(".ngrok.io") ||
    h.endsWith(".ngrok-free.app")
  );
}

/** Is this a known production host for the given brand? */
export function isNexcelHost(host: string | null | undefined): boolean {
  return NEXCEL_HOSTS.has(normalizeHost(host));
}

export function isAgiWorksHost(host: string | null | undefined): boolean {
  return AGIWORKS_HOSTS.has(normalizeHost(host));
}

/**
 * Map a production host to its brand. Returns `null` for unknown / local /
 * preview hosts so callers can apply safe fallbacks (e.g. disallow indexing).
 */
export function hostToBrand(host: string | null | undefined): BrandKey | null {
  const h = normalizeHost(host);
  if (AGIWORKS_HOSTS.has(h)) return "agiworks";
  if (NEXCEL_HOSTS.has(h)) return "nexcel";
  return null;
}

/**
 * Strip the internal `/agiworks` prefix from a path to produce the clean,
 * public AGI Works path that is served on agiworks.de.
 *
 *   "/agiworks"            → "/"
 *   "/agiworks/preise"     → "/preise"
 *   "/preise"              → "/preise"  (already clean)
 */
export function cleanAgiPath(path: string): string {
  if (!path) return "/";
  if (path === AGI_INTERNAL_PREFIX) return "/";
  if (path.startsWith(AGI_INTERNAL_PREFIX + "/")) {
    return path.slice(AGI_INTERNAL_PREFIX.length) || "/";
  }
  return path;
}

/** Does this path point into the internal AGI Works app subtree? */
export function isAgiInternalPath(path: string): boolean {
  return path === AGI_INTERNAL_PREFIX || path.startsWith(AGI_INTERNAL_PREFIX + "/");
}

/** Join a canonical brand origin with a clean, absolute path. */
export function toAbsoluteUrl(brand: BrandKey, cleanPath: string): string {
  const origin = CANONICAL_DOMAIN[brand];
  const path = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  // Collapse the root path so we never emit "https://host/" with a trailing
  // slash inconsistency for the homepage vs. deep pages.
  if (path === "/") return `${origin}/`;
  return `${origin}${path.replace(/\/$/, "")}`;
}
