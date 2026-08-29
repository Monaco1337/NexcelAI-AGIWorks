/**
 * Watchlist-Umschalten für einen Zielkunden.
 *
 * POST   /api/admin/sales/targets/[id]/watchlist  — hinzufügen
 * DELETE /api/admin/sales/targets/[id]/watchlist  — entfernen
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { addWatchlist, removeWatchlist, recordActivity } from "@/lib/sales/targets/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  let body: { note?: string; criteria?: Record<string, unknown> } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* ok */
  }
  const entry = await addWatchlist({
    targetId: id,
    userId: gate.auth.userId,
    criteria: body.criteria,
    note: body.note,
  });
  await recordActivity({
    targetId: id,
    kind: "watchlist_add",
    summary: "Zur Watchlist hinzugefügt",
    actorId: gate.auth.userId,
    actorEmail: gate.auth.user?.email ?? null,
  });
  return NextResponse.json({ entry });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  await removeWatchlist(id, gate.auth.userId);
  return NextResponse.json({ ok: true });
}
