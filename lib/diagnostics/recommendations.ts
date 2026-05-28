/**
 * NEXCEL AI · Diagnostik · recommendationEngine
 *
 * Mapped Findings + Scores → konkrete Produkte/Empfehlungen.
 * Jede Empfehlung ist deterministisch begründbar (`reasonFindingIds`).
 *
 * Es werden NIE Empfehlungen erfunden — wenn keine Regel triggert, gibt es auch
 * keine Empfehlung in dieser Kategorie.
 */

import { randomUUID } from "crypto";
import type {
  AnalysisFinding,
  AnalysisRecommendation,
  AnalysisScores,
} from "./types";

interface RecInput {
  analysisId: string;
  findings: AnalysisFinding[];
  scores: AnalysisScores;
  /** Branchen-Hints für Spezial-Produkte (z. B. Real-Estate-OS). */
  industryHints: string[];
}

/* ── Produktkatalog ──────────────────────────────────────────────────
 *  Jeder Eintrag definiert ein abstraktes "System" mit Modulen.
 *  Trigger sind die Bedingungen, unter denen das System empfohlen wird.
 * ─────────────────────────────────────────────────────────────────── */

interface ProductDefinition {
  key: AnalysisRecommendation["productKey"];
  name: string;
  oneliner: string;
  modules: { name: string; benefit: string }[];
  estimatedWeeks: number;
  /** Pflicht-Findings die mindestens einen Trigger ausmachen. */
  triggers: {
    findingRuleIds?: string[];
    minScore?: Partial<AnalysisScores>;
    industryRegex?: RegExp;
  }[];
  /** Standardpriorität — kann durch Score-Höhe nach unten korrigiert werden. */
  basePriority: 1 | 2 | 3;
}

const CATALOG: ProductDefinition[] = [
  {
    key: "crm-system",
    name: "CRM-System",
    oneliner:
      "Zentrale Lead- und Kundendatenbank mit Pipeline, Routing und Verlauf — Single-Point-of-Entry für alle Anfragen.",
    modules: [
      { name: "Lead-Capture", benefit: "Alle Kanäle münden in einen Eingang." },
      { name: "Pipeline-Stages", benefit: "Klare Stati statt Mail-Threads." },
      { name: "Kontakt-Historie", benefit: "Verlauf pro Kunde durchsuchbar." },
      { name: "Routing-Regeln", benefit: "Anfragen automatisch zuweisen." },
    ],
    estimatedWeeks: 4,
    triggers: [
      { findingRuleIds: ["frag.no-crm-detected"] },
      { findingRuleIds: ["frag.multi-channel-no-aggregation"] },
      { minScore: { systemFragmentation: 30 } },
    ],
    basePriority: 1,
  },
  {
    key: "automation-layer",
    name: "Automation-Layer",
    oneliner:
      "Workflow-Engine, die zwischen den bestehenden Tools idempotent vermittelt — Anfragen, Bestätigungen, Eskalationen.",
    modules: [
      { name: "Workflow-Engine", benefit: "n8n/Temporal als Orchestrierung." },
      { name: "Retry & Dead-Letter", benefit: "Keine verlorenen Vorgänge." },
      { name: "Audit-Log", benefit: "Jede Aktion nachvollziehbar." },
    ],
    estimatedWeeks: 3,
    triggers: [
      { findingRuleIds: ["auto.no-automation-layer", "auto.manual-form-only"] },
      { minScore: { automationPotential: 35 } },
    ],
    basePriority: 2,
  },
  {
    key: "analytics-system",
    name: "Operations-Analytics",
    oneliner:
      "Live-KPIs zu Anfragen, Konversionen und operativen Engpässen — Entscheidungen auf Basis echter Zahlen.",
    modules: [
      { name: "Inbound-Tracking", benefit: "Quelle → Lead → Auftrag." },
      { name: "Funnel-Reports", benefit: "Wo Anfragen verloren gehen." },
      { name: "Standort-/Team-Metriken", benefit: "Vergleichbarkeit über Einheiten." },
    ],
    estimatedWeeks: 3,
    triggers: [
      { findingRuleIds: ["cvr.phone-only", "cvr.thin-content"] },
      { minScore: { conversionRisk: 25 } },
    ],
    basePriority: 2,
  },
  {
    key: "recruiting-os",
    name: "Recruiting Operating System",
    oneliner:
      "Bewerber-Funnel mit automatisierter Vorqualifizierung, Pipeline und Kanal-Integration.",
    modules: [
      { name: "Stellen-Feed", benefit: "Eine Quelle, viele Portale." },
      { name: "Vorqualifizierung", benefit: "Strukturierte Erstgespräche, KI-gestützt." },
      { name: "Bewerber-Pipeline", benefit: "Stati, Notizen, Termine zentral." },
    ],
    estimatedWeeks: 5,
    triggers: [{ findingRuleIds: ["ops.no-jobs-on-talent-business"] }],
    basePriority: 1,
  },
  {
    key: "real-estate-os",
    name: "Immobilien Operating System",
    oneliner:
      "Exposé-Engine, Käufer-Matching, Termin- und Vertragsworkflow — ein System für den Maklerbetrieb.",
    modules: [
      { name: "Exposé-Engine", benefit: "Dokumente automatisch generieren." },
      { name: "Käufer-Matching", benefit: "Interessenten zu Objekten zuordnen." },
      { name: "Besichtigungs-Workflow", benefit: "Vom Anruf bis zum Vertrag." },
    ],
    estimatedWeeks: 7,
    triggers: [
      { findingRuleIds: ["ops.real-estate-without-system"] },
      { industryRegex: /immobilien|makler|exposé/i },
    ],
    basePriority: 1,
  },
  {
    key: "ai-workflow-system",
    name: "AI-Workflow-System",
    oneliner:
      "Wiederkehrende Wissens- und Schreibarbeit ins Backend verlagern — Angebote, Antworten, Reports per LLM-Pipeline.",
    modules: [
      { name: "Prompt-Library", benefit: "Markenkonforme Generierung." },
      { name: "Eval-Loop", benefit: "Qualität nicht dem Zufall überlassen." },
      { name: "Tool-Hooks", benefit: "Direkt in CRM/Mail integriert." },
    ],
    estimatedWeeks: 4,
    triggers: [{ minScore: { automationPotential: 55 } }],
    basePriority: 3,
  },
  {
    key: "operations-platform",
    name: "Operations-Plattform",
    oneliner:
      "Standorte, Rollen und Workflows in einer Schicht — vergleichbare Kennzahlen über alle Einheiten.",
    modules: [
      { name: "Standort-Modell", benefit: "Sauber abgegrenzte Verantwortlichkeiten." },
      { name: "Rollen & Rechte", benefit: "Wer darf was sehen/tun." },
      { name: "KPI-Hub", benefit: "Eine Wahrheit über Einheiten hinweg." },
    ],
    estimatedWeeks: 6,
    triggers: [{ findingRuleIds: ["scale.multi-locations-no-system"] }],
    basePriority: 1,
  },
  {
    key: "data-platform",
    name: "Datenplattform",
    oneliner:
      "Saubere Operative Daten — Excel/Sheets durch ein validiertes Schema mit API ersetzen.",
    modules: [
      { name: "Schema-Definition", benefit: "Konsistente Datenstrukturen." },
      { name: "Import-Pipelines", benefit: "Aus bestehenden Sheets sauber rüber." },
      { name: "API-Layer", benefit: "Jede Anwendung greift gleich zu." },
    ],
    estimatedWeeks: 5,
    triggers: [{ findingRuleIds: ["frag.excel-as-operational-system"] }],
    basePriority: 1,
  },
];

