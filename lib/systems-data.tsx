/**
 * NEXCEL AI / AGI WORKS · Zentrale Systemdaten
 *
 * Single Source of Truth für die 8 Systemkategorien.
 * Wird von SystemsGrid (Übersicht), der Fullscreen-Detailseite
 * (/systeme/[slug]) und dem Kontaktformular (System-Auswahl) genutzt.
 */

import type { ReactNode } from "react";
import { SYSTEM_SLUGS, type SystemSlug } from "./systems-slugs";

export { SYSTEM_SLUGS, type SystemSlug };

export type SystemEntry = {
  slug: SystemSlug;
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
  /* ── VERTRIEB ─────────────────────────────────────────── */
  {
    slug: "lead-funnels-crm",
    title: "Lead-Funnel & CRM",
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
    slug: "vertriebsplattform-partnerportal",
    title: "Vertriebsplattform & Partnerportal",
    tagline: "Vertrieb zentralisiert. Partner integriert.",
    desc: "Leads, Partner und Provisionen in einer zentralen Plattform verwalten und automatisiert abrechnen.",
    longDesc:
      "Verteilen Sie Leads per Drag & Drop an Partner, verfolgen Sie die Performance in Echtzeit und rechnen Sie Provisionen automatisch ab — alles in einem übersichtlichen Portal für Ihr Vertriebsteam und Ihre Partner.",
    bullets: [
      "Lead-Zuweisung an Partner & Teams",
      "Provisions- & Abschluss-Verwaltung",
      "Performance-Übersicht & Berichte",
    ],
    details: [
      "Lead-Erfassung & zentrale Verwaltung",
      "Drag & Drop Lead-Zuweisung an Partner",
      "Partner-Onboarding & Profilverwaltung",
      "Provisions-Tracking & automatische Abrechnung",
      "Abschluss- & Deal-Verwaltung",
      "Echtzeit-Performance-Dashboard",
      "Aktivitäts- & Follow-up-Protokoll",
      "Rollen- & Zugriffsrechte für Partner",
    ],
    icon: <NetworkIcon />,
    image: "/images/system-visuals/vertriebsplattform-partnerportal.png",
    alt: "Vertriebsplattform & Partnerportal — Lead-Zuweisung, Partner-Performance und Provisionen",
  },
  {
    slug: "angebots-beratungssystem",
    title: "Angebots- & Beratungssystem",
    tagline: "Überzeugende Angebote. Schnell erstellt.",
    desc: "Strukturierte Bedarfsermittlung, professionelle PDF-Angebote und lückenlose Follow-up-Prozesse.",
    longDesc:
      "Von der ersten Anfrage bis zum angenommenen Angebot: Das System führt durch eine strukturierte Bedarfsermittlung, erstellt daraus ein professionelles PDF-Angebot und verwaltet Nachfassungen, Erinnerungen und den gesamten Status-Verlauf automatisch.",
    bullets: [
      "Strukturierte Bedarfsermittlung",
      "PDF-Angebote mit Kalkulation",
      "Follow-up & Erinnerungsautomatik",
    ],
    details: [
      "Geführte Bedarfsermittlung in Schritten",
      "Angebotskalkulation mit Positionen & Rabatten",
      "Automatische PDF-Angebotserstellung",
      "Status-Tracking: Entwurf → Angenommen",
      "Follow-up-Erinnerungen & Wiedervorlagen",
      "Berater-Cockpit mit allen offenen Anfragen",
      "Kundenkommunikation & Aktivitätsprotokoll",
      "Umsatz- & Angebotsstatistiken",
    ],
    icon: <DocumentCheckIcon />,
    image: "/images/system-visuals/angebots-beratungssystem.png",
    alt: "Angebots- & Beratungssystem — Bedarfsermittlung, PDF-Angebot und Follow-up-Cockpit",
  },

  /* ── KUNDEN ───────────────────────────────────────────── */
  {
    slug: "kundenportal-self-service",
    title: "Kundenportal & Self-Service-Bereich",
    tagline: "Ihr Kunde. Sein Portal. Ihre Effizienz.",
    desc: "Kunden verwalten Termine, Dokumente und Rechnungen selbstständig — ohne Ihr Team zu belasten.",
    longDesc:
      "Geben Sie Ihren Kunden Transparenz und Kontrolle: Projektfortschritt, Dokumente, Rechnungen, Nachrichten — alles in einem sicheren Portal. Ihr Team wird entlastet, Ihre Kunden sind zufriedener.",
    bullets: [
      "Projektfortschritt & Status in Echtzeit",
      "Dokumente, Rechnungen & Nachrichten",
      "Sicherer Login mit eigenem Bereich",
    ],
    details: [
      "Sicheres Kunden-Login & eigener Bereich",
      "Projektfortschritt & Status-Tracking",
      "Dokumenten-Download & Upload",
      "Rechnungsübersicht & Zahlungsstatus",
      "Direkter Nachrichtenkanal zum Team",
      "Support-Anfragen & Ticket-Erstellung",
      "Profil & Einstellungen selbst verwalten",
      "Mobile-optimierte Oberfläche",
    ],
    icon: <PortalIcon />,
    image: "/images/system-visuals/kundenportal-self-service.png",
    alt: "Kundenportal & Self-Service — Projektfortschritt, Dokumente und Rechnungen für Kunden",
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
    slug: "service-supportportal",
    title: "Service- & Supportportal",
    tagline: "Support, der wirklich funktioniert.",
    desc: "Ticket-System, Wissensdatenbank und SLA-Tracking für schnellen, messbaren Kundenservice.",
    longDesc:
      "Strukturieren Sie Ihren Support: Anfragen werden als Tickets erfasst, priorisiert und zugewiesen. SLA-Zeiten, Kundenzufriedenheit und Team-Auslastung sind jederzeit messbar. Inklusive Wissensdatenbank für Selfservice.",
    bullets: [
      "Ticket-System mit SLA & Priorisierung",
      "Wissensdatenbank für Selfservice",
      "Kundenzufriedenheit & Reporting",
    ],
    details: [
      "Ticket-Erfassung aus allen Kanälen",
      "Priorisierung & Team-Zuweisung",
      "SLA-Tracking & Eskalationsregeln",
      "Interner Notizen- & Kommentarbereich",
      "Wissensdatenbank & Top-Artikel",
      "Kundenzufriedenheits-Bewertung",
      "Makros & Antwortvorlagen",
      "Team-Performance-Reports",
    ],
    icon: <SupportIcon />,
    image: "/images/system-visuals/service-supportportal.png",
    alt: "Service- & Supportportal — Ticket-System, SLA-Tracking und Wissensdatenbank",
  },
  {
    slug: "omnichannel-kommunikation",
    title: "Omnichannel-Kommunikationssystem",
    tagline: "Alle Kanäle. Ein Posteingang.",
    desc: "E-Mail, WhatsApp, Chat und Formulare laufen in einer gemeinsamen Inbox — mit Automationen.",
    longDesc:
      "Egal ob Ihr Kunde per E-Mail, WhatsApp, Live-Chat oder Webformular schreibt: Alle Nachrichten landen in einem zentralen Posteingang, werden automatisch klassifiziert und dem richtigen Team zugewiesen. Mit Automationen und vollständiger Kommunikationshistorie.",
    bullets: [
      "Unified Inbox: E-Mail, WhatsApp, Chat",
      "Automatische Klassifizierung & Zuweisung",
      "Vollständige Kundenhistorie",
    ],
    details: [
      "Unified Inbox aus allen Kommunikationskanälen",
      "WhatsApp, E-Mail, Live-Chat, Webformulare",
      "Automatische Eingangsklassifizierung",
      "Team-Routing & Zuweisungsregeln",
      "Kundenhistorie & Gesprächsverlauf",
      "Automations-Workflows & Antwortregeln",
      "Aufgaben direkt aus Nachrichten erstellen",
      "Kanal-übergreifende Statistiken",
    ],
    icon: <InboxIcon />,
    image: "/images/system-visuals/omnichannel-kommunikation.png",
    alt: "Omnichannel-Kommunikation — Unified Inbox mit WhatsApp, E-Mail und Chat",
  },

  /* ── UNTERNEHMEN ──────────────────────────────────────── */
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
    slug: "admin-operations-system",
    title: "Admin- & Operations-System",
    tagline: "Volle Kontrolle. Null Chaos.",
    desc: "Zentrale Verwaltung von Nutzern, Rollen, Anfragen und Systemstatus in einem leistungsstarken Admin-Panel.",
    longDesc:
      "Das Rückgrat Ihrer digitalen Infrastruktur: Verwalten Sie Benutzer, Rollen und Berechtigungen, verfolgen Sie Anfragen und Genehmigungen, und behalten Sie Systemlogs und Performance jederzeit im Blick — alles rollenbasiert und sicher.",
    bullets: [
      "Nutzer-, Rollen- & Rechteverwaltung",
      "Anfragen & Genehmigungsworkflows",
      "System-Logs & Performance-Monitoring",
    ],
    details: [
      "Benutzerverwaltung mit Rollen & MFA",
      "Rollenbasierte Zugriffsrechte",
      "Anfragen-Queue & Genehmigungsworkflows",
      "Systemstatus & Infrastruktur-Monitoring",
      "Audit-Log & Aktivitätsprotokoll",
      "Benachrichtigungen & Eskalationsregeln",
      "Admin-Schnellaktionen & Shortcuts",
      "Team-Übersicht & Auslastungsberichte",
    ],
    icon: <ShieldCheckIcon />,
    image: "/images/system-visuals/admin-operations-system.png",
    alt: "Admin- & Operations-System — Nutzerverwaltung, Anfragen und Systemstatus",
  },
  {
    slug: "dokumentenmanagement-freigaben",
    title: "Dokumentenmanagement & Freigaben",
    tagline: "Jedes Dokument. Jederzeit. Sicher.",
    desc: "Zentrale Dokumentenverwaltung mit strukturierten Freigabe-Workflows, Versionen und Audit-Log.",
    longDesc:
      "Schluss mit E-Mail-Anhängen und verlorenen Dokumentenversionen: Alle Dokumente werden zentral gespeichert, kategorisiert und über definierte Freigabe-Workflows geprüft — DSGVO-konform, revisionssicher und mit lückenlosem Audit-Log.",
    bullets: [
      "Zentrale Dokumentenablage & Versionen",
      "Strukturierte Freigabe-Workflows",
      "Audit-Log & DSGVO-konform",
    ],
    details: [
      "Dokumenten-Upload & automatische Kategorisierung",
      "Versionsverwaltung & Vergleich",
      "Freigabe-Workflow: Prüfung → Genehmigung",
      "Rechtliche KI-Zusammenfassung",
      "Audit-Log & Aktivitätsprotokoll",
      "Revisionssichere Archivierung",
      "Fälligkeitsüberwachung & Erinnerungen",
      "DSGVO-konform & verschlüsselt",
    ],
    icon: <FolderIcon />,
    image: "/images/system-visuals/dokumentenmanagement-freigaben.png",
    alt: "Dokumentenmanagement & Freigaben — Dokumentenverwaltung mit Freigabe-Workflow und Audit-Log",
  },
  {
    slug: "projekt-aufgabenmanagement",
    title: "Projekt- & Aufgabenmanagement",
    tagline: "Projekte im Griff. Teams im Takt.",
    desc: "Projekte, Aufgaben, Deadlines und Team-Auslastung in einem übersichtlichen Management-System.",
    longDesc:
      "Behalten Sie alle Projekte, Aufgaben und Deadlines im Blick: Kanban-Boards, Zeitlinien und Team-Auslastung zeigen auf einen Blick, was läuft und was klemmt. Mit Kommentaren, Checklisten und automatischen Status-Updates für alle Beteiligten.",
    bullets: [
      "Kanban-Board & Aufgabenverwaltung",
      "Projektfortschritt & Timeline",
      "Team-Auslastung & Deadlines",
    ],
    details: [
      "Projektübersicht mit Fortschrittsbalken",
      "Kanban-Board: Neu → In Arbeit → Erledigt",
      "Aufgaben mit Priorität & Deadline",
      "Zeitlinie & Meilenstein-Planung",
      "Team-Zuweisung & Auslastungsübersicht",
      "Kommentare, Checklisten & Anhänge",
      "Automatische Status-Benachrichtigungen",
      "Dateiablage pro Projekt",
    ],
    icon: <TaskIcon />,
    image: "/images/system-visuals/projekt-aufgabenmanagement.png",
    alt: "Projekt- & Aufgabenmanagement — Kanban-Board, Timeline und Team-Auslastung",
  },
  {
    slug: "mitarbeiter-hr-system",
    title: "Mitarbeiter- & HR-System",
    tagline: "HR digital. Klar strukturiert.",
    desc: "Mitarbeiterverwaltung, Abwesenheiten, Onboarding und Dokumente in einem zentralen HR-System.",
    longDesc:
      "Von der Einstellung bis zum Offboarding: Das HR-System verwaltet Mitarbeiterdaten, Rollen, Abwesenheiten und Onboarding-Checklisten zentral. Ihr HR-Team arbeitet effizienter, Ihre Mitarbeiter haben alles auf einen Blick.",
    bullets: [
      "Mitarbeiterverwaltung & Rollen",
      "Abwesenheiten, Urlaub & Krankmeldungen",
      "Onboarding-Checklisten & Dokumente",
    ],
    details: [
      "Mitarbeiterstammdaten & Kontaktinformationen",
      "Rollen-, Team- & Standortzuweisung",
      "Abwesenheitsmanagement & Kalender",
      "Urlaubs- & Krankmeldungs-Workflows",
      "Onboarding-Checklisten & IT-Zugänge",
      "Dokumenten-Upload & Verwaltung",
      "Aufgabenzuweisung & Nachverfolgung",
      "HR-Übersicht & Auslastungsbericht",
    ],
    icon: <HrIcon />,
    image: "/images/system-visuals/mitarbeiter-hr-system.png",
    alt: "Mitarbeiter- & HR-System — Mitarbeiterverwaltung, Abwesenheiten und Onboarding",
  },
  {
    slug: "warenwirtschaft-lagerverwaltung",
    title: "Warenwirtschaft & Lagerverwaltung",
    tagline: "Lager unter Kontrolle. Bestand optimiert.",
    desc: "Produkte, Bestände, Bestellungen und Lieferanten zentral verwalten und in Echtzeit überwachen.",
    longDesc:
      "Behalten Sie Ihren Lagerbestand stets im Griff: Produkte, Mindestbestände, Bestellungen und Lieferanten werden zentral verwaltet. Automatische Bestellvorschläge, Bestandswarnungen und Lieferanten-Performance-Tracking halten Ihren Betrieb am Laufen.",
    bullets: [
      "Produktbestand & Bestandswarnungen",
      "Bestellungen & Lieferantenmanagement",
      "Lagerübersicht & Auswertungen",
    ],
    details: [
      "Produktverwaltung mit Artikelnummern & Kategorien",
      "Bestandsübersicht & Mindestbestand-Warnungen",
      "Bestellwesen & Eingangsbestätigung",
      "Lieferantenverwaltung & Performance-Tracking",
      "Wareneingang & -ausgang buchen",
      "Lagerstandort-Verwaltung (Nord, Süd, etc.)",
      "Rechnungsübersicht & offene Posten",
      "Bestandsberichte & Umsatzauswertung",
    ],
    icon: <WarehouseIcon />,
    image: "/images/system-visuals/warenwirtschaft-lagerverwaltung.png",
    alt: "Warenwirtschaft & Lagerverwaltung — Produktbestand, Bestellungen und Lieferanten",
  },
  {
    slug: "termin-schichtplanung",
    title: "Termin- & Schichtplanung",
    tagline: "Planung ohne Chaos. Immer besetzt.",
    desc: "Mitarbeiterschichten, Ressourcen und Termine intelligent planen und automatisch verwalten.",
    longDesc:
      "Ob Schichtbetrieb oder Terminverwaltung: Das System plant Mitarbeitereinsätze, verwaltet Ressourcen und koordiniert Termine automatisch. Mit Echtzeit-Übersicht, automatischen Erinnerungen und einfachem Tausch-Workflow für Ihr Team.",
    bullets: [
      "Schicht- & Mitarbeiterplanung",
      "Ressourcen- & Raumverwaltung",
      "Erinnerungen & automatische Koordination",
    ],
    details: [
      "Schichtplanung & Mitarbeitereinsatz",
      "Ressourcen- & Raumverwaltung",
      "Automatische Erinnerungen & Bestätigungen",
      "Tausch-Workflow & Vertretungsplanung",
      "Kalenderansicht (Tag / Woche / Monat)",
      "Abwesenheits- & Urlaubsintegration",
      "Team-Benachrichtigungen bei Änderungen",
      "Export & Druckansicht",
    ],
    icon: <ClockIcon />,
    image: "/images/system-visuals/termin-schichtplanung.png",
    alt: "Termin- & Schichtplanung — Mitarbeiterplanung, Ressourcen und Kalender",
  },
  {
    slug: "dashboard-reporting",
    title: "Dashboard & Reporting",
    tagline: "Zahlen, die entscheiden.",
    desc: "Umsatz, Leads, Conversion und KPIs in einem zentralen Reporting-System — in Echtzeit.",
    longDesc:
      "Alle Geschäftszahlen auf einen Blick: Umsatz, Leads, Conversion-Rate, Aufgaben und Wachstum werden in einem leistungsstarken Dashboard visualisiert. Mit automatischen Berichten, Filtern und Export-Optionen für fundierte Entscheidungen.",
    bullets: [
      "Umsatz, Leads & Conversion in Echtzeit",
      "Automatische Berichte & KPI-Übersicht",
      "Export als PDF, Excel oder CSV",
    ],
    details: [
      "Echtzeit-KPI-Dashboard mit Metriken",
      "Umsatz- & Lead-Entwicklung (Charts)",
      "Conversion-Funnel & Trichteranalyse",
      "Aufgaben- & Aktivitätsübersicht",
      "Automatische Berichte auf Knopfdruck",
      "Filter: Zeitraum, Team, Kanal",
      "Export als PDF, Excel & CSV",
      "Wachstums- & Trendanalyse",
    ],
    icon: <ChartIcon />,
    image: "/images/system-visuals/dashboard-reporting.png",
    alt: "Dashboard & Reporting — KPI-Übersicht, Umsatz-Charts und Berichte",
  },
  {
    slug: "recruiting-bewerberplattform",
    title: "Recruiting- & Bewerberplattform",
    tagline: "Die besten Talente. Strukturiert gefunden.",
    desc: "Bewerbungs-Pipeline, Kandidatenprofile und Interview-Koordination in einem strukturierten System.",
    longDesc:
      "Von der ersten Bewerbung bis zur Einstellung: Verwalten Sie Kandidaten in einer übersichtlichen Pipeline, koordinieren Sie Interviews und behalten Sie Feedback, Dokumente und Status jederzeit im Blick — mit KI-gestützter Eignungsanalyse.",
    bullets: [
      "Bewerbungs-Pipeline & Kandidatenprofile",
      "Interview-Planung & Koordination",
      "KI-Eignungsanalyse & Bewertung",
    ],
    details: [
      "Bewerbungs-Eingang & Erfassung",
      "Kandidaten-Pipeline: Neu → Eingestellt",
      "Interview-Planung & Terminkoordiination",
      "Qualifikations-Matching & Bewertung",
      "Dokumenten-Verwaltung (Lebenslauf, Portfolio)",
      "Feedback-System für Interview-Teams",
      "Kommunikation mit Kandidaten",
      "Recruiting-Statistiken & Berichte",
    ],
    icon: <RecruitIcon />,
    image: "/images/system-visuals/recruiting-bewerberplattform.png",
    alt: "Recruiting- & Bewerberplattform — Bewerbungs-Pipeline, Interview-Koordination und KI-Analyse",
  },

  /* ── KI ───────────────────────────────────────────────── */
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
    slug: "ki-telefonagent-voice",
    title: "KI-Telefonagent & Voice Automation",
    tagline: "Anrufe, die sich selbst bearbeiten.",
    desc: "KI nimmt Anrufe entgegen, transkribiert live, erkennt Leads und erstellt Aufgaben automatisch.",
    longDesc:
      "Ihr KI-Telefonagent nimmt eingehende Anrufe entgegen, transkribiert das Gespräch in Echtzeit, analysiert Intent und Stimmung und erstellt automatisch eine Aufgabe, plant ein Follow-up und synchronisiert alles ins CRM — ohne menschliches Zutun.",
    bullets: [
      "KI-Gesprächsführung & Live-Transkript",
      "Lead-Erkennung & Aufgaben-Erstellung",
      "CRM-Sync & Follow-up-Automatik",
    ],
    details: [
      "Eingehende Anrufe automatisch entgegennehmen",
      "Live-Transkription & Gesprächsprotokoll",
      "KI-Intent- & Stimmungsanalyse",
      "Automatische Lead-Erkennung & Qualifizierung",
      "Aufgaben-Erstellung & Team-Benachrichtigung",
      "Follow-up-Planung & Terminvorschlag",
      "CRM-Synchronisation in Echtzeit",
      "Agenten-Status & Performance-Dashboard",
    ],
    icon: <PhoneAiIcon />,
    image: "/images/system-visuals/ki-telefonagent-voice.png",
    alt: "KI-Telefonagent & Voice Automation — Live-Transkript, Lead-Erkennung und CRM-Sync",
  },

  /* ── PLATTFORMEN ──────────────────────────────────────── */
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
    slug: "saas-plattform-multi-tenant",
    title: "SaaS-Plattform / Multi-Tenant-System",
    tagline: "Skalierbar. Multi-Mandanten-fähig.",
    desc: "Mandantenbasierte SaaS-Plattform mit Aboverwaltung, Modul-Aktivierung und Admin-Konsole.",
    longDesc:
      "Betreiben Sie Ihre eigene SaaS-Lösung mit vollständiger Mandantentrennung: Jeder Mandant erhält seinen eigenen Bereich, konfigurierbare Module und ein Abomodell. Sie behalten über eine zentrale Admin-Konsole volle Kontrolle über alle Tenants.",
    bullets: [
      "Multi-Tenant-Architektur & Mandantentrennung",
      "Modul-Aktivierung & Aboverwaltung",
      "Admin-Konsole & Nutzungsanalyse",
    ],
    details: [
      "Vollständige Mandantentrennung (Multi-Tenant)",
      "Mandanten-Onboarding & Verwaltung",
      "Modul-Aktivierung pro Mandant",
      "Abopläne & automatische Abrechnung",
      "MRR-, Nutzer- & Nutzungsstatistiken",
      "Rollen & Berechtigungen pro Mandant",
      "API-Kontingente & Speicherlimits",
      "Admin-Konsole für alle Tenants",
    ],
    icon: <TenantIcon />,
    image: "/images/system-visuals/saas-plattform-multi-tenant.png",
    alt: "SaaS-Plattform / Multi-Tenant-System — Mandantenverwaltung, Module und Admin-Konsole",
  },
  {
    slug: "akademie-lernplattform",
    title: "Akademie- & Lernplattform",
    tagline: "Wissen strukturiert. Lernende begeistert.",
    desc: "Kurse, Lektionen, Prüfungen und Zertifikate in einer professionellen Lernumgebung verwalten.",
    longDesc:
      "Bauen Sie Ihre eigene Akademie: Erstellen Sie Kurse, strukturieren Sie Lektionen und Prüfungen, vergeben Sie Zertifikate und verfolgen Sie den Fortschritt jedes Teilnehmers in einem übersichtlichen Dashboard — für interne Schulungen oder externe Kunden.",
    bullets: [
      "Kurs- & Lektionsverwaltung",
      "Prüfungen, Zertifikate & Abschlüsse",
      "Teilnehmer-Dashboard & Fortschritt",
    ],
    details: [
      "Kurs-Erstellung & Strukturierung",
      "Lektion-Typen: Video, PDF, Aufgaben",
      "Prüfungen & Bewertungssystem",
      "Automatische Zertifikatsvergabe",
      "Teilnehmer-Dashboard & Fortschrittsanzeige",
      "Admin-Dashboard mit Kursübersicht",
      "Aktivierungs- & Freigabestatus",
      "Suchfunktion & Kategorisierung",
    ],
    icon: <AcademyIcon />,
    image: "/images/system-visuals/akademie-lernplattform.png",
    alt: "Akademie- & Lernplattform — Kursverwaltung, Prüfungen und Zertifikate",
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
export function NetworkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5v4M12 11.5l-5 5M12 11.5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function DocumentCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 3v6h5M9 15l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function PortalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
export function InboxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5h16M4 12h5l2 3 2-3h5M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l8 3.5v5C20 16.5 16.5 21 12 21S4 16.5 4 11.5v-5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
export function TaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function HrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 19a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 11h5M16 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function WarehouseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 21V9l9-6 9 6v12H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="9" y="13" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
export function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V12M8 20V8M12 20V4M16 20v-8M20 20v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function RecruitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function PhoneAiIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 3a9 9 0 0 1 0 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 7a5 5 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.1 8.9a8 8 0 0 0 0 6.2L3 17l1 1c1 .9 2.5.9 3.5 0l.5-.5a2 2 0 0 0 0-2.8L7 14a8.4 8.4 0 0 1 0-4l1-1a2 2 0 0 0 0-2.8L7.5 5.5C6.5 4.6 5 4.6 4 5.5L3 6.5l3.1 2.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
export function TenantIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="13" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
export function AcademyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L2 8l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 11v5c0 2 2.7 4 6 4s6-2 6-4v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
