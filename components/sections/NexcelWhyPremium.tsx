"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useBrand } from "@/contexts/BrandContext";
import styles from "./NexcelWhyPremium.module.css";

type IconName =
  | "contact"
  | "ownership"
  | "systems"
  | "purpose";

const pillars: {
  title: string;
  description: string;
  icon: IconName;
}[] = [
  {
    title: "Direkter Kontakt",
    description:
      "Sie sprechen mit den Menschen, die Ihr Vorhaben verstehen, einordnen und verantwortlich begleiten.",
    icon: "contact",
  },
  {
    title: "Klare Verantwortung",
    description:
      "Entscheidungen, Übergaben und Freigaben werden sauber definiert, damit nichts im Unklaren bleibt.",
    icon: "ownership",
  },
  {
    title: "Bestehendes sinnvoll einbeziehen",
    description:
      "Wir ersetzen nicht blind. Wir prüfen zuerst, was bleiben kann und was wirklich verbunden werden muss.",
    icon: "systems",
  },
  {
    title: "Keine KI um jeden Preis",
    description:
      "Wir empfehlen Automatisierung nur dort, wo sie echten Nutzen bringt und im Alltag tragfähig bleibt.",
    icon: "purpose",
  },
];

function Icon({ icon }: { icon: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.iconSvg}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon === "contact" && (
        <>
          <path d="M7 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M17 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M3.5 18.5c.8-2.5 2.7-3.8 5.5-3.8 1.2 0 2.2.2 3 .7" />
          <path d="M13.5 18.5c.7-2.2 2.4-3.3 5-3.3 1 0 1.8.2 2.5.5" />
        </>
      )}

      {icon === "ownership" && (
        <>
          <path d="M12 2.8 19.2 5.6v5c0 4.7-2.8 8.2-7.2 10.6-4.4-2.4-7.2-5.9-7.2-10.6v-5L12 2.8Z" />
          <path d="m8.7 11.8 2.2 2.2 4.5-4.8" />
        </>
      )}

      {icon === "systems" && (
        <>
          <rect x="2.8" y="4" width="7" height="5.5" rx="1.4" />
          <rect x="14.2" y="4" width="7" height="5.5" rx="1.4" />
          <rect x="8.5" y="14.5" width="7" height="5.5" rx="1.4" />
          <path d="M6.3 9.5v2.1c0 1 .8 1.8 1.8 1.8H12" />
          <path d="M17.7 9.5v2.1c0 1-.8 1.8-1.8 1.8H12" />
        </>
      )}

      {icon === "purpose" && (
        <>
          <circle cx="12" cy="12" r="8.2" />
          <circle cx="12" cy="12" r="3.7" />
          <path d="M12 3.8v2.1M12 18.1v2.1M20.2 12h-2.1M5.9 12H3.8" />
        </>
      )}
    </svg>
  );
}

export default function NexcelWhyPremium({
  fallback,
}: {
  fallback: ReactNode;
}) {
  const { id } = useBrand();
  const pathname = usePathname();

  if (id !== "nexcel" || pathname !== "/") {
    return <>{fallback}</>;
  }

  return (
    <section
      id="warum-nexcel"
      aria-labelledby="nexcel-why-title"
      className={styles.root}
    >
      <div className={styles.shell}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            WARUM NEXCEL AI
          </p>

          <h2 id="nexcel-why-title" className={styles.title}>
            Klarer Prozess.
            <span>Klare Verantwortung.</span>
          </h2>

          <p className={styles.lead}>
            Unternehmen kaufen keine KI-Demo. Sie kaufen Verlässlichkeit,
            Klarheit und einen Partner, der Verantwortung übernimmt.
            Genau darauf ist unsere Arbeit ausgerichtet.
          </p>

          <div className={styles.ctaRow}>
            <Link
              href="/kontakt?betreff=Potenzialgespr%C3%A4ch"
              className={styles.cta}
            >
              Potenzialgespräch anfragen
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className={styles.ctaArrow}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </Link>

            <p className={styles.ctaNote}>
              Keine Standardberatung. Erstgespräch direkt mit den Verantwortlichen.
            </p>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelGlow} aria-hidden="true" />

          <div className={styles.panelTop}>
            <span className={styles.panelKicker}>
              WAS UNSERE ARBEIT AUSZEICHNET
            </span>
            <span className={styles.panelLine} aria-hidden="true" />
          </div>

          <div className={styles.grid}>
            {pillars.map((item) => (
              <article className={styles.item} key={item.title}>
                <div className={styles.itemHead}>
                  <Icon icon={item.icon} />
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
