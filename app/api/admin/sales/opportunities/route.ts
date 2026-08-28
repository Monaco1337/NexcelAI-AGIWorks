import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listOpportunities, type OpportunityQuery } from "@/lib/sales/opportunitiesStore";
import type { BrandContext } from "@/lib/sales/model";

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
  const query: OpportunityQuery = {
    brandContext: (params.get("brand") as OpportunityQuery["brandContext"]) ?? "all",
    status: multi(params, "status") as OpportunityQuery["status"],
    classification: multi(params, "class") as OpportunityQuery["classification"],
    ownerId: params.get("owner") ?? undefined,
    openOnly: params.get("open") === "1",
    overdueOnly: params.get("overdue") === "1",
    dueToday: params.get("dueToday") === "1",
    search: params.get("q") ?? undefined,
    limit: Number.parseInt(params.get("limit") ?? "200", 10) || 200,
    cursor: params.get("cursor") ?? undefined,
  };
  const result = await listOpportunities(query);
  return NextResponse.json(result);
}
