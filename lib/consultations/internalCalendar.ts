/** Internal email calendar invites for two admins. One-way invitation transport only.
 * It does NOT read Apple's calendar availability, and cannot guarantee auto-acceptance.
 */
import { Resend } from "resend";
import type { Sql } from "@/lib/pg";

interface Delivery {
  id: string; booking_id: string; recipient: string; kind: "invite"|"cancel";
  brand: "nexcel"|"agiworks"; starts_at: Date|string; ends_at: Date|string;
}
const emails = () => Array.from(new Set((process.env.BOOKING_INTERNAL_CALENDAR_EMAILS || "")
  .split(/[;,]/).map(v => v.trim().toLowerCase()).filter(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)))).slice(0,8);
const fromAddress = (brand: Delivery["brand"]) => (brand === "agiworks" ? process.env.BOOKING_FROM_EMAIL_AGIWORKS : process.env.BOOKING_FROM_EMAIL_NEXCEL) || process.env.BOOKING_FROM_EMAIL;
function asEmail(value: string): string { return value.match(/<([^>]+)>/)?.[1] || value.trim(); }
function icsDate(value: Date | string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function esc(value: string): string { return value.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }
/** Create a standards-oriented ICS request. No customer PII is embedded. */
export function generateInternalIcs(row: Delivery, from: string): string {
  const isCancel = row.kind === "cancel";
  const brand = row.brand === "agiworks" ? "AGI Works" : "NEXCEL AI";
  const organizer = asEmail(from);
  const method = isCancel ? "CANCEL" : "REQUEST";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NEXCEL AI AGI Works//Consultation Calendar//DE",
    "CALSCALE:GREGORIAN", `METHOD:${method}`,
    "BEGIN:VEVENT", `UID:${esc(row.booking_id)}@nexcelai.de`,
    `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(row.starts_at)}`, `DTEND:${icsDate(row.ends_at)}`,
    `SUMMARY:${esc(brand + " - Beratungstermin")}`,
    "DESCRIPTION:Details zum Termin ausschließlich im geschützten Admin-Panel prüfen.",
    `ORGANIZER;CN=${esc(brand)}:mailto:${organizer}`,
    `ATTENDEE;CN=Team;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${row.recipient}`,
    `SEQUENCE:${isCancel ? 1 : 0}`,
    `STATUS:${isCancel ? "CANCELLED" : "CONFIRMED"}`,
  ];
  if (!isCancel) lines.push("BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Beratungstermin in 30 Minuten", "END:VALARM");
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Only confirmed bookings get invitations; cancellations use the same UID and higher sequence. */
export async function dispatchInternalCalendarInvites(sql: Sql): Promise<{configured:boolean;sent:number}> {
  const recipients = emails();
  const configured = Boolean(process.env.RESEND_API_KEY && recipients.length);
  if (!configured) return {configured:false,sent:0};
  for (const recipient of recipients) {
    await sql`
      INSERT INTO internal_calendar_deliveries(id,booking_id,recipient,kind)
      SELECT 'ci_' || md5(b.id || ':' || ${recipient} || ':invite'), b.id, ${recipient}, 'invite'
      FROM consultation_bookings b
      WHERE b.status='confirmed' AND b.starts_at > NOW()
      ON CONFLICT(booking_id,recipient,kind) DO NOTHING
    `;
    await sql`
      INSERT INTO internal_calendar_deliveries(id,booking_id,recipient,kind)
      SELECT 'cc_' || md5(b.id || ':' || ${recipient} || ':cancel'), b.id, ${recipient}, 'cancel'
      FROM consultation_bookings b
      WHERE b.status='cancelled'
        AND EXISTS (SELECT 1 FROM internal_calendar_deliveries i
          WHERE i.booking_id=b.id AND i.recipient=${recipient} AND i.kind='invite' AND i.sent_at IS NOT NULL)
      ON CONFLICT(booking_id,recipient,kind) DO NOTHING
    `;
  }
  const rows = await sql<Delivery[]>`
    WITH next AS (
      SELECT c.id FROM internal_calendar_deliveries c
      WHERE c.sent_at IS NULL AND c.attempts < 8
        AND (c.claimed_at IS NULL OR c.claimed_at < NOW() - INTERVAL '20 minutes')
      ORDER BY c.created_at ASC LIMIT 12 FOR UPDATE SKIP LOCKED
    ), claimed AS (
      UPDATE internal_calendar_deliveries c SET attempts=c.attempts+1,claimed_at=NOW()
      WHERE c.id IN (SELECT id FROM next)
      RETURNING c.id,c.booking_id,c.recipient,c.kind
    )
    SELECT c.id,c.booking_id,c.recipient,c.kind,b.brand,b.starts_at,b.ends_at
    FROM claimed c JOIN consultation_bookings b ON b.id=c.booking_id
    WHERE (c.kind='invite' AND b.status='confirmed') OR (c.kind='cancel' AND b.status='cancelled')
  `;
  const resend = new Resend(process.env.RESEND_API_KEY!);
  let sent=0;
  for (const row of rows) {
    const from=fromAddress(row.brand);
    if (!from) continue;
    const title=row.brand === "agiworks" ? "AGI Works" : "NEXCEL AI";
    const content=Buffer.from(generateInternalIcs(row, from),"utf8");
    try {
      const result=await resend.emails.send({
        from, to: row.recipient,
        subject: `${row.kind === "cancel" ? "Stornierung" : "Kalendereinladung"}: ${title} Beratung`,
        html: `<p>${row.kind === "cancel" ? "Ein Beratungstermin wurde storniert." : "Ein Beratungstermin wurde bestätigt."} Ein iCalendar-Termin befindet sich im Anhang. Bitte den Termin im Apple-Kalender annehmen bzw. die Stornierung bestätigen.</p><p>Details zum Kunden ausschließlich im geschützten Admin-Panel.</p>`,
        attachments: [{ filename: "beratungstermin.ics", content }],
      });
      if (result.error) throw new Error("email transport failed");
      await sql`UPDATE internal_calendar_deliveries SET sent_at=NOW(),claimed_at=NULL WHERE id=${row.id}`;
      sent++;
    } catch { console.error("[internal-calendar] mail submit failed"); }
  }
  return {configured:true,sent};
}
