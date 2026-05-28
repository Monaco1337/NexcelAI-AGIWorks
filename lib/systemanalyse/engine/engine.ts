/**
 * Systemanalyse Engine — Logic Layer
 * ─────────────────────────────────────────────────────────────
 * - Scoring: Maturity Score + per-Kategorie-Aggregation
 * - Follow-up-Resolver: kontextabhängiges Nachladen von Modulen
 * - Report-Generator: Bottlenecks, Gaps, Leakage, Priority Actions
 */

import {
  ANALYSIS_MODULES,
  CORE_MODULE_IDS,
  getModuleById,
} from "./modules";
import type {
  AnalysisModule,
  AnalysisOption,
  ModuleAnswer,
  MaturityScore,
  ModuleCategory,
  PriorityAction,
  ReportInsight,
  SystemReport,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Initial Queue
// ─────────────────────────────────────────────────────────────
export function buildInitialQueue(): string[] {
  return [...CORE_MODULE_IDS];
}

// ─────────────────────────────────────────────────────────────
// Follow-up-Resolver
// ─────────────────────────────────────────────────────────────
export function resolveFollowUps(
  module: AnalysisModule,
  optionId: string,
  currentQueue: string[]
): string[] {
  if (!module.followUpRules) return currentQueue;

  const additions: string[] = [];
  for (const rule of module.followUpRules) {
    if (rule.whenOptionId.includes(optionId)) {
      for (const id of rule.loadModules) {
        if (!currentQueue.includes(id) && !additions.includes(id)) {
          additions.push(id);
        }
      }
    }
  }
  return [...currentQueue, ...additions];
}

// ─────────────────────────────────────────────────────────────
// Score Engine
// ─────────────────────────────────────────────────────────────
function getOption(moduleId: string, optionId: string): AnalysisOption | null {
  const m = getModuleById(moduleId);
  if (!m) return null;
  return m.options.find((o) => o.id === optionId) ?? null;
}

export function computeScore(answers: ModuleAnswer[]): MaturityScore {
  if (!answers.length) {
    return {
      total: 0,
      byCategory: {},
      band: "critical",
      bandLabel: "Hochrisiko",
    };
  }

  const byCategory: Partial<Record<ModuleCategory, { sum: number; w: number }>> =
    {};
  let totalSum = 0;
  let totalW = 0;

  for (const ans of answers) {
    const m = getModuleById(ans.moduleId);
    const opt = getOption(ans.moduleId, ans.optionId);
    if (!m || !opt) continue;
    const w = m.weight ?? 1;
    totalSum += opt.maturity * w;
    totalW += w;
    if (!byCategory[m.category])
      byCategory[m.category] = { sum: 0, w: 0 };
    byCategory[m.category]!.sum += opt.maturity * w;
    byCategory[m.category]!.w += w;
  }

  const total = totalW > 0 ? Math.round(totalSum / totalW) : 0;

  const catResult: Partial<Record<ModuleCategory, number>> = {};
  for (const [cat, v] of Object.entries(byCategory)) {
    catResult[cat as ModuleCategory] = Math.round(v!.sum / v!.w);
  }

  let band: MaturityScore["band"];
  let bandLabel: string;
  if (total < 30) {
    band = "critical";
    bandLabel = "Hochrisiko";
  } else if (total < 55) {
    band = "manual";
    bandLabel = "Manuell-getrieben";
  } else if (total < 78) {
    band = "transitional";
    bandLabel = "Teilweise systematisch";
  } else {
    band = "system-driven";
    bandLabel = "System-orientiert";
  }

  return { total, byCategory: catResult, band, bandLabel };
}

// ─────────────────────────────────────────────────────────────
// Insight & Severity
// ─────────────────────────────────────────────────────────────
function severityFromMaturity(m: number): ReportInsight["severity"] {
  if (m < 20) return "high";
  if (m < 50) return "medium";
  return "low";
}

function bucketToInsightType(
  bucket?: "growth" | "automation" | "revenue" | "structure"
): ReportInsight["type"] {
  switch (bucket) {
    case "growth":
      return "growth-bottleneck";
    case "automation":
      return "automation-gap";
    case "revenue":
      return "revenue-leak";
    default:
      return "structure-gap";
  }
}

// ─────────────────────────────────────────────────────────────
// Report Generator
// ─────────────────────────────────────────────────────────────
const NEXUS_RECOMMENDATIONS: Record<ModuleCategory, string> = {
  growth: "NEXUS · Growth Engine",
  marketing: "NEXUS · Marketing Intelligence",
  sales: "NEXUS · Sales OS",
  crm: "NEXUS · Customer Graph",
  operations: "NEXUS · Process Layer",
  automation: "NEXUS · Automation Core",
  finance: "NEXUS · Finance Insight",
  product: "NEXUS · Offer Layer",
  team: "NEXUS · Org Layer",
  "digital-maturity": "NEXUS · Digital Backbone",
};

export function generateReport(answers: ModuleAnswer[]): SystemReport {
  const score = computeScore(answers);

  const growthBottlenecks: ReportInsight[] = [];
  const automationGaps: ReportInsight[] = [];
  const revenueLeakage: ReportInsight[] = [];
  const structureGaps: ReportInsight[] = [];

  for (const ans of answers) {
    const m = getModuleById(ans.moduleId);
    const opt = getOption(ans.moduleId, ans.optionId);
    if (!m || !opt) continue;
    const diag = opt.diagnostic;
    if (!diag?.weakness) continue;

    const insight: ReportInsight = {
      type: bucketToInsightType(diag.bucket),
      text: diag.weakness,
      severity: severityFromMaturity(opt.maturity),
      moduleId: m.id,
    };

    switch (insight.type) {
      case "growth-bottleneck":
        growthBottlenecks.push(insight);
        break;
      case "automation-gap":
        automationGaps.push(insight);
        break;
      case "revenue-leak":
        revenueLeakage.push(insight);
        break;
      default:
        structureGaps.push(insight);
    }
  }

  // Priority Actions: nimm die schwächsten Kategorien (lowest maturity)
  const priorityActions: PriorityAction[] = [];
  const catEntries = Object.entries(score.byCategory) as [
    ModuleCategory,
    number,
  ][];
  const weakest = catEntries
    .filter(([, v]) => v < 65)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  for (const [cat, val] of weakest) {
    priorityActions.push({
      text: priorityActionText(cat, val),
      category: cat,
      recommendedModule: NEXUS_RECOMMENDATIONS[cat],
    });
  }

  // Recommended NEXUS Setup
  const recommendedSetup = Array.from(
    new Set(priorityActions.map((a) => a.recommendedModule!).filter(Boolean))
  );

  return {
    score,
    growthBottlenecks,
    automationGaps,
    revenueLeakage,
    structureGaps,
    priorityActions,
    recommendedSetup,
  };
}

function priorityActionText(cat: ModuleCategory, value: number): string {
  const lvl = value < 25 ? "rebuild" : value < 50 ? "upgrade" : "optimize";
  const map: Record<ModuleCategory, Record<string, string>> = {
    growth: {
      rebuild: "Skalierbares Growth-System aufbauen (Multi-Channel + Attribution).",
      upgrade: "Growth-Kanäle systematisieren und priorisieren.",
      optimize: "Bestehende Growth-Kanäle datenseitig optimieren.",
    },
    sales: {
      rebuild: "Sales-Pipeline mit Stages + automatischer Priorisierung neu aufsetzen.",
      upgrade: "Sales-Prozess strukturieren – Stages + Follow-up-Sequenzen.",
      optimize: "Sales-Conversion durch automatisierte Sequenzen heben.",
    },
    marketing: {
      rebuild: "Attribution + CAC-Tracking als Grundlage für Skalierung implementieren.",
      upgrade: "Marketing-Steuerung um CAC-Logik und Multi-Touch erweitern.",
      optimize: "Bestehende Attribution-Daten in Steuerungs-Dashboards überführen.",
    },
    operations: {
      rebuild: "Kernprozesse dokumentieren und in standardisierte Playbooks überführen.",
      upgrade: "Tool-Brüche schließen, integrierten Tool-Stack bauen.",
      optimize: "Bestehende Prozesse für Automatisierung vorbereiten.",
    },
    automation: {
      rebuild: "End-to-End-Automation für Kernprozesse implementieren.",
      upgrade: "Workflows zu vollintegrierten Pipelines ausbauen.",
      optimize: "Automation-Performance & Fehler-Toleranz erhöhen.",
    },
    crm: {
      rebuild: "CRM als Single Source of Truth aufsetzen (Datenmodell + Lifecycle).",
      upgrade: "CRM-Daten bereinigen und Pflichtfelder erzwingen.",
      optimize: "CRM-Reports auf Predictive-Logiken erweitern.",
    },
    finance: {
      rebuild: "Live-Forecast-Modell mit Datenanbindung an CRM/Marketing aufbauen.",
      upgrade: "Rolling-Forecast und Kohorten-Analyse einführen.",
      optimize: "Bestehendes Forecasting für Szenario-Steuerung erweitern.",
    },
    product: {
      rebuild: "Positionierung neu schärfen (ICP + Messaging + Preisstruktur).",
      upgrade: "Angebots-Differenzierung und Preisarchitektur überarbeiten.",
      optimize: "Conversion-relevante Messaging-Hebel testen.",
    },
    team: {
      rebuild: "Org-Modell mit klaren Rollen, Verantwortlichkeiten und Delegation aufsetzen.",
      upgrade: "Rollen-Definitionen und operative Delegation einführen.",
      optimize: "Performance-Loops und Ownership-Modell schärfen.",
    },
    "digital-maturity": {
      rebuild: "Digitales Rückgrat (Daten, Prozesse, Tools) systemisch aufbauen.",
      upgrade: "Digitalen Reifegrad in Sales/Ops/Finance angleichen.",
      optimize: "Digitale Layers stärker miteinander koppeln.",
    },
  };
  return map[cat][lvl];
}

/** Bequeme Re-Exports für UI-Layer. */
export { ANALYSIS_MODULES, getModuleById };
