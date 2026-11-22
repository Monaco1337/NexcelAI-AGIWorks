import type { ReactNode } from "react";
import Link from "@/components/BrandAwareLink";
import { toAbsoluteUrl } from "@/config/seo/domains";
import type { AuthorityPage } from "@/data/authorityPortfolio";
import { getAuthorityPages } from "@/data/authorityPortfolio";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import AuthorityDepthSection from "@/components/authority/AuthorityDepthSection";
import { webPageForUrl } from "@/lib/seo/jsonld";

function Label({ children }: { children: ReactNode }) {
  return <span className="v6-label">{children}</span>;
}

/**
 * Shared SSR-only editorial detail for 100 indexed authority pages.
 * Content remains sourced exclusively from the existing brand-specific registry.
 */
export default function AuthorityDetail({ page }: { page: AuthorityPage }) {
  const isAgi = page.brand === "agiworks";
  const brand = isAgi ? "AGI Works" : "NEXCEL AI";
  const siblings = getAuthorityPages(page.brand)
    .filter((other) => other.slug !== page.slug && other.category === page.category)
    .slice(0, 3);
  const canonical = toAbsoluteUrl(page.brand, page.path);
  const stages = [
    { name: "Strategische Klärung", detail: "Ausgangslage, Ergebnis und verantwortliche Rollen präzisieren." },
    { name: "Systemdesign", detail: "Datenflüsse, Integrationen und Entscheidungsgrenzen entwerfen." },
    { name: "Operativer Nachweis", detail: "Qualität, Kontrolle und Weiterentwicklung im Betrieb absichern." },
  ];
  const evidence = [
    { label: "Kontrollpunkt", heading: "Sicherheit und Grenzen", text: page.risk },
    { label: "Abnahmekriterium", heading: "Messbare Qualität", text: page.metric },
    { label: "Geschäftlicher Nutzen", heading: "Wirkung im Betrieb", text: page.benefit },
  ];

  return (
    <main className="premium-v6 v6-authority" data-v6-brand={page.brand}>
      <div className="v6-shell">
        <nav aria-label="Breadcrumb" className="v6-breadcrumb">
          <Link href="/">Start</Link><span aria-hidden="true">/</span>
          <Link href={isAgi ? "/engineering" : "/anwendungen"}>{isAgi ? "Engineering" : "Anwendungen"}</Link>
          <span aria-hidden="true">/</span><span aria-current="page">{page.category}</span>
        </nav>

        <header className="v6-hero">
          <Label>{brand} / {page.category}</Label>
          <h1 className="v6-h1">{page.headline}</h1>
          <p className="v6-lead">{page.problem}</p>
          <div className="v6-actions">
            <Link className="v6-button v6-button-primary" href="/kontakt">Projekt besprechen <span aria-hidden="true">↗</span></Link>
            <a className="v6-button v6-button-secondary" href="#konzept">Ansatz verstehen <span aria-hidden="true">↓</span></a>
          </div>
          <p className="v6-trustline">Strategie · Umsetzung · Betrieb · klare Verantwortlichkeiten</p>
        </header>

        <ol className="v6-stage-row" aria-label="Unser Vorgehen">
          {stages.map((stage, index) => (
            <li key={stage.name}>
              <span className="v6-stage-index">{String(index + 1).padStart(2, "0")}</span>
              <h2>{stage.name}</h2>
              <p>{stage.detail}</p>
            </li>
          ))}
        </ol>

        <section id="konzept" className="v6-section" aria-labelledby="v6-concept-title">
          <div className="v6-section-head">
            <Label>{isAgi ? "Architekturansatz" : "Unternehmensansatz"}</Label>
            <h2 id="v6-concept-title" className="v6-h2">Ein nachvollziehbares Konzept. <span className="v6-highlight">Kein beliebiges Tool.</span></h2>
          </div>
          <div className="v6-prose v6-prose-wide">
            <p>{page.approach}</p>
            <p>{page.system}</p>
          </div>
        </section>

        <AuthorityDepthSection page={page} />

        <section className="v6-section" aria-labelledby="v6-quality-title">
          <div className="v6-section-head">
            <Label>Qualität im Betrieb</Label>
            <h2 id="v6-quality-title" className="v6-h2">Woran die Umsetzung gemessen wird.</h2>
          </div>
          <div className="v6-columns v6-columns-three">
            {evidence.map((item, index) => (
              <article key={item.label} className="v6-column">
                <span className="v6-label">{String(index + 1).padStart(2, "0")} / {item.label}</span>
                <h3>{item.heading}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="v6-section" aria-labelledby="v6-service-title">
          <div className="v6-section-head">
            <Label>Passender Kontext</Label>
            <h2 id="v6-service-title" className="v6-h2">Die passende Leistung dahinter.</h2>
            <p>Wir verbinden Konzeption, technische Anbindung und nachvollziehbare Weiterentwicklung mit dem tatsächlichen Unternehmensbedarf.</p>
          </div>
          <nav className="v6-link-group" aria-label="Passende Leistungen">
            <Link href={page.primaryLink}>Passende Leistung ansehen <span aria-hidden="true">↗</span></Link>
            <Link href="/systemanalyse">Systemanalyse starten <span aria-hidden="true">↗</span></Link>
          </nav>
        </section>

        {siblings.length > 0 && (
          <section className="v6-section v6-related" aria-labelledby="v6-related-title">
            <div className="v6-section-head">
              <Label>Weitere Perspektiven</Label>
              <h2 id="v6-related-title" className="v6-h2">Vertiefende Themen.</h2>
            </div>
            <nav aria-label="Thematisch verwandte Seiten" className="v6-related-list">
              {siblings.map((other) => (
                <Link href={other.path} key={other.slug}>
                  <span className="v6-label">{other.category}</span>
                  <span className="v6-related-name">{other.headline}</span>
                  <span aria-hidden="true" className="v6-link-arrow">↗</span>
                </Link>
              ))}
            </nav>
          </section>
        )}

        <section className="v6-final" aria-labelledby="v6-final-title">
          <Label>Nächster Schritt</Label>
          <h2 className="v6-h2" id="v6-final-title">Ihr Anwendungsfall. <span className="v6-highlight">Unsere gemeinsame Systementscheidung.</span></h2>
          <p>Wir klären Ausgangslage, Systemgrenzen und Verantwortlichkeiten – mit einem nachvollziehbaren Projektrahmen statt pauschalen Versprechen.</p>
          <Link className="v6-button v6-button-primary" href="/kontakt">Projekt besprechen <span aria-hidden="true">↗</span></Link>
        </section>
      </div>
      <SeoJsonLd schema={webPageForUrl({ brand: page.brand, url: canonical, name: page.title, description: page.description })} />
    </main>
  );
}
