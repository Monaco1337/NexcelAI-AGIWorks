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

/**
 * Service schema — a factual offering. No price, no rating, no fake availability.
 * `provider` links to the brand Organization.
 */
export function serviceSchema(input: {
  brand: BrandKey;
  name: string;
  description: string;
  url: string;
  serviceType?: string;
  areaServed?: string[];
}): JsonLdObject {
  const cfg = getBrandConfig(input.brand);
  const origin = getCanonicalDomain(input.brand);
  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: input.url,
    provider: { "@id": `${origin}/#organization` },
    areaServed: input.areaServed ?? cfg.areaServed,
    inLanguage: cfg.locale.replace("_", "-"),
  };
  if (input.serviceType) schema.serviceType = input.serviceType;
  return schema;
}

/**
 * Article schema — for knowledge / editorial pages. Author must be a real
 * person (E-E-A-T). Dates are optional; when omitted no fake date is emitted.
 */
export function articleSchema(input: {
  brand: BrandKey;
  headline: string;
  description: string;
  url: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
}): JsonLdObject {
  const cfg = getBrandConfig(input.brand);
  const origin = getCanonicalDomain(input.brand);
  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    inLanguage: cfg.locale.replace("_", "-"),
    author: {
      "@type": "Person",
      name: input.authorName ?? cfg.primaryOwner,
    },
    publisher: { "@id": `${origin}/#organization` },
    mainEntityOfPage: input.url,
  };
  if (input.datePublished) schema.datePublished = input.datePublished;
  if (input.dateModified) schema.dateModified = input.dateModified;
  return schema;
}

/**
 * WebPage schema for a page identified by an absolute URL (used by Phase 4
 * templates / candidate pages that are not in the registry yet).
 */
export function webPageForUrl(input: {
  brand: BrandKey;
  url: string;
  name: string;
  description: string;
}): JsonLdObject {
  const origin = getCanonicalDomain(input.brand);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
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
