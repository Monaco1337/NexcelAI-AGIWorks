import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";

export const runtime = "nodejs";

export async function POST(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.proposal.send");
  if (!gate.ok) return gate.response;
  // Legacy endpoint only flipped a database flag. It never sent an email.
  // Fail closed to prevent false CRM evidence; use the authenticated /deliver endpoint.
  return NextResponse.json({error:'Bitte den echten E-Mail-Versand /deliver verwenden'}, {status:410,headers:{'Cache-Control':'no-store'}});
}
