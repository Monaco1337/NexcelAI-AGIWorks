"use client";

/**
 * Visible breadcrumb trail + BreadcrumbList JSON-LD (kept in sync — the schema
 * is derived from the same items that render, so structured data always matches
 * what the user sees).
 */

import Link from "next/link";
import { useBrand } from "@/contexts/BrandContext";
import { getCanonicalDomain } from "@/config/seo/brands";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import type { BreadcrumbNode } from "@/lib/templates/types";

function toAbsolute(origin: string, href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `${origin}${href.startsWith("/") ? href : `/${href}`}`;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbNode[] }) {
  const brand = useBrand();
  const origin = getCanonicalDomain(brand.id);
  if (!items || items.length === 0) return null;

  const schema = breadcrumbSchema(
    items.map((i) => ({ name: i.label, url: toAbsolute(origin, i.href) }))
  );

  return (
    <nav aria-label="Breadcrumb" className="px-4 pt-8 sm:px-6">
      <ol className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 text-xs text-white/45">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-white/70">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-white/80">
                  {item.label}
                </Link>
              )}
              {!isLast && <span className="text-white/25">/</span>}
            </li>
          );
        })}
      </ol>
      <SeoJsonLd schema={schema} />
    </nav>
  );
}
