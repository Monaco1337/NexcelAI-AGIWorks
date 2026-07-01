"use client";

import Link from "next/link";
import {
  type LegalTheme,
  type LegalEntity,
  type LegalSection,
  LegalShell,
  Svg,
  Card,
  Para,
  Label,
} from "./legalKit";

/* ──────────────────────────────────────────────────────────────────────────
 * Impressum — Anbieterkennzeichnung gemäß § 5 DDG.
 *
 * AGI Works (Kevin Blazevic) und NEXCEL AI (Celina Siebeneicher) sind
 * getrennte Einzelunternehmen. Alle anbieterspezifischen Angaben (Name,
 * Anschrift, Kontakt, Domain, geschlechtsspezifische Formulierungen und
 * Leistungsbereich) werden über `entity` injiziert — keine Vermischung.
 *
 * Enthält bewusst KEINEN Link zur EU-OS-Plattform (seit 20.07.2025 abgeschaltet).
 * Verbraucherstreitbeilegung wird neutral nach VSBG aufgenommen.
 * ────────────────────────────────────────────────────────────────────────── */

export default function ImpressumView({ theme, entity }: { theme: LegalTheme; entity: LegalEntity }) {
  const AddressBlock = () => (
    <p className="text-[#E5E7EB] leading-relaxed text-[15px] md:text-base">
      {entity.ownerName}
      <br />
      {entity.street}
      <br />
      {entity.zipCity}
      <br />
      {entity.country}
    </p>
  );

  const sections: LegalSection[] = [
    /* 1 — Angaben gemäß § 5 Digitale-Dienste-Gesetz */
    {
      title: "Angaben gemäß § 5 Digitale-Dienste-Gesetz",
      icon: <Svg d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Label>Geschäftsbezeichnung</Label>
            <p className="text-xl font-bold text-[#FFFFFF]">{entity.brandName}</p>
            <p className="mt-1 text-sm text-[#9CA3AF]">ein Angebot von</p>
            <p className="mt-2 text-lg font-semibold text-[#FFFFFF]">{entity.ownerName}</p>
            <p className="mt-3 text-[#E5E7EB] leading-relaxed text-[15px]">
              {entity.street}
              <br />
              {entity.zipCity}
              <br />
              {entity.country}
            </p>
          </Card>
          <Card>
            <Label>Kontakt</Label>
            <div className="space-y-2.5 text-[15px]">
              {entity.phone && (
                <p className="text-[#E5E7EB]">
                  <strong className="text-[#FFFFFF]">Telefon:</strong>{" "}
                  <a href={entity.phoneHref} className="font-medium transition-opacity hover:opacity-80" style={{ color: theme.accent }}>
                    {entity.phone}
                  </a>
                </p>
              )}
              <p className="text-[#E5E7EB]">
                <strong className="text-[#FFFFFF]">E-Mail:</strong>{" "}
                <a href={`mailto:${entity.primaryEmail}`} className="font-medium transition-opacity hover:opacity-80" style={{ color: theme.accent }}>
                  {entity.primaryEmail}
                </a>
              </p>
              <p className="text-[#E5E7EB]">
                <strong className="text-[#FFFFFF]">Website:</strong> {entity.website}
              </p>
            </div>
          </Card>
        </div>
      ),
    },

    /* 2 — Anbieter/Anbieterin dieses Internetangebots */
    {
      title: entity.providerSectionTitle,
      icon: <Svg d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v.01M9 12v.01M9 15v.01" />,
      content: (
        <Card>
          <Para>{entity.providerIntro}</Para>
          <div className="mt-3">
            <AddressBlock />
          </div>
        </Card>
      ),
    },

    /* 3 — Inhaltlich Verantwortliche:r gemäß § 18 Abs. 2 MStV */
    {
      title: entity.responsibleSectionTitle,
      icon: <Svg d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      content: (
        <Card>
          <Para>
            Verantwortlich für journalistisch-redaktionelle Inhalte, soweit solche Inhalte auf
            dieser Website bereitgestellt werden:
          </Para>
          <div className="mt-3">
            <AddressBlock />
          </div>
        </Card>
      ),
    },

    /* 4 — Leistungsbereich */
    {
      title: "Leistungsbereich",
      icon: <Svg d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
      content: (
        <div className="space-y-4">
          <Para>{entity.serviceScope}</Para>
          <Para>
            Die Inhalte dieser Website dienen der ersten Information und Kontaktaufnahme. Eine
            individuelle Beratung, Konzeption, Umsetzung oder Angebotserstellung erfolgt erst auf
            Grundlage der im Einzelfall bereitgestellten Informationen und einer gesonderten
            Abstimmung.
          </Para>
        </div>
      ),
    },

    /* 5 — Umsatzsteuer */
    {
      title: "Umsatzsteuer",
      icon: <Svg d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Label>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz</Label>
            <p className="text-lg font-semibold text-[#FFFFFF]">
              {entity.ustId ? entity.ustId : "nicht angegeben"}
            </p>
          </Card>
          <Para>
            Eine Steuernummer wird aus Datenschutz- und Sicherheitsgründen nicht im Impressum
            veröffentlicht.
          </Para>
        </div>
      ),
    },

    /* 6 — Verbraucherstreitbeilegung (ohne EU-OS-Link) */
    {
      title: "Verbraucherstreitbeilegung",
      icon: <Svg d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      content: (
        <Card>
          <Para>
            Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </Para>
        </Card>
      ),
    },

    /* 7 — Haftung für Inhalte */
    {
      title: "Haftung für Inhalte",
      icon: <Svg d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <div className="space-y-4">
          <Para>
            Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt. Dennoch
            übernehmen wir keine Gewähr für die Aktualität, Vollständigkeit, Richtigkeit oder
            Verfügbarkeit der bereitgestellten Informationen.
          </Para>
          <Para>
            Als {entity.serviceProviderTerm} ist {entity.ownerName} für eigene Inhalte auf dieser
            Website nach den allgemeinen gesetzlichen Vorschriften verantwortlich.
          </Para>
          <Para>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
            allgemeinen Gesetzen bleiben hiervon unberührt. Bei Bekanntwerden konkreter
            Rechtsverletzungen werden betroffene Inhalte unverzüglich geprüft und erforderlichenfalls
            entfernt.
          </Para>
        </div>
      ),
    },

    /* 8 — Haftung für externe Links */
    {
      title: "Haftung für externe Links",
      icon: <Svg d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
      content: (
        <div className="space-y-4">
          <Para>
            Diese Website kann Links zu externen Websites Dritter enthalten. Auf deren Inhalte haben
            wir keinen Einfluss.
          </Para>
          <Para>
            Für die Inhalte verlinkter Seiten ist stets der jeweilige Anbieter oder Betreiber
            verantwortlich.
          </Para>
          <Para>
            Zum Zeitpunkt der Verlinkung wurden externe Inhalte auf erkennbare Rechtsverstöße
            geprüft. Rechtswidrige Inhalte waren zu diesem Zeitpunkt nicht erkennbar.
          </Para>
          <Para>
            Eine permanente Kontrolle verlinkter Seiten ist ohne konkrete Hinweise auf
            Rechtsverletzungen nicht zumutbar. Bei Bekanntwerden entsprechender Rechtsverletzungen
            werden betroffene Links unverzüglich entfernt.
          </Para>
        </div>
      ),
    },

    /* 9 — Urheberrecht und Schutzrechte */
    {
      title: "Urheberrecht und Schutzrechte",
      icon: <Svg d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <div className="space-y-4">
          <Para>
            Die auf dieser Website veröffentlichten Inhalte, Texte, Strukturen, Designs, Grafiken,
            Markenbestandteile, Bildwelten, Dokumente, Softwarebestandteile und sonstigen Werke
            unterliegen dem deutschen Urheberrecht und sonstigen Schutzrechten.
          </Para>
          <Para>
            Jede Nutzung, Vervielfältigung, Bearbeitung, öffentliche Wiedergabe, Verbreitung oder
            sonstige Verwertung außerhalb der gesetzlichen Grenzen bedarf der vorherigen
            schriftlichen Zustimmung des jeweiligen Rechteinhabers.
          </Para>
          <Para>
            Soweit Inhalte auf dieser Website nicht {entity.creatorTerm} erstellt wurden, werden
            Rechte Dritter beachtet und entsprechende Inhalte gekennzeichnet.
          </Para>
          <Para>
            Sollten Sie auf eine mögliche Rechtsverletzung aufmerksam werden, bitten wir um einen
            entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden betroffene
            Inhalte unverzüglich geprüft und erforderlichenfalls entfernt.
          </Para>
        </div>
      ),
    },

    /* 10 — Datenschutz */
    {
      title: "Datenschutz",
      icon: <Svg d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
      content: (
        <Card>
          <Para>
            Informationen zur Verarbeitung personenbezogener Daten finden Sie in der{" "}
            <Link href={entity.datenschutzHref} className="underline font-semibold" style={{ color: theme.accent }}>
              Datenschutzerklärung
            </Link>
            .
          </Para>
        </Card>
      ),
    },

    /* 11 — Kontakt bei rechtlichen Hinweisen */
    {
      title: "Kontakt bei rechtlichen Hinweisen",
      icon: <Svg d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      content: (
        <Card>
          <Para>Bei rechtlichen Hinweisen zu dieser Website wenden Sie sich bitte an:</Para>
          <p className="mt-3 text-[15px] text-[#E5E7EB]">
            <strong className="text-[#FFFFFF]">E-Mail:</strong>{" "}
            <a href={`mailto:${entity.primaryEmail}`} className="font-medium transition-opacity hover:opacity-80" style={{ color: theme.accent }}>
              {entity.primaryEmail}
            </a>
          </p>
        </Card>
      ),
    },
  ];

  const now = new Date();
  const dateLabel = `Stand: ${now.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`;

  return (
    <LegalShell
      theme={theme}
      title="Impressum"
      introLabel="Rechtliche Anbieterkennzeichnung"
      dateLabel={dateLabel}
      dateAtBottom
      sections={sections}
      homeHref={entity.homeHref}
    />
  );
}
