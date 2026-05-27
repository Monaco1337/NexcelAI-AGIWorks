import type { IndustryId } from "./types";

export const DURATION_HINT = "Dauer: ca. 2–4 Minuten";

export const STEP_LABELS: Record<string, { title: string; subtitle?: string }> = {
  intro: {
    title: "Systemanalyse",
    subtitle: "Strukturierte Erfassung Ihrer Ausgangslage — als Basis für Architektur und Umsetzung.",
  },
  profile: { title: "Unternehmensprofil", subtitle: "Wer Sie sind — damit wir den Kontext präzise einordnen." },
  context: {
    title: "Ausgangslage",
    subtitle: "Ein kurzes Gespräch in vier Fragen — danach können Sie in eigenen Worten ergänzen.",
  },
  industry: { title: "Branche & Spezifika", subtitle: "Ihre Domäne prägt Risiken, Chancen und Systemanforderungen." },
  pain: {
    title: "Diagnose",
    subtitle:
      "Wo knirscht es im Alltag? Wählen Sie pro Thema alles Zutreffende — mehrere Antworten sind möglich.",
  },
  tools: { title: "Systemlandschaft", subtitle: "Welche Werkzeuge prägen Ihren Betrieb heute?" },
  goals: { title: "Zielbild", subtitle: "Was soll sich messbar verbessern?" },
  priority: { title: "Priorisierung", subtitle: "Wo zuerst Hebel setzen — mit maximaler Wirkung." },
  project: { title: "Lösungsrichtung", subtitle: "Welche Art von Intervention passt zu Ihrer Situation?" },
  investment: { title: "Rahmen", subtitle: "Reifegrad und Zeit — ohne Verkaufsgespräch." },
  contact: { title: "Übergabe", subtitle: "Wie wir Ihre Analyse sicher aufnehmen." },
  complete: { title: "Analyse eingereicht", subtitle: "Ihre Daten sind bei uns eingegangen." },
};

export const COMPANY_SIZE_OPTIONS = [
  { id: "solo" as const, label: "Einzelunternehmer:in / Freiberuf" },
  { id: "micro" as const, label: "2–10 Mitarbeitende" },
  { id: "small" as const, label: "11–50 Mitarbeitende" },
  { id: "medium" as const, label: "51–250 Mitarbeitende" },
  { id: "large" as const, label: "251–1.000 Mitarbeitende" },
  { id: "enterprise" as const, label: "1.000+ Mitarbeitende" },
];

export const TEAM_SIZE_OPTIONS = [
  { id: "1-5" as const, label: "1–5" },
  { id: "6-15" as const, label: "6–15" },
  { id: "16-50" as const, label: "16–50" },
  { id: "51-200" as const, label: "51–200" },
  { id: "200+" as const, label: "200+" },
];

export const DIGITAL_MATURITY_OPTIONS = [
  { id: "low" as const, label: "Niedrig", hint: "viel Papier / Excel / wenig Vernetzung" },
  { id: "medium" as const, label: "Mittel", hint: "einzelne Tools, teils manuell" },
  { id: "high" as const, label: "Hoch", hint: "kernprozesse digital, Integrationen teilweise" },
  { id: "very_high" as const, label: "Sehr hoch", hint: "durchdigitalisiert, APIs, Automatisierung" },
];

export const SITUATION_DRIVERS = [
  { id: "wachstum", label: "Wachstum" },
  { id: "umbruch", label: "Umbruch / Transformation" },
  { id: "neuaufbau", label: "Neuaufbau" },
  { id: "optimierung", label: "Optimierung" },
  { id: "restrukturierung", label: "Restrukturierung" },
  { id: "digitalisierung", label: "Digitalisierung" },
  { id: "automatisierung", label: "Automatisierung" },
  { id: "plattform", label: "Plattformaufbau" },
  { id: "modernisierung", label: "Modernisierung Bestand" },
];

