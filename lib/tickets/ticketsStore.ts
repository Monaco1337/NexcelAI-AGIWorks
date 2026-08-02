/**
 * Datenzugriff für Tickets.
 *
 * Leitlinien:
 *  - Jede Liste liefert Bearbeiter- und Meldernamen per JOIN mit. Würde die
 *    Oberfläche die Namen einzeln nachladen, entstünde bei 50 Zeilen genau das
 *    N+1-Muster, das hier ausgeschlossen sein soll.
 *  - Blättern über Keyset, nicht über OFFSET. OFFSET wird bei wachsender
 *    Tabelle linear langsamer, weil Postgres die übersprungenen Zeilen
 *    trotzdem liest.
 *  - Jeder schreibende Vorgang läuft in einer Transaktion zusammen mit seinem
 *    Audit-Eintrag. Ein Statuswechsel ohne Protokoll darf nicht bestehen.
 *  - Optimistische Sperre über `version`: zwei gleichzeitig geöffnete Masken
 *    überschreiben sich nicht gegenseitig, die zweite bekommt einen Konflikt.
 *  - Binärdaten von Anhängen werden NIE in Listenabfragen gelesen.
 */

import { db } from "@/lib/pg";
import type { Tx } from "@/lib/db/migrationRunner";
import { writeAuditTx, type AuditActor } from "@/lib/audit/auditLog";
import {
  canTransition,
  isOpenStatus,
  type TicketPriority,
  type TicketRelation,
  type TicketSeverity,
  type TicketSource,
  type TicketStatus,
  type TicketType,
  type TicketVisibility,
} from "./model";

/* ── Typen ──────────────────────────────────────────────────────────── */

export interface TicketPerson {
  id: string;
  name: string;
  email: string;
}

export interface Ticket {
  id: string;
  key: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity | null;
  title: string;
  description: string;
  brand: string;
  orgId: string | null;
  orgName: string | null;
  requester: TicketPerson | null;
  assignee: TicketPerson | null;
  source: TicketSource;
  labels: string[];
  visibility: TicketVisibility;
  dueAt: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaResolutionDueAt: string | null;
  slaBreached: boolean;
  archivedAt: string | null;
  deletedAt: string | null;
  version: number;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: TicketPerson | null;
  body: string;
  isInternal: boolean;
  editedAt: string | null;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  commentId: string | null;
  filename: string;
  contentType: string;
  byteSize: number;
  uploadedBy: TicketPerson | null;
  createdAt: string;
}

export interface TicketRelationEntry {
  id: string;
  relation: TicketRelation;
  /** Das jeweils andere Ticket, aus Sicht des abgefragten. */
  ticket: { id: string; key: string; title: string; status: TicketStatus };
  /** True, wenn das abgefragte Ticket die Quelle der Beziehung ist. */
  outgoing: boolean;
  createdAt: string;
}

/* ── Zeilenabbildung ────────────────────────────────────────────────── */

interface TicketRow {
  id: string;
  key: string;
  type: string;
  status: string;
  priority: string;
  severity: string | null;
  title: string;
  description: string;
  brand: string;
  org_id: string | null;
  org_name: string | null;
  requester_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  source: string;
  labels: string[];
  visibility: string;
  due_at: Date | null;
  first_response_at: Date | null;
  resolved_at: Date | null;
  closed_at: Date | null;
  sla_resolution_due_at: Date | null;
  sla_breached: boolean;
  archived_at: Date | null;
  deleted_at: Date | null;
  version: number;
  comment_count: number;
  attachment_count: number;
  created_at: Date;
  updated_at: Date;
}

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

function person(
  id: string | null,
  name: string | null,
  email: string | null
): TicketPerson | null {
  if (!id) return null;
  return { id, name: name ?? "", email: email ?? "" };
}

