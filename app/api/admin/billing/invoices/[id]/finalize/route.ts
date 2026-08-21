/**
 * Finalisierung einer Rechnung.
 *
 * Idempotenzschutz per `version`: der Client übermittelt die zuletzt
 * gesehene Version. Ein Doppelklick oder ein wiederholt gesendeter Request
 * findet die Version bereits erhöht vor und wird abgewiesen — es gibt
 * keinen Weg, zwei Nummern auf denselben Beleg zu buchen.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { InvoiceError } from "@/lib/billing/invoicesStore";
import { finalizeAndProduce } from "@/lib/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.finalize");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  let body: { version?: number };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (typeof body.version !== "number") {
    return NextResponse.json({ error: "version_required" }, { status: 400 });
  }

  try {
    const invoice = await finalizeAndProduce(id, body.version, actorFrom(gate.auth), await requestMeta());
    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof InvoiceError) {
      const status =
        error.code === "not_found"
          ? 404
          : error.code === "concurrent_finalize" || error.code === "duplicate_period"
            ? 409
            : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error("[BILLING] Finalisierung fehlgeschlagen:", error);
    return NextResponse.json({ error: "finalize_failed" }, { status: 500 });
  }
}
