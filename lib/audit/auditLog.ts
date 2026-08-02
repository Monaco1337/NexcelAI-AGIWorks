/**
 * Audit-Log — append-only Protokoll aller schreibenden Vorgänge.
 *
 * Zwei Regeln, die das Log erst brauchbar machen:
 *
 *  1. Schreiben darf nie den Vorgang scheitern lassen. Wenn das Protokollieren
 *     eines gelöschten Kontakts fehlschlägt, ist der Kontakt trotzdem gelöscht.
 *     Innerhalb einer Transaktion gilt das Gegenteil — dort ist der Eintrag
 *     Teil des Vorgangs und wird mit zurückgerollt (siehe `writeAuditTx`).
 *
 *  2. Gespeichert wird nur, was sich tatsächlich geändert hat. Ein Diff über
 *     alle Felder bläht die Tabelle auf und macht den Verlauf unlesbar.
 */

import { db, type Sql } from "@/lib/pg";
import type { Tx } from "@/lib/db/migrationRunner";
import type { AuthContext } from "@/lib/auth/authorize";

export interface AuditActor {
  id: string | null;
  email: string;
  role: string;
  kind: "user" | "system";
}

export interface AuditEntryInput {
  actor: AuditActor;
  /** Punktnotation, z. B. "ticket.status_changed". */
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  context?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string;
  actorRole: string;
  actorKind: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  context: Record<string, unknown>;
  createdAt: string;
}

/** Akteur aus einem Autorisierungskontext. */
export function actorFrom(auth: AuthContext): AuditActor {
  return { id: auth.user?.id ?? null, email: auth.email, role: auth.role, kind: "user" };
}

/** Akteur für Hintergrundprozesse (Cron, Automationen). */
export function systemActor(label = "system"): AuditActor {
  return { id: null, email: label, role: "system", kind: "system" };
}

function auditId(): string {
  return `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Reduziert zwei Zustände auf die tatsächlich geänderten Felder.
 * Gibt `null` zurück, wenn sich nichts geändert hat.
 */
export function diffStates(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
  if (!before || !after) {
    return {
      before: before ?? {},
      after: after ?? {},
    };
  }

  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    const a = before[key];
    const b = after[key];
    // JSON-Vergleich deckt verschachtelte Werte und Arrays mit ab; die
    // Objekte hier sind klein, die Kosten also unerheblich.
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changedBefore[key] = a;
      changedAfter[key] = b;
    }
  }

  if (Object.keys(changedAfter).length === 0) return null;
  return { before: changedBefore, after: changedAfter };
}

async function insert(sql: Sql | Tx, entry: AuditEntryInput): Promise<void> {
  await sql`
    INSERT INTO audit_log (
      id, actor_id, actor_email, actor_role, actor_kind,
      action, entity_type, entity_id, before_state, after_state,
      context, ip, user_agent
    ) VALUES (
      ${auditId()}, ${entry.actor.id}, ${entry.actor.email}, ${entry.actor.role},
      ${entry.actor.kind}, ${entry.action}, ${entry.entityType}, ${entry.entityId},
      ${entry.before ? JSON.stringify(entry.before) : null}::jsonb,
      ${entry.after ? JSON.stringify(entry.after) : null}::jsonb,
      ${JSON.stringify(entry.context ?? {})}::jsonb,
      ${entry.ip ?? null}, ${entry.userAgent ?? null}
    )
  `;
}

/**
 * Schreibt einen Eintrag außerhalb einer Transaktion. Fehler werden
 * protokolliert, aber nicht weitergereicht.
 */
export async function writeAudit(entry: AuditEntryInput): Promise<void> {
  try {
    const sql = await db();
    if (!sql) return;
    await insert(sql, entry);
  } catch (error) {
    console.error("[AUDIT] Eintrag konnte nicht geschrieben werden:", error);
  }
}

/**
 * Schreibt einen Eintrag innerhalb einer bestehenden Transaktion. Fehler
 * werden absichtlich weitergereicht: hier gehört das Protokoll zum Vorgang,
 * ein Ticketwechsel ohne Protokolleintrag darf nicht bestehen bleiben.
 */
export async function writeAuditTx(tx: Tx, entry: AuditEntryInput): Promise<void> {
  await insert(tx, entry);
}

interface AuditRow {
  id: string;
  actor_id: string | null;
  actor_email: string;
  actor_role: string;
  actor_kind: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  context: Record<string, unknown>;
  created_at: Date;
}

function rowToEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    actorKind: row.actor_kind,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    before: row.before_state,
    after: row.after_state,
    context: row.context ?? {},
    createdAt: row.created_at.toISOString(),
  };
}

/** Verlauf eines einzelnen Objekts, neueste zuerst. */
export async function getEntityHistory(
  entityType: string,
  entityId: string,
  limit = 100
): Promise<AuditEntry[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<AuditRow[]>`
    SELECT id, actor_id, actor_email, actor_role, actor_kind, action,
           entity_type, entity_id, before_state, after_state, context, created_at
    FROM audit_log
    WHERE entity_type = ${entityType} AND entity_id = ${entityId}
    ORDER BY created_at DESC
    LIMIT ${Math.min(limit, 500)}
  `;
  return rows.map(rowToEntry);
}

export interface AuditQuery {
  entityType?: string;
  action?: string;
  actorId?: string;
  /** Cursor: ISO-Zeitstempel des letzten gelesenen Eintrags. */
  before?: string;
  limit?: number;
}

/**
 * Keyset-Pagination über `created_at`. Kein OFFSET: der wird bei wachsendem
 * Log linear langsamer, weil Postgres die übersprungenen Zeilen trotzdem liest.
 */
export async function queryAudit(
  query: AuditQuery = {}
): Promise<{ entries: AuditEntry[]; nextCursor: string | null }> {
  const sql = await db();
  if (!sql) return { entries: [], nextCursor: null };

  const limit = Math.min(query.limit ?? 50, 200);
  const rows = await sql<AuditRow[]>`
    SELECT id, actor_id, actor_email, actor_role, actor_kind, action,
           entity_type, entity_id, before_state, after_state, context, created_at
    FROM audit_log
    WHERE (${query.entityType ?? null}::text IS NULL OR entity_type = ${query.entityType ?? null})
      AND (${query.action ?? null}::text IS NULL OR action = ${query.action ?? null})
      AND (${query.actorId ?? null}::text IS NULL OR actor_id = ${query.actorId ?? null})
      AND (${query.before ?? null}::timestamptz IS NULL OR created_at < ${query.before ?? null}::timestamptz)
    ORDER BY created_at DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const entries = rows.slice(0, limit).map(rowToEntry);
  return {
    entries,
    nextCursor: hasMore ? entries[entries.length - 1].createdAt : null,
  };
}
