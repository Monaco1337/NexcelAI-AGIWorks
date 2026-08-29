/**
 * Nach Server-Neustart oder wenn ein anderer Client die Session
 * unterbrochen hat: welche Discovery-Jobs sind noch offen?
 *
 * GET /api/admin/sales/targets/pending-jobs?city=Unna
 *
 * Rückgabe:
 *   {
 *     search: [{ id, city, radiusKm, industries, createdAt }],
 *     enrichmentQueued: number
 *   }
 *
 * Der Client (Zielkunden-Cockpit) nimmt die Search-Jobs beim Öffnen
 * der Ansicht wieder auf und pumpt sie mit begrenzter Parallelität ab,
 * damit die Discovery genau dort weitermacht, wo sie unterbrochen wurde.
 */

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/pg";
import { authorize } from "@/lib/auth/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const sql = await db();
  if (!sql) return NextResponse.json({ search: [], enrichmentQueued: 0 });
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? null;

  const search = await sql<Record<string, unknown>[]>`
    SELECT id, city, radius_km, industries, created_at, discovered_count, status
    FROM sales_target_search_jobs
    WHERE status IN ('queued','running')
      AND (${city ?? null}::text IS NULL OR lower(city) = lower(${city ?? null}))
    ORDER BY created_at ASC
    LIMIT 200
  `;

  const enrich = await sql<Record<string, unknown>[]>`
    SELECT COUNT(*)::int AS c FROM sales_target_enrichment_jobs WHERE status = 'queued'
  `;

  return NextResponse.json({
    search: search.map((r) => ({
      id: r.id as string,
      city: (r.city as string | null) ?? null,
      radiusKm: Number(r.radius_km ?? 0),
      industries: (r.industries as string[] | null) ?? [],
      createdAt: new Date(r.created_at as string).toISOString(),
      discoveredCount: Number(r.discovered_count ?? 0),
      status: r.status as string,
    })),
    enrichmentQueued: Number(enrich[0]?.c ?? 0),
  });
}
