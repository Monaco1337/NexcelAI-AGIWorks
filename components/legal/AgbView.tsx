"use client";

/**
 * Allgemeine Geschäftsbedingungen (AGB) — brand-aware (NEXCEL AI / AGI Works).
 * Nutzt die gemeinsame LegalShell. Inhalte sind ein professioneller B2B-Standard
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

export default function AgbView({
  theme,
  entity,
}: {
  theme: LegalTheme;
  entity: LegalEntity;
}) {
  const sections: LegalSection[] = [
    {
      title: "1. Geltungsbereich",
      icon: <Svg d="M4 6h16M4 12h16M4 18h10" />,
      content: (
        <div className="space-y-4">
          <Para>
            Diese Allgemeinen Geschäftsbedingungen (nachfolgend {"\u201eAGB\u201c"})
            gelten für alle Verträge über die Entwicklung, Bereitstellung und
            Betreuung digitaler Systeme zwischen {entity.ownerWithBrand},{" "}
            {entity.street}, {entity.zipCity}, {entity.country} (nachfolgend{" "}
            {"\u201e"}
            {entity.brandName}
            {"\u201c"}) und dem Auftraggeber (nachfolgend {"\u201eKunde\u201c"}).
          </Para>
          <Para>
            Die AGB gelten ausschließlich gegenüber Unternehmern im Sinne von § 14
            BGB. Abweichende oder entgegenstehende Bedingungen des Kunden werden
            nicht anerkannt, es sei denn, {entity.brandName} stimmt ihrer Geltung
            ausdrücklich schriftlich zu.
          </Para>
        </div>
      ),
    },
    {
      title: "2. Vertragsgegenstand & Leistungen",
      icon: <Svg d="M12 4l8 4-8 4-8-4 8-4z|M4 8v8l8 4 8-4V8" />,
      content: (
        <div className="space-y-4">
          <Para>
            Gegenstand des Vertrages ist die im jeweiligen Angebot bzw. der
            Leistungsbeschreibung konkret bezeichnete Leistung. Dies kann
            insbesondere umfassen:
          </Para>
          <Bullets
            items={[
              "Konzeption, Design und Entwicklung individueller Web- und Unternehmenssysteme",
              "Buchungs-, CRM-, Lead-Funnel-, Mitglieder- und ERP-ähnliche Systeme",
              "Schnittstellen, Integrationen und Automatisierungen",
              "Wartung, Weiterentwicklung und laufende Betreuung",
            ]}
          />
          <Para>
            Maßgeblich für Umfang und Inhalt der Leistung ist die individuelle
            Vereinbarung. Leistungsbeschreibungen stellen keine Beschaffenheits-
            oder Haltbarkeitsgarantien dar.
          </Para>
        </div>
      ),
    },
    {
      title: "3. Angebot & Vertragsschluss",
      icon: <Svg d="M9 12l2 2 4-4|M5 4h14v16H5z" />,
      content: (
        <Para>
          Angebote von {entity.brandName} sind freibleibend, sofern sie nicht
          ausdrücklich als verbindlich gekennzeichnet sind. Ein Vertrag kommt durch
          die schriftliche Auftragsbestätigung von {entity.brandName} oder durch
          Aufnahme der Leistungserbringung zustande. Nebenabreden bedürfen der
          Textform.
        </Para>
      ),
    },
    {
      title: "4. Mitwirkungspflichten des Kunden",
      icon: <Svg d="M16 11a4 4 0 10-8 0|M4 20a8 8 0 0116 0" />,
      content: (
        <div className="space-y-4">
          <Para>
            Der Kunde stellt alle für die Leistungserbringung erforderlichen
            Informationen, Inhalte, Zugänge und Materialien rechtzeitig und
            vollständig bereit.
          </Para>
          <Bullets
            items={[
              "Bereitstellung von Texten, Bildern, Logos und Zugangsdaten",
              "Benennung eines verantwortlichen Ansprechpartners",
              "Zeitnahe Prüfung und Freigabe von Zwischenergebnissen",
            ]}
          />
          <Para>
            Verzögerungen aufgrund verspäteter Mitwirkung gehen nicht zu Lasten von{" "}
            {entity.brandName}.
          </Para>
        </div>
      ),
    },
    {
      title: "5. Preise & Zahlungsbedingungen",
      icon: <Svg d="M12 1v22|M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
      content: (
        <div className="space-y-4">
          <Para>
            Es gelten die im Angebot genannten Preise zzgl. der jeweils
            gesetzlichen Umsatzsteuer. Angegebene Preiskorridore sind unverbindliche
            Orientierungswerte; die finale Kalkulation erfolgt individuell.
          </Para>
          <Bullets
            items={[
              "Rechnungen sind innerhalb von 14 Tagen ohne Abzug zahlbar",
              "Bei größeren Projekten sind Teil- bzw. Abschlagszahlungen üblich",
              "Wiederkehrende Leistungen werden periodisch abgerechnet",
            ]}
          />
        </div>
      ),
    },
    {
      title: "6. Leistungsfristen",
      icon: <Svg d="M12 7v5l3 2|M12 3a9 9 0 100 18 9 9 0 000-18z" />,
      content: (
        <Para>
          Termine und Fristen sind nur verbindlich, wenn sie ausdrücklich als
          verbindlich vereinbart wurden. Übliche Projektlaufzeiten betragen je nach
          Umfang 3–12 Wochen. Höhere Gewalt und vom Kunden zu vertretende
          Verzögerungen verlängern Fristen entsprechend.
        </Para>
      ),
    },
    {
      title: "7. Nutzungsrechte",
      icon: <Svg d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />,
      content: (
        <Para>
          Mit vollständiger Bezahlung der vereinbarten Vergütung erhält der Kunde
          die für den vereinbarten Zweck erforderlichen, einfachen Nutzungsrechte an
          den erstellten Arbeitsergebnissen. An eingesetzten Frameworks, Bibliotheken
          und wiederverwendbaren Modulen verbleiben die Rechte bei {entity.brandName}
          bzw. den jeweiligen Rechteinhabern.
        </Para>
      ),
    },
    {
      title: "8. Gewährleistung & Haftung",
      icon: <Svg d="M12 9v4|M12 17h.01|M10.3 3.9L2 18a2 2 0 002 3h16a2 2 0 002-3L13.7 3.9a2 2 0 00-3.4 0z" />,
      content: (
        <div className="space-y-4">
          <Para>
            {entity.brandName} haftet unbeschränkt bei Vorsatz und grober
            Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.
            Bei einfacher Fahrlässigkeit haftet {entity.brandName} nur bei
            Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), begrenzt
            auf den vertragstypischen, vorhersehbaren Schaden.
          </Para>
          <Para>
            Eine weitergehende Haftung ist ausgeschlossen. Die Vorschriften des
            Produkthaftungsgesetzes bleiben unberührt.
          </Para>
        </div>
      ),
    },
    {
      title: "9. Vertraulichkeit & Datenschutz",
      icon: <Svg d="M6 10V7a6 6 0 1112 0v3|M5 10h14v10H5z" />,
      content: (
        <Para>
          Beide Parteien behandeln vertrauliche Informationen der jeweils anderen
          Partei streng vertraulich. Soweit {entity.brandName} personenbezogene
          Daten im Auftrag des Kunden verarbeitet, wird hierzu ein Vertrag zur
          Auftragsverarbeitung gemäß Art. 28 DSGVO geschlossen. Einzelheiten zur
          Datenverarbeitung ergeben sich aus der Datenschutzerklärung.
        </Para>
      ),
    },
    {
      title: "10. Schlussbestimmungen",
      icon: <Svg d="M4 6h16M4 12h16M4 18h16" />,
      content: (
        <div className="space-y-4">
          <Para>
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
            UN-Kaufrechts. Gerichtsstand ist — soweit zulässig — der Sitz von{" "}
            {entity.brandName}. Sollten einzelne Bestimmungen unwirksam sein, bleibt
            die Wirksamkeit der übrigen Bestimmungen unberührt.
          </Para>
          <Card strong>
            <Label>Anbieter</Label>
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
      title="AGB"
      dateLabel="Allgemeine Geschäftsbedingungen · Stand: Juni 2026"
      sections={sections}
      homeHref={entity.homeHref}
    />
  );
}
