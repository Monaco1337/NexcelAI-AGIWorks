import type { AuthorityPage } from "@/data/authorityPortfolio";
import depthJson from "@/data/authorityDepth.json";

type Depth = { decision: string; validation: string };
const DEPTH: Record<string, Depth> = depthJson;

/** Exact per-topic source content, with accessible headings and editorial spacing. */
export default function AuthorityDepthSection({ page }: { page: AuthorityPage }) {
  const depth = DEPTH[page.slug];
  if (!depth) return null;
  const agi = page.brand === "agiworks";
  return (
    <section className="v6-section v6-depth" aria-labelledby="v6-depth-title">
      <div className="v6-section-head">
        <span className="v6-label">{agi ? "Engineering-Entscheidung" : "Fachliche Umsetzung"}</span>
        <h2 id="v6-depth-title" className="v6-h2">{agi
          ? "Technische Entscheidungen. Nachprüfbare Ergebnisse."
          : "Ein klarer Ansatz. Ein überprüfbares Ergebnis."}</h2>
        <p>{agi
          ? "Tragfähige Software entsteht durch geprüfte Systemgrenzen, verlässliches Fehlerverhalten und nachvollziehbare Abnahmekriterien."
          : "Der Mehrwert einer KI-Anwendung zeigt sich in fachlich kontrollierbaren Entscheidungen und einem realistisch überprüften Prozess."}</p>
      </div>
      <div className="v6-columns v6-columns-two">
        <article className="v6-column">
          <span className="v6-label">01 / Entscheidungsgrundlage</span>
          <h3>Architektur und Abgrenzung</h3>
          <p>{depth.decision}</p>
        </article>
        <article className="v6-column">
          <span className="v6-label">02 / Qualitätsnachweis</span>
          <h3>Prüfung und Abnahme</h3>
          <p>{depth.validation}</p>
        </article>
      </div>
    </section>
  );
}
