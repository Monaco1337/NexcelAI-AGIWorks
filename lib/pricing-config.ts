/**
 * Preiskalkulator – Config-driven Pricing Engine
 * Pure function calcQuote(state) => quote
 * Line-Items: Basis, Features (je Modul), Zeitrahmen, Qualität, Risikopuffer, optional Wartung/SLA
 */

export type ProjectType = "web" | "app" | "automatisierung" | "ki" | "sonstiges";
export type Scope = "mvp" | "growth" | "enterprise";
export type Timeframe = "asap" | "standard" | "relaxed";
export type Quality = "startup" | "professional" | "elite";
export type ApiTier = "1-2" | "3-5" | "6+";

export interface WizardState {
  /** Mehrfachauswahl: z. B. Web + App + KI-Integration */
  projectTypes: ProjectType[];
  scope: Scope | null;
  features: string[];
  apiTier: ApiTier | null;
  timeframe: Timeframe | null;
  quality: Quality | null;
  wantMaintenance?: boolean;
  hasMigration?: boolean;
  hasKi?: boolean;
}

export interface QuoteItem {
  label: string;
  amountMin: number;
  amountMax: number;
}

export interface Quote {
  min: number;
  max: number;
  weeksMin: number;
  weeksMax: number;
  items: QuoteItem[];
  riskPct: number;
  scopeSummary: string[];
}

// ─── Base Prices (€) pro Projektart ─────────────────────────────────────
const BASE_PRICES: Record<
  ProjectType,
  { min: number; max: number; weeksMin: number; weeksMax: number }
> = {
  web: { min: 8_000, max: 25_000, weeksMin: 4, weeksMax: 12 },
  app: { min: 15_000, max: 45_000, weeksMin: 8, weeksMax: 20 },
  automatisierung: { min: 12_000, max: 35_000, weeksMin: 6, weeksMax: 16 },
  ki: { min: 25_000, max: 80_000, weeksMin: 10, weeksMax: 28 },
  sonstiges: { min: 10_000, max: 40_000, weeksMin: 6, weeksMax: 18 },
};

const SCOPE_MULT: Record<Scope, number> = {
  mvp: 0.7,
  growth: 1.0,
  enterprise: 1.5,
};

const TIMEFRAME_MULT: Record<Timeframe, number> = {
  asap: 1.25,
  standard: 1.0,
  relaxed: 0.9,
};

const QUALITY_MULT: Record<Quality, number> = {
  startup: 0.85,
  professional: 1.0,
  elite: 1.35,
};

// API-Tier → effektive Anzahl für Risiko
const API_TIER_RISK: Record<ApiTier, number> = {
  "1-2": 2,
  "3-5": 4,
  "6+": 8,
};

const RISK_API_PER_UNIT = 2.5;
const RISK_KI = 8;
const RISK_MIGRATION = 10;
const RISK_SONSTIGES = 5;

// Feature-Module: feste Bandbreite (€) pro Modul – für Preiskarten exportiert
export const FEATURE_PRICES: Record<string, { min: number; max: number; label: string }> = {
  api: { min: 2_500, max: 6_000, label: "API-Integrationen" },
  dashboard: { min: 3_500, max: 9_000, label: "Dashboard" },
  auth: { min: 4_000, max: 11_000, label: "Auth / Rollen (RBAC)" },
  payments: { min: 6_000, max: 16_000, label: "Payments" },
  admin_panel: { min: 4_500, max: 12_000, label: "Admin Panel" },
  reporting: { min: 3_000, max: 8_000, label: "Reporting / Analytics" },
  ki_module: { min: 12_000, max: 35_000, label: "KI-Modul (RAG / Agent)" },
  workflow: { min: 7_000, max: 20_000, label: "Workflow-Automatisierung" },
  migration: { min: 5_000, max: 15_000, label: "Data Migration" },
};

const FEATURE_PRICES_NUM: Record<string, { min: number; max: number }> = Object.fromEntries(
  Object.entries(FEATURE_PRICES).map(([k, v]) => [k, { min: v.min, max: v.max }])
);

const MAINTENANCE_MULT = 0.12; // 12 % p.a. auf Basis

