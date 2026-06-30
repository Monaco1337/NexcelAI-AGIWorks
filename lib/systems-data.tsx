/**
 * NEXCEL AI / AGI WORKS · Zentrale Systemdaten
 *
 * Single Source of Truth für die 8 Systemkategorien.
 * Wird von SystemsGrid (Übersicht), der Fullscreen-Detailseite
 * (/systeme/[slug]) und dem Kontaktformular (System-Auswahl) genutzt.
 */

import type { ReactNode } from "react";

export type SystemEntry = {
  slug: string;
  title: string;
  tagline: string;
  /** Kurzbeschreibung (2–3 Zeilen) für die Übersichtskarte. */
  desc: string;
  /** Kompakte Stichpunkte für das Inline-Aufklappen in der Karte. */
  bullets: string[];
  /** Vollständiger Leistungsumfang für die Detailseite. */
  details: string[];
  /** Erweiterte Beschreibung für die Detailseite. */
  longDesc: string;
  icon: ReactNode;
  image: string;
  alt: string;
};

export const SYSTEMS: SystemEntry[] = [
  {
    slug: "premium-websysteme",
    title: "Premium-Websysteme",
    tagline: "Webseiten, die verkaufen.",
    desc: "Maßgeschneiderte Webseiten und Portale mit Fokus auf Conversion, Performance und Markenauftritt.",
    longDesc:
      "Wir entwickeln keine Templates, sondern individuelle Websysteme, die exakt auf Ihre Marke, Ihre Zielgruppe und Ihre Conversion-Ziele zugeschnitten sind. Von der Architektur über das Design bis zur technischen Umsetzung — performant, suchmaschinenstark und auf Wachstum ausgelegt.",
    bullets: [
      "Conversion-optimierte Landingpages & Portale",
      "SEO-Architektur & Core Web Vitals",
      "Integriertes Kontakt- & Lead-System",
    ],
    details: [
      "Individuelles Design nach Markenidentität",
      "Conversion-optimierte Seitenstruktur",
      "SEO-Architektur & Core Web Vitals",
      "Integriertes Kontakt- & Lead-System",
      "CMS-Anbindung für eigenständige Pflege",
      "Cookie-Banner, Impressum & Datenschutz",
      "Analytics-Tracking & Ziel-Messung",
      "Mobile-first, responsive auf allen Geräten",
    ],
    icon: <GlobeIcon />,
    image: "/images/system-visuals/premium-websysteme.png",
    alt: "Premium-Websystem — Hero-Landingpage mit Formular und Lead-Strecke",
  },
  {
    slug: "buchungs-beauty-systeme",
    title: "Buchungs- & Beauty-Systeme",
    tagline: "Termine buchen. Rund um die Uhr.",
    desc: "Intelligente Buchungssysteme für Dienstleister, Salons und Studios — automatisiert und übersichtlich.",
    longDesc:
      "Schluss mit Telefon-Pingpong: Ihre Kunden buchen rund um die Uhr selbstständig, das System verwaltet Mitarbeiter, Ressourcen und Erinnerungen automatisch. Weniger No-Shows, volle Kalender, zufriedene Kunden — alles in einem eleganten, auf Ihre Marke abgestimmten Buchungssystem.",
    bullets: [
      "Online-Buchung 24/7 ohne Telefonat",
      "Mitarbeiter-Kalender & Ressourcen",
      "Automatische Erinnerungen & Bestätigungen",
    ],
    details: [
      "Online-Buchung 24/7 ohne Telefonat",
      "Mitarbeiter- & Ressourcenverwaltung",
      "Automatische E-Mail- und SMS-Erinnerungen",
      "Leistungs- & Preiskatalog",
      "Kundenprofil & Buchungshistorie",
      "Stornierung & Umbuchung selbstständig",
      "Admin-Dashboard mit Tagesübersicht",
      "Anbindung an Google Kalender & iCal",
    ],
    icon: <CalendarIcon />,
    image: "/images/system-visuals/buchungs-beauty-systeme.png",
    alt: "Buchungssystem — Terminkalender mit Leistungen und Kundenverwaltung",
  },
  {
    slug: "lead-funnels-crm",
    title: "Lead-Funnels & CRM",
    tagline: "Mehr Anfragen. Messbar. Planbar.",
    desc: "Leadgenerierung, qualifizierte Funnels und strukturiertes CRM für nachhaltiges Wachstum.",
    longDesc:
      "Von der ersten Anzeige bis zum abgeschlossenen Deal: Wir bauen durchgängige Funnels mit qualifizierenden Formularen und einem CRM, das jeden Lead automatisch erfasst, priorisiert und nachfasst. So wird Ihr Vertrieb planbar und Ihr Wachstum messbar.",
    bullets: [
      "GEO- & SEO-optimierte Landingpages",
      "CRM mit Pipeline & Lead-Status",
      "Automatischer Erstkontakt & Follow-up",
    ],
    details: [
      "GEO- & SEO-optimierte Landingpages",
      "Multi-Step-Formulare zur Lead-Qualifizierung",
      "CRM-Pipeline mit Status & Priorität",
      "Automatischer Erstkontakt via E-Mail",
      "Follow-up-Sequenzen & Wiedervorlagen",
      "Lead-Scoring & Priorisierung",
      "Reporting: Conversion-Raten & Quellen",
      "Integration mit bestehenden Systemen",
    ],
    icon: <FunnelIcon />,
    image: "/images/system-visuals/lead-funnels-crm.png",
    alt: "Lead-Funnel & CRM — Landingpage, CRM-Cockpit mit Pipeline",
  },
  {
    slug: "mitglieder-clubverwaltung",
    title: "Mitglieder- & Clubverwaltung",
    tagline: "Community strukturiert verwalten.",
    desc: "Mitgliederbereiche, Rollen, Standorte und Freigaben — alles in einem übersichtlichen System.",
    longDesc:
      "Ob Verein, Club oder Mitgliederorganisation: Verwalten Sie Mitglieder, Rollen, Standorte und Dokumente zentral und sicher. Ein Mitgliederbereich mit Selbstservice entlastet Ihr Team, während ein leistungsstarker Admin-Bereich volle Kontrolle und Übersicht garantiert.",
    bullets: [
      "Mitgliederverwaltung mit Rollen & Status",
      "Standorte, Dokumente & Freigaben",
      "Aktivitätsübersicht & Reports",
    ],
    details: [
      "Mitgliederverwaltung mit Rollen & Status",
      "Standort- & Bereichsverwaltung",
      "Dokumenten-Upload & Freigabe-Workflow",
      "Mitglieder-Dashboard & Selbstservice",
      "Admin-Bereich mit Moderationsfunktionen",
      "Aktivitäts-Feed & Benachrichtigungen",
      "Mitglieder-Reporting & Statistiken",
      "Mobile-taugliche Oberfläche",
    ],
    icon: <UsersIcon />,
    image: "/images/system-visuals/mitglieder-clubverwaltung.png",
    alt: "Mitglieder- & Clubverwaltung — Dashboard mit Rollen, Standorten und Freigaben",
  },
  {
    slug: "branchen-plattformen",
    title: "Branchen-Plattformen",
    tagline: "Ihr Marktplatz. Ihre Regeln.",
    desc: "Digitale Branchenverzeichnisse und Marktplätze mit Listing, Suche, Karte und Admin-Kontrolle.",
    longDesc:
      "Werden Sie zur zentralen Plattform Ihrer Branche: Anbieter onboarden sich selbst, Nutzer finden über Karte und Filtersuche genau das Passende, und Sie behalten über ein mächtiges Admin-Dashboard die volle Kontrolle. Inklusive Monetarisierung über Premium-Listings.",
    bullets: [
      "Listing-Portal mit Karte & Filtersuche",
      "Anbieter-Onboarding & Profilverwaltung",
      "Anfragen-System & Admin-Moderation",
    ],
    details: [
      "Listing-Portal mit Karte & Geo-Suche",
      "Anbieter-Onboarding & Profil-Editor",
      "Kategorie-, Filter- & Umkreissuche",
      "Bewertungs- & Review-System",
      "Anfragen-Routing an Anbieter",
      "Admin-Dashboard & Content-Moderation",
      "SEO-optimierte Brancheneinträge",
      "Monetarisierung via Premium-Listings",
    ],
    icon: <PlatformIcon />,
    image: "/images/system-visuals/branchen-plattformen.png",
    alt: "Branchen-Plattform — Such-Portal mit Karte, Detailansicht und Admin",
  },
  {
    slug: "erp-systeme",
    title: "Individuelle ERP-Systeme",
    tagline: "Ihr Unternehmen. Ein System.",
    desc: "Kunden, Projekte, Finanzen und Ressourcen gebündelt in einer maßgeschneiderten Betriebszentrale.",
    longDesc:
      "Standardsoftware zwingt Sie in fremde Prozesse — ein individuelles ERP bildet exakt Ihre ab. Kunden, Projekte, Finanzen, Ressourcen und Dokumente laufen in einer zentralen Betriebszentrale zusammen, mit rollenbasierten Rechten und Live-Reports für fundierte Entscheidungen.",
    bullets: [
      "Kunden-, Aufgaben- & Projektverwaltung",
      "Finanzen, Rechnungen & offene Posten",
      "Reports, Dashboards & Auswertungen",
    ],
    details: [
      "Kunden- & Kontaktverwaltung (CRM-Kern)",
      "Aufgaben- & Projektmanagement",
      "Finanzen: Angebote, Rechnungen, Posten",
      "Ressourcen- & Mitarbeiterplanung",
      "Dokumenten- & Dateiablage",
      "Rollenbasierte Zugriffsrechte",
      "Live-Reports & KPI-Dashboards",
      "Anpassbar auf Ihre Branche & Prozesse",
    ],
    icon: <ErpIcon />,
    image: "/images/system-visuals/erp-systeme.png",
    alt: "ERP-System — Betriebszentrale mit Kunden, Projekten und Finanzen",
  },
  {
    slug: "ki-automatisierung",
    title: "KI & Automatisierung",
    tagline: "Prozesse, die sich selbst erledigen.",
    desc: "KI-gestützte Workflows, die Dokumente lesen, priorisieren, antworten und Aktionen auslösen.",
    longDesc:
      "Wiederkehrende Aufgaben kosten Zeit und Nerven. Unsere KI-Automatisierungen lesen Eingänge, klassifizieren und priorisieren, erstellen Antwortentwürfe und lösen Folgeaktionen aus — vollautomatisch und nach Ihren Regeln. So gewinnt Ihr Team Zeit für das Wesentliche.",
    bullets: [
      "Automatische Eingangsverarbeitung",
      "KI-Klassifizierung & Priorisierung",
      "Workflow-Auslösung & E-Mail-Entwürfe",
    ],
    details: [
      "Automatische Eingangsverarbeitung (E-Mail, Formulare, Dokumente)",
      "KI-Klassifizierung & Priorisierung",
      "Automatische E-Mail-Entwürfe & Antworten",
      "Workflow-Auslösung bei definierten Regeln",
      "Aufgaben automatisch erstellen & zuweisen",
      "Zusammenfassungen & Kernaussagen extrahieren",
      "System-Performance-Monitoring",
      "Vollständig konfigurierbar & erweiterbar",
    ],
    icon: <SparkIcon />,
    image: "/images/system-visuals/ki-automatisierung.png",
    alt: "KI & Automatisierung — KI-Core mit Eingangsquellen und Automatisierungs-Studio",
  },
  {
    slug: "schnittstellen-integrationen",
    title: "Schnittstellen & Integrationen",
    tagline: "Alles verbunden. Sicher. Stabil.",
    desc: "Nahtlose Anbindungen zwischen externen Systemen und Ihrer zentralen Infrastruktur.",
    longDesc:
      "Damit Ihre Systeme als Einheit arbeiten, verbinden wir sie sauber miteinander: Zahlungsanbieter, CRM, Kalender, E-Mail und beliebige APIs. Mit robustem Datenmapping, Fehler-Handling und automatischer Wiederholung — DSGVO-konform und SSL-verschlüsselt.",
    bullets: [
      "REST-API & Webhook-Verbindungen",
      "Datenmapping & Format-Transformation",
      "Fehler-Handling & automatische Wiederholung",
    ],
    details: [
      "REST-API, GraphQL & Webhook-Anbindungen",
      "Zahlungsanbieter (Stripe, PayPal, SEPA)",
      "CRM- & ERP-Systemintegrationen",
      "Kalender (Google, iCal, CalDAV)",
      "E-Mail-Systeme (IMAP/SMTP, SendGrid)",
      "Datenmapping & Format-Transformation",
      "Fehler-Handling & automatische Wiederholung",
      "DSGVO-konform & SSL-verschlüsselt",
    ],
    icon: <PlugIcon />,
    image: "/images/system-visuals/schnittstellen-integrationen.png",
    alt: "Schnittstellen & Integrationen — Hub verbindet externe Systeme mit dem Unternehmenssystem",
  },
];

export function getSystemBySlug(slug: string): SystemEntry | undefined {
  return SYSTEMS.find((s) => s.slug === slug);
}

export const SYSTEM_SLUGS = SYSTEMS.map((s) => s.slug);

/* ── Icons ── */
export function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16M8 3v4M16 3v4M9 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function FunnelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
export function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.5M16.5 19a5.5 5.5 0 0 0-2-4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function PlatformIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="11" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
export function ErpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7l8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 7v10l8 4 8-4V7M12 11v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
export function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
export function PlugIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 2v5M15 2v5M7 7h10v3a5 5 0 0 1-10 0V7ZM12 15v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
