/**
 * Discovery-Worker.
 *
 * Schwester-Route zu `enrichment-worker`: leased eine begrenzte Anzahl
 * Katalog-Segmente aus `sales_target_search_jobs`, führt sie aus und
 * schreibt die Ergebnisse per Batch-Upsert nach PostgreSQL. Läuft
 * strikt innerhalb eines Zeitbudgets und ist jederzeit abbrechbar —
 * abgebrochene Segmente fallen über den Lease-Timeout zurück in die
 * Queue.
 *
 * Aufgerufen vom Cron-Tick. Für den Katalogaufbau ist kein geöffneter
 * Browser nötig.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { maybePublishCatalog, runCatalogSegments } from "@/lib/sales/targets/catalog/runner";
import { findActiveCatalogRun } from "@/lib/sales/targets/catalog/catalogStore";
import { NRW_SCOPE } from "@/lib/sales/targets/catalog/scope";
import { newCorrelationId, toTargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  return runWorker(request, gate.auth.userId);
}

async function runWorker(request: NextRequest, actorId: string | null) {
  const params = request.nextUrl.searchParams;
  const scopeKey = params.get("scope") ?? NRW_SCOPE.key;
  const maxSegments = clampInt(params.get("segments"), 3, 1, 20);
  // 40 s Arbeitsbudget plus maximal 75 s für ein laufendes Segment
  // bleiben unter der 120-s-Laufzeitgrenze.
  const budgetMs = clampInt(params.get("budgetMs"), 40_000, 5_000, 40_000);
  const correlationId = newCorrelationId("discovery-worker");
  const startedAt = Date.now();

  try {
    const run = await findActiveCatalogRun(scopeKey);
    const { outcomes, reclaimed } = await runCatalogSegments({
      areaScanId: run?.id ?? null,
      maxSegments,
      budgetMs,
    });

    // Wenn nichts mehr offen ist, Quality Gate prüfen und ggf. publishen.
    let publish = null as Awaited<ReturnType<typeof maybePublishCatalog>> | null;
    if (run) publish = await maybePublishCatalog(run.id, actorId);

    return NextResponse.json({
      correlationId,
      scope: scopeKey,
      reclaimed,
      processed: outcomes.length,
      inserted: outcomes.reduce((n, o) => n + o.inserted, 0),
      duplicates: outcomes.reduce((n, o) => n + o.duplicates, 0),
      outcomes,
      publish: publish
        ? { attempted: publish.attempted, published: publish.published, reason: publish.reason }
        : null,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (err) {
    const te = toTargetError(err);
    return NextResponse.json(
      { correlationId, error: te.code, message: te.message },
      { status: te.httpStatus }
    );
  }
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
