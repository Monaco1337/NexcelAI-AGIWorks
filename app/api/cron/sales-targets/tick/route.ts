/**
 * Cron-Tick für den Zielkundenkatalog.
 *
 * Der Tick tut genau zwei Dinge und hält sich strikt an sein
 * Zeitbudget:
 *
 *   1. `ensure/resume` — existiert kein aktiver Katalog-Run, wird einer
 *      angelegt und die Segmente eingereiht. Existiert einer, passiert
 *      nichts weiter; hängengebliebene Segmente holt der Worker über
 *      den Lease-Timeout zurück.
 *   2. Ein Stück Arbeit abarbeiten und danach das Quality Gate prüfen.
 *
 * Ist der Katalog bereits veröffentlicht, kehrt der Tick sofort zurück
 * und verursacht keinen einzigen externen Aufruf.
 *
 * Zugang: `CRON_SECRET` als Bearer-Token — Vercel setzt es bei eigenen
 * Cron-Aufrufen automatisch — oder eine angemeldete Sitzung mit
 * `sales.manage` für manuelles Auslösen aus dem Admin. Kein
 * zusätzliches Auth-System.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorizeCronOrPermission } from "@/lib/auth/cron";
import {
  catalogStatus,
  ensureCatalogRun,
  maybePublishCatalog,
  runCatalogSegments,
} from "@/lib/sales/targets/catalog/runner";
import { NRW_SCOPE } from "@/lib/sales/targets/catalog/scope";
import { newCorrelationId, toTargetError } from "@/lib/sales/targets/errors";
import { evaluateRuntimeAcquisition } from "@/lib/sales/targets/coverage/runtimeController";
import {
  ensureCoveragePartitions,
  saveControllerSnapshot,
} from "@/lib/sales/targets/coverage/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const auth = await authorizeCronOrPermission(request, "sales.manage");
  if (!auth.ok) {
    return auth.response;
  }

  const params = request.nextUrl.searchParams;
  const scopeKey = params.get("scope") ?? NRW_SCOPE.key;
  // Gemessen liegt ein Segment bei rund 4–15 s inklusive Batch-Insert.
  // Das Zeitbudget bricht die Schleife ohnehin ab, bevor die Funktion
  // ihre Laufzeitgrenze erreicht — die Segmentzahl ist nur eine
  // Obergrenze für den Fall sehr schneller Antworten.
  const requestedSegments = clampInt(params.get("segments"), 24, 1, 60);
  // 180 s Arbeitsbudget plus maximal 75 s für ein bereits gestartetes
  // Segment bleiben sicher unter der 300-s-Laufzeitgrenze der Funktion.
  const budgetMs = clampInt(params.get("budgetMs"), 180_000, 5_000, 200_000);
  const correlationId = newCorrelationId("catalog-tick");
  const startedAt = Date.now();

  try {
    const control = await evaluateRuntimeAcquisition();
    await ensureCoveragePartitions(NRW_SCOPE);
    await saveControllerSnapshot({
      controllerKey: "sales-targets-default",
      controllerVersion: "v1",
      sequenceNo: Math.floor(Date.now() / 1000),
      observed: control.snapshot,
      decision: control.decision,
      correlationId,
    });
    if (control.decision.pauseDiscovery) {
      return NextResponse.json({
        correlationId,
        noOp: true,
        reason: control.decision.reasons,
        control,
        elapsedMs: Date.now() - startedAt,
      });
    }
    const maxSegments = Math.min(
      requestedSegments,
      Math.max(1, control.decision.requestedConcurrency * 6),
    );
    // Veröffentlicht und nichts mehr offen: nichts tun, keine externen
    // Aufrufe. Offene Segmente werden dagegen weiter abgearbeitet — die
    // Freigabe wartet nicht auf Vollständigkeit.
    const before = await catalogStatus(scopeKey);
    const openBefore = before.progress
      ? before.progress.queued + before.progress.running + before.progress.failed
      : 0;
    if (before.published && !before.run && openBefore === 0) {
      return NextResponse.json({
        correlationId,
        scope: scopeKey,
        action: "noop",
        publishState: "PUBLISHED",
        targetCount: before.published.targetCount,
        elapsedMs: Date.now() - startedAt,
      });
    }

    const ensured = await ensureCatalogRun(scopeKey, auth.actorId);
    const { outcomes, reclaimed } = await runCatalogSegments({
      areaScanId: ensured.run.id,
      maxSegments,
      budgetMs,
    });
    const publish = await maybePublishCatalog(ensured.run.id, auth.actorId);
    const after = await catalogStatus(scopeKey);

    return NextResponse.json({
      correlationId,
      scope: scopeKey,
      action: ensured.created ? "created" : "resumed",
      segmentsQueued: ensured.segmentsQueued,
      reclaimed,
      processed: outcomes.length,
      inserted: outcomes.reduce((n, o) => n + o.inserted, 0),
      duplicates: outcomes.reduce((n, o) => n + o.duplicates, 0),
      failures: outcomes
        .filter((o) => !o.ok)
        .map((o) => ({ segment: o.segment, error: o.error, providerLogs: o.providerLogs })),
      progress: after.progress,
      publish: { attempted: publish.attempted, published: publish.published, reason: publish.reason },
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
