import { db, jsonParam } from "@/lib/pg";
import { newTargetId, type EnrichmentPhase } from "../model";

export async function markPhaseRunning(input: {
  targetId: string;
  phase: EnrichmentPhase;
  jobId: string;
}): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    INSERT INTO sales_target_phase_states (
      id, target_id, phase, status, last_job_id, last_started_at,
      attempt_count, state
    ) VALUES (
      ${newTargetId("phase")}, ${input.targetId}, ${input.phase}, 'running',
      ${input.jobId}, NOW(), 1, ${sql.json(jsonParam({}))}
    )
    ON CONFLICT (target_id, phase) DO UPDATE SET
      status = 'running',
      last_job_id = EXCLUDED.last_job_id,
      last_started_at = NOW(),
      attempt_count = sales_target_phase_states.attempt_count + 1,
      blocked_reason = NULL,
      last_error_code = NULL,
      last_error = NULL,
      version = sales_target_phase_states.version + 1,
      updated_at = NOW()
  `;
}

export async function markPhaseSucceeded(input: {
  targetId: string;
  phase: EnrichmentPhase;
  jobId: string;
  staleAfter?: string | null;
  state?: Record<string, unknown>;
}): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_phase_states
    SET status = 'succeeded',
        last_succeeded_at = NOW(),
        stale_after = ${input.staleAfter ?? null},
        consecutive_failures = 0,
        state = ${sql.json(jsonParam(input.state ?? {}))},
        version = version + 1,
        updated_at = NOW()
    WHERE target_id = ${input.targetId} AND phase = ${input.phase}
      AND last_job_id = ${input.jobId}
  `;
}

export async function markPhaseSkipped(input: {
  targetId: string;
  phase: EnrichmentPhase;
  jobId: string;
  reason: string;
  state?: Record<string, unknown>;
}): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_phase_states
    SET status = 'skipped',
        blocked_reason = ${input.reason.slice(0, 1000)},
        state = ${sql.json(jsonParam(input.state ?? {}))},
        consecutive_failures = 0,
        version = version + 1,
        updated_at = NOW()
    WHERE target_id = ${input.targetId} AND phase = ${input.phase}
      AND last_job_id = ${input.jobId}
  `;
}

export async function markPhaseFailed(input: {
  targetId: string;
  phase: EnrichmentPhase;
  jobId: string;
  error: string;
  errorCode?: string;
}): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_phase_states
    SET status = 'failed',
        last_failed_at = NOW(),
        next_eligible_at = NOW() + (
          INTERVAL '30 seconds' * POWER(2, LEAST(consecutive_failures + 1, 8))
        ),
        consecutive_failures = consecutive_failures + 1,
        last_error_code = ${input.errorCode ?? "PHASE_FAILED"},
        last_error = ${input.error.slice(0, 1000)},
        version = version + 1,
        updated_at = NOW()
    WHERE target_id = ${input.targetId} AND phase = ${input.phase}
      AND last_job_id = ${input.jobId}
  `;
}

