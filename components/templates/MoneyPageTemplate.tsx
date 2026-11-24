"use client";

/**
 * Money-page template (Phase 6). Renders the full commercial page structure —
 * AEO direct answer, problem, solution + modules, brand approach, industries,
 * decision matrix, cost corridor, process, internal links, FAQ and proof
 * constraints — on top of the shared Phase 4 TemplateFrame, plus Service JSON-LD.
 *
 * Purely presentational + factual: no ratings, no fixed prices, no guarantees.
 */

import Link from "@/components/BrandAwareLink";
import Image from "next/image";
import TemplateFrame from "./TemplateFrame";
import NexcelProjectFlow from "@/components/sections/NexcelProjectFlow";
import NexcelDecisionCost from "@/components/sections/NexcelDecisionCost";
import CommercialDepth from "@/components/authority/CommercialDepth";
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

// NXL_DETAIL_PREMIUM_V11_SCOPED — use the intrinsic 840:266 SVG ratio.
const NEXCEL_DETAIL_VISUALS = [
  { match: /lead|funnel|vertrieb|sales|akquise/i, src: "/images/nexcel/usecase-1.svg", alt: "Prozessschema zur Bearbeitung und Qualifizierung von Anfragen", caption: "Anfragen strukturiert bearbeiten und qualifizieren" },
  { match: /agent|chat|voice|telefon|assist/i, src: "/images/nexcel/usecase-2.svg", alt: "Prozessschema eines KI-Agenten mit Freigabeschritten", caption: "KI-Agenten mit kontrollierten Freigaben einsetzen" },
  { match: /kommunikation|mail|service|kontakt/i, src: "/images/nexcel/usecase-3.svg", alt: "Prozessschema strukturierter Kundenkommunikation", caption: "Kommunikation und Rückfragen übersichtlich verbinden" },
  { match: /crm|erp|prozess|workflow|daten|integration|automatisierung/i, src: "/images/nexcel/usecase-4.svg", alt: "Prozessschema mit CRM, Status und Workflow-Hub", caption: "Systeme und Abläufe über definierte Schnittstellen verbinden" },
] as const;

function NexcelDetailVisual({ slug }: { slug: string }) {
  const visual = NEXCEL_DETAIL_VISUALS.find((entry) => entry.match.test(slug)) ?? NEXCEL_DETAIL_VISUALS[3];
  return (
    <figure className="nxl-detail-visual" aria-label="Illustratives Anwendungsbeispiel">
      <div className="nxl-detail-visual-top">
        <span className="nxl-detail-visual-indicator" aria-hidden="true" />
        <span>ANWENDUNGSBEISPIEL</span>
        <span className="nxl-detail-visual-type">PROZESSSCHEMA</span>
      </div>
      <div className="nxl-detail-visual-imagebox">
        <Image
          src={visual.src}
          alt={visual.alt}
          width={840}
          height={266}
          sizes="(max-width: 820px) 92vw, (max-width: 1200px) 46vw, 520px"
          className="nxl-detail-visual-image"
          priority
        />
      </div>
      <figcaption className="nxl-detail-visual-caption">{visual.caption}</figcaption>
    </figure>
  );
}

