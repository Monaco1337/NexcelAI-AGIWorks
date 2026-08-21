/**
 * Öffentlich teilbare Rechnungslinks.
 *
 * Ein Share-Token authentifiziert einen unangemeldeten Besucher ausschließlich
 * für eine einzelne Rechnung. Tokens sind kryptografisch zufällig, jederzeit
 * widerrufbar, mit optionalem Ablaufdatum ausgestattet und werden pro Zugriff
 * mitgezählt (für Nachvollziehbarkeit im Audit-Log).
 *
 * WICHTIG:
 *  - Der Token wird nur bei Erstellung einmalig zurückgegeben; im Audit-Log
 *    hinterlegen wir NUR den Hash, damit auch ein DB-Leak keinen Zugriff
 *    ermöglicht.
 *  - Der Store bleibt Domain-frei — die HTTP-Route entscheidet, welche
 *    Dokumente sie herausgibt (PDF, ZUGFeRD, XRechnung).
 */

import { db } from "@/lib/pg";
import { randomBytes, createHash } from "node:crypto";
import type { AuditActor } from "@/lib/audit/auditLog";
import { writeAudit } from "@/lib/audit/auditLog";

export interface ShareToken {
  token: string;
  invoiceId: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  allowDownloads: boolean;
  lastAccessedAt: string | null;
  accessCount: number;
  recipientHint: string | null;
}

interface ShareRow {
  token: string;
  invoice_id: string;
  created_at: Date;
  expires_at: Date | null;
  revoked_at: Date | null;
  allow_downloads: boolean;
  last_accessed_at: Date | null;
  access_count: number;
  recipient_hint: string | null;
}

function fromRow(row: ShareRow): ShareToken {
  return {
    token: row.token,
    invoiceId: row.invoice_id,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at?.toISOString() ?? null,
    revokedAt: row.revoked_at?.toISOString() ?? null,
    allowDownloads: row.allow_downloads,
    lastAccessedAt: row.last_accessed_at?.toISOString() ?? null,
    accessCount: row.access_count,
    recipientHint: row.recipient_hint,
  };
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createShareToken(
  invoiceId: string,
  actor: AuditActor,
  options: { expiresInDays?: number | null; allowDownloads?: boolean; recipientHint?: string | null } = {}
): Promise<ShareToken> {
  const sql = await db();
  if (!sql) throw new Error("Datenbank nicht verfügbar");
  const token = generateToken();
  const expiresAt =
    options.expiresInDays && options.expiresInDays > 0
      ? new Date(Date.now() + options.expiresInDays * 86_400_000)
      : null;
  await sql`
    INSERT INTO invoice_share_tokens (
      token, invoice_id, created_by, expires_at, allow_downloads, recipient_hint
    ) VALUES (
      ${token}, ${invoiceId}, ${actor.id ?? null},
      ${expiresAt}, ${options.allowDownloads ?? true},
      ${options.recipientHint ?? null}
    )
  `;
  await writeAudit({
    actor,
    action: "invoice.share_created",
    entityType: "invoice",
    entityId: invoiceId,
    context: {
      tokenHash: createHash("sha256").update(token).digest("hex").slice(0, 16),
      expiresAt: expiresAt?.toISOString() ?? null,
      allowDownloads: options.allowDownloads ?? true,
      recipient: options.recipientHint ?? null,
    },
  });
  const [row] = await sql<ShareRow[]>`SELECT * FROM invoice_share_tokens WHERE token = ${token}`;
  return fromRow(row);
}

export async function listShareTokens(invoiceId: string): Promise<ShareToken[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<ShareRow[]>`
    SELECT * FROM invoice_share_tokens
    WHERE invoice_id = ${invoiceId}
    ORDER BY created_at DESC
  `;
  return rows.map(fromRow);
}

export async function revokeShareToken(token: string, actor: AuditActor): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ invoice_id: string }[]>`
    UPDATE invoice_share_tokens
    SET revoked_at = NOW()
    WHERE token = ${token} AND revoked_at IS NULL
    RETURNING invoice_id
  `;
  if (rows.length === 0) return false;
  await writeAudit({
    actor,
    action: "invoice.share_revoked",
    entityType: "invoice",
    entityId: rows[0].invoice_id,
    context: { tokenHash: createHash("sha256").update(token).digest("hex").slice(0, 16) },
  });
  return true;
}

export async function consumeShareToken(token: string): Promise<ShareToken | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<ShareRow[]>`
    UPDATE invoice_share_tokens
    SET last_accessed_at = NOW(), access_count = access_count + 1
    WHERE token = ${token}
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING *
  `;
  if (rows.length === 0) return null;
  return fromRow(rows[0]);
}
