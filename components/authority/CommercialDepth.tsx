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

/** Procurement-facing depth on the eight highest-intent service pages. */
export default function CommercialDepth({ page }: { page: MoneyPage }) {
  const entry = CONTENT[`${page.brand}:${page.path}`];
  if (!entry) return null;
  const agi = page.brand === "agiworks";

  const decisions = [
    { label: "01 / Systemarchitektur", heading: "Technische Grenzen transparent machen", body: entry.architecture },
    { label: "02 / Projektumfang", heading: "Den Leistungsumfang präzise definieren", body: entry.deliverable },
    { label: "03 / Qualitätssicherung", heading: "Ein belastbares Ergebnis nachweisen", body: entry.acceptance },
  ];

  return (
    <section aria-labelledby="premium-commercial-heading" className="seo-premium-v5 seo-premium-v5-commercial relative px-5 text-white sm:px-8">
      <div className="mx-auto max-w-[1160px]">
        <header className="seo-premium-v5-section-heading">
          <p className="text-[11px] font-semibold uppercase tracking-[.19em] text-[var(--brand-primary)]">
            {agi ? "ENGINEERING & BESCHAFFUNG" : "INVESTITIONS- & UMSETZUNGSENTSCHEIDUNG"}
          </p>
          <h2 id="premium-commercial-heading" className="mt-6 text-[clamp(2rem,3.5vw,3.8rem)] font-medium tracking-[-.045em] text-white">
            Woran Sie eine belastbare Umsetzung erkennen.
          </h2>
          <p className="mx-auto mt-6 max-w-[780px] text-[16px] leading-8 text-slate-300">{entry.intent}</p>
        </header>

        <div className="seo-premium-v5-commercial-grid mt-16 lg:grid-cols-3">
          {decisions.map((item) => (
            <article key={item.label} className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[.15em] text-[var(--brand-primary)]">{item.label}</p>
              <h3 className="mt-5 text-[clamp(1.25rem,1.8vw,1.65rem)] font-medium tracking-[-.025em] text-white">{item.heading}</h3>
              <p className="mt-5 text-[15px] leading-8 text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h3 className="text-[clamp(1.35rem,2vw,2rem)] font-medium tracking-[-.025em] text-white">Vertiefende technische Schwerpunkte</h3>
          <p className="mx-auto mt-4 max-w-[660px] text-[14px] leading-7 text-slate-400">
            Ergänzende Anwendungsfälle und die fachlichen Entscheidungen dahinter.
          </p>
          <nav aria-label="Weiterführende Fachseiten" className="seo-premium-v5-commercial-cta mt-8">
            {entry.related.map((path) => {
              const topic = AUTHORITY_PAGES.find((p) => p.brand === page.brand && p.path === path);
              return (
                <Link key={path} href={path} className="seo-premium-v5-secondary inline-flex min-h-[46px] items-center justify-center rounded-full px-6 py-3 text-center text-[13px] text-white/85 transition-colors hover:text-white">
                  {topic?.headline ?? path} <span aria-hidden="true" className="ml-2">↗</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="seo-premium-v5-commercial-cta mt-16 flex-col">
          <p className="max-w-[780px] text-[13px] leading-7 text-slate-400">
            Leistungszusagen, Kosten und Referenzen werden ausschließlich anhand des jeweiligen Projekts konkretisiert.
          </p>
          <Link href="/beratung" className="seo-premium-v5-cta inline-flex items-center justify-center rounded-full px-9 py-4 text-center text-[14px] font-semibold text-white">
            Projektrahmen und nächste Schritte klären <span aria-hidden="true" className="ml-3">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
