"use client";

import React, { createContext, useContext } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────────
 * Geteiltes Legal-Kit für NEXCEL AI und AGI Works.
 *
 * Der technische/infrastrukturelle Inhalt der Rechtstexte ist identisch, weil
 * beide Marken auf derselben Infrastruktur laufen. Marke (Farbe) und
 * Verantwortlicher (Name, Anschrift, Kontakt) werden über `LegalTheme` und
 * `LegalEntity` injiziert — so entstehen zwei vollständig getrennte, aber
 * konsistent gepflegte Rechtstexte.
 * ────────────────────────────────────────────────────────────────────────── */

export interface LegalTheme {
  /** Akzentfarbe (Hex) */
  accent: string;
  /** Akzentfarbe als "r, g, b" für rgba()-Komposition */
  accentRgb: string;
  /** Hellere Akzentfarbe für Hover */
  accentHover: string;
}

export interface LegalEntity {
  brandName: string;
  ownerName: string;
  ownerLabel: string; // "Inhaberin" | "Inhaber"
  ownerWithBrand: string;
  street: string;
  zipCity: string;
  country: string;
  emails: string[];
  primaryEmail: string;
  phone?: string;
  phoneHref?: string;
  website: string;
  homeHref: string;
  impressumHref: string;
  datenschutzHref: string;

  /* ── Rechtlich korrekte, geschlechtsspezifische Formulierungen ──────────
   * Einzelunternehmen: der bürgerliche Name der/des Inhaber:in wird genannt.
   * Diese Felder halten Impressum-Texte grammatikalisch sauber, ohne dass
   * generische Platzhalter entstehen. */
  /** Abschnittstitel „Anbieter dieses Internetangebots" / „Anbieterin …" */
  providerSectionTitle: string;
  /** Einleitung „Anbieter und Diensteanbieter dieses Internetangebots ist:" */
  providerIntro: string;
  /** Abschnittstitel „Inhaltlich Verantwortlicher/Verantwortliche gemäß § 18 Abs. 2 MStV" */
  responsibleSectionTitle: string;
  /** „Diensteanbieter" | „Diensteanbieterin" (Haftung für Inhalte) */
  serviceProviderTerm: string;
  /** „vom Anbieter" | „von der Anbieterin" (Urheberrecht, fremde Inhalte) */
  creatorTerm: string;
  /** Satzsubjekt „Die Anbieterin" | „Der Anbieter" (§ 36 VSBG). */
  providerSubject: string;
  /** Markenspezifischer Leistungsbereich (erster Absatz) */
  serviceScope: string;
  /** Echte USt-IdNr. gemäß § 27a UStG — nur setzen, wenn tatsächlich vorhanden. */
  ustId?: string;
}

/* ── Pflichtfeld-Validierung ────────────────────────────────────────────────
 * § 5 DDG verlangt Name, ladungsfähige Anschrift und schnelle Kontaktaufnahme.
 * Fehlt ein Pflichtfeld, wird der Build/Render abgebrochen (kein Live-Platzhalter,
 * keine unvollständige Anbieterkennzeichnung im Produktivsystem). */
export function assertLegalEntityComplete(entity: LegalEntity): void {
  const required: [keyof LegalEntity, string][] = [
    ["brandName", "Geschäftsbezeichnung"],
    ["ownerName", "Name der Anbieterin / des Anbieters"],
    ["street", "Straße/Hausnummer"],
    ["zipCity", "PLZ/Ort"],
    ["country", "Land"],
    ["primaryEmail", "E-Mail"],
    ["website", "Website"],
  ];
  const missing = required
    .filter(([key]) => {
      const v = entity[key];
      return typeof v !== "string" || v.trim() === "";
    })
    .map(([, label]) => label);

  if (missing.length > 0) {
    throw new Error(
      `[Impressum] Pflichtangaben gemäß § 5 DDG fehlen für "${entity.brandName || "(unbekannt)"}": ` +
        `${missing.join(", ")}. Deployment blockiert, bis alle Pflichtdaten hinterlegt sind.`
    );
  }
}

/* ── Marken-Presets ─────────────────────────────────────────────────────── */

export const NEXCEL_THEME: LegalTheme = {
  accent: "#A45CFF",
  accentRgb: "164, 92, 255",
  accentHover: "#CBA6FF",
};

export const AGI_THEME: LegalTheme = {
  accent: "#5BB8FF",
  accentRgb: "91, 184, 255",
  accentHover: "#9BD0FF",
};

