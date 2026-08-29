/**
 * Provider-Health und Circuit-Breaker.
 *
 * Ohne Health-Tracking rennen wir bei einem toten Provider potenziell
 * 100+ Mal in denselben Fehler. Wir tracken deshalb pro Provider:
 *
 *   HEALTHY | DEGRADED | RATE_LIMITED | UNAVAILABLE | MISCONFIGURED
 *
 * und blockieren neue Aufrufe innerhalb eines Cooldown-Fensters. Der
 * State wird zusätzlich persistiert (`sales_target_provider_health`),
 * damit ein Neustart des Servers den Circuit-Breaker nicht resettet.
 *
 * WICHTIG:
 *  - Der Circuit-Breaker ist konservativ: schon 3 aufeinanderfolgende
 *    harte Fehler → DEGRADED (kurzer Cooldown), 6 → UNAVAILABLE
 *    (längerer Cooldown).
 *  - RATE_LIMITED wird durch expliziten 429-Return oder Provider-Header
 *    ausgelöst — nicht durch generische Fehler.
 *  - MISCONFIGURED (fehlender API-Key etc.) hebt sich nicht selbst auf.
 */

import { db } from "@/lib/pg";
import { TargetError } from "../errors";

export type ProviderState =
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "MISCONFIGURED";

export interface ProviderHealth {
  provider: string;
  state: ProviderState;
  consecutiveFail: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
  note: string | null;
  updatedAt: string;
}

interface InMemoryState {
  state: ProviderState;
  consecutiveFail: number;
  cooldownUntil: number | null;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  note: string | null;
}

const memory = new Map<string, InMemoryState>();

const DEGRADED_THRESHOLD = 3;
const UNAVAILABLE_THRESHOLD = 6;
const DEGRADED_COOLDOWN_MS = 60_000;      // 1 Min
const UNAVAILABLE_COOLDOWN_MS = 5 * 60_000;// 5 Min
const RATE_LIMITED_COOLDOWN_MS = 3 * 60_000;

function ensureState(provider: string): InMemoryState {
  let s = memory.get(provider);
  if (!s) {
    s = {
      state: "HEALTHY",
      consecutiveFail: 0,
      cooldownUntil: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      note: null,
    };
    memory.set(provider, s);
  }
  return s;
}

/** Prüft, ob ein Aufruf gerade erlaubt ist. Wirft bei blockierter Provider. */
export function assertProviderCallable(provider: string): void {
  const s = ensureState(provider);
  if (s.state === "MISCONFIGURED") {
    throw new TargetError("PROVIDER_NOT_CONFIGURED", `Provider ${provider} ist nicht konfiguriert (${s.note ?? "kein Detail"})`);
  }
  if (s.cooldownUntil && s.cooldownUntil > Date.now()) {
    if (s.state === "RATE_LIMITED") {
      throw new TargetError("PROVIDER_RATE_LIMITED", `Provider ${provider} steht im Cooldown (Rate-Limit)`);
    }
    if (s.state === "UNAVAILABLE") {
      throw new TargetError("PROVIDER_UNAVAILABLE", `Provider ${provider} steht im Cooldown (unavailable)`);
    }
    if (s.state === "DEGRADED") {
      throw new TargetError("PROVIDER_UNAVAILABLE", `Provider ${provider} steht im Cooldown (degraded)`);
    }
  }
}

export function markProviderMisconfigured(provider: string, note: string): void {
  const s = ensureState(provider);
  s.state = "MISCONFIGURED";
  s.note = note;
  void persist(provider, s);
}

export function markProviderRateLimited(provider: string, note?: string): void {
  const s = ensureState(provider);
  s.state = "RATE_LIMITED";
  s.cooldownUntil = Date.now() + RATE_LIMITED_COOLDOWN_MS;
  s.note = note ?? null;
  s.lastFailureAt = Date.now();
  void persist(provider, s);
}

export function markProviderSuccess(provider: string): void {
  const s = ensureState(provider);
  s.state = "HEALTHY";
  s.consecutiveFail = 0;
  s.cooldownUntil = null;
  s.lastSuccessAt = Date.now();
  s.note = null;
  void persist(provider, s);
}

export function markProviderFailure(provider: string, error: Error | string): void {
  const s = ensureState(provider);
  s.consecutiveFail++;
  s.lastFailureAt = Date.now();
  s.note = typeof error === "string" ? error : error.message;
  if (s.consecutiveFail >= UNAVAILABLE_THRESHOLD) {
    s.state = "UNAVAILABLE";
    s.cooldownUntil = Date.now() + UNAVAILABLE_COOLDOWN_MS;
  } else if (s.consecutiveFail >= DEGRADED_THRESHOLD) {
    s.state = "DEGRADED";
    s.cooldownUntil = Date.now() + DEGRADED_COOLDOWN_MS;
  }
  void persist(provider, s);
}

export function getProviderHealthSnapshot(provider: string): ProviderHealth {
  const s = ensureState(provider);
  return {
    provider,
    state: s.state,
    consecutiveFail: s.consecutiveFail,
    lastSuccessAt: s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : null,
    lastFailureAt: s.lastFailureAt ? new Date(s.lastFailureAt).toISOString() : null,
    cooldownUntil: s.cooldownUntil ? new Date(s.cooldownUntil).toISOString() : null,
    note: s.note,
    updatedAt: new Date().toISOString(),
  };
}

export function allProviderHealth(): ProviderHealth[] {
  return Array.from(memory.keys()).map(getProviderHealthSnapshot);
}

/** Erlaubt manuelles Zurücksetzen (Admin). */
export function resetProviderHealth(provider: string): void {
  memory.delete(provider);
  void persistDelete(provider);
}

async function persist(provider: string, s: InMemoryState): Promise<void> {
  try {
    const sql = await db();
    if (!sql) return;
    await sql`
      INSERT INTO sales_target_provider_health (
        provider, state, consecutive_fail,
        last_success_at, last_failure_at, cooldown_until, note, updated_at
      ) VALUES (
        ${provider}, ${s.state}, ${s.consecutiveFail},
        ${s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : null},
        ${s.lastFailureAt ? new Date(s.lastFailureAt).toISOString() : null},
        ${s.cooldownUntil ? new Date(s.cooldownUntil).toISOString() : null},
        ${s.note}, NOW()
      )
      ON CONFLICT (provider) DO UPDATE SET
        state = EXCLUDED.state,
        consecutive_fail = EXCLUDED.consecutive_fail,
        last_success_at = COALESCE(EXCLUDED.last_success_at, sales_target_provider_health.last_success_at),
        last_failure_at = COALESCE(EXCLUDED.last_failure_at, sales_target_provider_health.last_failure_at),
        cooldown_until = EXCLUDED.cooldown_until,
        note = EXCLUDED.note,
        updated_at = NOW()
    `;
  } catch {
    // Health-Persistenz ist best-effort. Wir dürfen nicht wegen einem
    // failed INSERT den eigentlichen Provider-Call verhindern.
  }
}

async function persistDelete(provider: string): Promise<void> {
  try {
    const sql = await db();
    if (!sql) return;
    await sql`DELETE FROM sales_target_provider_health WHERE provider = ${provider}`;
  } catch {
    /* siehe persist(): best-effort */
  }
}
