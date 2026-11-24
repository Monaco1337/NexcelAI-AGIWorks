import type { MoneyPage } from "@/data/moneyPages";
import styles from "./NexcelProjectFlow.module.css";

type Props = { steps: MoneyPage["process"] };

/*
 * NXL_WORKFLOW_PREMIUM_V11: Purely presentational, NEXCEL-only workflow.
 * Every title and description is sourced from the existing V11 page registry.
 * No hardcoded business claims, scripts, images, or external dependencies.
 */
function StepIcon({ index }: { index: number }) {
  const icon = index % 5;
  return (
    <span className={styles.iconTile} aria-hidden="true">
      <svg
        className={styles.iconSvg}
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        {icon === 0 && (
          <>
            <circle cx="12" cy="12" r="7.25" />
            <path d="m17.5 17.5 6 6" />
          </>
        )}
        {icon === 1 && (
          <>
            <path d="m14 3 10 5.6-10 5.6L4 8.6 14 3Z" />
            <path d="m4 14.1 10 5.5 10-5.5M4 19.5 14 25l10-5.5" />
          </>
        )}
        {icon === 2 && (
          <>
            <path d="m10 7-7 7 7 7M18 7l7 7-7 7M16 4l-4 20" />
          </>
        )}
        {icon === 3 && (
          <>
            <path d="m14 2.5 9 3.9v6.8c0 6.1-3.9 9.7-9 12.3-5.1-2.6-9-6.2-9-12.3V6.4L14 2.5Z" />
            <path d="m9.5 13.6 3 3 6-6" />
          </>
        )}
        {icon === 4 && (
          <>
            <rect x="4.5" y="16.5" width="4" height="8" rx="1" fill="currentColor" stroke="none" />
            <rect x="12" y="11" width="4" height="13.5" rx="1" fill="currentColor" stroke="none" />
            <rect x="19.5" y="4" width="4" height="20.5" rx="1" fill="currentColor" stroke="none" />
          </>
        )}
      </svg>
    </span>
  );
}

export default function NexcelProjectFlow({ steps }: Props) {
  if (steps.length === 0) return null;
  const gridClass = steps.length === 5 ? styles.five : steps.length === 4 ? styles.four : styles.other;

  return (
    <section
      className={styles.root}
      data-nxl-premium-workflow="v11"
      aria-labelledby="nxl-premium-workflow-title"
    >
      <article className={styles.panel}>
        <div className={styles.ambient} aria-hidden="true" />
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} aria-hidden="true" />
            ABLAUF
            <span className={styles.eyebrowLine} aria-hidden="true" />
          </p>
          <h2 className={styles.heading} id="nxl-premium-workflow-title">
            Wie ein <span>Projekt läuft</span>
          </h2>
        </header>
        <ol className={`${styles.steps} ${gridClass}`} aria-label="Projektphasen">
          {steps.map((step, index) => (
            <li className={`${styles.step} ${index === 0 ? styles.active : ""}`} key={`${index}-${step.title}`} data-nxl-workflow-step="true">
              <StepIcon index={index} />
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.description}>{step.description}</p>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
