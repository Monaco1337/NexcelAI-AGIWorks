// SEO_TOPIC_AUTHORITY_V2_20261120 — guarded targeted FAQ and related-link improvements.
/**
 * Money pages — commercial service/solution pages (Phase 6).
 *
 * Hard rules (enforced by `seo:money-pages` + the shared SEO guards):
 *  - Every money page ships as CANDIDATE: approved=false, manualIndexApproval=false,
 *    quality.index=false → noindex,follow. Nothing here is auto-indexed.
 *  - AGI Works uses the /leistungen/* collection with a technical / engineering
 *    angle. NEXCEL AI uses the /loesungen/* collection with a strategic /
 *    customer-experience angle. The two must read differently (cross-domain
 *    duplicate guard fails on near-identical copy).
 *  - No ranking guarantees, no unsupported superlatives, no invented metrics,
 *    no fixed price promises. Cost is always an honest "Projektkorridor".
 *  - Grounded in the real system catalog (`systemSlug` ∈ lib/systems-slugs.ts).
 *
 * These pages are rendered by a catch-all route + MoneyPageTemplate and are
 * registered in config/seo/pageRegistry.ts (type "money", candidate).
 */

import type { BrandKey } from "@/config/seo/domains";
import type { SystemSlug } from "@/lib/systems-slugs";
import type { FaqItem, FeatureItem, ProcessStep } from "@/lib/templates/types";

export type MoneyCollection = "leistungen" | "loesungen";

export interface DecisionMatrix {
  /** When this is the right choice. */
  suitable: string[];
  /** When it is explicitly NOT the right choice. */
  notSuitable: string[];
  /** The honest alternative for the "not suitable" cases. */
  alternative: string;
}

export interface MoneyPage {
  /** Stable id: `${brand}:${path}`. */
  id: string;
  brand: BrandKey;
  collection: MoneyCollection;
  slug: string;
  /** Clean public path, e.g. "/leistungen/erp-system-entwicklung". */
  path: string;
  /** Real underlying system offering (optional but validated when set). */
  systemSlug?: SystemSlug;
  serviceName: string;
  /** <= 65 chars, keyword front, brand at the end. */
  title: string;
  /** 50–165 chars, concrete, no empty promises. */
  description: string;
  eyebrow: string;
  /** H1 + lead paragraph. */
  h1: string;
  heroIntro: string;
  /** AEO direct answer: 3–5 sentences answering what/for whom/when/next. */
  aeoAnswer: string;
  /** Concrete operational problem. */
  problem: string;
  solutionIntro: string;
  /** Concrete modules that get built. */
  modules: FeatureItem[];
  /** Brand-specific approach bullets (AGI technical / NEXCEL strategic). */
  approach: string[];
  /** Who it fits. */
  industries: string[];
  decision: DecisionMatrix;
  /** Honest cost orientation — never a fixed guaranteed price. */
  costNote: string;
  process: ProcessStep[];
  faq: FaqItem[];
  /** Internal links (must resolve to known routes / money collections). */
  relatedPaths: string[];
  tags: string[];
  /** Deny-by-default indexing (candidate). */
  approved: boolean;
  manualIndexApproval: boolean;
}

const PROOF = "Wir klären vor der Umsetzung Leistungsumfang, Zuständigkeiten und Abnahmekriterien. Aufwand und Kosten richten sich nach Integrationen, Datenlage und Betriebsvorgaben. Die nächsten Schritte werden nachvollziehbar vereinbart.";

/* ────────────────────────────────────────────────────────────────────────────
 * AGI WORKS — /leistungen/* (technische Umsetzung, Architektur, Engineering)
 * ──────────────────────────────────────────────────────────────────────────── */

