
"use client";
// NXL_AGI_PRICING_EXPERIENCE_V4

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import styles from "./PricingSectionExperience.module.css";

type CategoryId = "digital" | "process" | "platform";

type Offer = {
  name: string;
  description: string;
  price: string;
  note?: string;
};

type Category = {
  id: CategoryId;
  nav: string;
  caption: string;
  heading: string;
  summary: string;
  offers: readonly [Offer, Offer];
};

const CATEGORIES: readonly [Category, Category, Category] = [
  {
    id: "digital",
    nav: "Web & Service",
    caption: "DIGITALE ERLEBNISSE",
    heading: "Ein Auftritt, der Vertrauen verdient.",
    summary:
      "Digitale Kontaktpunkte, die Menschen gerne nutzen und die sich sinnvoll in bestehende Abläufe einfügen.",
    offers: [
      {
        name: "Premium-Websystem",
        description: "Design, Performance und klare Nutzerführung.",
        price: "3.900–8.000 €",
      },
      {
        name: "Buchungssystem",
        description: "Termine, Kunden und Buchungsprozesse digital.",
        price: "7.500–15.000 €",
      },
    ],
  },
  {
    id: "process",
    nav: "Vertrieb & Prozesse",
    caption: "WACHSTUM & ABLÄUFE",
    heading: "Weniger Routine. Mehr Überblick.",
    summary:
      "Wiederkehrende Arbeit reduzieren, Informationen verbinden und Entscheidungen nachvollziehbarer machen.",
    offers: [
      {
        name: "Lead-Funnel & CRM",
        description: "Anfragen, Kontakte und Vertrieb zentral steuern.",
        price: "9.500–20.000 €",
      },
      {
        name: "Unternehmenssystem",
        description: "Teams, Aufgaben und Datenflüsse verbinden.",
        price: "15.000–35.000 €",
      },
    ],
  },
  {
    id: "platform",
    nav: "Plattformen & KI",
    caption: "INDIVIDUELLE SYSTEME",
    heading: "Komplexität gezielt beherrschen.",
    summary:
      "Für Vorhaben mit eigenen Datenmodellen, Integrationen und besonderen Anforderungen an Betrieb und Kontrolle.",
    offers: [
      {
        name: "Individuelles ERP-System",
        description: "Rollen, Daten, Warenwirtschaft und Integrationen.",
        price: "25.000–60.000 €",
      },
      {
        name: "KI & Automatisierung",
        description:
          "Kontrollierte KI-Unterstützung und automatisierte Abläufe.",
        price: "ab 7.500 €",
        note: "projektabhängig",
      },
    ],
  },
];

export default function PricingSection({
  compact = false,
}: {
  compact?: boolean;
} = {}) {
  const brand = useBrand();
  const pathname = usePathname();
  const isAgi = brand.id === "agiworks";

  const [chosen, setChosen] = useState<CategoryId | null>(null);
  const activeId = chosen ?? (isAgi ? "digital" : "process");

  const current =
    CATEGORIES.find((group) => group.id === activeId) ??
    CATEGORIES[0];

  const displayGroups = isAgi
    ? CATEGORIES
    : [CATEGORIES[1], CATEGORIES[2], CATEGORIES[0]];

  const rawContact = resolveBrandNavHref("/kontakt", brand.id);

  const prefix =
    isAgi &&
    pathname?.startsWith("/agiworks") &&
    rawContact.startsWith("/") &&
    !rawContact.startsWith("/agiworks/")
      ? "/agiworks"
      : "";

  const contactPath = `${prefix}${rawContact}`;

  const contactHref =
    `${contactPath}${contactPath.includes("?") ? "&" : "?"}` +
    `betreff=${encodeURIComponent("Projekt und Preisorientierung besprechen")}`;

  const calculatorHref = resolveBrandNavHref(
    "/preiskalkulator",
    brand.id
  );

  return (
    <section
      id="preise"
      aria-labelledby="pricing-experience-title"
      className={`${styles.root} ${compact ? styles.compact : ""}`}
    >
      <div className={styles.shell}>
        <header className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>
              INVESTITION MIT KLAREM RAHMEN
            </p>

            <h2 id="pricing-experience-title" className={styles.title}>
              {isAgi
                ? "Individuell entwickelt."
                : "Wirkung vor Aufwand."}

              <span>
                {isAgi
                  ? "Nachvollziehbar kalkuliert."
                  : "Klarheit vor Investition."}
              </span>
            </h2>
          </div>

          <p className={styles.lead}>
            {isAgi
              ? "Maßgeschneiderte Software braucht eine realistische Planung. Wählen Sie einen Projektbereich und entdecken Sie typische Investitionsrahmen."
              : "Wir bewerten zuerst den tatsächlichen Nutzen. Wählen Sie einen Projektbereich und entdecken Sie typische Investitionsrahmen – ohne starre Pakete."}
          </p>
        </header>

        <div className={styles.experience}>
          <div
            className={styles.selector}
            role="group"
            aria-label="Projektbereich auswählen"
          >
            {displayGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${styles.categoryButton} ${
                  activeId === group.id ? styles.categoryActive : ""
                }`}
                onClick={() => setChosen(group.id)}
                aria-pressed={activeId === group.id}
                aria-controls="pricing-category-detail"
              >
                <span>{group.nav}</span>
                <span
                  aria-hidden="true"
                  className={styles.categoryIndicator}
                />
              </button>
            ))}
          </div>

          <div
            id="pricing-category-detail"
            className={styles.stage}
            role="region"
            aria-label={`Preisorientierung: ${current.nav}`}
          >
            <div key={current.id} className={styles.stageInner}>
              <div className={styles.story}>
                <p className={styles.stageCaption}>
                  {current.caption}
                </p>

                <h3>{current.heading}</h3>
                <p>{current.summary}</p>

                <span className={styles.storyTag}>
                  INDIVIDUELLER PROJEKTUMFANG
                </span>
              </div>

              <div className={styles.offerGrid}>
                {current.offers.map((offer) => (
                  <div key={offer.name} className={styles.offer}>
                    <div>
                      <h4>{offer.name}</h4>
                      <p className={styles.offerDescription}>
                        {offer.description}
                      </p>
                    </div>

                    <div className={styles.offerCost}>
                      <p>INVESTITIONSRAHMEN</p>
                      <strong>{offer.price}</strong>

                      {offer.note && (
                        <span>{offer.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.actionBar}>
            <p>
              Keine Festpreis-Pakete. Die tatsächliche Kalkulation
              richtet sich nach Funktionen, Daten, Schnittstellen
              und Betrieb.
            </p>

            <div className={styles.actionLinks}>
              <Link href={calculatorHref} className={styles.secondary}>
                Preisrahmen prüfen
                <span aria-hidden="true">↗</span>
              </Link>

              <Link href={contactHref} className={styles.primary}>
                {isAgi
                  ? "Softwareprojekt besprechen"
                  : "KI-Projekt besprechen"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <p className={styles.disclaimer}>
          Unverbindliche Preisorientierung, kein Angebot.
          Steuern und gegebenenfalls anfallende Drittanbieter-Kosten
          werden im individuellen Angebot ausgewiesen.
        </p>
      </div>
    </section>
  );
}
