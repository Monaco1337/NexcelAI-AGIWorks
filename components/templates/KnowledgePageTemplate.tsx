"use client";

/**
 * Knowledge-page template (Phase 8, AEO/GEO). Renders a direct answer, key
 * takeaways, long-form sections, related links and an FAQ on top of the shared
 * TemplateFrame, plus Article JSON-LD and a real author (E-E-A-T).
 *
 * Factual only: no ratings, no fake metrics, no guarantees. The author is the
 * legally responsible brand owner (from the brand config).
 */

import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard } from "./primitives";
import { articleSchema } from "@/lib/seo/jsonld";
import { toAbsoluteUrl } from "@/config/seo/domains";
import { MONEY_PAGES } from "@/data/moneyPages";
import type { KnowledgePage } from "@/data/knowledgePages";
import type { TemplateBase } from "@/lib/templates/types";

const CORE_LINK_LABELS: Record<string, string> = {
  "/systemanalyse": "Systemanalyse",
  "/preiskalkulator": "Preiskalkulator",
  "/preise": "Preise",
  "/projekte": "Projekte",
  "/kontakt": "Kontakt",
};

function relatedLabel(brand: KnowledgePage["brand"], href: string): string {
  const money = MONEY_PAGES.find((p) => p.brand === brand && p.path === href);
  if (money) return money.serviceName;
  return CORE_LINK_LABELS[href] ?? href;
}

export default function KnowledgePageTemplate({ page }: { page: KnowledgePage }) {
  const canonicalUrl = toAbsoluteUrl(page.brand, page.path);

  const base: TemplateBase = {
    brand: page.brand,
    canonicalUrl,
    breadcrumbs: [
      { label: "Start", href: "/" },
      { label: "Wissen", href: page.path },
      { label: page.topic, href: page.path },
    ],
    eyebrow: page.eyebrow,
    title: page.h1,
    intro: page.heroIntro,
    faq: page.faq,
  };

  const schema = articleSchema({
    brand: page.brand,
    headline: page.title,
    description: page.heroIntro,
    url: canonicalUrl,
    authorName: page.authorName,
    datePublished: page.datePublished,
    dateModified: page.dateModified,
  });

  return (
    <TemplateFrame
      base={base}
      extraSchema={schema}
      emitAuthorSchema
      cta={{ label: "Frage zum Thema stellen", href: "/kontakt" }}
    >
      {/* AEO direct answer */}
      <TemplateSection eyebrow="Kurzantwort" heading="Das Wichtigste zuerst">
        <GlassCard>
          <p className="text-base leading-relaxed text-white/80">{page.aeoAnswer}</p>
        </GlassCard>
      </TemplateSection>

      {/* Key takeaways */}
      {page.takeaways.length > 0 && (
        <TemplateSection eyebrow="Überblick" heading="Auf einen Blick">
          <ul className="space-y-3">
            {page.takeaways.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/75">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-white/40" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </TemplateSection>
      )}

      {/* Long-form sections */}
      {page.sections.map((sec, i) => (
        <TemplateSection key={i} heading={sec.heading}>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-white/70">
            {sec.body.split("\n\n").map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </div>
        </TemplateSection>
      ))}

      {/* Related next steps */}
      {page.relatedPaths.length > 0 && (
        <TemplateSection eyebrow="Weiter" heading="Passende nächste Schritte">
          <div className="flex flex-wrap gap-3">
            {page.relatedPaths.map((href, i) => (
              <Link
                key={i}
                href={href}
                className="rounded-xl px-4 py-2 text-sm text-white/80"
                style={{ border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))" }}
              >
                {relatedLabel(page.brand, href)}
              </Link>
            ))}
          </div>
        </TemplateSection>
      )}
    </TemplateFrame>
  );
}
