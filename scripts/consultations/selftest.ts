import { strict as assert } from "node:assert";
import { berlinCivilToUtc, candidateSlots, verifiedSlot, CONSULTATION_DURATION_MINUTES } from "../../lib/consultations/slots";

const winter = berlinCivilToUtc(2026, 1, 15, 10);
const summer = berlinCivilToUtc(2026, 7, 15, 10);
assert.equal(winter.toISOString(), "2026-01-15T09:00:00.000Z");
assert.equal(summer.toISOString(), "2026-07-15T08:00:00.000Z");
const now = new Date("2026-11-18T08:00:00.000Z");
const slots = candidateSlots(now);
assert.ok(slots.length >= 60);
assert.equal(slots.length, new Set(slots.map((x) => x.startsAt)).size);
for (const slot of slots) {
  assert.ok(new Date(slot.startsAt).getTime() > now.getTime() + 24 * 3_600_000);
  assert.equal((new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60_000, CONSULTATION_DURATION_MINUTES);
  assert.deepEqual(verifiedSlot(slot.startsAt, now), slot);
}
assert.equal(verifiedSlot("2026-11-19T04:00:00.000Z", now), null);
console.log(`CONSULTATION_SELFTEST_OK: ${slots.length} nonoverlapping slots; DST and lead-time verified`);
