/**
 * Commercial-Capacity-Engine.
 *
 * KEIN Anspruch, echte Finanzkennzahlen zu erraten. Wir aggregieren
 * ausschließlich indirekte, öffentlich sichtbare Signale (Rechtsform,
 * Alter, Mitarbeiterschätzung, Bewertungshäufigkeit, Website-Reife,
 * Standorte) und leiten daraus eine grob geschätzte Kapazitätsklasse
 * + eine ehrliche Confidence ab.
 *
 * Ergebnis wird IMMER mit Klartext-Signalen begleitet, damit die
 * Aussage im UI erklärbar bleibt.
 */

import type {
  FinancialCapacityClass,
  FinancialSignal,
  TargetCompany,
  WebsiteAudit,
} from "./model";

export interface CapacityInput {
  company: Pick<
    TargetCompany,
    | "legalForm"
    | "foundedYear"
    | "employeeEstimateMin"
    | "employeeEstimateMax"
    | "locationsEstimate"
    | "reviewCount"
    | "googleRating"
  >;
  signals?: FinancialSignal[];
  websiteAudit?: WebsiteAudit | null;
}

export interface CapacityResult {
  capacityClass: FinancialCapacityClass;
  confidence: number;
  estimatedBudgetMinCents: number;
  estimatedBudgetMaxCents: number;
  score: number;
  signals: Array<{ kind: string; text: string; polarity: "positive" | "neutral" | "negative"; weight: number }>;
  hasNegativeRisk: boolean;
}

