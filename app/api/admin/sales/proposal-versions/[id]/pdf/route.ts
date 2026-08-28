/**
 * PDF-Download für eine bestimmte Angebotsversion.
 * Verwendet die gespeicherte Datei; falls fehlt, wird live gerendert.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import {
  getProposal,
  getProposalVersion,
  loadProposalDocumentBytes,
  saveProposalDocument,
} from "@/lib/sales/proposalsStore";
import { renderProposalPdf, type ProposalStructured } from "@/lib/sales/proposalPdf";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const version = await getProposalVersion(id);
  if (!version) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (version.documentId) {
    const doc = await loadProposalDocumentBytes(version.documentId);
    if (doc) {
      return new NextResponse(new Uint8Array(doc.bytes), {
        headers: {
          "content-type": doc.mime,
          "content-disposition": `inline; filename="angebot-v${version.version}.pdf"`,
          "cache-control": "private, no-cache",
        },
      });
    }
  }

  const proposal = await getProposal(version.proposalId);
  if (!proposal) return NextResponse.json({ error: "proposal_not_found" }, { status: 404 });

  const bytes = await renderProposalPdf({
    brand: proposal.brandContext,
    structured: version.structured as ProposalStructured,
    proposalNumber: `${proposal.title}-v${version.version}`,
    generatedAt: new Date(version.generatedAt),
    watermark: version.approvedAt ? undefined : "Vorschau",
  });
  await saveProposalDocument(version.id, bytes);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="angebot-v${version.version}.pdf"`,
      "cache-control": "private, no-cache",
    },
  });
}
