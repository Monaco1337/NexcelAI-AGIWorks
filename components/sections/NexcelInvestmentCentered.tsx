"use client";

import type { ReactNode } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { usePathname } from "next/navigation";
import styles from "./NexcelInvestmentCentered.module.css";

type Props = {
  fallback: ReactNode;
  primaryAction: ReactNode;
  secondaryAction: ReactNode;
  anchorId?: string;
};

export default function NexcelInvestmentCentered({
  fallback,
  primaryAction,
  secondaryAction,
  anchorId,
}: Props) {
  const { id } = useBrand();
  const pathname = usePathname();

  if (id !== "nexcel" || pathname !== "/") {
    return <>{fallback}</>;
  }

  return (
    <section
      id={anchorId || undefined}
      className={styles.root}
      aria-labelledby="nxl-invest-center-title"
    >
      <div className={styles.surface}>

        <p className={styles.eyebrow}>
          INVESTITION &amp; PLANUNG
        </p>

        <h2
          id="nxl-invest-center-title"
          className={styles.title}
        >
          Erst den Nutzen klären.
          <span>Dann den Projektumfang.</span>
        </h2>

        <p className={styles.text}>
          Umfang und Kosten hängen vom Prozess, den
          Schnittstellen und den erforderlichen Freigaben ab.
          Wir zeigen Ihnen, was sinnvoll ist – und welcher
          Aufwand dahintersteht.
        </p>

        <div className={styles.actions}>
          <div className={styles.primary}>
            {primaryAction}
          </div>

          <div className={styles.secondary}>
            {secondaryAction}
          </div>
        </div>

      </div>
    </section>
  );
}
