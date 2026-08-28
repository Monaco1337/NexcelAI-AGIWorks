/**
 * Vertriebsmodul — Angebote (Proposals).
 *
 * Ein Angebot ist der zeitpunktscharfe Snapshot einer Solution + Preisen +
 * Kundendaten + Absender. Jede erneute Generierung erzeugt eine NEUE
 * `sales_proposal_versions`-Zeile. Versionen sind unveränderlich.
 * Dokumente (PDF) hängen an einer Version, nicht am Kopfsatz.
 */

import crypto from "node:crypto";
import { db } from "@/lib/pg";
import {
  SalesError,
  newId,
  type BrandContext,
  type ProposalStatus,
} from "./model";

/* ── Kopf ─────────────────────────────────────────────────────────── */

export interface SalesProposal {
  id: string;
  opportunityId: string;
  solutionId: string | null;
  title: string;
  brandContext: BrandContext;
  status: ProposalStatus;
  currentVersionId: string | null;
  currentVersionNumber: number | null;
  customerSnapshot: Record<string, unknown>;
  totalCents: number | null;
  currency: string;
  validUntil: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface ProposalRow {
  id: string;
  opportunity_id: string;
  solution_id: string | null;
  title: string;
  brand_context: string;
  status: string;
  current_version_id: string | null;
  current_version_number: number | null;
  customer_snapshot: Record<string, unknown> | null;
  total_cents: string | null;
  currency: string;
  valid_until: Date | null;
  sent_at: Date | null;
  accepted_at: Date | null;
  rejected_at: Date | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

function proposalRowTo(row: ProposalRow): SalesProposal {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    solutionId: row.solution_id,
    title: row.title,
    brandContext: row.brand_context as BrandContext,
    status: row.status as ProposalStatus,
    currentVersionId: row.current_version_id,
    currentVersionNumber: row.current_version_number,
    customerSnapshot: row.customer_snapshot ?? {},
    totalCents: row.total_cents == null ? null : Number(row.total_cents),
    currency: row.currency,
    validUntil: row.valid_until ? row.valid_until.toISOString().slice(0, 10) : null,
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    acceptedAt: row.accepted_at ? row.accepted_at.toISOString() : null,
    rejectedAt: row.rejected_at ? row.rejected_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
  };
}

const PROPOSAL_SELECT = `
  p.id, p.opportunity_id, p.solution_id, p.title, p.brand_context, p.status,
  p.current_version_id, cv.version AS current_version_number,
  p.customer_snapshot, p.total_cents, p.currency, p.valid_until,
  p.sent_at, p.accepted_at, p.rejected_at, p.created_at, p.updated_at, p.version
`;

export async function listProposalsForOpportunity(
  opportunityId: string
): Promise<SalesProposal[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<ProposalRow[]>`
    SELECT ${sql.unsafe(PROPOSAL_SELECT)}
    FROM sales_proposals p
    LEFT JOIN sales_proposal_versions cv ON cv.id = p.current_version_id
    WHERE p.opportunity_id = ${opportunityId} AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `;
  return rows.map(proposalRowTo);
}

export async function getProposal(id: string): Promise<SalesProposal | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<ProposalRow[]>`
    SELECT ${sql.unsafe(PROPOSAL_SELECT)}
    FROM sales_proposals p
    LEFT JOIN sales_proposal_versions cv ON cv.id = p.current_version_id
    WHERE p.id = ${id} AND p.deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ? proposalRowTo(rows[0]) : null;
}

export interface CreateProposalInput {
  opportunityId: string;
  solutionId?: string | null;
  title: string;
  brandContext: BrandContext;
  customerSnapshot?: Record<string, unknown>;
  validUntil?: string | null;
  createdBy?: string | null;
}

export async function createProposal(input: CreateProposalInput): Promise<SalesProposal> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newId("sprop");
  await sql`
    INSERT INTO sales_proposals (
      id, opportunity_id, solution_id, title, brand_context, status,
      customer_snapshot, valid_until, created_by, updated_by
    ) VALUES (
      ${id}, ${input.opportunityId}, ${input.solutionId ?? null}, ${input.title},
      ${input.brandContext}, 'draft',
      ${JSON.stringify(input.customerSnapshot ?? {})}::jsonb,
      ${input.validUntil ?? null},
      ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
  `;
  const created = await getProposal(id);
  if (!created) throw new SalesError("Proposal konnte nicht angelegt werden", "insert_failed", 500);
  return created;
}

export interface UpdateProposalHeadInput {
  version: number;
  title?: string;
  status?: ProposalStatus;
  customerSnapshot?: Record<string, unknown>;
  totalCents?: number | null;
  currency?: string;
  validUntil?: string | null;
  currentVersionId?: string | null;
  sentAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  updatedBy?: string | null;
}

export async function updateProposalHead(
  id: string,
  input: UpdateProposalHeadInput
): Promise<SalesProposal> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const rows = await sql`
    UPDATE sales_proposals SET
      title               = COALESCE(${input.title ?? null}, title),
      status              = COALESCE(${input.status ?? null}, status),
      customer_snapshot   = ${input.customerSnapshot === undefined ? sql`customer_snapshot` : sql`${JSON.stringify(input.customerSnapshot ?? {})}::jsonb`},
      total_cents         = ${input.totalCents === undefined ? sql`total_cents` : input.totalCents},
      currency            = COALESCE(${input.currency ?? null}, currency),
      valid_until         = ${input.validUntil === undefined ? sql`valid_until` : input.validUntil},
      current_version_id  = ${input.currentVersionId === undefined ? sql`current_version_id` : input.currentVersionId},
      sent_at             = ${input.sentAt === undefined ? sql`sent_at` : input.sentAt},
      accepted_at         = ${input.acceptedAt === undefined ? sql`accepted_at` : input.acceptedAt},
      rejected_at         = ${input.rejectedAt === undefined ? sql`rejected_at` : input.rejectedAt},
      updated_by          = ${input.updatedBy ?? null},
      updated_at          = NOW(),
      version             = version + 1
    WHERE id = ${id} AND deleted_at IS NULL AND version = ${input.version}
    RETURNING id
  `;
  if (rows.length === 0) {
    const existing = await getProposal(id);
    if (!existing) throw new SalesError("Proposal nicht gefunden", "not_found", 404);
    throw new SalesError("Konflikt: Proposal wurde parallel geändert", "conflict", 409);
  }
  const result = await getProposal(id);
  if (!result) throw new SalesError("Proposal nicht gefunden", "not_found", 404);
  return result;
}

export async function softDeleteProposal(id: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_proposals SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL`;
}

/* ── Versionen (immutable) ────────────────────────────────────────── */

export interface ProposalVersion {
  id: string;
  proposalId: string;
  version: number;
  generatedAt: string;
  generatedBy: string | null;
  solutionScopeVersion: number | null;
  promptVersion: number | null;
  structured: Record<string, unknown>;
  pricingSnapshot: Record<string, unknown>;
  paymentPlanSnapshot: Record<string, unknown>;
  timeframeSnapshot: Record<string, unknown>;
  runId: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  sentAt: string | null;
  documentId: string | null;
}

interface VersionRow {
  id: string;
  proposal_id: string;
  version: number;
  generated_at: Date;
  generated_by: string | null;
  solution_scope_version: number | null;
  prompt_version: number | null;
  structured: Record<string, unknown>;
  pricing_snapshot: Record<string, unknown> | null;
  payment_plan_snapshot: Record<string, unknown> | null;
  timeframe_snapshot: Record<string, unknown> | null;
  run_id: string | null;
  approved_at: Date | null;
  approved_by: string | null;
  sent_at: Date | null;
  document_id: string | null;
}

function versionRowTo(row: VersionRow): ProposalVersion {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    version: row.version,
    generatedAt: row.generated_at.toISOString(),
    generatedBy: row.generated_by,
    solutionScopeVersion: row.solution_scope_version,
    promptVersion: row.prompt_version,
    structured: row.structured,
    pricingSnapshot: row.pricing_snapshot ?? {},
    paymentPlanSnapshot: row.payment_plan_snapshot ?? {},
    timeframeSnapshot: row.timeframe_snapshot ?? {},
    runId: row.run_id,
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
    approvedBy: row.approved_by,
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    documentId: row.document_id,
  };
}

