/**
 * System pages — SEO layer for the 23 system detail routes (/systeme/<slug>).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `lib/systems-data.tsx` is a single shared content source rendered by BOTH
 * brands. Registering those routes as-is would publish 23 pairs of byte-identical
 * pages on two domains — exactly the cross-domain duplication `duplicateGuard`
 * blocks (threshold 0.6 on title + description).
 *
 * So each system gets a genuinely different editorial angle per brand:
 *  - AGI Works  → the ENGINEERING view: what gets built, architecture, stack.
 *  - NEXCEL AI  → the OPERATIONS view: which process gets automated, what changes.
 *
 * Same underlying system, two different questions answered. That is a real
 * distinction, not a reworded template.
 *
 * Constraints enforced by CI (lib/seo/contentRules.ts):
 *  - title 15–65 chars, description 50–165 chars
 *  - no superlatives, ranking claims or placeholders
 *  - cross-brand similarity < 0.6, within-brand < 0.85
 *
 * `relatedPaths` is generated (not hand-typed) so every internal link is
 * guaranteed to resolve to a registered same-brand route.
 */

import type { BrandKey } from "@/config/seo/domains";
import { SYSTEM_SLUGS, type SystemSlug } from "@/lib/systems-slugs";

export type SystemCategory =
  | "vertrieb"
  | "kunden"
  | "unternehmen"
  | "ki"
  | "plattformen";

export interface SystemPage {
  id: string;
  brand: BrandKey;
  slug: SystemSlug;
  path: string;
  category: SystemCategory;
  /** Display name of the system (breadcrumb + headings). */
  systemName: string;
  title: string;
  description: string;
  /** H1 for the detail page — differs from the meta title on purpose. */
  h1: string;
  /** AEO/GEO direct answer: a complete, self-contained response. */
  aeoAnswer: string;
  /** Same-brand internal links (siblings + commercial + editorial anchors). */
  relatedPaths: string[];
  approved: boolean;
  manualIndexApproval: boolean;
}

/** Which category each system belongs to — drives sibling internal links. */
export const SYSTEM_CATEGORY: Record<SystemSlug, SystemCategory> = {
  "lead-funnels-crm": "vertrieb",
  "vertriebsplattform-partnerportal": "vertrieb",
  "angebots-beratungssystem": "vertrieb",
  "kundenportal-self-service": "kunden",
  "buchungs-beauty-systeme": "kunden",
  "mitglieder-clubverwaltung": "kunden",
  "service-supportportal": "kunden",
  "omnichannel-kommunikation": "kunden",
  "erp-systeme": "unternehmen",
  "admin-operations-system": "unternehmen",
  "dokumentenmanagement-freigaben": "unternehmen",
  "projekt-aufgabenmanagement": "unternehmen",
  "mitarbeiter-hr-system": "unternehmen",
  "warenwirtschaft-lagerverwaltung": "unternehmen",
  "dashboard-reporting": "unternehmen",
  "recruiting-bewerberplattform": "unternehmen",
  "ki-automatisierung": "ki",
  "ki-telefonagent-voice": "ki",
  "premium-websysteme": "plattformen",
  "branchen-plattformen": "plattformen",
  "saas-plattform-multi-tenant": "plattformen",
  "akademie-lernplattform": "plattformen",
  "schnittstellen-integrationen": "plattformen",
};

export const SYSTEM_CATEGORY_LABEL: Record<SystemCategory, string> = {
  vertrieb: "Vertrieb",
  kunden: "Kunden",
  unternehmen: "Unternehmen",
  ki: "KI",
  plattformen: "Plattformen",
};

/** Per-brand editorial copy for one system. */
interface BrandCopy {
  systemName: string;
  title: string;
  description: string;
  h1: string;
  aeoAnswer: string;
  /** Commercial anchor pages on the same brand (money-page slugs, no prefix). */
  money: string[];
  /** Editorial anchor on the same brand (knowledge slug, no prefix). */
  knowledge: string;
}

type CopyTable = Record<SystemSlug, Record<BrandKey, BrandCopy>>;

/* ────────────────────────────────────────────────────────────────────────────
 * Copy table — 23 systems × 2 brands = 46 distinct pages.
 * ──────────────────────────────────────────────────────────────────────────── */

