/**
 * Empfohlener nächster Schritt für eine Firma.
 *
 * Nimmt die aktuelle Opportunity-, Notizen- und Angebotslage und liefert
 * exakt eine Empfehlung inklusive Zieltab und CTA zurück. Die Logik
 * lebt in `lib/sales/nextStep.ts` und ist rein deterministisch.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getCompany } from "@/lib/sales/companiesStore";
import { listContacts } from "@/lib/sales/contactsStore";
import { listOpportunities } from "@/lib/sales/opportunitiesStore";
import { listNotes } from "@/lib/sales/notesStore";
import { getLatestSolution } from "@/lib/sales/solutionsStore";
import {
  listOpenFollowups,
  listProposalsForOpportunity,
  listProposalVersions,
} from "@/lib/sales/proposalsStore";
import {
  recommendNextStep,
  type NextStepInputState,
} from "@/lib/sales/nextStep";
import {
  analyzeDiscovery,
  coerceDiscovery,
} from "@/lib/sales/discoveryModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const company = await getCompany(id);
  if (!company) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [contacts, oppRes] = await Promise.all([
    listContacts(id),
    listOpportunities({ companyId: id, limit: 100 }),
  ]);

  // Wähle die relevanteste Opportunity (offen, aktuellstes updatedAt).
  const open = oppRes.opportunities.filter(
    (o) => !["gewonnen", "verloren", "zurueckgestellt"].includes(o.status)
  );
  const primary =
    open[0] ??
    oppRes.opportunities.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0] ??
    null;

  const state: NextStepInputState = {
    hasOpportunity: Boolean(primary),
    status: (primary?.status ?? "neu") as NextStepInputState["status"],
    hasPreCall: false,
    callsCount: 0,
    hasContact: contacts.length > 0,
  };

  if (primary) {
    const [notes, solution, proposals, followups] = await Promise.all([
      listNotes("opportunity", primary.id),
      getLatestSolution(primary.id),
      listProposalsForOpportunity(primary.id),
      listOpenFollowups(),
    ]);

    // Pre-Call: Existiert in AI-Runs, hier heuristisch über Notizen ableiten.
    state.hasPreCall = notes.some(
      (n) => n.kind === "call" && (n.structured as { source?: string }).source === "precall"
    );
    state.callsCount = notes.filter((n) => n.kind === "call").length;

    const discoveryNote = notes.find((n) => n.kind === "discovery");
    if (discoveryNote) {
      state.discovery = analyzeDiscovery(coerceDiscovery(discoveryNote.structured));
    }

    if (solution) {
      state.solution = { exists: true, approved: Boolean(solution.approvedAt) };
    }

    const proposal = proposals[0];
    if (proposal) {
      const versions = await listProposalVersions(proposal.id);
      const latestVersion = versions[0] ?? null;
      state.proposal = {
        exists: true,
        hasVersion: Boolean(latestVersion),
        versionApproved: Boolean(latestVersion?.approvedAt),
        sent: Boolean(proposal.sentAt),
        followupOpen: followups.some((f) => f.proposalId === proposal.id),
        accepted: Boolean(proposal.acceptedAt),
        rejected: Boolean(proposal.rejectedAt),
      };
    }
  }

  const recommendation = recommendNextStep(state);
  return NextResponse.json({
    recommendation,
    primaryOpportunityId: primary?.id ?? null,
    state,
  });
}