export async function listProposalVersions(proposalId: string): Promise<ProposalVersion[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<VersionRow[]>`
    SELECT id, proposal_id, version, generated_at, generated_by,
           solution_scope_version, prompt_version, structured,
           pricing_snapshot, payment_plan_snapshot, timeframe_snapshot,
           run_id, approved_at, approved_by, sent_at, document_id
    FROM sales_proposal_versions
    WHERE proposal_id = ${proposalId}
    ORDER BY version DESC
  `;
  return rows.map(versionRowTo);
}

export async function getProposalVersion(id: string): Promise<ProposalVersion | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<VersionRow[]>`
    SELECT id, proposal_id, version, generated_at, generated_by,
           solution_scope_version, prompt_version, structured,
           pricing_snapshot, payment_plan_snapshot, timeframe_snapshot,
           run_id, approved_at, approved_by, sent_at, document_id
    FROM sales_proposal_versions
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? versionRowTo(rows[0]) : null;
}

export interface CreateProposalVersionInput {
  proposalId: string;
  structured: Record<string, unknown>;
  pricingSnapshot?: Record<string, unknown>;
  paymentPlanSnapshot?: Record<string, unknown>;
  timeframeSnapshot?: Record<string, unknown>;
  solutionScopeVersion?: number | null;
  promptVersion?: number | null;
  runId?: string | null;
  generatedBy?: string | null;
}

export async function createProposalVersion(
  input: CreateProposalVersionInput
): Promise<ProposalVersion> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newId("spver");
  return await sql.begin(async (tx) => {
    const versionRows = await tx<{ next: number }[]>`
      SELECT COALESCE(MAX(version), 0) + 1 AS next
      FROM sales_proposal_versions WHERE proposal_id = ${input.proposalId}
    `;
    const version = versionRows[0]?.next ?? 1;
    await tx`
      INSERT INTO sales_proposal_versions (
        id, proposal_id, version, generated_by,
        solution_scope_version, prompt_version, structured,
        pricing_snapshot, payment_plan_snapshot, timeframe_snapshot, run_id
      ) VALUES (
        ${id}, ${input.proposalId}, ${version}, ${input.generatedBy ?? null},
        ${input.solutionScopeVersion ?? null}, ${input.promptVersion ?? null},
        ${JSON.stringify(input.structured)}::jsonb,
        ${JSON.stringify(input.pricingSnapshot ?? {})}::jsonb,
        ${JSON.stringify(input.paymentPlanSnapshot ?? {})}::jsonb,
        ${JSON.stringify(input.timeframeSnapshot ?? {})}::jsonb,
        ${input.runId ?? null}
      )
    `;
    // Kopf sofort auf diese Version zeigen — Preview & Freigabe brauchen den Bezug.
    await tx`
      UPDATE sales_proposals SET
        current_version_id = ${id},
        status             = 'preview',
        updated_at         = NOW(),
        version            = version + 1
      WHERE id = ${input.proposalId}
    `;
    const rows = await tx<VersionRow[]>`
      SELECT id, proposal_id, version, generated_at, generated_by,
             solution_scope_version, prompt_version, structured,
             pricing_snapshot, payment_plan_snapshot, timeframe_snapshot,
             run_id, approved_at, approved_by, sent_at, document_id
      FROM sales_proposal_versions WHERE id = ${id}
    `;
    return versionRowTo(rows[0]);
  });
}

export async function approveProposalVersion(
  versionId: string,
  approverId: string | null
): Promise<ProposalVersion> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  return await sql.begin(async (tx) => {
    const rows = await tx<VersionRow[]>`
      UPDATE sales_proposal_versions
      SET approved_at = NOW(), approved_by = ${approverId}
      WHERE id = ${versionId} AND approved_at IS NULL
      RETURNING id, proposal_id, version, generated_at, generated_by,
                solution_scope_version, prompt_version, structured,
                pricing_snapshot, payment_plan_snapshot, timeframe_snapshot,
                run_id, approved_at, approved_by, sent_at, document_id
    `;
    if (rows.length === 0) {
      const existing = await getProposalVersion(versionId);
      if (!existing) throw new SalesError("Version nicht gefunden", "not_found", 404);
      return existing;
    }
    const version = versionRowTo(rows[0]);
    await tx`
      UPDATE sales_proposals
      SET status = 'approved', updated_at = NOW(), version = version + 1
      WHERE id = ${version.proposalId} AND status IN ('draft','preview')
    `;
    return version;
  });
}

export async function markProposalVersionSent(
  versionId: string,
  actorId: string | null
): Promise<ProposalVersion> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  return await sql.begin(async (tx) => {
    const rows = await tx<VersionRow[]>`
      UPDATE sales_proposal_versions
      SET sent_at = COALESCE(sent_at, NOW())
      WHERE id = ${versionId}
      RETURNING id, proposal_id, version, generated_at, generated_by,
                solution_scope_version, prompt_version, structured,
                pricing_snapshot, payment_plan_snapshot, timeframe_snapshot,
                run_id, approved_at, approved_by, sent_at, document_id
    `;
    if (rows.length === 0) throw new SalesError("Version nicht gefunden", "not_found", 404);
    const version = versionRowTo(rows[0]);
    await tx`
      UPDATE sales_proposals
      SET status = 'sent', sent_at = COALESCE(sent_at, NOW()),
          updated_by = ${actorId}, updated_at = NOW(), version = version + 1
      WHERE id = ${version.proposalId}
    `;
    return version;
  });
}

/* ── Dokumente ────────────────────────────────────────────────────── */

export interface ProposalDocument {
  id: string;
  versionId: string;
  mime: string;
  sha256: string;
  size: number;
  createdAt: string;
}

export async function saveProposalDocument(
  versionId: string,
  bytes: Uint8Array,
  mime = "application/pdf"
): Promise<ProposalDocument> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newId("spdoc");
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO sales_proposal_documents (
        id, proposal_version_id, mime, bytes, sha256, size
      ) VALUES (
        ${id}, ${versionId}, ${mime}, ${bytes}, ${sha256}, ${bytes.byteLength}
      )
    `;
    await tx`
      UPDATE sales_proposal_versions SET document_id = ${id} WHERE id = ${versionId}
    `;
  });
  return {
    id,
    versionId,
    mime,
    sha256,
    size: bytes.byteLength,
    createdAt: new Date().toISOString(),
  };
}

