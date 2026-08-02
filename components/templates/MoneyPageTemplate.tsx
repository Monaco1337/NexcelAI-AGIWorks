"use client";

/**
 * Money-page template (Phase 6). Renders the full commercial page structure —
 * AEO direct answer, problem, solution + modules, brand approach, industries,
 * decision matrix, cost corridor, process, internal links, FAQ and proof
 * constraints — on top of the shared Phase 4 TemplateFrame, plus Service JSON-LD.
 *
 * Purely presentational + factual: no ratings, no fixed prices, no guarantees.
 */

import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import { serviceSchema } from "@/lib/seo/jsonld";
import { toAbsoluteUrl } from "@/config/seo/domains";
import { MONEY_PAGES, MONEY_PROOF_CONSTRAINTS, type MoneyPage } from "@/data/moneyPages";
import { internalLinkLabel } from "@/lib/seo/internalLinks";
import type { TemplateBase } from "@/lib/templates/types";

function linkLabel(brand: MoneyPage["brand"], href: string): string {
  const money = MONEY_PAGES.find((p) => p.brand === brand && p.path === href);
  if (money) return money.serviceName;
  return internalLinkLabel(brand, href);
}

export default function MoneyPageTemplate({ page }: { page: MoneyPage }) {
  const canonicalUrl = toAbsoluteUrl(page.brand, page.path);
  const collectionLabel = page.collection === "leistungen" ? "Leistungen" : "Lösungen";

  const base: TemplateBase = {
    brand: page.brand,
    canonicalUrl,
    breadcrumbs: [
      { label: "Start", href: "/" },
      { label: collectionLabel, href: page.path },
      { label: page.serviceName, href: page.path },
    ],
    eyebrow: page.eyebrow,
    title: page.h1,
    intro: page.heroIntro,
    faq: page.faq,
  };

  const schema = serviceSchema({
    brand: page.brand,
    name: page.serviceName,
    description: page.heroIntro,
    url: canonicalUrl,
    serviceType: page.serviceName,
  });

  return (
    <TemplateFrame base={base} extraSchema={schema} cta={{ label: "Systemanalyse starten", href: "/systemanalyse" }}>
      {/* AEO direct answer */}
      <TemplateSection eyebrow="Kurzantwort" heading="Das Wichtigste zuerst">
        <GlassCard>
          <p className="text-base leading-relaxed text-white/80">{page.aeoAnswer}</p>
        </GlassCard>
      </TemplateSection>

      {/* Problem */}
      <TemplateSection eyebrow="Ausgangslage" heading="Das Problem">
        <p className="max-w-3xl text-base leading-relaxed text-white/70">{page.problem}</p>
      </TemplateSection>

      {/* Solution + modules */}
      <TemplateSection eyebrow="Lösung" heading="Was gebaut wird" intro={page.solutionIntro}>
        <CardGrid>
          {page.modules.map((m, i) => (
            <GlassCard key={i}>
              <h3 className="text-base font-medium text-white/95">{m.title}</h3>
              {m.description && (
                <p className="mt-2 text-sm leading-relaxed text-white/65">{m.description}</p>
              )}
            </GlassCard>
          ))}
        </CardGrid>
      </TemplateSection>

      {/* Brand-specific approach */}
      <TemplateSection eyebrow="Ansatz" heading="Wie wir vorgehen">
        <ul className="space-y-3">
          {page.approach.map((a, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/75">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-white/40" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </TemplateSection>

      {/* Industries */}
      <TemplateSection eyebrow="Für wen" heading="Passende Einsatzbereiche">
        <div className="flex flex-wrap gap-2">
          {page.industries.map((ind, i) => (
            <span
              key={i}
              className="rounded-full px-4 py-2 text-sm text-white/75"
              style={{ border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))" }}
            >
              {ind}
            </span>
          ))}
        </div>
      </TemplateSection>

      {/* Decision matrix */}
      <TemplateSection eyebrow="Entscheidung" heading="Wann sinnvoll — und wann nicht">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GlassCard>
            <h3 className="text-base font-medium text-white/95">Sinnvoll, wenn</h3>
            <ul className="mt-3 space-y-2">
              {page.decision.suitable.map((s, i) => (
                <li key={i} className="text-sm leading-relaxed text-white/70">{s}</li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard>
            <h3 className="text-base font-medium text-white/95">Nicht ideal, wenn</h3>
            <ul className="mt-3 space-y-2">
              {page.decision.notSuitable.map((s, i) => (
                <li key={i} className="text-sm leading-relaxed text-white/70">{s}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-white/55">{page.decision.alternative}</p>
          </GlassCard>
        </div>
      </TemplateSection>

      {/* Cost corridor */}
      <TemplateSection eyebrow="Kosten" heading="Projektkorridor statt Fixpreis">
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/75">{page.costNote}</p>
          <Link
            href="/preiskalkulator"
            className="mt-4 inline-block text-sm text-white/85 underline underline-offset-4"
          >
            Zum Preiskalkulator
          </Link>
        </GlassCard>
      </TemplateSection>

      {/* Process */}
      <TemplateSection eyebrow="Ablauf" heading="Wie ein Projekt läuft">
        <ol className="space-y-4">
          {page.process.map((step, i) => (
            <li key={i}>
              <GlassCard>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-base font-medium text-white/95">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{step.description}</p>
              </GlassCard>
            </li>
          ))}
        </ol>
      </TemplateSection>

      {/* Internal links */}
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
                {linkLabel(page.brand, href)}
              </Link>
            ))}
          </div>
        </TemplateSection>
      )}

      {/* Proof constraints */}
      <TemplateSection eyebrow="Transparenz" heading="Was wir zusichern — und was nicht">
        <p className="max-w-3xl text-sm leading-relaxed text-white/60">{MONEY_PROOF_CONSTRAINTS}</p>
      </TemplateSection>
    </TemplateFrame>
  );
}
