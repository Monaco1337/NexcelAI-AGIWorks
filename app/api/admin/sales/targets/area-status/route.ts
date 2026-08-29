/**
 * Live-Status mehrerer Search-Jobs (Area-Discovery-Progress).
 *
 * GET /api/admin/sales/targets/area-status?ids=job1,job2,…
 *
 * Rückgabe:
 *   { jobs: [{ id, status, discoveredCount, radiusKm, city, industries, startedAt, finishedAt, error }],
 *     totals: { queued, running, completed, failed, discovered } }
 */

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/pg";
import { authorize } from "@/lib/auth/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const raw = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ jobs: [], totals: { queued: 0, running: 0, completed: 0, failed: 0, discovered: 0 } });
  const sql = await db();
  if (!sql) return NextResponse.json({ jobs: [], totals: { queued: 0, running: 0, completed: 0, failed: 0, discovered: 0 } });

  const rows = await sql<Record<string, unknown>[]>`
    SELECT id, status, discovered_count, radius_km, city, industries, started_at, finished_at, error, actual_cost_cents
    FROM sales_target_search_jobs
    WHERE id = ANY(${ids}::text[])
    ORDER BY created_at ASC
  `;
  const jobs = rows.map((r) => ({
    id: r.id as string,
    status: r.status as string,
    discoveredCount: Number(r.discovered_count ?? 0),
    radiusKm: Number(r.radius_km ?? 0),
    city: (r.city as string | null) ?? null,
    industries: (r.industries as string[] | null) ?? [],
    startedAt: r.started_at ? new Date(r.started_at as string).toISOString() : null,
    finishedAt: r.finished_at ? new Date(r.finished_at as string).toISOString() : null,
    error: (r.error as string | null) ?? null,
    actualCostCents: Number(r.actual_cost_cents ?? 0),
  }));
  const totals = jobs.reduce(
    (acc, j) => {
      if (j.status === "queued") acc.queued++;
      else if (j.status === "running") acc.running++;
      else if (j.status === "completed") acc.completed++;
      else if (j.status === "failed") acc.failed++;
      acc.discovered += j.discoveredCount;
      acc.costCents += j.actualCostCents;
      return acc;
    },
    { queued: 0, running: 0, completed: 0, failed: 0, discovered: 0, costCents: 0 }
  );
  return NextResponse.json({ jobs, totals });
}