export async function loadProposalDocumentBytes(
  id: string
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<{ bytes: Buffer; mime: string }[]>`
    SELECT bytes, mime FROM sales_proposal_documents WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { bytes: new Uint8Array(rows[0].bytes), mime: rows[0].mime };
}

/* ── Follow-ups ───────────────────────────────────────────────────── */

export interface ProposalFollowup {
  id: string;
  proposalId: string;
  stage: "first" | "second" | "final";
  dueAt: string;
  status: "open" | "done" | "cancelled";
  note: string;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
}

interface FollowupRow {
  id: string;
  proposal_id: string;
  stage: string;
  due_at: Date;
  status: string;
  note: string;
  completed_at: Date | null;
  completed_by: string | null;
  created_at: Date;
}

function followupRowTo(row: FollowupRow): ProposalFollowup {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    stage: row.stage as ProposalFollowup["stage"],
    dueAt: row.due_at.toISOString(),
    status: row.status as ProposalFollowup["status"],
    note: row.note,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    completedBy: row.completed_by,
    createdAt: row.created_at.toISOString(),
  };
}

export async function scheduleProposalFollowups(
  proposalId: string,
  sentAt: Date
): Promise<ProposalFollowup[]> {
  const sql = await db();
  if (!sql) return [];

  const stages: { stage: ProposalFollowup["stage"]; offsetDays: number }[] = [
    { stage: "first", offsetDays: 3 },
    { stage: "second", offsetDays: 7 },
    { stage: "final", offsetDays: 14 },
  ];
  const created: ProposalFollowup[] = [];
  for (const s of stages) {
    const id = newId("spfu");
    const due = new Date(sentAt.getTime() + s.offsetDays * 24 * 3600 * 1000);
    const rows = await sql<FollowupRow[]>`
      INSERT INTO sales_proposal_followups (id, proposal_id, stage, due_at, status, note)
      VALUES (${id}, ${proposalId}, ${s.stage}, ${due.toISOString()}, 'open', '')
      RETURNING id, proposal_id, stage, due_at, status, note, completed_at, completed_by, created_at
    `;
    if (rows[0]) created.push(followupRowTo(rows[0]));
  }
  return created;
}

export async function listOpenFollowups(): Promise<ProposalFollowup[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<FollowupRow[]>`
    SELECT id, proposal_id, stage, due_at, status, note, completed_at, completed_by, created_at
    FROM sales_proposal_followups
    WHERE status = 'open'
    ORDER BY due_at ASC
    LIMIT 200
  `;
  return rows.map(followupRowTo);
}

export async function completeFollowup(
  id: string,
  actorId: string | null,
  note?: string
): Promise<ProposalFollowup> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql<FollowupRow[]>`
    UPDATE sales_proposal_followups
    SET status = 'done', completed_at = NOW(), completed_by = ${actorId},
        note = COALESCE(${note ?? null}, note)
    WHERE id = ${id} AND status = 'open'
    RETURNING id, proposal_id, stage, due_at, status, note, completed_at, completed_by, created_at
  `;
  if (rows.length === 0) throw new SalesError("Follow-up nicht gefunden", "not_found", 404);
  return followupRowTo(rows[0]);
}
