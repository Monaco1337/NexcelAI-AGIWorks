/**
 * Source-Authority-Matrix.
 *
 * Wir speichern für jeden Datenpunkt Herkunft + Confidence. Wenn zwei
 * Quellen widersprüchliche Werte liefern (z. B. Google Places sagt
 * „02303 111111" und die Website sagt „02303 222222"), müssen wir das
 * deterministisch auflösen — nicht durch Zufall des Reihenfolge-Inserts.
 *
 * Die Werte hier sind KEINE absoluten Wahrheiten. Sie sind konservative
 * Defaults für „welche Quelle gewinnt in einem 1:1-Konflikt". Der Score
 * pro Datenpunkt kombiniert:
 *
 *   sourceAuthority × recencyFactor × verificationBoost
 *
 * Ergebnis ist ein Wert in [0, 1], vergleichbar mit dem existierenden
 * Confidence-Feld.
 */

import type { ProviderKey } from "./model";

/**
 * Provider-Autorität pro Provider-Key (Basis in [0, 1]).
 *
 * `impressum` und `registry` sind rechtlich veröffentlichte
 * Pflichtangaben und deshalb höher gewichtet als eine Website-Startseite
 * oder Google-Places-Snapshot. `manual` bekommt maximale Autorität, weil
 * ein Human-in-the-Loop-Eintrag als Ground-Truth zählt.
 */
export const PROVIDER_AUTHORITY: Record<ProviderKey | string, number> = {
  manual: 1.0,
  registry: 1.0,
  impressum: 0.99,
  company_website: 0.95,
  google_places: 0.9,
  linkedin: 0.85,
  google_search: 0.6,
  financial_signal: 0.75,
  internal_audit: 0.9,
  internal_scoring: 0.9,
  business_directory: 0.75,
  social_profile: 0.7,
  aggregator: 0.4,
  unknown: 0.4,
};

/** Feldspezifische Modifikatoren: manche Provider sind für bestimmte Felder besser. */
const FIELD_MODIFIERS: Record<string, Partial<Record<ProviderKey | string, number>>> = {
  phone: {
    // Impressum ist bei Telefonnummern besonders zuverlässig (§5 TMG)
    impressum: 0.02,
    google_places: 0.02,
  },
  email: {
    impressum: 0.03,
  },
  address: {
    impressum: 0.03,
    google_places: 0.02,
  },
  decision_maker: {
    impressum: 0.03,
    registry: 0.03,
    linkedin: 0.05,
  },
  legal_form: {
    registry: 0.05,
    impressum: 0.05,
  },
};

/**
 * Zeit-basierter Confidence-Verlust. Sehr konservativ:
 *  - < 7  Tage: 1.00 (frisch)
 *  - < 30 Tage: 0.95
 *  - < 90 Tage: 0.85
 *  - < 180Tage: 0.70
 *  - älter:      0.55
 */
export function recencyFactor(retrievedAt: string | Date | null | undefined): number {
  if (!retrievedAt) return 0.7;
  const then = typeof retrievedAt === "string" ? new Date(retrievedAt).getTime() : retrievedAt.getTime();
  if (!Number.isFinite(then)) return 0.7;
  const ageDays = (Date.now() - then) / 86_400_000;
  if (ageDays < 7) return 1.0;
  if (ageDays < 30) return 0.95;
  if (ageDays < 90) return 0.85;
  if (ageDays < 180) return 0.7;
  return 0.55;
}

/** Verifikations-Status → kleiner Bonus für „verified" / Malus für „conflicting". */
export function verificationBoost(status: string | null | undefined): number {
  switch (status) {
    case "verified":
      return 0.05;
    case "high":
      return 0.02;
    case "medium":
      return 0;
    case "low":
      return -0.05;
    case "conflicting":
      return -0.15;
    default:
      return 0;
  }
}

/**
 * Effektive Autorität eines Quellenpunkts. Ergebnis in [0, 1].
 * Wird sowohl für Konfliktauflösung als auch für Data-Quality-Metriken
 * verwendet.
 */
export function effectiveAuthority(input: {
  provider: string;
  field: string;
  retrievedAt?: string | Date | null;
  verificationStatus?: string | null;
  baseConfidence?: number | null;
}): number {
  const base = PROVIDER_AUTHORITY[input.provider] ?? PROVIDER_AUTHORITY.unknown;
  const fieldMod = FIELD_MODIFIERS[input.field]?.[input.provider] ?? 0;
  const rec = recencyFactor(input.retrievedAt ?? null);
  const verify = verificationBoost(input.verificationStatus ?? null);
  const authority = Math.min(1, Math.max(0, base + fieldMod));
  const raw = authority * rec + verify;
  // Wenn Provider selbst schon eine niedrige Basis-Confidence gemeldet hat,
  // ziehen wir den Minimalwert davon nach unten. Ein Aggregator-Wert soll
  // nicht durch Recency künstlich hochgehoben werden.
  const base01 = clamp01(input.baseConfidence ?? raw);
  return clamp01(Math.min(raw, Math.max(base01 * 0.9 + raw * 0.1, raw * 0.5)));
}

/**
 * Wähle bei zwei widersprüchlichen Quellen den bevorzugten Wert. Wenn
 * die effektive Autorität beider Kandidaten sehr eng beieinanderliegt
 * (< 0.05), wird `conflicting=true` zurückgegeben. Der Consumer soll dann
 * KEINEN Wert autoritativ verwenden, sondern die Review-Queue triggern.
 */
export interface AuthorityCandidate<T = string> {
  value: T;
  provider: string;
  field: string;
  retrievedAt?: string | Date | null;
  verificationStatus?: string | null;
  baseConfidence?: number | null;
}

export interface AuthorityDecision<T = string> {
  chosen: AuthorityCandidate<T>;
  runnerUp?: AuthorityCandidate<T>;
  chosenAuthority: number;
  runnerUpAuthority?: number;
  conflicting: boolean;
  reason: string;
}

export function pickAuthoritative<T = string>(
  candidates: AuthorityCandidate<T>[]
): AuthorityDecision<T> | null {
  if (candidates.length === 0) return null;
  const scored = candidates
    .map((c) => ({ candidate: c, authority: effectiveAuthority(c) }))
    .sort((a, b) => b.authority - a.authority);
  const top = scored[0];
  const second = scored[1];
  const conflicting =
    Boolean(second) &&
    second.authority > 0 &&
    top.authority - second.authority < 0.05 &&
    !valuesEqual(top.candidate.value, second.candidate.value);
  return {
    chosen: top.candidate,
    runnerUp: second?.candidate,
    chosenAuthority: top.authority,
    runnerUpAuthority: second?.authority,
    conflicting,
    reason: conflicting
      ? `Konflikt: ${top.candidate.provider} vs. ${second.candidate.provider}`
      : `Autoritative Quelle: ${top.candidate.provider}`,
  };
}

function valuesEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a === "string" && typeof b === "string") {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return false;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
