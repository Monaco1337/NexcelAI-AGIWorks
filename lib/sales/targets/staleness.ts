/**
 * Stale-Data-Policy pro Datentyp.
 *
 * Ziel: jede Enrichment-Phase wird nur dann erneut ausgeführt, wenn die
 * bestehenden Daten „zu alt" für den Zweck sind. TTLs sind bewusst
 * konservativ und pro Datentyp konfigurierbar (Env-Override).
 *
 * WICHTIG:
 *  - Diese TTLs betreffen NUR die Provider-Aufrufe, nicht die UI-Anzeige.
 *  - „Stale" heißt nicht „falsch" — wir zeigen die Daten weiterhin an,
 *    markieren sie aber als überprüfungsbedürftig.
 *  - Force-Reruns (Admin-Button „Analyse erneut ausführen") umgehen die
 *    TTL bewusst; sie werden im Audit-Log als Manual-Refresh markiert.
 */

import type { EnrichmentPhase } from "./model";

export interface FreshnessPolicy {
  /** Wie alt darf ein Wert maximal sein, bevor wir erneut fetchen? */
  ttlSeconds: number;
  /** Kurzer Menschentext für UI/Logs. */
  label: string;
}

const DAY = 86_400;

const DEFAULT_POLICIES: Record<EnrichmentPhase, FreshnessPolicy> = {
  company_basics: { ttlSeconds: 30 * DAY, label: "30 Tage" },
  website_contact: { ttlSeconds: 30 * DAY, label: "30 Tage" },
  decision_makers: { ttlSeconds: 45 * DAY, label: "45 Tage" },
  website_audit: { ttlSeconds: 14 * DAY, label: "14 Tage" },
  software_opportunities: { ttlSeconds: 30 * DAY, label: "30 Tage" },
  financial_signals: { ttlSeconds: 60 * DAY, label: "60 Tage" },
  sales_brief: { ttlSeconds: 21 * DAY, label: "21 Tage" },
  lead_score: { ttlSeconds: 7 * DAY, label: "7 Tage" },
};

/**
 * Erlaubt eine Env-Override in der Form
 * `NEXT_SALES_TARGET_TTL_website_audit=604800` (Sekunden).
 */
function envOverride(phase: EnrichmentPhase): number | null {
  const key = `NEXT_SALES_TARGET_TTL_${phase}`;
  const raw = process.env[key];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

export function freshnessPolicy(phase: EnrichmentPhase): FreshnessPolicy {
  const override = envOverride(phase);
  if (override !== null) return { ttlSeconds: override, label: `${Math.round(override / DAY)} Tage` };
  return DEFAULT_POLICIES[phase];
}

/** True, wenn `lastRunAt` innerhalb des Frische-Fensters liegt und wir überspringen dürfen. */
export function isFresh(
  phase: EnrichmentPhase,
  lastRunAt: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!lastRunAt) return false;
  const t = typeof lastRunAt === "string" ? Date.parse(lastRunAt) : lastRunAt.getTime();
  if (!Number.isFinite(t)) return false;
  const ageSeconds = (now.getTime() - t) / 1000;
  return ageSeconds < freshnessPolicy(phase).ttlSeconds;
}

export interface FreshnessDecision {
  phase: EnrichmentPhase;
  action: "skip" | "run";
  ageSeconds: number | null;
  ttlSeconds: number;
  reason: string;
}

export function decideFreshness(
  phase: EnrichmentPhase,
  lastRunAt: string | Date | null | undefined,
  options: { force?: boolean } = {}
): FreshnessDecision {
  const policy = freshnessPolicy(phase);
  if (options.force) {
    return {
      phase,
      action: "run",
      ageSeconds: ageOf(lastRunAt),
      ttlSeconds: policy.ttlSeconds,
      reason: "Force-Rerun angefordert",
    };
  }
  if (!lastRunAt) {
    return {
      phase,
      action: "run",
      ageSeconds: null,
      ttlSeconds: policy.ttlSeconds,
      reason: "Noch nie ausgeführt",
    };
  }
  const age = ageOf(lastRunAt);
  if (age !== null && age < policy.ttlSeconds) {
    return {
      phase,
      action: "skip",
      ageSeconds: age,
      ttlSeconds: policy.ttlSeconds,
      reason: `Frisch (Alter ${Math.round(age / 3600)} h, TTL ${policy.label})`,
    };
  }
  return {
    phase,
    action: "run",
    ageSeconds: age,
    ttlSeconds: policy.ttlSeconds,
    reason: `Stale (Alter ${age !== null ? Math.round(age / 3600) : "?"} h > TTL ${policy.label})`,
  };
}

function ageOf(v: string | Date | null | undefined): number | null {
  if (!v) return null;
  const t = typeof v === "string" ? Date.parse(v) : v.getTime();
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 1000)) : null;
}
