/**
 * Sales-Outcome-Feedback (Phase 18).
 *
 * POST /api/admin/sales/targets/[id]/outcome
 *   body: { eventKind, actualDealValueCents?, note? }
 *
 * Speichert CRM-Events pro Zielkunde. Diese Daten werden NICHT
 * automatisch in Scoring-Gewichte zurückgeschrieben — sie sind
 * Grundlage für spätere Offline-Kalibrierung.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { findTargetById } from "@/lib/sales/targets/store";
import {
  listOutcomes,
  recordOutcome,
  type OutcomeKind,
} from "@/lib/sales/targets/hardening/storeAdditions";
import { toTargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_KINDS: OutcomeKind[] = [
  "CONTACTED",
  "REPLIED",
  "MEETING_BOOKED",
  "PROPOSAL",
  "WON",
  "LOST",
  "NO_INTEREST",
  "WRONG_CONTACT",
  "WRONG_NEED",
  "NO_BUDGET",
  "NO_TIMING",
];

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const items = await listOutcomes(id, 100);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const target = await findTargetById(id);
    if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const body = (await request.json()) as {
      eventKind?: string;
      linkedSalesCompanyId?: string | null;
      actualDealValueCents?: number | null;
      note?: string | null;
    };
    const kind = (body.eventKind ?? "").toUpperCase() as OutcomeKind;
    if (!ALLOWED_KINDS.includes(kind)) {
      return NextResponse.json({ error: "VALIDATION_FAILED", detail: "eventKind unzulässig" }, { status: 400 });
    }
    const record = await recordOutcome({
      targetId: id,
      linkedSalesCompanyId: body.linkedSalesCompanyId ?? target.linkedSalesCompanyId ?? null,
      eventKind: kind,
      actualDealValueCents: body.actualDealValueCents ?? null,
      note: body.note ?? null,
      recordedBy: gate.auth.userId,
    });
    return NextResponse.json({ record });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json(err.toJson(), { status: err.httpStatus });
  }
}
