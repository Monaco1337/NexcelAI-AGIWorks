/**
 * Vertriebsmodul — Service-Layer / Orchestrierung.
 *
 * Ort für Vorgänge, die mehrere Stores berühren und immer denselben
 * Verlauf haben (Audit + Activity + Cascading). API-Routen rufen
 * nur den Service auf und übernehmen keine Business-Logik.
 */

import { actorFrom, writeAudit } from "@/lib/audit/auditLog";
import type { AuthContext } from "@/lib/auth/authorize";
import {
  createCompany,
  updateCompany,
  getCompany,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from "./companiesStore";
import {
  createContact,
  updateContact,
  deleteContact,
  type CreateContactInput,
  type UpdateContactInput,
} from "./contactsStore";
import {
  createOpportunity,
  updateOpportunity,
  getOpportunity,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from "./opportunitiesStore";
import {
  logActivity,
  type CreateActivityInput,
} from "./activitiesStore";
import {
  approveSolution,
  getLatestSolution,
  upsertSolution,
  type UpsertSolutionInput,
} from "./solutionsStore";
import {
  approveProposalVersion,
  createProposal,
  createProposalVersion,
  markProposalVersionSent,
  scheduleProposalFollowups,
  type CreateProposalInput,
  type CreateProposalVersionInput,
} from "./proposalsStore";
import { createObjection, type CreateObjectionInput } from "./objectionsStore";
import { SalesError, type LostReason } from "./model";

/* ── kleine Utilities ─────────────────────────────────────────────── */

function summaryUser(auth: AuthContext | null): string {
  return auth?.name || auth?.email || "System";
}

async function activity(auth: AuthContext | null, input: Omit<CreateActivityInput, "actorId" | "actorEmail">) {
  return logActivity({
    ...input,
    actorId: auth?.userId ?? null,
    actorEmail: auth?.email ?? null,
  });
}

async function audit(
  auth: AuthContext,
  action: string,
  entityType: string,
  entityId: string,
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
  context?: Record<string, unknown>
): Promise<void> {
  await writeAudit({
    actor: actorFrom(auth),
    action,
    entityType,
    entityId,
    before,
    after,
    context,
  });
}

/* ── Companies ────────────────────────────────────────────────────── */

export async function serviceCreateCompany(auth: AuthContext, input: CreateCompanyInput) {
  const company = await createCompany({ ...input, createdBy: auth.userId });
  await audit(auth, "sales.company.created", "sales_company", company.id, null, {
    name: company.name,
    website: company.website,
    classification: company.classification,
    status: company.status,
  });
  await activity(auth, {
    entityType: "company",
    entityId: company.id,
    companyId: company.id,
    kind: "created",
    summary: `${summaryUser(auth)} hat ${company.name} angelegt`,
  });
  return company;
}

export async function serviceUpdateCompany(
  auth: AuthContext,
  id: string,
  input: UpdateCompanyInput
) {
  const before = await getCompany(id);
  if (!before) throw new SalesError("Firma nicht gefunden", "not_found", 404);
  const after = await updateCompany(id, { ...input, updatedBy: auth.userId });
  await audit(auth, "sales.company.updated", "sales_company", id,
    { status: before.status, classification: before.classification, ownerId: before.ownerId, nextAction: before.nextAction, nextActionDueAt: before.nextActionDueAt },
    { status: after.status, classification: after.classification, ownerId: after.ownerId, nextAction: after.nextAction, nextActionDueAt: after.nextActionDueAt });

  if (before.status !== after.status) {
    await activity(auth, {
      entityType: "company",
      entityId: id,
      companyId: id,
      kind: "status_changed",
      summary: `Status: ${before.status} → ${after.status}`,
      payload: { from: before.status, to: after.status },
    });
  }
  if (before.classification !== after.classification) {
    await activity(auth, {
      entityType: "company",
      entityId: id,
      companyId: id,
      kind: "classification_changed",
      summary: `Klassifizierung: ${before.classification ?? "—"} → ${after.classification ?? "—"}`,
    });
  }
  if (before.nextAction !== after.nextAction || before.nextActionDueAt !== after.nextActionDueAt) {
    await activity(auth, {
      entityType: "company",
      entityId: id,
      companyId: id,
      kind: "next_action_set",
      summary: `Nächster Schritt aktualisiert`,
      payload: { action: after.nextAction, dueAt: after.nextActionDueAt },
    });
  }
  if (before.ownerId !== after.ownerId) {
    await activity(auth, {
      entityType: "company",
      entityId: id,
      companyId: id,
      kind: "owner_changed",
      summary: `Owner geändert`,
      payload: { from: before.ownerId, to: after.ownerId },
    });
  }
  return after;
}

/* ── Contacts ─────────────────────────────────────────────────────── */

export async function serviceCreateContact(auth: AuthContext, input: CreateContactInput) {
  const contact = await createContact({ ...input, createdBy: auth.userId });
  await audit(auth, "sales.contact.created", "sales_contact", contact.id, null, {
    companyId: contact.companyId,
    name: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
    role: contact.role,
  });
  await activity(auth, {
    entityType: "company",
    entityId: contact.companyId,
    companyId: contact.companyId,
    kind: "contact_added",
    summary: `Kontakt hinzugefügt: ${[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "unbenannt"}`,
  });
  return contact;
}

export async function serviceUpdateContact(auth: AuthContext, id: string, input: UpdateContactInput) {
  const contact = await updateContact(id, { ...input, updatedBy: auth.userId });
  await audit(auth, "sales.contact.updated", "sales_contact", id, null, {
    companyId: contact.companyId,
  });
  return contact;
}

export async function serviceDeleteContact(auth: AuthContext, id: string) {
  await deleteContact(id);
  await audit(auth, "sales.contact.deleted", "sales_contact", id, null, null);
}

/* ── Opportunities ────────────────────────────────────────────────── */

export async function serviceCreateOpportunity(auth: AuthContext, input: CreateOpportunityInput) {
  const opp = await createOpportunity({ ...input, createdBy: auth.userId });
  await audit(auth, "sales.opportunity.created", "sales_opportunity", opp.id, null, {
    companyId: opp.companyId,
    title: opp.title,
    brandContext: opp.brandContext,
    status: opp.status,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: opp.id,
    companyId: opp.companyId,
    kind: "created",
    summary: `Opportunity angelegt: ${opp.title}`,
  });
  return opp;
}

export async function serviceUpdateOpportunity(
  auth: AuthContext,
  id: string,
  input: UpdateOpportunityInput
) {
  const before = await getOpportunity(id);
  if (!before) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
  const after = await updateOpportunity(id, { ...input, updatedBy: auth.userId });
  await audit(auth, "sales.opportunity.updated", "sales_opportunity", id,
    { status: before.status, classification: before.classification, ownerId: before.ownerId },
    { status: after.status, classification: after.classification, ownerId: after.ownerId });

  if (before.status !== after.status) {
    await activity(auth, {
      entityType: "opportunity",
      entityId: id,
      companyId: after.companyId,
      kind: "status_changed",
      summary: `Status: ${before.status} → ${after.status}`,
      payload: { from: before.status, to: after.status },
    });
  }
  if (before.classification !== after.classification) {
    await activity(auth, {
      entityType: "opportunity",
      entityId: id,
      companyId: after.companyId,
      kind: "classification_changed",
      summary: `Klassifizierung: ${before.classification ?? "—"} → ${after.classification ?? "—"}`,
    });
  }
  return after;
}

export async function serviceMarkOpportunityWon(
  auth: AuthContext,
  id: string,
  version: number,
  learning?: string
) {
  const opp = await serviceUpdateOpportunity(auth, id, {
    version,
    status: "gewonnen",
    wonAt: new Date().toISOString(),
    learning: learning ?? null,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: id,
    companyId: opp.companyId,
    kind: "won",
    summary: `Opportunity gewonnen`,
    payload: { learning: learning ?? null },
  });
  return opp;
}

export async function serviceMarkOpportunityLost(
  auth: AuthContext,
  id: string,
  version: number,
  reason: LostReason,
  notes: string,
  learning?: string
) {
  if (!reason) throw new SalesError("Lost-Grund ist erforderlich", "invalid", 400);
  const opp = await serviceUpdateOpportunity(auth, id, {
    version,
    status: "verloren",
    lostAt: new Date().toISOString(),
    lostReason: reason,
    lostNotes: notes,
    learning: learning ?? null,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: id,
    companyId: opp.companyId,
    kind: "lost",
    summary: `Opportunity verloren (${reason})`,
    payload: { reason, notes, learning: learning ?? null },
  });
  return opp;
}

export async function serviceMarkOpportunityDeferred(
  auth: AuthContext,
  id: string,
  version: number,
  reason: string,
  reviveAt?: string | null
) {
  const opp = await serviceUpdateOpportunity(auth, id, {
    version,
    status: "zurueckgestellt",
    deferredAt: new Date().toISOString(),
    nextActionDueAt: reviveAt ?? null,
    nextAction: reviveAt ? "spaeter_kontaktieren" : "keine_aktion",
    learning: reason,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: id,
    companyId: opp.companyId,
    kind: "deferred",
    summary: `Opportunity zurückgestellt`,
    payload: { reason, reviveAt: reviveAt ?? null },
  });
  return opp;
}

/* ── Solution Scope ───────────────────────────────────────────────── */

export async function serviceUpsertSolution(auth: AuthContext, input: UpsertSolutionInput) {
  const solution = await upsertSolution({ ...input, updatedBy: auth.userId });
  await audit(auth, "sales.solution.upserted", "sales_solution", solution.id, null, {
    opportunityId: solution.opportunityId,
    qualityGate: solution.qualityGate,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: solution.opportunityId,
    kind: "solution_updated",
    summary: `Lösungs- & Leistungsumfang aktualisiert`,
    payload: { qualityGate: solution.qualityGate },
  });
  return solution;
}

export async function serviceApproveSolution(auth: AuthContext, id: string) {
  const solution = await approveSolution(id, auth.userId);
  await audit(auth, "sales.solution.approved", "sales_solution", id, null, {
    approvedBy: auth.userId,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: solution.opportunityId,
    kind: "solution_approved",
    summary: `Lösungs- & Leistungsumfang freigegeben`,
  });
  return solution;
}

/* ── Proposals ────────────────────────────────────────────────────── */

export async function serviceCreateProposal(auth: AuthContext, input: CreateProposalInput) {
  // Freigabegate: es MUSS eine freigegebene Solution existieren.
  const latest = await getLatestSolution(input.opportunityId);
  if (!latest?.approvedAt) {
    throw new SalesError(
      "Kein freigegebener Lösungs- & Leistungsumfang vorhanden. Zuerst freigeben.",
      "solution_not_approved",
      412
    );
  }

  const proposal = await createProposal({
    ...input,
    solutionId: latest.id,
    createdBy: auth.userId,
  });
  await audit(auth, "sales.proposal.created", "sales_proposal", proposal.id, null, {
    opportunityId: proposal.opportunityId,
    brandContext: proposal.brandContext,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: proposal.opportunityId,
    kind: "proposal_created",
    summary: `Angebot angelegt: ${proposal.title}`,
  });
  return proposal;
}

export async function serviceAddProposalVersion(
  auth: AuthContext,
  input: CreateProposalVersionInput
) {
  const version = await createProposalVersion({ ...input, generatedBy: auth.userId });
  await audit(auth, "sales.proposal.version_created", "sales_proposal", version.proposalId, null, {
    versionId: version.id,
    version: version.version,
  });
  await activity(auth, {
    entityType: "proposal",
    entityId: version.proposalId,
    kind: "proposal_version",
    summary: `Angebotsversion ${version.version} erstellt`,
  });
  return version;
}

export async function serviceApproveProposalVersion(auth: AuthContext, versionId: string) {
  const version = await approveProposalVersion(versionId, auth.userId);
  await audit(auth, "sales.proposal.approved", "sales_proposal_version", versionId, null, {
    proposalId: version.proposalId,
    approvedBy: auth.userId,
  });
  await activity(auth, {
    entityType: "proposal",
    entityId: version.proposalId,
    kind: "proposal_approved",
    summary: `Angebotsversion ${version.version} freigegeben`,
  });
  return version;
}

export async function serviceMarkProposalSent(auth: AuthContext, versionId: string) {
  const version = await markProposalVersionSent(versionId, auth.userId);
  const followups = await scheduleProposalFollowups(version.proposalId, new Date());
  await audit(auth, "sales.proposal.sent", "sales_proposal_version", versionId, null, {
    proposalId: version.proposalId,
    followups: followups.length,
  });
  await activity(auth, {
    entityType: "proposal",
    entityId: version.proposalId,
    kind: "proposal_sent",
    summary: `Angebot versendet`,
  });
  return { version, followups };
}

/* ── Objections ───────────────────────────────────────────────────── */

export async function serviceCreateObjection(auth: AuthContext, input: CreateObjectionInput) {
  const obj = await createObjection({ ...input, createdBy: auth.userId });
  await audit(auth, "sales.objection.created", "sales_objection", obj.id, null, {
    opportunityId: obj.opportunityId,
    type: obj.type,
  });
  await activity(auth, {
    entityType: "opportunity",
    entityId: obj.opportunityId,
    kind: "objection",
    summary: `Einwand: ${obj.type}`,
    payload: { body: obj.body },
  });
  return obj;
}
