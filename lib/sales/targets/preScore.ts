/**
 * Cold-Start-Bewertung aus Discovery-Daten.
 *
 * Das ausgereifte Scoring (Lead Score V1/V2, Priority Matrix, Propensity)
 * setzt Anreicherung voraus: Website-Audit, Kontakte, Entscheider. Bei
 * einem Katalog in der Größenordnung von hunderttausend Betrieben ist die
 * Anreicherung aber Wochenarbeit — und bis dahin wäre jede Firma
 * unbewertet. Genau das macht einen Katalog unbenutzbar: ohne Bewertung
 * gibt es keine sinnvolle Reihenfolge, und ohne Reihenfolge analysiert
 * man zufällige Betriebe statt der aussichtsreichen.
 *
 * Der Pre-Score schließt diese Lücke. Er nutzt ausschließlich, was die
 * Discovery ohnehin liefert — kein externer Abruf, keine Kosten, keine
 * Wartezeit — und erfüllt zwei Aufgaben:
 *
 *   1. Er ordnet die Anreicherungs-Warteschlange, damit die teure
 *      Tiefenanalyse bei den aussichtsreichsten Betrieben beginnt.
 *   2. Er liefert sofort eine vorläufige Prioritätsklasse, sodass sich
 *      der Katalog vom ersten Moment an filtern lässt.
 *
 * Er ersetzt den echten Lead Score NICHT. Sobald die Anreicherung für
 * einen Betrieb durch ist, gilt der belastbare Score; der Pre-Score
 * bleibt nur als Sortierschlüssel für noch nicht analysierte Firmen.
 *
 * Bewusst deterministisch und ohne Modell: die Signale sind wenige und
 * klar interpretierbar, eine erlernte Gewichtung hätte hier weder
 * Trainingsdaten noch Erklärbarkeit.
 */

import type { DiscoveredCompanyStub } from "./providers/types";

/* -------------------------------------------------------------------------- */
/*  Branchenfit                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Wie gut passt eine Branche grundsätzlich zu unserem Angebot?
 *
 * Maßgeblich ist nicht Sympathie, sondern ob dort typischerweise
 * Prozesse laufen, die sich mit Software verbessern lassen, und ob ein
 * fünfstelliges Projektbudget realistisch ist. Ein Handwerksbetrieb mit
 * Terminplanung, Angeboten und Einsatzsteuerung hat davon mehr als ein
 * Kiosk.
 */
const INDUSTRY_FIT: Record<string, number> = {
  "Sanitär / Heizung": 100,
  Elektro: 100,
  Handwerk: 95,
  "Ärzte / Praxen": 90,
  Kanzleien: 90,
  Steuerberatung: 90,
  Immobilien: 85,
  Industrie: 85,
  Produktion: 85,
  Logistik: 80,
  Automotive: 80,
  "Fitness / Beauty": 75,
  Hotellerie: 75,
  Bildung: 70,
  Dienstleistungen: 70,
  Gastronomie: 65,
  Finanzen: 60,
  "IT / Software": 45, // Baut selbst — seltener Bedarf, härterer Wettbewerb.
  Einzelhandel: 50,
  Sonstige: 30,
};

/** Betriebsarten, bei denen ein Projektgeschäft praktisch ausscheidet. */
const LOW_VALUE_SUBTYPES = new Set([
  "Kiosk",
  "Tabakwaren",
  "Leerstand",
  "Getränke",
  "Automat",
]);

/* -------------------------------------------------------------------------- */
/*  Gewichtung                                                                 */
/* -------------------------------------------------------------------------- */

export interface PreScoreWeights {
  /** Erreichen wir den Betrieb überhaupt? */
  contactability: number;
  /** Steckt ein echter Betrieb dahinter oder nur ein Kartenpunkt? */
  substance: number;
  /** Wie groß ist die erkennbare Digitalisierungslücke? */
  digitalGap: number;
  /** Passt die Branche zum Angebot? */
  industryFit: number;
}

export const DEFAULT_PRE_SCORE_WEIGHTS: PreScoreWeights = {
  contactability: 30,
  substance: 25,
  digitalGap: 25,
  industryFit: 20,
};

export interface PreScoreDimension {
  key: keyof PreScoreWeights;
  label: string;
  /** Rohwert der Dimension, 0–100. */
  raw: number;
  weight: number;
  /** Beitrag zum Gesamtscore in Punkten. */
  contribution: number;
  /** Belege, die den Rohwert erklären. */
  evidence: string[];
}

