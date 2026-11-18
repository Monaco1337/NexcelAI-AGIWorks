import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const from = req.nextUrl.searchParams.get("from");
  const filter = from === "all" ? null : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await sql`
    SELECT id, brand, starts_at, ends_at, name, email, company, project_type,
           project_goal, timeframe, budget_range, attribution, status,
           confirmation_sent_at, reminder_sent_at, created_at
    FROM consultation_bookings
    WHERE (${filter}::timestamptz IS NULL OR starts_at >= ${filter}::timestamptz)
    ORDER BY starts_at ASC LIMIT 250
  `;
  return NextResponse.json({ bookings: rows }, { headers: noStore });
}

/** Cancelling frees the slot; the authenticated cron queues transactional cancellation mail. */
export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let value: unknown;
  try { value = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const body = value as { id?: unknown; status?: unknown };
  if (typeof body.id !== "string" || body.id.length > 100 || body.status !== "cancelled") {
    return NextResponse.json({ error: "Only cancellation is supported" }, { status: 400 });
  }
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const rows = await sql<{ id: string }[]>`
    UPDATE consultation_bookings SET status='cancelled', updated_at=NOW()
    WHERE id=${body.id} AND status='confirmed'
    RETURNING id
  `;
  if (!rows.length) return NextResponse.json({ error: "Not active" }, { status: 409 });
  return NextResponse.json({ cancelled: true, cancellationNotificationQueued: true }, { headers: noStore });
}
