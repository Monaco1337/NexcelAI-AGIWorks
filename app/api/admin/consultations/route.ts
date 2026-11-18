import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/pg";
import { availableSlots, getAvailabilityConfig } from "@/lib/consultations/store";
import { CONSULTATION_RESOURCE, parseLocalSlot, validStartMinute } from "@/lib/consultations/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const response = (body: object, status = 200) => NextResponse.json(body, { status, headers });
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  return origin === req.nextUrl.origin && fetchSite !== "cross-site";
}
/** Consecutive, non-overlapping 45-minute starts within an admin-selected time range. */
function rangeStarts(start: number, end: number): number[] {
  const starts: number[] = [];
  for (let minute = start; minute + 45 <= end; minute += 45) {
    if (!validStartMinute(minute)) break;
    starts.push(minute);
  }
  return starts;
}
function weekdayIsValid(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6;
}
function timeEndIsValid(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value)
    && value >= 8 * 60 + 45 && value <= 19 * 60 + 45 && value % 15 === 0;
}
function proposalForOfficeWeek(): { weekday: number; startMinute: number }[] {
  const rows: { weekday: number; startMinute: number }[] = [];
  for (let weekday = 1; weekday <= 5; weekday++) {
    for (const [from, to] of [[9 * 60, 12 * 60], [14 * 60, 17 * 60]]) {
      for (const startMinute of rangeStarts(from, to)) rows.push({ weekday, startMinute });
    }
  }
  return rows;
}

function isoDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value ? value : null;
}

export async function GET() {
  const session = await verifySession();
  if (!session || session.role !== "admin") return response({ error: "Unauthorized" }, 401);
  try {
    const sql = await db();
    if (!sql) return response({ error: "Database unavailable" }, 503);
    const [bookings, availability, slots] = await Promise.all([
      sql`SELECT id, brand, starts_at, ends_at, name, email, company, project_type,
           project_goal, timeframe, budget_range, attribution, status,
           confirmation_sent_at, reminder_sent_at, created_at
          FROM consultation_bookings
          WHERE starts_at >= NOW() - INTERVAL '30 days'
          ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, starts_at ASC LIMIT 300`,
      getAvailabilityConfig(sql),
      availableSlots(),
    ]);
    const senderDefault = Boolean(process.env.BOOKING_FROM_EMAIL);
    const emailConfigured = Boolean(process.env.RESEND_API_KEY) && {
      nexcel: Boolean(process.env.BOOKING_FROM_EMAIL_NEXCEL) || senderDefault,
      agiworks: Boolean(process.env.BOOKING_FROM_EMAIL_AGIWORKS) || senderDefault,
    };
    return response({ bookings, availability, slots, emailConfigured });
  } catch {
    console.error("[consultations admin] GET failed");
    return response({ error: "Terminverwaltung nicht verfügbar" }, 503);
  }
}

/** Confirm requests or release an occupied slot. Confirmation emails are handled by the existing cron. */
export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session || session.role !== "admin") return response({ error: "Unauthorized" }, 401);
  if (!sameOrigin(req)) return response({ error: "Invalid origin" }, 403);
  let body: {id?:unknown;status?:unknown};
  try { body = await req.json(); } catch { return response({error:"Invalid JSON"},400); }
  if (!body || typeof body !== "object") return response({error:"Invalid body"},400);
  if (typeof body.id !== "string" || !/^booking_[a-f0-9-]{36}$/.test(body.id) ||
    (body.status !== "confirmed" && body.status !== "cancelled")) return response({error:"Invalid action"},400);
  try {
    const sql = await db();
    if (!sql) return response({error:"Database unavailable"},503);
    const rows = body.status === "confirmed"
      ? await sql<{id:string}[]>`UPDATE consultation_bookings SET status='confirmed',updated_at=NOW()
          WHERE id=${body.id} AND status='pending' AND starts_at > NOW() RETURNING id`
      : await sql<{id:string}[]>`UPDATE consultation_bookings SET status='cancelled',updated_at=NOW()
          WHERE id=${body.id} AND status IN ('pending','confirmed') RETURNING id`;
    return rows.length ? response({ok:true,status:body.status,notificationQueued:true}) : response({error:"Status changed or slot expired"},409);
  } catch { console.error("[consultations admin] PATCH failed"); return response({error:"Update failed"},503); }
}

