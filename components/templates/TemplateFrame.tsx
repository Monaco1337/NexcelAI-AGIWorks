"use client";

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
  extraSchema?: JsonLdObject | JsonLdObject[];
  cta?: { label: string; href: string };
  heroAside?: ReactNode;
  showAuthor?: boolean;
  emitAuthorSchema?: boolean;
}

/** Shared visual and semantic frame; exactly one final conversion CTA. */
export default function TemplateFrame({
  base,
  children,
  extraSchema,
  cta = { label: "Projekt besprechen", href: "/kontakt" },
  heroAside,
  showAuthor = true,
  emitAuthorSchema = false,
}: TemplateFrameProps) {
  const agi = base.brand === "agiworks";
  const finalCta = agi ? { label: "Softwareprojekt besprechen", href: "/kontakt" } : cta;
  const schema: JsonLdObject[] = [
    webPageForUrl({ brand: base.brand, url: base.canonicalUrl, name: base.title, description: base.intro }),
    ...(extraSchema ? (Array.isArray(extraSchema) ? extraSchema : [extraSchema]) : []),
  ];

  return <main className="ds-app premium-v6 v6-template min-h-screen" data-v6-brand={base.brand}>
    <Breadcrumbs items={base.breadcrumbs} />
    <header className={heroAside ? "v6-template-hero nxl-detail-hero" : "v6-template-hero"}>
      <div>
        {base.eyebrow && <Eyebrow>{base.eyebrow}</Eyebrow>}
        <GradientHeading as="h1">{base.title}</GradientHeading>
        <p className="mt-6 max-w-3xl text-[17px] leading-[1.8] text-white/75">{base.intro}</p>
      </div>
      {heroAside && <div className="nxl-detail-hero-aside">{heroAside}</div>}
    </header>

    {children}
    <FaqSection items={base.faq} />

    {!agi && !(base.brand === "nexcel" && base.canonicalUrl.endsWith("/loesungen")) && <section className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
      <TrustStrip />
      {showAuthor && <div className="mx-auto mt-9 max-w-md"><AuthorByline emitSchema={emitAuthorSchema} /></div>}
    </section>}

    <section className="v6-final v6-template-cta" aria-label="Projekt besprechen">
      <div className="v6-shell">
        <Eyebrow>Gemeinsam weiterdenken</Eyebrow>
        <h2 className="v6-h2">Lassen Sie uns Ihren konkreten Bedarf klären.</h2>
        <p>Eine nachvollziehbare Entscheidung beginnt mit Anforderungen, Datenlage und einem klar abgegrenzten Projektrahmen.</p>
        <TemplateCta label={finalCta.label} href={finalCta.href} meta={{ page: base.canonicalUrl }} />
      </div>
    </section>
    <SeoJsonLd schema={schema} />
  </main>;
}
