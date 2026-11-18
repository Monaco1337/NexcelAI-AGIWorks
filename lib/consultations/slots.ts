/** Shared, deterministic availability for both brands. Europe/Berlin civil time. */
export const CONSULTATION_TZ = "Europe/Berlin";
export const CONSULTATION_RESOURCE = "shared-consultation-team";
export const CONSULTATION_DURATION_MINUTES = 45;
export const CONSULTATION_LEAD_HOURS = 24;
export const CONSULTATION_WINDOW_DAYS = 28;
const START_HOURS = [10, 11, 14, 15] as const;
const MS_DAY = 86_400_000;

export type ConsultationBrand = "nexcel" | "agiworks";
export interface ConsultationSlot { startsAt: string; endsAt: string; }

function localParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CONSULTATION_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const n = (k: string) => Number(parts.find((p) => p.type === k)?.value);
  return { year: n("year"), month: n("month"), day: n("day"), hour: n("hour"), minute: n("minute") };
}

/** Convert unambiguous daytime civil hours to UTC without server timezone assumptions. */
export function berlinCivilToUtc(year: number, month: number, day: number, hour: number): Date {
  const target = Date.UTC(year, month - 1, day, hour, 0, 0);
  let candidate = target;
  for (let i = 0; i < 3; i += 1) {
    const p = localParts(new Date(candidate));
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    candidate += target - asUtc;
  }
  const p = localParts(new Date(candidate));
  if (p.year !== year || p.month !== month || p.day !== day || p.hour !== hour || p.minute !== 0) {
    throw new Error("invalid Europe/Berlin local consultation slot");
  }
  return new Date(candidate);
}

/** Fixed 45-minute slots never overlap, including across a DST transition. */
export function candidateSlots(now = new Date()): ConsultationSlot[] {
  const today = localParts(now);
  const civilBase = Date.UTC(today.year, today.month - 1, today.day);
  const minStart = now.getTime() + CONSULTATION_LEAD_HOURS * 3_600_000;
  const slots: ConsultationSlot[] = [];
  for (let offset = 0; offset < CONSULTATION_WINDOW_DAYS; offset += 1) {
    const day = new Date(civilBase + offset * MS_DAY);
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const hour of START_HOURS) {
      const starts = berlinCivilToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hour);
      if (starts.getTime() <= minStart) continue;
      const ends = new Date(starts.getTime() + CONSULTATION_DURATION_MINUTES * 60_000);
      slots.push({ startsAt: starts.toISOString(), endsAt: ends.toISOString() });
    }
  }
  return slots;
}

export function verifiedSlot(iso: unknown, now = new Date()): ConsultationSlot | null {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(iso)) return null;
  return candidateSlots(now).find((slot) => slot.startsAt === iso) ?? null;
}
