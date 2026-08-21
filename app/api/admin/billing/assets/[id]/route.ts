/**
 * Direktauslieferung eines gespeicherten Logo-Assets. Ausschließlich
 * für angemeldete Admins; öffentliche Rechnungen greifen ihre Logos
 * über das PDF und benötigen diese Route nicht.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { loadLogoWithMime } from "@/lib/billing/logoStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const data = await loadLogoWithMime(`asset:${id}`);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(new Uint8Array(data.content), {
    headers: {
      "Content-Type": data.mimeType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