export default function MoneyPageTemplate({ page }: { page: MoneyPage }) {
  const canonicalUrl = toAbsoluteUrl(page.brand, page.path);
  const collectionLabel = page.collection === "leistungen" ? "Leistungen" : "Lösungen";

  const base: TemplateBase = {
    brand: page.brand,
    canonicalUrl,
    breadcrumbs: [
      { label: "Start", href: "/" },
      { label: collectionLabel, href: page.collection === "leistungen" ? "/leistungen" : "/loesungen" },
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
    <TemplateFrame base={base} extraSchema={schema} cta={{ label: "Systemanalyse starten", href: "/systemanalyse" }} heroAside={page.brand === "nexcel" ? <NexcelDetailVisual slug={page.slug} /> : undefined}>
      {/* NEXCEL V11: combine the two factual sections to reduce scroll. */}
      {page.brand === "nexcel" ? (
        <section className="nxl-detail-summary" aria-label="Kurzantwort und Ausgangslage">
          <div className="nxl-detail-summary-inner">
            <article className="nxl-detail-summary-primary">
              <p className="nxl-detail-kicker">KURZANTWORT</p>
              <h2>Das Wichtigste zuerst.</h2>
              <p>{page.aeoAnswer}</p>
            </article>
            <article className="nxl-detail-summary-secondary">
              <p className="nxl-detail-kicker">AUSGANGSLAGE</p>
              <h2>Das Problem.</h2>
              <p>{page.problem}</p>
            </article>
          </div>
        </section>
      ) : (
        <>
          {/* AEO direct answer */}
          <TemplateSection compact={page.brand === "agiworks"} eyebrow="Kurzantwort" heading="Das Wichtigste zuerst">
            <GlassCard>
              <p className="text-base leading-relaxed text-white/80">{page.aeoAnswer}</p>
            </GlassCard>
          </TemplateSection>

          {/* Problem */}
          <TemplateSection compact={page.brand === "agiworks"} eyebrow="Ausgangslage" heading="Das Problem">
            <p className="max-w-3xl text-base leading-relaxed text-white/70">{page.problem}</p>
          </TemplateSection>
        </>
      )}

      {/* NEXCEL-only premium modules; preserve registry content and order. */}
      {page.brand === "nexcel" ? (
        <section id="was-gebaut-wird" className="nxl-detail-build" data-nxl-build-section="true" aria-labelledby="nxl-detail-build-title">
          <div className="nxl-detail-build-inner">
            <header className="nxl-detail-build-header">
              <p className="nxl-detail-kicker">LÖSUNG / FUNKTIONSUMFANG</p>
              <h2 id="nxl-detail-build-title">Was gebaut wird.</h2>
              <p>{page.solutionIntro}</p>
            </header>
            <ol className="nxl-detail-modules">
              {page.modules.map((module, i) => (
                <li className="nxl-detail-module" key={`${module.title}-${i}`}>
                  <span className="nxl-detail-module-top">
                    <span className="nxl-detail-module-index">{String(i + 1).padStart(2, "0")}</span>
                    <span className="nxl-detail-module-tag">FUNKTIONSBAUSTEIN</span>
                  </span>
                  <h3>{module.title}</h3>
                  {module.description && <p>{module.description}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : (
        <TemplateSection compact={page.brand === "agiworks"} eyebrow="Lösung" heading="Was gebaut wird" intro={page.solutionIntro}>
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
      )}

      {/* Brand-specific approach */}
      <TemplateSection compact={page.brand === "agiworks"} eyebrow="Ansatz" heading="Wie wir vorgehen">
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
      <TemplateSection compact={page.brand === "agiworks"} eyebrow="Für wen" heading="Passende Einsatzbereiche">
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

      {/* NXL_DECISION_COST_PREMIUM_V11: only NEXCEL gets the premium decision + cost view. */}
      {page.brand === "nexcel" ? (
        <NexcelDecisionCost decision={page.decision} costNote={page.costNote} />
      ) : (
        <>
      {/* Decision matrix */}
      <TemplateSection compact={page.brand === "agiworks"} eyebrow="Entscheidung" heading="Wann sinnvoll — und wann nicht">
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
      <TemplateSection compact={page.brand === "agiworks"} eyebrow="Kosten" heading="Projektkorridor statt Fixpreis">
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/75">{page.costNote}</p>
          <Link
            href="/beratung"
            className="mt-4 inline-block text-sm text-white/85 underline underline-offset-4"
          >
            Projektumfang im Erstgespräch klären
          </Link>
        </GlassCard>
      </TemplateSection>

        </>
      )}

      {/* NXL_WORKFLOW_PREMIUM_V11: NEXCEL-only; original AGI block remains untouched. */}
      {page.brand === "nexcel" ? (
        <NexcelProjectFlow steps={page.process} />
      ) : (
        <>
      {/* Process */}
      <TemplateSection compact={page.brand === "agiworks"} eyebrow="Ablauf" heading="Wie ein Projekt läuft">
        <ol className="v6-steps">
          {page.process.map((step, i) => (
            <li key={`${i}-${step.title}`}>
              <div className="v6-step-head">
                <span className="v6-label">{String(i + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
              </div>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </TemplateSection>

        </>
      )}

      {/* Internal links */}
      {page.relatedPaths.length > 0 && (
        <TemplateSection compact={page.brand === "agiworks"} eyebrow="Weiter" heading="Passende nächste Schritte">
          <div className="flex flex-wrap gap-3">
            {page.relatedPaths.map((href, i) => (
              <Link
                key={i}
                href={href}
                className="text-sm leading-relaxed text-white/80 underline decoration-white/20 underline-offset-8 hover:decoration-white/70"
              >
                {linkLabel(page.brand, href)}
              </Link>
            ))}
          </div>
        </TemplateSection>
      )}

      <CommercialDepth page={page} />

      {/* Proof constraints */}
      <TemplateSection compact={page.brand === "agiworks"} eyebrow="Transparenz" heading="Transparenz von Anfang an">
        <p className="max-w-3xl text-sm leading-relaxed text-white/60">{MONEY_PROOF_CONSTRAINTS}</p>
      </TemplateSection>
    </TemplateFrame>
  );
}
