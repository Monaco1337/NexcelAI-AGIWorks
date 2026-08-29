/**
 * Live-Zähler für die Zielkunden-Ansicht.
 *
 * GET /api/admin/sales/targets/count?centerLat=…&centerLng=…&centerRadiusKm=…&industry=…
 *
 * Sehr günstig gegenüber `/api/admin/sales/targets` — liefert nur die
 * KPIs, die der Header und der Live-Counter braucht. Der Client pollt
 * diesen Endpoint jede Sekunde, während eine Area-Discovery läuft.
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
  if (!sql) return NextResponse.json({ total: 0, hot: 0, withBrief: 0, withDm: 0, enrichmentQueued: 0 });

  const params = request.nextUrl.searchParams;
  const centerLat = optNum(params, "centerLat");
  const centerLng = optNum(params, "centerLng");
  const centerRadiusKm = optNum(params, "centerRadiusKm");
  const industries = multi(params, "industry");
  const includeChains = params.get("includeChains") === "1";

  // Bounding-Box-Vorfilter wie in listTargets — Index-freundlich.
  const useCenter =
    centerLat !== undefined &&
    centerLng !== undefined &&
    centerRadiusKm !== undefined &&
    Number.isFinite(centerLat) &&
    Number.isFinite(centerLng) &&
    Number.isFinite(centerRadiusKm) &&
    centerRadiusKm > 0;
  const latDelta = useCenter ? centerRadiusKm! / 111 : null;
  const lngDelta =
    useCenter && centerLat !== undefined
      ? centerRadiusKm! / (111 * Math.max(0.1, Math.cos((centerLat! * Math.PI) / 180)))
      : null;

  const rows = await sql<Record<string, unknown>[]>`
    WITH latest_score AS (
      SELECT DISTINCT ON (target_id) target_id, priority_class
      FROM sales_target_lead_scores
      WHERE is_current = TRUE
      ORDER BY target_id, (score_version = 'v2') DESC, calculated_at DESC
    ),
    latest_brief AS (
      SELECT DISTINCT ON (target_id) target_id
      FROM sales_target_sales_briefs
      WHERE is_current = TRUE
    ),
    dm_count AS (
      SELECT target_id, COUNT(*)::int AS dm_count
      FROM sales_target_decision_makers
      WHERE deleted_at IS NULL
      GROUP BY target_id
    ),
    filtered AS (
      SELECT t.id, ls.priority_class, sb.target_id AS has_brief, dm.dm_count
      FROM sales_target_companies t
      LEFT JOIN latest_score ls ON ls.target_id = t.id
      LEFT JOIN latest_brief sb ON sb.target_id = t.id
      LEFT JOIN dm_count dm ON dm.target_id = t.id
      WHERE t.deleted_at IS NULL
        /* Muss zur Liste passen, sonst weicht die Gesamtzahl von den
           angezeigten Karten ab. */
        AND (${includeChains} OR t.is_chain = FALSE)
        AND (${(industries ?? []).length === 0} OR t.industry = ANY(${industries ?? []}::text[]))
        AND (${useCenter ? 1 : 0}::int = 0 OR (
          t.latitude IS NOT NULL AND t.longitude IS NOT NULL
          AND t.latitude BETWEEN ${(centerLat ?? 0) - (latDelta ?? 0)} AND ${(centerLat ?? 0) + (latDelta ?? 0)}
          AND t.longitude BETWEEN ${(centerLng ?? 0) - (lngDelta ?? 0)} AND ${(centerLng ?? 0) + (lngDelta ?? 0)}
          AND (2 * 6371 * asin(sqrt(
            power(sin(radians((t.latitude - ${centerLat ?? 0}) / 2)), 2) +
            cos(radians(${centerLat ?? 0})) * cos(radians(t.latitude)) *
            power(sin(radians((t.longitude - ${centerLng ?? 0}) / 2)), 2)
          ))) <= ${centerRadiusKm ?? 0}
        ))
    )
    SELECT
      (SELECT COUNT(*)::int FROM filtered)                                         AS total,
      (SELECT COUNT(*)::int FROM filtered WHERE priority_class IN ('A+','A'))      AS hot,
      (SELECT COUNT(*)::int FROM filtered WHERE has_brief IS NOT NULL)             AS with_brief,
      (SELECT COUNT(*)::int FROM filtered WHERE dm_count > 0)                      AS with_dm,
      (SELECT COUNT(*)::int FROM sales_target_enrichment_jobs WHERE status='queued') AS enrichment_queued
  `;
  const r = rows[0] ?? {};
  return NextResponse.json({
    total: Number(r.total ?? 0),
    hot: Number(r.hot ?? 0),
    withBrief: Number(r.with_brief ?? 0),
    withDm: Number(r.with_dm ?? 0),
    enrichmentQueued: Number(r.enrichment_queued ?? 0),
  });
}

function optNum(params: URLSearchParams, key: string): number | undefined {
  const v = params.get(key);
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function multi(params: URLSearchParams, key: string): string[] | undefined {
  const values = params.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  return values.length > 0 ? values : undefined;
}
