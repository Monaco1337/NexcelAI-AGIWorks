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

/** The buying-decision layer is only rendered for the eight highest-priority intent pages. */
export default function CommercialDepth({ page }: { page: MoneyPage }) {
  const entry = CONTENT[`${page.brand}:${page.path}`];
  if (!entry) return null;
  const agi = page.brand === "agiworks";
  return (
    <section aria-labelledby="commercial-depth" className="bg-[#080b12] px-5 py-20 text-white sm:px-8 lg:py-28">
      <div className="mx-auto max-w-[1160px]">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[var(--brand-primary)]">
          {agi ? "TECHNISCHE ENTSCHEIDUNGSGRUNDLAGE" : "INVESTITIONS- UND UMSETZUNGSENTSCHEIDUNG"}
        </p>
        <h2 id="commercial-depth" className="mt-6 max-w-[950px] text-[clamp(2.1rem,3.4vw,3.9rem)] font-medium leading-[1.1] tracking-[-.045em]">
          Woran Sie eine belastbare Umsetzung erkennen.
        </h2>
        <p className="mt-7 max-w-[830px] text-[16px] leading-8 text-slate-300">{entry.intent}</p>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {[
            {label:"01 / Architektur",heading:"Systemdesign und Grenzen",text:entry.architecture},
            {label:"02 / Projektumfang",heading:"Was konkret geliefert werden muss",text:entry.deliverable},
            {label:"03 / Abnahme",heading:"Woran die Lösung gemessen wird",text:entry.acceptance},
          ].map((item,index)=>(
            <article key={item.label} className={`rounded-[24px] border border-white/10 p-7 sm:p-9 ${index===2?"md:col-span-2 bg-[#142033]":"bg-[#101925]"}`}>
              <p className="text-[11px] uppercase tracking-[.15em] text-[var(--brand-primary)]">{item.label}</p>
              <h3 className="mt-5 text-[21px] font-medium tracking-[-.02em]">{item.heading}</h3>
              <p className="mt-5 max-w-[870px] text-[15px] leading-8 text-slate-300">{item.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-10">
          <h3 className="text-[18px] font-medium">Verwandte technische Schwerpunkte</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            {entry.related.map(path => (
              <Link key={path} href={path} className="rounded-xl border border-white/15 px-5 py-3 text-[13px] text-white/85 transition-colors hover:border-white/40 hover:bg-white/[.05]">
                {AUTHORITY_PAGES.find(p => p.brand === page.brand && p.path === path)?.headline ?? path} <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-[13px] leading-7 text-slate-400">Ein Projekt wird nach dokumentierten Anforderungen bewertet. Referenznachweise, konkrete Kosten und Leistungszusagen werden nur projektspezifisch vereinbart.</p>
          <Link href="/beratung" className="mt-6 inline-flex min-h-[48px] items-center rounded-xl bg-white px-6 text-sm font-medium text-[#080b12] transition-colors hover:bg-slate-200">
            Projektrahmen und nächste Schritte klären <span aria-hidden="true" className="ml-3">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
