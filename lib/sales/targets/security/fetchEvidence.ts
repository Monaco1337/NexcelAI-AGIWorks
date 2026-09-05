import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import type { SafeFetchResult } from "./safeFetch";
import { newTargetId } from "../model";

export async function recordWebsiteFetchEvidence(input: {
  targetId?: string | null;
  enrichmentJobId?: string | null;
  result: SafeFetchResult;
  correlationId?: string | null;
}): Promise<string | null> {
  const sql = await db();
  if (!sql) return null;
  const id = newTargetId("fetch");
  const completedAt = new Date().toISOString();
  const startedAt = new Date(Date.now() - input.result.latencyMs).toISOString();
  await sql`
    INSERT INTO sales_target_website_fetches (
      id, target_id, enrichment_job_id, requested_url, final_url, http_status,
      started_at, completed_at, duration_ms, response_headers, redirect_chain,
      content_type, content_length, content_hash, fetcher, fetcher_version,
      error_code, error, correlation_id, provenance
    ) VALUES (
      ${id}, ${input.targetId ?? null}, ${input.enrichmentJobId ?? null},
      ${input.result.url}, ${input.result.finalUrl}, ${input.result.status},
      ${startedAt}, ${completedAt}, ${input.result.latencyMs},
      ${sql.json(jsonParam(redactHeaders(input.result.headers)))},
      ${sql.json(jsonParam(input.result.redirectChain))},
      ${input.result.headers["content-type"] ?? null}, ${input.result.bytesRead},
      ${input.result.bodyText ? createHash("sha256").update(input.result.bodyText).digest("hex") : null},
      'safeFetch', 'v2', ${input.result.ok ? null : "FETCH_FAILED"},
      ${input.result.error ?? null}, ${input.correlationId ?? null},
      ${sql.json(jsonParam({ bounded: true, redirectsRevalidated: true }))}
    )
  `;
  return id;
}

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const allowed = ["content-type", "content-length", "cache-control", "etag", "last-modified"];
  return Object.fromEntries(allowed.filter((key) => headers[key]).map((key) => [key, headers[key]]));
}