export const NEXCEL_ENTITY: LegalEntity = {
  brandName: "NEXCEL AI",
  ownerName: "Celina Siebeneicher",
  ownerLabel: "Inhaberin",
  ownerWithBrand: "NEXCEL AI — Celina Siebeneicher",
  street: "Ziegelstraße 9",
  zipCity: "59423 Unna",
  country: "Deutschland",
  emails: ["info@nexcelai.de"],
  primaryEmail: "info@nexcelai.de",
  phone: "+49 163 9166073",
  phoneHref: "tel:+491639166073",
  website: "www.nexcelai.de",
  homeHref: "/",
  impressumHref: "/impressum",
  datenschutzHref: "/datenschutz",
  providerSectionTitle: "Anbieterin dieses Internetangebots",
  providerIntro: "Anbieterin und Diensteanbieterin dieses Internetangebots ist:",
  responsibleSectionTitle: "Inhaltlich Verantwortliche gemäß § 18 Abs. 2 MStV",
  serviceProviderTerm: "Diensteanbieterin",
  creatorTerm: "von der Anbieterin",
  providerSubject: "Die Anbieterin",
  serviceScope:
    "NEXCEL AI stellt Informationen und Kontaktmöglichkeiten zu digitalen Unternehmenssystemen, Systemarchitektur, Marken- und Experience-Architektur, Prozessdesign, Webplattformen, KI-gestützten Anwendungen, Automatisierung, CRM-/Lead-Systemen, Buchungs- und Verwaltungssystemen sowie verwandten digitalen Dienstleistungen bereit.",
  ustId: "DE441463829",
};

export const AGI_ENTITY: LegalEntity = {
  brandName: "AGI Works",
  ownerName: "Kevin Blazevic",
  ownerLabel: "Inhaber",
  ownerWithBrand: "AGI Works — Kevin Blazevic",
  street: "Hansastraße 34",
  zipCity: "59423 Unna",
  country: "Deutschland",
  emails: ["info@agiworks.de"],
  primaryEmail: "info@agiworks.de",
  phone: "+49 176 23280935",
  phoneHref: "tel:+4917623280935",
  website: "www.agiworks.de",
  homeHref: "/agiworks",
  impressumHref: "/agiworks/impressum",
  datenschutzHref: "/agiworks/datenschutz",
  providerSectionTitle: "Anbieter dieses Internetangebots",
  providerIntro: "Anbieter und Diensteanbieter dieses Internetangebots ist:",
  responsibleSectionTitle: "Inhaltlich Verantwortlicher gemäß § 18 Abs. 2 MStV",
  serviceProviderTerm: "Diensteanbieter",
  creatorTerm: "vom Anbieter",
  providerSubject: "Der Anbieter",
  serviceScope:
    "AGI Works stellt Informationen und Kontaktmöglichkeiten zu Softwarearchitektur, Plattformentwicklung, Web- und Anwendungssystemen, Backend-Systemen, Infrastruktur, Systemintegration, KI-gestützten Anwendungen, Automatisierung, CRM-/Lead-Systemen, Buchungs- und Verwaltungssystemen sowie verwandten digitalen Dienstleistungen bereit.",
  // ustId: bewusst nicht gesetzt — für AGI Works wurde keine USt-IdNr. erteilt.
};

/* ── Theme-Context ──────────────────────────────────────────────────────── */

const LegalThemeContext = createContext<LegalTheme>(NEXCEL_THEME);
export const useLegalTheme = () => useContext(LegalThemeContext);

/* ── Primitives (alle markenfarben-aware via Context) ───────────────────── */

