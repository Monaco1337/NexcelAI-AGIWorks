"use client";

/**
 * Hub / overview template. Indexable entry point that links to a collection of
 * detail pages (money / location / knowledge) so none of them are orphaned.
 * Renders on the shared TemplateFrame + a CollectionPage JSON-LD.
 */

import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import type { BrandKey } from "@/config/seo/domains";
import type { TemplateBase } from "@/lib/templates/types";

export interface HubItem {
  href: string;
  title: string;
  description?: string;
}

export interface HubTemplateProps {
  brand: BrandKey;
  canonicalUrl: string;
  eyebrow?: string;
  breadcrumbLabel: string;
  title: string;
  intro: string;
  /** Section heading above the item grid. */
  itemsHeading: string;
  items: HubItem[];
}

export default function HubTemplate(props: HubTemplateProps) {
  const base: TemplateBase = {
    brand: props.brand,
    canonicalUrl: props.canonicalUrl,
    breadcrumbs: [
      { label: "Start", href: "/" },
      { label: props.breadcrumbLabel, href: props.canonicalUrl },
    ],
    eyebrow: props.eyebrow,
    title: props.title,
    intro: props.intro,
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: props.title,
    description: props.intro,
    url: props.canonicalUrl,
    hasPart: props.items.map((i) => ({ "@type": "WebPage", name: i.title })),
  };

  return (
    <TemplateFrame base={base} extraSchema={schema} showAuthor={false} cta={{ label: "Systemanalyse starten", href: "/systemanalyse" }}>
      <TemplateSection eyebrow={props.eyebrow} heading={props.itemsHeading}>
        <CardGrid>
          {props.items.map((item, i) => (
            <Link key={i} href={item.href} className="group block">
              <GlassCard>
                <h3 className="text-base font-medium text-white/95 group-hover:text-white">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
                )}
                <span className="mt-3 inline-block text-sm text-white/60 group-hover:text-white/85">Mehr erfahren →</span>
              </GlassCard>
            </Link>
          ))}
        </CardGrid>
      </TemplateSection>
    </TemplateFrame>
  );
}
