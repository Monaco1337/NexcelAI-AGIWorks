/**
 * Vertriebsmodul — zentrale Unternehmensakte.
 *
 * Jede Firma bekommt EIN Datensatzobjekt, das über den ganzen Vertrieb
 * hinweg gepflegt wird. Kontakte, Opportunities, Notizen und Angebote
 * hängen an der Firma. Der Datensatz ist markenübergreifend; die
 * Marken-Zugehörigkeit lebt in `sales_opportunities.brand_context`.
 */

import { db } from "@/lib/pg";
import {
  SalesError,
  newId,
  type SalesClassification,
  type SalesStatus,
  type ContactOutcome,
  type NextAction,
} from "./model";

export interface SalesCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string;
  source: string | null;
  classification: SalesClassification | null;
  status: SalesStatus;
  ownerId: string | null;
  ownerName: string | null;
  orgId: string | null;
  expectedValueCents: number | null;
  proposalValueCents: number | null;
  currency: string;
  lastContactAt: string | null;
  contactOutcome: ContactOutcome | null;
  nextAction: NextAction | null;
  nextActionDueAt: string | null;
  nextMeetingAt: string | null;
  notes: string;
  icpScore: number | null;
  icpEvidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
  contactCount: number;
  opportunityCount: number;
  openOpportunityCount: number;
}

interface Row {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string;
  source: string | null;
  classification: string | null;
  status: string;
  owner_id: string | null;
  owner_name: string | null;
  org_id: string | null;
  expected_value_cents: string | null;
  proposal_value_cents: string | null;
  currency: string;
  last_contact_at: Date | null;
  contact_outcome: string | null;
  next_action: string | null;
  next_action_due_at: Date | null;
  next_meeting_at: Date | null;
  notes: string;
  icp_score: number | null;
  icp_evidence: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  version: number;
  contact_count: string | number;
  opportunity_count: string | number;
  open_opportunity_count: string | number;
}