export function estimateCommercialCapacity(input: CapacityInput): CapacityResult {
  const { company, signals = [], websiteAudit } = input;
  let score = 40;
  let confidence = 0.4;
  let hasNegativeRisk = false;
  const usedSignals: CapacityResult["signals"] = [];

  const nowYear = new Date().getUTCFullYear();

  // Rechtsform
  const legalForm = (company.legalForm ?? "").toLowerCase();
  if (/(gmbh & co\. ?kg|ag|se)/.test(legalForm)) {
    score += 12;
    confidence += 0.1;
    usedSignals.push({ kind: "legal_form", text: "Solide Rechtsform (GmbH & Co. KG / AG / SE)", polarity: "positive", weight: 12 });
  } else if (/gmbh/.test(legalForm)) {
    score += 8;
    confidence += 0.08;
    usedSignals.push({ kind: "legal_form", text: "Rechtsform GmbH", polarity: "positive", weight: 8 });
  } else if (/(ug|einzel)/.test(legalForm)) {
    score += 3;
    confidence += 0.05;
    usedSignals.push({ kind: "legal_form", text: "Kleinere Rechtsform (UG/Einzelunternehmer)", polarity: "neutral", weight: 3 });
  }

  // Alter
  if (company.foundedYear && company.foundedYear > 1900) {
    const age = nowYear - company.foundedYear;
    if (age > 10) {
      score += 10;
      confidence += 0.08;
      usedSignals.push({ kind: "age", text: `Etabliert seit ${age} Jahren`, polarity: "positive", weight: 10 });
    } else if (age > 3) {
      score += 5;
      confidence += 0.05;
      usedSignals.push({ kind: "age", text: `${age} Jahre am Markt`, polarity: "neutral", weight: 5 });
    } else {
      score -= 3;
      confidence += 0.05;
      usedSignals.push({ kind: "age", text: `Junges Unternehmen (${age}J)`, polarity: "negative", weight: -3 });
    }
  }

  // Mitarbeiter
  const empMax = company.employeeEstimateMax ?? null;
  if (empMax !== null) {
    if (empMax >= 100) {
      score += 20;
      confidence += 0.15;
      usedSignals.push({ kind: "employees", text: `~${empMax} Mitarbeiter`, polarity: "positive", weight: 20 });
    } else if (empMax >= 30) {
      score += 12;
      confidence += 0.1;
      usedSignals.push({ kind: "employees", text: `~${empMax} Mitarbeiter`, polarity: "positive", weight: 12 });
    } else if (empMax >= 10) {
      score += 6;
      confidence += 0.08;
      usedSignals.push({ kind: "employees", text: `~${empMax} Mitarbeiter`, polarity: "neutral", weight: 6 });
    } else {
      score += 2;
      confidence += 0.05;
      usedSignals.push({ kind: "employees", text: `Kleiner Betrieb (~${empMax} MA)`, polarity: "neutral", weight: 2 });
    }
  }

  // Standorte
  if (company.locationsEstimate && company.locationsEstimate > 1) {
    score += Math.min(15, company.locationsEstimate * 3);
    confidence += 0.05;
    usedSignals.push({
      kind: "locations",
      text: `${company.locationsEstimate} Standorte`,
      polarity: "positive",
      weight: Math.min(15, company.locationsEstimate * 3),
    });
  }

  // Bewertungen
  if (company.reviewCount && company.reviewCount >= 50) {
    score += 6;
    confidence += 0.05;
    usedSignals.push({ kind: "reviews", text: `${company.reviewCount} Google-Bewertungen`, polarity: "positive", weight: 6 });
  }
  if (company.googleRating && company.googleRating >= 4.4) {
    score += 3;
    usedSignals.push({ kind: "rating", text: `Rating ${company.googleRating.toFixed(1)}/5`, polarity: "positive", weight: 3 });
  }

  // Website-Reife
  if (websiteAudit && websiteAudit.websiteScore !== null) {
    if (websiteAudit.websiteScore >= 70) {
      score += 5;
      confidence += 0.04;
      usedSignals.push({ kind: "website_maturity", text: "Reife, gepflegte Website", polarity: "positive", weight: 5 });
    } else if (websiteAudit.websiteScore < 40) {
      // eine sehr schwache Website ist nicht per se ein Kapazitätsproblem
      usedSignals.push({ kind: "website_maturity", text: "Website eher schwach", polarity: "neutral", weight: 0 });
    }
  }

  // Explizite Signale (aus DB — Presse/Jobs/Expansion/…)
  for (const s of signals) {
    const w = s.weight * (s.polarity === "negative" ? -1 : s.polarity === "neutral" ? 0.5 : 1);
    score += w;
    if (s.polarity === "negative" && (s.kind === "insolvency" || s.kind === "closed" || s.kind === "risk")) {
      hasNegativeRisk = true;
    }
    if (s.confidence) confidence += Math.min(0.05, s.confidence * 0.05);
    usedSignals.push({
      kind: s.kind,
      text: s.evidence ?? s.value ?? s.kind,
      polarity: s.polarity,
      weight: w,
    });
  }

  score = Math.max(0, Math.min(100, score));
  confidence = Math.max(0.25, Math.min(0.95, confidence));

  const capacityClass = classifyCapacity(score, hasNegativeRisk);
  const { min, max } = mapCapacityToBudget(capacityClass);

  return {
    capacityClass,
    confidence,
    estimatedBudgetMinCents: min,
    estimatedBudgetMaxCents: max,
    score,
    signals: usedSignals,
    hasNegativeRisk,
  };
}

function classifyCapacity(score: number, hasNegativeRisk: boolean): FinancialCapacityClass {
  if (hasNegativeRisk) return "VERY_LOW";
  if (score >= 85) return "VERY_HIGH";
  if (score >= 65) return "HIGH";
  if (score >= 45) return "MEDIUM";
  if (score >= 25) return "LOW";
  return "VERY_LOW";
}

function mapCapacityToBudget(cls: FinancialCapacityClass): { min: number; max: number } {
  switch (cls) {
    case "VERY_HIGH":
      return { min: 3_000_000, max: 15_000_000 };
    case "HIGH":
      return { min: 1_500_000, max: 5_000_000 };
    case "MEDIUM":
      return { min: 500_000, max: 2_000_000 };
    case "LOW":
      return { min: 200_000, max: 800_000 };
    case "VERY_LOW":
    default:
      return { min: 0, max: 300_000 };
  }
}
