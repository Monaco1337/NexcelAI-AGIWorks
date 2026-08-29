/**
 * Katalog-Status und manueller Anstoß.
 *
 * GET  → Zustand des Katalogs (Fortschritt, Publish-State, Quality-Gate).
 *        Reine Lesefunktion, keine externen Aufrufe.
 * POST → `ensure`: legt den Katalog-Run an bzw. nimmt ihn wieder auf.
 *        Führt selbst keine Discovery aus — das macht der Worker.
 *
 * Der Browser braucht diese Route nicht, um den Katalog aufzubauen; sie
 * existiert für Transparenz im Admin und für einen manuellen Neustart.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { catalogStatus, ensureCatalogRun } from "@/lib/sales/targets/catalog/runner";
import { NRW_SCOPE } from "@/lib/sales/targets/catalog/scope";
import { toTargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const scopeKey = request.nextUrl.searchParams.get("scope") ?? NRW_SCOPE.key;
  try {
    const status = await catalogStatus(scopeKey);
    return NextResponse.json(serializeStatus(status));
  } catch (err) {
    const te = toTargetError(err);
    return NextResponse.json({ error: te.code, message: te.message }, { status: te.httpStatus });
  }
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const scopeKey = request.nextUrl.searchParams.get("scope") ?? NRW_SCOPE.key;
  try {
    const ensured = await ensureCatalogRun(scopeKey, gate.auth.userId);
    const status = await catalogStatus(scopeKey);
    return NextResponse.json({
      created: ensured.created,
      segmentsQueued: ensured.segmentsQueued,
      ...serializeStatus(status),
    });
  } catch (err) {
    const te = toTargetError(err);
    return NextResponse.json({ error: te.code, message: te.message }, { status: te.httpStatus });
  }
}

function serializeStatus(status: Awaited<ReturnType<typeof catalogStatus>>) {
  const { scope, run, published, progress } = status;
  const active = published ?? run;
  return {
    scope: scope ? { key: scope.key, label: scope.label, bbox: scope.bbox } : null,
    publishState: active?.publishState ?? "NONE",
    publishedAt: published?.publishedAt ?? null,
    targetCount: published?.targetCount ?? run?.targetCount ?? 0,
    discoveredCount: run?.discoveredCount ?? published?.discoveredCount ?? 0,
    qualityReport: active?.qualityReport ?? null,
    firstError: run?.firstError ?? null,
    progress: progress
      ? {
          total: progress.total,
          done: progress.completed + progress.failed,
          queued: progress.queued,
          running: progress.running,
          failed: progress.failed,
          pct: progress.total > 0 ? Math.round(((progress.completed + progress.failed) / progress.total) * 100) : 0,
        }
      : null,
  };
}
