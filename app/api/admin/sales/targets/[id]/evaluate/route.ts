/**
 * Ground-Truth-Evaluation für einen Zielkunden.
 *
 * POST /api/admin/sales/targets/[id]/evaluate
 *   body: EvaluationSubmission (siehe hardening/storeAdditions)
 *
 * Manuelle Reviews werden strikt getrennt vom Produktionsdatensatz
 * gespeichert. Wir speichern die aktuelle Systemvorhersage als
 * Snapshot mit, damit Regressions-Metriken später vergleichbar sind.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { findTargetById, getCurrentLeadScore, listContacts, listDecisionMakers } from "@/lib/sales/targets/store";
import {
  listEvaluations,
  submitEvaluation,
} from "@/lib/sales/targets/hardening/storeAdditions";
import { newCorrelationId, toTargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const items = await listEvaluations(id, 100);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const correlationId = newCorrelationId("eval");
  try {
    const { id } = await ctx.params;
    const target = await findTargetById(id);
    if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const body = (await request.json()) as Record<string, unknown>;
    const scoreVersion = (body.scoreVersion as string) ?? "v2";
    const currentScore = await getCurrentLeadScore(id, scoreVersion as "v1" | "v2");
    const [contacts, dms] = await Promise.all([listContacts(id), listDecisionMakers(id)]);
    const systemPrediction = {
      totalScore: currentScore?.totalScore ?? null,
      priorityClass: currentScore?.priorityClass ?? null,
      matrixPriority: currentScore?.matrixPriority ?? null,
      capacityClass: currentScore?.capacityClass ?? null,
      evidenceConfidence: currentScore?.evidenceConfidence ?? null,
      contactsCount: contacts.length,
      decisionMakersCount: dms.length,
    };
    const record = await submitEvaluation({
      targetId: id,
      scoreVersion,
      evaluatorId: gate.auth.userId,
      evaluatorEmail: gate.auth.user?.email ?? null,
      phoneVerdict: normalizeVerdict(body.phoneVerdict, ["YES", "NO", "UNKNOWN"]) as
        | "YES"
        | "NO"
        | "UNKNOWN"
        | null,
      emailVerdict: normalizeVerdict(body.emailVerdict, ["YES", "NO", "UNKNOWN"]) as
        | "YES"
        | "NO"
        | "UNKNOWN"
        | null,
      decisionMakerVerdict: normalizeVerdict(body.decisionMakerVerdict, ["YES", "NO", "UNKNOWN"]) as
        | "YES"
        | "NO"
        | "UNKNOWN"
        | null,
      websiteVerdict: normalizeVerdict(body.websiteVerdict, ["YES", "PARTIAL", "NO", "UNKNOWN"]) as
        | "YES"
        | "PARTIAL"
        | "NO"
        | "UNKNOWN"
        | null,
      opportunityVerdict: normalizeVerdict(body.opportunityVerdict, [
        "YES",
        "PARTIAL",
        "NO",
        "UNKNOWN",
      ]) as "YES" | "PARTIAL" | "NO" | "UNKNOWN" | null,
      commercialFitVerdict: normalizeVerdict(body.commercialFitVerdict, [
        "OVER",
        "CORRECT",
        "UNDER",
        "UNKNOWN",
      ]) as "OVER" | "CORRECT" | "UNDER" | "UNKNOWN" | null,
      priorityVerdict: normalizeVerdict(body.priorityVerdict, [
        "TOO_HIGH",
        "CORRECT",
        "TOO_LOW",
        "UNKNOWN",
      ]) as "TOO_HIGH" | "CORRECT" | "TOO_LOW" | "UNKNOWN" | null,
      wouldContact: typeof body.wouldContact === "boolean" ? body.wouldContact : null,
      reviewStatus: body.reviewStatus === "COMPLETED" ? "COMPLETED" : "DRAFT",
      reviewVersion: typeof body.reviewVersion === "string"
        ? body.reviewVersion.slice(0, 50)
        : "v1",
      comparisonTargetId: typeof body.comparisonTargetId === "string"
        ? body.comparisonTargetId
        : null,
      identityVerdict: normalizeVerdict(body.identityVerdict, [
        "SAME_ENTITY",
        "DISTINCT_ENTITY",
        "UNCERTAIN",
        "NOT_APPLICABLE",
      ]) as "SAME_ENTITY" | "DISTINCT_ENTITY" | "UNCERTAIN" | "NOT_APPLICABLE" | null,
      validCompany: normalizeBoolean(body.validCompany),
      canonicalNameCorrect: normalizeBoolean(body.canonicalNameCorrect),
      geographyCorrect: normalizeBoolean(body.geographyCorrect),
      targetFitVerdict: normalizeVerdict(body.targetFitVerdict, [
        "YES",
        "NO",
        "UNKNOWN",
      ]) as "YES" | "NO" | "UNKNOWN" | null,
      qualificationCorrect: normalizeBoolean(body.qualificationCorrect),
      provenanceComplete: normalizeBoolean(body.provenanceComplete),
      notes: typeof body.notes === "string" ? body.notes : null,
      systemPrediction,
    });
    return NextResponse.json({ record, correlationId });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json({ ...err.toJson(), correlationId }, { status: err.httpStatus });
  }
}

function normalizeVerdict(input: unknown, allowed: string[]): string | null {
  if (typeof input !== "string") return null;
  const v = input.toUpperCase();
  return allowed.includes(v) ? v : null;
}

function normalizeBoolean(input: unknown): boolean | null {
  return typeof input === "boolean" ? input : null;
}
