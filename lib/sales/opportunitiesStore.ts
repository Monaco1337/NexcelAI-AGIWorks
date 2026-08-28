/**
 * Vertriebsmodul — Verkaufschancen (Opportunities).
 *
 * Eine Opportunity ist der markenkontextsensitive Vorgang zwischen
 * Bedarfsgespräch und Abschluss. Sie trägt Klassifizierung, Status,
 * Werterwartung, nächsten Schritt und den Brand-Kontext.
 */

import { db } from "@/lib/pg";
import {
  SalesError,
  newId,
  type BrandContext,
  type ContactOutcome,
  type LostReason,
  type NextAction,
  type SalesClassification,
  type SalesStatus,
} from "./model";

export interface SalesOpportunity {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  brandContext: BrandContext;
  status: SalesStatus;
  classification: SalesClassification | null;
  contactOutcome: ContactOutcome | null;
  nextAction: NextAction | null;
  nextActionDueAt: string | null;
  nextMeetingAt: string | null;
  expectedValueCents: number | null;
  proposalValueCents: number | null;
  currency: string;
  closeDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
  lostReason: LostReason | null;
  lostNotes: string | null;
  learning: string | null;
  wonAt: string | null;
  lostAt: string | null;
  deferredAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface Row {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  brand_context: string;
  status: string;
  classification: string | null;
  contact_outcome: string | null;
  next_action: string | null;
  next_action_due_at: Date | null;
  next_meeting_at: Date | null;
  expected_value_cents: string | null;
  proposal_value_cents: string | null;
  currency: string;
  close_date: Date | null;
  owner_id: string | null;
  owner_name: string | null;
  lost_reason: string | null;
  lost_notes: string | null;
  learning: string | null;
  won_at: Date | null;
  lost_at: Date | null;
  deferred_at: Date | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

function toBigIntNullable(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowTo(row: Row): SalesOpportunity {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    title: row.title,
    brandContext: (row.brand_context as BrandContext) ?? "nexcel",
    status: (row.status as SalesStatus) ?? "neu",
    classification: (row.classification as SalesClassification | null) ?? null,
    contactOutcome: (row.contact_outcome as ContactOutcome | null) ?? null,
    nextAction: (row.next_action as NextAction | null) ?? null,
    nextActionDueAt: row.next_action_due_at ? row.next_action_due_at.toISOString() : null,
    nextMeetingAt: row.next_meeting_at ? row.next_meeting_at.toISOString() : null,
    expectedValueCents: toBigIntNullable(row.expected_value_cents),
    proposalValueCents: toBigIntNullable(row.proposal_value_cents),
    currency: row.currency,
    closeDate: row.close_date ? row.close_date.toISOString().slice(0, 10) : null,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    lostReason: (row.lost_reason as LostReason | null) ?? null,
    lostNotes: row.lost_notes,
    learning: row.learning,
    wonAt: row.won_at ? row.won_at.toISOString() : null,
    lostAt: row.lost_at ? row.lost_at.toISOString() : null,
    deferredAt: row.deferred_at ? row.deferred_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
  };
}

const SELECT_COLUMNS = `
  o.id, o.company_id, c.name AS company_name, o.title, o.brand_context, o.status,
  o.classification, o.contact_outcome, o.next_action, o.next_action_due_at, o.next_meeting_at,
  o.expected_value_cents, o.proposal_value_cents, o.currency, o.close_date,
  o.owner_id, COALESCE(u.name, u.email) AS owner_name,
  o.lost_reason, o.lost_notes, o.learning,
  o.won_at, o.lost_at, o.deferred_at,
  o.created_at, o.updated_at, o.version
`;

export interface OpportunityQuery {
  companyId?: string;
  brandContext?: BrandContext | "all";
  status?: SalesStatus[];
  classification?: SalesClassification[];
  ownerId?: string;
  openOnly?: boolean;
  overdueOnly?: boolean;
  dueToday?: boolean;
  search?: string;
  limit?: number;
  cursor?: string;
}

export async function listOpportunities(query: OpportunityQuery = {}): Promise<{
  opportunities: SalesOpportunity[];
  nextCursor: string | null;
}> {
  const sql = await db();
  if (!sql) return { opportunities: [], nextCursor: null };

  const limit = Math.min(query.limit ?? 200, 1000);
  const status = query.status && query.status.length > 0 ? query.status : null;
  const classification =
    query.classification && query.classification.length > 0 ? query.classification : null;
  const brand = query.brandContext && query.brandContext !== "all" ? query.brandContext : null;
  const search = query.search?.trim() || null;
  const cursor = query.cursor ?? null;

  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_opportunities o
    JOIN sales_companies c ON c.id = o.company_id AND c.deleted_at IS NULL
    LEFT JOIN crm_users u ON u.id = o.owner_id
    WHERE o.deleted_at IS NULL
      AND (${query.companyId ?? null}::text IS NULL OR o.company_id = ${query.companyId ?? null})
      AND (${brand}::text IS NULL OR o.brand_context = ${brand})
      AND (${status}::text[] IS NULL OR o.status = ANY(${status}::text[]))
      AND (${classification}::text[] IS NULL OR o.classification = ANY(${classification}::text[]))
      AND (${query.ownerId ?? null}::text IS NULL OR o.owner_id = ${query.ownerId ?? null})
      AND (${query.openOnly ? true : false} = FALSE OR o.status NOT IN ('gewonnen','verloren','zurueckgestellt'))
      AND (${query.overdueOnly ? true : false} = FALSE OR (o.next_action_due_at IS NOT NULL AND o.next_action_due_at < NOW()))
      AND (${query.dueToday ? true : false} = FALSE OR (o.next_action_due_at IS NOT NULL AND o.next_action_due_at::date = CURRENT_DATE))
      AND (${search}::text IS NULL OR o.title ILIKE '%' || ${search} || '%' OR c.name ILIKE '%' || ${search} || '%')
      AND (${cursor}::timestamptz IS NULL OR o.updated_at < ${cursor}::timestamptz)
    ORDER BY o.updated_at DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(rowTo);
  return {
    opportunities: items,
    nextCursor: hasMore ? items[items.length - 1].updatedAt : null,
  };
}

export async function getOpportunity(id: string): Promise<SalesOpportunity | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_opportunities o
    JOIN sales_companies c ON c.id = o.company_id
    LEFT JOIN crm_users u ON u.id = o.owner_id
    WHERE o.id = ${id} AND o.deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ? rowTo(rows[0]) : null;
}

export interface CreateOpportunityInput {
  companyId: string;
  title: string;
  brandContext?: BrandContext;
  status?: SalesStatus;
  classification?: SalesClassification | null;
  expectedValueCents?: number | null;
  currency?: string;
  ownerId?: string | null;
  nextAction?: NextAction | null;
  nextActionDueAt?: string | null;
  nextMeetingAt?: string | null;
  createdBy?: string | null;
}

export async function createOpportunity(input: CreateOpportunityInput): Promise<SalesOpportunity> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const title = input.title?.trim();
  if (!title) throw new SalesError("Titel ist erforderlich", "invalid", 400);

