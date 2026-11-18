import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authenticated sales-inbox feed, never public. */
export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const brandParam = req.nextUrl.searchParams.get("brand");
  const brand = brandParam === "nexcel" || brandParam === "agiworks" ? brandParam : null;
  const includeClosed = req.nextUrl.searchParams.get("all") === "1";
  const rows = await sql`
    SELECT id, source_type, brand, name, email, company, subject, message,
           attribution, priority, status, next_action_at, created_at, updated_at
    FROM marketing_inbound_leads
    WHERE (${brand}::text IS NULL OR brand = ${brand})
      AND (${includeClosed}::boolean OR status IN ('new', 'in_review'))
    ORDER BY CASE WHEN priority = 'high' THEN 0 ELSE 1 END,
             next_action_at ASC, created_at DESC
    LIMIT 200
  `;
  return NextResponse.json({ leads: rows }, { headers: { "Cache-Control": "no-store" } });
}

/** Review gate before any outbound communication. */
export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { id, status } = body as { id?: unknown; status?: unknown };
  if (typeof id !== "string" || id.length > 150 || !["in_review", "accepted", "dismissed"].includes(String(status))) {
    return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
  }
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const rows = await sql<{ id: string; status: string }[]>`
    UPDATE marketing_inbound_leads SET status = ${String(status)}, updated_at = NOW()
    WHERE id = ${id} AND status IN ('new','in_review')
    RETURNING id, status
  `;
  if (!rows.length) return NextResponse.json({ error: "Not found or already closed" }, { status: 409 });
  return NextResponse.json({ updated: rows[0] }, { headers: { "Cache-Control": "no-store" } });
}
