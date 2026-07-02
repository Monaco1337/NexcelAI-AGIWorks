/**
 * JSON-LD builders — factual structured data only.
 *
 * HARD RULES:
 *  - No fake ratings / reviews (no AggregateRating, no Review).
 *  - No fake opening hours, no fake geo coordinates.
 *  - No unsupported claims.
 *  - PostalAddress uses the real registered legal address only.
 *  - Organization is modelled as Organization (not LocalBusiness) because the
 *    registered address is a legal address, not a visitable storefront
 *    (isPublicOfficeClaimAllowed === false).
 */

import { getBrandConfig, type BrandKey } from "@/config/seo/brands";
import { getBusinessLocation } from "@/config/businessLocations";
import { getCanonicalDomain } from "@/config/seo/brands";
import type { SeoPage } from "@/config/seo/pageRegistry";
import { canonicalForPage } from "./canonical";

type JsonLdObject = Record<string, unknown>;

function postalAddress(brand: BrandKey): JsonLdObject {
  const loc = getBusinessLocation(brand);
  return {
    "@type": "PostalAddress",
    streetAddress: loc.street,
    postalCode: loc.postalCode,
    addressLocality: loc.city,
    addressRegion: loc.region,
    addressCountry: loc.countryCode,
  };
}

/** Organization schema (legal entity, factual address, no ratings). */
export function organizationSchema(brand: BrandKey): JsonLdObject {
  const cfg = getBrandConfig(brand);
  const origin = getCanonicalDomain(brand);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: cfg.publicName,
    url: `${origin}/`,
    email: cfg.email,
    founder: {
      "@type": "Person",
      name: cfg.primaryOwner,
    },
    address: postalAddress(brand),
    areaServed: cfg.areaServed,
    logo: `${origin}${cfg.defaultOgImage}`,
  };
}

/** WebSite schema. No SearchAction unless a real search endpoint exists. */
export function webSiteSchema(brand: BrandKey): JsonLdObject {
  const cfg = getBrandConfig(brand);
  const origin = getCanonicalDomain(brand);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: cfg.publicName,
    url: `${origin}/`,
    inLanguage: cfg.locale.replace("_", "-"),
    publisher: { "@id": `${origin}/#organization` },
  };
}

/** Person schema for the brand owner. */
export function personSchema(brand: BrandKey): JsonLdObject {
  const cfg = getBrandConfig(brand);
  const origin = getCanonicalDomain(brand);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: cfg.primaryOwner,
    worksFor: { "@id": `${origin}/#organization` },
  };
}

/** WebPage schema for a registry page. */
export function webPageSchema(page: SeoPage): JsonLdObject {
  const origin = getCanonicalDomain(page.brand);
  const url = canonicalForPage(page);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: "de-DE",
    isPartOf: { "@id": `${origin}/#website` },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** BreadcrumbList schema. Caller supplies absolute URLs. */
export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQPage schema — ONLY call this when the FAQ is actually rendered visibly on
 * the page. Emitting FAQ structured data without visible matching content is a
 * policy violation.
 */
export function faqSchema(items: FaqItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
