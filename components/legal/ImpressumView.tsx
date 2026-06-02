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

export default function ImpressumView({ theme, entity }: { theme: LegalTheme; entity: LegalEntity }) {
  const sections: LegalSection[] = [
    /* Angaben gemäß § 5 DDG */
    {
      title: "Angaben gemäß § 5 DDG",
      icon: <Svg d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Label>Unternehmen</Label>
            <p className="text-xl font-bold text-[#FFFFFF]">{entity.brandName}</p>
          </Card>
          <Card>
            <Label>{entity.ownerLabel}</Label>
            <p className="text-lg font-semibold text-[#FFFFFF]">{entity.ownerName}</p>
          </Card>
          <Card>
            <Label>Anschrift</Label>
            <p className="text-[#E5E7EB] leading-relaxed">
              {entity.street}
              <br />
              {entity.zipCity}
              <br />
              {entity.country}
            </p>
          </Card>
        </div>
      ),
    },

    /* Kontakt */
    {
      title: "Kontakt",
      icon: <Svg d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      content: (
        <div className="space-y-4">
          {entity.phone && (
            <Card>
              <Label>Telefon</Label>
              <a href={entity.phoneHref} className="text-lg font-semibold transition-opacity hover:opacity-80" style={{ color: theme.accent }}>
                {entity.phone}
              </a>
            </Card>
          )}
          <Card>
            <Label>E-Mail</Label>
            <div className="space-y-2.5">
              {entity.emails.map((mail) => (
                <a
                  key={mail}
                  href={`mailto:${mail}`}
                  className="block font-medium transition-all duration-300 hover:translate-x-1 transform"
                  style={{ color: theme.accent }}
                >
                  {mail}
                </a>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Website</Label>
            <p className="text-lg font-semibold text-[#FFFFFF]">{entity.website}</p>
          </Card>
        </div>
      ),
    },

    /* Umsatzsteuer */
    {
      title: "Umsatzsteuer",
      icon: <Svg d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>Gemäß § 19 UStG wird keine Umsatzsteuer erhoben (Kleinunternehmerregelung).</Para>
        </Card>
      ),
    },

    /* Verantwortlich für den Inhalt */
    {
      title: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
      icon: <Svg d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      content: (
        <Card>
          <p className="text-[#E5E7EB] leading-relaxed text-[15px] md:text-base">
            {entity.ownerName}
            <br />
            {entity.street}
            <br />
            {entity.zipCity}
            <br />
            {entity.country}
          </p>
        </Card>
      ),
    },

    /* EU-Streitschlichtung */
    {
      title: "EU-Streitschlichtung",
      icon: <Svg d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      content: (
        <Card>
          <Para>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          </Para>
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 transition-all duration-300 font-semibold"
            style={{ color: theme.accent }}
          >
            https://ec.europa.eu/consumers/odr
          </a>
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>
        </Card>
      ),
    },

    /* Verbraucherstreitbeilegung */
    {
      title: "Verbraucherstreitbeilegung / Universalschlichtungsstelle",
      icon: <Svg d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      content: (
        <Card>
          <Para>
            Wir sind nicht bereit oder verpflichtet, an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </Para>
        </Card>
      ),
    },

    /* Haftung für Inhalte */
    {
      title: "Haftung für Inhalte",
      icon: <Svg d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <div className="space-y-4">
          <Para>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich.
          </Para>
          <Para>
            Nach §§ 8 bis 10 DDG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte
            fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </Para>
          <Para>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
            allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
            erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte umgehend
            entfernen.
          </Para>
        </div>
      ),
    },

    /* Haftung für Links */
    {
      title: "Haftung für Links",
      icon: <Svg d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
      content: (
        <div className="space-y-4">
          <Para>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
            Seiten verantwortlich.
          </Para>
          <Para>
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
            überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Bei
            Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </Para>
        </div>
      ),
    },

    /* Urheberrecht */
    {
      title: "Urheberrecht",
      icon: <Svg d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <div className="space-y-4">
          <Para>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
            Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung
            des jeweiligen Autors bzw. Erstellers.
          </Para>
          <Para>
            Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch
            gestattet. Soweit Inhalte nicht vom Betreiber erstellt wurden, werden die Urheberrechte
            Dritter beachtet. Bei Bekanntwerden von Urheberrechtsverletzungen werden derartige Inhalte
            umgehend entfernt.
          </Para>
        </div>
      ),
    },

    /* Datenschutz – Kurzfassung */
    {
      title: "Datenschutz",
      icon: <Svg d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
      content: (
        <Card>
          <Para>
            Informationen zum Umgang mit personenbezogenen Daten finden Sie in unserer{" "}
            <Link href={entity.datenschutzHref} className="underline font-semibold" style={{ color: theme.accent }}>
              Datenschutzerklärung
            </Link>
            .
          </Para>
        </Card>
      ),
    },
  ];

  return (
    <LegalShell
      theme={theme}
      title="Impressum"
      dateLabel="Stand: Juni 2026"
      sections={sections}
      homeHref={entity.homeHref}
    />
  );
}
