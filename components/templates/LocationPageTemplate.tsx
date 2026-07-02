"use client";

/**
 * Location-page template (Phase 7). Renders an NRW city page with REAL local
 * differentiation on top of the shared Phase 4 TemplateFrame, plus a Service
 * JSON-LD whose `areaServed` is a service-area statement (never an address).
 *
 * Factual only: no office/branch claims, no opening hours, no geo coordinates,
 * no ratings, no fixed prices, no guarantees. Both brands are legally based in
 * Unna; cities other than Unna are service areas, not locations.
 */

import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import { serviceSchema } from "@/lib/seo/jsonld";
import { toAbsoluteUrl } from "@/config/seo/domains";
import { MONEY_PAGES } from "@/data/moneyPages";
import { LOCATION_PAGES, type LocationPage } from "@/data/locationPages";
import type { TemplateBase } from "@/lib/templates/types";

const CORE_LINK_LABELS: Record<string, string> = {
  "/systemanalyse": "Systemanalyse",
  "/preiskalkulator": "Preiskalkulator",
  "/preise": "Preise",
  "/projekte": "Projekte",
  "/kontakt": "Kontakt",
};

function relatedLabel(brand: LocationPage["brand"], href: string): string {
  const money = MONEY_PAGES.find((p) => p.brand === brand && p.path === href);
  if (money) return money.serviceName;
  return CORE_LINK_LABELS[href] ?? href;
}

function cityLabel(brand: LocationPage["brand"], slug: string): string {
  const page = LOCATION_PAGES.find((p) => p.brand === brand && p.slug === slug);
  return page?.city ?? slug;
}

export default function LocationPageTemplate({ page }: { page: LocationPage }) {
  const canonicalUrl = toAbsoluteUrl(page.brand, page.path);

  const base: TemplateBase = {
    brand: page.brand,
    canonicalUrl,
    breadcrumbs: [
      { label: "Start", href: "/" },
      { label: "Standorte", href: page.path },
      { label: page.city, href: page.path },
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
    areaServed: page.areaServed,
  });

  return (
    <TemplateFrame base={base} extraSchema={schema} cta={{ label: "Systemanalyse starten", href: "/systemanalyse" }}>
      {/* AEO direct answer */}
      <TemplateSection eyebrow="Kurzantwort" heading="Das Wichtigste zuerst">
        <GlassCard>
          <p className="text-base leading-relaxed text-white/80">{page.aeoAnswer}</p>
        </GlassCard>
      </TemplateSection>

      {/* Real local context */}
      <TemplateSection eyebrow={`Region · ${page.region}`} heading={`Warum ${page.city}`}>
        <p className="max-w-3xl text-base leading-relaxed text-white/70">{page.localContext}</p>
      </TemplateSection>

      {/* Services */}
      <TemplateSection eyebrow="Leistungen" heading={`Was für Unternehmen in ${page.city} entsteht`}>
        <CardGrid>
          {page.services.map((s, i) => (
            <GlassCard key={i}>
              <h3 className="text-base font-medium text-white/95">{s.title}</h3>
              {s.description && (
                <p className="mt-2 text-sm leading-relaxed text-white/65">{s.description}</p>
              )}
            </GlassCard>
          ))}
        </CardGrid>
      </TemplateSection>

      {/* Industries */}
      <TemplateSection eyebrow="Für wen" heading="Passende Branchen in der Region">
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

      {/* Process */}
      <TemplateSection eyebrow="Ablauf" heading="Wie die Zusammenarbeit läuft">
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

      {/* Nearby cities */}
      {page.nearbyCities.length > 0 && (
        <TemplateSection eyebrow="In der Nähe" heading="Weitere Städte in der Region">
          <div className="flex flex-wrap gap-3">
            {page.nearbyCities.map((slug, i) => (
              <Link
                key={i}
                href={`/standorte/${slug}`}
                className="rounded-xl px-4 py-2 text-sm text-white/80"
                style={{ border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))" }}
              >
                {cityLabel(page.brand, slug)}
              </Link>
            ))}
          </div>
        </TemplateSection>
      )}

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

      {/* Service-area transparency */}
      <TemplateSection eyebrow="Transparenz" heading="Regional erreichbar, kein Ladenlokal">
        <p className="max-w-3xl text-sm leading-relaxed text-white/60">
          {page.serviceName} wird für Unternehmen in {page.city} und Umgebung remote und vor Ort
          nach Vereinbarung erbracht. {page.region} und weitere Regionen in NRW sowie deutschlandweit
          werden als Servicegebiet betreut. Der rechtliche Sitz des Unternehmens ist Unna.
        </p>
      </TemplateSection>
    </TemplateFrame>
  );
}
