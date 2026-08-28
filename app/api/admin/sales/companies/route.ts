/**
 * Firmenliste + Anlage.
 *
 * GET  /api/admin/sales/companies    — Filter, Suche, Cursor
 * POST /api/admin/sales/companies    — neue Firma
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listCompanies, type CompanyQuery } from "@/lib/sales/companiesStore";
import { serviceCreateCompany } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function multi(params: URLSearchParams, key: string): string[] | undefined {
  const all = params.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  return all.length > 0 ? all : undefined;
}

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;
  const query: CompanyQuery = {
    search: params.get("q") ?? undefined,
    status: multi(params, "status") as CompanyQuery["status"],
    classification: multi(params, "class") as CompanyQuery["classification"],
    ownerId: params.get("owner") ?? undefined,
    ownerFilter: (params.get("ownerFilter") as CompanyQuery["ownerFilter"]) ?? undefined,
    currentUserId: gate.auth.userId,
    overdueOnly: params.get("overdue") === "1",
    dueToday: params.get("dueToday") === "1",
    limit: Number.parseInt(params.get("limit") ?? "100", 10) || 100,
    cursor: params.get("cursor") ?? undefined,
  };

  try {
    const result = await listCompanies(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[SALES] Firmenliste fehlgeschlagen:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const company = await serviceCreateCompany(gate.auth, body);
    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[SALES] Firma anlegen fehlgeschlagen:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
