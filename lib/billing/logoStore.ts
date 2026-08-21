/**
 * Speicherung der Aussteller-Logos.
 *
 * Wir schreiben die Bytes in eine kleine Tabelle `billing_assets` und
 * legen als `logo_path` einen synthetischen Bezeichner `asset:<id>` in
 * `billing_issuers.logo_path` ab. Damit bleibt der Renderer entkoppelt
 * vom konkreten Speicher (S3, lokale Files, DB) und kann später leicht
 * auf ein CDN wechseln, ohne dass sich sein Interface ändert.
 */

import { db } from "@/lib/pg";
import { randomUUID, createHash } from "node:crypto";

export interface UploadLogoResult {
  path: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
}

const ASSET_PREFIX = "asset:";

export async function saveLogo(
  content: Buffer,
  mimeType: string
): Promise<UploadLogoResult> {
  const sql = await db();
  if (!sql) throw new Error("Datenbank nicht verfügbar");
  const id = randomUUID();
  const sha = createHash("sha256").update(content).digest("hex");
  await sql`
    INSERT INTO billing_assets (id, mime_type, byte_size, sha256, content)
    VALUES (${id}, ${mimeType}, ${content.length}, ${sha}, ${content})
  `;
  return {
    path: `${ASSET_PREFIX}${id}`,
    mimeType,
    byteSize: content.length,
    sha256: sha,
  };
}

export async function loadLogoBytes(path: string | null | undefined): Promise<Buffer | null> {
  if (!path) return null;
  if (!path.startsWith(ASSET_PREFIX)) return null;
  const id = path.slice(ASSET_PREFIX.length);
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<{ content: Buffer }[]>`
    SELECT content FROM billing_assets WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return Buffer.from(rows[0].content);
}

export async function loadLogoWithMime(
  path: string | null | undefined
): Promise<{ content: Buffer; mimeType: string } | null> {
  if (!path || !path.startsWith(ASSET_PREFIX)) return null;
  const id = path.slice(ASSET_PREFIX.length);
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<{ content: Buffer; mime_type: string }[]>`
    SELECT content, mime_type FROM billing_assets WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { content: Buffer.from(rows[0].content), mimeType: rows[0].mime_type };
}
