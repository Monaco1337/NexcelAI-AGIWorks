/**
 * Zielkunden-Liste (Intelligence-Ansicht).
 *
 * GET /api/admin/sales/targets — Filter, Suche, Sortierung.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listTargets, type TargetListFilters } from "@/lib/sales/targets/store";
import {
  targetErrorResponse,
  targetListQueryInput,
  targetListQuerySchema,
  validateContract,
} from "@/lib/sales/targets/contracts";
import type { EnrichmentStatus } from "@/lib/sales/targets/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;
  const parsed = validateContract(targetListQuerySchema, targetListQueryInput(params));
  if (!parsed.ok) return targetErrorResponse(parsed.error);
  const query = parsed.data;
  const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
  if (query.cursor && !cursor) {
    return NextResponse.json({ error: "invalid_cursor" }, { status: 400 });
  }

  const filters: TargetListFilters = {
    cities: query.city,
    industries: query.industry,
    priorityClasses: query.priority,
    status: query.status as EnrichmentStatus[] | undefined,
    maxDistanceKm: query.maxDistanceKm,
    minLeadScore: query.minScore,
    hasWebsite: query.hasWebsite,
    hasPhone: query.hasPhone,
    hasEmail: query.hasEmail,
    hasDecisionMaker: query.hasDm,
    onlyWebsiteWeak: query.weakWebsite,
    onlyWithSoftwareOpportunity: query.softwareOpp,
    search: query.q || undefined,
    limit: query.limit,
    offset: query.offset,
    sortBy: query.sort,
    centerLat: query.centerLat,
    centerLng: query.centerLng,
    centerRadiusKm: query.centerRadiusKm,
    includeChains: query.includeChains,
    cursor,
  };

  try {
    const items = await listTargets(filters);
    const last = items.at(-1);
    const nextCursor =
      query.sort === "score" && items.length === query.limit && last
        ? encodeCursor({
            score: last.leadScore?.totalScore ?? last.target.preScore ?? -1,
            updatedAt: last.target.updatedAt,
            id: last.target.id,
          })
        : null;
    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("[TARGETS] list failed:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

function decodeCursor(value: string): TargetListFilters["cursor"] | undefined {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    if (
      typeof parsed.score !== "number" ||
      !Number.isFinite(parsed.score) ||
      typeof parsed.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(parsed.updatedAt)) ||
      typeof parsed.id !== "string" ||
      parsed.id.length > 120
    ) return undefined;
    return { score: parsed.score, updatedAt: parsed.updatedAt, id: parsed.id };
  } catch {
    return undefined;
  }
}

function encodeCursor(cursor: NonNullable<TargetListFilters["cursor"]>): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}
