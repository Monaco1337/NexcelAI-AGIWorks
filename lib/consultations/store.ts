import { randomUUID } from "node:crypto";
import { db, jsonParam, type Sql } from "@/lib/pg";
import { configuredSlots, CONSULTATION_RESOURCE, type AvailabilityConfig, type ConsultationBrand, type ConsultationSlot } from "./slots";

export type BookingResult =
  | { status: "booked"; id: string; slot: ConsultationSlot }
  | { status: "unavailable" }
  | { status: "occupied" }
  | { status: "limit" };
export interface BookingInput {
  brand: ConsultationBrand; startsAt: string; name: string; email: string; company: string;
  projectType: string; projectGoal: string; timeframe: string; budgetRange: string;
  attribution: Record<string, unknown>;
}
interface WeeklyRow { weekday: number; start_minute: number }
interface OverrideRow { starts_at: Date | string; action: "open" | "block" }
interface DateRow { local_date: Date | string }
export async function getAvailabilityConfig(sql: Sql): Promise<AvailabilityConfig> {
  const [weekly, overrides, dates] = await Promise.all([
    sql<WeeklyRow[]>`SELECT weekday, start_minute FROM consultation_weekly_slots WHERE resource_id=${CONSULTATION_RESOURCE} ORDER BY weekday, start_minute`,
    sql<OverrideRow[]>`SELECT starts_at, action FROM consultation_slot_overrides WHERE resource_id=${CONSULTATION_RESOURCE} AND starts_at > NOW() - INTERVAL '1 day' ORDER BY starts_at`,
    sql<DateRow[]>`SELECT to_char(local_date, 'YYYY-MM-DD') AS local_date FROM consultation_blackout_dates WHERE resource_id=${CONSULTATION_RESOURCE} AND local_date >= CURRENT_DATE - 1 ORDER BY local_date`,
  ]);
  return {
    weekly: weekly.map((row) => ({ weekday: row.weekday, startMinute: row.start_minute })),
    overrides: overrides.map((row) => ({ startsAt: new Date(row.starts_at).toISOString(), action: row.action })),
    blockedDates: dates.map((row) => String(row.local_date)),
  };
}
export async function availableSlots(now = new Date()): Promise<ConsultationSlot[] | null> {
  const sql = await db();
  if (!sql) return null;
  const config = await getAvailabilityConfig(sql);
  const slots = configuredSlots(config, now);
  if (!slots.length) return [];
  const occupied = await sql<{ starts_at: Date; ends_at: Date }[]>`
    SELECT starts_at,ends_at FROM consultation_bookings
    WHERE resource_id=${CONSULTATION_RESOURCE}
      AND status IN ('pending','confirmed')
      AND ends_at > ${slots[0].startsAt}::timestamptz
      AND starts_at < ${slots[slots.length - 1].endsAt}::timestamptz
  `;
  return slots.filter((slot) => !occupied.some((row) =>
    new Date(row.starts_at).getTime() < new Date(slot.endsAt).getTime()
    && new Date(row.ends_at).getTime() > new Date(slot.startsAt).getTime()
  ));
}
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const sql = await db();
  if (!sql) return { status: "unavailable" };
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.startsAt)) return {status:"occupied"};
  return sql.begin(async (tx): Promise<BookingResult> => {
    // Serialize booking and admin availability updates for the shared resource.
    await tx`SELECT pg_advisory_xact_lock(hashtext(${CONSULTATION_RESOURCE}))`;
    const weekly = await tx<WeeklyRow[]>`SELECT weekday, start_minute FROM consultation_weekly_slots WHERE resource_id=${CONSULTATION_RESOURCE}`;
    const overrides = await tx<OverrideRow[]>`SELECT starts_at, action FROM consultation_slot_overrides WHERE resource_id=${CONSULTATION_RESOURCE} AND starts_at > NOW() - INTERVAL '1 day'`;
    const dates = await tx<DateRow[]>`SELECT to_char(local_date,'YYYY-MM-DD') AS local_date FROM consultation_blackout_dates WHERE resource_id=${CONSULTATION_RESOURCE} AND local_date >= CURRENT_DATE - 1`;
    const available = configuredSlots({
      weekly: weekly.map((r)=>({weekday:r.weekday,startMinute:r.start_minute})),
      overrides: overrides.map((r)=>({startsAt:new Date(r.starts_at).toISOString(),action:r.action})),
      blockedDates: dates.map((r)=>String(r.local_date)),
    });
    const slot = available.find((s)=>s.startsAt===input.startsAt);
    if (!slot) return { status: "occupied" };
    // Protect against overlaps even if an admin later removes or changes a previously booked rule.
    const overlaps = await tx<{ id: string }[]>`
      SELECT id FROM consultation_bookings
      WHERE resource_id=${CONSULTATION_RESOURCE}
        AND status IN ('pending','confirmed')
        AND starts_at < ${slot.endsAt}::timestamptz
        AND ends_at > ${slot.startsAt}::timestamptz
      LIMIT 1
    `;
    if (overlaps.length) return { status: "occupied" };
    const email = input.email.toLowerCase();
    const recent = await tx<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM consultation_bookings
      WHERE email=${email} AND created_at > NOW() - INTERVAL '1 day'
    `;
    if (Number(recent[0]?.count ?? 0) >= 2) return { status: "limit" };
    const id = `booking_${randomUUID()}`;
    const rows = await tx<{ id: string }[]>`
      INSERT INTO consultation_bookings (
        id, resource_id, brand, starts_at, ends_at, name, email, company,
        project_type, project_goal, timeframe, budget_range, attribution, status
      ) VALUES (
        ${id}, ${CONSULTATION_RESOURCE}, ${input.brand}, ${slot.startsAt}::timestamptz,
        ${slot.endsAt}::timestamptz, ${input.name}, ${email}, ${input.company},
        ${input.projectType}, ${input.projectGoal}, ${input.timeframe}, ${input.budgetRange},
        ${tx.json(jsonParam(input.attribution))}, 'pending'
      ) ON CONFLICT DO NOTHING RETURNING id
    `;
    return rows.length ? { status: "booked", id, slot } : { status: "occupied" };
  });
}
