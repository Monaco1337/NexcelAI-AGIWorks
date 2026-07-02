import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostToBrand } from "@/config/seo/domains";
import { getPagesForBrand } from "@/config/seo/pageRegistry";
import { isPageIndexable } from "@/config/seo/indexing";
import { canonicalForPage } from "@/lib/seo/canonical";

/**
 * Host-aware sitemap.
 * Emits ONLY indexable registry URLs (per the indexing policy) for the brand
 * that owns the current host. Cross-domain URLs are never mixed: the NEXCEL
 * sitemap contains only nexcelai.de URLs and vice versa.
 *
 * Dynamic because the URL set depends on the request Host header.
 */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = headers().get("host");
  const brand = hostToBrand(host);

  if (!brand) return [];

  const now = new Date();
  return getPagesForBrand(brand)
    .filter((page) => isPageIndexable(page))
    .map((page) => ({
      url: canonicalForPage(page),
      lastModified: now,
      changeFrequency: page.changefreq,
      priority: page.priority,
    }));
}
