"use client";

/**
 * Vertrag zur Auftragsverarbeitung (AVV) gem. Art. 28 DSGVO — brand-aware.
 * Nutzt die gemeinsame LegalShell. Inhalte sind ein professioneller Standard
 * und sollten vor produktivem Einsatz anwaltlich final geprüft werden.
 */

import {
  LegalShell,
  Para,
  Bullets,
  Label,
  Card,
  Svg,
  type LegalTheme,
  type LegalEntity,
  type LegalSection,
} from "@/components/legal/legalKit";

export default function VertragsverarbeitungView({
  theme,
  entity,
}: {
  theme: LegalTheme;
  entity: LegalEntity;
}) {
  const sections: LegalSection[] = [
    {
      title: "1. Gegenstand & Dauer",
      icon: <Svg d="M4 6h16M4 12h16M4 18h10" />,
      content: (
        <Para>
          Dieser Vertrag konkretisiert die Pflichten der Parteien zum Datenschutz,
          die sich aus der zwischen dem Kunden (Verantwortlicher) und{" "}
          {entity.ownerWithBrand} (Auftragsverarbeiter) bestehenden
          Hauptvereinbarung ergeben. Er gilt für die Dauer der jeweiligen
          Leistungserbringung und im Umfang der dort beschriebenen Verarbeitung
          personenbezogener Daten gemäß Art. 28 DSGVO.
        </Para>
      ),
    },
    {
      title: "2. Art & Zweck der Verarbeitung",
      icon: <Svg d="M12 4l8 4-8 4-8-4 8-4z|M4 8v8l8 4 8-4V8" />,
      content: (
        <div className="space-y-4">
          <Para>
            Der Auftragsverarbeiter verarbeitet personenbezogene Daten ausschließlich
            zur Erbringung der vereinbarten Leistungen, insbesondere im Rahmen von:
          </Para>
          <Bullets
            items={[
              "Entwicklung, Hosting und Betrieb der vereinbarten Systeme",
              "Verarbeitung von Formular-, Kontakt- und Buchungsdaten",
              "Bereitstellung von CRM-, Lead- und Kommunikationsfunktionen",
              "Wartung, Support und Fehlerbehebung",
            ]}
          />
        </div>
      ),
    },
    {
      title: "3. Kategorien betroffener Personen & Daten",
      icon: <Svg d="M16 11a4 4 0 10-8 0|M4 20a8 8 0 0116 0" />,
      content: (
        <div className="space-y-4">
          <Label>Betroffene Personen</Label>
          <Bullets items={["Kunden & Interessenten des Verantwortlichen", "Nutzer der Systeme", "Beschäftigte des Verantwortlichen (soweit relevant)"]} />
          <Label>Datenkategorien</Label>
          <Bullets items={["Stamm- & Kontaktdaten", "Vertrags- & Buchungsdaten", "Nutzungs- & Kommunikationsdaten", "technische Verbindungsdaten"]} />
        </div>
      ),
    },
    {
      title: "4. Pflichten des Auftragsverarbeiters",
      icon: <Svg d="M9 12l2 2 4-4|M5 4h14v16H5z" />,
      content: (
        <Bullets
          items={[
            "Verarbeitung ausschließlich auf dokumentierte Weisung des Verantwortlichen",
            "Verpflichtung der Mitarbeitenden auf Vertraulichkeit",
            "Umsetzung geeigneter technischer und organisatorischer Maßnahmen (Art. 32 DSGVO)",
            "Unterstützung des Verantwortlichen bei Betroffenenrechten und Meldepflichten",
            "Löschung oder Rückgabe der Daten nach Auftragsende",
          ]}
        />
      ),
    },
    {
      title: "5. Technische & organisatorische Maßnahmen (TOM)",
      icon: <Svg d="M6 10V7a6 6 0 1112 0v3|M5 10h14v10H5z" />,
      content: (
        <Bullets
          items={[
            "Verschlüsselte Datenübertragung (TLS) und Zugriffsbeschränkungen",
            "Rollen- und Berechtigungskonzepte, Zwei-Faktor-Authentifizierung",
            "Pseudonymisierung und Datenminimierung, soweit möglich",
            "Backups, Protokollierung und regelmäßige Überprüfung der Maßnahmen",
            "Hosting in Rechenzentren mit anerkannten Sicherheitsstandards",
          ]}
        />
      ),
    },
    {
      title: "6. Unterauftragsverhältnisse",
      icon: <Svg d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />,
      content: (
        <Para>
          Der Verantwortliche stimmt dem Einsatz von Unterauftragsverarbeitern
          (z. B. Hosting-, E-Mail- und KI-Dienste) zu. Der Auftragsverarbeiter stellt
          sicher, dass mit diesen Dienstleistern entsprechende Verträge nach Art. 28
          DSGVO bestehen. Eine aktuelle Übersicht der eingesetzten Dienste ergibt
          sich aus der Datenschutzerklärung.
        </Para>
      ),
    },
    {
      title: "7. Kontroll- & Mitteilungsrechte",
      icon: <Svg d="M12 7v5l3 2|M12 3a9 9 0 100 18 9 9 0 000-18z" />,
      content: (
        <Para>
          Der Auftragsverarbeiter weist die Einhaltung der Pflichten auf Anforderung
          nach und ermöglicht angemessene Überprüfungen. Verletzungen des Schutzes
          personenbezogener Daten meldet der Auftragsverarbeiter unverzüglich und
          unterstützt bei der Erfüllung gesetzlicher Meldepflichten.
        </Para>
      ),
    },
    {
      title: "8. Löschung & Rückgabe / Kontakt",
      icon: <Svg d="M4 6h16M4 12h16M4 18h16" />,
      content: (
        <div className="space-y-4">
          <Para>
            Nach Abschluss der Leistungen werden personenbezogene Daten nach Wahl des
            Verantwortlichen gelöscht oder zurückgegeben, sofern keine gesetzliche
            Aufbewahrungspflicht entgegensteht.
          </Para>
          <Card strong>
            <Label>Auftragsverarbeiter</Label>
            <Para>
              {entity.ownerWithBrand}
              <br />
              {entity.street}, {entity.zipCity}, {entity.country}
              <br />
              {entity.primaryEmail}
              {entity.phone ? (
                <>
                  <br />
                  {entity.phone}
                </>
              ) : null}
            </Para>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <LegalShell
      theme={theme}
      title="Vertragsverarbeitung"
      dateLabel="Auftragsverarbeitung gem. Art. 28 DSGVO · Stand: Juni 2026"
      sections={sections}
      homeHref={entity.homeHref}
    />
  );
}
