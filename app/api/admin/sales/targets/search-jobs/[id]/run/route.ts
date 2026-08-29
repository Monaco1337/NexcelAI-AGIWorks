/**
 * Führt einen bereits erstellten Search-Job aus.
 *
 * POST /api/admin/sales/targets/search-jobs/[id]/run
 *
 * Wird vom Client (Area-Discovery-Progress) mit begrenzter Parallelität
 * aufgerufen, damit große Radien nicht in einer einzigen 60-Sekunden-
 * Serverless-Instanz gemacht werden müssen.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getSearchJob } from "@/lib/sales/targets/store";
import { runSearchJob } from "@/lib/sales/targets/pipeline";
import { toTargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const job = await getSearchJob(id);
    if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (job.status === "completed") {
      return NextResponse.json({ job, result: null, skipped: true, reason: "already-completed" });
    }
    if (job.status === "running") {
      return NextResponse.json({ job, result: null, skipped: true, reason: "already-running" });
    }
    const result = await runSearchJob(job);
    return NextResponse.json({ jobId: id, result });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json(err.toJson(), { status: err.httpStatus });
  }
}
