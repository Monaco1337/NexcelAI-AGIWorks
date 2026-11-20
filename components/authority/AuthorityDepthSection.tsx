import type { AuthorityPage } from "@/data/authorityPortfolio";
import depthJson from "@/data/authorityDepth.json";

type Depth = { decision: string; validation: string };
const DEPTH: Record<string, Depth> = depthJson;

/**
 * V4: additional topic-specific decision and verification material.
 * Every entry is an authored technical statement; no synthetic testimonials,
 * ROI figures, success guarantees, or fabricated customer projects.
 */
export default function AuthorityDepthSection({ page }: { page: AuthorityPage }) {
  const depth = DEPTH[page.slug];
  if (!depth) return null;
  const isAgi = page.brand === "agiworks";
  return (
    <section aria-labelledby="fachlicher-nachweis" className="border-t border-white/10 py-20 lg:py-24">
      <div className="max-w-[800px]">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[var(--brand-primary)]">
          {isAgi ? "ENGINEERING ENTSCHEIDUNG" : "FACHLICHE UMSETZUNG"}
        </p>
        <h2 id="fachlicher-nachweis" className="mt-5 text-[clamp(2rem,3vw,3.3rem)] font-medium leading-[1.15] tracking-[-.045em]">
          {isAgi ? "Technische Entscheidung. Prüffähiges Ergebnis." : "Ein konkreter Ansatz. Ein überprüfbarer Nutzen."}
        </h2>
        <p className="mt-5 max-w-[700px] text-[15px] leading-8 text-slate-400">
          {isAgi
            ? "Die Umsetzung wird an Systemgrenzen, Fehlerverhalten und messbaren Anforderungen beurteilt – nicht an einem Architekturdiagramm allein."
            : "Eine KI-Anwendung muss eine fachlich verantwortbare Entscheidung ermöglichen. Entscheidend sind die konkreten Grenzen und der Nachweis im realistischen Prozess."}
        </p>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[24px] border border-white/10 bg-[#101925] p-7 sm:p-9">
          <p className="text-[11px] uppercase tracking-[.16em] text-[var(--brand-primary)]">01 / Abgrenzung und Architektur</p>
          <h3 className="mt-5 text-[22px] font-medium tracking-[-.03em]">Was wirklich entschieden werden muss</h3>
          <p className="mt-5 text-[15px] leading-8 text-slate-300">{depth.decision}</p>
        </article>
        <article className="rounded-[24px] border border-white/10 bg-[#101925] p-7 sm:p-9">
          <p className="text-[11px] uppercase tracking-[.16em] text-[var(--brand-primary)]">02 / Prüf- und Abnahmeverfahren</p>
          <h3 className="mt-5 text-[22px] font-medium tracking-[-.03em]">Wie sich Qualität belegen lässt</h3>
          <p className="mt-5 text-[15px] leading-8 text-slate-300">{depth.validation}</p>
        </article>
      </div>
    </section>
  );
}
