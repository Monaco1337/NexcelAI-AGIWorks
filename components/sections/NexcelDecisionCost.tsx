import Link from "@/components/BrandAwareLink";
import type { MoneyPage } from "@/data/moneyPages";
import styles from "./NexcelDecisionCost.module.css";

type Props = {
  decision: MoneyPage["decision"];
  costNote: MoneyPage["costNote"];
};

function StatusIcon({ positive }: { positive: boolean }) {
  return (
    <span aria-hidden="true" className={`${styles.icon} ${positive ? styles.positive : styles.caution}`}>
      {positive ? (
        <svg viewBox="0 0 20 20" fill="none" focusable="false">
          <path d="m4.5 10.3 3.6 3.6 7.4-7.8" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" focusable="false">
          <path d="m5.4 5.4 9.2 9.2M14.6 5.4l-9.2 9.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export default function NexcelDecisionCost({ decision, costNote }: Props) {
  return (
    <div className={styles.root} data-nxl-premium-decision-cost="v11">
      <section
        className={styles.decisionSection}
        data-nxl-premium-decision="v11"
        aria-labelledby="nxl-premium-decision-heading"
      >
        <header className={styles.headingGroup}>
          <p className={styles.eyebrow}><span aria-hidden="true" className={styles.eyebrowLine} />ENTSCHEIDUNG<span aria-hidden="true" className={styles.eyebrowLine} /></p>
          <h2 id="nxl-premium-decision-heading" className={styles.heading}>
            Wann sinnvoll <span>— und wann nicht</span>
          </h2>
        </header>

        <div className={styles.comparison}>
          <article className={`${styles.panel} ${styles.panelPositive}`}>
            <div className={styles.panelHead}>
              <span className={styles.panelEmblem} aria-hidden="true"><StatusIcon positive /></span>
              <h3 className={styles.panelTitle}>Sinnvoll, wenn</h3>
            </div>
            <ul className={styles.criteria}>
              {decision.suitable.map((criterion, index) => (
                <li key={`${index}-${criterion}`}>
                  <StatusIcon positive />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className={`${styles.panel} ${styles.panelCaution}`}>
            <div className={styles.panelHead}>
              <span className={styles.panelEmblem} aria-hidden="true"><StatusIcon positive={false} /></span>
              <h3 className={styles.panelTitle}>Nicht ideal, wenn</h3>
            </div>
            <ul className={styles.criteria}>
              {decision.notSuitable.map((criterion, index) => (
                <li key={`${index}-${criterion}`}>
                  <StatusIcon positive={false} />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
            {decision.alternative && (
              <p className={styles.alternative}>
                <strong>Alternative:</strong> {decision.alternative}
              </p>
            )}
          </article>
        </div>
      </section>

      <section className={styles.costSection} data-nxl-premium-cost="v11" aria-labelledby="nxl-premium-cost-heading">
        <article className={styles.costPanel}>
          <div className={styles.costContent}>
            <p className={styles.costEyebrow}>KOSTEN</p>
            <h2 id="nxl-premium-cost-heading" className={styles.costHeading}>Projektkorridor statt Fixpreis</h2>
            <p className={styles.costCopy}>{costNote}</p>
            <Link href="/beratung" className={styles.costLink}>
              Projektumfang im Erstgespräch klären
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <div className={styles.costLight} aria-hidden="true" />
        </article>
      </section>
    </div>
  );
}
