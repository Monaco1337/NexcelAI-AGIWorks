/**
 * Scoring-Konfiguration verwalten (Gewichtungen + Schwellenwerte).
 *
 * GET /api/admin/sales/targets/scoring
 * PUT /api/admin/sales/targets/scoring
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getActiveScoringConfig, upsertScoringConfig } from "@/lib/sales/targets/store";
import type { ScoringWeights, ProjectValueTier } from "@/lib/sales/targets/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const config = await getActiveScoringConfig();
  return NextResponse.json({ config });
}

export async function PUT(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  let body: {
    key: string;
    label: string;
    weights: ScoringWeights;
    thresholdAPlus?: number;
    thresholdA?: number;
    thresholdB?: number;
    thresholdC?: number;
    projectValueTiers?: Record<string, ProjectValueTier>;
    isActive?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const config = await upsertScoringConfig({ ...body, updatedBy: gate.auth.userId });
  return NextResponse.json({ config });
}
