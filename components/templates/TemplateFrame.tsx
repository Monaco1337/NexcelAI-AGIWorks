"use client";

/**
 * Shared page chrome for all Phase 4 templates: breadcrumbs, hero, body,
 * FAQ, trust block, conversion CTA and WebPage JSON-LD. Templates supply only
 * their unique body + any type-specific structured data.
 */

import type { ReactNode } from "react";
import { webPageForUrl } from "@/lib/seo/jsonld";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import Breadcrumbs from "@/components/trust/Breadcrumbs";
import TrustStrip from "@/components/trust/TrustStrip";
import AuthorByline from "@/components/trust/AuthorByline";
import FaqSection from "@/components/trust/FaqSection";
import { GradientHeading, Eyebrow, TemplateCta } from "@/components/templates/primitives";
import type { TemplateBase } from "@/lib/templates/types";

type JsonLdObject = Record<string, unknown>;

interface TemplateFrameProps {
  base: TemplateBase;
  children: ReactNode;
  /** Type-specific structured data (Service, Article, …). */
  extraSchema?: JsonLdObject | JsonLdObject[];
  cta?: { label: string; href: string };
  showAuthor?: boolean;
  emitAuthorSchema?: boolean;
}

export default function TemplateFrame({
  base,
  children,
  extraSchema,
  cta = { label: "Projekt besprechen", href: "/kontakt" },
  showAuthor = true,
  emitAuthorSchema = false,
}: TemplateFrameProps) {
  const webPage = webPageForUrl({
    brand: base.brand,
    url: base.canonicalUrl,
    name: base.title,
    description: base.intro,
  });
  const schema: JsonLdObject[] = [
    webPage,
    ...(extraSchema ? (Array.isArray(extraSchema) ? extraSchema : [extraSchema]) : []),
  ];

  return (
    <main className="ds-app min-h-screen text-white">
      <Breadcrumbs items={base.breadcrumbs} />

      <header className="px-4 pt-10 sm:px-6 md:pt-16">
        <div className="mx-auto max-w-5xl">
          {base.eyebrow && <Eyebrow>{base.eyebrow}</Eyebrow>}
          <GradientHeading as="h1">{base.title}</GradientHeading>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/70">{base.intro}</p>
        </div>
      </header>

      {children}

      <FaqSection items={base.faq} />

      <section className="relative px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <TrustStrip />
          {showAuthor && (
            <div className="max-w-md">
              <AuthorByline emitSchema={emitAuthorSchema} />
            </div>
          )}
        </div>
      </section>

      <section className="relative px-4 pb-24 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-4">
          <TemplateCta label={cta.label} href={cta.href} meta={{ page: base.canonicalUrl }} />
        </div>
      </section>

      <SeoJsonLd schema={schema} />
    </main>
  );
}
