import Link from "next/link";
import styles from "./BrandLlmSpotlight.module.css";

type Brand = "nexcel" | "agiworks";
type Props = { brand: Brand; compact?: boolean };

export default function BrandLlmSpotlight({ brand, compact = false }: Props) {
  const agi = brand === "agiworks";
  const detail = agi ? "/agiworks/leistungen/eigene-llms" : "/loesungen/eigene-llms";
  const contact = agi ? "/agiworks/kontakt?betreff=LLM-Engineering" : "/kontakt?betreff=Individuelle-LLM-Entwicklung";
  const headline = agi ? "LLM-Engineering. Unter Ihrer Kontrolle." : "Eigene LLMs. Passend zu Ihrem Unternehmen.";
  return (
    <section className={`${styles.root} ${agi ? styles.agi : styles.nexcel} ${compact ? styles.compact : ""}`}
      aria-label="Individuelle LLM-Entwicklung" data-llm-spotlight="true">
      <div className={styles.shell}>
        <div className={styles.content}>
          <p className={styles.eyebrow}><span className={styles.line} aria-hidden="true" />
            {agi ? "AGI WORKS / LLM ENGINEERING" : "NEXCEL AI / PRIVATE LANGUAGE MODELS"}
          </p>
          <h2 className={styles.title}>{headline}</h2>
          <p className={styles.lead}>
            {agi
              ? "Spezialisierte Sprachmodelle als kontrollierbare Unternehmenssoftware: von Datenpipelines und Fine-Tuning über Evaluation bis zur privaten Inferenz und Integration."
              : "Sprachmodelle, die an Ihre Daten, Prozesse und Anforderungen angepasst werden – mit klaren Qualitätskriterien, sicherer Integration und auf Wunsch privatem Betrieb."}
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href={detail}>LLM-Lösungen entdecken <span aria-hidden="true">↗</span></Link>
            <Link className={styles.secondary} href={contact}>Projekt besprechen <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className={styles.visual}>
          <p className={styles.visualEyebrow}>MODEL DEVELOPMENT / PRIVATE AI</p>
          <div className={styles.visualSymbol} aria-hidden="true">
            <span className={styles.symbolRing} /><span className={styles.symbolCore}>LLM</span><span className={styles.symbolOrbit} />
          </div>
          <div className={styles.capabilities}>
            <span>Fine-Tuning & Daten</span><span>Evaluation & Guardrails</span><span>Private Inferenz</span>
          </div>
          <div className={styles.priceRow}>
            <div><span className={styles.priceLabel}>MODELLANPASSUNG & INTEGRATION</span>
              <strong>25.000–90.000 €</strong></div>
            <small>Projektorientierung. Vollständiges Neutraining und laufende Infrastruktur separat kalkuliert.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