export const INDUSTRY_OPTIONS: { id: IndustryId; label: string }[] = [
  { id: "immobilien", label: "Immobilien" },
  { id: "gastronomie", label: "Gastronomie" },
  { id: "handwerk", label: "Handwerk" },
  { id: "bau", label: "Bau" },
  { id: "logistik", label: "Logistik" },
  { id: "produktion", label: "Produktion" },
  { id: "ecommerce", label: "E-Commerce" },
  { id: "dienstleistung", label: "Dienstleistung" },
  { id: "agentur", label: "Agentur" },
  { id: "beauty", label: "Beauty / Wellness" },
  { id: "coaching", label: "Coaching / Beratung" },
  { id: "gesundheit", label: "Gesundheitswesen" },
  { id: "saas", label: "SaaS / Tech" },
  { id: "finanzen", label: "Finanzen" },
  { id: "bildung", label: "Bildung" },
  { id: "sonstige", label: "Sonstige" },
];

export type IndustryFollowupQuestion = {
  id: string;
  title: string;
  options: { id: string; label: string }[];
};

export const INDUSTRY_FOLLOWUPS: Partial<Record<IndustryId, IndustryFollowupQuestion[]>> = {
  immobilien: [
    {
      id: "immo_ops",
      title: "Welche Bereiche sind für Sie besonders relevant?",
      options: [
        { id: "objektverwaltung", label: "Objekt- / Bestandsverwaltung" },
        { id: "leads", label: "Leadgewinnung & Akquise" },
        { id: "expose", label: "Exposés & Vermarktung" },
        { id: "besichtigung", label: "Besichtigungen & Terminlogik" },
        { id: "dokumente", label: "Dokumente & Verträge" },
        { id: "crm", label: "CRM & Kundenstammdaten" },
        { id: "handwerker", label: "Handwerker- / Serviceprozesse" },
        { id: "maengel", label: "Mängelmeldungen / Tickets" },
      ],
    },
    {
      id: "immo_data",
      title: "Wo entstehen typischerweise Medienbrüche?",
      options: [
        { id: "email", label: "E-Mail / Anhänge" },
        { id: "excel", label: "Excel / Listen" },
        { id: "portale", label: "Mehrere Portale / Software" },
        { id: "papier", label: "Papier / Scan" },
        { id: "whatsapp", label: "Messenger / WhatsApp" },
      ],
    },
  ],
  gastronomie: [
    {
      id: "gastro_ops",
      title: "Operative Schwerpunkte",
      options: [
        { id: "reservierung", label: "Reservierungen" },
        { id: "personalplan", label: "Personalplanung / Schichten" },
        { id: "bestellung", label: "Bestellungen / Küche" },
        { id: "kasse", label: "Kasse / Zahlungsfluss" },
        { id: "lieferkette", label: "Lieferketten / Wareneingang" },
        { id: "gaeste", label: "Gästekommunikation" },
        { id: "lieferservice", label: "Lieferung / Plattformen" },
      ],
    },
  ],
  handwerk: [
    {
      id: "hw_ops",
      title: "Kernthemen Handwerk",
      options: [
        { id: "einsatz", label: "Einsatz- / Monteurplanung" },
        { id: "angebot", label: "Angebote & Aufträge" },
        { id: "aufmas", label: "Aufmaß / Dokumentation" },
        { id: "kunde", label: "Kundenkommunikation" },
        { id: "material", label: "Material / Lager" },
        { id: "rechnung", label: "Rechnung / Zahlung" },
      ],
    },
  ],
  bau: [
    {
      id: "bau_ops",
      title: "Bau & Koordination",
      options: [
        { id: "baustelle", label: "Baustellenkoordination" },
        { id: "sub", label: "Subunternehmer / Gewerke" },
        { id: "tagesbericht", label: "Tagesberichte / Fotos" },
        { id: "sicherheit", label: "Sicherheit / Nachweis" },
        { id: "nachtrag", label: "Nachträge / Änderungen" },
      ],
    },
  ],
  logistik: [
    {
      id: "log_ops",
      title: "Logistik-Fokus",
      options: [
        { id: "touren", label: "Touren & Disposition" },
        { id: "fahrer", label: "Fahrer / Kapazität" },
        { id: "slot", label: "Zeitslots / Zustellfenster" },
        { id: "sendung", label: "Sendungsübersicht / Tracking" },
        { id: "schnittstellen", label: "Schnittstellen / APIs" },
        { id: "flotte", label: "Flotte / Fahrzeugdaten" },
      ],
    },
  ],
  produktion: [
    {
      id: "prod_ops",
      title: "Produktion & Steuerung",
      options: [
        { id: "planung", label: "Produktionsplanung" },
        { id: "qualitaet", label: "Qualität / Prüfprozesse" },
        { id: "wartung", label: "Wartung / Stillstände" },
        { id: "lager", label: "Lager / Materialfluss" },
        { id: "mes", label: "Maschinendaten / MES" },
      ],
    },
  ],
  ecommerce: [
    {
      id: "eco_ops",
      title: "E-Commerce Hebel",
      options: [
        { id: "shop", label: "Shop / Checkout" },
        { id: "lager", label: "Lager / Fulfillment" },
        { id: "retoure", label: "Retouren" },
        { id: "kundenservice", label: "Kundenservice" },
        { id: "marketing", label: "Marketing-Automation" },
        { id: "marktplatz", label: "Marktplätze" },
      ],
    },
  ],
  dienstleistung: [
    {
      id: "dl_ops",
      title: "Dienstleistung — Schwerpunkte",
      options: [
        { id: "angebot", label: "Angebote / Verträge" },
        { id: "projekt", label: "Projektabwicklung" },
        { id: "zeit", label: "Zeiterfassung / Abrechnung" },
        { id: "kunde", label: "Kundenportale" },
        { id: "sla", label: "SLAs / Eskalation" },
      ],
    },
  ],
  agentur: [
    {
      id: "ag_ops",
      title: "Agentur-Prozesse",
      options: [
        { id: "leads", label: "Leads & Pipeline" },
        { id: "angebot", label: "Angebote / SOW" },
        { id: "deliver", label: "Deliverables / Freigaben" },
        { id: "zeit", label: "Zeit / Kapazität" },
        { id: "tools", label: "Tool-Zoo / Übergaben" },
      ],
    },
  ],
  beauty: [
    {
      id: "be_ops",
      title: "Beauty / Terminbetrieb",
      options: [
        { id: "buchung", label: "Buchungen" },
        { id: "verfuegbarkeit", label: "Verfügbarkeiten / Ressourcen" },
        { id: "kunden", label: "Kundenhistorie" },
        { id: "erinnerung", label: "Erinnerungen / No-Shows" },
        { id: "leistung", label: "Leistungen / Pakete" },
        { id: "team", label: "Teamkoordination" },
      ],
    },
  ],
  coaching: [
    {
      id: "co_ops",
      title: "Beratung / Coaching",
      options: [
        { id: "leads", label: "Akquise / Leads" },
        { id: "angebot", label: "Angebote" },
        { id: "mandat", label: "Mandanten / Projekte" },
        { id: "doku", label: "Dokumentation / Nachweise" },
        { id: "billing", label: "Abrechnung" },
      ],
    },
  ],
  gesundheit: [
    {
      id: "gw_ops",
      title: "Gesundheitswesen (ohne Diagnose)",
      options: [
        { id: "termin", label: "Termine / Ressourcen" },
        { id: "doku", label: "Dokumentation / Übergaben" },
        { id: "compliance", label: "Compliance / Nachvollziehbarkeit" },
        { id: "patient", label: "Patienten-/Kundenkommunikation" },
        { id: "abrechnung", label: "Abrechnungsprozesse" },
      ],
    },
  ],
  saas: [
    {
      id: "saas_ops",
      title: "SaaS / Tech",
      options: [
        { id: "workflow", label: "Interne Workflows" },
        { id: "support", label: "Support / Tickets" },
        { id: "datenmodell", label: "Datenmodell / Integrität" },
        { id: "integration", label: "Integrationen" },
        { id: "cs", label: "Customer Success" },
        { id: "release", label: "Release / QA" },
      ],
    },
  ],
  finanzen: [
    {
      id: "fin_ops",
      title: "Finanzen & Controlling",
      options: [
        { id: "reporting", label: "Reporting / KPIs" },
        { id: "freigabe", label: "Freigaben / Workflows" },
        { id: "schnittstelle", label: "Schnittstellen zu ERP/Steuer" },
        { id: "forecast", label: "Planung / Forecast" },
      ],
    },
  ],
  bildung: [
    {
      id: "edu_ops",
      title: "Bildung / Schulbetrieb",
      options: [
        { id: "teilnehmer", label: "Teilnehmer / Kurse" },
        { id: "material", label: "Material / Zugriff" },
        { id: "kommunikation", label: "Kommunikation Eltern/Teams" },
        { id: "pruefung", label: "Prüfungen / Zertifikate" },
      ],
    },
  ],
};

