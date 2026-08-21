import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { markPaid, InvoiceError } from "@/lib/billing/invoicesStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  let body: { paidAt?: string | null; reference?: string | null };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const invoice = await markPaid(
      id,
      actorFrom(gate.auth),
      body.paidAt ?? null,
      body.reference ?? null,
      await requestMeta()
    );
    if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[BILLING] Zahlungsmarkierung fehlgeschlagen:", error);
    return NextResponse.json({ error: "mark_paid_failed" }, { status: 500 });
  }
}
