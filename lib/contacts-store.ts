/**
 * NEXCEL AI / AGI WORKS · Kontakt-Posts in Postgres
 *
 * Reiner Postgres-Layer. Liefert `null`/`[]` wenn keine DB verbunden ist,
 * sodass Aufrufer auf das bestehende Datei-Verhalten zurückfallen können.
 * Das Datenformat entspricht 1:1 dem bisherigen contact-posts.json.
 */

import { db } from "@/lib/pg";

export type ContactBrand = "agiworks" | "nexcel";

export interface ContactPost {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string | null;
  unternehmen: string | null;
  betreff: string;
  nachricht: string;
  status: "open" | "read" | "archived";
  read: boolean;
  archived: boolean;
  createdAt: string;
  brand?: ContactBrand;
  sourceHost?: string;
}

function rowToPost(row: any): ContactPost {
  return {
    id: row.id,
    vorname: row.vorname ?? "",
    nachname: row.nachname ?? "",
    email: row.email ?? "",
    telefon: row.telefon ?? null,
    unternehmen: row.unternehmen ?? null,
    betreff: row.betreff ?? "",
    nachricht: row.nachricht ?? "",
    status: (row.status as ContactPost["status"]) ?? "open",
    read: !!row.read,
    archived: !!row.archived,
    createdAt: row.created_at?.toISOString?.() ?? String(row.created_at ?? ""),
    brand: (row.brand as ContactBrand) ?? "nexcel",
    sourceHost: row.source_host ?? undefined,
  };
}

/** Alle Kontakt-Posts (neueste zuerst) oder null wenn keine DB. */
export async function listContactsPg(): Promise<ContactPost[] | null> {
  const sql = await db();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT id, vorname, nachname, email, telefon, unternehmen, betreff,
             nachricht, status, read, archived, brand, source_host, created_at
      FROM contact_posts
      ORDER BY created_at DESC
    `;
    return rows.map(rowToPost);
  } catch (error) {
    console.error("❌ [CONTACTS-PG] list fehlgeschlagen:", error);
    return null;
  }
}

export async function createContactPg(input: {
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string | null;
  unternehmen?: string | null;
  betreff: string;
  nachricht: string;
  brand?: ContactBrand;
  sourceHost?: string;
}): Promise<ContactPost | null> {
  const sql = await db();
  if (!sql) return null;
  try {
    const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const [row] = await sql`
      INSERT INTO contact_posts (
        id, vorname, nachname, email, telefon, unternehmen, betreff, nachricht,
        status, read, archived, brand, source_host
      ) VALUES (
        ${id}, ${input.vorname}, ${input.nachname}, ${input.email},
        ${input.telefon ?? null}, ${input.unternehmen ?? null}, ${input.betreff},
        ${input.nachricht}, 'open', FALSE, FALSE,
        ${input.brand ?? "nexcel"}, ${input.sourceHost ?? null}
      )
      RETURNING id, vorname, nachname, email, telefon, unternehmen, betreff,
                nachricht, status, read, archived, brand, source_host, created_at
    `;
    return rowToPost(row);
  } catch (error) {
    console.error("❌ [CONTACTS-PG] create fehlgeschlagen:", error);
    return null;
  }
}

export async function updateContactPg(
  id: string,
  updates: Partial<{ read: boolean; archived: boolean; status: ContactPost["status"] }>,
): Promise<ContactPost | null> {
  const sql = await db();
  if (!sql) return null;
  try {
    const [row] = await sql`
      UPDATE contact_posts SET
        read     = COALESCE(${updates.read ?? null}, read),
        archived = COALESCE(${updates.archived ?? null}, archived),
        status   = COALESCE(${updates.status ?? null}, status)
      WHERE id = ${id}
      RETURNING id, vorname, nachname, email, telefon, unternehmen, betreff,
                nachricht, status, read, archived, brand, source_host, created_at
    `;
    return row ? rowToPost(row) : null;
  } catch (error) {
    console.error("❌ [CONTACTS-PG] update fehlgeschlagen:", error);
    return null;
  }
}

export async function deleteContactPg(id: string): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  try {
    await sql`DELETE FROM contact_posts WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("❌ [CONTACTS-PG] delete fehlgeschlagen:", error);
    return false;
  }
}
