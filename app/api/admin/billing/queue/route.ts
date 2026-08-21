/**
 * Billing Queue: liest die Abrechnungswarteschlange und erlaubt Neuordnung.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  listBillingQueue,
  reorderBillingQueue,
} from "@/lib/billing/projectBillingStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const queue = await listBillingQueue();
  return NextResponse.json({ queue });
}

export async function PATCH(request: NextRequest) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  let body: { projectIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!Array.isArray(body.projectIds) || body.projectIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "projectIds_required" }, { status: 400 });
  }
  await reorderBillingQueue(body.projectIds, actorFrom(gate.auth), await requestMeta());
  return NextResponse.json({ ok: true });
}
