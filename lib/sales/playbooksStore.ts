/**
 * Vertriebsmodul — Playbooks (ICP, PhoneScript, DiscoveryGuide, ClientPreviewStory).
 *
 * Playbooks werden versioniert. Ältere Versionen bleiben erhalten,
 * damit man reproduzieren kann, welches Playbook zum Zeitpunkt eines
 * Angebots gültig war.
 */

import { db } from "@/lib/pg";
import { SalesError, newId, type BrandContext } from "./model";

export type PlaybookBrand = BrandContext | "any";

export interface SalesPlaybook {
  id: string;
  key: string;
  version: number;
  brandContext: PlaybookBrand;
  structured: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  key: string;
  version: number;
  brand_context: string;
  structured: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function rowTo(row: Row): SalesPlaybook {
  return {
    id: row.id,
    key: row.key,
    version: row.version,
    brandContext: row.brand_context as PlaybookBrand,
    structured: row.structured,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listPlaybooks(): Promise<SalesPlaybook[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT id, key, version, brand_context, structured, is_active, created_at, updated_at
    FROM sales_playbooks
    ORDER BY key ASC, brand_context ASC, version DESC
  `;
  return rows.map(rowTo);
}

export async function getActivePlaybook(
  key: string,
  brand: PlaybookBrand = "any"
): Promise<SalesPlaybook | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT id, key, version, brand_context, structured, is_active, created_at, updated_at
    FROM sales_playbooks
    WHERE key = ${key} AND is_active = TRUE AND (brand_context = ${brand} OR brand_context = 'any')
    ORDER BY (brand_context = ${brand}) DESC, version DESC
    LIMIT 1
  `;
  return rows[0] ? rowTo(rows[0]) : null;
}

export interface CreatePlaybookVersionInput {
  key: string;
  brandContext?: PlaybookBrand;
  structured: Record<string, unknown>;
  createdBy?: string | null;
  activate?: boolean;
}

export async function createPlaybookVersion(
  input: CreatePlaybookVersionInput
): Promise<SalesPlaybook> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const brand = input.brandContext ?? "any";
  const id = newId("splay");

  return await sql.begin(async (tx) => {
    const rows = await tx<{ next: number }[]>`
      SELECT COALESCE(MAX(version), 0) + 1 AS next
      FROM sales_playbooks WHERE key = ${input.key} AND brand_context = ${brand}
    `;
    const version = rows[0]?.next ?? 1;
    if (input.activate) {
      await tx`
        UPDATE sales_playbooks SET is_active = FALSE
        WHERE key = ${input.key} AND brand_context = ${brand}
      `;
    }
    await tx`
      INSERT INTO sales_playbooks (
        id, key, version, brand_context, structured, is_active, created_by
      ) VALUES (
        ${id}, ${input.key}, ${version}, ${brand},
        ${JSON.stringify(input.structured)}::jsonb,
        ${input.activate ?? true}, ${input.createdBy ?? null}
      )
    `;
    const outRows = await tx<Row[]>`
      SELECT id, key, version, brand_context, structured, is_active, created_at, updated_at
      FROM sales_playbooks WHERE id = ${id}
    `;
    return rowTo(outRows[0]);
  });
}

export async function togglePlaybookActive(id: string, active: boolean): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_playbooks SET is_active = ${active}, updated_at = NOW() WHERE id = ${id}`;
}
