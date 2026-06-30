/**
 * NEXCEL AI / AGI WORKS · Demo-Anfragen in Postgres
 *
 * Reiner Postgres-Layer. Liefert `null`/`[]` wenn keine DB verbunden ist,
 * sodass Aufrufer auf das bestehende Datei-Verhalten zurückfallen können.
 */

import { db } from "@/lib/pg";

export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  unternehmen?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt?: string;
  read: boolean;
  archived: boolean;
  brand?: "agiworks" | "nexcel";
}

function rowToDemo(row: any): DemoRequest {
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email ?? "",
    unternehmen: row.unternehmen ?? undefined,
    createdAt: row.created_at?.toISOString?.() ?? String(row.created_at ?? ""),
    status: (row.status as DemoRequest["status"]) ?? "pending",
    expiresAt: row.expires_at?.toISOString?.() ?? undefined,
    read: !!row.read,
    archived: !!row.archived,
    brand: (row.brand as DemoRequest["brand"]) ?? "nexcel",
  };
}

export async function listDemosPg(): Promise<DemoRequest[] | null> {
  const sql = await db();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT id, name, email, unternehmen, status, expires_at, read, archived, brand, created_at
      FROM demo_requests
      ORDER BY created_at DESC
    `;
    return rows.map(rowToDemo);
  } catch (error) {
    console.error("❌ [DEMOS-PG] list fehlgeschlagen:", error);
    return null;
  }
}

export async function createDemoPg(input: {
  name: string;
  email: string;
  unternehmen?: string;
  expiresAt?: string;
  brand?: "agiworks" | "nexcel";
}): Promise<DemoRequest | null> {
  const sql = await db();
  if (!sql) return null;
  try {
    const id = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const [row] = await sql`
      INSERT INTO demo_requests (id, name, email, unternehmen, status, expires_at, read, archived, brand)
      VALUES (
        ${id}, ${input.name}, ${input.email}, ${input.unternehmen ?? null},
        'pending', ${input.expiresAt ?? null}, FALSE, FALSE, ${input.brand ?? "nexcel"}
      )
      RETURNING id, name, email, unternehmen, status, expires_at, read, archived, brand, created_at
    `;
    return rowToDemo(row);
  } catch (error) {
    console.error("❌ [DEMOS-PG] create fehlgeschlagen:", error);
    return null;
  }
}

export async function updateDemoPg(
  id: string,
  updates: Partial<Pick<DemoRequest, "read" | "archived" | "status">>,
): Promise<DemoRequest | null> {
  const sql = await db();
  if (!sql) return null;
  try {
    const [row] = await sql`
      UPDATE demo_requests SET
        read     = COALESCE(${updates.read ?? null}, read),
        archived = COALESCE(${updates.archived ?? null}, archived),
        status   = COALESCE(${updates.status ?? null}, status)
      WHERE id = ${id}
      RETURNING id, name, email, unternehmen, status, expires_at, read, archived, brand, created_at
    `;
    return row ? rowToDemo(row) : null;
  } catch (error) {
    console.error("❌ [DEMOS-PG] update fehlgeschlagen:", error);
    return null;
  }
}

export async function deleteDemoPg(id: string): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  try {
    await sql`DELETE FROM demo_requests WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("❌ [DEMOS-PG] delete fehlgeschlagen:", error);
    return false;
  }
}
