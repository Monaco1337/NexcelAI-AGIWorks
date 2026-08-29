/**
 * Enrichment-Worker (Client-getriggerter Batch-Runner).
 *
 * POST /api/admin/sales/targets/enrichment-worker?batch=5&maxMs=25000
 *
 * Nimmt bis zu `batch` queued Enrichment-Jobs aus der DB, führt die
 * jeweilige Phase aus (`processEnrichmentPhase`) und markiert sie
 * anschließend als done/failed. Cutoff über `maxMs`, damit die
 * serverless-60s-Grenze nie erreicht wird.
 *
 * Der Client (Zielkunden-Cockpit) pollt diesen Endpoint alle paar
 * Sekunden, während eine Area-Discovery läuft und danach noch so lange,
 * bis keine queued-Jobs mehr existieren — reine Frontend-Choreografie,
 * kein Worker-Prozess nötig.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import {
  completeEnrichmentJob,
  enqueueEnrichment,
  failEnrichmentJob,
  findTargetById,
  takeNextEnrichmentJob,
} from "@/lib/sales/targets/store";
import { processEnrichmentPhase } from "@/lib/sales/targets/pipeline";
import { newCorrelationId } from "@/lib/sales/targets/errors";

// Standard-Kaskade nach abgeschlossenen Phasen — nur wenn kein
// explizites `followupPhases` vorhanden ist. Das entspricht der
// Reihenfolge, in der `runFullEnrichment` die Phasen sonst
// synchron durchläuft.
const DEFAULT_FOLLOWUPS: Record<string, string[]> = {
  website_contact: ["website_audit"],
  website_audit: ["software_opportunities"],
  software_opportunities: ["lead_score"],
  lead_score: ["sales_brief"],
  sales_brief: [],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const params = request.nextUrl.searchParams;
  const batch = Math.max(1, Math.min(20, Number.parseInt(params.get("batch") ?? "5", 10) || 5));
  const maxMs = Math.max(5_000, Math.min(50_000, Number.parseInt(params.get("maxMs") ?? "25000", 10) || 25_000));

  const correlationId = newCorrelationId("worker");
  const startedAt = Date.now();
  const outcomes: Array<{
    jobId: string;
    targetId: string;
    phase: string;
    success: boolean;
    error?: string;
    durationMs: number;
  }> = [];

  for (let i = 0; i < batch; i++) {
    if (Date.now() - startedAt > maxMs) break;
    const job = await takeNextEnrichmentJob();
    if (!job) break;
    const target = await findTargetById(job.targetId);
    if (!target) {
      await failEnrichmentJob(job.id, "Zielkunde gelöscht");
      outcomes.push({ jobId: job.id, targetId: job.targetId, phase: job.phase, success: false, error: "target_missing", durationMs: 0 });
      continue;
    }
    const phaseStart = Date.now();
    try {
      const result = await processEnrichmentPhase(target, job.phase);
      if (result.success) {
        await completeEnrichmentJob(job.id);
        // Folgephasen einreihen — entweder explizit vom Handler
        // gemeldet oder aus der Default-Kaskade.
        const followups =
          result.followupPhases && result.followupPhases.length > 0
            ? result.followupPhases
            : DEFAULT_FOLLOWUPS[job.phase] ?? [];
        for (const next of followups) {
          await enqueueEnrichment(job.targetId, next as never, { priority: 100 });
        }
      } else {
        await failEnrichmentJob(job.id, result.note ?? "phase_failed");
      }
      outcomes.push({
        jobId: job.id,
        targetId: job.targetId,
        phase: job.phase,
        success: result.success,
        error: result.note,
        durationMs: Date.now() - phaseStart,
      });
    } catch (err) {
      const msg = (err as Error).message ?? "worker_error";
      await failEnrichmentJob(job.id, msg);
      outcomes.push({
        jobId: job.id,
        targetId: job.targetId,
        phase: job.phase,
        success: false,
        error: msg,
        durationMs: Date.now() - phaseStart,
      });
    }
  }

  return NextResponse.json({
    correlationId,
    processed: outcomes.length,
    outcomes,
    elapsedMs: Date.now() - startedAt,
  });
}
