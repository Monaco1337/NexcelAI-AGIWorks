import type { AuthorityPage } from "@/data/authorityPortfolio";
import depthJson from "@/data/authorityDepth.json";

type Depth = { decision: string; validation: string };
const DEPTH: Record<string, Depth> = depthJson;

/** Per-topic technical evidence, rendered as open editorial columns. */
export default function AuthorityDepthSection({ page }: { page: AuthorityPage }) {
  const depth = DEPTH[page.slug];
  if (!depth) return null;
  const isAgi = page.brand === "agiworks";

  return (
    <section aria-labelledby="fachlicher-nachweis" className="py-20 lg:py-28">
      <div className="seo-premium-v5-section-heading">
        <p className="text-[11px] font-semibold uppercase tracking-[.19em] text-[var(--brand-primary)]">
          {isAgi ? "ENGINEERING-ENTSCHEIDUNG" : "FACHLICHE UMSETZUNG"}
        </p>
        <h2 id="fachlicher-nachweis" className="mt-5 text-[clamp(2rem,3.2vw,3.55rem)] font-medium tracking-[-.045em] text-white">
          {isAgi ? "Technische Entscheidungen. Nachprüfbare Ergebnisse." : "Ein klarer Ansatz. Ein überprüfbares Ergebnis."}
        </h2>
        <p className="mx-auto mt-6 max-w-[720px] text-[15px] leading-8 text-slate-400">
          {isAgi
            ? "Tragfähige Software entsteht durch geprüfte Systemgrenzen, verlässliches Fehlerverhalten und nachvollziehbare Abnahmekriterien."
            : "Der Mehrwert einer KI-Anwendung zeigt sich in fachlich kontrollierbaren Entscheidungen und einem realistisch überprüften Prozess."}
        </p>
      </div>
      <div className="seo-premium-v5-editorial-grid mt-16 grid md:grid-cols-2">
        <article className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[.18em] text-[var(--brand-primary)]">01 · Entscheidungsgrundlage</p>
          <h3 className="mt-4 text-[clamp(1.3rem,1.9vw,1.75rem)] font-medium tracking-[-.03em] text-white">
            Architektur und Abgrenzung
          </h3>
          <p className="mt-5 text-[15px] leading-8 text-slate-300">{depth.decision}</p>
        </article>
        <article className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[.18em] text-[var(--brand-primary)]">02 · Qualitätsnachweis</p>
          <h3 className="mt-4 text-[clamp(1.3rem,1.9vw,1.75rem)] font-medium tracking-[-.03em] text-white">
            Prüfung und Abnahme
          </h3>
          <p className="mt-5 text-[15px] leading-8 text-slate-300">{depth.validation}</p>
        </article>
      </div>
    </section>
  );
}
