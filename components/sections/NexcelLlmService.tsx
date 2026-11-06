"use client";
// NEXCEL_LLM_SERVICE_V1
import Link from "next/link";
import styles from "./NexcelLlmService.module.css";

type Props = { kind: "home" | "catalog" | "pricing" };
export default function NexcelLlmService({ kind }: Props) {
  const pricing = kind === "pricing";
  const titleId = `nexcel-llm-${kind}`;
  return (
    <section className={styles.section} aria-labelledby={titleId} data-homeflow-surface="true">
      <div className={styles.surface}>
        <div className={styles.content}>
          <p className={styles.kicker}>NEXCEL AI · INDIVIDUELLE MODELLENTWICKLUNG</p>
          <h2 id={titleId} className={styles.heading}>
            {pricing ? "Eigene LLMs. Ein klarer Investitionsrahmen." : "Eigene LLMs. Für Ihr Unternehmen entwickelt."}
          </h2>
          <p className={styles.copy}>
            Wir konzipieren unternehmensspezifische Sprachmodelle, bereiten Trainingsdaten auf,
            passen Modelle durch Fine-Tuning an und entwickeln sichere Inferenz- und Evaluierungsprozesse.
            Private Bereitstellung und ein vollständig neues Modell prüfen wir entsprechend Ihren Anforderungen.
          </p>
          <div className={styles.features} aria-label="Leistungsumfang">
            <span>Modellarchitektur</span><span>Fine-Tuning</span>
            <span>Qualitätstests</span><span>Private Bereitstellung</span>
          </div>
        </div>
        <div className={styles.action}>
          <p className={styles.priceLabel}>{pricing ? "PROJEKTKORRIDOR · MODELLANPASSUNG" : "INDIVIDUELLE LLM-SYSTEME"}</p>
          <strong className={styles.price}>25.000–90.000 €</strong>
          <p className={styles.note}>Richtwert für Anpassung bestehender Modelle. Vollständiges Vortraining und laufende Infrastrukturkosten separat.</p>
          <Link className={styles.link} href="/loesungen/eigene-llms">Leistung entdecken <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