const AGI_PAGES: MoneyPage[] = [
  {
    id: "agiworks:/leistungen/webseiten-erstellen-lassen",
    brand: "agiworks",
    collection: "leistungen",
    slug: "webseiten-erstellen-lassen",
    path: "/leistungen/webseiten-erstellen-lassen",
    systemSlug: "premium-websysteme",
    serviceName: "Webseiten-Entwicklung",
    title: "Webseiten erstellen lassen | AGI Works",
    description:
      "AGI Works entwickelt individuelle, performante Webseiten und Websysteme mit sauberer Architektur, SEO-Basis und integriertem Lead-Weg — kein Baukasten.",
    eyebrow: "Leistung",
    h1: "Individuelle Webseiten und Websysteme entwickeln lassen",
    heroIntro:
      "Wir bauen keine Templates, sondern individuelle Websysteme mit sauberer technischer Basis, guter Ladezeit und einem klaren Weg von der Seite zur Anfrage.",
    aeoAnswer:
      "Eine individuell entwickelte Webseite ist sinnvoll, wenn Baukasten und Theme an ihre Grenzen stoßen: eigene Struktur, eigene Komponenten, saubere Performance und ein integriertes Anfrage-System. AGI Works entwickelt die Seite als Codebasis, die wartbar bleibt und mitwächst. Für Unternehmen, die ihre Website als System statt als Visitenkarte verstehen. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    problem:
      "Baukasten-Seiten werden mit jeder Anforderung langsamer, unübersichtlicher und schwerer zu pflegen. Wichtige Inhalte sind nicht crawlbar, Formulare führen ins Leere und die Marke wirkt austauschbar.",
    solutionIntro:
      "Wir entwickeln ein Websystem entlang Ihrer Nutzerführung — von der Informationsarchitektur bis zur technischen Umsetzung.",
    modules: [
      { title: "Individuelles Frontend", description: "Eigene Komponenten statt Theme-Baukasten, markenkonform umgesetzt." },
      { title: "SEO-Architektur", description: "Serverseitig gerenderte Inhalte, saubere Struktur, Core Web Vitals im Blick." },
      { title: "Lead-Strecke", description: "Kontakt- und Anfrageformulare mit serverseitiger Validierung." },
      { title: "CMS-Anbindung", description: "Redaktionelle Pflege ohne Entwicklerabhängigkeit." },
      { title: "Rechtstexte & Consent", description: "Impressum, Datenschutz und Cookie-Consent sauber eingebunden." },
      { title: "Analytics-Basis", description: "Ziel- und Ereignismessung als Grundlage für Optimierung." },
    ],
    approach: [
      "Komponentenarchitektur in Next.js mit klarer Trennung von Server- und Client-Logik",
      "Serverseitiges Rendern der SEO-Kerninhalte für Crawlbarkeit",
      "Bild- und Font-Optimierung für stabile Ladezeiten",
      "Barrierearme, semantische HTML-Struktur",
      "Wartbare Codebasis mit dokumentierter Struktur",
    ],
    industries: ["Dienstleister", "B2B-Unternehmen", "Kanzleien & Praxen", "Handwerk & Mittelstand"],
    decision: {
      suitable: [
        "Sie brauchen eine eigene Struktur, die kein Theme abbildet",
        "Die Seite soll messbar Anfragen erzeugen",
        "Sie wollen Inhalte selbst pflegen können",
      ],
      notSuitable: [
        "Sie brauchen nur eine einfache Ein-Seiten-Visitenkarte ohne Wachstumsanspruch",
      ],
      alternative: "Für eine reine Visitenkarte ist ein etablierter Baukasten oft günstiger und ausreichend.",
    },
    costNote:
      "Der Projektkorridor hängt von Seitenzahl, individuellen Komponenten, CMS-Umfang und Integrationen ab. Den konkreten Bedarf und den Kostenrahmen klären wir im Erstgespräch.",
    process: [
      { title: "Analyse", description: "Ziele, Zielgruppe und Anforderungen an Struktur und Inhalte klären." },
      { title: "Konzept", description: "Informationsarchitektur, Seitenstruktur und Komponenten festlegen." },
      { title: "Umsetzung", description: "Frontend, CMS und Formularlogik entwickeln." },
      { title: "Test & Launch", description: "Performance, Rechtstexte und Tracking prüfen, dann live." },
      { title: "Optimierung", description: "Auf Basis der Messdaten iterativ verbessern." },
    ],
    faq: [
      { question: "Ist das ein Baukasten oder individuell?", answer: "Individuell: Wir entwickeln eine eigene Codebasis mit eigenen Komponenten, keine Theme-Konfiguration." },
      { question: "Kann ich Inhalte selbst pflegen?", answer: "Ja, über eine CMS-Anbindung pflegen Sie Texte und Bilder eigenständig, ohne Entwickler." },
      { question: "Ist die Seite für Suchmaschinen optimiert?", answer: "Die technische SEO-Basis ist Teil der Umsetzung: serverseitiges Rendering, saubere Struktur und gute Ladezeiten." },
      { question: "Wie lange dauert ein Projekt?", answer: "Das hängt vom Umfang ab. Nach der Analyse erhalten Sie einen realistischen Zeit- und Projektkorridor." },
      { question: "Sind Datenschutz und Impressum enthalten?", answer: "Ja, Rechtstexte und ein Cookie-Consent werden sauber eingebunden; die inhaltliche Prüfung erfolgt mit Ihnen." },
    ],
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/softwareentwicklung", "/beratung", "/systemanalyse", "/kontakt"],
    tags: ["Webseite", "Frontend", "SEO"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/web-app-entwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "web-app-entwicklung",
    path: "/leistungen/web-app-entwicklung",
    serviceName: "Web-App-Entwicklung",
    title: "Web-App entwickeln lassen | AGI Works",
    description:
      "Web-App entwickeln lassen: AGI Works plant individuelle Browser-Anwendungen mit Login, Rollen, Datenmodell, APIs, Tests und kontrolliertem Betrieb.",
    eyebrow: "Leistung",
    h1: "Individuelle Web-Apps entwickeln lassen",
    heroIntro:
      "Wenn eine Website nicht mehr reicht: Wir entwickeln Web-Apps mit Login, Rollen, Datenlogik und Oberflächen, die reale Arbeitsprozesse abbilden.",
    aeoAnswer:
      "Eine individuelle Web-App ist sinnvoll, wenn Mitarbeitende oder Kunden im Browser mit Daten, Rollen und klaren Arbeitsabläufen arbeiten sollen. AGI Works entwickelt dafür Anwendungslogik, Berechtigungen, Datenmodell und APIs passend zu den vorhandenen Systemen. Der Aufwand hängt von Nutzertypen, Funktionsumfang, Integrationen und Betriebsanforderungen ab. Im technischen Erstgespräch wird geklärt, welcher erste Ausbaustand wirtschaftlich und fachlich sinnvoll ist.",
    problem:
      "Prozesse laufen über Excel, E-Mail und Einzeltools. Daten sind doppelt, Rechte unklar und niemand hat eine verlässliche Gesamtsicht.",
    solutionIntro:
      "Wir bauen eine Anwendung mit konsistentem Datenmodell, in der Rollen, Rechte und Abläufe sauber abgebildet sind.",
    modules: [
      { title: "Authentifizierung", description: "Sichere Anmeldung mit Rollen und Rechten." },
      { title: "Datenmodell", description: "Konsistente Datenbankstruktur als stabile Grundlage." },
      { title: "Dashboards", description: "Oberflächen für die tägliche Arbeit statt Datenwust." },
      { title: "Workflows", description: "Abläufe und Statuslogik direkt in der App." },
      { title: "Benachrichtigungen", description: "E-Mail-Trigger bei relevanten Ereignissen." },
      { title: "Admin-Bereich", description: "Verwaltung, Moderation und Auswertung an einem Ort." },
    ],
    approach: [
      "Sauberes relationales Datenmodell als Fundament",
      "Rollen- und Rechtekonzept von Anfang an",
      "Server-Komponenten und API-Routen mit Validierung",
      "Sicherheit: Input-Validierung, Zugriffsschutz, keine Secrets im Frontend",
      "Skalierbare Struktur für spätere Module",
    ],
    industries: ["Dienstleister mit Prozessen", "Agenturen", "Bildung & Kurse", "Interne Tools im Mittelstand"],
    decision: {
      suitable: [
        "Nutzer sollen sich anmelden und Daten verwalten",
        "Es gibt wiederkehrende Prozesse mit Status und Rollen",
        "Standardsoftware bildet Ihren Ablauf nicht ab",
      ],
      notSuitable: ["Sie brauchen nur redaktionelle Inhalte ohne Nutzerkonten"],
      alternative: "Für reine Inhalte reicht ein Websystem mit CMS statt einer Web-App.",
    },
    costNote:
      "Der Projektkorridor richtet sich nach Modulen, Rollen, Integrationen und Datenkomplexität. Eine konkrete Einordnung folgt nach der Bedarfsanalyse im Erstgespräch.",
    process: [
      { title: "Analyse", description: "Prozesse, Rollen und Datenobjekte aufnehmen." },
      { title: "Architektur", description: "Datenmodell und Systemdesign festlegen." },
      { title: "Umsetzung", description: "Frontend, Backend und Datenlogik entwickeln." },
      { title: "Testing", description: "Funktionalität, Rechte und Sicherheit prüfen." },
      { title: "Launch & Betrieb", description: "Ausrollen und iterativ erweitern." },
    ],
    faq: [
      { question: "Was gehört vor dem Web-App-Start in die Sicherheitsprüfung?", answer: "Rollen und Berechtigungen, Eingabevalidierung, Session-Schutz, API-Zugriffe sowie automatisierte und manuelle Tests." },
      { question: "Welche Angaben brauchen Sie, um eine Web-App entwickeln zu lassen?", answer: "Hilfreich sind die betroffenen Nutzergruppen, der wichtigste Ablauf, vorhandene Datenquellen, Integrationspartner und Anforderungen an Rollen, Sicherheit und Betrieb. Daraus wird der erste Projektumfang abgeleitet." },
      { question: "Was unterscheidet eine Web-App von einer Website?", answer: "Eine Web-App hat Nutzerkonten, Rollen und Datenlogik; sie bildet Prozesse ab, statt nur Inhalte darzustellen." },
      { question: "Welche Technologien setzen Sie ein?", answer: "In der Regel Next.js im Frontend, eine relationale Datenbank und serverseitige APIs mit Validierung." },
      { question: "Ist die App sicher?", answer: "Zugriffsschutz, Eingabevalidierung und ein Rollenkonzept sind fester Bestandteil der Umsetzung." },
      { question: "Kann die App später wachsen?", answer: "Ja, die Architektur ist modular angelegt, sodass weitere Module ergänzt werden können." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, in der wir den konkreten Funktionsumfang und den Projektkorridor bestimmen." },
    ],
    relatedPaths: ["/wissen/softwareprojekt-anforderungen-vorbereiten", "/leistungen/saas-entwicklung", "/leistungen/admin-panel-entwicklung", "/leistungen/api-entwicklung", "/systemanalyse", "/beratung"],
    tags: ["Web-App", "Backend", "Datenmodell"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/saas-entwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "saas-entwicklung",
    path: "/leistungen/saas-entwicklung",
    serviceName: "SaaS-Entwicklung",
    title: "SaaS-Plattform entwickeln lassen | AGI Works",
    description:
      "AGI Works entwickelt SaaS-Plattformen mit Mandantenfähigkeit, Aborollen, Self-Service-Onboarding und Zahlungsanbindung — technisch sauber und skalierbar.",
    eyebrow: "Leistung",
    h1: "SaaS-Plattform entwickeln lassen",
    heroIntro:
      "Aus einer Idee ein Produkt machen: Wir entwickeln mandantenfähige SaaS-Plattformen mit Onboarding, Rollen, Abrechnung und Betrieb.",
    aeoAnswer:
      "SaaS-Entwicklung ist sinnvoll, wenn Sie eine Software als wiederkehrendes Produkt mit mehreren Kunden anbieten wollen. AGI Works baut die Plattform mandantenfähig auf, mit Self-Service-Onboarding, Rollen und Zahlungsanbindung. Geeignet für Gründer und Unternehmen mit einem klaren Produktkern. Der nächste Schritt ist eine Systemanalyse zur Klärung von Datenmodell und MVP-Umfang.",
    problem:
      "Ein SaaS-Produkt scheitert oft nicht an der Idee, sondern an der Architektur: fehlende Mandantentrennung, unklare Rollen und keine saubere Abrechnung machen Skalierung teuer.",
    solutionIntro:
      "Wir entwickeln die Plattform mit sauberer Mandantentrennung, Rollenlogik und einer Abrechnungsanbindung, die mitwächst.",
    modules: [
      { title: "Mandantenfähigkeit", description: "Saubere Datentrennung pro Kunde/Organisation." },
      { title: "Onboarding", description: "Self-Service-Registrierung und Einrichtung." },
      { title: "Rollen & Teams", description: "Berechtigungen auf Nutzer- und Teamebene." },
      { title: "Abrechnung", description: "Anbindung an Zahlungsanbieter und Abomodelle." },
      { title: "Admin-Konsole", description: "Verwaltung, Nutzung und Support-Sicht." },
      { title: "Nutzungs-Metriken", description: "Technische Auswertung realer Nutzung." },
    ],
    approach: [
      "Mandantenmodell und Datenisolierung als Architekturgrundlage",
      "MVP-Zuschnitt: erst der Produktkern, dann Ausbau",
      "Zahlungsanbindung (z. B. Stripe) serverseitig und abgesichert",
      "Observability und Betriebssicht von Beginn an",
      "Skalierbare Infrastruktur mit klaren Deployments",
    ],
    industries: ["Software-Gründer", "B2B-Produktteams", "Branchenspezialisten", "Agenturen mit Produktidee"],
    decision: {
      suitable: [
        "Sie wollen Software als wiederkehrendes Produkt anbieten",
        "Mehrere Kunden nutzen dieselbe Anwendung getrennt",
        "Sie brauchen Onboarding und Abrechnung",
      ],
      notSuitable: ["Sie brauchen eine interne Anwendung für nur ein Unternehmen"],
      alternative: "Für einen einzelnen internen Anwendungsfall ist eine Web-App der direktere Weg.",
    },
    costNote:
      "Der Projektkorridor hängt vom MVP-Umfang, der Mandantenlogik und der Abrechnung ab. Wir empfehlen einen schlanken Produktkern als Start.",
    process: [
      { title: "Produkt-Analyse", description: "Kernnutzen, Zielkunden und MVP-Umfang klären." },
      { title: "Architektur", description: "Mandantenmodell, Rollen und Abrechnung entwerfen." },
      { title: "MVP-Umsetzung", description: "Den Produktkern produktionsreif bauen." },
      { title: "Test & Launch", description: "Sicherheit, Abrechnung und Onboarding prüfen." },
      { title: "Iteration", description: "Auf Basis realer Nutzung ausbauen." },
    ],
    faq: [
      { question: "Was bedeutet mandantenfähig?", answer: "Jeder Kunde arbeitet in seiner eigenen, sauber getrennten Datenumgebung innerhalb derselben Plattform." },
      { question: "Sollten wir mit einem MVP starten?", answer: "Ja, ein schlanker Produktkern reduziert Risiko und Kosten und liefert früh echtes Nutzerfeedback." },
      { question: "Wie funktioniert die Abrechnung?", answer: "Über eine serverseitige Anbindung an einen Zahlungsanbieter mit Abomodellen und Rollen." },
      { question: "Ist die Plattform skalierbar?", answer: "Die Architektur ist auf Wachstum ausgelegt; Datenmodell und Infrastruktur werden entsprechend geplant." },
      { question: "Wie beginnen wir?", answer: "Mit einer Systemanalyse, die Produktkern, Datenmodell und Projektkorridor definiert." },
    ],
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/api-entwicklung", "/leistungen/softwareentwicklung", "/systemanalyse", "/kontakt"],
    tags: ["SaaS", "Plattform", "Skalierung"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/erp-system-entwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "erp-system-entwicklung",
    path: "/leistungen/erp-system-entwicklung",
    systemSlug: "erp-systeme",
    serviceName: "ERP-System-Entwicklung",
    title: "ERP-System entwickeln lassen | AGI Works",
    description:
      "AGI Works entwickelt individuelle ERP-Systeme, die Kunden, Projekte, Finanzen und Ressourcen in einer Betriebszentrale mit Rollen und Live-Reports bündeln.",
    eyebrow: "Leistung",
    h1: "Individuelles ERP-System entwickeln lassen",
    heroIntro:
      "Ein ERP, das Ihre Prozesse abbildet statt umgekehrt: Kunden, Projekte, Finanzen und Ressourcen in einer konsistenten Betriebszentrale.",
    aeoAnswer:
      "Ein individuelles ERP lohnt sich, wenn Standardsoftware Ihre Abläufe nicht abbildet und Daten über getrennte Werkzeuge verstreut sind. AGI Works entwickelt eine rollenbasierte Betriebszentrale mit gemeinsamer Datenschicht und Live-Reports. Geeignet für Unternehmen mit gewachsenen, spezifischen Prozessen. Der nächste Schritt ist eine Systemanalyse, die die Module und den Projektkorridor bestimmt.",
    problem:
      "Kunden-, Projekt- und Finanzdaten liegen in getrennten Tools. Auswertungen sind manuell, fehleranfällig und immer veraltet, sobald sie fertig sind.",
    solutionIntro:
      "Wir bilden Ihre realen Prozesse in einer konsistenten Datenschicht ab und geben jeder Rolle genau die Sicht, die sie braucht.",
    modules: [
      { title: "CRM-Kern", description: "Kunden, Kontakte und Historie zentral." },
      { title: "Projekte & Aufgaben", description: "Steuerung von Vorgängen und Ressourcen." },
      { title: "Finanzobjekte", description: "Angebote, Rechnungen und offene Posten." },
      { title: "Rollen & Rechte", description: "Feingranulare Zugriffe pro Bereich." },
      { title: "Dokumente", description: "Zentrale, nachvollziehbare Ablage." },
      { title: "Live-Reports", description: "Kennzahlen als Entscheidungsgrundlage." },
    ],
    approach: [
      "Prozessaufnahme vor Featureliste",
      "Eine konsistente relationale Datenschicht statt Insellösungen",
      "Rollen- und Rechtemodell über alle Module",
      "Auswertungslogik direkt auf der Datenbasis",
      "Migrationspfad aus bestehenden Tools",
    ],
    industries: ["Mittelstand", "Dienstleistungsbetriebe", "Produktion & Handel", "Projektgetriebene Unternehmen"],
    decision: {
      suitable: [
        "Ihre Prozesse sind spezifisch und gewachsen",
        "Daten liegen in getrennten Tools ohne gemeinsame Sicht",
        "Sie brauchen rollenbasierte Auswertungen",
      ],
      notSuitable: ["Standardprozesse, die eine etablierte ERP-Software vollständig abdeckt"],
      alternative: "Wenn eine Standardlösung Ihre Prozesse zu 100 Prozent abbildet, ist deren Einführung wirtschaftlicher.",
    },
    costNote:
      "Der Projektkorridor hängt von Modulanzahl, Migration, Schnittstellen und Rollenkomplexität ab. Ein modularer Start reduziert das Anfangsrisiko.",
    process: [
      { title: "Prozessanalyse", description: "Abläufe, Rollen und Datenobjekte aufnehmen." },
      { title: "Architektur", description: "Datenmodell und Modulschnitt festlegen." },
      { title: "Modul-Umsetzung", description: "Kernmodule zuerst produktionsreif bauen." },
      { title: "Migration & Test", description: "Bestandsdaten übernehmen und prüfen." },
      { title: "Rollout", description: "Schrittweise einführen und erweitern." },
    ],
    faq: [
      { question: "Wie werden Datenkonflikte bei ERP-Integrationen vermieden?", answer: "Durch festgelegte führende Systeme, eindeutige Identifikatoren und dokumentierte Synchronisationsregeln." },
      { question: "Warum ein individuelles ERP statt Standardsoftware?", answer: "Wenn Ihre Prozesse spezifisch sind, bildet ein individuelles ERP sie exakt ab, statt Sie in fremde Abläufe zu zwingen." },
      { question: "Können Bestandsdaten übernommen werden?", answer: "Ja, ein Migrationspfad aus vorhandenen Tools ist Teil des Projekts." },
      { question: "Muss alles auf einmal gebaut werden?", answer: "Nein, ein modularer Aufbau mit Kernmodulen zuerst reduziert Risiko und Kosten." },
      { question: "Wie werden Zugriffe geregelt?", answer: "Über ein Rollen- und Rechtemodell, das jeder Rolle genau die passende Sicht gibt." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die Prozesse, Module und den Projektkorridor klärt." },
    ],
    relatedPaths: ["/wissen/erp-schnittstellen-systemintegration-planen", "/leistungen/crm-system-entwicklung", "/leistungen/admin-panel-entwicklung", "/leistungen/api-entwicklung", "/systemanalyse", "/kontakt"],
    tags: ["ERP", "Architektur", "Betrieb"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/crm-system-entwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "crm-system-entwicklung",
    path: "/leistungen/crm-system-entwicklung",
    serviceName: "CRM-System-Entwicklung",
    title: "CRM-System entwickeln lassen | AGI Works",
    description:
      "AGI Works entwickelt individuelle CRM-Systeme mit Pipeline, Rollen, Aufgaben und Schnittstellen — passgenau auf Ihren Vertriebs- und Kundenprozess.",
    eyebrow: "Leistung",
    h1: "Individuelles CRM-System entwickeln lassen",
    heroIntro:
      "Ein CRM, das Ihrem Prozess folgt: Kontakte, Pipeline, Aufgaben und Verantwortlichkeiten in einem System, das zu Ihrem Vertrieb passt.",
    aeoAnswer:
      "Ein individuelles CRM ist sinnvoll, wenn Standard-Tools zu starr sind oder Ihr Prozess besondere Felder, Rollen und Abläufe braucht. AGI Works entwickelt das CRM als Teil Ihrer Systemlandschaft, mit sauberen Schnittstellen. Geeignet für Teams mit spezifischem Vertriebs- oder Betreuungsprozess. Der nächste Schritt ist eine Systemanalyse zur Definition von Pipeline und Datenmodell.",
    problem:
      "Kundendaten liegen in Tabellen und Postfächern. Niemand weiß, welcher Lead in welchem Status ist, und Nachfassen passiert zufällig statt systematisch.",
    solutionIntro:
      "Wir bauen ein CRM, das Ihren realen Prozess abbildet — mit Feldern, Status und Rollen, die zu Ihrem Vertrieb passen.",
    modules: [
      { title: "Kontakt- & Firmenverwaltung", description: "Zentrale, saubere Datenbasis." },
      { title: "Pipeline", description: "Status, Phasen und Priorität pro Vorgang." },
      { title: "Aufgaben & Wiedervorlage", description: "Nachfassen wird systematisch." },
      { title: "Rollen & Sichtbarkeit", description: "Jede Rolle sieht das Passende." },
      { title: "Schnittstellen", description: "Anbindung an E-Mail, Kalender und weitere Systeme." },
      { title: "Auswertung", description: "Conversion und Quellen nachvollziehbar." },
    ],
    approach: [
      "Datenmodell entlang Ihres realen Vertriebsprozesses",
      "Statuslogik und Automatisierungen serverseitig",
      "Saubere Schnittstellen statt Insellösung",
      "Rollen- und Sichtbarkeitskonzept",
      "Erweiterbar Richtung ERP und Portale",
    ],
    industries: ["Vertriebsteams", "Dienstleister", "Beratungen", "B2B-Unternehmen"],
    decision: {
      suitable: [
        "Ihr Prozess passt nicht in ein Standard-CRM",
        "Sie brauchen eigene Felder, Status und Rollen",
        "Das CRM soll mit anderen Systemen zusammenarbeiten",
      ],
      notSuitable: ["Ein sehr einfacher Standardvertrieb ohne Sonderanforderungen"],
      alternative: "Für Standardanforderungen kann ein etabliertes CRM-Produkt der schnellere Weg sein.",
    },
    costNote:
      "Der Projektkorridor richtet sich nach Pipeline-Komplexität, Rollen, Automatisierungen und Schnittstellen. Den passenden Kostenrahmen klären wir gemeinsam im Beratungsgespräch.",
    process: [
      { title: "Analyse", description: "Vertriebsprozess, Felder und Rollen aufnehmen." },
      { title: "Datenmodell", description: "Kontakte, Vorgänge und Status modellieren." },
      { title: "Umsetzung", description: "Pipeline, Aufgabenlogik und Schnittstellen bauen." },
      { title: "Test", description: "Rechte, Automatisierungen und Daten prüfen." },
      { title: "Rollout", description: "Einführen und mit dem Team verfeinern." },
    ],
    faq: [
      { question: "Warum kein Standard-CRM?", answer: "Wenn Ihr Prozess eigene Felder, Status und Rollen braucht, bildet ein individuelles CRM ihn präziser ab und lässt sich sauber anbinden." },
      { question: "Kann das CRM an andere Systeme andocken?", answer: "Ja, Schnittstellen zu E-Mail, Kalender und weiteren Systemen sind Teil der Umsetzung." },
      { question: "Lässt sich das CRM später erweitern?", answer: "Ja, es kann Richtung ERP, Portale oder Automatisierung ausgebaut werden." },
      { question: "Wie werden Rechte geregelt?", answer: "Über ein Rollen- und Sichtbarkeitskonzept, das den Datenzugriff pro Rolle steuert." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die Pipeline, Datenmodell und Projektkorridor definiert." },
    ],
    relatedPaths: ["/leistungen/erp-system-entwicklung", "/leistungen/kundenportal-entwicklung", "/leistungen/api-entwicklung", "/systemanalyse", "/kontakt"],
    tags: ["CRM", "Vertrieb", "Datenmodell"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/admin-panel-entwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "admin-panel-entwicklung",
    path: "/leistungen/admin-panel-entwicklung",
    serviceName: "Admin-Panel-Entwicklung",
    title: "Admin-Panel entwickeln lassen | AGI Works",
    description:
      "AGI Works entwickelt individuelle Admin-Panels und Backoffice-Oberflächen mit Rollen, Freigaben, Auswertungen und Moderation für Ihre internen Prozesse.",
    eyebrow: "Leistung",
    h1: "Individuelles Admin-Panel entwickeln lassen",
    heroIntro:
      "Die Steuerzentrale hinter Ihrem System: ein Admin-Panel, mit dem Ihr Team Inhalte, Nutzer und Prozesse sicher verwaltet.",
    aeoAnswer:
      "Ein individuelles Admin-Panel lohnt sich, wenn Ihr Team Daten, Nutzer und Abläufe zentral steuern muss. AGI Works baut das Backoffice passgenau zu Ihren Prozessen, mit Rollen, Freigaben und Auswertungen. Geeignet für Betreiber von Plattformen, Portalen und Web-Apps. Der nächste Schritt ist eine Systemanalyse zur Klärung der benötigten Verwaltungssichten.",
    problem:
      "Verwaltung passiert direkt in der Datenbank oder über verstreute Tools. Das ist fehleranfällig, unsicher und für Nicht-Techniker kaum nutzbar.",
    solutionIntro:
      "Wir bauen ein Backoffice, das genau die Verwaltungsfälle abbildet, die Ihr Team wirklich braucht — sicher und übersichtlich.",
    modules: [
      { title: "Datenverwaltung", description: "Anlegen, Bearbeiten und Prüfen von Datensätzen." },
      { title: "Nutzer & Rollen", description: "Rechte und Zugriffe zentral steuern." },
      { title: "Freigabe-Workflows", description: "Prüf- und Genehmigungsschritte abbilden." },
      { title: "Moderation", description: "Inhalte prüfen, sperren oder freigeben." },
      { title: "Auswertungen", description: "Kennzahlen und Aktivitäten im Blick." },
      { title: "Protokolle", description: "Nachvollziehbare Änderungen und Aktionen." },
    ],
    approach: [
      "Rechtemodell als Kern des Panels",
      "Serverseitige Validierung aller Aktionen",
      "Klare, aufgabenorientierte Oberflächen",
      "Audit-Log für nachvollziehbare Änderungen",
      "Erweiterbar für neue Verwaltungsfälle",
    ],
    industries: ["Plattformbetreiber", "Portale & Marktplätze", "Web-App-Betreiber", "Interne Teams"],
    decision: {
      suitable: [
        "Ihr Team verwaltet Daten, Nutzer oder Inhalte",
        "Sie brauchen Rollen und Freigaben",
        "Verwaltung soll sicher und nachvollziehbar sein",
      ],
      notSuitable: ["Ein winziger Datenbestand, der ohne Oberfläche gepflegt werden kann"],
      alternative: "Bei minimalem Verwaltungsbedarf kann ein einfaches Tabellen-Tool zunächst genügen.",
    },
    costNote:
      "Der Projektkorridor hängt von der Zahl der Verwaltungssichten, Rollen und Workflows ab. Häufig entsteht das Panel gemeinsam mit einer Web-App oder Plattform.",
    process: [
      { title: "Analyse", description: "Verwaltungsfälle, Rollen und Freigaben aufnehmen." },
      { title: "Konzept", description: "Sichten, Rechte und Workflows festlegen." },
      { title: "Umsetzung", description: "Oberflächen, Logik und Audit-Log bauen." },
      { title: "Test", description: "Rechte und Aktionen absichern und prüfen." },
      { title: "Rollout", description: "Einführen und um neue Fälle erweitern." },
    ],
    faq: [
      { question: "Wofür braucht man ein Admin-Panel?", answer: "Damit Ihr Team Daten, Nutzer und Prozesse sicher verwalten kann, ohne direkt in der Datenbank zu arbeiten." },
      { question: "Ist das Panel sicher?", answer: "Ja, jede Aktion wird serverseitig geprüft und über ein Rollen- und Rechtekonzept abgesichert." },
      { question: "Werden Änderungen protokolliert?", answer: "Ein Audit-Log macht Änderungen nachvollziehbar." },
      { question: "Gehört das zu einer Web-App?", answer: "Oft ja: Das Admin-Panel ist die Verwaltungssicht zu einer Web-App, Plattform oder einem Portal." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die die Verwaltungsfälle und den Projektkorridor klärt." },
    ],
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/kundenportal-entwicklung", "/leistungen/erp-system-entwicklung", "/systemanalyse", "/kontakt"],
    tags: ["Admin", "Backoffice", "Rollen"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/api-entwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "api-entwicklung",
    path: "/leistungen/api-entwicklung",
    systemSlug: "schnittstellen-integrationen",
    serviceName: "API- & Integrationsentwicklung",
    title: "ERP-Integration & API-Entwicklung | AGI Works",
    description:
      "AGI Works entwickelt ERP- und CRM-Schnittstellen: API-Verträge, Datenmapping, sichere Authentifizierung, idempotente Verarbeitung und Monitoring.",
    eyebrow: "Leistung",
    h1: "API-Entwicklung und System-Integrationen",
    heroIntro:
      "Damit Ihre Systeme als Einheit arbeiten: Wir entwickeln APIs und verbinden Zahlungsanbieter, CRM, Kalender und beliebige Dienste stabil miteinander.",
    aeoAnswer:
      "ERP-Integration verbindet bestehende Unternehmenssysteme über definierte Schnittstellen und nachvollziehbare Datenflüsse. AGI Works konzipiert APIs, Datenmapping, Authentifizierung sowie Fehler- und Wiederholungsstrategien, damit fachliche Zustände konsistent bleiben. Für Unternehmen mit ERP-, CRM-, Shop- oder Abrechnungssystemen prüfen wir zuerst Datenhoheit, Änderungsrisiken und Verantwortlichkeiten. Danach wird der Integrationsumfang in einem technischen Erstgespräch eingegrenzt.",
    problem:
      "Zwischen Shop, CRM, Buchhaltung und Kalender werden Daten manuell übertragen. Das kostet Zeit, erzeugt Fehler und blockiert Automatisierung.",
    solutionIntro:
      "Wir verbinden Ihre Systeme mit robusten Schnittstellen, die auch bei Fehlern kontrolliert reagieren.",
    modules: [
      { title: "REST- & Webhook-APIs", description: "Eigene und angebundene Schnittstellen." },
      { title: "Zahlungsanbindung", description: "Stripe, PayPal und SEPA serverseitig." },
      { title: "CRM-/ERP-Integration", description: "Datenobjekte, führende Systeme und Synchronisationsregeln vor der Kopplung festlegen." },
      { title: "Kalender & E-Mail", description: "Google, iCal, IMAP/SMTP anbinden." },
      { title: "Datenmapping", description: "Felder, Identifikatoren, Validierung und fachliche Konflikte dokumentiert abbilden." },
      { title: "Fehler-Handling", description: "Idempotente Wiederholung, Dead-Letter-Fälle, Monitoring und Alarmierung einplanen." },
    ],
    approach: [
      "Klare Vertragsdefinition der Schnittstellen",
      "Idempotenz und automatische Wiederholung",
      "DSGVO-konforme, verschlüsselte Übertragung",
      "Monitoring und Alarmierung bei Fehlern",
      "Keine Secrets im Frontend",
    ],
    industries: ["E-Commerce", "Dienstleister mit Tools", "SaaS-Betreiber", "Mittelstand"],
    decision: {
      suitable: [
        "Systeme sollen automatisch Daten austauschen",
        "Manuelle Übertragung kostet Zeit und erzeugt Fehler",
        "Sie brauchen Zahlungs- oder Kalenderanbindungen",
      ],
      notSuitable: ["Es gibt nur ein einziges System ohne Austauschbedarf"],
      alternative: "Ohne Integrationsbedarf ist eine Schnittstelle nicht nötig; der Fokus liegt dann auf dem Kernsystem.",
    },
    costNote:
      "Der Projektkorridor hängt von Anzahl und Komplexität der Schnittstellen sowie den Anforderungen an Ausfallsicherheit ab.",
    process: [
      { title: "Analyse", description: "Datenflüsse und Systeme kartieren." },
      { title: "Design", description: "Schnittstellenverträge und Mapping definieren." },
      { title: "Umsetzung", description: "APIs, Anbindungen und Fehler-Handling bauen." },
      { title: "Test", description: "Last, Fehlerfälle und Sicherheit prüfen." },
      { title: "Betrieb", description: "Monitoring aufsetzen und stabil halten." },
    ],
    faq: [
      { question: "Wie werden API-Aufrufe gegen doppelte Verarbeitung abgesichert?", answer: "Über Idempotenzschlüssel, sichere Wiederholungen und ein überprüfbares Fehlerprotokoll." },
      { question: "Wie funktioniert eine ERP-Integration ohne doppelte Buchungen?", answer: "Durch eindeutige Vorgangs-IDs, idempotente Verarbeitung, geprüfte Datenzuordnung und überwachte Wiederholungen lassen sich doppelte Aktionen und unbemerkte Übertragungsfehler reduzieren." },
      { question: "Was ist eine Integration?", answer: "Eine kontrollierte Verbindung zwischen Systemen, über die Daten automatisch und zuverlässig ausgetauscht werden." },
      { question: "Was passiert bei Fehlern?", answer: "Die Schnittstellen haben ein definiertes Fehler-Handling mit automatischer Wiederholung und Alarmierung." },
      { question: "Ist die Übertragung sicher?", answer: "Ja, die Übertragung erfolgt verschlüsselt und DSGVO-konform, ohne Secrets im Frontend." },
      { question: "Welche Dienste lassen sich anbinden?", answer: "Zahlungsanbieter, CRM/ERP, Kalender, E-Mail und beliebige Systeme mit API oder Webhook." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die Datenflüsse und den Projektkorridor klärt." },
    ],
    relatedPaths: ["/wissen/erp-schnittstellen-systemintegration-planen", "/leistungen/web-app-entwicklung", "/leistungen/saas-entwicklung", "/leistungen/erp-system-entwicklung", "/systemanalyse", "/beratung"],
    tags: ["API", "Integration", "Schnittstellen"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/kundenportal-entwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "kundenportal-entwicklung",
    path: "/leistungen/kundenportal-entwicklung",
    serviceName: "Kundenportal-Entwicklung",
    title: "Kundenportal entwickeln lassen | AGI Works",
    description:
      "AGI Works entwickelt sichere Kundenportale mit Login, Dokumenten, Status und Self-Service — für weniger Rückfragen und mehr Transparenz.",
    eyebrow: "Leistung",
    h1: "Sicheres Kundenportal entwickeln lassen",
    heroIntro:
      "Ein Ort für Ihre Kunden: Dokumente, Status, Anfragen und Self-Service in einem geschützten Portal statt in E-Mail-Ketten.",
    aeoAnswer:
      "Ein Kundenportal ist sinnvoll, wenn Kunden auf Dokumente, Status oder Leistungen selbst zugreifen sollen. AGI Works entwickelt das Portal mit sicherem Login, Rollen und Self-Service-Funktionen. Geeignet für Dienstleister und Betriebe mit wiederkehrender Kundenkommunikation. Der nächste Schritt ist eine Systemanalyse zur Definition der Portalfunktionen.",
    problem:
      "Kunden fragen Status und Dokumente per E-Mail an. Das bindet Zeit, Informationen sind verstreut und nichts ist zentral nachvollziehbar.",
    solutionIntro:
      "Wir bauen ein geschütztes Portal, in dem Kunden selbst finden, was sie brauchen — und Ihr Team entlastet wird.",
    modules: [
      { title: "Sicherer Login", description: "Geschützter Zugang mit Rollen." },
      { title: "Dokumente", description: "Bereitstellung und Download an einem Ort." },
      { title: "Status & Vorgänge", description: "Transparenter Stand pro Kunde." },
      { title: "Anfragen", description: "Strukturierte Kommunikation statt E-Mail-Chaos." },
      { title: "Self-Service", description: "Stammdaten und Aktionen eigenständig." },
      { title: "Benachrichtigungen", description: "Automatische Hinweise bei Updates." },
    ],
    approach: [
      "Zugriffsschutz und Rollen als Fundament",
      "Datentrennung pro Kunde",
      "Serverseitige Validierung und sichere Uploads",
      "Klare, einfache Oberfläche für Endkunden",
      "Anbindung an CRM/ERP möglich",
    ],
    industries: ["Dienstleister", "Kanzleien & Beratungen", "Agenturen", "B2B-Betriebe"],
    decision: {
      suitable: [
        "Kunden sollen selbst auf Dokumente und Status zugreifen",
        "Kundenkommunikation ist wiederkehrend",
        "Sie wollen Rückfragen reduzieren",
      ],
      notSuitable: ["Sie haben nur sehr wenige, einmalige Kundenkontakte"],
      alternative: "Bei sehr wenigen Kontakten kann direkte Kommunikation ausreichend und günstiger sein.",
    },
    costNote:
      "Der Projektkorridor hängt von Funktionsumfang, Rollen und Anbindung an bestehende Systeme ab.",
    process: [
      { title: "Analyse", description: "Portalfunktionen und Rollen aufnehmen." },
      { title: "Konzept", description: "Sichten, Rechte und Self-Service festlegen." },
      { title: "Umsetzung", description: "Login, Dokumente und Vorgänge bauen." },
      { title: "Test", description: "Sicherheit, Datentrennung und Uploads prüfen." },
      { title: "Rollout", description: "Einführen und erweitern." },
    ],
    faq: [
      { question: "Was bringt ein Kundenportal?", answer: "Kunden greifen selbst auf Dokumente und Status zu, was Rückfragen reduziert und Transparenz schafft." },
      { question: "Sind die Daten getrennt?", answer: "Ja, jeder Kunde sieht ausschließlich seine eigenen Daten über ein Rollen- und Rechtekonzept." },
      { question: "Kann das Portal an unser CRM andocken?", answer: "Ja, eine Anbindung an CRM- oder ERP-Systeme ist möglich." },
      { question: "Sind Uploads sicher?", answer: "Uploads werden serverseitig auf Typ und Größe geprüft und abgesichert." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die die Portalfunktionen und den Projektkorridor definiert." },
    ],
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/admin-panel-entwicklung", "/leistungen/crm-system-entwicklung", "/systemanalyse", "/kontakt"],
    tags: ["Portal", "Self-Service", "Sicherheit"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/leistungen/softwareentwicklung",
    brand: "agiworks",
    collection: "leistungen",
    slug: "softwareentwicklung",
    path: "/leistungen/softwareentwicklung",
    serviceName: "Individuelle Softwareentwicklung",
    title: "Individuelle Softwareentwicklung | AGI Works",
    description:
      "Individuelle Software entwickeln lassen: AGI Works plant Web-Apps, ERP- und CRM-Systeme mit nachvollziehbarer Architektur, Sicherheit und Betrieb.",
    eyebrow: "Leistung",
    h1: "Individuelle Softwareentwicklung für Unternehmen",
    heroIntro:
      "Software, die zu Ihrem Prozess passt: Wir entwickeln individuelle Anwendungen von der Architektur bis zum Betrieb — produktionsreif und wartbar.",
    aeoAnswer:
      "Individuelle Softwareentwicklung lohnt sich, wenn Standardsoftware entscheidende Unternehmensabläufe nicht ausreichend abbildet. AGI Works klärt zunächst Ziele, Nutzerrollen, Datenflüsse und Integrationen und leitet daraus einen begrenzten ersten Ausbaustand ab. Architektur, Entwicklung, Qualitätssicherung und Betrieb werden passend zum Projekt geplant. Für eine belastbare Aufwandsschätzung sind vorhandene Systeme, Anforderungen und Verantwortlichkeiten im Erstgespräch zu prüfen.",
    problem:
      "Prozesse werden aus Standardtools zusammengestückelt. Das erzeugt Medienbrüche, doppelte Daten und Grenzen, die mit dem Unternehmen nicht mitwachsen.",
    solutionIntro:
      "Wir entwickeln die passende Anwendung entlang Ihrer Prozesse — mit einer Architektur, die trägt und mitwächst.",
    modules: [
      { title: "Architektur", description: "Anforderungen, Systemgrenzen und Datenflüsse als dokumentierte Entscheidungen vor der Umsetzung." },
      { title: "Datenmodell", description: "Konsistente, saubere Datenbasis." },
      { title: "Anwendungslogik", description: "Ihre Abläufe als Software abgebildet." },
      { title: "Integrationen", description: "ERP, CRM und externe APIs über definierte Verträge, Fehlerroutinen und sichere Authentifizierung anbinden." },
      { title: "Sicherheit", description: "Zugriffsschutz und Validierung." },
      { title: "Betrieb", description: "Deployment, Monitoring, Backups, Wiederherstellung und vereinbarte Wartung berücksichtigen." },
    ],
    approach: [
      "Prozess- und Anforderungsanalyse zuerst",
      "Saubere, dokumentierte Codebasis",
      "Sicherheit und Performance als Standard",
      "Iterative Lieferung in kurzen Zyklen",
      "Langfristige Wartbarkeit im Fokus",
    ],
    industries: ["Mittelstand", "Dienstleister", "Produkt- und Plattformteams", "Projektgetriebene Betriebe"],
    decision: {
      suitable: [
        "Standardsoftware bildet Ihren Prozess nicht ab",
        "Sie brauchen eine wartbare, wachsende Lösung",
        "Mehrere Systeme sollen zusammenspielen",
      ],
      notSuitable: ["Ein Standardproblem, das eine erprobte Standardsoftware vollständig löst"],
      alternative: "Wenn ein Standardprodukt Ihren Bedarf komplett deckt, ist dessen Einsatz wirtschaftlicher.",
    },
    costNote:
      "Der Projektkorridor hängt von Umfang, Integrationen und Betrieb ab. Ein klar geschnittener erster Ausbaustand reduziert das Risiko.",
    process: [
      { title: "Analyse", description: "Prozesse, Ziele und Rahmen klären." },
      { title: "Architektur", description: "Systemdesign und Datenmodell festlegen." },
      { title: "Umsetzung", description: "In kurzen Zyklen produktionsreif bauen." },
      { title: "Testing", description: "Funktion, Sicherheit und Performance prüfen." },
      { title: "Launch & Betrieb", description: "Ausrollen, überwachen und weiterentwickeln." },
    ],
    faq: [
      { question: "Welche Abnahmekriterien braucht Individualsoftware?", answer: "Prüfbare fachliche Ergebnisse, Rollen- und Rechteprüfungen sowie definierte Integrations- und Sicherheitsanforderungen." },
      { question: "Was kostet es, individuelle Software entwickeln zu lassen?", answer: "Das hängt vor allem von Umfang, Datenmodell, Anzahl der Integrationen, Rollen und Anforderungen an Sicherheit und Betrieb ab. Nach Klärung dieser Punkte lässt sich ein nachvollziehbarer Projektkorridor ableiten." },
      { question: "Wann lohnt sich individuelle Software?", answer: "Wenn Standardsoftware Ihre Prozesse nicht abbildet oder mehrere Systeme sauber zusammenspielen müssen." },
      { question: "Wie behalten wir Kosten im Griff?", answer: "Durch einen klar geschnittenen ersten Ausbaustand und iterative Lieferung statt Big-Bang." },
      { question: "Wem gehört der Code?", answer: "Das wird vertraglich geregelt; Ziel ist eine wartbare Codebasis, die Ihnen langfristig dient." },
      { question: "Wird die Software gewartet?", answer: "Betrieb, Monitoring und Wartung können Teil der Zusammenarbeit sein." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die Umfang, Architektur und Projektkorridor bestimmt." },
    ],
    relatedPaths: ["/wissen/softwareprojekt-anforderungen-vorbereiten", "/leistungen/web-app-entwicklung", "/leistungen/saas-entwicklung", "/leistungen/erp-system-entwicklung", "/beratung", "/systemanalyse"],
    tags: ["Software", "Architektur", "Engineering"],
    approved: true,
    manualIndexApproval: true,
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * NEXCEL AI — /loesungen/* (Systemdesign, KI, Automatisierung, CX, Wachstum)
 * ──────────────────────────────────────────────────────────────────────────── */

const NEXCEL_PAGES: MoneyPage[] = [
  {
    id: "nexcel:/loesungen/ki-systeme",
    brand: "nexcel",
    collection: "loesungen",
    slug: "ki-systeme",
    path: "/loesungen/ki-systeme",
    systemSlug: "ki-automatisierung",
    serviceName: "KI-Systeme",
    title: "KI-Beratung für Unternehmen & KI-Systeme | NEXCEL AI",
    description:
      "KI-Beratung für Unternehmen und Mittelstand: NEXCEL AI priorisiert Prozesse, prüft Daten und Risiken und entwickelt einen umsetzbaren KI-System-Fahrplan.",
    eyebrow: "Lösung",
    h1: "KI-Systeme für Unternehmen",
    heroIntro:
      "KI wird erst nützlich, wenn sie im Prozess sitzt: Wir konzipieren KI-Systeme, die Eingänge verstehen, priorisieren und konkrete Folgeaktionen auslösen.",
    aeoAnswer:
      "KI-Beratung für Unternehmen beginnt nicht mit einem Modell, sondern mit dem konkreten Geschäftsprozess. NEXCEL AI bewertet Aufgaben, Datenquellen, menschliche Freigaben und den erwarteten Nutzen, bevor ein KI-System entworfen wird. Geeignete Fälle reichen von Anfragenklassifizierung bis zur Vorbereitung regelgebundener Folgeaktionen. Eine begrenzte Pilotphase mit Qualitäts- und Sicherheitskriterien zeigt, ob eine Integration in den Unternehmensalltag sinnvoll ist.",
    problem:
      "Anfragen, Dokumente und Nachrichten laufen unstrukturiert ein. Mitarbeitende sortieren, priorisieren und beantworten manuell — jeden Tag aufs Neue.",
    solutionIntro:
      "Wir gestalten ein KI-System, das Eingänge klassifiziert, priorisiert und Entwürfe oder Aktionen nach Ihren Regeln erzeugt.",
    modules: [
      { title: "Eingangsverarbeitung", description: "E-Mails, Formulare und Dokumente automatisch erfassen." },
      { title: "Klassifizierung", description: "Themen und Dringlichkeit erkennen." },
      { title: "Priorisierung", description: "Anfragen nach Geschäftsrelevanz, Frist und definierten Eskalationsregeln sortieren." },
      { title: "Antwort-Entwürfe", description: "Vorschläge nach Ihren Vorgaben." },
      { title: "Aktions-Trigger", description: "Freigegebene Folgeaktionen an CRM, Tickets oder interne Abläufe übergeben." },
      { title: "Zusammenfassungen", description: "Kernaussagen kompakt extrahieren." },
    ],
    approach: [
      "Prozessanalyse: Wo entsteht wiederkehrende Arbeit?",
      "Klare Regeln und menschliche Kontrolle definieren",
      "Datenschutz und Nachvollziehbarkeit einplanen",
      "Messbare Ziele statt vager KI-Versprechen",
      "Technische Umsetzung gemeinsam mit AGI Works",
    ],
    industries: ["Dienstleister", "Kommunikationsintensive Teams", "Beauty & Gesundheit", "Handel & Service"],
    decision: {
      suitable: [
        "Wiederkehrende Aufgaben binden viel Zeit",
        "Es gibt klare Regeln, die sich automatisieren lassen",
        "Sie wollen Entlastung mit menschlicher Kontrolle",
      ],
      notSuitable: ["Sehr seltene, hochindividuelle Einzelfälle ohne Muster"],
      alternative: "Wo keine Muster existieren, ist eine schlanke Prozessverbesserung sinnvoller als KI.",
    },
    costNote:
      "Der Projektkorridor hängt von Umfang, Datenquellen und Integrationstiefe ab. Wir starten mit einem klar abgegrenzten Anwendungsfall.",
    process: [
      { title: "Analyse", description: "Prozesse und Automatisierungspotenziale bewerten." },
      { title: "Konzept", description: "Regeln, Kontrolle und Ziele festlegen." },
      { title: "Umsetzung", description: "System mit AGI Works produktionsreif bauen." },
      { title: "Messung", description: "Wirkung und Qualität überprüfen." },
      { title: "Optimierung", description: "Regeln und Modelle nachschärfen." },
    ],
    faq: [
      { question: "Wie wird die Sicherheit eines KI-Systems vor dem Betrieb geprüft?", answer: "Mit Datenflussanalyse, Rollenmodell, adversarialen Tests, überprüften Modellzugriffen und dokumentierten Risiken." },
      { question: "Was ist bei KI-Beratung im Mittelstand besonders wichtig?", answer: "Entscheidend sind ein kleiner, wirtschaftlich prüfbarer Einstieg, die Nutzung bestehender Systeme, klare Zuständigkeiten, Datenschutz und eine nachvollziehbare Entscheidung darüber, welche Schritte Menschen freigeben müssen." },
      { question: "Was umfasst eine KI-Beratung für Unternehmen?", answer: "Zunächst werden Ziele, Prozesse, Datenquellen und Risiken geprüft. Danach folgen Priorisierung der Anwendungsfälle, Entscheidung über Automatisierung oder Assistenz, ein begrenzter Pilot und eine Bewertung anhand vereinbarter Qualitätskriterien." },
      { question: "Ersetzt KI meine Mitarbeitenden?", answer: "Nein, das Ziel ist Entlastung: Routine wird automatisiert, Entscheidungen bleiben beim Menschen." },
      { question: "Bleibt die Kontrolle beim Team?", answer: "Ja, das System arbeitet nach Ihren Regeln, und kritische Schritte behalten eine menschliche Freigabe." },
      { question: "Wie steht es um den Datenschutz?", answer: "Datenschutz und Nachvollziehbarkeit werden von Beginn an eingeplant." },
      { question: "Wie messen wir den Nutzen?", answer: "Über konkrete, vorab definierte Ziele statt pauschaler Versprechen." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die Potenziale bewertet und einen ersten Anwendungsfall abgrenzt." },
    ],
    relatedPaths: ["/wissen/ki-projekte-datenschutz-sicherheit-planen", "/loesungen/automatisierung", "/loesungen/ki-agenten", "/loesungen/digitale-betriebssysteme", "/systemanalyse", "/beratung"],
    tags: ["KI", "Automatisierung", "Prozess"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/ki-agenten",
    brand: "nexcel",
    collection: "loesungen",
    slug: "ki-agenten",
    path: "/loesungen/ki-agenten",
    serviceName: "KI-Agenten",
    title: "KI-Agenten für Unternehmen · NEXCEL AI",
    description:
      "KI-Agenten für Unternehmen: NEXCEL AI konzipiert Aufgaben, Werkzeugzugriffe, Freigaben, Eskalation und Monitoring für kontrollierte Agentensysteme.",
    eyebrow: "Lösung",
    h1: "KI-Agenten für definierte Aufgaben",
    heroIntro:
      "Ein KI-Agent übernimmt eine klar umrissene Aufgabe von Anfang bis Ende — von der Anfrage bis zur ausgelösten Aktion, nach Ihren Regeln.",
    aeoAnswer:
      "Ein KI-Agent für Unternehmen erledigt eine abgegrenzte Aufgabe mit definierten Werkzeugen und überprüfbaren Grenzen. NEXCEL AI prüft, ob ein Agent gegenüber einem einfachen Workflow tatsächlich sinnvoll ist, und definiert zulässige Aktionen, Datenzugriffe und menschliche Freigaben. Protokollierung, Abbruchbedingungen und Eskalationen werden bereits bei der Konzeption berücksichtigt. Ein begrenzter Pilot dient dazu, Zuverlässigkeit, Kosten und Betrieb unter realistischen Bedingungen zu bewerten.",
    problem:
      "Viele kleine Aufgaben sind zu unwichtig für einen Menschen, aber zu wichtig, um liegen zu bleiben. Sie fressen Aufmerksamkeit und verzögern Reaktionen.",
    solutionIntro:
      "Wir umreißen eine konkrete Aufgabe klar genug, dass ein Agent sie zuverlässig und kontrolliert übernehmen kann.",
    modules: [
      { title: "Aufgabendefinition", description: "Ziel, Eingaben und Ergebnis klar umrissen." },
      { title: "Regeln & Grenzen", description: "Werkzeugrechte, erlaubte Daten, Budgetgrenzen und Abbruchbedingungen definieren." },
      { title: "Kontrollpunkte", description: "Menschliche Freigabe an kritischen Stellen." },
      { title: "Aktionsanbindung", description: "Ergebnisse lösen echte Folgeschritte aus." },
      { title: "Protokollierung", description: "Tool-Aufrufe, Freigaben und Fehler für Prüfung und Betrieb nachvollziehbar erfassen." },
      { title: "Eskalation", description: "Unklare Fälle gehen an den Menschen." },
    ],
    approach: [
      "Eine klar abgegrenzte Aufgabe statt vager Autonomie",
      "Explizite Grenzen und Eskalationswege",
      "Nachvollziehbarkeit jeder Aktion",
      "Sichere Anbindung an reale Systeme",
      "Umsetzung und Absicherung mit AGI Works",
    ],
    industries: ["Service-Teams", "Vertrieb & Support", "Dienstleister", "Kommunikationsintensive Betriebe"],
    decision: {
      suitable: [
        "Eine Aufgabe ist klar abgrenzbar und wiederkehrend",
        "Regeln und Grenzen lassen sich definieren",
        "Kritische Schritte sollen kontrolliert bleiben",
      ],
      notSuitable: ["Aufgaben ohne klare Regeln oder mit hohem Ermessensspielraum"],
      alternative: "Bei viel Ermessen ist ein assistierendes KI-System mit Vorschlägen sinnvoller als ein autonomer Agent.",
    },
    costNote:
      "Der Projektkorridor hängt von Aufgabenkomplexität, Anbindungen und Kontrollanforderungen ab.",
    process: [
      { title: "Analyse", description: "Passende, abgrenzbare Aufgabe identifizieren." },
      { title: "Design", description: "Regeln, Grenzen und Kontrollpunkte festlegen." },
      { title: "Umsetzung", description: "Agent und Anbindungen mit AGI Works bauen." },
      { title: "Test", description: "Verhalten, Grenzen und Eskalation prüfen." },
      { title: "Betrieb", description: "Überwachen und nachschärfen." },
    ],
    faq: [
      { question: "Welche Freigaben braucht ein KI-Agent im Unternehmen?", answer: "Risikoreiche Aktionen benötigen serverseitig durchgesetzte Berechtigungen und definierte menschliche Freigaben." },
      { question: "Wie werden KI-Agenten gegen unbefugte Aktionen abgesichert?", answer: "Mit minimalen Werkzeugberechtigungen, serverseitiger Prüfung, menschlichen Freigaben für riskante Aktionen, Protokollierung und definierten Eskalations- und Abbruchregeln." },
      { question: "Was kostet ein KI-Agent für Unternehmen?", answer: "Der Aufwand hängt von den eingebundenen Werkzeugen, dem Berechtigungsmodell, erforderlichen Tests, Modellnutzung und laufendem Monitoring ab. Eine erste Schätzung setzt eine klar eingegrenzte Aufgabe voraus." },
      { question: "Was ist ein KI-Agent?", answer: "Eine KI, die eine klar definierte Aufgabe eigenständig ausführt, innerhalb festgelegter Regeln und Grenzen." },
      { question: "Handelt der Agent unkontrolliert?", answer: "Nein, er arbeitet in definierten Grenzen, mit Kontrollpunkten und Eskalation an den Menschen." },
      { question: "Sind Entscheidungen nachvollziehbar?", answer: "Ja, Aktionen werden protokolliert, sodass Entscheidungen nachvollziehbar bleiben." },
      { question: "Was passiert bei unklaren Fällen?", answer: "Unklare oder kritische Fälle werden an eine zuständige Person eskaliert." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die eine geeignete Aufgabe und den Projektkorridor bestimmt." },
    ],
    relatedPaths: ["/wissen/ki-agenten-im-unternehmen-einfuehren", "/loesungen/ki-systeme", "/loesungen/automatisierung", "/loesungen/ki-fuer-vertrieb", "/systemanalyse", "/beratung"],
    tags: ["KI-Agent", "Automatisierung", "Kontrolle"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/automatisierung",
    brand: "nexcel",
    collection: "loesungen",
    slug: "automatisierung",
    path: "/loesungen/automatisierung",
    systemSlug: "ki-automatisierung",
    serviceName: "Prozessautomatisierung",
    title: "KI-Automatisierung & Prozesse | NEXCEL AI",
    description:
      "KI-Automatisierung für Unternehmen: NEXCEL AI analysiert wiederkehrende Abläufe, verbindet CRM/ERP und plant Regeln, Freigaben und Fehlerroutinen.",
    eyebrow: "Lösung",
    h1: "Prozessautomatisierung, die im Alltag wirkt",
    heroIntro:
      "Wiederkehrende Abläufe müssen niemanden mehr beschäftigen: Wir automatisieren Routinen mit klaren Auslösern, Regeln und Aktionen.",
    aeoAnswer:
      "KI-Automatisierung verbindet definierte Geschäftsprozesse mit geeigneten Regeln und, wo nötig, KI zur Verarbeitung unstrukturierter Eingaben. NEXCEL AI bewertet zunächst, welche Aufgaben sich ohne KI automatisieren lassen und wo Sprach- oder Dokumentenverstehen zusätzlichen Nutzen bringt. Auslöser, Datenübergaben, Ausnahmen und menschliche Freigaben werden vor der Umsetzung festgelegt. Erst dann wird der Ablauf mit bestehenden CRM- oder ERP-Systemen verbunden und anhand vereinbarter Kennzahlen überprüft.",
    problem:
      "Dieselben Handgriffe wiederholen sich täglich: Daten kopieren, Nachrichten senden, Aufgaben anlegen. Das kostet Zeit und geht regelmäßig unter.",
    solutionIntro:
      "Wir bilden Ihre Routinen als Automatisierungen ab — mit Auslösern und Regeln, die zuverlässig greifen.",
    modules: [
      { title: "Auslöser", description: "Ereignisse, die Abläufe starten." },
      { title: "Regeln", description: "Bedingungen und Verzweigungen." },
      { title: "Aktionen", description: "Aufgaben, Nachrichten und Updates automatisch." },
      { title: "System-Verbindungen", description: "ERP, CRM und Fachanwendungen mit eindeutigen Datenübergaben und Verantwortlichkeiten verknüpfen." },
      { title: "Benachrichtigungen", description: "Beteiligte automatisch informieren." },
      { title: "Kontrolle", description: "Ausnahmefälle, menschliche Freigaben und den Status fehlgeschlagener Abläufe sichtbar machen." },
    ],
    approach: [
      "Automatisierungen entlang echter Engpässe priorisieren",
      "Klare Regeln und Ausnahmebehandlung",
      "Menschliche Kontrolle an sensiblen Stellen",
      "Messbare Zeit- und Qualitätsziele",
      "Technische Umsetzung mit AGI Works",
    ],
    industries: ["Dienstleister", "Beauty & Gesundheit", "Handel & Service", "Verwaltungsintensive Teams"],
    decision: {
      suitable: [
        "Abläufe wiederholen sich und folgen Regeln",
        "Manuelle Schritte erzeugen Fehler und Verzögerung",
        "Sie wollen Zeit für Wertschöpfendes gewinnen",
      ],
      notSuitable: ["Einmalige, individuelle Vorgänge ohne Wiederholung"],
      alternative: "Für Einzelfälle ist Automatisierung selten wirtschaftlich; besser ist eine klare manuelle Vorgehensweise.",
    },
    costNote:
      "Der Projektkorridor hängt von Anzahl und Komplexität der Abläufe sowie den beteiligten Systemen ab.",
    process: [
      { title: "Analyse", description: "Routinen und Engpässe erfassen." },
      { title: "Priorisierung", description: "Die lohnendsten Abläufe auswählen." },
      { title: "Umsetzung", description: "Auslöser, Regeln und Aktionen bauen." },
      { title: "Messung", description: "Zeitersparnis und Qualität prüfen." },
      { title: "Ausbau", description: "Weitere Abläufe ergänzen." },
    ],
    faq: [
      { question: "Wann sollte ein Prozess ohne KI automatisiert werden?", answer: "Wenn eindeutige Regeln ausreichen; KI ist erst nötig, wenn unstrukturierte Eingaben oder flexible Einordnung hinzukommen." },
      { question: "Wann braucht Prozessautomatisierung überhaupt KI?", answer: "Regelbasierte Abläufe sollten zuerst ohne KI umgesetzt werden. KI ist vor allem dann sinnvoll, wenn unstrukturierte Texte, Dokumente oder Anfragen verstanden werden müssen; kritische Entscheidungen bleiben kontrollierbar." },
      { question: "Was lässt sich automatisieren?", answer: "Wiederkehrende, regelbasierte Abläufe wie Datenübertragung, Benachrichtigungen und Aufgabenerstellung." },
      { question: "Verliere ich die Kontrolle?", answer: "Nein, sensible Schritte behalten eine menschliche Kontrolle, und Sie können jederzeit eingreifen." },
      { question: "Wie schnell zeigt sich der Nutzen?", answer: "Oft schon beim ersten automatisierten Ablauf; die Wirkung wird über konkrete Ziele gemessen." },
      { question: "Werden bestehende Tools eingebunden?", answer: "Ja, vorhandene Systeme werden über Schnittstellen sinnvoll verkettet." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die die lohnendsten Automatisierungen und den Projektkorridor bestimmt." },
    ],
    relatedPaths: ["/wissen/ki-agenten-im-unternehmen-einfuehren", "/loesungen/ki-systeme", "/loesungen/lead-automation", "/loesungen/digitale-betriebssysteme", "/systemanalyse", "/beratung"],
    tags: ["Automatisierung", "Prozess", "Effizienz"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/digitale-betriebssysteme",
    brand: "nexcel",
    collection: "loesungen",
    slug: "digitale-betriebssysteme",
    path: "/loesungen/digitale-betriebssysteme",
    serviceName: "Digitale Betriebssysteme",
    title: "Digitale Betriebssysteme für Unternehmen · NEXCEL AI",
    description:
      "NEXCEL AI entwirft digitale Betriebssysteme, die Prozesse, Daten und Kommunikation zu einem zusammenhängenden Ganzen verbinden statt Insellösungen zu häufen.",
    eyebrow: "Lösung",
    h1: "Digitale Betriebssysteme statt Insellösungen",
    heroIntro:
      "Ein zusammenhängendes System statt vieler Tools: Wir entwerfen das digitale Betriebssystem, das Prozesse, Daten und Kommunikation verbindet.",
    aeoAnswer:
      "Ein digitales Betriebssystem ist sinnvoll, wenn zu viele Einzeltools zu Reibung und Datenbrüchen führen. NEXCEL AI entwirft das Zielbild und die Prozesslogik, die AGI Works technisch umsetzt. Geeignet für wachsende Unternehmen, die Struktur brauchen. Der nächste Schritt ist eine Systemanalyse, die den Ist-Zustand und das Zielbild klärt.",
    problem:
      "Jedes Problem wurde mit einem neuen Tool gelöst. Jetzt gibt es viele Insellösungen, doppelte Daten und keinen roten Faden durch die Abläufe.",
    solutionIntro:
      "Wir entwerfen ein Betriebssystem-Zielbild und einen Weg dorthin — Prozess für Prozess, ohne alles auf einmal umzuwerfen.",
    modules: [
      { title: "Zielbild", description: "Wie Prozesse und Daten zusammenspielen sollen." },
      { title: "Prozesslandkarte", description: "Abläufe sichtbar und anschlussfähig." },
      { title: "Datenfluss", description: "Eine verlässliche Quelle statt Dubletten." },
      { title: "Kommunikation", description: "Kanäle in den Prozess integriert." },
      { title: "Rollen", description: "Verantwortlichkeiten klar zugeordnet." },
      { title: "Roadmap", description: "Priorisierter Weg zum Zielbild." },
    ],
    approach: [
      "Vom Zielbild rückwärts planen",
      "Prozesse vor Tools",
      "Schrittweise Migration statt Big-Bang",
      "Messbare Etappenziele",
      "Technische Realisierung mit AGI Works",
    ],
    industries: ["Wachsende KMU", "Dienstleistungsgruppen", "Franchise & Filialen", "Mehrmarken-Betriebe"],
    decision: {
      suitable: [
        "Zu viele Einzeltools erzeugen Reibung",
        "Daten sind doppelt und uneinheitlich",
        "Sie wollen Struktur für weiteres Wachstum",
      ],
      notSuitable: ["Ein kleines Team mit einem einzigen, klaren Ablauf"],
      alternative: "Bei einem einzigen klaren Ablauf genügt oft eine fokussierte Einzellösung.",
    },
    costNote:
      "Der Projektkorridor hängt vom Umfang des Zielbilds und der Zahl der einbezogenen Prozesse ab. Die Umsetzung erfolgt etappenweise.",
    process: [
      { title: "Analyse", description: "Ist-Zustand, Tools und Datenflüsse erfassen." },
      { title: "Zielbild", description: "Angestrebtes Betriebssystem entwerfen." },
      { title: "Roadmap", description: "Etappen priorisieren." },
      { title: "Umsetzung", description: "Prozess für Prozess mit AGI Works realisieren." },
      { title: "Steuerung", description: "Fortschritt an Etappenzielen messen." },
    ],
    faq: [
      { question: "Wie vermeidet man neue Datensilos?", answer: "Mit klarer Datenverantwortung, standardisierten Schnittstellen und einer gemeinsamen Integrationsarchitektur." },
      { question: "Was ist ein digitales Betriebssystem?", answer: "Ein zusammenhängendes System aus Prozessen, Daten und Kommunikation, das Insellösungen ablöst." },
      { question: "Müssen wir alles auf einmal umstellen?", answer: "Nein, die Umsetzung erfolgt etappenweise entlang einer priorisierten Roadmap." },
      { question: "Was passiert mit bestehenden Tools?", answer: "Sinnvolle Tools werden eingebunden, überflüssige schrittweise abgelöst." },
      { question: "Wie wird der Fortschritt gemessen?", answer: "Über konkrete Etappenziele statt eines vagen Gesamtversprechens." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die Ist-Zustand, Zielbild und Projektkorridor klärt." },
    ],
    relatedPaths: ["/wissen/ki-projekte-datenschutz-sicherheit-planen", "/loesungen/automatisierung", "/loesungen/ki-systeme", "/loesungen/customer-experience-systeme", "/systemanalyse", "/kontakt"],
    tags: ["Betriebssystem", "Systemdesign", "Prozess"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/lead-automation",
    brand: "nexcel",
    collection: "loesungen",
    slug: "lead-automation",
    path: "/loesungen/lead-automation",
    systemSlug: "lead-funnels-crm",
    serviceName: "Lead-Automation",
    title: "Lead-Automation für planbaren Vertrieb · NEXCEL AI",
    description:
      "NEXCEL AI gestaltet Lead-Automation: qualifizierende Funnels, automatische Erfassung, Priorisierung und Nachfassen für einen planbaren Vertrieb.",
    eyebrow: "Lösung",
    h1: "Lead-Automation für einen planbaren Vertrieb",
    heroIntro:
      "Vom ersten Kontakt bis zum qualifizierten Lead: Wir gestalten Funnels und Automatisierungen, die Anfragen erfassen, einordnen und nachfassen.",
    aeoAnswer:
      "Lead-Automation ist sinnvoll, wenn Anfragen unstrukturiert eingehen und Nachfassen dem Zufall überlassen ist. NEXCEL AI entwirft den Funnel und die Automatisierungslogik, AGI Works setzt CRM und Anbindungen um. Geeignet für Teams, die ihren Vertrieb planbar machen wollen. Der nächste Schritt ist eine Systemanalyse zur Bewertung der Lead-Strecke.",
    problem:
      "Leads kommen über verschiedene Kanäle, werden uneinheitlich erfasst und unregelmäßig nachverfolgt. Chancen gehen verloren, ohne dass es jemand merkt.",
    solutionIntro:
      "Wir gestalten eine durchgängige Lead-Strecke, in der Anfragen automatisch erfasst, qualifiziert und nachgefasst werden.",
    modules: [
      { title: "Qualifizierende Funnels", description: "Formulare, die Leads einordnen." },
      { title: "Automatische Erfassung", description: "Jeder Lead landet strukturiert im System." },
      { title: "Priorisierung", description: "Heiße Leads zuerst." },
      { title: "Erstkontakt", description: "Automatische, saubere Rückmeldung." },
      { title: "Nachfass-Sequenzen", description: "Wiedervorlagen statt Zufall." },
      { title: "Auswertung", description: "Quellen und Conversion nachvollziehbar." },
    ],
    approach: [
      "Vom Kanal bis zum Abschluss durchdenken",
      "Qualifizierung vor Menge",
      "Automatischer, aber persönlicher Erstkontakt",
      "Attribution: Quelle jedes Leads sichtbar",
      "CRM-Umsetzung mit AGI Works",
    ],
    industries: ["Dienstleister", "Beauty & Gesundheit", "B2B-Vertrieb", "Beratungen"],
    decision: {
      suitable: [
        "Anfragen kommen unstrukturiert über mehrere Kanäle",
        "Nachfassen passiert unregelmäßig",
        "Sie wollen Ihren Vertrieb planbar machen",
      ],
      notSuitable: ["Sehr wenige, persönlich betreute Einzelkontakte"],
      alternative: "Bei wenigen Kontakten kann persönliche Betreuung ohne Automatisierung ausreichen.",
    },
    costNote:
      "Der Projektkorridor hängt von Funnel-Umfang, CRM-Anbindung und Automatisierungstiefe ab. Den passenden Kostenrahmen klären wir gemeinsam im Beratungsgespräch.",
    process: [
      { title: "Analyse", description: "Kanäle, Leads und Nachfass-Lücken erfassen." },
      { title: "Funnel-Design", description: "Qualifizierung und Strecke entwerfen." },
      { title: "Umsetzung", description: "Funnel, CRM und Automatisierung mit AGI Works bauen." },
      { title: "Messung", description: "Quellen und Conversion auswerten." },
      { title: "Optimierung", description: "Strecke und Sequenzen verbessern." },
    ],
    faq: [
      { question: "Was ist Lead-Automation?", answer: "Eine durchgängige Strecke, die Anfragen automatisch erfasst, qualifiziert, priorisiert und nachfasst." },
      { question: "Bleibt der Kontakt persönlich?", answer: "Ja, der automatische Erstkontakt ist sauber formuliert; die eigentliche Betreuung bleibt persönlich." },
      { question: "Sehe ich, woher Leads kommen?", answer: "Ja, über Attribution werden Quelle und Conversion jedes Leads nachvollziehbar." },
      { question: "Wird ein CRM benötigt?", answer: "Ja, die Leads laufen strukturiert in ein CRM, das AGI Works umsetzt oder anbindet." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse, die die Lead-Strecke bewertet und den Projektkorridor bestimmt." },
    ],
    relatedPaths: ["/loesungen/automatisierung", "/loesungen/crm-automation", "/loesungen/ki-fuer-vertrieb", "/beratung", "/systemanalyse"],
    tags: ["Lead", "Funnel", "Vertrieb"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/customer-experience-systeme",
    brand: "nexcel",
    collection: "loesungen",
    slug: "customer-experience-systeme",
    path: "/loesungen/customer-experience-systeme",
    serviceName: "Customer-Experience-Systeme",
    title: "Customer-Experience-Systeme · NEXCEL AI",
    description:
      "NEXCEL AI gestaltet Customer-Experience-Systeme: konsistente Kommunikation, durchdachte Journeys und Prozesse, die Kundenbindung strukturiert stärken.",
    eyebrow: "Lösung",
    h1: "Customer-Experience-Systeme, die Bindung schaffen",
    heroIntro:
      "Kundenerlebnis ist kein Zufall, sondern System: Wir gestalten Journeys und Prozesse, die über alle Kontaktpunkte konsistent wirken.",
    aeoAnswer:
      "Customer-Experience-Systeme sind sinnvoll, wenn das Kundenerlebnis über Kanäle hinweg uneinheitlich ist. NEXCEL AI entwirft Journey und Kommunikationslogik, AGI Works setzt die technischen Bausteine um. Geeignet für Unternehmen, die Bindung und Wiederkehr steigern wollen. Der nächste Schritt ist eine Systemanalyse der Kundenkontaktpunkte.",
    problem:
      "Kundenkommunikation ist über Kanäle verstreut und uneinheitlich. Nach dem Kauf passiert wenig, und Wiederkehr entsteht eher zufällig als geplant.",
    solutionIntro:
      "Wir entwerfen eine konsistente Journey mit klaren Kontaktpunkten und Kommunikation, die zur Marke passt.",
    modules: [
      { title: "Journey-Design", description: "Kontaktpunkte bewusst gestalten." },
      { title: "Konsistente Kommunikation", description: "Eine Stimme über alle Kanäle." },
      { title: "Onboarding", description: "Guter Start nach dem Kauf." },
      { title: "Feedback", description: "Rückmeldungen strukturiert einholen." },
      { title: "Wiederkehr", description: "Anlässe für erneuten Kontakt schaffen." },
      { title: "Messung", description: "Zufriedenheit und Bindung sichtbar machen." },
    ],
    approach: [
      "Journey aus Kundensicht entwerfen",
      "Konsistenz vor Kampagnenlärm",
      "Kommunikation an Prozesse koppeln",
      "Bindung messbar machen",
      "Technische Umsetzung mit AGI Works",
    ],
    industries: ["Beauty & Gesundheit", "Dienstleister", "Handel & Service", "Mitgliederorganisationen"],
    decision: {
      suitable: [
        "Das Kundenerlebnis ist über Kanäle uneinheitlich",
        "Nach dem Kauf passiert zu wenig",
        "Sie wollen Bindung und Wiederkehr steigern",
      ],
      notSuitable: ["Reines Einmalgeschäft ohne Wiederkehrpotenzial"],
      alternative: "Ohne Wiederkehrpotenzial lohnt eher die Optimierung der Erstconversion als ein CX-System.",
    },
    costNote:
      "Der Projektkorridor hängt von der Zahl der Kontaktpunkte und der Integrationstiefe in bestehende Systeme ab.",
    process: [
      { title: "Analyse", description: "Kontaktpunkte und Brüche in der Journey erfassen." },
      { title: "Journey-Design", description: "Erlebnis und Kommunikation entwerfen." },
      { title: "Umsetzung", description: "Bausteine mit AGI Works realisieren." },
      { title: "Messung", description: "Zufriedenheit und Wiederkehr auswerten." },
      { title: "Optimierung", description: "Journey iterativ verbessern." },
    ],
    faq: [
      { question: "Was ist ein CX-System?", answer: "Ein durchdachtes System aus Journey, Kommunikation und Prozessen, das das Kundenerlebnis konsistent macht." },
      { question: "Ist das nur Marketing?", answer: "Nein, es koppelt Kommunikation an reale Prozesse und macht Bindung messbar." },
      { question: "Wie wird Erfolg gemessen?", answer: "Über Kennzahlen zu Zufriedenheit und Wiederkehr statt pauschaler Aussagen." },
      { question: "Arbeitet das mit bestehenden Systemen?", answer: "Ja, die Bausteine werden in vorhandene Systeme integriert." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse der Kontaktpunkte und der Definition des Projektkorridors." },
    ],
    relatedPaths: ["/loesungen/digitale-betriebssysteme", "/loesungen/automatisierung", "/loesungen/email-automation", "/systemanalyse", "/kontakt"],
    tags: ["Customer Experience", "Journey", "Bindung"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/crm-automation",
    brand: "nexcel",
    collection: "loesungen",
    slug: "crm-automation",
    path: "/loesungen/crm-automation",
    serviceName: "CRM-Automation",
    title: "CRM-Automation mit KI · NEXCEL AI",
    description:
      "NEXCEL AI automatisiert CRM-Prozesse: Leads erfassen und einordnen, Aufgaben erzeugen, nachfassen und Datenpflege reduzieren — mit klarer Kontrolle.",
    eyebrow: "Lösung",
    h1: "CRM-Automation für weniger Handarbeit",
    heroIntro:
      "Ein CRM entfaltet erst Wirkung, wenn es sich selbst pflegt: Wir automatisieren Erfassung, Aufgaben und Nachfassen entlang Ihres Prozesses.",
    aeoAnswer:
      "CRM-Automation ist sinnvoll, wenn die Pflege des CRM zu viel Handarbeit kostet und dadurch lückenhaft bleibt. NEXCEL AI entwirft die Automatisierungslogik, AGI Works verbindet sie mit Ihrem CRM. Geeignet für Vertriebsteams mit einem bestehenden oder geplanten CRM. Der nächste Schritt ist eine Systemanalyse der CRM-Prozesse.",
    problem:
      "Das CRM ist nur so gut wie seine Pflege — und die kostet Zeit. Datensätze veralten, Aufgaben fehlen und der Überblick leidet.",
    solutionIntro:
      "Wir automatisieren die wiederkehrende CRM-Arbeit, damit das System aktuell bleibt, ohne das Team zu belasten.",
    modules: [
      { title: "Auto-Erfassung", description: "Leads und Kontakte automatisch anlegen." },
      { title: "Einordnung", description: "Status und Priorität regelbasiert setzen." },
      { title: "Aufgaben", description: "Wiedervorlagen automatisch erzeugen." },
      { title: "Nachfassen", description: "Sequenzen statt Zufall." },
      { title: "Datenhygiene", description: "Dubletten und Lücken reduzieren." },
      { title: "Reporting", description: "Pipeline und Aktivität sichtbar." },
    ],
    approach: [
      "Automatisierung entlang des realen CRM-Prozesses",
      "Regeln mit menschlicher Kontrolle",
      "Saubere Datenhygiene als Ziel",
      "Attribution und Auswertung integriert",
      "Anbindung/Umsetzung mit AGI Works",
    ],
    industries: ["Vertriebsteams", "Dienstleister", "Beratungen", "B2B-Unternehmen"],
    decision: {
      suitable: [
        "CRM-Pflege kostet zu viel Zeit",
        "Datensätze veralten und Aufgaben fehlen",
        "Sie wollen den Prozess systematisieren",
      ],
      notSuitable: ["Sie haben kein CRM und keinen strukturierten Vertriebsprozess"],
      alternative: "Ohne strukturierten Prozess ist zunächst der Aufbau eines CRM sinnvoller als dessen Automatisierung.",
    },
    costNote:
      "Der Projektkorridor hängt vom bestehenden CRM, der Prozesskomplexität und der Automatisierungstiefe ab.",
    process: [
      { title: "Analyse", description: "CRM-Prozesse und Pflegeaufwand erfassen." },
      { title: "Konzept", description: "Automatisierungsregeln und Kontrolle festlegen." },
      { title: "Umsetzung", description: "Regeln mit AGI Works ans CRM anbinden." },
      { title: "Messung", description: "Datenqualität und Zeitersparnis prüfen." },
      { title: "Optimierung", description: "Regeln nachschärfen." },
    ],
    faq: [
      { question: "Brauche ich ein bestimmtes CRM?", answer: "Nein, die Automatisierung wird an Ihr bestehendes oder ein neu aufgebautes CRM angebunden." },
      { question: "Bleibt die Datenhoheit erhalten?", answer: "Ja, Sie behalten die Kontrolle; Regeln arbeiten transparent und nachvollziehbar." },
      { question: "Reduziert das wirklich Handarbeit?", answer: "Ja, Erfassung, Aufgaben und Nachfassen laufen automatisiert; die Wirkung wird gemessen." },
      { question: "Was ist mit alten, schlechten Daten?", answer: "Datenhygiene ist Teil des Konzepts: Dubletten und Lücken werden reduziert." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse der CRM-Prozesse und der Definition des Projektkorridors." },
    ],
    relatedPaths: ["/loesungen/lead-automation", "/loesungen/automatisierung", "/loesungen/ki-fuer-vertrieb", "/systemanalyse", "/kontakt"],
    tags: ["CRM", "Automatisierung", "Vertrieb"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/email-automation",
    brand: "nexcel",
    collection: "loesungen",
    slug: "email-automation",
    path: "/loesungen/email-automation",
    serviceName: "E-Mail-Automation",
    title: "E-Mail-Automation, DSGVO-konform · NEXCEL AI",
    description:
      "NEXCEL AI gestaltet E-Mail-Automation entlang echter Anlässe: Willkommen, Nachfassen und Reaktivierung — relevant, konsistent und DSGVO-konform.",
    eyebrow: "Lösung",
    h1: "E-Mail-Automation entlang echter Anlässe",
    heroIntro:
      "Automatische E-Mails, die zum Moment passen: Wir gestalten Strecken, die auf reale Ereignisse reagieren statt auf den Kalender.",
    aeoAnswer:
      "E-Mail-Automation ist sinnvoll, wenn wiederkehrende Nachrichten relevant und zeitgerecht ausgelöst werden sollen. NEXCEL AI entwirft die anlassbasierten Strecken, AGI Works bindet sie technisch an. Geeignet für Unternehmen mit wiederkehrender Kundenkommunikation. Der nächste Schritt ist eine Systemanalyse der Kommunikationsanlässe.",
    problem:
      "E-Mails werden manuell verschickt oder folgen starren Kampagnen. Sie treffen selten den richtigen Moment und wirken dadurch beliebig.",
    solutionIntro:
      "Wir koppeln E-Mails an reale Ereignisse, sodass Inhalte relevant und zum passenden Zeitpunkt ankommen.",
    modules: [
      { title: "Anlass-Trigger", description: "Ereignisse statt Kalender." },
      { title: "Willkommensstrecke", description: "Guter Start nach Anmeldung oder Kauf." },
      { title: "Nachfassen", description: "Automatisch am richtigen Punkt." },
      { title: "Reaktivierung", description: "Inaktive Kontakte gezielt ansprechen." },
      { title: "Segmentierung", description: "Passende Inhalte je Zielgruppe." },
      { title: "Consent & Abmeldung", description: "DSGVO-konform und sauber." },
    ],
    approach: [
      "Kommunikation an reale Ereignisse koppeln",
      "Relevanz vor Frequenz",
      "Sauberes Consent- und Abmeldemanagement",
      "Messbare Öffnungs- und Reaktionsziele",
      "Technische Anbindung mit AGI Works",
    ],
    industries: ["Beauty & Gesundheit", "Handel & Service", "Dienstleister", "Kurse & Mitgliedschaften"],
    decision: {
      suitable: [
        "Wiederkehrende E-Mails sollen relevant ausgelöst werden",
        "Manueller Versand kostet Zeit und trifft den Moment nicht",
        "Sie wollen Kommunikation DSGVO-konform automatisieren",
      ],
      notSuitable: ["Sie kommunizieren fast ausschließlich persönlich und einzeln"],
      alternative: "Bei rein persönlicher Einzelkommunikation ist Automatisierung nicht nötig.",
    },
    costNote:
      "Der Projektkorridor hängt von der Zahl der Strecken, der Segmentierung und der Systemanbindung ab.",
    process: [
      { title: "Analyse", description: "Kommunikationsanlässe und Zielgruppen erfassen." },
      { title: "Konzept", description: "Anlassbasierte Strecken entwerfen." },
      { title: "Umsetzung", description: "Trigger und Anbindung mit AGI Works bauen." },
      { title: "Messung", description: "Öffnungen und Reaktionen auswerten." },
      { title: "Optimierung", description: "Inhalte und Zeitpunkte verbessern." },
    ],
    faq: [
      { question: "Was macht E-Mail-Automation relevant?", answer: "Die Kopplung an reale Ereignisse: E-Mails kommen dann, wenn sie zum Moment des Kontakts passen." },
      { question: "Ist das DSGVO-konform?", answer: "Ja, Consent- und Abmeldemanagement sind fester Bestandteil der Umsetzung." },
      { question: "Wird nach Zielgruppen unterschieden?", answer: "Ja, über Segmentierung erhalten unterschiedliche Kontakte passende Inhalte." },
      { question: "Wie wird Erfolg gemessen?", answer: "Über Öffnungs- und Reaktionsziele statt pauschaler Erfolgsversprechen." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse der Kommunikationsanlässe und des Projektkorridors." },
    ],
    relatedPaths: ["/loesungen/automatisierung", "/loesungen/customer-experience-systeme", "/loesungen/lead-automation", "/systemanalyse", "/kontakt"],
    tags: ["E-Mail", "Automatisierung", "DSGVO"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/whatsapp-automation",
    brand: "nexcel",
    collection: "loesungen",
    slug: "whatsapp-automation",
    path: "/loesungen/whatsapp-automation",
    serviceName: "WhatsApp-Automation",
    title: "WhatsApp-Automation, DSGVO-konform · NEXCEL AI",
    description:
      "NEXCEL AI konzipiert WhatsApp-Automation über offizielle Wege: Terminerinnerungen, Rückfragen und Bestätigungen — mit Einwilligung und Kontrolle.",
    eyebrow: "Lösung",
    h1: "WhatsApp-Automation mit Einwilligung und Kontrolle",
    heroIntro:
      "Kommunikation dort, wo Kunden ohnehin sind: Wir konzipieren WhatsApp-Automation über offizielle Wege — mit klarer Einwilligung und menschlicher Kontrolle.",
    aeoAnswer:
      "WhatsApp-Automation ist sinnvoll, wenn Kunden diesen Kanal bevorzugen und wiederkehrende Nachrichten wie Erinnerungen anfallen. NEXCEL AI konzipiert die Abläufe DSGVO-konform, AGI Works bindet die offizielle Schnittstelle an. Geeignet für terminbasierte und serviceintensive Betriebe. Der nächste Schritt ist eine Systemanalyse der Anwendungsfälle.",
    problem:
      "Kunden schreiben über WhatsApp, aber die Bearbeitung ist manuell und unkoordiniert. Erinnerungen und Bestätigungen bleiben liegen oder erfolgen zu spät.",
    solutionIntro:
      "Wir gestalten definierte, einwilligungsbasierte Abläufe für WhatsApp — für Erinnerungen, Bestätigungen und einfache Rückfragen.",
    modules: [
      { title: "Einwilligung", description: "Opt-in und Nachweis sauber geregelt." },
      { title: "Terminerinnerungen", description: "Weniger Ausfälle durch rechtzeitige Hinweise." },
      { title: "Bestätigungen", description: "Automatische Rückmeldungen." },
      { title: "Rückfragen", description: "Einfache Standardfragen automatisiert." },
      { title: "Übergabe", description: "Komplexe Fälle an Menschen weiterleiten." },
      { title: "Protokollierung", description: "Nachvollziehbare Kommunikation." },
    ],
    approach: [
      "Nur offizielle, zulässige Wege nutzen",
      "Einwilligung und Nachweis von Beginn an",
      "Klare Grenze zwischen Automatik und Mensch",
      "Messbare Ziele wie weniger Terminausfälle",
      "Technische Anbindung mit AGI Works",
    ],
    industries: ["Beauty & Gesundheit", "Terminbasierte Dienstleister", "Studios & Praxen", "Service-Betriebe"],
    decision: {
      suitable: [
        "Kunden bevorzugen WhatsApp als Kanal",
        "Es gibt wiederkehrende Nachrichten wie Erinnerungen",
        "Einwilligung lässt sich sauber einholen",
      ],
      notSuitable: ["Ihre Zielgruppe nutzt den Kanal nicht oder Einwilligung ist nicht darstellbar"],
      alternative: "Ohne Einwilligung oder Kanalnutzung ist E-Mail-Automation der bessere Weg.",
    },
    costNote:
      "Der Projektkorridor hängt von den Anwendungsfällen, der offiziellen Anbindung und den Einwilligungsprozessen ab.",
    process: [
      { title: "Analyse", description: "Anwendungsfälle und Einwilligung prüfen." },
      { title: "Konzept", description: "Abläufe und Grenzen festlegen." },
      { title: "Umsetzung", description: "Offizielle Anbindung mit AGI Works realisieren." },
      { title: "Test", description: "Datenschutz, Grenzen und Übergabe prüfen." },
      { title: "Betrieb", description: "Messen und verbessern." },
    ],
    faq: [
      { question: "Ist WhatsApp-Automation zulässig?", answer: "Über offizielle Wege und mit sauberer Einwilligung ja; Datenschutz und Nachweis werden von Beginn an eingeplant." },
      { question: "Brauche ich eine Einwilligung?", answer: "Ja, ein sauberes Opt-in mit Nachweis ist Voraussetzung für die Nutzung." },
      { question: "Was passiert bei komplexen Fällen?", answer: "Sie werden an eine zuständige Person übergeben; die Automatik bleibt auf klare Fälle beschränkt." },
      { question: "Was bringt es konkret?", answer: "Zum Beispiel weniger Terminausfälle durch rechtzeitige, automatische Erinnerungen." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse der Anwendungsfälle und des Projektkorridors." },
    ],
    relatedPaths: ["/loesungen/automatisierung", "/loesungen/customer-experience-systeme", "/loesungen/email-automation", "/systemanalyse", "/kontakt"],
    tags: ["WhatsApp", "Automatisierung", "DSGVO"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/loesungen/ki-fuer-vertrieb",
    brand: "nexcel",
    collection: "loesungen",
    slug: "ki-fuer-vertrieb",
    path: "/loesungen/ki-fuer-vertrieb",
    serviceName: "KI für den Vertrieb",
    title: "KI für den Vertrieb · NEXCEL AI",
    description:
      "NEXCEL AI bringt KI in den Vertrieb: Leads priorisieren, Gesprächsvorbereitung, Antwortentwürfe und saubere Datenpflege — als Assistenz, nicht als Ersatz.",
    eyebrow: "Lösung",
    h1: "KI für den Vertrieb als Assistenz",
    heroIntro:
      "KI, die dem Vertrieb zuarbeitet: Wir bringen Priorisierung, Vorbereitung und Entwürfe dorthin, wo Zeit sonst verloren geht.",
    aeoAnswer:
      "KI für den Vertrieb ist sinnvoll, wenn Priorisierung und Vorbereitung zu viel Zeit kosten. NEXCEL AI konzipiert die Assistenzfunktionen, AGI Works bindet sie ans CRM an. Geeignet für Vertriebsteams mit vielen Kontakten und Anfragen. Der nächste Schritt ist eine Systemanalyse der Vertriebsengpässe.",
    problem:
      "Vertriebszeit versickert in Vorbereitung, Priorisierung und Datenpflege. Für das eigentliche Gespräch bleibt zu wenig Zeit.",
    solutionIntro:
      "Wir setzen KI als Assistenz ein: Sie priorisiert, bereitet vor und schlägt Entwürfe vor — Entscheidungen bleiben beim Menschen.",
    modules: [
      { title: "Lead-Priorisierung", description: "Vielversprechende Kontakte zuerst." },
      { title: "Gesprächsvorbereitung", description: "Relevantes kompakt zusammengefasst." },
      { title: "Antwort-Entwürfe", description: "Schnelle, saubere Vorschläge." },
      { title: "Follow-up-Hinweise", description: "Nichts geht mehr unter." },
      { title: "Datenpflege", description: "Automatische Aktualisierung im CRM." },
      { title: "Auswertung", description: "Muster im Vertrieb sichtbar machen." },
    ],
    approach: [
      "KI als Assistenz, nicht als Ersatz",
      "Priorisierung entlang echter Signale",
      "Entwürfe mit menschlicher Freigabe",
      "Enge Kopplung an das CRM",
      "Technische Umsetzung mit AGI Works",
    ],
    industries: ["Vertriebsteams", "B2B-Unternehmen", "Beratungen", "Dienstleister"],
    decision: {
      suitable: [
        "Vorbereitung und Priorisierung kosten viel Zeit",
        "Es gibt viele Kontakte und Anfragen",
        "Sie wollen den Vertrieb entlasten, nicht ersetzen",
      ],
      notSuitable: ["Sehr wenige, rein persönliche Deals ohne Wiederholung"],
      alternative: "Bei wenigen persönlichen Deals bringt eine schlanke CRM-Struktur mehr als KI-Assistenz.",
    },
    costNote:
      "Der Projektkorridor hängt von den Assistenzfunktionen, der CRM-Anbindung und der Datenlage ab.",
    process: [
      { title: "Analyse", description: "Vertriebsengpässe und Datenlage erfassen." },
      { title: "Konzept", description: "Assistenzfunktionen und Kontrolle festlegen." },
      { title: "Umsetzung", description: "Funktionen mit AGI Works ans CRM anbinden." },
      { title: "Messung", description: "Zeitgewinn und Qualität prüfen." },
      { title: "Optimierung", description: "Funktionen nachschärfen." },
    ],
    faq: [
      { question: "Ersetzt KI meine Vertriebler?", answer: "Nein, KI arbeitet zu: Sie priorisiert und bereitet vor, während Entscheidungen und Gespräche beim Menschen bleiben." },
      { question: "Woher weiß die KI, was wichtig ist?", answer: "Aus definierten Signalen und Ihren Vorgaben; die Priorisierung bleibt nachvollziehbar." },
      { question: "Muss ich mein CRM wechseln?", answer: "Nein, die Assistenz wird an Ihr bestehendes CRM angebunden." },
      { question: "Wie wird der Nutzen gemessen?", answer: "Über Zeitgewinn und Qualität statt pauschaler Umsatzversprechen." },
      { question: "Wie starten wir?", answer: "Mit einer Systemanalyse der Vertriebsengpässe und des Projektkorridors." },
    ],
    relatedPaths: ["/loesungen/crm-automation", "/loesungen/lead-automation", "/loesungen/ki-agenten", "/systemanalyse", "/kontakt"],
    tags: ["KI", "Vertrieb", "Assistenz"],
    approved: true,
    manualIndexApproval: true,
  },
];

export const MONEY_PAGES: MoneyPage[] = [...AGI_PAGES, ...NEXCEL_PAGES];

/** Shared proof-constraints line for the template. */
export const MONEY_PROOF_CONSTRAINTS = PROOF;

export function getMoneyPagesForBrand(brand: BrandKey): MoneyPage[] {
  return MONEY_PAGES.filter((p) => p.brand === brand);
}

export function getMoneyPage(brand: BrandKey, slug: string): MoneyPage | undefined {
  return MONEY_PAGES.find((p) => p.brand === brand && p.slug === slug);
}
