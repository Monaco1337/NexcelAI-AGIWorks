import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAny, type AuthContext } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  return !!origin && origin === req.nextUrl.origin && req.headers.get("sec-fetch-site") !== "cross-site";
}
function validSubscription(v: unknown): v is { endpoint: string; keys: { p256dh: string; auth: string } } {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;
  if (typeof s.endpoint !== "string" || s.endpoint.length < 25 || s.endpoint.length > 2048) return false;
  try {
    const u = new URL(s.endpoint);
    const h = u.hostname.toLowerCase();
    const allowed = h === "web.push.apple.com" || h.endsWith(".push.apple.com")
      || h === "fcm.googleapis.com" || h === "updates.push.services.mozilla.com"
      || h.endsWith(".push.services.mozilla.com");
    if (u.protocol !== "https:" || !allowed || u.username || u.password) return false;
  } catch { return false; }
  const keys = s.keys;
  if (!keys || typeof keys !== "object") return false;
  const k = keys as Record<string, unknown>;
  return typeof k.p256dh === "string" && /^[A-Za-z0-9_-]{70,120}$/.test(k.p256dh)
    && typeof k.auth === "string" && /^[A-Za-z0-9_-]{15,35}$/.test(k.auth);
}
function requireActiveAdmin(auth: AuthContext): NextResponse | null {
  // No JWT-only fallback: only active users resolved from CRM may manage subscriptions.
  if ((auth.role !== "admin" && auth.role !== "owner") || !auth.user?.isActive) {
    return reply({ error: "Forbidden" }, 403);
  }
  return null;
}
export async function GET() {
  const gate = await authorizeAny();
  if (!gate.ok) return gate.response;
  const denied = requireActiveAdmin(gate.auth);
  if (denied) return denied;
  return reply({ configured: Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY && process.env.WEB_PUSH_SUBJECT),
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY || null });
}
export async function POST(req: NextRequest) {
  const gate = await authorizeAny();
  if (!gate.ok) return gate.response;
  const denied = requireActiveAdmin(gate.auth);
  if (denied) return denied;
  if (!sameOrigin(req)) return reply({ error: "Invalid origin" }, 403);
  if (Number(req.headers.get("content-length") || 0) > 5000) return reply({ error: "Payload too large" }, 413);
  let value: unknown;
  try { value = await req.json(); } catch { return reply({ error: "Invalid JSON" }, 400); }
  if (!validSubscription(value)) return reply({ error: "Invalid subscription" }, 400);
  const sql = await db();
  if (!sql) return reply({ error: "Database unavailable" }, 503);
  const id = `ps_${createHash("sha256").update(value.endpoint).digest("hex")}`;
  await sql`
    INSERT INTO admin_push_subscriptions (id,user_id,endpoint,p256dh,auth_key)
    VALUES (${id},${gate.auth.userId},${value.endpoint},${value.keys.p256dh},${value.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id=EXCLUDED.user_id,p256dh=EXCLUDED.p256dh,auth_key=EXCLUDED.auth_key,updated_at=NOW()
  `;
  return reply({ subscribed: true }, 201);
}
export async function DELETE(req: NextRequest) {
  const gate = await authorizeAny();
  if (!gate.ok) return gate.response;
  const denied = requireActiveAdmin(gate.auth);
  if (denied) return denied;
  if (!sameOrigin(req)) return reply({ error: "Invalid origin" }, 403);
  if (Number(req.headers.get("content-length") || 0) > 5000) return reply({ error: "Payload too large" }, 413);
  const value: unknown = await req.json().catch(() => null);
  if (!value || typeof value !== "object" || typeof (value as { endpoint?: unknown }).endpoint !== "string") return reply({ error: "Invalid request" }, 400);
  const endpoint = (value as {endpoint:string}).endpoint;
  if (endpoint.length < 25 || endpoint.length > 2048) return reply({ error: "Invalid endpoint" }, 400);
  const sql = await db();
  if (!sql) return reply({ error: "Database unavailable" }, 503);
  await sql`DELETE FROM admin_push_subscriptions WHERE endpoint=${endpoint} AND user_id=${gate.auth.userId}`;
  return reply({ unsubscribed: true });
}
