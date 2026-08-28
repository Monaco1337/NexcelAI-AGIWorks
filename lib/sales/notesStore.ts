/**
 * Vertriebsmodul — Notizen (Call- und Discovery-Notes).
 *
 * Freitext + strukturierte Felder (z. B. Bedarfsgesprächs-Leitfaden).
 * Autosave-freundlich: kein Version-Check nötig, das Frontend serialisiert
 * seine Änderungen selbst und rate-limitet.
 */

import { db } from "@/lib/pg";
import { SalesError, newId } from "./model";

export type NoteEntity = "company" | "opportunity";
export type NoteKind = "call" | "discovery" | "internal";

export interface SalesNote {
  id: string;
  entityType: NoteEntity;
  entityId: string;
  kind: NoteKind;
  body: string;
  structured: Record<string, unknown>;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface Row {
  id: string;
  entity_type: string;
  entity_id: string;
  kind: string;
  body: string;
  structured: Record<string, unknown> | null;
  author_id: string | null;
  author_name: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

function rowTo(row: Row): SalesNote {
  return {
    id: row.id,
    entityType: row.entity_type as NoteEntity,
    entityId: row.entity_id,
    kind: row.kind as NoteKind,
    body: row.body ?? "",
    structured: row.structured ?? {},
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
  };
}

export async function listNotes(
  entityType: NoteEntity,
  entityId: string
): Promise<SalesNote[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT n.id, n.entity_type, n.entity_id, n.kind, n.body, n.structured,
           n.author_id, COALESCE(u.name, u.email) AS author_name,
           n.created_at, n.updated_at, n.version
    FROM sales_notes n
    LEFT JOIN crm_users u ON u.id = n.author_id
    WHERE n.entity_type = ${entityType} AND n.entity_id = ${entityId}
      AND n.deleted_at IS NULL
    ORDER BY n.updated_at DESC
  `;
  return rows.map(rowTo);
}

export interface CreateNoteInput {
  entityType: NoteEntity;
  entityId: string;
  kind: NoteKind;
  body?: string;
  structured?: Record<string, unknown>;
  authorId?: string | null;
}

export async function createNote(input: CreateNoteInput): Promise<SalesNote> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newId("snote");
  await sql`
    INSERT INTO sales_notes (id, entity_type, entity_id, kind, body, structured, author_id)
    VALUES (${id}, ${input.entityType}, ${input.entityId}, ${input.kind},
            ${input.body ?? ""}, ${JSON.stringify(input.structured ?? {})}::jsonb,
            ${input.authorId ?? null})
  `;
  const list = await listNotes(input.entityType, input.entityId);
  const created = list.find((n) => n.id === id);
  if (!created) throw new SalesError("Notiz konnte nicht angelegt werden", "insert_failed", 500);
  return created;
}

export interface UpdateNoteInput {
  body?: string;
  structured?: Record<string, unknown>;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<SalesNote> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const rows = await sql<Row[]>`
    UPDATE sales_notes SET
      body       = COALESCE(${input.body ?? null}, body),
      structured = ${input.structured === undefined ? sql`structured` : sql`${JSON.stringify(input.structured ?? {})}::jsonb`},
      updated_at = NOW(),
      version    = version + 1
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING id, entity_type, entity_id, kind, body, structured,
              author_id, NULL::text AS author_name,
              created_at, updated_at, version
  `;
  if (rows.length === 0) throw new SalesError("Notiz nicht gefunden", "not_found", 404);
  return rowTo(rows[0]);
}

export async function deleteNote(id: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_notes SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL`;
}
