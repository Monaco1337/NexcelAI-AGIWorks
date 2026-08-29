/**
 * Golden-Dataset-Flag setzen / entfernen (Phase 15).
 *
 * PUT /api/admin/sales/targets/[id]/golden   body: { flag: boolean }
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { findTargetById, recordActivity } from "@/lib/sales/targets/store";
import { markGoldenDataset } from "@/lib/sales/targets/hardening/storeAdditions";
import { toTargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const target = await findTargetById(id);
    if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const body = (await request.json()) as { flag?: boolean };
    const flag = Boolean(body.flag);
    await markGoldenDataset(id, flag);
    await recordActivity({
      targetId: id,
      kind: flag ? "golden_added" : "golden_removed",
      summary: flag ? "Als Golden-Dataset markiert" : "Aus Golden-Dataset entfernt",
      actorId: gate.auth.userId,
      actorEmail: gate.auth.user?.email ?? null,
    });
    return NextResponse.json({ ok: true, isGoldenDataset: flag });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json(err.toJson(), { status: err.httpStatus });
  }
}
