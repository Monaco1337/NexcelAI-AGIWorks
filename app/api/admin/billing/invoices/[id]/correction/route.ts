import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { InvoiceError } from "@/lib/billing/invoicesStore";
import { createCorrectionDraft } from "@/lib/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const invoice = await createCorrectionDraft(
      id,
      typeof body.reason === "string" ? body.reason : "",
      actorFrom(gate.auth),
      await requestMeta()
    );
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof InvoiceError) {
      const status = error.code === "not_found" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[BILLING] Korrektur fehlgeschlagen:", error);
    return NextResponse.json({ error: "correction_failed" }, { status: 500 });
  }
}
