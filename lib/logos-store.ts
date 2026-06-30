/**
 * NEXCEL AI / AGI WORKS · Kunden-Logo Store (Postgres)
 *
 * Logos werden als Bild-Bytes (bytea) direkt in Postgres gespeichert.
 * Das Bild selbst wird über /api/logos/[id]/image ausgeliefert (mit Cache),
 * die Metadaten über /api/logos bzw. /api/admin/logos.
 */

import { db } from "@/lib/pg";

export type LogoBrand = "all" | "nexcel" | "agiworks";

/** Öffentliche Metadaten eines Logos (ohne Bild-Bytes). */
export interface LogoRecord {
  id: string;
  name: string;
  brand: LogoBrand;
  className: string;
  filterStyle: string;
  sortOrder: number;
  active: boolean;
  contentType: string;
  createdAt: string;
  updatedAt: string;
}

function rowToRecord(row: any): LogoRecord {
  return {
    id: row.id,
    name: row.name,
    brand: (row.brand as LogoBrand) ?? "all",
    className: row.class_name,
    filterStyle: row.filter_style,
    sortOrder: Number(row.sort_order) || 0,
    active: !!row.active,
    contentType: row.content_type || "image/png",
    createdAt: row.created_at?.toISOString?.() ?? String(row.created_at ?? ""),
    updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at ?? ""),
  };
}

/** Alle Logos (Metadaten). `activeOnly` für die öffentliche Anzeige. */
export async function listLogos(opts?: {
  activeOnly?: boolean;
  brand?: LogoBrand;
}): Promise<LogoRecord[]> {
  const sql = await db();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, name, brand, class_name, filter_style, sort_order, active,
             content_type, created_at, updated_at
      FROM customer_logos
      ${opts?.activeOnly ? sql`WHERE active = TRUE` : sql``}
      ORDER BY sort_order ASC, created_at ASC
    `;
    let records = rows.map(rowToRecord);
    if (opts?.brand && opts.brand !== "all") {
      records = records.filter((r) => r.brand === "all" || r.brand === opts.brand);
    }
    return records;
  } catch (error) {
    console.error("❌ [LOGOS] listLogos fehlgeschlagen:", error);
    return [];
  }
}

/** Bild-Bytes eines Logos für das Ausliefern. */
export async function getLogoImage(
  id: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  const sql = await db();
  if (!sql) return null;

  try {
    const [row] = await sql`
      SELECT image_data, content_type
      FROM customer_logos
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!row) return null;
    return {
      data: Buffer.from(row.image_data as Uint8Array),
      contentType: row.content_type || "image/png",
    };
  } catch (error) {
    console.error("❌ [LOGOS] getLogoImage fehlgeschlagen:", error);
    return null;
  }
}

export async function createLogo(input: {
  name: string;
  brand?: LogoBrand;
  image: Buffer;
  contentType?: string;
  className?: string;
  filterStyle?: string;
}): Promise<LogoRecord | null> {
  const sql = await db();
  if (!sql) return null;

  try {
    const [{ max }] = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM customer_logos`;
    const nextOrder = (Number(max) || 0) + 1;
    const id = `logo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const [row] = await sql`
      INSERT INTO customer_logos (
        id, name, brand, image_data, content_type, class_name, filter_style, sort_order, active
      ) VALUES (
        ${id},
        ${input.name || "Logo"},
        ${input.brand || "all"},
        ${input.image},
        ${input.contentType || "image/png"},
        ${input.className || "max-h-[48px] max-w-[160px] sm:max-h-[56px] sm:max-w-[184px]"},
        ${input.filterStyle || "brightness(1.05) opacity(0.85)"},
        ${nextOrder},
        TRUE
      )
      RETURNING id, name, brand, class_name, filter_style, sort_order, active,
                content_type, created_at, updated_at
    `;
    return rowToRecord(row);
  } catch (error) {
    console.error("❌ [LOGOS] createLogo fehlgeschlagen:", error);
    return null;
  }
}

export async function updateLogo(
  id: string,
  updates: Partial<{
    name: string;
    brand: LogoBrand;
    className: string;
    filterStyle: string;
    active: boolean;
    sortOrder: number;
  }>,
): Promise<LogoRecord | null> {
  const sql = await db();
  if (!sql) return null;

  try {
    const [row] = await sql`
      UPDATE customer_logos SET
        name         = COALESCE(${updates.name ?? null}, name),
        brand        = COALESCE(${updates.brand ?? null}, brand),
        class_name   = COALESCE(${updates.className ?? null}, class_name),
        filter_style = COALESCE(${updates.filterStyle ?? null}, filter_style),
        active       = COALESCE(${updates.active ?? null}, active),
        sort_order   = COALESCE(${updates.sortOrder ?? null}, sort_order),
        updated_at   = NOW()
      WHERE id = ${id}
      RETURNING id, name, brand, class_name, filter_style, sort_order, active,
                content_type, created_at, updated_at
    `;
    return row ? rowToRecord(row) : null;
  } catch (error) {
    console.error("❌ [LOGOS] updateLogo fehlgeschlagen:", error);
    return null;
  }
}

export async function deleteLogo(id: string): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;

  try {
    await sql`DELETE FROM customer_logos WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("❌ [LOGOS] deleteLogo fehlgeschlagen:", error);
    return false;
  }
}

/** Reihenfolge per ID-Liste setzen (Index = sort_order). */
export async function reorderLogos(ids: string[]): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;

  try {
    await sql.begin(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx`UPDATE customer_logos SET sort_order = ${i + 1}, updated_at = NOW() WHERE id = ${ids[i]}`;
      }
    });
    return true;
  } catch (error) {
    console.error("❌ [LOGOS] reorderLogos fehlgeschlagen:", error);
    return false;
  }
}

/** Anzahl Logos (für Seed-Entscheidung). */
export async function countLogos(): Promise<number> {
  const sql = await db();
  if (!sql) return 0;
  try {
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM customer_logos`;
    return Number(count) || 0;
  } catch {
    return 0;
  }
}
