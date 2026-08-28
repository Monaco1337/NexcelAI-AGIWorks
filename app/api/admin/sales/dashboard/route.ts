/**
 * Vertriebs-Dashboard.
 *
 * Antwortet mit den vier Kernblöcken:
 *   heute / überfällig / pipeline / commercial
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";
import { listOpenFollowups } from "@/lib/sales/proposalsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StatusCount { status: string; count: string | number; }
interface BrandCount { brand_context: string; count: string | number; }
interface AgingBucket { bucket: string; count: string | number; }

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const sql = await db();
  if (!sql) return NextResponse.json({ enabled: false }, { status: 503 });

  const [companies, opportunities, dueToday, overdue, valueRow, pipelineRow, aging, brand, ai, followups, todayList, overdueList] =
    await Promise.all([
      sql<{ count: string }[]>`SELECT COUNT(*) FROM sales_companies WHERE deleted_at IS NULL`,
      sql<StatusCount[]>`
        SELECT status, COUNT(*) FROM sales_opportunities
        WHERE deleted_at IS NULL GROUP BY status`,
      sql<{ count: string }[]>`
        SELECT COUNT(*) FROM sales_companies
        WHERE deleted_at IS NULL AND next_action_due_at::date = CURRENT_DATE`,
      sql<{ count: string }[]>`
        SELECT COUNT(*) FROM sales_companies
        WHERE deleted_at IS NULL AND next_action_due_at < NOW()
          AND next_action_due_at::date < CURRENT_DATE`,
      sql<{ sum_expected: string; sum_proposal: string }[]>`
        SELECT
          COALESCE(SUM(expected_value_cents), 0) AS sum_expected,
          COALESCE(SUM(proposal_value_cents), 0) AS sum_proposal
        FROM sales_opportunities
        WHERE deleted_at IS NULL AND status NOT IN ('gewonnen','verloren','zurueckgestellt')`,
      sql<{ won: string; lost: string; deferred: string }[]>`
        SELECT
          SUM(CASE WHEN status = 'gewonnen' THEN 1 ELSE 0 END) AS won,
          SUM(CASE WHEN status = 'verloren' THEN 1 ELSE 0 END) AS lost,
          SUM(CASE WHEN status = 'zurueckgestellt' THEN 1 ELSE 0 END) AS deferred
        FROM sales_opportunities WHERE deleted_at IS NULL`,
      sql<AgingBucket[]>`
        SELECT
          CASE
            WHEN age(NOW(), created_at) < INTERVAL '7 days' THEN 'week'
            WHEN age(NOW(), created_at) < INTERVAL '30 days' THEN 'month'
            WHEN age(NOW(), created_at) < INTERVAL '90 days' THEN 'quarter'
            ELSE 'older'
          END AS bucket,
          COUNT(*)
        FROM sales_opportunities
        WHERE deleted_at IS NULL AND status NOT IN ('gewonnen','verloren','zurueckgestellt')
        GROUP BY bucket`,
      sql<BrandCount[]>`
        SELECT brand_context, COUNT(*) FROM sales_opportunities
        WHERE deleted_at IS NULL GROUP BY brand_context`,
      sql<{ count: string }[]>`SELECT COUNT(*) FROM sales_ai_runs WHERE status = 'REVIEW_REQUIRED'`,
      listOpenFollowups(),
      sql<{ id: string; name: string; next_action: string | null; next_action_due_at: Date }[]>`
        SELECT id, name, next_action, next_action_due_at
        FROM sales_companies
        WHERE deleted_at IS NULL AND next_action_due_at::date = CURRENT_DATE
        ORDER BY next_action_due_at ASC LIMIT 30`,
      sql<{ id: string; name: string; next_action: string | null; next_action_due_at: Date }[]>`
        SELECT id, name, next_action, next_action_due_at
        FROM sales_companies
        WHERE deleted_at IS NULL AND next_action_due_at < NOW() AND next_action_due_at::date < CURRENT_DATE
        ORDER BY next_action_due_at ASC LIMIT 30`,
    ]);

  return NextResponse.json({
    counts: {
      companies: Number(companies[0]?.count ?? 0),
      dueToday: Number(dueToday[0]?.count ?? 0),
      overdue: Number(overdue[0]?.count ?? 0),
      aiReviewRequired: Number(ai[0]?.count ?? 0),
    },
    pipelineByStatus: opportunities.map((r) => ({ status: r.status, count: Number(r.count) })),
    pipelineByBrand: brand.map((r) => ({ brand: r.brand_context, count: Number(r.count) })),
    aging: aging.map((r) => ({ bucket: r.bucket, count: Number(r.count) })),
    commercial: {
      expectedCents: Number(valueRow[0]?.sum_expected ?? 0),
      proposalCents: Number(valueRow[0]?.sum_proposal ?? 0),
      won: Number(pipelineRow[0]?.won ?? 0),
      lost: Number(pipelineRow[0]?.lost ?? 0),
      deferred: Number(pipelineRow[0]?.deferred ?? 0),
    },
    today: todayList.map((c) => ({
      id: c.id,
      name: c.name,
      nextAction: c.next_action,
      dueAt: c.next_action_due_at.toISOString(),
    })),
    overdueList: overdueList.map((c) => ({
      id: c.id,
      name: c.name,
      nextAction: c.next_action,
      dueAt: c.next_action_due_at.toISOString(),
    })),
    followups,
  });
}
