import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { createCustomer, listCustomers } from "@/lib/billing/customersStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  try {
    const customers = await listCustomers(q);
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("[BILLING] Kundenliste fehlgeschlagen:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const customer = await createCustomer(body, actorFrom(gate.auth), await requestMeta());
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "create_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
