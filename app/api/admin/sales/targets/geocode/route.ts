/**
 * Stadt → Koordinaten (leichtgewichtiges Geocoding).
 *
 * GET /api/admin/sales/targets/geocode?city=Unna
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { geocodeCity } from "@/lib/sales/targets/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";
  if (!city) {
    return NextResponse.json({ error: "VALIDATION_FAILED", detail: "city fehlt" }, { status: 400 });
  }
  const point = await geocodeCity(city);
  if (!point) {
    return NextResponse.json({ error: "NOT_FOUND", detail: "Stadt nicht auflösbar" }, { status: 404 });
  }
  return NextResponse.json({ point });
}
