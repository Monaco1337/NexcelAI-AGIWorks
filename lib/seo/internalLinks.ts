/**
 * Internal-link resolution — one place that turns a path into a link.
 *
 * Anchor text is a ranking signal and it is what Search Console reports under
 * "Top linking text". Rendering a raw path like "/wissen/was-ist-ein-ki-agent"
 * as anchor text wastes that signal, so every internal link resolves its label
 * from the page registry instead.
 *
 * Safe to import from the Next app graph (pure data, no Node built-ins).
 */

import type { BrandKey } from "@/config/seo/domains";
import { getPage, PAGE_REGISTRY, type SeoPage } from "@/config/seo/pageRegistry";

export interface InternalLink {
  href: string;
  /** Short anchor text (breadcrumb-level label). */
  label: string;
  /** One-line context shown next to the label where the layout allows it. */
  hint?: string;
}

/** Labels for paths that are not registry pages (fragments, tools, filters). */
const FALLBACK_LABELS: Record<string, string> = {
  "/": "Startseite",
  "/#systeme": "Systemübersicht",
  "/systemanalyse": "Systemanalyse",
  "/preiskalkulator": "Preiskalkulator",
  "/preise": "Preise",
  "/projekte": "Referenzen",
  "/kontakt": "Kontakt",
  "/wissen": "Wissen",
  "/standorte": "Standorte",
  "/loesungen": "Lösungen",
  "/leistungen": "Leistungen",
};

/** Strip query/fragment so registry lookups work on clean paths. */
function basePath(href: string): string {
  const clean = href.split(/[?#]/)[0] || "/";
  return clean !== "/" ? clean.replace(/\/$/, "") : "/";
}

/** Human anchor text for an internal path. */
export function internalLinkLabel(brand: BrandKey, href: string): string {
  const direct = FALLBACK_LABELS[href];
  if (direct) return direct;

  const path = basePath(href);
  const page = getPage(brand, path);
  if (page) return page.breadcrumbLabel || page.title;

  return FALLBACK_LABELS[path] ?? path;
}

/** Anchor text plus the page's description as supporting context. */
export function internalLink(brand: BrandKey, href: string): InternalLink {
  const path = basePath(href);
  const page = getPage(brand, path);
  return {
    href,
    label: internalLinkLabel(brand, href),
    hint: page?.description,
  };
}

export function internalLinks(brand: BrandKey, hrefs: string[]): InternalLink[] {
  return hrefs.map((h) => internalLink(brand, h));
}

/**
 * Every indexable page of a brand, grouped by registry type. Backs the HTML
 * sitemap so no indexable page can be reachable by crawlers but unreachable
 * through the site itself.
 */
export function indexableByType(brand: BrandKey): Map<SeoPage["type"], SeoPage[]> {
  const grouped = new Map<SeoPage["type"], SeoPage[]>();
  PAGE_REGISTRY.filter(
    (p) => p.brand === brand && p.approved && p.manualIndexApproval && p.quality.index
  )
    .slice()
    .sort((a, b) => b.priority - a.priority || a.path.localeCompare(b.path))
    .forEach((p) => {
      const list = grouped.get(p.type) ?? [];
      list.push(p);
      grouped.set(p.type, list);
    });
  return grouped;
}
