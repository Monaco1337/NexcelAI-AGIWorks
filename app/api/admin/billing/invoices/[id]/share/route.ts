/**
 * Öffentlich teilbare Rechnungslinks.
 *  GET  — listet aktive Tokens der Rechnung.
 *  POST — erstellt einen neuen Token (optional mit Ablaufdatum und
 *         Empfängerhinweis).
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  createShareToken,
  listShareTokens,
} from "@/lib/billing/shareStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const tokens = await listShareTokens(id);
  return NextResponse.json({ tokens });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.send");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    expiresInDays?: number | null;
    allowDownloads?: boolean;
    recipientHint?: string | null;
  };
  const share = await createShareToken(id, actorFrom(gate.auth), {
    expiresInDays: typeof body.expiresInDays === "number" ? body.expiresInDays : null,
    allowDownloads: body.allowDownloads !== false,
    recipientHint: body.recipientHint ?? null,
  });
  return NextResponse.json({ share });
}
