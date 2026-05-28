/**
 * GET /api/diagnostics/result/[id]
 *
 * Liefert das vollständige Result-DTO. Funktioniert auch für laufende Analysen
 * (dann sind scores/recommendations leer oder nur Teilstand).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  analysisRepo,
  eventRepo,
  findingRepo,
  leadRepo,
  recommendationRepo,
  scoresRepo,
  uploadRepo,
} from "@/lib/diagnostics/db";
import type { AnalysisResultDTO } from "@/lib/diagnostics/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const analysis = analysisRepo.findById(params.id);
  if (!analysis) {
    return NextResponse.json(
      { error: "Analyse nicht gefunden" },
      { status: 404 },
    );
  }

  const scores = scoresRepo.get(params.id);
  const findings = findingRepo.listByAnalysis(params.id);
  const recommendations = recommendationRepo.listByAnalysis(params.id);
  const uploads = uploadRepo.listByAnalysis(params.id);
  const lead = leadRepo.get(params.id);
  const events = eventRepo.listByAnalysis(params.id);

  const result: AnalysisResultDTO = {
    analysis,
    scores,
    findings,
    recommendations,
    uploads,
    leadClassification: lead,
    events,
    webMeta: null,
  };

  return NextResponse.json(result);
}