export function IconBadge({ children }: { children: React.ReactNode }) {
  const t = useLegalTheme();
  return (
    <div
      className="flex items-center justify-center w-12 h-12 rounded-xl"
      style={{
        background: `linear-gradient(135deg, rgba(${t.accentRgb}, 0.2) 0%, rgba(${t.accentRgb}, 0.1) 100%)`,
        border: `1px solid rgba(${t.accentRgb}, 0.3)`,
        boxShadow: `0 4px 20px rgba(${t.accentRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
      }}
    >
      {children}
    </div>
  );
}

export function Svg({ d }: { d: string }) {
  const t = useLegalTheme();
  return (
    <svg className="w-6 h-6" style={{ color: t.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {d.split("|").map((path, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={path} />
      ))}
    </svg>
  );
}

export function Card({ children, className = "", strong = false }: { children: React.ReactNode; className?: string; strong?: boolean }) {
  const t = useLegalTheme();
  return (
    <div
      className={`p-6 rounded-xl ${className}`}
      style={{
        background: `rgba(${t.accentRgb}, ${strong ? 0.08 : 0.05})`,
        border: `1px solid rgba(${t.accentRgb}, 0.15)`,
        boxShadow: `0 4px 20px rgba(${t.accentRgb}, 0.1)`,
      }}
    >
      {children}
    </div>
  );
}

export function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-[#E5E7EB] leading-relaxed text-[15px] md:text-base">{children}</p>;
}

export function Label({ children }: { children: React.ReactNode }) {
  const t = useLegalTheme();
  return <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: t.accent }}>{children}</p>;
}

export function Bullets({ items }: { items: string[] }) {
  const t = useLegalTheme();
  return (
    <ul className="space-y-2 text-[#E5E7EB] text-[15px]">
      {items.map((item) => (
        <li key={item} className="flex items-start">
          <span className="mr-2 mt-0.5" style={{ color: t.accent }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Meta({ rows }: { rows: [string, string][] }) {
  const t = useLegalTheme();
  return (
    <div className="mt-4 pt-4 space-y-1.5 text-sm text-[#E5E7EB]" style={{ borderTop: `1px solid rgba(${t.accentRgb}, 0.2)` }}>
      {rows.map(([k, v]) => (
        <p key={k}>
          <strong className="text-[#FFFFFF]">{k}:</strong> {v}
        </p>
      ))}
    </div>
  );
}

export interface LegalSection {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

/* ── Seiten-Shell (Hero + Sektionen + Navigation/Footer) ────────────────── */

export function LegalShell({
  theme,
  title,
  dateLabel,
  sections,
  homeHref,
  introLabel,
  dateAtBottom = false,
}: {
  theme: LegalTheme;
  title: string;
  dateLabel: string;
  sections: LegalSection[];
  homeHref: string;
  /** Optionales Eyebrow-Label über der H1 (z. B. „Rechtliche Anbieterkennzeichnung"). */
  introLabel?: string;
  /** Wenn true: Datum klein am Seitenende statt dominant im Hero. */
  dateAtBottom?: boolean;
}) {
  return (
    <LegalThemeContext.Provider value={theme}>
      <main className="relative min-h-screen overflow-hidden">
        <Navigation />
        <div className="relative min-h-screen py-24 md:py-32 px-6 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20"
              style={{
                background: `radial-gradient(circle, rgba(${theme.accentRgb}, 0.3) 0%, transparent 70%)`,
                filter: "blur(80px)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {introLabel && (
                <p
                  className="mb-5 text-[11px] md:text-xs font-semibold uppercase tracking-[0.32em]"
                  style={{ color: theme.accent }}
                >
                  {introLabel}
                </p>
              )}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] mb-6 tracking-tight">
                <span style={{ color: theme.accent, textShadow: `0 0 40px rgba(${theme.accentRgb}, 0.6)` }}>
                  {title}
                </span>
              </h1>
              {!dateAtBottom && (
                <p className="text-xl md:text-2xl text-[#E5E7EB] font-light">{dateLabel}</p>
              )}
            </motion.div>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3) }}
                  className="group"
                >
                  <div
                    className="rounded-2xl p-6 md:p-8 transition-all duration-500"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      backdropFilter: "blur(30px)",
                      WebkitBackdropFilter: "blur(30px)",
                      border: `1px solid rgba(${theme.accentRgb}, 0.2)`,
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `rgba(${theme.accentRgb}, 0.4)`;
                      e.currentTarget.style.boxShadow = `0 12px 48px rgba(${theme.accentRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `rgba(${theme.accentRgb}, 0.2)`;
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)";
                    }}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.3 }}>
                        <IconBadge>{section.icon}</IconBadge>
                      </motion.div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] tracking-tight flex-1 pt-1">
                        {section.title}
                      </h2>
                    </div>
                    <div className="text-[#E5E7EB] font-light leading-relaxed">{section.content}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-16 pt-8 text-center"
              style={{ borderTop: `1px solid rgba(${theme.accentRgb}, 0.2)` }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Link
                href={homeHref}
                className="inline-flex items-center gap-2 transition-all duration-300 font-medium group"
                style={{ color: theme.accent }}
              >
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  whileHover={{ x: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </motion.svg>
                <span>Zurück zur Startseite</span>
              </Link>

              {dateAtBottom && (
                <p className="mt-6 text-xs text-[#9CA3AF]">{dateLabel}</p>
              )}
            </motion.div>
          </div>
        </div>
        <Footer />
      </main>
    </LegalThemeContext.Provider>
  );
}
