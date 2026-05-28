/**
 * NEXCEL AI · Diagnostik · leadClassificationService
 *
 * Cold / Warm / Hot / Enterprise — deterministisch aus Signalen.
 *
 * Signale, die in den Score eingehen:
 *   - Web-Stack erkannt? (Enterprise-Indikatoren: Salesforce, SAP, NetSuite, …)
 *   - Mehrere Standorte / Karriere-Seite vorhanden?
 *   - Uploads vorhanden + groß? (echtes Interesse)
 *   - High-Severity-Findings? (akuter Bedarf)
 *   - Conversion-/Operations-Risk hoch? (Pain)
 *
 * Keine Heuristik wird "geraten" — jeder Punkt landet im `signals`-Array als Reasoning.
 */

import { randomUUID } from "crypto";
import type {
  AnalysisFinding,
  AnalysisScores,
  LeadClassification,
  LeadTier,
} from "./types";

interface LeadInput {
  analysisId: string;
  scores: AnalysisScores | null;
  findings: AnalysisFinding[];
  hasUploads: boolean;
  totalUploadBytes: number;
  detectedStack: { category: string; name: string }[];
  webPresent: boolean;
}

const ENTERPRISE_STACK = [
  "salesforce",
  "sap",
  "netsuite",
  "oracle",
  "microsoft dynamics",
  "marketo",
  "adobe experience",
  "workday",
];

export function classifyLead(input: LeadInput): LeadClassification {
  let score = 0;
  const signals: string[] = [];

  // 1) Enterprise-Stack erkannt → starker Indikator
  const stackLower = input.detectedStack.map((d) => d.name.toLowerCase());
  const enterpriseHits = stackLower.filter((n) =>
    ENTERPRISE_STACK.some((k) => n.includes(k)),
  );
  if (enterpriseHits.length > 0) {
    score += 35;
    signals.push(`Enterprise-Stack erkannt: ${enterpriseHits.join(", ")}`);
  }

  // 2) Uploads = echtes Interesse, je mehr/größer desto stärker
  if (input.hasUploads) {
    score += 15;
    signals.push("Dateien hochgeladen — aktives Interesse");
    if (input.totalUploadBytes > 500_000) {
      score += 10;
      signals.push("Umfangreiches Material übermittelt");
    }
  }

  // 3) Akuter Bedarf via High/Critical Findings
  const acuteCount = input.findings.filter(
    (f) => f.severity === "high" || f.severity === "critical",
  ).length;
  if (acuteCount >= 3) {
    score += 20;
    signals.push(`${acuteCount} kritische operative Befunde`);
  } else if (acuteCount >= 1) {
    score += 10;
    signals.push(`${acuteCount} hoher/kritischer Befund`);
  }

  // 4) Score-basierte Pain-Indikatoren
  if (input.scores) {
    if (input.scores.systemFragmentation >= 50) {
      score += 10;
      signals.push("Tool-Landschaft stark zersplittert");
    }
    if (input.scores.automationPotential >= 50) {
      score += 10;
      signals.push("Hohes Automatisierungspotenzial");
    }
    if (input.scores.scalabilityRisk >= 40) {
      score += 8;
      signals.push("Skalierungsrisiko erkennbar");
    }
    if (input.scores.conversionRisk >= 30) {
      score += 5;
      signals.push("Conversion-Risiko erkennbar");
    }
  }

  // 5) Website überhaupt analysierbar — schwaches Baseline-Signal
  if (input.webPresent) {
    score += 3;
    signals.push("Webauftritt analysiert");
  }

  // Tier-Mapping
  let tier: LeadTier;
  if (enterpriseHits.length > 0 && score >= 50) tier = "enterprise";
  else if (score >= 45) tier = "hot";
  else if (score >= 25) tier = "warm";
  else tier = "cold";

  return {
    id: randomUUID(),
    analysisId: input.analysisId,
    tier,
    signals,
    rawScore: score,
    createdAt: Date.now(),
  };
}
