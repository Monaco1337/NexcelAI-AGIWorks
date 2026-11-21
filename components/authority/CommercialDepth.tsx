import Link from "@/components/BrandAwareLink";
import type { MoneyPage } from "@/data/moneyPages";
import { AUTHORITY_PAGES } from "@/data/authorityPortfolio";
import commercialJson from "@/data/commercialDepth.json";

type CommercialContent = {
  intent: string;
  architecture: string;
  deliverable: string;
  acceptance: string;
  related: string[];
};
const CONTENT: Record<string, CommercialContent> = commercialJson;

/** One procurement section inside the service page, before its single final CTA. */
export default function CommercialDepth({ page }: { page: MoneyPage }) {
  const content = CONTENT[`${page.brand}:${page.path}`];
  if (!content) return null;
  const isAgi = page.brand === "agiworks";
  const details = [
    { name: "Technische Grenzen transparent machen", label: "Systemarchitektur", text: content.architecture },
    { name: "Leistungsumfang präzise definieren", label: "Projektumfang", text: content.deliverable },
    { name: "Belastbare Ergebnisse nachweisen", label: "Qualitätssicherung", text: content.acceptance },
  ];

  return (
    <section className="v6-section v6-commercial" aria-label="Investitions- und Umsetzungsentscheidung">
      <div className="v6-shell">
        <header className="v6-section-head">
          <span className="v6-label">{isAgi ? "Engineering & Beschaffung" : "Investitions- & Umsetzungsentscheidung"}</span>
          <h2 className="v6-h2">Woran Sie eine belastbare Umsetzung erkennen.</h2>
          <p>{content.intent}</p>
        </header>
        <div className="v6-columns v6-columns-three">
          {details.map((item, index) => (
            <article key={item.label} className="v6-column">
              <span className="v6-label">{String(index + 1).padStart(2, "0")} / {item.label}</span>
              <h3>{item.name}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <nav className="v6-commercial-links" aria-label="Vertiefende technische Fachseiten">
          <h3>Vertiefende technische Schwerpunkte</h3>
          <div className="v6-link-group">
            {content.related.map((path) => {
              const topic = AUTHORITY_PAGES.find((item) => item.brand === page.brand && item.path === path);
              return <Link key={path} href={path}>{topic?.headline ?? path} <span aria-hidden="true">↗</span></Link>;
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}
