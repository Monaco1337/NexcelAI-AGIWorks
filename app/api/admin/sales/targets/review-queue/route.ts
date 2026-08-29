/**
 * Human-Review-Queue (Phase 41).
 *
 * GET /api/admin/sales/targets/review-queue
 *
 * Enthält:
 *  - HIGH_SCORE_LOW_CONFIDENCE (Score ≥ 65, Confidence < 0.5)
 *  - POSSIBLE_DUPLICATE (Fuzzy-Match beim Discovery)
 *  - CONFLICTING_CONTACT (widersprüchliche Kontaktdaten)
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listReviewQueue } from "@/lib/sales/targets/hardening/storeAdditions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const items = await listReviewQueue(200);
  return NextResponse.json({ items });
}
