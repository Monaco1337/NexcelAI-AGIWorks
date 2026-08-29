/**
 * Search-Jobs (Discovery-Runs).
 *
 * GET  /api/admin/sales/targets/search-jobs — Liste
 * POST /api/admin/sales/targets/search-jobs — neuen Job starten und synchron ausführen
 *
 * Für die Erstversion führen wir die Discovery synchron im HTTP-Handler
 * aus, damit die UI sofort Ergebnisse zeigt. Für sehr große Radien /
 * viele Provider kann später ein Hintergrund-Worker angeschlossen werden.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import {
  createSearchJob,
  listSearchJobs,
  type CreateSearchJobInput,
} from "@/lib/sales/targets/store";
import { runSearchJob } from "@/lib/sales/targets/pipeline";
import { providerStatus } from "@/lib/sales/targets/providers/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const jobs = await listSearchJobs();
  return NextResponse.json({ jobs, providers: providerStatus() });
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  let body: CreateSearchJobInput;
  try {
    body = (await request.json()) as CreateSearchJobInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.city && !body.centerLat) {
    return NextResponse.json({ error: "location_required" }, { status: 400 });
  }

  const job = await createSearchJob({ ...body, createdBy: gate.auth.userId });
  try {
    const result = await runSearchJob(job);
    return NextResponse.json({ job, result });
  } catch (error) {
    console.error("[TARGETS] search-job failed:", error);
    return NextResponse.json({ error: "search_failed", detail: (error as Error).message }, { status: 500 });
  }
}
