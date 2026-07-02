/**
 * Metadata engine.
 *
 * `generateSeoMetadata` is a PURE function of (brand, path): it does not read
 * request headers, so routes that call it stay statically rendered. Each route
 * already knows its own brand (per-brand layout / segment) and its own path.
 *
 * It wires together:
 *  - pageRegistry  → title / description / canonical path
 *  - indexing      → robots directive (deny-by-default policy)
 *  - canonical     → absolute, per-domain canonical URL (no cross-domain)
 *  - brand config  → OpenGraph / Twitter defaults
 *
 * Unknown paths resolve to noindex,follow with a safe brand-level title so a
 * missing registry entry can never accidentally publish an indexable page.
 */

import type { Metadata } from "next";
import { getBrandConfig, type BrandKey } from "@/config/seo/brands";
import { getPage } from "@/config/seo/pageRegistry";
import { getRobotsForPage, NOINDEX_FOLLOW } from "@/config/seo/indexing";
import { buildCanonical, canonicalOrigin } from "./canonical";

export interface GenerateSeoMetadataInput {
  brand: BrandKey;
  /** Clean public path OR internal /agiworks path; both are normalized. */
  path: string;
  /** Optional overrides that win over registry copy (kept factual by caller). */
  title?: string;
  description?: string;
  /** Optional OG image override (absolute or root-relative). */
  ogImage?: string;
}

export function generateSeoMetadata(input: GenerateSeoMetadataInput): Metadata {
  const { brand, path } = input;
  const brandCfg = getBrandConfig(brand);
  const page = getPage(brand, path);

  const canonical = buildCanonical(brand, path);
  const origin = canonicalOrigin(brand);

  const robots = page ? getRobotsForPage(page) : NOINDEX_FOLLOW;

  const title = input.title ?? page?.title ?? brandCfg.publicName;
  const description =
    input.description ??
    page?.description ??
    `${brandCfg.publicName} – ${brandCfg.topics.slice(0, 3).join(", ")}.`;

  const ogImage = input.ogImage ?? brandCfg.defaultOgImage;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: robots.index,
      follow: robots.follow,
      googleBot: {
        index: robots.index,
        follow: robots.follow,
      },
    },
    openGraph: {
      type: "website",
      siteName: brandCfg.publicName,
      title,
      description,
      url: canonical,
      locale: brandCfg.locale,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