/** Scope Summary: 3–6 Bulletpoints aus State */
function buildScopeSummary(state: WizardState, quote: Omit<Quote, "scopeSummary">): string[] {
  const bullets: string[] = [];
  if (state.projectTypes?.length) {
    bullets.push(`Projektart: ${state.projectTypes.map((p) => PROJECT_TYPE_LABELS[p]).join(", ")}`);
  }
  const sc = state.scope && SCOPE_LABELS[state.scope];
  const tf = state.timeframe && TIMEFRAME_LABELS[state.timeframe];
  const qu = state.quality && QUALITY_LABELS[state.quality];
  if (sc) bullets.push(`Umfang: ${sc}`);
  bullets.push(`Geschätzte Dauer: ${quote.weeksMin}–${quote.weeksMax} Wochen`);
  if (tf) bullets.push(`Zeitrahmen: ${tf}`);
  if (qu) bullets.push(`Qualitätsstufe: ${qu}`);
  if (state.features.length > 0) {
    bullets.push(`${state.features.length} Feature-Modul(e) ausgewählt`);
  }
  if (state.wantMaintenance) bullets.push("Inkl. Wartung/SLA-Option");
  return bullets.slice(0, 6);
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  web: "Web",
  app: "App",
  automatisierung: "Automatisierung",
  ki: "KI-Integration",
  sonstiges: "Sonstiges",
};

export const SCOPE_LABELS: Record<Scope, string> = {
  mvp: "MVP",
  growth: "Growth",
  enterprise: "Enterprise",
};

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  asap: "ASAP",
  standard: "Standard",
  relaxed: "Relaxed",
};

export const QUALITY_LABELS: Record<Quality, string> = {
  startup: "Startup",
  professional: "Professional",
  elite: "Elite",
};

/** Beschreibungen für UI: Zeitrahmen (Wochen, was enthalten) */
export const TIMEFRAME_INFO: Record<Timeframe, { weeksNote: string; description: string }> = {
  asap: {
    weeksNote: "Kompakter Zeitplan",
    description: "Priorisierte Ressourcen, parallele Sprints. Ideal wenn ein festes Launch-Datum gesetzt ist.",
  },
  standard: {
    weeksNote: "Ausgewogener Zeitplan",
    description: "Klassische Planung mit Puffer für Review und Iteration. Gute Balance aus Tempo und Qualität.",
  },
  relaxed: {
    weeksNote: "Flexibler Zeitplan",
    description: "Mehr Zeit für Feinschliff, Dokumentation und schrittweise Freigaben. Geringerer Aufpreis.",
  },
};

/** Beschreibungen für UI: Qualitätsstufe (Dauer, was enthalten) */
export const QUALITY_INFO: Record<Quality, { weeksNote: string; description: string; includes: string[] }> = {
  startup: {
    weeksNote: "Schnelle Umsetzung",
    description: "Fokus auf Funktionalität und schnelles Go-Live. Ideal für MVP und erste Version.",
    includes: ["Kernfunktionen", "Basis-Tests", "Dokumentation (Essentials)", "Deployment"],
  },
  professional: {
    weeksNote: "Produktionsreife Qualität",
    description: "Vollständige QA, Code-Reviews, Skalierbarkeit. Standard für langfristige Produkte.",
    includes: ["Vollständige QA", "Code-Reviews", "Performance-Optimierung", "DSGVO-konforme Umsetzung", "Dokumentation"],
  },
  elite: {
    weeksNote: "Enterprise-Niveau",
    description: "Höchste Qualitäts- und Sicherheitsstandards, Observability, dedizierte Betreuung.",
    includes: ["Alles aus Professional", "Security-Audit", "Observability & Monitoring", "SLA & Dedizierter Support", "Schulung"],
  },
};