export interface PreScoreResult {
  score: number;
  dimensions: PreScoreDimension[];
  /** Kurzbegründung für die Anzeige in der Liste. */
  rationale: string;
}

/** Eingabe: was die Discovery über einen Betrieb weiß. */
export interface PreScoreInput {
  industry?: string | null;
  subIndustry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  employeeEstimateMax?: number | null;
  foundedYear?: number | null;
  isChain?: boolean;
  /** Strukturierte Zusatzsignale aus der Discovery (siehe osmProfile). */
  signals?: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/* -------------------------------------------------------------------------- */

/**
 * Erreichbarkeit: ohne Kanal kein Vertrieb.
 *
 * Telefon wiegt am schwersten, weil es im Mittelstand der Kanal ist, der
 * tatsächlich zu einem Gespräch führt.
 */
function scoreContactability(input: PreScoreInput): PreScoreDimension {
  const ev: string[] = [];
  let raw = 0;
  if (input.phone) {
    raw += 55;
    ev.push("Telefonnummer vorhanden");
  }
  if (input.email) {
    raw += 25;
    ev.push("E-Mail vorhanden");
  }
  if (input.website) {
    raw += 20;
    ev.push("Website als Kontaktweg");
  }
  if (raw === 0) ev.push("Kein direkter Kontaktweg bekannt");
  return dim("contactability", "Erreichbarkeit", clamp(raw), ev);
}

/**
 * Substanz: unterscheidet einen geführten Betrieb von einem bloßen
 * Kartenpunkt. Vollständige Adresse, Öffnungszeiten und gepflegte Daten
 * sind gute Hinweise darauf, dass es die Firma wirklich so gibt.
 */
function scoreSubstance(input: PreScoreInput): PreScoreDimension {
  const sig = new Set(input.signals ?? []);
  const ev: string[] = [];
  let raw = 20; // Grundannahme: der Eintrag existiert.

  if (input.addressLine && input.postalCode) {
    raw += 25;
    ev.push("Vollständige Adresse");
  } else if (input.addressLine || input.postalCode) {
    raw += 10;
    ev.push("Adresse unvollständig");
  }
  if (sig.has("has_opening_hours")) {
    raw += 20;
    ev.push("Öffnungszeiten gepflegt");
  }
  if (sig.has("data_recently_verified")) {
    raw += 10;
    ev.push("Daten kürzlich bestätigt");
  }
  const staff = input.employeeEstimateMax ?? null;
  if (staff !== null && staff >= 10) {
    raw += 15;
    ev.push(`Mindestens ${staff} Beschäftigte`);
  }
  if (sig.has("multi_storey_premises")) {
    raw += 10;
    ev.push("Mehrgeschossige Betriebsstätte");
  }
  if (input.foundedYear && input.foundedYear <= new Date().getFullYear() - 5) {
    raw += 10;
    ev.push(`Seit ${input.foundedYear} am Markt`);
  }
  if (ev.length === 0) ev.push("Kaum belastbare Betriebsmerkmale");
  return dim("substance", "Betriebssubstanz", clamp(raw), ev);
}

/**
 * Digitalisierungslücke: der eigentliche Anlass für ein Gespräch.
 *
 * Wichtig ist die Richtung: eine fehlende Website ist hier ein starkes
 * Plus, kein Minus. Wer schon alles digitalisiert hat, braucht uns
 * seltener. Gleichzeitig darf das nicht dazu führen, dass ein Betrieb
 * ohne jede Spur automatisch oben landet — deshalb wirkt diese Dimension
 * nur zusammen mit Erreichbarkeit und Substanz.
 */
function scoreDigitalGap(input: PreScoreInput): PreScoreDimension {
  const sig = new Set(input.signals ?? []);
  const ev: string[] = [];
  let raw = 35; // Ohne Gegenhinweis: durchschnittlicher Bedarf.

  if (!input.website) {
    raw += 35;
    ev.push("Keine Website hinterlegt");
  }
  if (sig.has("uses_fax")) {
    raw += 15;
    ev.push("Fax noch in Benutzung");
  }
  if (sig.has("cash_only")) {
    raw += 15;
    ev.push("Nur Barzahlung");
  }
  if (sig.has("has_social_media")) {
    raw -= 10;
    ev.push("Bereits in sozialen Netzwerken aktiv");
  }
  if (sig.has("takes_reservation") || sig.has("has_online_booking")) {
    raw -= 20;
    ev.push("Online-Buchung bereits vorhanden");
  }
  if (sig.has("accepts_card_payment")) {
    raw -= 10;
    ev.push("Kartenzahlung möglich");
  }
  if (ev.length === 0) ev.push("Keine belastbaren Digitalsignale");
  return dim("digitalGap", "Digitalisierungslücke", clamp(raw), ev);
}

function scoreIndustryFit(input: PreScoreInput): PreScoreDimension {
  const ev: string[] = [];
  const industry = input.industry ?? "Sonstige";
  let raw = INDUSTRY_FIT[industry] ?? 40;
  ev.push(`Branche ${industry}`);

  if (input.subIndustry && LOW_VALUE_SUBTYPES.has(input.subIndustry)) {
    raw = Math.min(raw, 20);
    ev.push(`${input.subIndustry}: Projektgeschäft unwahrscheinlich`);
  }
  if (input.isChain) {
    raw = Math.min(raw, 10);
    ev.push("Filiale einer Kette — Entscheidung liegt nicht vor Ort");
  }
  return dim("industryFit", "Branchenfit", clamp(raw), ev);
}

function dim(
  key: keyof PreScoreWeights,
  label: string,
  raw: number,
  evidence: string[]
): PreScoreDimension {
  return { key, label, raw, weight: 0, contribution: 0, evidence };
}

/* -------------------------------------------------------------------------- */

export function computePreScore(
  input: PreScoreInput,
  weights: PreScoreWeights = DEFAULT_PRE_SCORE_WEIGHTS
): PreScoreResult {
  const dims = [
    scoreContactability(input),
    scoreSubstance(input),
    scoreDigitalGap(input),
    scoreIndustryFit(input),
  ];

  const sum =
    weights.contactability + weights.substance + weights.digitalGap + weights.industryFit;
  const factor = sum > 0 ? 100 / sum : 0;

  let total = 0;
  for (const d of dims) {
    d.weight = Math.round(weights[d.key] * factor * 10) / 10;
    d.contribution = Math.round(((d.raw * d.weight) / 100) * 10) / 10;
    total += d.contribution;
  }

  const score = Math.round(clamp(total));
  const driver = [...dims].sort((a, b) => b.contribution - a.contribution)[0];
  return {
    score,
    dimensions: dims,
    rationale: `${score}/100 — stärkster Treiber: ${driver.label} (${driver.evidence[0]})`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Vorläufige Klasse                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Schwellen der vorläufigen Einstufung.
 *
 * Bewusst strenger als beim echten Lead Score: der Pre-Score kennt weder
 * Website-Qualität noch Entscheider. A++ bleibt deshalb der
 * angereicherten Bewertung vorbehalten — aus Discovery-Daten allein lässt
 * sich diese Aussage nicht verantworten.
 */
export function preScoreClass(score: number): "A+" | "A" | "B" | "C" | "D" {
  if (score >= 80) return "A+";
  if (score >= 66) return "A";
  if (score >= 50) return "B";
  if (score >= 34) return "C";
  return "D";
}

/**
 * Warteschlangen-Priorität für die Anreicherung.
 *
 * `sales_target_enrichment_jobs.priority` wird aufsteigend abgearbeitet,
 * der beste Betrieb braucht also die kleinste Zahl. Bisher bekam jede
 * Firma pauschal 100 — bei hunderttausend Einträgen heißt das, dass die
 * Tiefenanalyse in zufälliger Reihenfolge läuft und die aussichtsreichen
 * Betriebe rechnerisch nie erreicht.
 */
export function enrichmentPriorityFromPreScore(score: number): number {
  return clamp(100 - score);
}

/** Bequemer Weg von einem Discovery-Ergebnis zur Bewertung. */
export function preScoreFromStub(stub: DiscoveredCompanyStub): PreScoreResult {
  return computePreScore({
    industry: stub.industry,
    subIndustry: stub.subIndustry,
    website: stub.website,
    phone: stub.phone,
    email: stub.email,
    addressLine: stub.addressLine,
    postalCode: stub.postalCode,
    city: stub.city,
    employeeEstimateMax: stub.employeeEstimateMax,
    foundedYear: stub.foundedYear,
    isChain: stub.isChain,
    signals: stub.signals ?? [],
  });
}