/** Admin-only configuration; no public default slots until consciously enabled. */
export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session || session.role !== "admin") return response({ error: "Unauthorized" }, 401);
  if (!sameOrigin(req)) return response({ error: "Invalid origin" }, 403);
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 2048) return response({error:"Request too large"},413);
  let body: {operation?:unknown;weekday?:unknown;startMinute?:unknown;endMinute?:unknown;date?:unknown;localStart?:unknown};
  try { body = await req.json(); } catch { return response({error:"Invalid JSON"},400); }
  const op = body?.operation;
  const allowed = ["weekly:add","weekly:remove","weekly:range:add","weekly:clear","weekly:preset:add","override:open","override:block","override:remove","date:block","date:unblock"];
  if (typeof op !== "string" || !allowed.includes(op)) return response({error:"Invalid action"},400);
  const weekday = body.weekday;
  const minute = body.startMinute;
  const weeklyDayAction = op === "weekly:add" || op === "weekly:remove" || op === "weekly:range:add" || op === "weekly:clear";
  if (weeklyDayAction && !weekdayIsValid(weekday)) return response({error:"Invalid weekday"},400);
  const weeklyMinuteAction = op === "weekly:add" || op === "weekly:remove" || op === "weekly:range:add";
  if (weeklyMinuteAction && (typeof minute !== "number" || !validStartMinute(minute))) return response({error:"Invalid start time"},400);
  if (op === "weekly:range:add" && (!timeEndIsValid(body.endMinute)
    || typeof minute !== "number" || body.endMinute - minute < 45)) return response({error:"Invalid time range"},400);
  const date = op.startsWith("date:") ? isoDate(body.date) : null;
  if (op.startsWith("date:") && !date) return response({error:"Invalid date"},400);
  const timestamp = op.startsWith("override:") && typeof body.localStart === "string" ? parseLocalSlot(body.localStart) : null;
  if (op.startsWith("override:") && (!timestamp || new Date(timestamp).getTime() <= Date.now() + 24*3600000 || new Date(timestamp).getTime() >= Date.now() + 29*86400000)) return response({error:"Slot must be 24h ahead and within 28 days"},400);
  try {
    const sql = await db();
    if (!sql) return response({error:"Database unavailable"},503);
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${CONSULTATION_RESOURCE}))`;
      if (op === "weekly:add") {
        const conflicts = await tx<{ start_minute: number }[]>`
          SELECT start_minute FROM consultation_weekly_slots
          WHERE resource_id=${CONSULTATION_RESOURCE} AND weekday=${weekday as number}
            AND ABS(start_minute - ${minute as number}) < 45
        `;
        if (conflicts.some((r) => r.start_minute !== minute)) throw new Error("weekly overlap");
        await tx`INSERT INTO consultation_weekly_slots(resource_id,weekday,start_minute) VALUES (${CONSULTATION_RESOURCE},${weekday as number},${minute as number}) ON CONFLICT DO NOTHING`;
      }
      if (op === "weekly:remove") await tx`DELETE FROM consultation_weekly_slots WHERE resource_id=${CONSULTATION_RESOURCE} AND weekday=${weekday as number} AND start_minute=${minute as number}`;
      if (op === "weekly:clear") await tx`DELETE FROM consultation_weekly_slots WHERE resource_id=${CONSULTATION_RESOURCE} AND weekday=${weekday as number}`;
      if (op === "weekly:range:add" || op === "weekly:preset:add") {
        const proposed = op === "weekly:preset:add"
          ? proposalForOfficeWeek()
          : rangeStarts(minute as number, body.endMinute as number).map((startMinute) => ({ weekday: weekday as number, startMinute }));
        if (!proposed.length || proposed.length > 50) throw new Error("invalid range");
        const existing = await tx<{ weekday: number; start_minute: number }[]>`
          SELECT weekday,start_minute FROM consultation_weekly_slots
          WHERE resource_id=${CONSULTATION_RESOURCE}
        `;
        // Fail the whole transaction before any write if one proposed start overlaps.
        if (proposed.some((p) => existing.some((e) => e.weekday === p.weekday
          && Math.abs(e.start_minute - p.startMinute) < 45 && e.start_minute !== p.startMinute))) {
          throw new Error("weekly overlap");
        }
        for (const proposal of proposed) {
          await tx`INSERT INTO consultation_weekly_slots(resource_id,weekday,start_minute)
            VALUES (${CONSULTATION_RESOURCE},${proposal.weekday},${proposal.startMinute}) ON CONFLICT DO NOTHING`;
        }
      }
      if (op === "override:open" || op === "override:block") await tx`INSERT INTO consultation_slot_overrides(resource_id,starts_at,action) VALUES (${CONSULTATION_RESOURCE},${timestamp!}::timestamptz,${op === "override:open" ? "open" : "block"}) ON CONFLICT(resource_id,starts_at) DO UPDATE SET action=EXCLUDED.action`;
      if (op === "override:remove") await tx`DELETE FROM consultation_slot_overrides WHERE resource_id=${CONSULTATION_RESOURCE} AND starts_at=${timestamp!}::timestamptz`;
      if (op === "date:block") await tx`INSERT INTO consultation_blackout_dates(resource_id,local_date) VALUES (${CONSULTATION_RESOURCE},${date!}::date) ON CONFLICT DO NOTHING`;
      if (op === "date:unblock") await tx`DELETE FROM consultation_blackout_dates WHERE resource_id=${CONSULTATION_RESOURCE} AND local_date=${date!}::date`;
    });
    return response({ok:true});
  } catch (cause) {
    if (cause instanceof Error && cause.message === "weekly overlap") return response({error:"Zeit überschneidet sich mit einem anderen 45-Minuten-Termin"},409);
    if (cause instanceof Error && cause.message === "invalid range") return response({error:"Ungültiger Zeitraum"},400);
    console.error("[consultations admin] POST failed"); return response({error:"Configuration not saved"},503);
  }
}
