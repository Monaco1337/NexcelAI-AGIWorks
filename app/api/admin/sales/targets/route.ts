/**
 * Zielkunden-Liste (Intelligence-Ansicht).
 *
 * GET /api/admin/sales/targets — Filter, Suche, Sortierung.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listTargets, type TargetListFilters } from "@/lib/sales/targets/store";
import type { PriorityClass, EnrichmentStatus } from "@/lib/sales/targets/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function multi(params: URLSearchParams, key: string): string[] | undefined {
  const values = params.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function optNum(params: URLSearchParams, key: string): number | undefined {
  const v = params.get(key);
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function optBool(params: URLSearchParams, key: string): boolean | undefined {
  const v = params.get(key);
  if (v === null || v === "") return undefined;
  return v === "1" || v.toLowerCase() === "true";
}

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;
  const filters: TargetListFilters = {
    cities: multi(params, "city"),
    industries: multi(params, "industry"),
    priorityClasses: multi(params, "priority") as PriorityClass[] | undefined,
    status: multi(params, "status") as EnrichmentStatus[] | undefined,
    maxDistanceKm: optNum(params, "maxDistanceKm"),
    minLeadScore: optNum(params, "minScore"),
    hasWebsite: optBool(params, "hasWebsite"),
    hasPhone: optBool(params, "hasPhone"),
    hasEmail: optBool(params, "hasEmail"),
    hasDecisionMaker: optBool(params, "hasDm"),
    onlyWebsiteWeak: optBool(params, "weakWebsite"),
    onlyWithSoftwareOpportunity: optBool(params, "softwareOpp"),
    search: params.get("q") ?? undefined,
    limit: Math.max(1, Math.min(1000, Number.parseInt(params.get("limit") ?? "100", 10) || 100)),
    offset: Number.parseInt(params.get("offset") ?? "0", 10) || 0,
    sortBy: (params.get("sort") as TargetListFilters["sortBy"]) ?? "score",
    centerLat: optNum(params, "centerLat"),
    centerLng: optNum(params, "centerLng"),
    centerRadiusKm: optNum(params, "centerRadiusKm"),
  };

  try {
    const items = await listTargets(filters);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[TARGETS] list failed:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}
