/**
 * POST /api/diagnostics/start?analysisId=…
 *
 * Startet die zuvor reservierte Analyse. Wird typischerweise NACH den Uploads
 * aufgerufen.
 */

import { NextRequest, NextResponse } from "next/server";
import { analysisRepo } from "@/lib/diagnostics/db";
import { runAnalysisAsync } from "@/lib/diagnostics/services/analysisOrchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const analysisId = req.nextUrl.searchParams.get("analysisId");
  if (!analysisId)
    return NextResponse.json({ error: "Missing analysisId" }, { status: 400 });
  const a = analysisRepo.findById(analysisId);
  if (!a)
    return NextResponse.json(
      { error: "Analyse nicht gefunden" },
      { status: 404 },
    );
  if (a.status !== "queued") {
    return NextResponse.json(
      { error: `Analyse ist bereits ${a.status}` },
      { status: 409 },
    );
  }
  runAnalysisAsync(analysisId);
  return NextResponse.json({ ok: true, analysisId });
}
