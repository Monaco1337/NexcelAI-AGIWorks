/**
 * Press & partner page — the canonical off-site reference target.
 *
 * Purpose: directories, journalists and partners need one page they can cite
 * that carries the exact company facts, the approved boilerplate texts and the
 * logo. Having it on-site means every citation describes the brand in the same
 * words, which is what makes entity signals consistent.
 *
 * Address policy: the postal address stays in the Impressum only. This page
 * names the city and region (a service-area statement) and links to the
 * Impressum for the registered address.
 *
 * Server component: no client JS.
 */

import Link from "next/link";
import type { BrandKey } from "@/config/seo/domains";
import { getBrandConfig } from "@/config/seo/brands";
import { getBusinessLocation } from "@/config/businessLocations";
import { getLiveProfiles } from "@/config/seo/profiles";
import { internalLinks } from "@/lib/seo/internalLinks";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { organizationSchema, personSchema } from "@/lib/seo/jsonld";

/** Approved boilerplate in three lengths — directories have different limits. */
const BOILERPLATE: Record<BrandKey, { short: string; medium: string; long: string }> = {
  nexcel: {
    short:
      "NEXCEL AI entwickelt digitale Unternehmenssysteme für Vertrieb, Kundenbetreuung und interne Abläufe.",
    medium:
      "NEXCEL AI aus Unna entwickelt digitale Unternehmenssysteme für mittelständische Betriebe: CRM, Kundenportale, Automatisierung und KI-gestützte Prozesse. Jedes System wird individuell geplant statt aus einem Baukasten zusammengesetzt.",
    long:
      "NEXCEL AI ist ein Einzelunternehmen aus Unna in Nordrhein-Westfalen und entwickelt digitale Unternehmenssysteme für den Mittelstand. Der Schwerpunkt liegt auf Systemen, die Vertrieb, Kundenbetreuung und interne Abläufe in einer Oberfläche zusammenführen — von CRM und Kundenportalen über Automatisierung bis zu KI-gestützten Auswertungen. Jedes Projekt beginnt mit einer Analyse der bestehenden Abläufe; entwickelt wird individuell, nicht aus einem Baukasten. Auftraggeber werden von der Analyse bis zum Livebetrieb direkt von der Inhaberin begleitet. NEXCEL AI arbeitet remote sowie vor Ort nach Vereinbarung, regional in Nordrhein-Westfalen und deutschlandweit.",
  },
  agiworks: {
    short:
      "AGI Works entwickelt individuelle Software, Web-Anwendungen und Plattformen für Unternehmen.",
    medium:
      "AGI Works aus Unna entwickelt individuelle Software für Unternehmen: Web-Anwendungen, Backend-Systeme, Plattformen und Schnittstellen. Auftraggeber erhalten Quellcode und Dokumentation und bleiben damit unabhängig vom Dienstleister.",
    long:
      "AGI Works ist ein Einzelunternehmen aus Unna in Nordrhein-Westfalen und entwickelt individuelle Software für Unternehmen. Der Schwerpunkt liegt auf Web-Anwendungen, Backend-Systemen, Plattformen und der Integration bestehender Systeme über Schnittstellen. Statt fertiger Produkte entsteht Software entlang der tatsächlichen Abläufe des Auftraggebers. Quellcode und technische Dokumentation werden übergeben, sodass der Betrieb auch ohne AGI Works fortgeführt werden kann. Auftraggeber arbeiten direkt mit dem Inhaber zusammen, ohne Projektmanagement-Schleife. AGI Works arbeitet remote sowie vor Ort nach Vereinbarung, regional in Nordrhein-Westfalen und deutschlandweit.",
  },
};

/** The partner brand, linked as a real external reference. */
const PARTNER: Record<BrandKey, { name: string; url: string; line: string }> = {
  nexcel: {
    name: "AGI Works",
    url: "https://www.agiworks.de/",
    line: "Übernimmt Softwareentwicklung und technische Umsetzung in gemeinsamen Projekten.",
  },
  agiworks: {
    name: "NEXCEL AI",
    url: "https://www.nexcelai.de/",
    line: "Übernimmt System- und Prozessdesign sowie Kundenerlebnis in gemeinsamen Projekten.",
  },
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="border-b py-3.5"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <dt className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">{label}</dt>
      <dd className="mt-1.5 text-[14px] leading-relaxed text-white/80">{children}</dd>
    </div>
  );
}