function toBigIntNullable(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowTo(row: Row): SalesCompany {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    industry: row.industry,
    city: row.city,
    country: row.country,
    source: row.source,
    classification: (row.classification as SalesClassification | null) ?? null,
    status: (row.status as SalesStatus) ?? "neu",
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    orgId: row.org_id,
    expectedValueCents: toBigIntNullable(row.expected_value_cents),
    proposalValueCents: toBigIntNullable(row.proposal_value_cents),
    currency: row.currency,
    lastContactAt: row.last_contact_at ? row.last_contact_at.toISOString() : null,
    contactOutcome: (row.contact_outcome as ContactOutcome | null) ?? null,
    nextAction: (row.next_action as NextAction | null) ?? null,
    nextActionDueAt: row.next_action_due_at ? row.next_action_due_at.toISOString() : null,
    nextMeetingAt: row.next_meeting_at ? row.next_meeting_at.toISOString() : null,
    notes: row.notes ?? "",
    icpScore: row.icp_score,
    icpEvidence: row.icp_evidence ?? {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
    contactCount: Number(row.contact_count) || 0,
    opportunityCount: Number(row.opportunity_count) || 0,
    openOpportunityCount: Number(row.open_opportunity_count) || 0,
  };
}

const SELECT_COLUMNS = `
  c.id, c.name, c.website, c.industry, c.city, c.country, c.source,
  c.classification, c.status, c.owner_id,
  COALESCE(u.name, u.email) AS owner_name,
  c.org_id,
  c.expected_value_cents, c.proposal_value_cents, c.currency,
  c.last_contact_at, c.contact_outcome, c.next_action,
  c.next_action_due_at, c.next_meeting_at, c.notes,
  c.icp_score, c.icp_evidence,
  c.created_at, c.updated_at, c.version,
  (SELECT COUNT(*) FROM sales_contacts sc WHERE sc.company_id = c.id AND sc.deleted_at IS NULL) AS contact_count,
  (SELECT COUNT(*) FROM sales_opportunities so WHERE so.company_id = c.id AND so.deleted_at IS NULL) AS opportunity_count,
  (SELECT COUNT(*) FROM sales_opportunities so2 WHERE so2.company_id = c.id AND so2.deleted_at IS NULL
     AND so2.status NOT IN ('gewonnen','verloren','zurueckgestellt')) AS open_opportunity_count
`;

export interface CompanyQuery {
  search?: string;
  status?: SalesStatus[];
  classification?: SalesClassification[];
  ownerId?: string;
  ownerFilter?: "any" | "me" | "unassigned";
  currentUserId?: string;
  overdueOnly?: boolean;
  dueToday?: boolean;
  limit?: number;
  cursor?: string;
}

export async function listCompanies(query: CompanyQuery = {}): Promise<{
  companies: SalesCompany[];
  nextCursor: string | null;
}> {
  const sql = await db();
  if (!sql) return { companies: [], nextCursor: null };

  const limit = Math.min(query.limit ?? 100, 500);
  const search = query.search?.trim() || null;
  const status = query.status && query.status.length > 0 ? query.status : null;
  const classification =
    query.classification && query.classification.length > 0 ? query.classification : null;
  const ownerId =
    query.ownerFilter === "me" ? query.currentUserId ?? null : query.ownerId ?? null;
  const unassigned = query.ownerFilter === "unassigned";
  const overdue = !!query.overdueOnly;
  const dueToday = !!query.dueToday;
  const cursor = query.cursor ?? null;

  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_companies c
    LEFT JOIN crm_users u ON u.id = c.owner_id
    WHERE c.deleted_at IS NULL
      AND (${search}::text IS NULL OR c.search_vector @@ plainto_tsquery('german', ${search}))
      AND (${status}::text[] IS NULL OR c.status = ANY(${status}::text[]))
      AND (${classification}::text[] IS NULL OR c.classification = ANY(${classification}::text[]))
      AND (${unassigned ? true : false} = FALSE OR c.owner_id IS NULL)
      AND (${ownerId}::text IS NULL OR c.owner_id = ${ownerId}::text)
      AND (${overdue ? true : false} = FALSE OR (c.next_action_due_at IS NOT NULL AND c.next_action_due_at < NOW()))
      AND (${dueToday ? true : false} = FALSE OR (c.next_action_due_at IS NOT NULL AND c.next_action_due_at::date = CURRENT_DATE))
      AND (${cursor}::timestamptz IS NULL OR c.updated_at < ${cursor}::timestamptz)
    ORDER BY c.updated_at DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(rowTo);
  return {
    companies: items,
    nextCursor: hasMore ? items[items.length - 1].updatedAt : null,
  };
}

export async function getCompany(id: string): Promise<SalesCompany | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_companies c
    LEFT JOIN crm_users u ON u.id = c.owner_id
    WHERE c.id = ${id} AND c.deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ? rowTo(rows[0]) : null;
}

export interface CreateCompanyInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  city?: string | null;
  country?: string | null;
  source?: string | null;
  classification?: SalesClassification | null;
  status?: SalesStatus;
  ownerId?: string | null;
  orgId?: string | null;
  nextAction?: NextAction | null;
  nextActionDueAt?: string | null;
  notes?: string;
  icpScore?: number | null;
  icpEvidence?: Record<string, unknown>;
  createdBy?: string | null;
}

export async function createCompany(input: CreateCompanyInput): Promise<SalesCompany> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const name = input.name?.trim();
  if (!name) throw new SalesError("Name ist erforderlich", "invalid", 400);

  const id = newId("scomp");
  await sql`
    INSERT INTO sales_companies (
      id, name, website, industry, city, country, source, classification, status,
      owner_id, org_id, next_action, next_action_due_at, notes, icp_score, icp_evidence,
      created_by, updated_by
    ) VALUES (
      ${id}, ${name}, ${input.website ?? null}, ${input.industry ?? null},
      ${input.city ?? null}, ${input.country ?? "DE"}, ${input.source ?? null},
      ${input.classification ?? null}, ${input.status ?? "neu"},
      ${input.ownerId ?? null}, ${input.orgId ?? null},
      ${input.nextAction ?? null}, ${input.nextActionDueAt ?? null},
      ${input.notes ?? ""}, ${input.icpScore ?? null},
      ${JSON.stringify(input.icpEvidence ?? {})}::jsonb,
      ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
  `;
  const result = await getCompany(id);
  if (!result) throw new SalesError("Konnte Firma nicht anlegen", "insert_failed", 500);
  return result;
}

