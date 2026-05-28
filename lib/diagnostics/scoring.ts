/**
 * NEXCEL AI · Diagnostik · Score Aggregation
 *
 * Die Scores ergeben sich AUSSCHLIESSLICH aus den Score-Impacts der gefeuerten Regeln.
 * Es gibt keine fixen Defaults, die wir „erfinden" — der Startwert ist eine neutrale
 * Baseline, und jede Regel verschiebt sie deterministisch.
 *
 * Achsen-Logik:
 *   - operations          : 70 ist neutraler Startpunkt, Impacts addieren/subtrahieren
 *   - automationPotential : 0 ist Startpunkt, jede Regel hebt nach oben
 *   - systemFragmentation : 0 ist Startpunkt, jede Regel hebt nach oben
 *   - scalabilityRisk     : 10 baseline, Impacts heben/senken
 *   - technicalRisk       : nur aus konkreten Web-Befunden (HTTPS, Headers, Bytes…)
 *   - conversionRisk      : nur aus konkreten Web-Befunden
 *
 * Confidence:
 *   - 60 % wenn nur URL gescannt wurde
 *   - 30 % wenn nur Uploads vorlagen
 *   - 90 % wenn beide vorhanden + Tech-Stack erkannt + Findings > 3
 *   - 0   wenn keine Eingabe verarbeitbar war (dann ist Phase 'partial'/'failed')
 */

import type { AnalysisFinding, AnalysisScores } from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

interface ScoreInput {
  analysisId: string;
  findings: Array<Omit<AnalysisFinding, "id" | "analysisId" | "createdAt">>;
  webPresent: boolean;
  uploadsPresent: boolean;
  webHasDetectedStack: boolean;
}

export function computeScores(input: ScoreInput): AnalysisScores {
  // Baselines — bewusst konservativ.
  let operations = 70;
  let automationPotential = 0;
  let systemFragmentation = 0;
  let scalabilityRisk = 10;
  let technicalRisk = 0;
  let conversionRisk = 0;

  for (const f of input.findings) {
    const imp = f.scoreImpact;
    if (!imp) continue;
    if (typeof imp.operations === "number") operations += imp.operations;
    if (typeof imp.automationPotential === "number")
      automationPotential += imp.automationPotential;
    if (typeof imp.systemFragmentation === "number")
      systemFragmentation += imp.systemFragmentation;
    if (typeof imp.scalabilityRisk === "number")
      scalabilityRisk += imp.scalabilityRisk;
    if (typeof imp.technicalRisk === "number")
      technicalRisk += imp.technicalRisk;
    if (typeof imp.conversionRisk === "number")
      conversionRisk += imp.conversionRisk;
  }

  // Confidence — abhängig von Inputqualität.
  let confidence = 0;
  if (input.webPresent && input.uploadsPresent) confidence = 80;
  else if (input.webPresent) confidence = 60;
  else if (input.uploadsPresent) confidence = 30;
  if (input.webHasDetectedStack) confidence += 10;
  if (input.findings.length >= 3) confidence += 5;
  confidence = clamp(confidence);

  return {
    analysisId: input.analysisId,
    operations: clamp(operations),
    automationPotential: clamp(automationPotential),
    systemFragmentation: clamp(systemFragmentation),
    scalabilityRisk: clamp(scalabilityRisk),
    technicalRisk: clamp(technicalRisk),
    conversionRisk: clamp(conversionRisk),
    confidence,
    computedAt: Date.now(),
  };
}
