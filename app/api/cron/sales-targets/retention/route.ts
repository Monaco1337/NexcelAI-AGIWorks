import { NextResponse, type NextRequest } from "next/server";
import { authorizeCronOrPermission } from "@/lib/auth/cron";
import { purgeExpiredEvidence } from "@/lib/sales/targets/retention/store";

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
  const batch = Math.max(
    1,
    Math.min(10_000, Number.parseInt(request.nextUrl.searchParams.get("batch") ?? "1000", 10) || 1_000),
  );
  return NextResponse.json({ deleted: await purgeExpiredEvidence(batch) });
}