export interface UpdateCompanyInput {
  version: number;
  name?: string;
  website?: string | null;
  industry?: string | null;
  city?: string | null;
  country?: string | null;
  source?: string | null;
  classification?: SalesClassification | null;
  status?: SalesStatus;
  ownerId?: string | null;
  orgId?: string | null;
  expectedValueCents?: number | null;
  proposalValueCents?: number | null;
  currency?: string;
  lastContactAt?: string | null;
  contactOutcome?: ContactOutcome | null;
  nextAction?: NextAction | null;
  nextActionDueAt?: string | null;
  nextMeetingAt?: string | null;
  notes?: string;
  icpScore?: number | null;
  icpEvidence?: Record<string, unknown>;
  updatedBy?: string | null;
}

/** Optimistisches Update. Wirft `409` bei Versionskonflikt. */
export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<SalesCompany> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const rows = await sql`
    UPDATE sales_companies SET
      name                 = COALESCE(${input.name ?? null}, name),
      website              = COALESCE(${input.website ?? null}, website),
      industry             = COALESCE(${input.industry ?? null}, industry),
      city                 = COALESCE(${input.city ?? null}, city),
      country              = COALESCE(${input.country ?? null}, country),
      source               = COALESCE(${input.source ?? null}, source),
      classification       = ${input.classification === undefined ? sql`classification` : input.classification},
      status               = COALESCE(${input.status ?? null}, status),
      owner_id             = ${input.ownerId === undefined ? sql`owner_id` : input.ownerId},
      org_id               = ${input.orgId === undefined ? sql`org_id` : input.orgId},
      expected_value_cents = ${input.expectedValueCents === undefined ? sql`expected_value_cents` : input.expectedValueCents},
      proposal_value_cents = ${input.proposalValueCents === undefined ? sql`proposal_value_cents` : input.proposalValueCents},
      currency             = COALESCE(${input.currency ?? null}, currency),
      last_contact_at      = ${input.lastContactAt === undefined ? sql`last_contact_at` : input.lastContactAt},
      contact_outcome      = ${input.contactOutcome === undefined ? sql`contact_outcome` : input.contactOutcome},
      next_action          = ${input.nextAction === undefined ? sql`next_action` : input.nextAction},
      next_action_due_at   = ${input.nextActionDueAt === undefined ? sql`next_action_due_at` : input.nextActionDueAt},
      next_meeting_at      = ${input.nextMeetingAt === undefined ? sql`next_meeting_at` : input.nextMeetingAt},
      notes                = COALESCE(${input.notes ?? null}, notes),
      icp_score            = ${input.icpScore === undefined ? sql`icp_score` : input.icpScore},
      icp_evidence         = ${input.icpEvidence === undefined ? sql`icp_evidence` : sql`${JSON.stringify(input.icpEvidence ?? {})}::jsonb`},
      updated_by           = ${input.updatedBy ?? null},
      updated_at           = NOW(),
      version              = version + 1
    WHERE id = ${id} AND deleted_at IS NULL AND version = ${input.version}
    RETURNING id
  `;
  if (rows.length === 0) {
    // Prüfen ob es die Firma überhaupt gibt.
    const existing = await getCompany(id);
    if (!existing) throw new SalesError("Firma nicht gefunden", "not_found", 404);
    throw new SalesError("Konflikt: Firma wurde parallel geändert", "conflict", 409);
  }
  const result = await getCompany(id);
  if (!result) throw new SalesError("Firma nicht gefunden", "not_found", 404);
  return result;
}

export async function softDeleteCompany(id: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_companies SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL`;
}
