import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listIssuers, peekNextInvoiceNumber } from "@/lib/billing/issuersStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const issuers = await listIssuers();
  const enriched = await Promise.all(
    issuers.map(async (i) => ({
      ...i,
      nextNumber: (await peekNextInvoiceNumber(i.id)).next,
    }))
  );
  return NextResponse.json({ issuers: enriched });
}
