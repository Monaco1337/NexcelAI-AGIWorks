import { NextResponse, type NextRequest } from "next/server";
import { authorizeCronOrPermission } from "@/lib/auth/cron";
import { runEnrichmentWorker } from "@/lib/sales/targets/jobs/workerRunner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const gate = await authorizeCronOrPermission(request, "sales.manage");
  if (!gate.ok) return gate.response;
  const params = request.nextUrl.searchParams;
  const batch = clamp(params.get("batch"), 10, 1, 25);
  const maxMs = clamp(params.get("maxMs"), 45_000, 5_000, 50_000);
  return NextResponse.json(await runEnrichmentWorker({ batch, maxMs }));
}

function clamp(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : fallback));
}

