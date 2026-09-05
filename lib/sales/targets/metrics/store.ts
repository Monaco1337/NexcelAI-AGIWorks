import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import { newTargetId } from "../model";
import { METRIC_DEFINITION_VERSION, type MetricEvent } from "./definitions";

export async function appendMetricEvent(event: MetricEvent): Promise<string | null> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const id = newTargetId("met");
  const rows = await sql<{ id: string }[]>`
    INSERT INTO sales_target_metric_events (
      id, metric_key, event_kind, target_id, coverage_run_id, value, unit, dimensions,
      source_system, deduplication_key, occurred_at, correlation_id, provenance
    ) VALUES (
      ${id}, ${event.eventType}, 'increment', ${event.targetId ?? null},
      COALESCE(
        ${event.coverageRunId ?? null},
        (
          SELECT cr.id
          FROM sales_target_coverage_runs cr
          WHERE cr.search_job_id = COALESCE(
            (
              SELECT target.origin_search_job_id
              FROM sales_target_companies target
              WHERE target.id = ${event.targetId ?? null}
            ),
            (
              SELECT observation.search_job_id
              FROM sales_target_raw_observations observation
              WHERE observation.id = ${event.observationId ?? null}
            )
          )
          ORDER BY cr.created_at DESC
          LIMIT 1
        )
      ), ${event.value},
      'count', ${sql.json(jsonParam({
        ...event.dimensions,
        provider: event.provider ?? null,
        observationId: event.observationId ?? null,
        partitionId: event.partitionId ?? null,
      }))}, 'revenue_intelligence',
      ${event.idempotencyKey}, ${event.occurredAt}, ${event.correlationId ?? null},
      ${sql.json(jsonParam({ definitionVersion: event.definitionVersion }))}
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  return rows[0]?.id ?? null;
}

export async function rollupMetrics(
  windowStart: string,
  windowEnd: string,
  grain: "hour" | "day",
): Promise<number> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const rows = await sql<{ id: string }[]>`
    WITH bucketed AS (
      SELECT
        metric_key,
        CASE
          WHEN ${grain} = 'day' THEN date_trunc('day', occurred_at)
          ELSE date_trunc('hour', occurred_at)
        END AS bucket_start,
        value, unit, recorded_at
      FROM sales_target_metric_events
      WHERE occurred_at >= ${windowStart} AND occurred_at < ${windowEnd}
    )
    INSERT INTO sales_target_metric_rollups (
      id, metric_key, grain, window_start, window_end, dimension_key,
      dimensions, event_count, value_sum, value_min, value_max, value_avg,
      unit, is_complete, source_watermark
    )
    SELECT
      'roll_' || md5(metric_key || ${grain} || bucket_start::text),
      metric_key, ${grain}, bucket_start,
      bucket_start + CASE WHEN ${grain} = 'day' THEN INTERVAL '1 day' ELSE INTERVAL '1 hour' END,
      '*', '{}'::jsonb,
      COUNT(*), SUM(value), MIN(value), MAX(value), AVG(value), MAX(unit),
      TRUE, MAX(recorded_at)
    FROM bucketed
    GROUP BY metric_key, bucket_start
    ON CONFLICT (metric_key, grain, window_start, window_end, dimension_key)
    DO UPDATE SET
      event_count = EXCLUDED.event_count,
      value_sum = EXCLUDED.value_sum,
      value_min = EXCLUDED.value_min,
      value_max = EXCLUDED.value_max,
      value_avg = EXCLUDED.value_avg,
      unit = EXCLUDED.unit,
      is_complete = EXCLUDED.is_complete,
      source_watermark = EXCLUDED.source_watermark,
      revision = sales_target_metric_rollups.revision + 1,
      computed_at = NOW(),
      updated_at = NOW()
    RETURNING id
  `;
  return rows.length;
}

export async function getRollingFunnel(hours = 24): Promise<Record<string, number>> {
  const sql = await db();
  if (!sql) return {};
  const rows = await sql<{ metric_key: string; total: string | number }[]>`
    SELECT metric_key, COALESCE(SUM(value), 0) AS total
    FROM sales_target_metric_events
    WHERE occurred_at >= NOW() - (${Math.max(1, Math.min(24 * 30, hours))} * INTERVAL '1 hour')
    GROUP BY metric_key
  `;
  return Object.fromEntries(rows.map((row) => [row.metric_key, Number(row.total)]));
}

export function createMetricEvent(
  event: Omit<MetricEvent, "definitionVersion">,
): MetricEvent {
  return { ...event, definitionVersion: METRIC_DEFINITION_VERSION };
}