  const id = newId("sopp");
  await sql`
    INSERT INTO sales_opportunities (
      id, company_id, title, brand_context, status, classification,
      expected_value_cents, currency, owner_id,
      next_action, next_action_due_at, next_meeting_at,
      created_by, updated_by
    ) VALUES (
      ${id}, ${input.companyId}, ${title}, ${input.brandContext ?? "nexcel"},
      ${input.status ?? "neu"}, ${input.classification ?? null},
      ${input.expectedValueCents ?? null}, ${input.currency ?? "EUR"},
      ${input.ownerId ?? null},
      ${input.nextAction ?? null}, ${input.nextActionDueAt ?? null}, ${input.nextMeetingAt ?? null},
      ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
  `;
  const result = await getOpportunity(id);
  if (!result) throw new SalesError("Konnte Opportunity nicht anlegen", "insert_failed", 500);
  return result;
}

export interface UpdateOpportunityInput {
  version: number;
  title?: string;
  brandContext?: BrandContext;
  status?: SalesStatus;
  classification?: SalesClassification | null;
  contactOutcome?: ContactOutcome | null;
  nextAction?: NextAction | null;
  nextActionDueAt?: string | null;
  nextMeetingAt?: string | null;
  expectedValueCents?: number | null;
  proposalValueCents?: number | null;
  currency?: string;
  closeDate?: string | null;
  ownerId?: string | null;
  lostReason?: LostReason | null;
  lostNotes?: string | null;
  learning?: string | null;
  wonAt?: string | null;
  lostAt?: string | null;
  deferredAt?: string | null;
  updatedBy?: string | null;
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput
): Promise<SalesOpportunity> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const rows = await sql`
    UPDATE sales_opportunities SET
      title                = COALESCE(${input.title ?? null}, title),
      brand_context        = COALESCE(${input.brandContext ?? null}, brand_context),
      status               = COALESCE(${input.status ?? null}, status),
      classification       = ${input.classification === undefined ? sql`classification` : input.classification},
      contact_outcome      = ${input.contactOutcome === undefined ? sql`contact_outcome` : input.contactOutcome},
      next_action          = ${input.nextAction === undefined ? sql`next_action` : input.nextAction},
      next_action_due_at   = ${input.nextActionDueAt === undefined ? sql`next_action_due_at` : input.nextActionDueAt},
      next_meeting_at      = ${input.nextMeetingAt === undefined ? sql`next_meeting_at` : input.nextMeetingAt},
      expected_value_cents = ${input.expectedValueCents === undefined ? sql`expected_value_cents` : input.expectedValueCents},
      proposal_value_cents = ${input.proposalValueCents === undefined ? sql`proposal_value_cents` : input.proposalValueCents},
      currency             = COALESCE(${input.currency ?? null}, currency),
      close_date           = ${input.closeDate === undefined ? sql`close_date` : input.closeDate},
      owner_id             = ${input.ownerId === undefined ? sql`owner_id` : input.ownerId},
      lost_reason          = ${input.lostReason === undefined ? sql`lost_reason` : input.lostReason},
      lost_notes           = ${input.lostNotes === undefined ? sql`lost_notes` : input.lostNotes},
      learning             = ${input.learning === undefined ? sql`learning` : input.learning},
      won_at               = ${input.wonAt === undefined ? sql`won_at` : input.wonAt},
      lost_at              = ${input.lostAt === undefined ? sql`lost_at` : input.lostAt},
      deferred_at          = ${input.deferredAt === undefined ? sql`deferred_at` : input.deferredAt},
      updated_by           = ${input.updatedBy ?? null},
      updated_at           = NOW(),
      version              = version + 1
    WHERE id = ${id} AND deleted_at IS NULL AND version = ${input.version}
    RETURNING id
  `;
  if (rows.length === 0) {
    const existing = await getOpportunity(id);
    if (!existing) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
    throw new SalesError("Konflikt: Opportunity wurde parallel geändert", "conflict", 409);
  }
  const result = await getOpportunity(id);
  if (!result) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
  return result;
}

export async function softDeleteOpportunity(id: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_opportunities SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL`;
}
