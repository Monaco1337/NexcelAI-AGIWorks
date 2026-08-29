/**
 * Propensity-Engine — „Signale für Veränderungs- und Investitionsbereitschaft".
 *
 * Wir trennen Propensity strikt von Need und Capacity (Phase 8 des
 * Master-Prompts). Nur öffentlich belegbare Signale werden gewertet:
 *
 *   +  neue Website / Website-Relaunch-Aktivität
 *   +  Recruiting (Karriere-Sektion, offene Stellen)
 *   +  Presse / Ankündigungen
 *   +  Expansion / neue Standorte
 *   +  positive Trends im Google-Rating
 *
 * Wir erfinden nichts. Wenn keine Signale vorliegen, ist der Score `null`
 * (UNKNOWN) — nicht 0. Das ist der Unterschied zwischen „keine
 * Veränderung" und „wir wissen es nicht".
 */

import type {
  FinancialSignal,
  TargetCompany,
  WebsiteAudit,
} from "./model";

export interface PropensityInput {
  company: TargetCompany;
  audit?: WebsiteAudit | null;
  signals?: FinancialSignal[];
}

export interface PropensityBreakdownEntry {
  key: string;
  label: string;
  points: number;
  polarity: "positive" | "neutral" | "negative";
  evidence?: string;
}

export interface PropensityResult {
  /** 0–100 oder `null` wenn keine belastbaren Signale existieren. */
  score: number | null;
  confidence: number;
  breakdown: PropensityBreakdownEntry[];
  signalsUsed: number;
}

export function computePropensity(input: PropensityInput): PropensityResult {
  const breakdown: PropensityBreakdownEntry[] = [];
  let raw = 40; // neutraler Startpunkt, wenn wir mindestens 1 Signal haben
  let signalsUsed = 0;
  let confidenceAccum = 0;

  const audit = input.audit ?? null;
  const signals = input.signals ?? [];

  // Website-Modernität als Propensity-Proxy: eine sehr moderne Website
  // spricht für ein Unternehmen, das kürzlich investiert hat und wieder
  // investiert („Momentum"). Eine sehr alte Website spricht für Stillstand.
  if (audit && Number.isFinite(audit.websiteScore ?? NaN)) {
    signalsUsed++;
    const s = audit.websiteScore ?? 50;
    if (s >= 80) {
      raw += 15;
      confidenceAccum += 0.85;
      breakdown.push({
        key: "modern_web",
        label: "Sehr moderne Website (Score ≥ 80)",
        points: 15,
        polarity: "positive",
        evidence: `Website-Score ${s}`,
      });
    } else if (s >= 60) {
      raw += 5;
      confidenceAccum += 0.7;
      breakdown.push({
        key: "solid_web",
        label: "Solide moderne Website",
        points: 5,
        polarity: "positive",
        evidence: `Website-Score ${s}`,
      });
    } else if (s <= 35) {
      raw -= 8;
      confidenceAccum += 0.6;
      breakdown.push({
        key: "stagnant_web",
        label: "Website wirkt stagnierend",
        points: -8,
        polarity: "negative",
        evidence: `Website-Score ${s}`,
      });
    }
  }

  // Recruiting-Signal aus Financial Signals (falls Provider das ergänzt hat)
  const jobs = signals.find((s) => s.kind === "job_ads");
  if (jobs) {
    signalsUsed++;
    raw += 15;
    confidenceAccum += jobs.confidence ?? 0.6;
    breakdown.push({
      key: "recruiting",
      label: "Aktives Recruiting",
      points: 15,
      polarity: "positive",
      evidence: jobs.evidence ?? undefined,
    });
  }

  const growth = signals.find((s) => s.kind === "growth" || s.kind === "expansion");
  if (growth) {
    signalsUsed++;
    raw += 20;
    confidenceAccum += growth.confidence ?? 0.6;
    breakdown.push({
      key: "growth",
      label: "Erkennbare Wachstums-/Expansionssignale",
      points: 20,
      polarity: "positive",
      evidence: growth.evidence ?? undefined,
    });
  }

  const press = signals.find((s) => s.kind === "press");
  if (press) {
    signalsUsed++;
    raw += 5;
    confidenceAccum += press.confidence ?? 0.55;
    breakdown.push({
      key: "press",
      label: "Presseaktivität",
      points: 5,
      polarity: "positive",
      evidence: press.evidence ?? undefined,
    });
  }

  const reviews = signals.find((s) => s.kind === "reviews");
  if (reviews) {
    signalsUsed++;
    const numericValue = Number(reviews.value?.match(/\d+/)?.[0] ?? "0");
    if (numericValue >= 100 && reviews.polarity === "positive") {
      raw += 5;
      confidenceAccum += reviews.confidence ?? 0.7;
      breakdown.push({
        key: "reviews_momentum",
        label: "Viele positive Bewertungen",
        points: 5,
        polarity: "positive",
        evidence: reviews.evidence ?? undefined,
      });
    }
  }

  const risk = signals.find((s) => s.kind === "risk" || s.kind === "insolvency" || s.kind === "closed");
  if (risk) {
    signalsUsed++;
    raw -= 30;
    confidenceAccum += risk.confidence ?? 0.9;
    breakdown.push({
      key: "risk",
      label: "Risiko-Signal erkannt",
      points: -30,
      polarity: "negative",
      evidence: risk.evidence ?? undefined,
    });
  }

  // Sehr junges Unternehmen (< 3 Jahre) → in der Praxis oft investitionsbereit
  if (input.company.foundedYear && input.company.foundedYear > 1900) {
    const age = new Date().getUTCFullYear() - input.company.foundedYear;
    if (age >= 0 && age <= 3) {
      signalsUsed++;
      raw += 8;
      confidenceAccum += 0.65;
      breakdown.push({
        key: "young",
        label: `Junges Unternehmen (${age} Jahre)`,
        points: 8,
        polarity: "positive",
        evidence: `Gegründet ${input.company.foundedYear}`,
      });
    }
  }

  if (signalsUsed === 0) {
    return { score: null, confidence: 0, breakdown, signalsUsed: 0 };
  }

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const confidence = Math.max(0, Math.min(1, confidenceAccum / signalsUsed));
  return { score, confidence, breakdown, signalsUsed };
}
