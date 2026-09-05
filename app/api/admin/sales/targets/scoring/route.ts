/**
 * Scoring-Konfiguration verwalten (Gewichtungen + Schwellenwerte).
 *
 * GET /api/admin/sales/targets/scoring
 * PUT /api/admin/sales/targets/scoring
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getActiveScoringConfig, upsertScoringConfig } from "@/lib/sales/targets/store";
import {
  DEFAULT_PROJECT_VALUE_TIERS,
  type ScoringWeights,
  type ProjectValueTier,
} from "@/lib/sales/targets/model";
import { validateScoringConfig } from "@/lib/sales/targets/scoring/configVersions";
import { publishScoringConfigVersion } from "@/lib/sales/targets/scoring/store";

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
    thresholdAPlusPlus?: number;
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
  if (
    !body ||
    typeof body.key !== "string" ||
    typeof body.label !== "string" ||
    !body.weights ||
    typeof body.weights !== "object"
  ) {
    return NextResponse.json({ error: "invalid_scoring_config" }, { status: 400 });
  }
  const thresholds = {
    aPlusPlus: body.thresholdAPlusPlus ?? 92,
    aPlus: body.thresholdAPlus ?? 85,
    a: body.thresholdA ?? 70,
    b: body.thresholdB ?? 55,
    c: body.thresholdC ?? 40,
  };
  const errors = validateScoringConfig({
    id: "pending",
    key: body.key,
    version: 1,
    status: "DRAFT",
    weights: body.weights,
    thresholds,
    unknownPolicy: "EXCLUDE_AND_REWEIGHT",
    createdAt: new Date().toISOString(),
    activatedAt: null,
  });
  if (errors.length > 0) {
    return NextResponse.json({ error: "invalid_scoring_config", issues: errors }, { status: 400 });
  }
  const config = await upsertScoringConfig({ ...body, updatedBy: gate.auth.userId });
  const version = await publishScoringConfigVersion({
    key: body.key,
    scoreVersion: "v2",
    weights: body.weights,
    thresholds,
    valueTiers: body.projectValueTiers ?? DEFAULT_PROJECT_VALUE_TIERS,
    actorId: gate.auth.userId,
    changeNote: "Updated through admin scoring API",
  });
  return NextResponse.json({ config, version });
}
