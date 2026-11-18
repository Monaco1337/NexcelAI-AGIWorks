/** Common, brand-independent consultation availability in Europe/Berlin. */
export const CONSULTATION_TZ = "Europe/Berlin";
export const CONSULTATION_RESOURCE = "shared-consultation-team";
export const CONSULTATION_DURATION_MINUTES = 45;
export const CONSULTATION_LEAD_HOURS = 24;
export const CONSULTATION_WINDOW_DAYS = 28;
const MS_DAY = 86_400_000;

export type ConsultationBrand = "nexcel" | "agiworks";
export interface ConsultationSlot { startsAt: string; endsAt: string }
export interface WeeklySlotRule { weekday: number; startMinute: number }
export interface SlotOverride { startsAt: string; action: "open" | "block" }
export interface AvailabilityConfig {
  weekly: WeeklySlotRule[];
  overrides: SlotOverride[];
  blockedDates: string[];
}

function localParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CONSULTATION_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const num = (key: string) => Number(parts.find((p) => p.type === key)?.value);
  return { year: num("year"), month: num("month"), day: num("day"), hour: num("hour"), minute: num("minute") };
}
export function berlinCivilToUtc(year: number, month: number, day: number, hour: number, minute = 0): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = target;
  for (let i = 0; i < 3; i++) {
    const p = localParts(new Date(candidate));
    candidate += target - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  }
  const p = localParts(new Date(candidate));
  if (p.year !== year || p.month !== month || p.day !== day || p.hour !== hour || p.minute !== minute) {
    throw new Error("Invalid local date/time for Europe/Berlin");
  }
  return new Date(candidate);
}
function dateKey(d: Date): string {
  const p = localParts(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
function makeSlot(start: Date): ConsultationSlot {
  return { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + CONSULTATION_DURATION_MINUTES * 60_000).toISOString() };
}
export function validStartMinute(value: number): boolean {
  return Number.isInteger(value) && value >= 8 * 60 && value <= 19 * 60 && value % 15 === 0;
}
export function parseLocalSlot(value: string): string | null {
  // Input is civil time, not browser-local time or UTC.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (!validStartMinute(hour * 60 + minute)) return null;
  try {
    const timestamp = berlinCivilToUtc(year, month, day, hour, minute);
    return timestamp.toISOString();
  } catch { return null; }
}
export function configuredSlots(config: AvailabilityConfig, now = new Date()): ConsultationSlot[] {
  const p = localParts(now);
  const base = Date.UTC(p.year, p.month - 1, p.day);
  const min = now.getTime() + CONSULTATION_LEAD_HOURS * 3_600_000;
  const max = base + CONSULTATION_WINDOW_DAYS * MS_DAY;
  const blocked = new Set(config.blockedDates);
  const all = new Map<string, ConsultationSlot>();
  for (let offset = 0; offset < CONSULTATION_WINDOW_DAYS; offset++) {
    const d = new Date(base + offset * MS_DAY);
    const date = d.toISOString().slice(0, 10);
    if (blocked.has(date)) continue;
    const weekday = d.getUTCDay();
    for (const rule of config.weekly) {
      if (rule.weekday !== weekday || !validStartMinute(rule.startMinute)) continue;
      const start = berlinCivilToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), Math.floor(rule.startMinute / 60), rule.startMinute % 60);
      if (start.getTime() > min) all.set(start.toISOString(), makeSlot(start));
    }
  }
  for (const rule of config.overrides) {
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(rule.startsAt)) continue;
    const start = new Date(rule.startsAt);
    const parts = localParts(start);
    const civilDay = Date.UTC(parts.year, parts.month - 1, parts.day);
    if (Number.isNaN(start.getTime()) || start.getTime() <= min || civilDay < base || civilDay >= max) continue;
    if (rule.action === "block" || blocked.has(dateKey(start))) all.delete(rule.startsAt);
    else if (rule.action === "open" && validStartMinute(parts.hour * 60 + parts.minute)) all.set(rule.startsAt, makeSlot(start));
  }
  // Date closures are authoritative even if a manual opening also exists.
  for (const [key] of all) if (blocked.has(dateKey(new Date(key)))) all.delete(key);
  const ordered = [...all.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const nonOverlapping: ConsultationSlot[] = [];
  for (const slot of ordered) {
    if (!nonOverlapping.length || slot.startsAt >= nonOverlapping[nonOverlapping.length - 1].endsAt) nonOverlapping.push(slot);
  }
  return nonOverlapping;
}

/** Kept only for the existing deterministic DST regression test; not used for production availability. */
export function candidateSlots(now = new Date()): ConsultationSlot[] {
  const weekly = [1,2,3,4,5].flatMap((weekday) => [600,660,840,900].map((startMinute) => ({weekday,startMinute})));
  return configuredSlots({weekly,overrides:[],blockedDates:[]},now);
}
export function verifiedSlot(iso: unknown, now = new Date()): ConsultationSlot | null {
  return typeof iso === "string" ? candidateSlots(now).find((s) => s.startsAt === iso) ?? null : null;
}
