/**
 * Business locations — FACTUAL data only.
 *
 * These are the real, legally registered addresses of the two Einzelunternehmen
 * (mirrored from components/legal/legalKit.tsx / the Impressum). They are used
 * for PostalAddress in JSON-LD where a legal address is appropriate.
 *
 * HARD RULES (enforced by policy, checked in Phase 2 CI):
 *  - No invented office locations (e.g. no fake Dortmund office).
 *  - No fake geo coordinates.
 *  - No fake opening hours.
 *  - `isPublicOfficeClaimAllowed` is false: the registered address is a legal
 *    address, NOT a walk-in public office / storefront. Do not emit LocalBusiness
 *    "visit us" style claims or opening hours from this data.
 *  - `areaServed` is a service-area statement, not an office claim.
 */

import type { BrandKey } from "./seo/brands";

export interface BusinessLocation {
  brand: BrandKey;
  /** Legal entity label ("Brand — Owner"). */
  legalName: string;
  street: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  /** This address is the registered legal address (Impressum). */
  isLegalAddress: true;
  /**
   * Whether we are allowed to publicly claim this as a visitable office /
   * storefront. FALSE for both brands — it is a legal address only.
   */
  isPublicOfficeClaimAllowed: false;
  /** Real service area (regions served), NOT an office claim. */
  areaServed: string[];
  /** Intentionally absent: no coordinates, no opening hours. */
  geo?: never;
  openingHours?: never;
}

export const BUSINESS_LOCATIONS: Record<BrandKey, BusinessLocation> = {
  nexcel: {
    brand: "nexcel",
    legalName: "NEXCEL AI — Celina Siebeneicher",
    street: "Ziegelstraße 9",
    postalCode: "59423",
    city: "Unna",
    region: "Nordrhein-Westfalen",
    country: "Deutschland",
    countryCode: "DE",
    isLegalAddress: true,
    isPublicOfficeClaimAllowed: false,
    areaServed: ["Unna", "Kreis Unna", "Dortmund", "Nordrhein-Westfalen", "Deutschland"],
  },
  agiworks: {
    brand: "agiworks",
    legalName: "AGI Works — Kevin Blazevic",
    street: "Hansastraße 34",
    postalCode: "59423",
    city: "Unna",
    region: "Nordrhein-Westfalen",
    country: "Deutschland",
    countryCode: "DE",
    isLegalAddress: true,
    isPublicOfficeClaimAllowed: false,
    areaServed: ["Unna", "Kreis Unna", "Dortmund", "Nordrhein-Westfalen", "Deutschland"],
  },
};

export function getBusinessLocation(brand: BrandKey): BusinessLocation {
  return BUSINESS_LOCATIONS[brand];
}
