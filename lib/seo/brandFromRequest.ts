/**
 * Resolve the active brand from a request (host + path).
 *
 * Host is authoritative: agiworks.de → agiworks, nexcelai.de → nexcel.
 * On local/preview hosts (no brand host match) we fall back to the path:
 * an internal /agiworks/* path means AGI Works, otherwise NEXCEL AI. This
 * keeps `next dev` and Vercel previews resolving the correct brand.
 */

import {
  hostToBrand,
  isAgiInternalPath,
  normalizeHost,
  type BrandKey,
} from "@/config/seo/domains";

export interface BrandRequestResult {
  brand: BrandKey;
  host: string;
  /** True when brand came from a known production host, not a path fallback. */
  resolvedFromHost: boolean;
}

export function resolveBrandFromRequest(
  host: string | null | undefined,
  path: string
): BrandRequestResult {
  const normalized = normalizeHost(host);
  const fromHost = hostToBrand(normalized);

  if (fromHost) {
    return { brand: fromHost, host: normalized, resolvedFromHost: true };
  }

  // Local / preview / unknown host → derive from path.
  const brand: BrandKey = isAgiInternalPath(path) ? "agiworks" : "nexcel";
  return { brand, host: normalized, resolvedFromHost: false };
}

/**
 * Server-side convenience that reads the incoming request headers.
 * NOTE: importing this pulls in next/headers and will opt the calling route
 * into dynamic rendering. Prefer passing an explicit brand where a route can
 * statically know it (e.g. per-brand layouts) to keep pages static.
 */
export async function getBrandFromHeaders(path: string): Promise<BrandRequestResult> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host");
  return resolveBrandFromRequest(host, path);
}
