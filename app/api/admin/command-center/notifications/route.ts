import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  try {
    const notifications = await sql<{
      id: string; title: string; detail: string; brand: string;
      target_tab: string; created_at: Date; read_at: Date | null;
    }[]>`
      SELECT id, title, detail, brand, target_tab, created_at, read_at
      FROM command_notifications WHERE recipient_id = ${gate.auth.userId}
      ORDER BY created_at DESC LIMIT 35
    `;
    return NextResponse.json({ notifications: notifications.map(n => ({
      id: n.id, title: n.title, detail: n.detail, brand: n.brand,
      targetTab: n.target_tab, createdAt: n.created_at.toISOString(),
      read: n.read_at !== null,
    })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[COMMAND NOTIFICATIONS] read failed", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "notification_read_failed" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "origin_forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  const rows = await sql<{ id: string }[]>`
    UPDATE command_notifications SET read_at = COALESCE(read_at, NOW())
    WHERE id = ${body.id} AND recipient_id = ${gate.auth.userId} RETURNING id
  `;
  if (!rows.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