export const PAIN_BLOCKS: {
  id: string;
  title: string;
  subtitle: string;
  items: { id: string; label: string; hint?: string }[];
}[] = [
  {
    id: "processes",
    title: "Ablauf & tägliche Arbeit",
    subtitle: "Was trifft auf Ihre Abläufe zu? Mehrfachauswahl möglich.",
    items: [
      { id: "p_manuell", label: "Zu viele manuelle Aufgaben" },
      { id: "p_uneinheitlich", label: "Prozesse uneinheitlich" },
      { id: "p_nostandard", label: "Keine Standardisierung" },
      { id: "p_doppel", label: "Doppelarbeit" },
      { id: "p_fehler", label: "Hohe Fehleranfälligkeit" },
      {
        id: "p_medienbruch",
        label: "Medienbrüche zwischen Systemen",
        hint: "Informationen müssen oft manuell von einem Tool ins nächste übertragen werden.",
      },
      { id: "p_zustaendig", label: "Unklare Zuständigkeiten" },
      { id: "p_langsam", label: "Langsame Abläufe" },
      { id: "p_nosicht", label: "Fehlende Prozesssicht / Transparenz" },
      { id: "p_noauto", label: "Fehlende Automatisierung" },
    ],
  },
  {
    id: "communication",
    title: "Kommunikation & Zusammenarbeit",
    subtitle: "Informationsfluss intern und extern",
    items: [
      { id: "c_kanaele", label: "Zu viele Kommunikationskanäle" },
      { id: "c_verlust", label: "Informationsverlust" },
      { id: "c_absprache", label: "Unklare Absprachen" },
      { id: "c_intern", label: "Interne Abstimmungsprobleme" },
      { id: "c_extern", label: "Externe Kommunikation schwierig" },
      { id: "c_email", label: "E-Mail-Chaos" },
      { id: "c_messenger", label: "WhatsApp- / Messenger-Chaos" },
      { id: "c_nodoku", label: "Keine zentrale Dokumentation" },
    ],
  },
  {
    id: "data",
    title: "Daten & Transparenz",
    subtitle: "Einheitliche Wahrheit vs. Fragmentierung",
    items: [
      { id: "d_verteilt", label: "Daten auf vielen Tools verteilt" },
      { id: "d_nozentral", label: "Keine zentrale Datenbasis" },
      { id: "d_noauswertung", label: "Keine sauberen Auswertungen" },
      { id: "d_noreport", label: "Kein belastbares Reporting" },
      { id: "d_nokpi", label: "Keine KPI-Transparenz" },
      { id: "d_nonach", label: "Schwache Nachvollziehbarkeit" },
      { id: "d_inkonsistent", label: "Inkonsistente Daten" },
      { id: "d_nort", label: "Fehlende Echtzeitübersicht" },
    ],
  },
  {
    id: "systems",
    title: "Tools & Systeme",
    subtitle: "Landschaft, Integration, technische Schuld",
    items: [
      { id: "s_zuViele", label: "Zu viele Einzellösungen" },
      {
        id: "s_keinTalk",
        label: "Systeme sprechen nicht miteinander",
        hint: "Kaum automatischer Datenaustausch zwischen Programmen.",
      },
      {
        id: "s_insel",
        label: "Insellösungen",
        hint: "Mehrere Tools arbeiten getrennt voneinander — wenig gemeinsamer Datenstand.",
      },
      { id: "s_excel", label: "Starke Excel- / Sheet-Abhängigkeit" },
      { id: "s_alt", label: "Veraltete Tools" },
      { id: "s_noint", label: "Fehlende Integrationen" },
      { id: "s_noplat", label: "Fehlende übergeordnete Plattform" },
      { id: "s_sync", label: "Hoher manueller Sync-Aufwand" },
    ],
  },
  {
    id: "sales",
    title: "Vertrieb & Kundenprozesse",
    subtitle: "Pipeline, Follow-up, Kundendaten",
    items: [
      { id: "v_leadverlust", label: "Lead-Verlust" },
      { id: "v_nopipe", label: "Keine klare Pipeline" },
      { id: "v_langsamAngebot", label: "Langsame Angebotsprozesse" },
      { id: "v_followup", label: "Schwacher Follow-up" },
      { id: "v_kunde", label: "Unübersichtliche Kundendaten" },
      { id: "v_noautoV", label: "Fehlende Vertriebs-Automatisierung" },
      { id: "v_nocrm", label: "Fehlende CRM-Struktur" },
    ],
  },
  {
    id: "operations",
    title: "Betrieb / Operations",
    subtitle: "Tagesgeschäft, Kapazität, Priorisierung",
    items: [
      { id: "o_ressource", label: "Schwierige Ressourcenplanung" },
      { id: "o_termin", label: "Chaotische Terminplanung" },
      { id: "o_kapazitaet", label: "Schlechte Kapazitätsübersicht" },
      { id: "o_engpass", label: "Operative Engpässe" },
      { id: "o_mgmt", label: "Tagesgeschäft frisst Managementkapazität" },
      { id: "o_prio", label: "Schlechte Priorisierung" },
      { id: "o_rueckfragen", label: "Viele Rückfragen / Abstimmungen" },
    ],
  },
  {
    id: "people",
    title: "Personal / Teams",
    subtitle: "Koordination, Wissen, Verantwortung",
    items: [
      { id: "h_koord", label: "Hohe manuelle Koordination" },
      { id: "h_keyperson", label: "Wissensabhängigkeit von Einzelpersonen" },
      {
        id: "h_onboarding",
        label: "Onboarding-Probleme",
        hint: "Neue Mitarbeitende brauchen lange, bis sie produktiv sind.",
      },
      { id: "h_tasks", label: "Fehlende Aufgabenübersicht" },
      { id: "h_verantwortung", label: "Schwache Verantwortlichkeitsstruktur" },
      { id: "h_uebergabe", label: "Interne Übergabefehler" },
    ],
  },
  {
    id: "growth",
    title: "Wachstum / Skalierung",
    subtitle: "Volumen, Komplexität, neue Einheiten",
    items: [
      { id: "g_wachstum", label: "Wachstum, Systeme kommen nicht mit" },
      { id: "g_bruch", label: "Prozesse brechen bei mehr Volumen" },
      { id: "g_noskal", label: "Fehlende Skalierbarkeit" },
      { id: "g_last", label: "Zu hohe operative Last" },
      { id: "g_uebersicht", label: "Management verliert Übersicht" },
      { id: "g_neu", label: "Neue Standorte / Teams schwer integrierbar" },
    ],
  },
  {
    id: "ai",
    title: "KI & Automatisierung",
    subtitle: "Intelligente Entlastung und Entscheidung",
    items: [
      { id: "a_repetitiv", label: "Repetitive Aufgaben nicht automatisiert" },
      { id: "a_noki", label: "KI wird nicht genutzt" },
      { id: "a_nodecision", label: "Keine Entscheidungsunterstützung" },
      { id: "a_nowf", label: "Keine intelligenten Workflows" },
      { id: "a_nokette", label: "Keine Automationskette" },
      { id: "a_nosupport", label: "Kein KI-Support für Mitarbeitende" },
      { id: "a_norouting", label: "Kein intelligentes Routing / Priorisieren" },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & Dokumentation",
    subtitle: "Nachweis, Audit, Genehmigungen",
    items: [
      { id: "comp_nodoku", label: "Prozesse nicht dokumentiert" },
      { id: "comp_find", label: "Dokumente schwer auffindbar" },
      { id: "comp_change", label: "Änderungen nicht nachvollziehbar" },
      { id: "comp_audit", label: "Fehlende Auditierbarkeit" },
      { id: "comp_freigabe", label: "Genehmigungsprozesse fehlen / hakelig" },
      { id: "comp_recht", label: "Rechtliche / interne Anforderungen schwer kontrollierbar" },
    ],
  },
];

export const TOOL_OPTIONS = [
  { id: "crm", label: "CRM" },
  { id: "erp", label: "ERP" },
  { id: "notion", label: "Notion / Wiki" },
  { id: "excel", label: "Excel / Sheets" },
  { id: "slack", label: "Slack / Teams" },
  { id: "email", label: "E-Mail (primär)" },
  { id: "whatsapp", label: "WhatsApp / Messenger" },
  { id: "branche", label: "Branchensoftware" },
  { id: "custom", label: "Individualsoftware" },
  { id: "booking", label: "Buchungssystem" },
  { id: "kasse", label: "Kassensystem / POS" },
  { id: "project", label: "Projektmanagement-Tool" },
  { id: "ticket", label: "Ticketsystem" },
  { id: "dms", label: "DMS / Ablage" },
  { id: "bi", label: "BI / Reporting-Tool" },
];

export const GOAL_OPTIONS = [
  { id: "auto", label: "Prozesse automatisieren" },
  { id: "zeit", label: "Zeit sparen" },
  { id: "kosten", label: "Kosten senken" },
  { id: "entlasten", label: "Mitarbeitende entlasten" },
  { id: "fehler", label: "Fehler reduzieren" },
  { id: "transparenz", label: "Transparenz erhöhen" },
  { id: "plattform", label: "Zentrale Plattform aufbauen" },
  { id: "integrieren", label: "Systeme integrieren" },
  { id: "daten", label: "Daten nutzbar machen" },
  { id: "ki", label: "KI sinnvoll einsetzen" },
  { id: "service", label: "Service verbessern" },
  { id: "vertrieb", label: "Vertrieb verbessern" },
  { id: "skalierung", label: "Operative Skalierung ermöglichen" },
  { id: "entscheidung", label: "Entscheidungen beschleunigen" },
  { id: "souveraen", label: "Digitale Souveränität / Kontrolle" },
  { id: "individual", label: "Individualsoftware entwickeln" },
  { id: "modern", label: "Bestandssoftware modernisieren" },
  { id: "neuportal", label: "Neues Portal / System aufbauen" },
];

export const PROJECT_DIRECTION_OPTIONS = [
  { id: "analyse", label: "Analyse / Strategie" },
  { id: "prozess", label: "Prozessoptimierung" },
  { id: "automatisierung", label: "Automatisierung" },
  { id: "ki", label: "KI-Integration" },
  { id: "plattform", label: "Plattformaufbau" },
  { id: "individual", label: "Individualsoftware" },
  { id: "crm_erp", label: "CRM / ERP / internes Tool" },
  { id: "booking", label: "Buchungs- / Operationssystem" },
  { id: "reporting", label: "Daten- / Reporting-System" },
  { id: "portal", label: "Kundenportal" },
  { id: "modern", label: "Modernisierung Bestand" },
  { id: "unklar", label: "Unklar — gemeinsam herausarbeiten" },
];

export const URGENCY_OPTIONS = [
  { id: "immediate" as const, label: "Sofort", hint: "akuter Handlungsbedarf" },
  { id: "high" as const, label: "Hoch", hint: "in Wochen sichtbar" },
  { id: "medium" as const, label: "Mittel", hint: "in wenigen Monaten" },
  { id: "low" as const, label: "Niedrig", hint: "strategische Vorbereitung" },
];

export const BUDGET_OPTIONS = [
  { id: "unklar", label: "Noch offen / gemeinsam klären" },
  { id: "bis25", label: "bis ca. 25.000 €" },
  { id: "25-75", label: "25.000 – 75.000 €" },
  { id: "75-150", label: "75.000 – 150.000 €" },
  { id: "150plus", label: "150.000 €+" },
  { id: "enterprise", label: "Enterprise / Rahmen unklar" },
];

export const PROJECT_PHASE_OPTIONS = [
  { id: "idee", label: "Idee / Exploration" },
  { id: "planung", label: "In Planung" },
  { id: "akut", label: "Akut / dringend" },
  { id: "lauf_unzufrieden", label: "Läuft — aber unzufrieden" },
];

export const TIME_HORIZON_OPTIONS = [
  { id: "sofort", label: "Sofort starten" },
  { id: "1-3", label: "1–3 Monate" },
  { id: "3-6", label: "3–6 Monate" },
  { id: "6plus", label: "6+ Monate" },
];

export const CONTACT_PREF_OPTIONS = [
  { id: "email" as const, label: "E-Mail" },
  { id: "phone" as const, label: "Telefon" },
  { id: "video" as const, label: "Video (Teams / Meet)" },
  { id: "either" as const, label: "Egal / Sie schlagen vor" },
];
