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
  Bullets,
  Meta,
} from "./legalKit";

/* ──────────────────────────────────────────────────────────────────────────
 * Cookie-Richtlinie — Transparenz zu Cookies & lokalen Speichertechnologien.
 *
 * Inhaltlich konsistent zur Datenschutzerklärung: technisch notwendige Cookies,
 * localStorage für Consent, First-Party-Reichweitenmessung (pseudonym, gehashte
 * IP), JWT-Sitzungen. Keine Google-Dienste, keine geräteübergreifenden
 * Werbeprofile. Marke & Anbieter:in werden über `entity`/`theme` injiziert.
 * ────────────────────────────────────────────────────────────────────────── */

export default function CookieRichtlinieView({
  theme,
  entity,
}: {
  theme: LegalTheme;
  entity: LegalEntity;
}) {
  const sections: LegalSection[] = [
    /* 1 — Was sind Cookies */
    {
      title: "1. Was sind Cookies & Speichertechnologien?",
      icon: <Svg d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Cookies sind kleine Textdateien, die beim Besuch einer Website auf Ihrem Endgerät
            gespeichert werden. Vergleichbare Technologien wie der lokale Browserspeicher
            (localStorage) erfüllen einen ähnlichen Zweck. Sie ermöglichen es unter anderem,
            technische Funktionen bereitzustellen, Ihre Einstellungen zu speichern und die Nutzung
            unserer Website statistisch — in pseudonymer Form — auszuwerten.
          </Para>
          <div className="mt-4">
            <Para>
              Diese Cookie-Richtlinie ergänzt unsere{" "}
              <Link href={entity.datenschutzHref} className="underline font-semibold" style={{ color: theme.accent }}>
                Datenschutzerklärung
              </Link>{" "}
              und erläutert, welche Speichertechnologien wir auf {entity.website} einsetzen.
            </Para>
          </div>
        </Card>
      ),
    },

    /* 2 — Rechtsgrundlagen */
    {
      title: "2. Rechtsgrundlagen",
      icon: <Svg d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
      content: (
        <Card>
          <Para>
            Der Einsatz von Cookies und vergleichbaren Technologien richtet sich nach § 25 des
            Telekommunikation-Digitale-Dienste-Datenschutz-Gesetzes (TDDDG) sowie der
            Datenschutz-Grundverordnung (DSGVO):
          </Para>
          <div className="mt-4">
            <Bullets items={[
              "Technisch notwendige Speicherung: § 25 Abs. 2 TDDDG — keine Einwilligung erforderlich.",
              "Nicht notwendige Speicherung (z. B. Analyse, Marketing): § 25 Abs. 1 TDDDG i. V. m. Art. 6 Abs. 1 lit. a DSGVO — nur mit Ihrer Einwilligung.",
              "Pseudonyme First-Party-Reichweitenmessung: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).",
            ]} />
          </div>
        </Card>
      ),
    },

    /* 3 — Einwilligung & Widerruf */
    {
      title: "3. Einwilligung & Widerruf",
      icon: <Svg d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Für nicht notwendige Technologien holen wir Ihre Einwilligung über unser eigenes
            Consent-Management ein. Ihre Auswahl wird lokal in Ihrem Browser (localStorage)
            gespeichert — festgehalten werden insbesondere die gewählten Kategorien sowie der
            Zeitpunkt der Einwilligung. Eine Übermittlung an Dritte findet dabei nicht statt.
          </Para>
          <div className="mt-3">
            <Para>
              Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft anpassen oder
              widerrufen — über die Cookie-Einstellungen auf unserer Website oder durch Löschen der
              gespeicherten Daten in Ihrem Browser.
            </Para>
          </div>
          <Meta rows={[
            ["Speicherort", "localStorage Ihres Browsers (keine Übermittlung an Dritte)"],
            ["Widerruf", "jederzeit über die Cookie-Einstellungen bzw. Browser-Löschung"],
          ]} />
        </Card>
      ),
    },

    /* 4 — Kategorien */
    {
      title: "4. Welche Kategorien wir verwenden",
      icon: <Svg d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Label>Essenziell — technisch notwendig (immer aktiv)</Label>
            <Para>
              Diese Technologien sind für den sicheren Betrieb der Website erforderlich und lassen
              sich nicht deaktivieren. Dazu zählen u. a. die Speicherung Ihrer
              Datenschutz-Einstellungen (localStorage), Sitzungs- und Authentifizierungs-Token (JWT)
              für geschützte Bereiche sowie Sicherheits- und Lastverteilungsfunktionen.
            </Para>
          </Card>
          <Card>
            <Label>Analyse — pseudonyme Reichweitenmessung</Label>
            <Para>
              Zur Verbesserung unseres Angebots betreiben wir eine eigene (First-Party-)
              Reichweitenmessung. Es werden <span className="text-white">keine</span> Dienste Dritter
              wie Google Analytics eingesetzt und keine geräteübergreifenden Werbeprofile gebildet;
              die IP-Adresse wird ausschließlich in gehashter (pseudonymer) Form verarbeitet.
            </Para>
          </Card>
          <Card>
            <Label>Marketing</Label>
            <Para>
              Derzeit setzen wir <span className="text-white">keine</span> Marketing- oder
              Tracking-Cookies von Drittanbietern ein. Sollten solche Technologien künftig zum
              Einsatz kommen, geschieht dies ausschließlich nach Ihrer vorherigen Einwilligung.
            </Para>
          </Card>
        </div>
      ),
    },

    /* 5 — Übersicht */
    {
      title: "5. Übersicht der eingesetzten Speichereinträge",
      icon: <Svg d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Die folgende Übersicht bildet die tatsächlich eingesetzten Speichertechnologien nach
              Kategorie ab. Konkrete Bezeichnungen und Laufzeiten können sich technisch bedingt
              geringfügig ändern.
            </Para>
          </Card>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: `rgba(${theme.accentRgb}, 0.05)`,
              border: `1px solid rgba(${theme.accentRgb}, 0.15)`,
              boxShadow: `0 4px 20px rgba(${theme.accentRgb}, 0.1)`,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px] text-[#E5E7EB]">
                <thead>
                  <tr
                    className="uppercase tracking-wider text-[11px]"
                    style={{ color: theme.accent, borderBottom: `1px solid rgba(${theme.accentRgb}, 0.25)` }}
                  >
                    <th className="p-3 font-semibold">Bezeichnung / Art</th>
                    <th className="p-3 font-semibold">Zweck</th>
                    <th className="p-3 font-semibold">Kategorie</th>
                    <th className="p-3 font-semibold">Speicherung / Dauer</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {[
                    ["Consent-Einstellungen (localStorage)", "Speicherung Ihrer Cookie-Auswahl und des Einwilligungszeitpunkts", "Essenziell", "localStorage — bis zur Löschung durch Sie"],
                    ["Sitzungs-/Authentifizierungs-Token (JWT)", "Anmeldung und Absicherung geschützter Bereiche", "Essenziell", "Cookie — Sitzung / begrenzte Laufzeit"],
                    ["Sicherheit & Lastverteilung", "Schutz der Infrastruktur, Auslieferung über das Edge-Netzwerk", "Essenziell", "Cookie/technisch — Sitzung"],
                    ["Pseudonyme Reichweiten-/Sitzungskennung", "Statistische Auswertung der Website-Nutzung (First-Party)", "Analyse", "Key-Value-Speicher — pseudonym, befristet"],
                  ].map((row) => (
                    <tr key={row[0]} style={{ borderBottom: `1px solid rgba(${theme.accentRgb}, 0.1)` }}>
                      <td className="p-3 font-medium text-[#FFFFFF]">{row[0]}</td>
                      <td className="p-3">{row[1]}</td>
                      <td className="p-3">{row[2]}</td>
                      <td className="p-3">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },

    /* 6 — Verwaltung im Browser */
    {
      title: "6. Cookies im Browser verwalten",
      icon: <Svg d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z|M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
      content: (
        <Card>
          <Para>
            Sie können Cookies in Ihrem Browser jederzeit einsehen, einschränken oder löschen. Die
            entsprechenden Einstellungen finden Sie in der Regel im Menübereich
            &bdquo;Einstellungen&ldquo;, &bdquo;Datenschutz&ldquo; oder &bdquo;Sicherheit&ldquo;
            Ihres Browsers:
          </Para>
          <div className="mt-3">
            <Bullets items={[
              "Google Chrome — Einstellungen › Datenschutz und Sicherheit › Cookies",
              "Mozilla Firefox — Einstellungen › Datenschutz & Sicherheit",
              "Safari — Einstellungen › Datenschutz",
              "Microsoft Edge — Einstellungen › Cookies und Websiteberechtigungen",
            ]} />
          </div>
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Hinweis: Werden technisch notwendige Speichereinträge blockiert, können einzelne
            Funktionen der Website eingeschränkt sein.
          </p>
        </Card>
      ),
    },

    /* 7 — Drittanbieter / Auftragsverarbeiter */
    {
      title: "7. Eingebundene Dienste",
      icon: <Svg d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      content: (
        <Card>
          <Para>
            Die technische Bereitstellung und die pseudonyme Reichweitenmessung erfolgen über
            sorgfältig ausgewählte Auftragsverarbeiter (u. a. Hosting/Edge-Netzwerk sowie ein
            Key-Value-Speicher). Es werden <span className="text-white">keine</span> Werbe- oder
            Tracking-Netzwerke Dritter eingebunden.
          </Para>
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Die vollständige Liste der eingesetzten Dienstleister, Rechtsgrundlagen und
            Drittlandgarantien finden Sie in unserer{" "}
            <Link href={entity.datenschutzHref} className="underline font-semibold" style={{ color: theme.accent }}>
              Datenschutzerklärung
            </Link>
            .
          </p>
        </Card>
      ),
    },

    /* 8 — Änderungen & Kontakt */
    {
      title: "8. Änderungen & Kontakt",
      icon: <Svg d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
      content: (
        <Card>
          <Para>
            Wir passen diese Cookie-Richtlinie an, sobald technische oder rechtliche Änderungen dies
            erforderlich machen. Es gilt jeweils die aktuelle, auf unserer Website veröffentlichte
            Fassung.
          </Para>
          <div className="mt-3">
            <Para>
              Bei Fragen zur Verwendung von Cookies erreichen Sie uns unter{" "}
              <a href={`mailto:${entity.primaryEmail}`} className="font-semibold underline" style={{ color: theme.accent }}>
                {entity.primaryEmail}
              </a>
              . Weitere rechtliche Angaben finden Sie im{" "}
              <Link href={entity.impressumHref} className="underline font-semibold" style={{ color: theme.accent }}>
                Impressum
              </Link>
              .
            </Para>
          </div>
        </Card>
      ),
    },
  ];

  const now = new Date();
  const dateLabel = `Stand: ${now.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`;

  return (
    <LegalShell
      theme={theme}
      title="Cookie-Richtlinie"
      introLabel="Transparenz zu Cookies & Speichertechnologien"
      dateLabel={dateLabel}
      dateAtBottom
      sections={sections}
      homeHref={entity.homeHref}
    />
  );
}
