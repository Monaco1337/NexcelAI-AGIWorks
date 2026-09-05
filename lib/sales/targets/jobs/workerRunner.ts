import {
  completeEnrichmentJob,
  enqueueEnrichment,
  failEnrichmentJob,
  findTargetById,
  heartbeatEnrichmentJob,
  listContacts,
  reclaimExpiredEnrichmentJobs,
  takeNextEnrichmentJob,
} from "../store";
import { processEnrichmentPhase } from "../pipeline";
import { newCorrelationId } from "../errors";
import { resolveFollowupPhases } from "./phaseGraph";
import { markPhaseFailed, markPhaseRunning, markPhaseSkipped, markPhaseSucceeded } from "./phaseState";
import { gateForPhase } from "../enrichmentGate";
import type { EnrichmentPhase } from "../model";

export interface EnrichmentWorkerOptions {
  batch: number;
  maxMs: number;
  workerId?: string;
}

export async function runEnrichmentWorker(options: EnrichmentWorkerOptions) {
  const correlationId = options.workerId ?? newCorrelationId("worker");
  const startedAt = Date.now();
  const reclaimed = await reclaimExpiredEnrichmentJobs();
  const outcomes: Array<{
    jobId: string;
    targetId: string;
    phase: string;
    success: boolean;
    error?: string;
    durationMs: number;
  }> = [];

  for (let index = 0; index < options.batch; index++) {
    if (Date.now() - startedAt > options.maxMs) break;
    const job = await takeNextEnrichmentJob({ workerId: correlationId });
    if (!job) break;
    await markPhaseRunning({ targetId: job.targetId, phase: job.phase, jobId: job.id });
    const target = await findTargetById(job.targetId);
    if (!target) {
      await failEnrichmentJob(job.id, "Zielkunde gelöscht", job.workerToken);
      await markPhaseFailed({
        targetId: job.targetId,
        phase: job.phase,
        jobId: job.id,
        error: "Zielkunde gelöscht",
        errorCode: "TARGET_MISSING",
      });
      outcomes.push({
        jobId: job.id,
        targetId: job.targetId,
        phase: job.phase,
        success: false,
        error: "target_missing",
        durationMs: 0,
      });
      continue;
    }
    if (isProgressiveGatePhase(job.phase)) {
      const contacts = await listContacts(target.id);
      const gate = gateForPhase(job.phase, { target, contacts });
      if (!gate.proceed) {
        const completed = await completeEnrichmentJob(job.id, job.workerToken);
        if (completed) {
          await markPhaseSkipped({
            targetId: target.id,
            phase: job.phase,
            jobId: job.id,
            reason: gate.reason,
            state: { qualificationScore: gate.qualificationScore },
          });
          if (!target.doNotContact) {
            for (const next of resolveFollowupPhases(job.phase, undefined)) {
              await enqueueEnrichment(job.targetId, next, { priority: job.priority });
            }
          }
        }
        outcomes.push({
          jobId: job.id,
          targetId: job.targetId,
          phase: job.phase,
          success: completed,
          error: `SKIPPED: ${gate.reason}`,
          durationMs: 0,
        });
        continue;
      }
    }

    const phaseStart = Date.now();
    const heartbeat = job.workerToken
      ? setInterval(() => {
          void heartbeatEnrichmentJob(job.id, job.workerToken as string).catch(() => {
            // Completion/failure remains lease-token guarded; a transient
            // heartbeat error must not create an unhandled rejection.
          });
        }, 30_000)
      : null;
    try {
      const result = await processEnrichmentPhase(target, job.phase);
      if (result.success) {
        const completed = await completeEnrichmentJob(job.id, job.workerToken);
        if (!completed) {
          await markPhaseFailed({
            targetId: job.targetId,
            phase: job.phase,
            jobId: job.id,
            error: "stale_worker_lease",
            errorCode: "STALE_WORKER_LEASE",
          });
          outcomes.push({
            jobId: job.id,
            targetId: job.targetId,
            phase: job.phase,
            success: false,
            error: "stale_worker_lease",
            durationMs: Date.now() - phaseStart,
          });
          continue;
        }
        await markPhaseSucceeded({
          targetId: job.targetId,
          phase: job.phase,
          jobId: job.id,
          staleAfter: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        });
        for (const next of resolveFollowupPhases(job.phase, result.followupPhases)) {
          await enqueueEnrichment(job.targetId, next, { priority: job.priority });
        }
      } else {
        await failEnrichmentJob(job.id, result.note ?? "phase_failed", job.workerToken);
        await markPhaseFailed({
          targetId: job.targetId,
          phase: job.phase,
          jobId: job.id,
          error: result.note ?? "phase_failed",
        });
      }
      outcomes.push({
        jobId: job.id,
        targetId: job.targetId,
        phase: job.phase,
        success: result.success,
        error: result.note,
        durationMs: Date.now() - phaseStart,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "worker_error";
      await failEnrichmentJob(job.id, message, job.workerToken);
      await markPhaseFailed({
        targetId: job.targetId,
        phase: job.phase,
        jobId: job.id,
        error: message,
      });
      outcomes.push({
        jobId: job.id,
        targetId: job.targetId,
        phase: job.phase,
        success: false,
        error: message,
        durationMs: Date.now() - phaseStart,
      });
    } finally {
      if (heartbeat) clearInterval(heartbeat);
    }
  }

  return {
    correlationId,
    reclaimed,
    processed: outcomes.length,
    outcomes,
    elapsedMs: Date.now() - startedAt,
  };
}

function isProgressiveGatePhase(phase: EnrichmentPhase): boolean {
  return phase === "website_audit" ||
    phase === "financial_signals" ||
    phase === "decision_makers";
}

