/**
 * Vertriebsmodul — Kundenlogos & andere Referenz-Assets.
 */

import crypto from "node:crypto";
import { db } from "@/lib/pg";
import { SalesError, newId } from "./model";

export interface SalesAssetMeta {
  id: string;
  companyId: string | null;
  kind: string;
  mime: string;
  sha256: string;
  size: number;
  note: string;
  createdAt: string;
}

interface Row {
  id: string;
  company_id: string | null;
  kind: string;
  mime: string;
  sha256: string;
  size: number;
  note: string;
  created_at: Date;
}

function rowTo(row: Row): SalesAssetMeta {
  return {
    id: row.id,
    companyId: row.company_id,
    kind: row.kind,
    mime: row.mime,
    sha256: row.sha256,
    size: row.size,
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listAssetsForCompany(companyId: string): Promise<SalesAssetMeta[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT id, company_id, kind, mime, sha256, size, note, created_at
    FROM sales_assets
    WHERE company_id = ${companyId}
    ORDER BY created_at DESC
  `;
  return rows.map(rowTo);
}

export interface SaveAssetInput {
  companyId?: string | null;
  kind?: string;
  mime: string;
  bytes: Uint8Array;
  note?: string;
  createdBy?: string | null;
}

export async function saveAsset(input: SaveAssetInput): Promise<SalesAssetMeta> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const size = input.bytes.byteLength;
  if (size > 4 * 1024 * 1024) {
    throw new SalesError("Datei zu groß (max. 4 MB)", "too_large", 413);
  }
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(input.mime)) {
    throw new SalesError("Nicht unterstütztes Format", "invalid_mime", 415);
  }

  const id = newId("sast");
  const sha256 = crypto.createHash("sha256").update(input.bytes).digest("hex");
  await sql`
    INSERT INTO sales_assets (id, company_id, kind, mime, bytes, sha256, size, note, created_by)
    VALUES (${id}, ${input.companyId ?? null}, ${input.kind ?? "customer_logo"},
            ${input.mime}, ${input.bytes}, ${sha256}, ${size}, ${input.note ?? ""},
            ${input.createdBy ?? null})
  `;
  return {
    id,
    companyId: input.companyId ?? null,
    kind: input.kind ?? "customer_logo",
    mime: input.mime,
    sha256,
    size,
    note: input.note ?? "",
    createdAt: new Date().toISOString(),
  };
}

export async function loadAssetBytes(
  id: string
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<{ bytes: Buffer; mime: string }[]>`
    SELECT bytes, mime FROM sales_assets WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { bytes: new Uint8Array(rows[0].bytes), mime: rows[0].mime };
}

export async function deleteAsset(id: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`DELETE FROM sales_assets WHERE id = ${id}`;
}