export default function PressPageTemplate({ brand }: { brand: BrandKey }) {
  const cfg = getBrandConfig(brand);
  const loc = getBusinessLocation(brand);
  const copy = brand === "nexcel" ? BOILERPLATE.nexcel : BOILERPLATE.agiworks;
  const partner = brand === "nexcel" ? PARTNER.nexcel : PARTNER.agiworks;
  const profiles = getLiveProfiles(brand);
  const related = internalLinks(brand, [
    "/uebersicht",
    "/ueber-mich",
    "/kontakt",
    "/projekte",
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* The entity reference page carries the Organization node, so crawlers
          arriving from a directory citation land on the structured facts. */}
      <SeoJsonLd schema={[organizationSchema(brand), personSchema(brand)]} />

      <section className="relative px-5 pt-[110px] sm:px-8 md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1240px]">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--accent)" }}
          >
            Presse & Partner
          </p>
          <h1
            className="mt-4 max-w-3xl text-[1.9rem] leading-tight text-white sm:text-[2.6rem]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            Unternehmensangaben, Kurzprofile und Logo von {cfg.publicName}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-white/65">
            Diese Seite enthält die verbindlichen Angaben zu {cfg.publicName} für
            Verzeichnisse, Partnerseiten und redaktionelle Beiträge. Die Texte
            sind zur Veröffentlichung freigegeben und dürfen unverändert
            übernommen werden.
          </p>
        </div>
      </section>

      <section className="relative px-5 py-14 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Company facts */}
          <div>
            <h2
              className="text-[1.1rem] text-white sm:text-[1.3rem]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              Unternehmensangaben
            </h2>
            <dl className="mt-5">
              <Fact label="Name">{cfg.publicName}</Fact>
              <Fact label="Rechtsform">Einzelunternehmen</Fact>
              <Fact label="Inhaber">{cfg.primaryOwner}</Fact>
              <Fact label="Sitz">
                {loc.city}, {loc.region}, {loc.country}
                <span className="block text-[12.5px] text-white/45">
                  Vollständige Anschrift im{" "}
                  <Link href="/impressum" className="underline underline-offset-2">
                    Impressum
                  </Link>
                  . Kein Ladenlokal — Termine nach Vereinbarung.
                </span>
              </Fact>
              <Fact label="Einzugsgebiet">{cfg.areaServed.join(" · ")}</Fact>
              <Fact label="Website">
                <a
                  href={`${cfg.canonicalDomain}/`}
                  className="underline underline-offset-2"
                >
                  {cfg.primaryHost}
                </a>
              </Fact>
              <Fact label="E-Mail">
                <a href={`mailto:${cfg.email}`} className="underline underline-offset-2">
                  {cfg.email}
                </a>
              </Fact>
              <Fact label="Themen">{cfg.topics.join(" · ")}</Fact>
              <Fact label="Logo">
                <a
                  href={cfg.defaultOgImage}
                  download
                  className="underline underline-offset-2"
                >
                  Logo herunterladen (PNG)
                </a>
              </Fact>
            </dl>
          </div>

          {/* Boilerplate */}
          <div>
            <h2
              className="text-[1.1rem] text-white sm:text-[1.3rem]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              Kurzprofile zur Übernahme
            </h2>
            <div className="mt-5 space-y-5">
              {[
                { label: "Kurz (ca. 100 Zeichen)", text: copy.short },
                { label: "Mittel (ca. 250 Zeichen)", text: copy.medium },
                { label: "Lang (ca. 800 Zeichen)", text: copy.long },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl p-5"
                  style={{
                    border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
                    {item.label}
                  </p>
                  <p className="mt-2.5 text-[14px] leading-[1.75] text-white/75">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partner brand */}
      <section className="relative px-5 py-14 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <h2
            className="text-[1.1rem] text-white sm:text-[1.3rem]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            Partnermarke
          </h2>
          <div
            className="mt-5 rounded-2xl p-6"
            style={{
              border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <a
              href={partner.url}
              className="text-[15px] text-white underline underline-offset-4"
            >
              {partner.name}
            </a>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/65">
              {partner.line} {cfg.cooperationLine} Beide Marken sind rechtlich
              eigenständige Einzelunternehmen und rechnen getrennt ab.
            </p>
          </div>
        </div>
      </section>

      {/* Verified profiles */}
      {profiles.length > 0 && (
        <section className="relative px-5 py-14 sm:px-8">
          <div className="mx-auto w-full max-w-[1240px]">
            <h2
              className="text-[1.1rem] text-white sm:text-[1.3rem]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              Offizielle Profile
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/55">
              Nur die hier gelisteten Profile werden von {cfg.publicName} betrieben.
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {profiles.map((profile) => (
                <li key={profile.url}>
                  <a
                    href={profile.url}
                    rel="me noopener"
                    className="inline-block rounded-xl px-4 py-2 text-sm text-white/80 transition-colors hover:text-white"
                    style={{
                      border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
                    }}
                  >
                    {profile.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Related */}
      <section className="relative px-5 pb-20 pt-6 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <h2 className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
            Weiter im Angebot
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                title={link.hint}
                className="rounded-xl px-4 py-2 text-sm text-white/80 transition-colors hover:text-white"
                style={{
                  border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
