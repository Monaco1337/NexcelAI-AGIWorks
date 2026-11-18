/** Transactional (not marketing) e-mail dispatch through an already verified sender. */
import { Resend } from "resend";
import type { Sql } from "@/lib/pg";

type Notice = "confirmation" | "reminder" | "cancellation";
interface BookingRow {
  id: string;
  brand: "nexcel" | "agiworks";
  starts_at: Date | string;
  ends_at: Date | string;
  name: string;
  email: string;
}
function safe(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}
function when(value: Date | string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "full", timeStyle: "short", timeZone: "Europe/Berlin",
  }).format(new Date(value));
}
function sender(brand: BookingRow["brand"]): string | null {
  return (brand === "agiworks" ? process.env.BOOKING_FROM_EMAIL_AGIWORKS : process.env.BOOKING_FROM_EMAIL_NEXCEL) || process.env.BOOKING_FROM_EMAIL || null;
}
async function claim(sql: Sql, kind: Notice, allowNexcel: boolean, allowAgi: boolean): Promise<BookingRow[]> {
  if (kind === "confirmation") {
    return sql<BookingRow[]>`
      UPDATE consultation_bookings SET confirmation_claimed_at = NOW()
      WHERE id IN (
        SELECT id FROM consultation_bookings
        WHERE status = 'confirmed' AND starts_at > NOW()
          AND ((${allowNexcel}::boolean AND brand = 'nexcel') OR (${allowAgi}::boolean AND brand = 'agiworks'))
          AND confirmation_sent_at IS NULL
          AND (confirmation_claimed_at IS NULL OR confirmation_claimed_at < NOW() - INTERVAL '20 minutes')
        ORDER BY created_at ASC LIMIT 10 FOR UPDATE SKIP LOCKED
      ) RETURNING id, brand, starts_at, ends_at, name, email
    `;
  }
  if (kind === "cancellation") {
    return sql<BookingRow[]>`
      UPDATE consultation_bookings SET cancellation_claimed_at=NOW()
      WHERE id IN (
        SELECT id FROM consultation_bookings
        WHERE status='cancelled' AND cancellation_sent_at IS NULL
          AND ((${allowNexcel}::boolean AND brand = 'nexcel') OR (${allowAgi}::boolean AND brand = 'agiworks'))
          AND (cancellation_claimed_at IS NULL OR cancellation_claimed_at < NOW() - INTERVAL '20 minutes')
        ORDER BY updated_at ASC LIMIT 10 FOR UPDATE SKIP LOCKED
      ) RETURNING id, brand, starts_at, ends_at, name, email
    `;
  }
  return sql<BookingRow[]>`
    UPDATE consultation_bookings SET reminder_claimed_at = NOW()
    WHERE id IN (
      SELECT id FROM consultation_bookings
      WHERE status = 'confirmed' AND starts_at BETWEEN NOW() + INTERVAL '21 hours' AND NOW() + INTERVAL '25 hours'
        AND ((${allowNexcel}::boolean AND brand = 'nexcel') OR (${allowAgi}::boolean AND brand = 'agiworks'))
        AND confirmation_sent_at IS NOT NULL AND reminder_sent_at IS NULL
        AND (reminder_claimed_at IS NULL OR reminder_claimed_at < NOW() - INTERVAL '20 minutes')
      ORDER BY starts_at ASC LIMIT 10 FOR UPDATE SKIP LOCKED
    ) RETURNING id, brand, starts_at, ends_at, name, email
  `;
}

/** Safe to run every 10 min from the existing authenticated inbound-intake cron. */
export async function dispatchBookingNotifications(sql: Sql): Promise<{ confirmations: number; reminders: number; cancellations: number; configured: boolean }> {
  if (!process.env.RESEND_API_KEY) return { confirmations: 0, reminders: 0, cancellations: 0, configured: false };
  const allowNexcel = Boolean(sender("nexcel"));
  const allowAgi = Boolean(sender("agiworks"));
  if (!allowNexcel && !allowAgi) return { confirmations: 0, reminders: 0, cancellations: 0, configured: false };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const sent = { confirmations: 0, reminders: 0, cancellations: 0, configured: true };
  for (const kind of ["confirmation", "reminder", "cancellation"] as const) {
    const rows = await claim(sql, kind, allowNexcel, allowAgi);
    for (const booking of rows) {
      const from = sender(booking.brand);
      if (!from) continue; // No unverified sender fallback; keep pending for later.
      const brand = booking.brand === "agiworks" ? "AGI Works" : "NEXCEL AI";
      const title = kind === "confirmation" ? `Terminreservierung bei ${brand}` : kind === "reminder" ? `Erinnerung: Ihr Beratungstermin bei ${brand}` : `Absage Ihres Beratungstermins bei ${brand}`;
      const body = kind === "confirmation"
        ? "Ihr Beratungstermin wurde in unserem gemeinsamen Terminplaner reserviert. Die organisatorischen Einzelheiten stimmen wir gesondert mit Ihnen ab."
        : kind === "reminder"
          ? "Ihr Beratungstermin steht bevor. Wenn Sie verhindert sind, antworten Sie bitte auf die bisherige Korrespondenz."
          : "Ihr ursprünglich reservierter Beratungstermin wurde storniert und ist nicht mehr gültig. Bitte nehmen Sie Kontakt auf, falls Sie einen Ersatztermin wünschen.";
      try {
        const response = await resend.emails.send({
          from, to: booking.email, subject: title,
          html: `<div style="font-family:system-ui,sans-serif;max-width:580px;margin:auto;padding:28px;color:#111827"><h1 style="font-size:22px">${safe(brand)} – Beratung</h1><p>Guten Tag ${safe(booking.name)},</p><p>${safe(body)}</p><p><strong>${safe(when(booking.starts_at))} Uhr (Europe/Berlin)</strong></p><p>Dauer: 45 Minuten</p><p>Dies ist eine transaktionale Terminbenachrichtigung, keine Werbung.</p></div>`,
        });
        if (response.error) throw new Error("mail provider error");
        if (kind === "confirmation") {
          await sql`UPDATE consultation_bookings SET confirmation_sent_at=NOW() WHERE id=${booking.id} AND status='confirmed'`;
          sent.confirmations += 1;
        } else if (kind === "reminder") {
          await sql`UPDATE consultation_bookings SET reminder_sent_at=NOW() WHERE id=${booking.id} AND status='confirmed'`;
          sent.reminders += 1;
        } else {
          await sql`UPDATE consultation_bookings SET cancellation_sent_at=NOW() WHERE id=${booking.id} AND status='cancelled'`;
          sent.cancellations += 1;
        }
      } catch { console.error("[consultation email] delivery failed (no personal details logged)"); }
    }
  }
  return sent;
}
