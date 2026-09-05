import { db } from "@/lib/pg";
import { appendMetricEvent, createMetricEvent } from "../metrics/store";
import type { TargetMilestone } from "../metrics/definitions";
import { attributeOutcome, type AcquisitionTouch } from "./attribution";

export async function recordAttributedOutcome(input: {
  eventType: Extract<TargetMilestone, "CRM_CONVERTED" | "OPPORTUNITY_WON">;
  targetId?: string | null;
  salesCompanyId?: string | null;
  salesOpportunityId?: string | null;
  occurredAt?: string;
  valueCents?: number | null;
  correlationId?: string | null;
}): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  let targetId = input.targetId ?? null;
  if (!targetId && input.salesCompanyId) {
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM sales_target_companies
      WHERE linked_sales_company_id = ${input.salesCompanyId}
      ORDER BY updated_at DESC LIMIT 1
    `;
    targetId = rows[0]?.id ?? null;
  }
  if (!targetId && input.salesOpportunityId) {
    const rows = await sql<{ id: string }[]>`
      SELECT t.id
      FROM sales_opportunities o
      JOIN sales_target_companies t ON t.linked_sales_company_id = o.company_id
      WHERE o.id = ${input.salesOpportunityId}
      ORDER BY t.updated_at DESC LIMIT 1
    `;
    targetId = rows[0]?.id ?? null;
  }
  if (!targetId) return false;

  const touches = await sql<AcquisitionTouch[]>`
    SELECT
      o.provider,
      o.id AS observation_id,
      o.observed_at::text,
      COALESCE(cost.total_cost_cents, 0)::int AS cost_cents
    FROM sales_target_raw_observations o
    LEFT JOIN LATERAL (
      SELECT SUM(COALESCE(cost_cents, 0)) AS total_cost_cents
      FROM sales_target_provider_requests p
      WHERE p.target_id = o.target_id AND p.provider = o.provider
    ) cost ON TRUE
    WHERE o.target_id = ${targetId}
    ORDER BY o.observed_at, o.id
  `;
  const attribution = attributeOutcome(touches);
  const sourceId = input.salesOpportunityId ?? input.salesCompanyId ?? targetId;
  return Boolean(await appendMetricEvent(createMetricEvent({
    idempotencyKey: `${input.eventType}:${sourceId}`,
    eventType: input.eventType,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    targetId,
    correlationId: input.correlationId,
    dimensions: {
      firstSource: attribution.firstSource,
      contributingSources: attribution.contributingSources.join(","),
      acquisitionCostCents: attribution.totalAcquisitionCostCents,
      salesCompanyId: input.salesCompanyId ?? null,
      salesOpportunityId: input.salesOpportunityId ?? null,
      valueCents: input.valueCents ?? null,
    },
    value: 1,
  })));
}

