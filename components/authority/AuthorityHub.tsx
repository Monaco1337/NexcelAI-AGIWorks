import Link from "@/components/BrandAwareLink";
import { getAuthorityPages } from "@/data/authorityPortfolio";
import type { BrandKey } from "@/config/seo/domains";

/** Shared category index: five editorial groups per brand, no decorative cards. */
export default function AuthorityHub({ brand }: { brand: BrandKey }) {
  const isAgi = brand === "agiworks";
  const pages = getAuthorityPages(brand);
  const categories = Array.from(new Set(pages.map((page) => page.category)));

  return (
    <main className="premium-v6 v6-hub" data-v6-brand={brand}>
      <div className="v6-shell">
        <nav aria-label="Breadcrumb" className="v6-breadcrumb">
          <Link href="/">Start</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{isAgi ? "Engineering" : "Anwendungen"}</span>
        </nav>
        <header className="v6-hero">
          <span className="v6-label">{isAgi ? "AGI Works / Engineering" : "NEXCEL AI / Anwendungen"}</span>
          <h1 className="v6-h1">{isAgi ? "Software, die im Betrieb trägt." : "Unternehmensprozesse neu denken."}</h1>
          <p className="v6-lead">{isAgi
            ? "Architektur, Integration, Plattformen, Sicherheit und KI-Engineering. Technische Entscheidungen für langlebige Unternehmenssysteme."
            : "KI-Agenten, Automatisierung, Customer Experience und Unternehmenswissen. Konkrete Anwendungsszenarien statt austauschbarer Technologieversprechen."}</p>
          <nav aria-label="Fachgebiete" className="v6-category-nav">
            {categories.map((category, index) => <a href={`#feld-${index}`} key={category}>{category} <span aria-hidden="true">↗</span></a>)}
          </nav>
        </header>
        {categories.map((category, index) => {
          const items = pages.filter((page) => page.category === category);
          return (
            <section className="v6-section v6-hub-group" key={category} id={`feld-${index}`} aria-labelledby={`feld-title-${index}`}>
              <div className="v6-section-head">
                <span className="v6-label">{String(index + 1).padStart(2, "0")} / {categories.length} · {items.length} Fachthemen</span>
                <h2 className="v6-h2" id={`feld-title-${index}`}>{category}</h2>
              </div>
              <div className="v6-hub-links">
                {items.map((page) => (
                  <Link href={page.path} key={page.slug}>
                    <h3>{page.headline}</h3>
                    <p>{page.problem}</p>
                    <span aria-hidden="true" className="v6-link-arrow">↗</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        <section className="v6-final" aria-labelledby="v6-hub-final">
          <span className="v6-label">Individuelle Zusammenarbeit</span>
          <h2 id="v6-hub-final" className="v6-h2">Ein konkreter Bedarf verlangt eine konkrete Lösung.</h2>
          <p>Wir klären Projektrahmen, verantwortliche Systeme und die nächsten überprüfbaren Schritte.</p>
          <Link className="v6-button v6-button-primary" href="/kontakt">Projekt besprechen <span aria-hidden="true">↗</span></Link>
        </section>
      </div>
    </main>
  );
}
