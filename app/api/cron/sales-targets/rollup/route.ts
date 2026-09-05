import { NextResponse, type NextRequest } from "next/server";
import { authorizeCronOrPermission } from "@/lib/auth/cron";
import { rollupMetrics } from "@/lib/sales/targets/metrics/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const gate = await authorizeCronOrPermission(request, "sales.manage");
  if (!gate.ok) return gate.response;
  const now = new Date();
  const hourEnd = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
  const hourStart = new Date(hourEnd.getTime() - 48 * 3_600_000);
  const dayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayStart = new Date(dayEnd.getTime() - 30 * 86_400_000);
  const [hourly, daily] = await Promise.all([
    rollupMetrics(hourStart.toISOString(), hourEnd.toISOString(), "hour"),
    rollupMetrics(dayStart.toISOString(), dayEnd.toISOString(), "day"),
  ]);
  return NextResponse.json({
    rolledUp: { hourly, daily },
    windows: {
      hourly: [hourStart.toISOString(), hourEnd.toISOString()],
      daily: [dayStart.toISOString(), dayEnd.toISOString()],
    },
  });
}