function rowToTicket(r: TicketRow): Ticket {
  return {
    id: r.id,
    key: r.key,
    type: r.type as TicketType,
    status: r.status as TicketStatus,
    priority: r.priority as TicketPriority,
    severity: (r.severity as TicketSeverity | null) ?? null,
    title: r.title,
    description: r.description,
    brand: r.brand,
    orgId: r.org_id,
    orgName: r.org_name,
    requester: person(r.requester_id, r.requester_name, r.requester_email),
    assignee: person(r.assignee_id, r.assignee_name, r.assignee_email),
    source: r.source as TicketSource,
    labels: r.labels ?? [],
    visibility: r.visibility as TicketVisibility,
    dueAt: iso(r.due_at),
    firstResponseAt: iso(r.first_response_at),
    resolvedAt: iso(r.resolved_at),
    closedAt: iso(r.closed_at),
    slaResolutionDueAt: iso(r.sla_resolution_due_at),
    slaBreached: r.sla_breached,
    archivedAt: iso(r.archived_at),
    deletedAt: iso(r.deleted_at),
    version: r.version,
    commentCount: Number(r.comment_count ?? 0),
    attachmentCount: Number(r.attachment_count ?? 0),
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

/**
 * Gemeinsame Auswahl für Ticketabfragen. Die Zählungen laufen als
 * Sub-Selects statt als GROUP BY über zwei LEFT JOINs — mit zwei Joins würde
 * jede Kommentarzeile die Anhangszeilen vervielfachen und die Zählung
 * verfälschen.
 */
const TICKET_SELECT = `
  t.id, t.key, t.type, t.status, t.priority, t.severity, t.title, t.description,
  t.brand, t.org_id, o.name AS org_name,
  t.requester_id, ru.name AS requester_name, ru.email AS requester_email,
  t.assignee_id, au.name AS assignee_name, au.email AS assignee_email,
  t.source, t.labels, t.visibility,
  t.due_at, t.first_response_at, t.resolved_at, t.closed_at,
  t.sla_resolution_due_at, t.sla_breached,
  t.archived_at, t.deleted_at, t.version,
  (SELECT COUNT(*) FROM ticket_comments c WHERE c.ticket_id = t.id AND c.deleted_at IS NULL) AS comment_count,
  (SELECT COUNT(*) FROM ticket_attachments a WHERE a.ticket_id = t.id) AS attachment_count,
  t.created_at, t.updated_at
`;

const TICKET_JOINS = `
  FROM tickets t
  LEFT JOIN crm_users ru ON ru.id = t.requester_id
  LEFT JOIN crm_users au ON au.id = t.assignee_id
  LEFT JOIN crm_organizations o ON o.id = t.org_id
`;

/* ── Lesen ──────────────────────────────────────────────────────────── */

export interface TicketFilter {
  status?: TicketStatus[];
  type?: TicketType[];
  priority?: TicketPriority[];
  assigneeId?: string | null;
  requesterId?: string;
  orgId?: string;
  brand?: string;
  labels?: string[];
  /** Volltextsuche über Titel, Beschreibung und Ticketnummer. */
  search?: string;
  /** Standardmäßig werden archivierte Tickets ausgeblendet. */
  includeArchived?: boolean;
  /** Papierkorb: nur gelöschte Tickets. */
  onlyDeleted?: boolean;
  /** Nur offene (nicht gelöste/geschlossene) Tickets. */
  openOnly?: boolean;
}

export interface TicketPage {
  tickets: Ticket[];
  nextCursor: string | null;
  /** Gesamtzahl passender Tickets, unabhängig von der Seitengröße. */
  total: number;
}

/**
 * Cursor kodiert Zeitstempel und ID der letzten Zeile. Die ID ist nötig,
 * weil zwei Tickets in derselben Millisekunde entstehen können und sonst
 * eines beim Blättern übersprungen würde.
 */
function encodeCursor(t: Ticket): string {
  return Buffer.from(`${t.createdAt}|${t.id}`).toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const sep = raw.lastIndexOf("|");
    if (sep < 0) return null;
    const createdAt = raw.slice(0, sep);
    const id = raw.slice(sep + 1);
    if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export async function listTickets(
  filter: TicketFilter = {},
  options: { limit?: number; cursor?: string } = {}
): Promise<TicketPage> {
  const sql = await db();
  if (!sql) return { tickets: [], nextCursor: null, total: 0 };

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const search = filter.search?.trim() || null;

  // websearch_to_tsquery versteht Anführungszeichen und "or" und wirft bei
  // unvollständiger Eingabe keinen Fehler — anders als to_tsquery, das bei
  // einem einzelnen Sonderzeichen die Abfrage abbrechen würde.
  const rows = await sql<(TicketRow & { total_count: number })[]>`
    WITH filtered AS (
      SELECT ${sql.unsafe(TICKET_SELECT)}
      ${sql.unsafe(TICKET_JOINS)}
      WHERE (${filter.onlyDeleted === true} = TRUE AND t.deleted_at IS NOT NULL
             OR ${filter.onlyDeleted === true} = FALSE AND t.deleted_at IS NULL)
        AND (${filter.includeArchived === true} = TRUE OR t.archived_at IS NULL)
        AND (${filter.status == null} OR t.status = ANY(${filter.status ?? []}::text[]))
        AND (${filter.type == null} OR t.type = ANY(${filter.type ?? []}::text[]))
        AND (${filter.priority == null} OR t.priority = ANY(${filter.priority ?? []}::text[]))
        AND (${filter.assigneeId === undefined}
             OR (${filter.assigneeId === null} AND t.assignee_id IS NULL)
             OR t.assignee_id = ${filter.assigneeId ?? null})
        AND (${filter.requesterId ?? null}::text IS NULL OR t.requester_id = ${filter.requesterId ?? null})
        AND (${filter.orgId ?? null}::text IS NULL OR t.org_id = ${filter.orgId ?? null})
        AND (${filter.brand ?? null}::text IS NULL OR t.brand = ${filter.brand ?? null})
        AND (${filter.labels == null} OR t.labels && ${filter.labels ?? []}::text[])
        AND (${filter.openOnly !== true} OR t.status NOT IN ('resolved','closed','cancelled'))
        AND (${search}::text IS NULL OR t.search_vector @@ websearch_to_tsquery('german', ${search}))
    )
    SELECT *, (SELECT COUNT(*) FROM filtered)::int AS total_count
    FROM filtered
    WHERE (${cursor === null}
           OR (created_at, id) < (${cursor?.createdAt ?? null}::timestamptz, ${cursor?.id ?? ""}))
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit + 1}
  `;

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const hasMore = rows.length > limit;
  const tickets = rows.slice(0, limit).map(rowToTicket);

  return {
    tickets,
    nextCursor: hasMore && tickets.length > 0 ? encodeCursor(tickets[tickets.length - 1]) : null,
    total,
  };
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<TicketRow[]>`
    SELECT ${sql.unsafe(TICKET_SELECT)}
    ${sql.unsafe(TICKET_JOINS)}
    WHERE t.id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToTicket(rows[0]) : null;
}

export async function getTicketByKey(key: string): Promise<Ticket | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<TicketRow[]>`
    SELECT ${sql.unsafe(TICKET_SELECT)}
    ${sql.unsafe(TICKET_JOINS)}
    WHERE t.key = ${key.toUpperCase()}
    LIMIT 1
  `;
  return rows[0] ? rowToTicket(rows[0]) : null;
}

/** Kennzahlen für das Dashboard — eine Abfrage statt sechs Zählungen. */
export interface TicketStats {
  open: number;
  unassigned: number;
  overdue: number;
  critical: number;
  resolvedLast7Days: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export async function getTicketStats(brand?: string): Promise<TicketStats> {
  const sql = await db();
  if (!sql) {
    return {
      open: 0, unassigned: 0, overdue: 0, critical: 0,
      resolvedLast7Days: 0, byStatus: {}, byType: {},
    };
  }

  const [totals] = await sql<
    {
      open: number; unassigned: number; overdue: number;
      critical: number; resolved_7d: number;
    }[]
  >`
    SELECT
      COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed','cancelled'))::int AS open,
      COUNT(*) FILTER (WHERE assignee_id IS NULL AND status NOT IN ('resolved','closed','cancelled'))::int AS unassigned,
      COUNT(*) FILTER (WHERE due_at < NOW() AND status NOT IN ('resolved','closed','cancelled'))::int AS overdue,
      COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved','closed','cancelled'))::int AS critical,
      COUNT(*) FILTER (WHERE resolved_at > NOW() - INTERVAL '7 days')::int AS resolved_7d
    FROM tickets
    WHERE deleted_at IS NULL AND archived_at IS NULL
      AND (${brand ?? null}::text IS NULL OR brand = ${brand ?? null})
  `;

  const statusRows = await sql<{ status: string; count: number }[]>`
    SELECT status, COUNT(*)::int AS count FROM tickets
    WHERE deleted_at IS NULL AND archived_at IS NULL
      AND (${brand ?? null}::text IS NULL OR brand = ${brand ?? null})
    GROUP BY status
  `;
  const typeRows = await sql<{ type: string; count: number }[]>`
    SELECT type, COUNT(*)::int AS count FROM tickets
    WHERE deleted_at IS NULL AND archived_at IS NULL
      AND status NOT IN ('resolved','closed','cancelled')
      AND (${brand ?? null}::text IS NULL OR brand = ${brand ?? null})
    GROUP BY type
  `;

  return {
    open: totals?.open ?? 0,
    unassigned: totals?.unassigned ?? 0,
    overdue: totals?.overdue ?? 0,
    critical: totals?.critical ?? 0,
    resolvedLast7Days: totals?.resolved_7d ?? 0,
    byStatus: Object.fromEntries(statusRows.map((r) => [r.status, r.count])),
    byType: Object.fromEntries(typeRows.map((r) => [r.type, r.count])),
  };
}

/* ── Schreiben ──────────────────────────────────────────────────────── */

export class TicketConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TicketConflictError";
  }
}

export class TicketValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TicketValidationError";
  }
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Prüft, ob eine Nutzer-ID in `crm_users` existiert, und gibt sonst NULL zurück.
 *
 * Notwendig, weil die Spiegelung der Nutzer erst beim Login greift: eine
 * Sitzung aus der Zeit davor trägt eine ID, die es in `crm_users` noch nicht
 * gibt. Ohne diese Prüfung würde der Fremdschlüssel greifen und das Anlegen
 * eines Tickets mit einem Serverfehler abbrechen, statt es einfach ohne
 * Personenbezug zu speichern.
 */
async function knownUserId(tx: Tx, id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const rows = await tx<{ id: string }[]>`
    SELECT id FROM crm_users WHERE id = ${id} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export interface CreateTicketInput {
  type: TicketType;
  title: string;
  description?: string;
  priority?: TicketPriority;
  severity?: TicketSeverity | null;
  brand?: string;
  orgId?: string | null;
  requesterId?: string | null;
  assigneeId?: string | null;
  labels?: string[];
  visibility?: TicketVisibility;
  dueAt?: string | null;
  source?: TicketSource;
}

export async function createTicket(
  input: CreateTicketInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<Ticket | null> {
  const sql = await db();
  if (!sql) return null;

  const title = input.title.trim();
  if (!title) throw new TicketValidationError("Titel darf nicht leer sein");

  const id = newId("tkt");

  await sql.begin(async (tx) => {
    // Nummer und Ticket in derselben Transaktion: bricht das Insert ab, ist
    // auch die Nummer nicht verbraucht. UPDATE ... RETURNING sperrt die Zeile
    // und serialisiert damit gleichzeitige Anlagen.
    const [counter] = await tx<{ value: number }[]>`
      UPDATE ticket_counters SET value = value + 1
      WHERE scope = 'ticket'
      RETURNING value
    `;
    const key = `TIC-${1000 + (counter?.value ?? 1)}`;

    const [actorId, requesterId, assigneeId] = await Promise.all([
      knownUserId(tx, actor.id),
      knownUserId(tx, input.requesterId ?? actor.id),
      knownUserId(tx, input.assigneeId),
    ]);

    await tx`
      INSERT INTO tickets (
        id, key, type, status, priority, severity, title, description,
        brand, org_id, requester_id, assignee_id, source, labels, visibility,
        due_at, created_by, updated_by
      ) VALUES (
        ${id}, ${key}, ${input.type}, 'new', ${input.priority ?? "normal"},
        ${input.severity ?? null}, ${title}, ${input.description ?? ""},
        ${input.brand ?? "nexcel"}, ${input.orgId ?? null},
        ${requesterId}, ${assigneeId},
        ${input.source ?? "manual"}, ${input.labels ?? []},
        ${input.visibility ?? "internal"}, ${input.dueAt ?? null},
        ${actorId}, ${actorId}
      )
    `;

    await writeAuditTx(tx, {
      actor,
      action: "ticket.created",
      entityType: "ticket",
      entityId: id,
      after: {
        key,
        type: input.type,
        title,
        priority: input.priority ?? "normal",
        assigneeId,
      },
      ...meta,
    });
  });

  return getTicket(id);
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  severity?: TicketSeverity | null;
  assigneeId?: string | null;
  orgId?: string | null;
  labels?: string[];
  visibility?: TicketVisibility;
  dueAt?: string | null;
  /** Erwartete Version — schützt vor dem Überschreiben fremder Änderungen. */
  expectedVersion?: number;
}

export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<Ticket | null> {
  const sql = await db();
  if (!sql) return null;

  await sql.begin(async (tx) => {
    const [current] = await tx<
      {
        version: number; title: string; description: string; type: string;
        priority: string; severity: string | null; assignee_id: string | null;
        org_id: string | null; labels: string[]; visibility: string; due_at: Date | null;
      }[]
    >`
      SELECT version, title, description, type, priority, severity,
             assignee_id, org_id, labels, visibility, due_at
      FROM tickets WHERE id = ${id} AND deleted_at IS NULL
      FOR UPDATE
    `;
    if (!current) throw new TicketValidationError("Ticket nicht gefunden");

    if (
      input.expectedVersion !== undefined &&
      input.expectedVersion !== current.version
    ) {
      throw new TicketConflictError(
        "Das Ticket wurde zwischenzeitlich geändert. Bitte neu laden."
      );
    }

    const title = input.title !== undefined ? input.title.trim() : undefined;
    if (title !== undefined && !title) {
      throw new TicketValidationError("Titel darf nicht leer sein");
    }

    const actorId = await knownUserId(tx, actor.id);

    // Ein gesetzter, aber unbekannter Bearbeiter ist ein Eingabefehler und
    // darf nicht stillschweigend zu "nicht zugewiesen" werden.
    if (input.assigneeId && !(await knownUserId(tx, input.assigneeId))) {
      throw new TicketValidationError("Der gewählte Bearbeiter existiert nicht");
    }

    await tx`
      UPDATE tickets SET
        title       = COALESCE(${title ?? null}, title),
        description = COALESCE(${input.description ?? null}, description),
        type        = COALESCE(${input.type ?? null}, type),
        priority    = COALESCE(${input.priority ?? null}, priority),
        severity    = ${input.severity === undefined ? sql`severity` : input.severity},
        assignee_id = ${input.assigneeId === undefined ? sql`assignee_id` : input.assigneeId},
        org_id      = ${input.orgId === undefined ? sql`org_id` : input.orgId},
        labels      = COALESCE(${input.labels ?? null}::text[], labels),
        visibility  = COALESCE(${input.visibility ?? null}, visibility),
        due_at      = ${input.dueAt === undefined ? sql`due_at` : input.dueAt},
        version     = version + 1,
        updated_by  = ${actorId},
        updated_at  = NOW()
      WHERE id = ${id}
    `;

    const [next] = await tx<
      {
        title: string; description: string; type: string; priority: string;
        severity: string | null; assignee_id: string | null; org_id: string | null;
        labels: string[]; visibility: string; due_at: Date | null;
      }[]
    >`
      SELECT title, description, type, priority, severity, assignee_id,
             org_id, labels, visibility, due_at
      FROM tickets WHERE id = ${id}
    `;

    // Nur geänderte Felder protokollieren — sonst steht in jedem Eintrag das
    // gesamte Ticket und der Verlauf wird unlesbar.
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const compare: [string, unknown, unknown][] = [
      ["title", current.title, next.title],
      ["description", current.description, next.description],
      ["type", current.type, next.type],
      ["priority", current.priority, next.priority],
      ["severity", current.severity, next.severity],
      ["assigneeId", current.assignee_id, next.assignee_id],
      ["orgId", current.org_id, next.org_id],
      ["labels", current.labels, next.labels],
      ["visibility", current.visibility, next.visibility],
      ["dueAt", iso(current.due_at), iso(next.due_at)],
    ];
    for (const [field, a, b] of compare) {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        before[field] = a;
        after[field] = b;
      }
    }

    if (Object.keys(after).length > 0) {
      // Zuweisung gesondert kennzeichnen: das ist die Aktion, nach der im
      // Verlauf am häufigsten gesucht wird.
      const action =
        Object.keys(after).length === 1 && "assigneeId" in after
          ? "ticket.assigned"
          : "ticket.updated";
      await writeAuditTx(tx, {
        actor, action, entityType: "ticket", entityId: id, before, after, ...meta,
      });
    }
  });

  return getTicket(id);
}

export async function transitionTicket(
  id: string,
  to: TicketStatus,
  actor: AuditActor,
  options: { reason?: string; expectedVersion?: number } = {},
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<Ticket | null> {
  const sql = await db();
  if (!sql) return null;

  await sql.begin(async (tx) => {
    const [current] = await tx<
      { status: string; version: number; first_response_at: Date | null }[]
    >`
      SELECT status, version, first_response_at FROM tickets
      WHERE id = ${id} AND deleted_at IS NULL
      FOR UPDATE
    `;
    if (!current) throw new TicketValidationError("Ticket nicht gefunden");

    if (
      options.expectedVersion !== undefined &&
      options.expectedVersion !== current.version
    ) {
      throw new TicketConflictError(
        "Das Ticket wurde zwischenzeitlich geändert. Bitte neu laden."
      );
    }

    const from = current.status as TicketStatus;
    if (from === to) return;

    if (!canTransition(from, to)) {
      throw new TicketValidationError(
        `Wechsel von "${from}" nach "${to}" ist nicht vorgesehen`
      );
    }

    // Zeitstempel folgen dem Zustand: wird ein Ticket wieder geöffnet, müssen
    // resolved_at und closed_at zurückgesetzt werden, sonst stimmen sämtliche
    // Auswertungen zur Bearbeitungsdauer nicht mehr.
    const reopening = isOpenStatus(to);
    const actorId = await knownUserId(tx, actor.id);

    await tx`
      UPDATE tickets SET
        status      = ${to},
        resolved_at = ${
          to === "resolved" || to === "closed"
            ? sql`COALESCE(resolved_at, NOW())`
            : reopening
              ? null
              : sql`resolved_at`
        },
        closed_at   = ${
          to === "closed" ? sql`NOW()` : reopening ? null : sql`closed_at`
        },
        version     = version + 1,
        updated_by  = ${actorId},
        updated_at  = NOW()
      WHERE id = ${id}
    `;

    await writeAuditTx(tx, {
      actor,
      action: "ticket.status_changed",
      entityType: "ticket",
      entityId: id,
      before: { status: from },
      after: { status: to },
      context: options.reason ? { reason: options.reason } : {},
      ...meta,
    });
  });

  return getTicket(id);
}

/* ── Archivieren, Löschen, Wiederherstellen ─────────────────────────── */

async function setLifecycle(
  id: string,
  field: "archived_at" | "deleted_at",
  value: "now" | null,
  action: string,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null }
): Promise<Ticket | null> {
  const sql = await db();
  if (!sql) return null;

  await sql.begin(async (tx) => {
    const [exists] = await tx<{ id: string }[]>`
      SELECT id FROM tickets WHERE id = ${id} FOR UPDATE
    `;
    if (!exists) throw new TicketValidationError("Ticket nicht gefunden");

    const actorId = await knownUserId(tx, actor.id);

    if (field === "archived_at") {
      await tx`
        UPDATE tickets SET archived_at = ${value === "now" ? sql`NOW()` : null},
          version = version + 1, updated_by = ${actorId}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      await tx`
        UPDATE tickets SET deleted_at = ${value === "now" ? sql`NOW()` : null},
          version = version + 1, updated_by = ${actorId}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    await writeAuditTx(tx, {
      actor, action, entityType: "ticket", entityId: id, ...meta,
    });
  });

  return getTicket(id);
}

export const archiveTicket = (id: string, actor: AuditActor, meta = {}) =>
  setLifecycle(id, "archived_at", "now", "ticket.archived", actor, meta);

export const unarchiveTicket = (id: string, actor: AuditActor, meta = {}) =>
  setLifecycle(id, "archived_at", null, "ticket.unarchived", actor, meta);

/** Weiches Löschen — das Ticket landet im Papierkorb und bleibt wiederherstellbar. */
export const softDeleteTicket = (id: string, actor: AuditActor, meta = {}) =>
  setLifecycle(id, "deleted_at", "now", "ticket.deleted", actor, meta);

export const restoreTicket = (id: string, actor: AuditActor, meta = {}) =>
  setLifecycle(id, "deleted_at", null, "ticket.restored", actor, meta);

/* ── Massenvorgänge ─────────────────────────────────────────────────── */

export interface BulkResult {
  updated: string[];
  failed: { id: string; reason: string }[];
}

/**
 * Massenvorgang über mehrere Tickets. Jedes Ticket wird einzeln behandelt,
 * damit ein einzelner unzulässiger Statuswechsel nicht den gesamten Vorgang
 * verwirft — der Aufrufer bekommt eine genaue Aufstellung zurück.
 */
export async function bulkUpdate(
  ids: string[],
  operation:
    | { kind: "status"; status: TicketStatus }
    | { kind: "assign"; assigneeId: string | null }
    | { kind: "priority"; priority: TicketPriority }
    | { kind: "archive" }
    | { kind: "delete" },
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<BulkResult> {
  const result: BulkResult = { updated: [], failed: [] };
  const batchId = newId("bulk");

  for (const id of ids.slice(0, 500)) {
    try {
      switch (operation.kind) {
        case "status":
          await transitionTicket(id, operation.status, actor, {}, meta);
          break;
        case "assign":
          await updateTicket(id, { assigneeId: operation.assigneeId }, actor, meta);
          break;
        case "priority":
          await updateTicket(id, { priority: operation.priority }, actor, meta);
          break;
        case "archive":
          await archiveTicket(id, actor, meta);
          break;
        case "delete":
          await softDeleteTicket(id, actor, meta);
          break;
      }
      result.updated.push(id);
    } catch (error) {
      result.failed.push({
        id,
        reason: error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  }

  // Der Sammelvorgang bekommt einen eigenen Eintrag, damit im Verlauf
  // erkennbar ist, dass 40 Änderungen zu einer Aktion gehörten.
  const sql = await db();
  if (sql) {
    await sql.begin(async (tx) => {
      await writeAuditTx(tx, {
        actor,
        action: "ticket.bulk_operation",
        entityType: "ticket",
        entityId: batchId,
        after: {
          operation: operation.kind,
          requested: ids.length,
          updated: result.updated.length,
          failed: result.failed.length,
        },
        context: { batchId },
        ...meta,
      });
    });
  }

  return result;
}

/* ── Kommentare ─────────────────────────────────────────────────────── */

export async function listComments(
  ticketId: string,
  options: { includeInternal: boolean }
): Promise<TicketComment[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<
    {
      id: string; ticket_id: string; author_id: string | null;
      author_name: string | null; author_email: string | null;
      body: string; is_internal: boolean; edited_at: Date | null; created_at: Date;
    }[]
  >`
    SELECT c.id, c.ticket_id, c.author_id, u.name AS author_name, u.email AS author_email,
           c.body, c.is_internal, c.edited_at, c.created_at
    FROM ticket_comments c
    LEFT JOIN crm_users u ON u.id = c.author_id
    WHERE c.ticket_id = ${ticketId} AND c.deleted_at IS NULL
      AND (${options.includeInternal} = TRUE OR c.is_internal = FALSE)
    ORDER BY c.created_at ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    author: person(r.author_id, r.author_name, r.author_email),
    body: r.body,
    isInternal: r.is_internal,
    editedAt: iso(r.edited_at),
    createdAt: r.created_at.toISOString(),
  }));
}

export async function addComment(
  ticketId: string,
  body: string,
  isInternal: boolean,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<TicketComment | null> {
  const sql = await db();
  if (!sql) return null;

  const text = body.trim();
  if (!text) throw new TicketValidationError("Kommentar darf nicht leer sein");

  const id = newId("cmt");

  await sql.begin(async (tx) => {
    const [ticket] = await tx<{ id: string; first_response_at: Date | null }[]>`
      SELECT id, first_response_at FROM tickets
      WHERE id = ${ticketId} AND deleted_at IS NULL
    `;
    if (!ticket) throw new TicketValidationError("Ticket nicht gefunden");

    await tx`
      INSERT INTO ticket_comments (id, ticket_id, author_id, body, is_internal)
      VALUES (${id}, ${ticketId}, ${await knownUserId(tx, actor.id)}, ${text}, ${isInternal})
    `;

    // Erste nach außen sichtbare Antwort setzt die Reaktionszeit. Interne
    // Notizen zählen dafür nicht — sonst wäre die SLA-Messung wertlos.
    if (!isInternal && !ticket.first_response_at) {
      await tx`UPDATE tickets SET first_response_at = NOW() WHERE id = ${ticketId}`;
    }

    await tx`UPDATE tickets SET updated_at = NOW() WHERE id = ${ticketId}`;

    await writeAuditTx(tx, {
      actor,
      action: isInternal ? "ticket.internal_note_added" : "ticket.comment_added",
      entityType: "ticket",
      entityId: ticketId,
      after: { commentId: id, length: text.length },
      ...meta,
    });
  });

  const comments = await listComments(ticketId, { includeInternal: true });
  return comments.find((c) => c.id === id) ?? null;
}

export async function deleteComment(
  commentId: string,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;

  let ok = false;
  await sql.begin(async (tx) => {
    const [row] = await tx<{ ticket_id: string }[]>`
      UPDATE ticket_comments SET deleted_at = NOW()
      WHERE id = ${commentId} AND deleted_at IS NULL
      RETURNING ticket_id
    `;
    if (!row) return;
    ok = true;
    await writeAuditTx(tx, {
      actor,
      action: "ticket.comment_deleted",
      entityType: "ticket",
      entityId: row.ticket_id,
      before: { commentId },
      ...meta,
    });
  });
  return ok;
}

/* ── Beziehungen ────────────────────────────────────────────────────── */

export async function listRelations(ticketId: string): Promise<TicketRelationEntry[]> {
  const sql = await db();
  if (!sql) return [];

  // Beide Richtungen in einer Abfrage: eine Beziehung ist aus Sicht beider
  // Tickets sichtbar, wird aber nur einmal gespeichert.
  const rows = await sql<
    {
      id: string; relation: string; outgoing: boolean; created_at: Date;
      other_id: string; other_key: string; other_title: string; other_status: string;
    }[]
  >`
    SELECT r.id, r.relation, TRUE AS outgoing, r.created_at,
           t.id AS other_id, t.key AS other_key, t.title AS other_title, t.status AS other_status
    FROM ticket_relations r
    JOIN tickets t ON t.id = r.to_ticket
    WHERE r.from_ticket = ${ticketId} AND t.deleted_at IS NULL
    UNION ALL
    SELECT r.id, r.relation, FALSE AS outgoing, r.created_at,
           t.id AS other_id, t.key AS other_key, t.title AS other_title, t.status AS other_status
    FROM ticket_relations r
    JOIN tickets t ON t.id = r.from_ticket
    WHERE r.to_ticket = ${ticketId} AND t.deleted_at IS NULL
    ORDER BY created_at ASC
  `;

  return rows.map((r) => ({
    id: r.id,
    relation: r.relation as TicketRelation,
    outgoing: r.outgoing,
    ticket: {
      id: r.other_id,
      key: r.other_key,
      title: r.other_title,
      status: r.other_status as TicketStatus,
    },
    createdAt: r.created_at.toISOString(),
  }));
}

export async function addRelation(
  fromTicket: string,
  toTicket: string,
  relation: TicketRelation,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  if (fromTicket === toTicket) {
    throw new TicketValidationError("Ein Ticket kann nicht mit sich selbst verknüpft werden");
  }

  let created = false;
  await sql.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`
      SELECT id FROM tickets
      WHERE id IN (${fromTicket}, ${toTicket}) AND deleted_at IS NULL
    `;
    if (rows.length !== 2) throw new TicketValidationError("Ticket nicht gefunden");

    const inserted = await tx<{ id: string }[]>`
      INSERT INTO ticket_relations (id, from_ticket, to_ticket, relation, created_by)
      VALUES (${newId("rel")}, ${fromTicket}, ${toTicket}, ${relation},
              ${await knownUserId(tx, actor.id)})
      ON CONFLICT (from_ticket, to_ticket, relation) DO NOTHING
      RETURNING id
    `;
    if (inserted.length === 0) return;
    created = true;

    await writeAuditTx(tx, {
      actor,
      action: "ticket.relation_added",
      entityType: "ticket",
      entityId: fromTicket,
      after: { relation, toTicket },
      ...meta,
    });
  });
  return created;
}

export async function removeRelation(
  relationId: string,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;

  let ok = false;
  await sql.begin(async (tx) => {
    const [row] = await tx<{ from_ticket: string; to_ticket: string; relation: string }[]>`
      DELETE FROM ticket_relations WHERE id = ${relationId}
      RETURNING from_ticket, to_ticket, relation
    `;
    if (!row) return;
    ok = true;
    await writeAuditTx(tx, {
      actor,
      action: "ticket.relation_removed",
      entityType: "ticket",
      entityId: row.from_ticket,
      before: { relation: row.relation, toTicket: row.to_ticket },
      ...meta,
    });
  });
  return ok;
}

/* ── Anhänge ────────────────────────────────────────────────────────── */

export async function listAttachments(ticketId: string): Promise<TicketAttachment[]> {
  const sql = await db();
  if (!sql) return [];
  // Ohne explizite Spaltenliste würde SELECT * die Binärdaten jeder Datei
  // mitlesen — bei mehreren Anhängen sind das schnell zweistellige Megabyte.
  const rows = await sql<
    {
      id: string; ticket_id: string; comment_id: string | null; filename: string;
      content_type: string; byte_size: number; uploaded_by: string | null;
      uploader_name: string | null; uploader_email: string | null; created_at: Date;
    }[]
  >`
    SELECT a.id, a.ticket_id, a.comment_id, a.filename, a.content_type, a.byte_size,
           a.uploaded_by, u.name AS uploader_name, u.email AS uploader_email, a.created_at
    FROM ticket_attachments a
    LEFT JOIN crm_users u ON u.id = a.uploaded_by
    WHERE a.ticket_id = ${ticketId}
    ORDER BY a.created_at ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    commentId: r.comment_id,
    filename: r.filename,
    contentType: r.content_type,
    byteSize: r.byte_size,
    uploadedBy: person(r.uploaded_by, r.uploader_name, r.uploader_email),
    createdAt: r.created_at.toISOString(),
  }));
}

export async function addAttachment(
  ticketId: string,
  file: { filename: string; contentType: string; data: Buffer },
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<TicketAttachment | null> {
  const sql = await db();
  if (!sql) return null;

  const id = newId("att");
  await sql.begin(async (tx) => {
    const [ticket] = await tx<{ id: string }[]>`
      SELECT id FROM tickets WHERE id = ${ticketId} AND deleted_at IS NULL
    `;
    if (!ticket) throw new TicketValidationError("Ticket nicht gefunden");

    await tx`
      INSERT INTO ticket_attachments (id, ticket_id, filename, content_type, byte_size, data, uploaded_by)
      VALUES (${id}, ${ticketId}, ${file.filename}, ${file.contentType},
              ${file.data.byteLength}, ${file.data}, ${await knownUserId(tx, actor.id)})
    `;
    await writeAuditTx(tx, {
      actor,
      action: "ticket.attachment_added",
      entityType: "ticket",
      entityId: ticketId,
      after: { attachmentId: id, filename: file.filename, bytes: file.data.byteLength },
      ...meta,
    });
  });

  const list = await listAttachments(ticketId);
  return list.find((a) => a.id === id) ?? null;
}

export async function getAttachmentData(
  attachmentId: string
): Promise<{ data: Buffer; contentType: string; filename: string } | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<
    { data: Buffer; content_type: string; filename: string }[]
  >`
    SELECT data, content_type, filename FROM ticket_attachments WHERE id = ${attachmentId} LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    data: rows[0].data,
    contentType: rows[0].content_type,
    filename: rows[0].filename,
  };
}

export async function deleteAttachment(
  attachmentId: string,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;

  let ok = false;
  await sql.begin(async (tx) => {
    const [row] = await tx<{ ticket_id: string; filename: string }[]>`
      DELETE FROM ticket_attachments WHERE id = ${attachmentId}
      RETURNING ticket_id, filename
    `;
    if (!row) return;
    ok = true;
    await writeAuditTx(tx, {
      actor,
      action: "ticket.attachment_deleted",
      entityType: "ticket",
      entityId: row.ticket_id,
      before: { attachmentId, filename: row.filename },
      ...meta,
    });
  });
  return ok;
}