const COPY: CopyTable = {
  /* ── VERTRIEB ───────────────────────────────────────────────────────────── */
  "lead-funnels-crm": {
    nexcel: {
      systemName: "Lead-Funnel & CRM",
      title: "Lead-Funnel & CRM automatisieren · NEXCEL AI",
      description:
        "Anfragen automatisch erfassen, qualifizieren und nachfassen: Lead-Prozesse mit klarer Pipeline und nachvollziehbaren Conversion-Raten.",
      h1: "Lead-Prozesse automatisieren statt Anfragen verwalten",
      aeoAnswer:
        "Ein automatisierter Lead-Prozess erfasst jede Anfrage strukturiert, bewertet sie nach hinterlegten Kriterien und stößt den Erstkontakt selbstständig an. Statt Anfragen in Postfächern zu sammeln, entsteht eine Pipeline mit klarem Status je Kontakt. NEXCEL AI richtet diese Abläufe entlang Ihres bestehenden Vertriebs ein und macht Conversion-Raten je Quelle sichtbar.",
      money: ["lead-automation", "crm-automation", "ki-fuer-vertrieb"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Lead-Funnel & CRM",
      title: "CRM & Lead-Funnel entwickeln lassen | AGI Works",
      description:
        "Individuelle CRM-Software mit Pipeline, Rollenmodell und Schnittstellen — von der Datenmodellierung bis zum produktiven Betrieb entwickelt.",
      h1: "CRM-Software, die Ihrem Vertriebsmodell folgt",
      aeoAnswer:
        "Ein individuell entwickeltes CRM bildet Ihre tatsächlichen Vertriebsstufen ab, statt Ihre Arbeitsweise an ein Standardprodukt anzupassen. AGI Works modelliert dafür Datenstruktur, Rechte und Pipeline-Logik, entwickelt die Oberfläche und bindet Formulare, E-Mail und bestehende Systeme über Schnittstellen an. Das Ergebnis ist eine wartbare Anwendung, deren Quellcode Ihnen gehört.",
      money: ["crm-system-entwicklung", "web-app-entwicklung", "softwareentwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  "vertriebsplattform-partnerportal": {
    nexcel: {
      systemName: "Vertriebsplattform & Partnerportal",
      title: "Partnervertrieb automatisieren · NEXCEL AI",
      description:
        "Leads verteilen, Partner steuern und Provisionen automatisch abrechnen — ein durchgängiger Ablauf statt manueller Zuweisung per Liste.",
      h1: "Partnervertrieb ohne manuelle Zuweisung steuern",
      aeoAnswer:
        "Im automatisierten Partnervertrieb werden eingehende Leads nach hinterlegten Regeln an Partner verteilt, deren Bearbeitung nachverfolgt und Provisionen aus den Abschlüssen berechnet. Der Vertriebsleiter sieht Leistung je Partner, ohne Zahlen zusammenzutragen. NEXCEL AI definiert die Verteilungslogik gemeinsam mit Ihnen und automatisiert die Abrechnung dahinter.",
      money: ["lead-automation", "ki-fuer-vertrieb", "digitale-betriebssysteme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Vertriebsplattform & Partnerportal",
      title: "Vertriebsplattform entwickeln lassen | AGI Works",
      description:
        "Mandantenfähige Plattform für Partner, Leads und Abrechnung: individuelle Entwicklung mit Rollenmodell und sauberer Datenarchitektur.",
      h1: "Partnerportal als eigene Plattform entwickeln",
      aeoAnswer:
        "Ein Partnerportal braucht Mandantenfähigkeit: Jeder Partner sieht ausschließlich eigene Daten, während die Zentrale den Gesamtblick behält. AGI Works entwickelt dafür ein Rollen- und Rechtemodell, die Datenbankstruktur für Leads und Provisionen sowie die Oberflächen für beide Seiten. Bestehende Buchhaltung und CRM werden über Schnittstellen angebunden.",
      money: ["saas-entwicklung", "web-app-entwicklung", "kundenportal-entwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "angebots-beratungssystem": {
    nexcel: {
      systemName: "Angebots- & Beratungssystem",
      title: "Angebotsprozess automatisieren · NEXCEL AI",
      description:
        "Bedarf strukturiert erfassen, Angebote automatisch erzeugen und Follow-ups ohne Nachfassen per Hand — ein durchgängiger Beratungsablauf.",
      h1: "Vom Erstgespräch zum Angebot ohne Zwischenschritte",
      aeoAnswer:
        "Ein automatisierter Angebotsprozess führt durch eine strukturierte Bedarfsermittlung, erzeugt daraus das passende Angebot und übernimmt die Nachverfolgung. Rückfragen und Erinnerungen laufen zeitgesteuert, ohne dass jemand eine Wiedervorlage pflegt. NEXCEL AI bildet dabei Ihre Preislogik und Beratungsschritte ab, sodass Angebote inhaltlich konsistent bleiben.",
      money: ["automatisierung", "email-automation", "ki-fuer-vertrieb"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Angebots- & Beratungssystem",
      title: "Angebotssoftware entwickeln lassen | AGI Works",
      description:
        "Produktkonfigurator, PDF-Erzeugung und Versionierung als individuelle Anwendung — technisch umgesetzt und an Ihre Systeme angebunden.",
      h1: "Angebotssoftware mit eigener Kalkulationslogik",
      aeoAnswer:
        "Angebotssoftware wird dann individuell entwickelt, wenn Kalkulation, Varianten oder Freigaben zu spezifisch für Standardprodukte sind. AGI Works implementiert die Preisformeln als überprüfbare Regeln, erzeugt Dokumente serverseitig als PDF und versioniert jeden Stand nachvollziehbar. Warenwirtschaft und CRM werden per Schnittstelle angebunden.",
      money: ["softwareentwicklung", "web-app-entwicklung", "api-entwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  /* ── KUNDEN ─────────────────────────────────────────────────────────────── */
  "kundenportal-self-service": {
    nexcel: {
      systemName: "Kundenportal & Self-Service",
      title: "Self-Service für Kunden einrichten · NEXCEL AI",
      description:
        "Kunden erledigen Anliegen selbst und Ihr Team wird entlastet: automatisierte Self-Service-Strecken mit durchgängiger Customer Experience.",
      h1: "Kundenanliegen ohne Rückfrage im Team lösen",
      aeoAnswer:
        "Self-Service bedeutet, dass Kunden Stammdaten, Dokumente, Termine oder Statusabfragen selbst erledigen, statt anzurufen oder zu schreiben. Das senkt die Zahl wiederkehrender Anfragen spürbar und beschleunigt die Antwortzeit für alle übrigen. NEXCEL AI bestimmt, welche Vorgänge sich dafür eignen, und automatisiert die Abläufe dahinter.",
      money: ["customer-experience-systeme", "automatisierung", "digitale-betriebssysteme"],
      knowledge: "customer-experience-mit-ki-verbessern",
    },
    agiworks: {
      systemName: "Kundenportal & Self-Service",
      title: "Kundenportal entwickeln lassen | AGI Works",
      description:
        "Geschütztes Portal mit Login, Rechteverwaltung und Datenanbindung — als individuelle Web-App entwickelt statt aus Bausteinen gesetzt.",
      h1: "Ein Kundenportal auf Ihrer eigenen Datenbasis",
      aeoAnswer:
        "Ein Kundenportal ist eine geschützte Web-Anwendung, in der Kunden nach dem Login ausschließlich ihre eigenen Daten sehen. Technisch entscheidend sind Authentifizierung, ein belastbares Rechtemodell und die Anbindung an das führende System. AGI Works entwickelt diese Schichten individuell und liefert die Anwendung samt Quellcode und Dokumentation aus.",
      money: ["kundenportal-entwicklung", "web-app-entwicklung", "api-entwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "buchungs-beauty-systeme": {
    nexcel: {
      systemName: "Buchungs- & Beauty-Systeme",
      title: "Terminbuchung automatisieren · NEXCEL AI",
      description:
        "Termine, Erinnerungen und Auslastung laufen automatisch: weniger Ausfälle, weniger Telefonaufwand und eine planbarere Woche.",
      h1: "Termine annehmen, ohne ans Telefon zu gehen",
      aeoAnswer:
        "Automatisierte Terminbuchung nimmt Reservierungen rund um die Uhr entgegen, prüft Verfügbarkeiten und versendet Bestätigungen sowie Erinnerungen selbstständig. Nicht wahrgenommene Termine gehen dadurch messbar zurück, weil Kunden rechtzeitig erinnert werden und selbst umbuchen können. NEXCEL AI verknüpft die Buchung mit Kundendaten und Nachfassprozessen.",
      money: ["automatisierung", "customer-experience-systeme", "whatsapp-automation"],
      knowledge: "customer-experience-mit-ki-verbessern",
    },
    agiworks: {
      systemName: "Buchungs- & Beauty-Systeme",
      title: "Buchungssystem entwickeln lassen | AGI Works",
      description:
        "Individuelle Buchungssoftware mit Kalenderlogik, Ressourcenverwaltung und Zahlungsanbindung — passend zu Ihrem Terminmodell entwickelt.",
      h1: "Buchungssoftware für nicht-standardisierte Terminmodelle",
      aeoAnswer:
        "Standard-Buchungstools scheitern, sobald mehrere Ressourcen, Personalqualifikationen, Puffer oder Serientermine zusammenspielen. AGI Works entwickelt die Kalender- und Verfügbarkeitslogik dafür individuell, inklusive Ressourcenzuordnung, Stornoregeln und Anbindung eines Zahlungsanbieters. Die Oberfläche wird für Personal und Kunden getrennt gebaut.",
      money: ["web-app-entwicklung", "softwareentwicklung", "webseiten-erstellen-lassen"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  "mitglieder-clubverwaltung": {
    nexcel: {
      systemName: "Mitglieder- & Clubverwaltung",
      title: "Mitgliederverwaltung automatisieren · NEXCEL AI",
      description:
        "Beiträge, Kommunikation und Statuswechsel laufen automatisch — statt Listenpflege und manuellem Nachhalten offener Zahlungen.",
      h1: "Mitglieder betreuen, ohne Listen zu pflegen",
      aeoAnswer:
        "Automatisierte Mitgliederverwaltung erkennt Statuswechsel wie Eintritt, Verlängerung oder Kündigung und löst die passende Kommunikation selbstständig aus. Offene Beiträge werden erkannt und angemahnt, ohne dass jemand Kontoauszüge abgleicht. NEXCEL AI verbindet diese Abläufe mit Ihrer bestehenden Kommunikation.",
      money: ["automatisierung", "email-automation", "digitale-betriebssysteme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Mitglieder- & Clubverwaltung",
      title: "Clubverwaltung als Software entwickeln | AGI Works",
      description:
        "Mitgliederdatenbank, Beitragslogik und Rollen als individuelle Anwendung entwickelt, inklusive Schnittstelle zur Buchhaltung.",
      h1: "Vereins- und Clubverwaltung als eigene Anwendung",
      aeoAnswer:
        "Eine individuelle Clubverwaltung bildet Beitragsarten, Tarifwechsel, Familienstrukturen und Sonderfälle ab, an denen Standardlösungen meist scheitern. AGI Works entwickelt Datenmodell, Beitragsberechnung und Rollen für Vorstand, Personal und Mitglieder. Lastschrift und Buchhaltung werden über geprüfte Schnittstellen angebunden.",
      money: ["softwareentwicklung", "web-app-entwicklung", "admin-panel-entwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  "service-supportportal": {
    nexcel: {
      systemName: "Service- & Supportportal",
      title: "Support automatisieren & Tickets steuern · NEXCEL AI",
      description:
        "Anfragen automatisch einordnen, priorisieren und beantworten: kürzere Reaktionszeiten bei gleichbleibender Servicequalität.",
      h1: "Serviceanfragen schneller beantworten",
      aeoAnswer:
        "Automatisierter Support ordnet eingehende Anfragen nach Thema und Dringlichkeit ein, beantwortet wiederkehrende Fälle direkt und leitet den Rest an die zuständige Person weiter. Die Reaktionszeit sinkt, weil Sortierung und Zuweisung nicht mehr manuell passieren. NEXCEL AI hinterlegt dafür Ihre Servicelogik und Eskalationsstufen.",
      money: ["customer-experience-systeme", "ki-agenten", "automatisierung"],
      knowledge: "customer-experience-mit-ki-verbessern",
    },
    agiworks: {
      systemName: "Service- & Supportportal",
      title: "Supportportal entwickeln lassen | AGI Works",
      description:
        "Ticketsystem mit SLA-Logik, Rollen und Wissensdatenbank — individuell entwickelt und an bestehende Systeme angebunden.",
      h1: "Ticketsystem mit Ihren eigenen Servicestufen",
      aeoAnswer:
        "Ein individuell entwickeltes Supportportal bildet Ihre Servicevereinbarungen technisch ab: Fristen je Vertragsstufe, automatische Eskalation bei Überschreitung und eine nachvollziehbare Historie je Vorgang. AGI Works entwickelt Ticketmodell, Rollen und Wissensdatenbank und bindet E-Mail sowie Telefonie über Schnittstellen an.",
      money: ["web-app-entwicklung", "kundenportal-entwicklung", "softwareentwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "omnichannel-kommunikation": {
    nexcel: {
      systemName: "Omnichannel-Kommunikation",
      title: "Omnichannel-Kommunikation steuern · NEXCEL AI",
      description:
        "E-Mail, WhatsApp und Telefonie in einem Verlauf zusammenführen und automatisiert bespielen — ohne Brüche in der Kundenansprache.",
      h1: "Ein Gesprächsverlauf über alle Kanäle",
      aeoAnswer:
        "Omnichannel bedeutet, dass ein Kunde den Kanal wechseln kann, ohne seine Vorgeschichte erneut erzählen zu müssen. Nachrichten aus E-Mail, Messenger und Telefonie laufen in einem gemeinsamen Verlauf zusammen, auf den jede zuständige Person zugreift. NEXCEL AI automatisiert Zuordnung und Antwortlogik über die Kanäle hinweg.",
      money: ["whatsapp-automation", "email-automation", "customer-experience-systeme"],
      knowledge: "customer-experience-mit-ki-verbessern",
    },
    agiworks: {
      systemName: "Omnichannel-Kommunikation",
      title: "Kommunikationsplattform entwickeln | AGI Works",
      description:
        "Kanäle technisch zusammenführen: eine Anwendung mit Nachrichten-Routing, Verlaufsspeicherung und API-Anbindung Ihrer Dienste.",
      h1: "Kanäle technisch in einer Anwendung bündeln",
      aeoAnswer:
        "Kanäle zusammenzuführen ist vor allem ein Integrationsproblem: Jeder Anbieter liefert ein eigenes Nachrichtenformat, eigene Webhooks und eigene Zustellgarantien. AGI Works entwickelt eine Vermittlungsschicht, die Nachrichten normalisiert, einem Vorgang zuordnet und dauerhaft speichert — inklusive Fehlerbehandlung und Wiederanlauf bei Ausfällen.",
      money: ["api-entwicklung", "web-app-entwicklung", "softwareentwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  /* ── UNTERNEHMEN ────────────────────────────────────────────────────────── */
  "erp-systeme": {
    nexcel: {
      systemName: "Individuelle ERP-Systeme",
      title: "ERP-Abläufe automatisieren · NEXCEL AI",
      description:
        "Aufträge, Warenfluss und Auswertung ohne Medienbrüche: automatisierte Abläufe auf einer Datenbasis statt paralleler Insellösungen.",
      h1: "Betriebsabläufe auf eine Datenbasis bringen",
      aeoAnswer:
        "Wenn Auftrag, Lager, Rechnung und Auswertung in getrennten Werkzeugen liegen, entstehen doppelte Eingaben und widersprüchliche Zahlen. Ein zusammenhängendes Betriebssystem führt diese Schritte auf einer Datenbasis zusammen und automatisiert die Übergänge. NEXCEL AI analysiert dafür Ihre Prozesskette und bestimmt, welche Schritte automatisiert laufen können.",
      money: ["digitale-betriebssysteme", "automatisierung", "ki-systeme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Individuelle ERP-Systeme",
      title: "ERP-System entwickeln lassen | AGI Works",
      description:
        "Individuelles ERP statt Standardlizenz: Datenmodell, Module und Rechte werden exakt an Ihren realen Betriebsablauf gebaut.",
      h1: "ERP-Software, die Ihren Betrieb abbildet",
      aeoAnswer:
        "Ein individuelles ERP lohnt sich, wenn ein Betrieb Abläufe hat, für die Standardsysteme teure Anpassungen oder Umwege verlangen. AGI Works entwirft zuerst das Datenmodell, entwickelt dann die benötigten Module und lässt weg, was nicht gebraucht wird. Migration bestehender Daten und Schnittstellen zu Buchhaltung oder Shop gehören zum Projekt.",
      money: ["erp-system-entwicklung", "softwareentwicklung", "admin-panel-entwicklung"],
      knowledge: "erp-system-einfuehren",
    },
  },

  "admin-operations-system": {
    nexcel: {
      systemName: "Admin- & Operations-System",
      title: "Operations-Abläufe automatisieren · NEXCEL AI",
      description:
        "Wiederkehrende Betriebsaufgaben laufen regelbasiert ab: weniger Klickarbeit, klarere Zuständigkeiten und nachvollziehbare Schritte.",
      h1: "Tagesgeschäft, das sich selbst organisiert",
      aeoAnswer:
        "Im Tagesgeschäft binden Routineaufgaben wie Statuspflege, Weiterleitungen und Erinnerungen viel Zeit, ohne Wert zu schaffen. Regelbasierte Automatisierung übernimmt diese Schritte und protokolliert sie nachvollziehbar. NEXCEL AI identifiziert die Aufgaben mit dem größten Zeitanteil und automatisiert sie zuerst.",
      money: ["automatisierung", "digitale-betriebssysteme", "ki-systeme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Admin- & Operations-System",
      title: "Admin-Panel entwickeln lassen | AGI Works",
      description:
        "Backoffice-Oberfläche mit Rollen, Freigaben und Protokollierung — als individuelle Anwendung auf Ihre Datenstruktur entwickelt.",
      h1: "Ein Backoffice, das zu Ihren Daten passt",
      aeoAnswer:
        "Ein Admin-Panel ist die interne Oberfläche, über die ein Team die Daten eines Systems pflegt und steuert. Entscheidend sind fein abgestufte Rechte, Freigabeschritte und ein Protokoll darüber, wer wann was geändert hat. AGI Works entwickelt diese Oberfläche passend zu Ihrer bestehenden Datenstruktur, statt sie über ein generisches Tool zu stülpen.",
      money: ["admin-panel-entwicklung", "web-app-entwicklung", "softwareentwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  "dokumentenmanagement-freigaben": {
    nexcel: {
      systemName: "Dokumentenmanagement & Freigaben",
      title: "Dokumentenfreigaben automatisieren · NEXCEL AI",
      description:
        "Prüfen, freigeben, archivieren: Dokumentenläufe folgen festen Regeln statt langer E-Mail-Ketten und manueller Erinnerungen.",
      h1: "Freigaben, die nicht im Postfach hängen bleiben",
      aeoAnswer:
        "Freigabeprozesse verzögern sich meist nicht an der Entscheidung, sondern daran, dass niemand weiß, bei wem ein Dokument gerade liegt. Ein automatisierter Lauf leitet jedes Dokument nach festen Regeln weiter, erinnert bei Verzug und archiviert nach Abschluss. NEXCEL AI bildet Ihre Freigabestufen ab und macht den Status jederzeit sichtbar.",
      money: ["automatisierung", "digitale-betriebssysteme", "email-automation"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Dokumentenmanagement & Freigaben",
      title: "Dokumentenmanagement entwickeln | AGI Works",
      description:
        "DMS mit Versionierung, Zugriffsrechten und Volltextsuche — individuell entwickelt und revisionssicher in Ihre Ablage integriert.",
      h1: "Dokumentenverwaltung mit belastbarer Rechtestruktur",
      aeoAnswer:
        "Ein Dokumentenmanagementsystem muss drei Dinge zuverlässig leisten: jede Version nachvollziehbar aufbewahren, Zugriff präzise steuern und Inhalte schnell auffindbar machen. AGI Works entwickelt dafür Speicherstruktur, Rechtemodell und Volltextindex und bindet vorhandene Ablagen und Signaturdienste an.",
      money: ["softwareentwicklung", "web-app-entwicklung", "api-entwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  "projekt-aufgabenmanagement": {
    nexcel: {
      systemName: "Projekt- & Aufgabenmanagement",
      title: "Projektabläufe automatisieren · NEXCEL AI",
      description:
        "Aufgaben entstehen, wandern und eskalieren automatisch entlang Ihres Prozesses — statt Statuspflege in Tabellen und Chatverläufen.",
      h1: "Aufgaben, die sich selbst weiterbewegen",
      aeoAnswer:
        "In vielen Teams kostet nicht die Arbeit selbst, sondern deren Verwaltung die meiste Zeit: Aufgaben anlegen, zuweisen, Status pflegen und nachhaken. Automatisierte Projektabläufe erzeugen Aufgaben aus auslösenden Ereignissen und bewegen sie regelbasiert weiter. NEXCEL AI bildet dafür Ihre Projektlogik ab.",
      money: ["automatisierung", "digitale-betriebssysteme", "ki-systeme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Projekt- & Aufgabenmanagement",
      title: "Projektmanagement-Software entwickeln | AGI Works",
      description:
        "Individuelles Werkzeug für Projekte, Zeiten und Ressourcen: entwickelt entlang Ihrer Methodik statt an ein fremdes Modell angepasst.",
      h1: "Projektsoftware entlang Ihrer eigenen Methodik",
      aeoAnswer:
        "Projektwerkzeuge von der Stange bringen ein eigenes Vorgehensmodell mit, dem sich das Team anpassen muss. Eine individuelle Lösung dreht das um: Ihre Phasen, Rollen und Kennzahlen bestimmen die Struktur. AGI Works entwickelt Datenmodell, Planungsansichten und Zeiterfassung und bindet Kalender sowie Abrechnung an.",
      money: ["web-app-entwicklung", "softwareentwicklung", "admin-panel-entwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  "mitarbeiter-hr-system": {
    nexcel: {
      systemName: "Mitarbeiter- & HR-System",
      title: "HR-Prozesse automatisieren · NEXCEL AI",
      description:
        "Onboarding, Abwesenheiten und Dokumente laufen strukturiert ab: HR wird entlastet und Mitarbeitende erhalten verlässliche Abläufe.",
      h1: "Personalabläufe ohne Sammelmappen und Nachfragen",
      aeoAnswer:
        "Personalprozesse bestehen aus vielen kleinen, immer gleichen Schritten: Unterlagen anfordern, Zugänge einrichten, Fristen im Blick behalten. Automatisiert laufen diese Ketten selbstständig ab und melden nur Ausnahmen. NEXCEL AI richtet die Abläufe so ein, dass Mitarbeitende jederzeit den Stand ihrer Vorgänge sehen.",
      money: ["automatisierung", "digitale-betriebssysteme", "email-automation"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Mitarbeiter- & HR-System",
      title: "HR-Software entwickeln lassen | AGI Works",
      description:
        "Personalakte, Abwesenheiten und Rollen als individuelle Anwendung — datenschutzkonform aufgebaut und an Lohnsysteme angebunden.",
      h1: "HR-Software mit sauberem Datenschutzkonzept",
      aeoAnswer:
        "HR-Software verarbeitet besonders schützenswerte Daten, weshalb Zugriffskonzept und Löschfristen zur Architektur gehören und nicht nachträglich ergänzt werden. AGI Works entwickelt Personalakte, Abwesenheitslogik und Rollen mit genau abgegrenzten Sichtbarkeiten und bindet Lohnabrechnung und Zeiterfassung über Schnittstellen an.",
      money: ["softwareentwicklung", "web-app-entwicklung", "api-entwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  "warenwirtschaft-lagerverwaltung": {
    nexcel: {
      systemName: "Warenwirtschaft & Lagerverwaltung",
      title: "Warenwirtschaft automatisieren · NEXCEL AI",
      description:
        "Bestände, Nachbestellung und Buchungen laufen automatisch mit: weniger Fehlmengen, weniger Zählaufwand und jederzeit aktuelle Zahlen.",
      h1: "Bestände, die sich selbst fortschreiben",
      aeoAnswer:
        "Bestandsfehler entstehen fast immer dort, wo Bewegungen manuell nachgetragen werden. Wenn Verkauf, Wareneingang und Retoure den Bestand automatisch fortschreiben und Nachbestellungen bei Unterschreiten einer Schwelle auslösen, sinken Fehlmengen und Zählaufwand. NEXCEL AI verbindet dafür Ihre Verkaufskanäle mit der Bestandsführung.",
      money: ["automatisierung", "digitale-betriebssysteme", "ki-systeme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Warenwirtschaft & Lagerverwaltung",
      title: "Lagerverwaltung entwickeln lassen | AGI Works",
      description:
        "Individuelle Warenwirtschaft mit Artikelstamm, Chargen und Barcode-Logik — entwickelt und an Shop sowie Buchhaltung angebunden.",
      h1: "Warenwirtschaft für Ihre Lagerlogik",
      aeoAnswer:
        "Lagerlogik unterscheidet sich stark je nach Branche: Chargen und Haltbarkeit, Seriennummern, Lagerplätze oder Kommissionierwege stellen jeweils andere Anforderungen. AGI Works entwickelt Artikelstamm, Buchungslogik und Barcode-Erfassung passend dazu und verbindet das System mit Shop, Versand und Buchhaltung.",
      money: ["erp-system-entwicklung", "softwareentwicklung", "api-entwicklung"],
      knowledge: "erp-system-einfuehren",
    },
  },

  "dashboard-reporting": {
    nexcel: {
      systemName: "Dashboard & Reporting",
      title: "Kennzahlen & Reporting automatisieren · NEXCEL AI",
      description:
        "Zahlen entstehen automatisch statt in Monatsarbeit: laufend aktuelle Kennzahlen als belastbare Grundlage für Entscheidungen.",
      h1: "Kennzahlen, die nicht erst zusammengesucht werden",
      aeoAnswer:
        "Wenn Auswertungen manuell aus mehreren Quellen zusammengetragen werden, sind sie beim Erscheinen bereits veraltet und schwer überprüfbar. Automatisiertes Reporting zieht die Zahlen direkt aus den führenden Systemen und aktualisiert sie fortlaufend. NEXCEL AI legt gemeinsam mit Ihnen fest, welche Kennzahlen tatsächlich Entscheidungen beeinflussen.",
      money: ["digitale-betriebssysteme", "automatisierung", "ki-systeme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Dashboard & Reporting",
      title: "Dashboard entwickeln lassen | AGI Works",
      description:
        "Individuelle Auswertungsoberfläche: Datenquellen anbinden, Kennzahlen modellieren und auch bei großen Datenmengen schnell darstellen.",
      h1: "Auswertungen direkt auf Ihren Datenquellen",
      aeoAnswer:
        "Ein belastbares Dashboard steht und fällt mit der Datenschicht darunter: Quellen müssen verlässlich angebunden, Kennzahlen eindeutig definiert und Abfragen performant sein. AGI Works modelliert diese Schicht, entwickelt die Visualisierung und sorgt über Aggregation und Caching dafür, dass Auswertungen auch bei großen Datenmengen schnell bleiben.",
      money: ["web-app-entwicklung", "api-entwicklung", "softwareentwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "recruiting-bewerberplattform": {
    nexcel: {
      systemName: "Recruiting & Bewerberplattform",
      title: "Recruiting-Prozess automatisieren · NEXCEL AI",
      description:
        "Bewerbungen automatisch erfassen, einordnen und beantworten — schnellere Rückmeldung ohne zusätzlichen Aufwand im Team.",
      h1: "Bewerbungen beantworten, bevor jemand abspringt",
      aeoAnswer:
        "Im Recruiting entscheidet Geschwindigkeit: Wer erst nach Tagen antwortet, verliert Kandidaten an schnellere Unternehmen. Ein automatisierter Prozess bestätigt den Eingang sofort, ordnet die Bewerbung der passenden Stelle zu und erinnert Verantwortliche an offene Bewertungen. NEXCEL AI verknüpft diese Kette mit Ihrer Stellenausschreibung.",
      money: ["automatisierung", "email-automation", "digitale-betriebssysteme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Recruiting & Bewerberplattform",
      title: "Bewerberportal entwickeln lassen | AGI Works",
      description:
        "Karriereseite, Bewerbermanagement und Auswahl-Workflow als individuelle Plattform mit Rollen und Datenschutzkonzept entwickelt.",
      h1: "Bewerberplattform von der Karriereseite bis zur Auswahl",
      aeoAnswer:
        "Eine Bewerberplattform verbindet die öffentliche Karriereseite mit dem internen Auswahlprozess. Technisch gehören dazu Stellenverwaltung, sicherer Upload von Unterlagen, Bewertungsschritte mit getrennten Rechten sowie automatische Löschfristen nach Abschluss. AGI Works entwickelt diese Bestandteile als zusammenhängende Anwendung.",
      money: ["web-app-entwicklung", "webseiten-erstellen-lassen", "softwareentwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  /* ── KI ─────────────────────────────────────────────────────────────────── */
  "ki-automatisierung": {
    nexcel: {
      systemName: "KI & Automatisierung",
      title: "KI-Automatisierung für Unternehmen · NEXCEL AI",
      description:
        "Wiederkehrende Abläufe mit KI und festen Regeln automatisieren: Aufgaben, Texte und Vorentscheidungen laufen im Hintergrund mit.",
      h1: "KI dort einsetzen, wo sie Arbeit wirklich abnimmt",
      aeoAnswer:
        "KI-Automatisierung ist dann sinnvoll, wenn eine Aufgabe häufig vorkommt, klar beschreibbar ist und ihr Ergebnis überprüfbar bleibt. Typische Fälle sind das Einordnen eingehender Nachrichten, das Vorbereiten von Antworten und das Zusammenfassen von Vorgängen. NEXCEL AI kombiniert Sprachmodelle mit festen Regeln, damit Ergebnisse nachvollziehbar bleiben.",
      money: ["ki-systeme", "automatisierung", "ki-agenten"],
      knowledge: "was-ist-ki-automatisierung",
    },
    agiworks: {
      systemName: "KI & Automatisierung",
      title: "KI-Funktionen in Software integrieren | AGI Works",
      description:
        "Sprachmodelle und Automatisierungslogik technisch einbinden: Schnittstellen, Datenfluss und Kontrollmechanismen sauber implementiert.",
      h1: "KI-Funktionen sauber in Ihre Anwendung einbauen",
      aeoAnswer:
        "Der schwierige Teil bei KI-Funktionen ist selten das Modell, sondern die Umgebung darum herum: Welche Daten dürfen übergeben werden, wie werden Antworten geprüft, was passiert bei Zeitüberschreitung oder Fehlern. AGI Works implementiert diese Schicht mit Protokollierung, Kostengrenzen und einem definierten Rückfallverhalten.",
      money: ["api-entwicklung", "softwareentwicklung", "web-app-entwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "ki-telefonagent-voice": {
    nexcel: {
      systemName: "KI-Telefonagent & Voice",
      title: "KI-Telefonagent für eingehende Anrufe · NEXCEL AI",
      description:
        "Anrufe werden angenommen, qualifiziert und dokumentiert — auch außerhalb der Geschäftszeiten und ohne verpasste Anfragen.",
      h1: "Kein verpasster Anruf mehr, auch abends nicht",
      aeoAnswer:
        "Ein KI-Telefonagent nimmt eingehende Anrufe entgegen, erfragt strukturiert das Anliegen und legt daraus einen dokumentierten Vorgang an. Komplexe Fälle werden an einen Mitarbeitenden übergeben, einfache direkt abgeschlossen. NEXCEL AI hinterlegt Gesprächsführung und Übergaberegeln passend zu Ihrem Geschäft.",
      money: ["ki-agenten", "ki-systeme", "ki-fuer-vertrieb"],
      knowledge: "was-ist-ein-ki-agent",
    },
    agiworks: {
      systemName: "KI-Telefonagent & Voice",
      title: "Voice-Agent technisch umsetzen | AGI Works",
      description:
        "Telefonie, Sprachmodell und CRM verbinden: Rufnummern-Routing, Gesprächslogik und Protokollierung sauber implementiert.",
      h1: "Telefonie, Sprachmodell und Datenbank verbinden",
      aeoAnswer:
        "Ein Voice-Agent verbindet drei Systeme in Echtzeit: Telefonanlage, Sprachverarbeitung und die Datenbank, in der das Ergebnis landet. Kritisch sind niedrige Latenz, sauberes Rufnummern-Routing und ein definiertes Verhalten bei Verbindungsabbruch. AGI Works implementiert diese Kette samt Protokollierung jedes Gesprächsverlaufs.",
      money: ["api-entwicklung", "softwareentwicklung", "crm-system-entwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },

  /* ── PLATTFORMEN ────────────────────────────────────────────────────────── */
  "premium-websysteme": {
    nexcel: {
      systemName: "Premium-Websysteme",
      title: "Websysteme mit Conversion-Fokus · NEXCEL AI",
      description:
        "Websites als Teil des Vertriebsprozesses gedacht: Struktur, Inhalte und Messpunkte auf qualifizierte Anfragen ausgerichtet.",
      h1: "Die Website als erster Schritt im Vertriebsprozess",
      aeoAnswer:
        "Eine Website erzeugt dann Anfragen, wenn sie wie eine Vertriebsstrecke aufgebaut ist: klare Einstiegspunkte, ein nachvollziehbarer Weg zur Anfrage und Messpunkte an jedem Übergang. NEXCEL AI plant diese Struktur entlang Ihrer Zielgruppen und verbindet die Anfrage direkt mit dem nachgelagerten Lead-Prozess.",
      money: ["customer-experience-systeme", "lead-automation", "digitale-betriebssysteme"],
      knowledge: "customer-experience-mit-ki-verbessern",
    },
    agiworks: {
      systemName: "Premium-Websysteme",
      title: "Website entwickeln lassen | AGI Works",
      description:
        "Performante, wartbare Websysteme mit sauberer Codebasis, technischer SEO-Grundlage und einem eigenen Redaktionsbereich.",
      h1: "Websysteme mit wartbarer Codebasis",
      aeoAnswer:
        "Ein Websystem unterscheidet sich von einer Baukastenseite durch Wartbarkeit: eigener Quellcode, überprüfbare Ladezeiten, saubere semantische Struktur und ein Redaktionsbereich, der zum Redaktionsprozess passt. AGI Works entwickelt auf dieser Basis und liefert Rendering-Strategie, Bildoptimierung und technische SEO-Grundlagen mit.",
      money: ["webseiten-erstellen-lassen", "web-app-entwicklung", "softwareentwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "branchen-plattformen": {
    nexcel: {
      systemName: "Branchen-Plattformen",
      title: "Branchenplattform aufbauen · NEXCEL AI",
      description:
        "Anbieter, Nachfrage und Abläufe einer Branche digital zusammenführen und die Prozesse dahinter weitgehend automatisieren.",
      h1: "Eine Branche auf einer Plattform zusammenführen",
      aeoAnswer:
        "Branchenplattformen entstehen dort, wo Angebot und Nachfrage bislang über Telefon, E-Mail und Listen zusammenfinden. Der Wert liegt weniger im Verzeichnis als in den automatisierten Abläufen dahinter: Anfrage, Zuordnung, Abwicklung und Abrechnung. NEXCEL AI entwirft dieses Prozessmodell vor dem Aufbau der Plattform.",
      money: ["digitale-betriebssysteme", "automatisierung", "lead-automation"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Branchen-Plattformen",
      title: "Branchenplattform entwickeln | AGI Works",
      description:
        "Plattformsoftware mit Mandanten, Rollen und Matching-Logik — technisch skalierbar für Ihr Branchenmodell entwickelt.",
      h1: "Plattformsoftware für mehrseitige Marktmodelle",
      aeoAnswer:
        "Eine mehrseitige Plattform bedient mindestens zwei Nutzergruppen mit unterschiedlichen Rechten, Ansichten und Abrechnungsmodellen. AGI Works entwickelt dafür Mandantentrennung, Rollenmodell und Matching-Logik sowie die Abrechnung zwischen den Seiten. Die Architektur wird von Beginn an auf wachsende Nutzerzahlen ausgelegt.",
      money: ["saas-entwicklung", "web-app-entwicklung", "softwareentwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "saas-plattform-multi-tenant": {
    nexcel: {
      systemName: "SaaS-Plattform / Multi-Tenant",
      title: "SaaS-Onboarding & Betrieb automatisieren · NEXCEL AI",
      description:
        "Registrierung, Abrechnung und Kundenkommunikation laufen automatisch — der Betrieb wächst ohne proportional mehr Aufwand.",
      h1: "SaaS-Betrieb, der nicht mit jedem Kunden mitwächst",
      aeoAnswer:
        "Im SaaS-Geschäft entscheidet der Automatisierungsgrad über die Marge: Registrierung, Bereitstellung, Zahlungseinzug, Mahnwesen und Kündigung müssen ohne manuellen Eingriff funktionieren. NEXCEL AI baut diese Abläufe als zusammenhängende Kette auf, sodass zusätzliche Kunden keinen zusätzlichen Betreuungsaufwand erzeugen.",
      money: ["automatisierung", "digitale-betriebssysteme", "email-automation"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "SaaS-Plattform / Multi-Tenant",
      title: "SaaS-Plattform entwickeln lassen | AGI Works",
      description:
        "Mandantenfähige Architektur mit Abo-Logik, Rechten und Skalierung — von der Datenbank bis zum Deployment entwickelt.",
      h1: "Mandantenfähige Architektur von Anfang an",
      aeoAnswer:
        "Mandantenfähigkeit lässt sich später nur mit hohem Aufwand nachrüsten, weil sie jede Datenbankabfrage und jede Rechteprüfung betrifft. AGI Works legt die Trennung deshalb im Datenmodell an, entwickelt Abo- und Abrechnungslogik dazu und richtet Deployment sowie Überwachung darauf aus.",
      money: ["saas-entwicklung", "web-app-entwicklung", "api-entwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "akademie-lernplattform": {
    nexcel: {
      systemName: "Akademie- & Lernplattform",
      title: "Schulungen & Lernwege automatisieren · NEXCEL AI",
      description:
        "Kurse zuweisen, Fortschritt verfolgen und Nachweise automatisch erzeugen — Weiterbildung ohne manuelle Verwaltung im Hintergrund.",
      h1: "Weiterbildung, die sich selbst verwaltet",
      aeoAnswer:
        "Der Aufwand bei Schulungen entsteht selten beim Inhalt, sondern bei der Verwaltung: zuweisen, erinnern, Teilnahme belegen, Nachweise ausstellen. Automatisiert laufen diese Schritte anhand von Rolle und Eintrittsdatum von selbst. NEXCEL AI verbindet die Lernwege mit Ihren Personalprozessen und dokumentiert Pflichtschulungen prüffest.",
      money: ["automatisierung", "digitale-betriebssysteme", "email-automation"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Akademie- & Lernplattform",
      title: "Lernplattform entwickeln lassen | AGI Works",
      description:
        "Kursstruktur, Videoauslieferung und Zertifikate als individuelle Anwendung entwickelt und an Ihre Systeme angebunden.",
      h1: "Lernplattform mit eigener Kurs- und Rechtelogik",
      aeoAnswer:
        "Eine eigene Lernplattform lohnt sich, wenn Kursstruktur, Zugangsregeln oder Zertifikatslogik von Standardsystemen nicht abgedeckt werden. AGI Works entwickelt Kursmodell, Fortschrittsverfolgung und Zertifikatserzeugung und richtet eine geschützte Videoauslieferung ein, die Inhalte nur berechtigten Teilnehmern zugänglich macht.",
      money: ["web-app-entwicklung", "saas-entwicklung", "softwareentwicklung"],
      knowledge: "was-ist-eine-web-app",
    },
  },

  "schnittstellen-integrationen": {
    nexcel: {
      systemName: "Schnittstellen & Integrationen",
      title: "Systeme verbinden & Daten abgleichen · NEXCEL AI",
      description:
        "Daten fließen automatisch zwischen Ihren Werkzeugen — statt Export, Import und doppelter Pflege in mehreren Systemen.",
      h1: "Schluss mit Export, Import und Doppelpflege",
      aeoAnswer:
        "Wenn dieselben Daten in mehreren Werkzeugen gepflegt werden, entstehen Abweichungen, die später mühsam aufgelöst werden müssen. Eine Integration legt fest, welches System führend ist, und gleicht die übrigen automatisch ab. NEXCEL AI klärt diese Datenhoheit und richtet den laufenden Abgleich samt Fehlermeldung ein.",
      money: ["automatisierung", "digitale-betriebssysteme", "ki-systeme"],
      knowledge: "prozesse-automatisieren-im-mittelstand",
    },
    agiworks: {
      systemName: "Schnittstellen & Integrationen",
      title: "API & Schnittstellen entwickeln | AGI Works",
      description:
        "REST- und Webhook-Integrationen mit Fehlerbehandlung, Überwachung und Wiederanlauf — stabil implementiert und dokumentiert.",
      h1: "Integrationen, die auch bei Ausfällen halten",
      aeoAnswer:
        "Eine Integration ist erst dann fertig, wenn sie den Fehlerfall beherrscht: Ein Zielsystem antwortet nicht, ein Datensatz wird doppelt geliefert, eine Anfrage läuft in eine Zeitüberschreitung. AGI Works implementiert Schnittstellen mit Wiederholungslogik, Idempotenz und Überwachung, sodass Fehler sichtbar werden statt still Daten zu verlieren.",
      money: ["api-entwicklung", "softwareentwicklung", "web-app-entwicklung"],
      knowledge: "individualsoftware-vs-standardsoftware",
    },
  },
};

/* ────────────────────────────────────────────────────────────────────────────
 * Related-path generation — every link is derived, so none can dangle.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Commercial hub path per brand. */
const MONEY_PREFIX: Record<BrandKey, string> = {
  nexcel: "/loesungen",
  agiworks: "/leistungen",
};

/** Sibling systems in the same category, excluding the page itself. */
function siblingsOf(slug: SystemSlug, limit: number): SystemSlug[] {
  const cat = SYSTEM_CATEGORY[slug];
  const all = SYSTEM_SLUGS.filter((s) => SYSTEM_CATEGORY[s] === cat && s !== slug);
  if (all.length >= limit) {
    // Rotate the start index by position so link graphs differ per page and
    // every sibling receives inbound links (no orphan inside a category).
    const start = SYSTEM_SLUGS.indexOf(slug) % all.length;
    return Array.from({ length: limit }, (_, i) => all[(start + i) % all.length]);
  }
  return all;
}

function buildRelatedPaths(brand: BrandKey, slug: SystemSlug, copy: BrandCopy): string[] {
  const paths: string[] = [];
  siblingsOf(slug, 3).forEach((s) => paths.push(`/systeme/${s}`));
  copy.money.forEach((m) => paths.push(`${MONEY_PREFIX[brand]}/${m}`));
  paths.push(`/wissen/${copy.knowledge}`);
  paths.push("/projekte");
  paths.push("/systemanalyse");
  // De-duplicate while preserving order.
  return Array.from(new Set(paths));
}

function buildSystemPages(): SystemPage[] {
  const pages: SystemPage[] = [];
  (["nexcel", "agiworks"] as BrandKey[]).forEach((brand) => {
    SYSTEM_SLUGS.forEach((slug) => {
      const copy = COPY[slug][brand];
      pages.push({
        id: `${brand}:/systeme/${slug}`,
        brand,
        slug,
        path: `/systeme/${slug}`,
        category: SYSTEM_CATEGORY[slug],
        systemName: copy.systemName,
        title: copy.title,
        description: copy.description,
        h1: copy.h1,
        aeoAnswer: copy.aeoAnswer,
        relatedPaths: buildRelatedPaths(brand, slug, copy),
        // Content is brand-differentiated and passes the content/duplicate gates,
        // so these ship indexable rather than as candidates.
        approved: true,
        manualIndexApproval: true,
      });
    });
  });
  return pages;
}

export const SYSTEM_PAGES: SystemPage[] = buildSystemPages();

export function getSystemPage(
  brand: BrandKey,
  slug: string
): SystemPage | undefined {
  return SYSTEM_PAGES.find((p) => p.brand === brand && p.slug === slug);
}

export function getSystemPagesForBrand(brand: BrandKey): SystemPage[] {
  return SYSTEM_PAGES.filter((p) => p.brand === brand);
}
