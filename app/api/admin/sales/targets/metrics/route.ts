/**
 * Data-Quality-Metriken für das Intelligence-Quality-Dashboard.
 *
 * GET /api/admin/sales/targets/metrics
 *
 * Sekundäre KPI-Ansicht. Kein neues, überladenes Dashboard — die
 * Metriken sollen in einer bestehenden UI-Ecke integriert werden.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/pg";
import { authorize } from "@/lib/auth/authorize";
import {
  computeDataQualityMetrics,
  listReviewQueue,
} from "@/lib/sales/targets/hardening/storeAdditions";
import { allProviderHealth, hydrateProviderHealth } from "@/lib/sales/targets/providers/health";
import { getRollingFunnel } from "@/lib/sales/targets/metrics/store";
import { FUNNEL_DENOMINATORS, METRIC_DEFINITION_VERSION } from "@/lib/sales/targets/metrics/definitions";
import { getOperationalKpis } from "@/lib/sales/targets/metrics/operational";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  await hydrateProviderHealth();
  const [metrics, reviewItems, extras, rolling24h, operational] = await Promise.all([
    computeDataQualityMetrics(),
    listReviewQueue(500),
    fetchExtras(),
    getRollingFunnel(24),
    getOperationalKpis(24),
  ]);

  return NextResponse.json({
    metrics: {
      ...metrics,
      reviewQueueSize: reviewItems.length,
      goldenDatasetCount: extras.goldenDatasetCount,
      updatedAt: new Date().toISOString(),
    },
    providerHealth: allProviderHealth(),
    funnel: {
      definitionVersion: METRIC_DEFINITION_VERSION,
      windowHours: 24,
      values: rolling24h,
      definitions: FUNNEL_DENOMINATORS,
    },
    operational,
  });
}

async function fetchExtras(): Promise<{ goldenDatasetCount: number }> {
  const sql = await db();
  if (!sql) return { goldenDatasetCount: 0 };
  const rows = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM sales_target_companies
    WHERE is_golden_dataset = TRUE AND deleted_at IS NULL
  `;
  return { goldenDatasetCount: Number(rows[0]?.n ?? 0) };
}
