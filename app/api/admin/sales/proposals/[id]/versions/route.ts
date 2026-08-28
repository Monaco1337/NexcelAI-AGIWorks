/**
 * Angebotsversion aus AI-Ergebnis erzeugen + PDF rendern + speichern.
 *
 * Body:
 *   { runId: string }        // referenziert einen freigegebenen sales_ai_run
 *  ODER
 *   { structured: {...} }    // direkt vorgefertigter Content (fortgeschritten)
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getProposal, saveProposalDocument } from "@/lib/sales/proposalsStore";
import { serviceAddProposalVersion } from "@/lib/sales/service";
import { getRun } from "@/lib/sales/ai/runStore";
import { renderProposalPdf, type ProposalStructured } from "@/lib/sales/proposalPdf";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  let structured: ProposalStructured | null = null;
  let runId: string | null = null;
  let promptVersion: number | null = null;

  if (body.runId) {
    const run = await getRun(body.runId);
    if (!run) return NextResponse.json({ error: "run_not_found" }, { status: 404 });
    if (!run.output) return NextResponse.json({ error: "run_has_no_output" }, { status: 412 });
    structured = run.output as ProposalStructured;
    runId = run.id;
    promptVersion = run.promptVersion;
  } else if (body.structured) {
    structured = body.structured as ProposalStructured;
  } else {
    return NextResponse.json({ error: "runId_or_structured_required" }, { status: 400 });
  }

  const proposal = await getProposal(id);
  if (!proposal) return NextResponse.json({ error: "proposal_not_found" }, { status: 404 });

  try {
    const version = await serviceAddProposalVersion(gate.auth, {
      proposalId: id,
      structured: structured as Record<string, unknown>,
      pricingSnapshot: (structured?.investition ?? {}) as Record<string, unknown>,
      paymentPlanSnapshot: { zahlungsplan: structured?.zahlungsplan ?? [] },
      timeframeSnapshot: (structured?.zeitrahmen ?? {}) as Record<string, unknown>,
      promptVersion: promptVersion ?? undefined,
      runId: runId ?? undefined,
    });

    // PDF direkt rendern und archivieren.
    const bytes = await renderProposalPdf({
      brand: proposal.brandContext,
      structured,
      proposalNumber: `${proposal.title}-v${version.version}`,
      generatedAt: new Date(),
      watermark: "Vorschau",
    });
    await saveProposalDocument(version.id, bytes);

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[SALES] Angebotsversion fehlgeschlagen:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
