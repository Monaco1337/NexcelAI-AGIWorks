import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { cancelInvoice, InvoiceError } from "@/lib/billing/invoicesStore";

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
    const invoice = await cancelInvoice(
      id,
      actorFrom(gate.auth),
      typeof body.reason === "string" ? body.reason : "",
      await requestMeta()
    );
    if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[BILLING] Storno fehlgeschlagen:", error);
    return NextResponse.json({ error: "cancel_failed" }, { status: 500 });
  }
}
