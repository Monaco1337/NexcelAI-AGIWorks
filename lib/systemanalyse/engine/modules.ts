/**
 * Module Registry — Analysis Modules
 * ─────────────────────────────────────────────────────────────
 * Jede Frage ist ein eigenständiges Modul. Der Core-Flow lädt
 * die Module aus `CORE_MODULE_IDS`. Erweiterte Module werden
 * durch `followUpRules` kontextabhängig nachgeladen.
 *
 * Erweitern: einfach neues `AnalysisModule` registrieren und
 * eine ID in `followUpRules` referenzieren — kein UI-Change nötig.
 */

import type { AnalysisModule } from "./types";

export const CORE_MODULE_IDS = [
  "growth-lead-system",
  "conversion-scoring",
  "automation-grade",
] as const;

export const ANALYSIS_MODULES: AnalysisModule[] = [
  // ─────────────────────────────────────────────────────────
  // CORE · 01 — Growth & Lead System
  // ─────────────────────────────────────────────────────────
  {
    id: "growth-lead-system",
    category: "growth",
    scanLabel: "Scan · Growth Layer",
    question: "Wie generieren Sie aktuell neue Kunden?",
    explanation:
      "Die Lead-Quelle bestimmt die Skalierbarkeit. Wir prüfen, ob Wachstum systemisch oder zufallsgetrieben entsteht.",
    weight: 2,
    options: [
      {
        id: "organisch",
        label: "Organisch",
        maturity: 50,
        diagnostic: {
          weakness:
            "Wachstum hängt am organischen Zufallsstrom – schwer planbar.",
          bucket: "growth",
        },
      },
      {
        id: "ads",
        label: "Ads",
        maturity: 60,
        diagnostic: {
          weakness:
            "Lead-Strom hängt am Werbebudget – Margen-Druck steigt mit Skalierung.",
          bucket: "growth",
        },
      },
      {
        id: "outbound",
        label: "Outbound",
        maturity: 55,
        diagnostic: {
          weakness:
            "Outbound ist personalstark – ohne Automatisierung kein Skalierungs-Hebel.",
          bucket: "automation",
        },
      },
      {
        id: "empfehlungen",
        label: "Empfehlungen",
        maturity: 45,
        diagnostic: {
          weakness:
            "Empfehlungs-getrieben heißt: kein steuerbares Wachstums-System.",
          bucket: "growth",
        },
      },
      {
        id: "hybrid",
        label: "Hybrid",
        maturity: 80,
        diagnostic: {
          strength: "Mehrkanaliges Lead-System etabliert.",
          bucket: "growth",
        },
      },
    ],
    freeText: {
      label: "Welche Kanäle dominieren? Optional",
      placeholder: "z. B. LinkedIn Ads + Sales-Outreach …",
    },
    followUpRules: [
      { whenOptionId: ["ads"], loadModules: ["marketing-attribution", "marketing-cac"] },
      { whenOptionId: ["outbound"], loadModules: ["sales-pipeline", "sales-followup"] },
      {
        whenOptionId: ["organisch", "empfehlungen"],
        loadModules: ["marketing-content", "product-clarity"],
      },
      { whenOptionId: ["hybrid"], loadModules: ["marketing-attribution", "sales-pipeline"] },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // CORE · 02 — Conversion / Bewertungssystem
  // ─────────────────────────────────────────────────────────
  {
    id: "conversion-scoring",
    category: "sales",
    scanLabel: "Scan · Sales Layer",
    question: "Wie werden potenzielle Kunden bewertet und priorisiert?",
    explanation:
      "Ohne Lead-Bewertung kein Forecast. Wir prüfen, ob Sales-Entscheidungen daten- oder bauchgetrieben fallen.",
    weight: 2,
    options: [
      {
        id: "gar-nicht",
        label: "Gar nicht",
        maturity: 8,
        diagnostic: {
          weakness: "Keine Lead-Priorisierung – wertvolle Zeit fließt in falsche Deals.",
          bucket: "revenue",
        },
      },
      {
        id: "intuitiv",
        label: "Intuitiv / Erfahrung",
        maturity: 28,
        diagnostic: {
          weakness:
            "Bewertung subjektiv – nicht reproduzierbar, kein Onboarding-fähiger Standard.",
          bucket: "structure",
        },
      },
      {
        id: "manuell",
        label: "Manuell",
        maturity: 40,
        diagnostic: {
          weakness:
            "Manuelle Bewertung skaliert nicht – ab 20+ Leads/Woche entstehen Lücken.",
          bucket: "automation",
        },
      },
      {
        id: "crm-basiert",
        label: "CRM-basiert",
        maturity: 65,
        diagnostic: {
          weakness:
            "CRM erfasst – aber priorisiert nicht automatisch. Hebel ungenutzt.",
          bucket: "automation",
        },
      },
      {
        id: "automatisiert",
        label: "Automatisiert (Scoring)",
        maturity: 92,
        diagnostic: {
          strength: "Automatisiertes Lead-Scoring – datenbasierte Sales-Steuerung.",
          bucket: "structure",
        },
      },
    ],
    freeText: {
      label: "Welches CRM oder welche Logik nutzen Sie? Optional",
      placeholder: "z. B. HubSpot mit Lead-Score-Workflow …",
    },
    followUpRules: [
      {
        whenOptionId: ["gar-nicht", "intuitiv", "manuell"],
        loadModules: ["crm-maturity", "sales-followup"],
      },
      {
        whenOptionId: ["crm-basiert", "automatisiert"],
        loadModules: ["sales-pipeline"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // CORE · 03 — Automatisierungsgrad
  // ─────────────────────────────────────────────────────────
  {
    id: "automation-grade",
    category: "automation",
    scanLabel: "Scan · Automation Layer",
    question: "Wie stark sind Ihre Geschäftsprozesse automatisiert?",
    explanation:
      "Der Automatisierungsgrad ist der wichtigste Indikator für Skalierungsfähigkeit. Manuelle Prozesse sind Wachstums-Bremsen.",
    weight: 2,
    options: [
      {
        id: "kaum",
        label: "Kaum",
        maturity: 10,
        diagnostic: {
          weakness:
            "Hochmanuelle Operations – Skalierung erzeugt linear steigende Kosten.",
          bucket: "automation",
        },
      },
      {
        id: "teilweise",
        label: "Teilweise (Tools)",
        maturity: 35,
        diagnostic: {
          weakness:
            "Tool-Insellösungen ohne Verbindung – Daten-Brüche und Doppelarbeit.",
          bucket: "automation",
        },
      },
      {
        id: "mittel",
        label: "Mittel (Workflows)",
        maturity: 65,
        diagnostic: {
          weakness:
            "Workflows existieren, aber End-to-End-Logik fehlt noch.",
          bucket: "automation",
        },
      },
      {
        id: "hoch",
        label: "Hoch (End-to-End)",
        maturity: 95,
        diagnostic: {
          strength: "End-to-End-Automation – das System trägt das Wachstum.",
          bucket: "automation",
        },
      },
    ],
    freeText: {
      label: "Welche Tools/Plattformen sind im Einsatz? Optional",
      placeholder: "z. B. n8n, Zapier, Make, eigene Backend-Workflows …",
    },
    followUpRules: [
      {
        whenOptionId: ["kaum", "teilweise"],
        loadModules: ["ops-standardization", "ops-tool-stack"],
      },
      {
        whenOptionId: ["mittel"],
        loadModules: ["ops-tool-stack"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // EXTENDED · MARKETING
  // ─────────────────────────────────────────────────────────
  {
    id: "marketing-attribution",
    category: "marketing",
    scanLabel: "Scan · Marketing Intelligence",
    question: "Wissen Sie, woher Ihre besten Kunden kommen?",
    explanation:
      "Attribution entscheidet, ob Marketing-Budget in Skalierung oder Verbrennung fließt.",
    weight: 1.5,
    options: [
      {
        id: "no-tracking",
        label: "Kein Tracking",
        maturity: 5,
        diagnostic: {
          weakness: "Marketing-Budget wird ohne Attribution gesteuert – Hochrisiko.",
          bucket: "revenue",
        },
      },
      {
        id: "basic",
        label: "Basis (UTM)",
        maturity: 35,
        diagnostic: {
          weakness:
            "UTM allein zeigt Klicks, nicht Customer Lifetime Value.",
          bucket: "revenue",
        },
      },
      {
        id: "multitouch",
        label: "Multi-Touch",
        maturity: 70,
      },
      {
        id: "full-attribution",
        label: "Full Attribution",
        maturity: 95,
        diagnostic: {
          strength: "Volles Attributions-Modell – Marketing-Budget steuerbar.",
        },
      },
    ],
  },
  {
    id: "marketing-cac",
    category: "marketing",
    scanLabel: "Scan · CAC Awareness",
    question: "Kennen Sie Ihre Kundengewinnungs­kosten (CAC)?",
    explanation:
      "Wer CAC nicht kennt, kann Wachstum nicht profitabel skalieren.",
    weight: 1.5,
    options: [
      {
        id: "unbekannt",
        label: "Unbekannt",
        maturity: 5,
        diagnostic: {
          weakness: "CAC unbekannt – Skalierung kann unbemerkt unprofitabel werden.",
          bucket: "revenue",
        },
      },
      {
        id: "geschaetzt",
        label: "Geschätzt",
        maturity: 30,
        diagnostic: {
          weakness: "CAC nur geschätzt – Forecast ungenau.",
          bucket: "revenue",
        },
      },
      {
        id: "kanal-genau",
        label: "Kanal-genau",
        maturity: 70,
      },
      {
        id: "kohorte",
        label: "Kohorten-basiert",
        maturity: 95,
        diagnostic: { strength: "Kohorten-CAC – datenbasierte Skalierungs-Entscheidungen." },
      },
    ],
  },
  {
    id: "marketing-content",
    category: "marketing",
    scanLabel: "Scan · Content System",
    question: "Wie systematisch produzieren Sie Content?",
    explanation:
      "Content-Frequenz korreliert direkt mit organischem Wachstum.",
    weight: 1,
    options: [
      {
        id: "ad-hoc",
        label: "Ad-hoc",
        maturity: 15,
        diagnostic: {
          weakness: "Content ohne Redaktionsplan – kein kompoundierender Effekt.",
          bucket: "growth",
        },
      },
      { id: "regelmaessig", label: "Regelmäßig", maturity: 55 },
      {
        id: "system",
        label: "Content-System",
        maturity: 90,
        diagnostic: { strength: "Skalierbares Content-System etabliert." },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // EXTENDED · SALES
  // ─────────────────────────────────────────────────────────
  {
    id: "sales-pipeline",
    category: "sales",
    scanLabel: "Scan · Pipeline Health",
    question: "Wie strukturiert ist Ihre Sales-Pipeline?",
    explanation:
      "Eine klare Pipeline-Struktur ist Voraussetzung für Forecast und Skalierung.",
    weight: 1.5,
    options: [
      {
        id: "keine",
        label: "Keine Pipeline",
        maturity: 8,
        diagnostic: {
          weakness: "Keine Pipeline – Sales-Entscheidungen ohne Datenbasis.",
          bucket: "structure",
        },
      },
      {
        id: "liste",
        label: "Excel/Liste",
        maturity: 25,
        diagnostic: {
          weakness: "Liste statt System – Pipeline wird nicht aktiv gesteuert.",
          bucket: "structure",
        },
      },
      { id: "crm-basic", label: "CRM Basic", maturity: 55 },
      {
        id: "stages",
        label: "Definierte Stages",
        maturity: 85,
        diagnostic: { strength: "Klar definierte Pipeline-Stages." },
      },
    ],
  },
  {
    id: "sales-followup",
    category: "sales",
    scanLabel: "Scan · Follow-up System",
    question: "Wie laufen Ihre Sales-Follow-ups?",
    explanation:
      "70 % aller Deals werden im Follow-up entschieden – ohne Automation gehen sie verloren.",
    weight: 1.5,
    options: [
      {
        id: "manual-merken",
        label: "Aus dem Kopf",
        maturity: 5,
        diagnostic: {
          weakness: "Follow-ups aus dem Kopf – Lead-Leakage hoch.",
          bucket: "revenue",
        },
      },
      {
        id: "kalender",
        label: "Kalender-Reminder",
        maturity: 30,
        diagnostic: {
          weakness: "Manuelle Reminder skalieren nicht – einzelne Leads fallen durchs Raster.",
          bucket: "revenue",
        },
      },
      { id: "crm-tasks", label: "CRM-Tasks", maturity: 60 },
      {
        id: "automated",
        label: "Automatisierte Sequenzen",
        maturity: 95,
        diagnostic: { strength: "Automatisierte Follow-up-Sequenzen aktiv." },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // EXTENDED · CRM
  // ─────────────────────────────────────────────────────────
  {
    id: "crm-maturity",
    category: "crm",
    scanLabel: "Scan · CRM Reife",
    question: "Wie reif ist Ihr CRM-Setup?",
    explanation:
      "Das CRM ist das Daten-Rückgrat. Reifegrad bestimmt, wie viel Sales-Effizienz möglich ist.",
    weight: 1.5,
    options: [
      {
        id: "kein-crm",
        label: "Kein CRM",
        maturity: 5,
        diagnostic: {
          weakness: "Ohne CRM keine Kundenstruktur – Wachstum ist limitiert.",
          bucket: "structure",
        },
      },
      {
        id: "crm-data-chaos",
        label: "Vorhanden, aber chaotisch",
        maturity: 25,
        diagnostic: {
          weakness: "CRM-Daten unstrukturiert – Reports unzuverlässig.",
          bucket: "structure",
        },
      },
      { id: "crm-clean", label: "Sauber gepflegt", maturity: 70 },
      {
        id: "crm-source-of-truth",
        label: "Single Source of Truth",
        maturity: 95,
        diagnostic: { strength: "CRM ist Daten-Drehscheibe." },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // EXTENDED · OPERATIONS
  // ─────────────────────────────────────────────────────────
  {
    id: "ops-standardization",
    category: "operations",
    scanLabel: "Scan · Process Standardization",
    question: "Sind Ihre Kernprozesse standardisiert dokumentiert?",
    explanation:
      "Ohne dokumentierte Prozesse ist kein Onboarding, keine Delegation und keine Automation möglich.",
    weight: 1.5,
    options: [
      {
        id: "keine-doku",
        label: "Keine Dokumentation",
        maturity: 5,
        diagnostic: {
          weakness:
            "Wissen sitzt im Kopf einzelner Personen – Skalierungs-Sperre.",
          bucket: "structure",
        },
      },
      {
        id: "teilweise",
        label: "Teilweise",
        maturity: 35,
        diagnostic: {
          weakness:
            "Teil-dokumentiert – Lücken erzeugen Inkonsistenz im Output.",
          bucket: "structure",
        },
      },
      { id: "vollstaendig", label: "Vollständig", maturity: 80 },
      {
        id: "playbook",
        label: "Live-Playbook",
        maturity: 95,
        diagnostic: { strength: "Lebendiges Playbook – Prozesse sind System." },
      },
    ],
  },
  {
    id: "ops-tool-stack",
    category: "operations",
    scanLabel: "Scan · Tool-Stack-Reife",
    question: "Wie integriert ist Ihr Tool-Stack?",
    explanation:
      "Datenbrüche zwischen Tools sind die häufigste Quelle für manuelle Mehrarbeit.",
    weight: 1,
    options: [
      {
        id: "isoliert",
        label: "Isolierte Tools",
        maturity: 10,
        diagnostic: {
          weakness:
            "Daten leben in Silos – manuelle Übertragungen erzeugen Fehler.",
          bucket: "automation",
        },
      },
      {
        id: "manche-verbunden",
        label: "Manche verbunden",
        maturity: 45,
        diagnostic: {
          weakness: "Teilintegration – Brüche in End-to-End-Workflows.",
          bucket: "automation",
        },
      },
      { id: "weitgehend", label: "Weitgehend integriert", maturity: 75 },
      {
        id: "voll-integriert",
        label: "Voll integriert",
        maturity: 95,
        diagnostic: { strength: "Tool-Stack als ein System." },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // EXTENDED · FINANCE (high-level)
  // ─────────────────────────────────────────────────────────
  {
    id: "finance-forecast",
    category: "finance",
    scanLabel: "Scan · Finance Intelligence",
    question: "Haben Sie ein belastbares Forecasting?",
    explanation:
      "Forecast ohne Datenbasis ist Glaubenssache. Skalierung braucht Modelle.",
    weight: 1,
    options: [
      {
        id: "keiner",
        label: "Keiner",
        maturity: 10,
        diagnostic: {
          weakness: "Kein Forecast – Wachstums-Entscheidungen ohne Sicht.",
          bucket: "revenue",
        },
      },
      { id: "monatlich", label: "Monatlich rückblickend", maturity: 35 },
      { id: "rolling", label: "Rolling Forecast", maturity: 75 },
      {
        id: "live-modell",
        label: "Live-Modell",
        maturity: 95,
        diagnostic: { strength: "Datenbasiertes Live-Forecasting." },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // EXTENDED · PRODUCT / OFFER
  // ─────────────────────────────────────────────────────────
  {
    id: "product-clarity",
    category: "product",
    scanLabel: "Scan · Offer Clarity",
    question: "Wie klar ist Ihr Angebot positioniert?",
    explanation:
      "Unklare Positionierung erzeugt teure Leads und niedrige Conversion.",
    weight: 1,
    options: [
      {
        id: "unscharf",
        label: "Unscharf",
        maturity: 10,
        diagnostic: {
          weakness: "Positionierung unscharf – Marketing kostet überproportional.",
          bucket: "growth",
        },
      },
      { id: "ok", label: "Solide", maturity: 50 },
      {
        id: "scharf",
        label: "Sehr klar",
        maturity: 90,
        diagnostic: { strength: "Klare Positionierung – effiziente Akquise." },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // EXTENDED · TEAM
  // ─────────────────────────────────────────────────────────
  {
    id: "team-structure",
    category: "team",
    scanLabel: "Scan · Team Layer",
    question: "Wie ist Ihr Team strukturiert?",
    explanation:
      "Rollen und Delegation entscheiden, ob das Unternehmen vom Gründer abhängt.",
    weight: 1,
    options: [
      {
        id: "solo",
        label: "Solo",
        maturity: 20,
        diagnostic: {
          weakness:
            "Solo-Betrieb – jede Stunde Wachstum kostet Gründer-Zeit.",
          bucket: "structure",
        },
      },
      {
        id: "team-undefiniert",
        label: "Team, Rollen unklar",
        maturity: 40,
        diagnostic: {
          weakness: "Team ohne klare Rollen – Konflikt- und Entscheidungs-Reibung.",
          bucket: "structure",
        },
      },
      { id: "rollen-definiert", label: "Rollen definiert", maturity: 75 },
      {
        id: "voll-delegiert",
        label: "Voll delegiert",
        maturity: 95,
        diagnostic: { strength: "Operativer Betrieb läuft ohne Gründer-Engpass." },
      },
    ],
  },
];

/** Lookup-Helper. */
export function getModuleById(id: string): AnalysisModule | undefined {
  return ANALYSIS_MODULES.find((m) => m.id === id);
}