/** Pure function: Berechnet Angebot aus Wizard-State. Ergebnis niemals 0. */
export function calcQuote(state: WizardState): Quote | null {
  const { projectTypes, scope, timeframe, quality, apiTier, features, wantMaintenance, hasMigration, hasKi } = state;
  if (!projectTypes?.length || !scope || !timeframe || !quality) return null;

  const scopeMult = SCOPE_MULT[scope];
  const timeMult = TIMEFRAME_MULT[timeframe];
  const qualityMult = QUALITY_MULT[quality];

  const items: QuoteItem[] = [];
  let baseMin = 0;
  let baseMax = 0;
  let baseWeeksMin = 0;
  let baseWeeksMax = 0;
  for (const pt of projectTypes) {
    const b = BASE_PRICES[pt];
    if (b) {
      baseMin += b.min;
      baseMax += b.max;
      baseWeeksMin = Math.max(baseWeeksMin, b.weeksMin);
      baseWeeksMax = Math.max(baseWeeksMax, b.weeksMax);
    }
  }
  if (projectTypes.length > 1) {
    const discount = 0.85;
    baseMin = Math.round(baseMin * discount);
    baseMax = Math.round(baseMax * discount);
  }

  const labels = projectTypes.map((p) => PROJECT_TYPE_LABELS[p]).join(" + ");
  items.push({
    label: `Basis (${labels})`,
    amountMin: baseMin,
    amountMax: baseMax,
  });

  const afterScopeMin = baseMin * scopeMult;
  const afterScopeMax = baseMax * scopeMult;
  items.push({
    label: `Umfang (${scope})`,
    amountMin: Math.round(afterScopeMin - baseMin),
    amountMax: Math.round(afterScopeMax - baseMax),
  });

  const afterTimeMin = afterScopeMin * timeMult;
  const afterTimeMax = afterScopeMax * timeMult;
  items.push({
    label: `Zeitrahmen (${timeframe})`,
    amountMin: Math.round(afterTimeMin - afterScopeMin),
    amountMax: Math.round(afterTimeMax - afterScopeMax),
  });

  let min = afterTimeMin * qualityMult;
  let max = afterTimeMax * qualityMult;
  items.push({
    label: `Qualität (${quality})`,
    amountMin: Math.round(min - afterTimeMin),
    amountMax: Math.round(max - afterTimeMax),
  });

  // Features (je Modul)
  for (const fid of features) {
    const fp = FEATURE_PRICES_NUM[fid];
    if (fp) {
      const label = FEATURE_PRICES[fid]?.label ?? fid.replace(/_/g, " ");
      items.push({ label: `Modul: ${label}`, amountMin: fp.min, amountMax: fp.max });
      min += fp.min;
      max += fp.max;
    }
  }

  let riskPct = 0;
  if (apiTier) {
    const units = API_TIER_RISK[apiTier];
    riskPct += Math.min(units * RISK_API_PER_UNIT, 22);
  }
  if (hasKi) riskPct += RISK_KI;
  if (hasMigration) riskPct += RISK_MIGRATION;
  if (projectTypes.includes("sonstiges")) riskPct += RISK_SONSTIGES;

  const riskAmountMin = Math.round((min * riskPct) / 100);
  const riskAmountMax = Math.round((max * riskPct) / 100);
  if (riskPct > 0) {
    items.push({
      label: `Risiko-Puffer (${riskPct} %)`,
      amountMin: riskAmountMin,
      amountMax: riskAmountMax,
    });
  }
  min = Math.round(min) + riskAmountMin;
  max = Math.round(max) + riskAmountMax;

  if (wantMaintenance) {
    const maintMin = Math.round(min * MAINTENANCE_MULT);
    const maintMax = Math.round(max * MAINTENANCE_MULT);
    items.push({ label: "Wartung / SLA (optional)", amountMin: maintMin, amountMax: maintMax });
    min += maintMin;
    max += maintMax;
  }

  if (min <= 0 || max <= 0) {
    min = Math.max(1, min);
    max = Math.max(min, max);
  }

  const weeksMin = Math.max(1, Math.round(baseWeeksMin * scopeMult * timeMult));
  const weeksMax = Math.max(weeksMin, Math.round(baseWeeksMax * scopeMult * timeMult));

  const quote: Quote = {
    min,
    max,
    weeksMin,
    weeksMax,
    items,
    riskPct,
    scopeSummary: [],
  };
  quote.scopeSummary = buildScopeSummary(state, quote);
  return quote;
}
