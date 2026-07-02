/**
 * Brand governance — single source of truth for brand identity used across the
 * SEO system (metadata, canonical, JSON-LD, robots/sitemap, llms.txt).
 *
 * BrandKey matches the existing repo reality ("nexcel" | "agiworks", see
 * types/brand.ts BrandId). This file layers SEO-specific, factual brand facts
 * on top of the existing marketing brand config in data/brands/*.
 *
 * Strict rules encoded here:
 *  - No ranking claims, no superlatives, no invented facts.
 *  - `areaServed` describes the real service area (clients across the region),
 *    NOT a physical office claim. Office/address claims live in
 *    config/businessLocations.ts and are gated by isPublicOfficeClaimAllowed.
 */

import {
  CANONICAL_DOMAIN,
  hostToBrand,
  cleanAgiPath,
  type BrandKey,
} from "./domains";

export type { BrandKey };

export interface SeoBrandConfig {
  key: BrandKey;
  /** Public, human-facing brand name. */
  publicName: string;
  /** Legal owner (natural person, Einzelunternehmen). */
  primaryOwner: string;
  /** Canonical production origin (always www, https). */
  canonicalDomain: string;
  /** Bare production hostname (no protocol). */
  primaryHost: string;
  /** Factual topical focus — used for llms.txt and descriptions, no claims. */
  topics: string[];
  /**
   * Real service area (regions the brand serves clients in). This is a
   * service-area statement, not an office-location claim.
   */
  areaServed: string[];
  /** Factual one-line cooperation note between the two brands. */
  cooperationLine: string;
  /** Default social/OG image path (already shipped in /public). */
  defaultOgImage: string;
  /** Locale for metadata / JSON-LD. */
  locale: string;
  /** Contact e-mail for structured data (factual, from legal config). */
  email: string;
}

export const SEO_BRANDS: Record<BrandKey, SeoBrandConfig> = {
  nexcel: {
    key: "nexcel",
    publicName: "NEXCEL AI",
    primaryOwner: "Celina Siebeneicher",
    canonicalDomain: CANONICAL_DOMAIN.nexcel,
    primaryHost: "www.nexcelai.de",
    topics: [
      "Unternehmenssysteme",
      "Systemdesign",
      "Prozessdesign",
      "Customer Experience",
      "Branding",
      "Automatisierung",
    ],
    areaServed: ["Unna", "Kreis Unna", "Dortmund", "Nordrhein-Westfalen", "Deutschland"],
    cooperationLine:
      "NEXCEL AI arbeitet mit AGI Works als eigenständiger Partnermarke zusammen.",
    defaultOgImage: "/images/hero/nexcel-system-architecture.png",
    locale: "de_DE",
    email: "info@nexcelai.de",
  },
  agiworks: {
    key: "agiworks",
    publicName: "AGI Works",
    primaryOwner: "Kevin Blazevic",
    canonicalDomain: CANONICAL_DOMAIN.agiworks,
    primaryHost: "www.agiworks.de",
    topics: [
      "Softwarearchitektur",
      "Plattformentwicklung",
      "Web- und Anwendungssysteme",
      "Backend-Systeme",
      "Systemintegration",
      "Automatisierung",
    ],
    areaServed: ["Unna", "Kreis Unna", "Dortmund", "Nordrhein-Westfalen", "Deutschland"],
    cooperationLine:
      "AGI Works arbeitet mit NEXCEL AI als eigenständiger Partnermarke zusammen.",
    defaultOgImage: "/images/logos/agiworks-logo.png",
    locale: "de_DE",
    email: "info@agiworks.de",
  },
};

/** Type guard / assertion for untrusted brand input. */
export function assertValidBrandKey(value: unknown): asserts value is BrandKey {
  if (value !== "nexcel" && value !== "agiworks") {
    throw new Error(
      `[seo] Invalid BrandKey: ${JSON.stringify(value)} (expected "nexcel" | "agiworks")`
    );
  }
}

export function isBrandKey(value: unknown): value is BrandKey {
  return value === "nexcel" || value === "agiworks";
}

/** Get the full SEO brand config for a validated brand key. */
export function getBrandConfig(brand: BrandKey): SeoBrandConfig {
  assertValidBrandKey(brand);
  return SEO_BRANDS[brand];
}

/**
 * Resolve brand from a raw Host header. Unknown / local / preview hosts fall
 * back to "nexcel" (the default brand of the codebase). Callers that must
 * distinguish "unknown" (e.g. robots.ts) should use hostToBrand() directly.
 */
export function getBrandByHost(host: string | null | undefined): BrandKey {
  return hostToBrand(host) ?? "nexcel";
}

/** Canonical origin for a brand. */
export function getCanonicalDomain(brand: BrandKey): string {
  return getBrandConfig(brand).canonicalDomain;
}

// Re-export the path cleaner so consumers can import brand + path helpers from
// a single module.
export { cleanAgiPath };
