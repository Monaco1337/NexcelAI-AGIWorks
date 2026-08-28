import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listRuns, type RunQuery, type RunStatus } from "@/lib/sales/ai/runStore";
import type { SalesPromptKey } from "@/lib/sales/ai/promptSeeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function multi(params: URLSearchParams, key: string): string[] | undefined {
  const all = params.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  return all.length > 0 ? all : undefined;
}

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const p = request.nextUrl.searchParams;
  const query: RunQuery = {
    entityType: (p.get("entity") as RunQuery["entityType"]) ?? undefined,
    entityId: p.get("entityId") ?? undefined,
    promptKey: (p.get("promptKey") as SalesPromptKey | null) ?? undefined,
    status: multi(p, "status") as RunStatus[] | undefined,
    limit: Number.parseInt(p.get("limit") ?? "50", 10) || 50,
  };
  const runs = await listRuns(query);
  return NextResponse.json({ runs });
}
