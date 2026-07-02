/**
 * Brand guard — ensures each page is primarily branded for the brand that owns
 * it, and that the other brand never dominates. Cross-mentioning the partner
 * brand is allowed (cooperation), but a page must not be primarily the wrong
 * brand.
 *
 * Registry-based by default (title + description). When rendered DOM text is
 * supplied it is included; DOM coverage is otherwise partial (documented).
 *
 * CI-only module: not imported by the Next app graph.
 */

import { SEO_BRANDS } from "@/config/seo/brands";
import { PAGE_REGISTRY, type SeoPage } from "@/config/seo/pageRegistry";
import type { BrandKey } from "@/config/seo/domains";
import { blocker, warning, info, type Finding } from "./findings";

export interface BrandCheckInput {
  brand: BrandKey;
  pageId: string;
  path: string;
  title: string;
  description: string;
  /** Optional rendered body text. */
  bodyText?: string;
}

function otherBrand(brand: BrandKey): BrandKey {
  return brand === "nexcel" ? "agiworks" : "nexcel";
}

function includesName(haystack: string, name: string): boolean {
  return haystack.toLowerCase().includes(name.toLowerCase());
}

export function checkBrand(input: BrandCheckInput): Finding[] {
  const findings: Finding[] = [];
  const meta = { brand: input.brand, pageId: input.pageId, path: input.path };

  const own = SEO_BRANDS[input.brand].publicName;
  const foreign = SEO_BRANDS[otherBrand(input.brand)].publicName;

  const title = input.title ?? "";
  const combined = `${input.title ?? ""}\n${input.description ?? ""}\n${input.bodyText ?? ""}`;

  const ownInCombined = includesName(combined, own);
  const foreignInTitle = includesName(title, foreign);
  const ownInTitle = includesName(title, own);

  if (!ownInCombined) {
    findings.push(
      warning("BRAND_NAME_MISSING", `Own brand "${own}" not present in title/description`, meta)
    );
  }

  // Foreign brand as the primary (in title) while own brand is absent from title
  // → wrong primary branding (hard block).
  if (foreignInTitle && !ownInTitle) {
    findings.push(
      blocker(
        "WRONG_PRIMARY_BRAND",
        `Title is branded "${foreign}" but not "${own}"`,
        { ...meta, detail: title }
      )
    );
  } else if (foreignInTitle) {
    findings.push(
      warning("FOREIGN_BRAND_IN_TITLE", `Foreign brand "${foreign}" appears in title`, meta)
    );
  }

  return findings;
}

/** Run brand checks over the registry (optionally enriched with DOM text). */
export function checkRegistryBrands(
  bodyByPageId: Record<string, string> = {},
  pages: SeoPage[] = PAGE_REGISTRY
): Finding[] {
  const findings: Finding[] = [];
  for (const p of pages) {
    findings.push(
      ...checkBrand({
        brand: p.brand,
        pageId: p.id,
        path: p.path,
        title: p.title,
        description: p.description,
        bodyText: bodyByPageId[p.id],
      })
    );
  }
  if (findings.length === 0) {
    findings.push(info("BRAND_OK", `Brand consistency verified for ${pages.length} pages`));
  }
  return findings;
}