export function buildRecommendations(input: RecInput): AnalysisRecommendation[] {
  const ruleIdToFinding = new Map<string, AnalysisFinding>();
  for (const f of input.findings) ruleIdToFinding.set(f.ruleId, f);

  const recs: AnalysisRecommendation[] = [];

  for (const product of CATALOG) {
    const matchedReasonIds: string[] = [];
    let triggered = false;

    for (const trig of product.triggers) {
      if (trig.findingRuleIds) {
        for (const rid of trig.findingRuleIds) {
          const f = ruleIdToFinding.get(rid);
          if (f) {
            matchedReasonIds.push(f.id);
            triggered = true;
          }
        }
      }
      if (trig.minScore) {
        const s = input.scores;
        const allKeys = Object.keys(trig.minScore) as (keyof AnalysisScores)[];
        const passes = allKeys.every((k) => {
          const expected = trig.minScore![k];
          if (typeof expected !== "number") return true;
          const actual = s[k];
          return typeof actual === "number" && actual >= expected;
        });
        if (passes && allKeys.length > 0) triggered = true;
      }
      if (trig.industryRegex) {
        if (input.industryHints.some((h) => trig.industryRegex!.test(h))) {
          triggered = true;
        }
      }
    }

    if (!triggered) continue;

    recs.push({
      id: randomUUID(),
      analysisId: input.analysisId,
      productKey: product.key,
      name: product.name,
      oneliner: product.oneliner,
      modules: product.modules,
      estimatedWeeks: product.estimatedWeeks,
      priority: product.basePriority,
      reasonFindingIds: Array.from(new Set(matchedReasonIds)),
      createdAt: Date.now(),
    });
  }

  // Sortierung: Priorität ASC, dann nach Reason-Anzahl (mehr Begründungen zuerst).
  recs.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.reasonFindingIds.length - a.reasonFindingIds.length;
  });

  return recs;
}
