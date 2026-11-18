import { randomUUID } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { candidateSlots, CONSULTATION_RESOURCE, verifiedSlot, type ConsultationBrand, type ConsultationSlot } from "./slots";

export type BookingResult =
  | { status: "booked"; id: string; slot: ConsultationSlot }
  | { status: "unavailable" }
  | { status: "occupied" }
  | { status: "limit" };

export interface BookingInput {
  brand: ConsultationBrand;
  startsAt: string;
  name: string;
  email: string;
  company: string;
  projectType: string;
  projectGoal: string;
  timeframe: string;
  budgetRange: string;
  attribution: Record<string, unknown>;
}

export async function availableSlots(now = new Date()): Promise<ConsultationSlot[] | null> {
  const sql = await db();
  if (!sql) return null;
  const candidates = candidateSlots(now);
  if (!candidates.length) return [];
  const from = candidates[0].startsAt;
  const to = candidates[candidates.length - 1].endsAt;
  const busy = await sql<{ starts_at: Date }[]>`
    SELECT starts_at FROM consultation_bookings
    WHERE resource_id = ${CONSULTATION_RESOURCE}
      AND status = 'confirmed'
      AND starts_at >= ${from}::timestamptz
      AND starts_at <= ${to}::timestamptz
  `;
  const taken = new Set(busy.map((row) => new Date(row.starts_at).toISOString()));
  return candidates.filter((slot) => !taken.has(slot.startsAt));
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const sql = await db();
  if (!sql) return { status: "unavailable" };
  const slot = verifiedSlot(input.startsAt);
  if (!slot) return { status: "occupied" };
  const email = input.email.toLowerCase();
  // The database is the authority for rate protection and slot ownership.
  return sql.begin(async (tx): Promise<BookingResult> => {
    const recent = await tx<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM consultation_bookings
      WHERE email = ${email} AND created_at > NOW() - INTERVAL '1 day'
    `;
    if (Number(recent[0]?.count ?? 0) >= 2) return { status: "limit" };
    const id = `booking_${randomUUID()}`;
    const rows = await tx<{ id: string }[]>`
      INSERT INTO consultation_bookings (
        id, resource_id, brand, starts_at, ends_at, name, email, company,
        project_type, project_goal, timeframe, budget_range, attribution
      ) VALUES (
        ${id}, ${CONSULTATION_RESOURCE}, ${input.brand}, ${slot.startsAt}::timestamptz,
        ${slot.endsAt}::timestamptz, ${input.name}, ${email}, ${input.company},
        ${input.projectType}, ${input.projectGoal}, ${input.timeframe}, ${input.budgetRange},
        ${tx.json(jsonParam(input.attribution))}
      ) ON CONFLICT DO NOTHING RETURNING id
    `;
    return rows.length ? { status: "booked", id, slot } : { status: "occupied" };
  });
}
