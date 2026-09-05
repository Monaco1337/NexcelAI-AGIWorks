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
import { runEnrichmentWorker } from "@/lib/sales/targets/jobs/workerRunner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const params = request.nextUrl.searchParams;
  const batch = Math.max(1, Math.min(20, Number.parseInt(params.get("batch") ?? "5", 10) || 5));
  const maxMs = Math.max(5_000, Math.min(50_000, Number.parseInt(params.get("maxMs") ?? "25000", 10) || 25_000));

  return NextResponse.json(await runEnrichmentWorker({ batch, maxMs }));
}
