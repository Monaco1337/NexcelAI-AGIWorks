/** Internal, PII-minimised push/email notice pipeline. Marketing leads remain the source of truth.
 * At-least-once delivery with independent device/recipient rows. Provider acceptance is NOT a read receipt.
 */
import webpush from "web-push";
import { Resend } from "resend";
import type { Sql } from "@/lib/pg";

interface PushDelivery { id: string; endpoint: string; p256dh: string; auth_key: string; brand: "nexcel"|"agiworks"; lead_type: string }
interface EmailDelivery { id: string; recipient: string; brand: "nexcel"|"agiworks"; lead_type: string }
const brandLabel = (brand: string) => brand === "agiworks" ? "AGI Works" : "NEXCEL AI";
const noticeLabel = (kind: string) => kind === "booking" ? "Neue Terminanfrage" : kind === "calculator" ? "Neue Projektanfrage" : "Neue Kontaktanfrage";
const safeEmails = (): string[] => {
  const raw = process.env.ADMIN_ALERT_EMAILS || "";
  return Array.from(new Set(raw.split(/[;,]/).map(s => s.trim().toLowerCase()).filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)))).slice(0, 8);
};
const vapidConfigured = () => Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY && process.env.WEB_PUSH_SUBJECT);

/** Cron-safe reconciliation: no event lost because the initial HTTP request ended early. */
export async function dispatchAdminAlerts(sql: Sql): Promise<{ pushSent: number; emailSent: number; configuredPush: boolean; configuredEmail: boolean }> {
  const recipients = safeEmails();
  const configuredPush = vapidConfigured();
  const configuredEmail = Boolean(recipients.length && process.env.RESEND_API_KEY && (process.env.BOOKING_FROM_EMAIL_NEXCEL || process.env.BOOKING_FROM_EMAIL_AGIWORKS || process.env.BOOKING_FROM_EMAIL));
  if (configuredPush) {
    await sql`
      INSERT INTO admin_push_deliveries (id,lead_id,subscription_id,brand,lead_type)
      SELECT 'pd_' || md5(m.id || ':' || s.id),m.id,s.id,m.brand,m.source_type
      FROM marketing_inbound_leads m
      JOIN admin_push_subscriptions s ON TRUE
      JOIN crm_users u ON u.id=s.user_id AND u.is_active AND u.role IN ('owner','admin')
      WHERE m.created_at >= s.created_at AND m.created_at > NOW() - INTERVAL '3 days'
      ON CONFLICT(lead_id,subscription_id) DO NOTHING
    `;
  }
  if (configuredEmail) {
    for (const recipient of recipients) {
      await sql`
        INSERT INTO admin_alert_emails(id,lead_id,recipient,brand,lead_type)
        SELECT 'em_' || md5(m.id || ':' || ${recipient}),m.id,${recipient},m.brand,m.source_type
        FROM marketing_inbound_leads m
        WHERE m.created_at > NOW() - INTERVAL '3 days'
        ON CONFLICT(lead_id,recipient) DO NOTHING
      `;
    }
  }
  let pushSent = 0;
  if (configuredPush) {
    webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT!, process.env.WEB_PUSH_PUBLIC_KEY!, process.env.WEB_PUSH_PRIVATE_KEY!);
    // Independent per-device lease. A failed device does not block a different device.
    const rows = await sql<PushDelivery[]>`
      WITH next AS (
        SELECT d.id FROM admin_push_deliveries d
        WHERE d.sent_at IS NULL AND d.attempts < 6
          AND (d.claimed_at IS NULL OR d.claimed_at < NOW() - INTERVAL '5 minutes')
        ORDER BY d.created_at ASC LIMIT 12 FOR UPDATE SKIP LOCKED
      ), claimed AS (
        UPDATE admin_push_deliveries d SET attempts=d.attempts+1,claimed_at=NOW()
        WHERE d.id IN (SELECT id FROM next)
        RETURNING d.id,d.subscription_id,d.brand,d.lead_type
      )
      SELECT c.id,s.endpoint,s.p256dh,s.auth_key,c.brand,c.lead_type
      FROM claimed c JOIN admin_push_subscriptions s ON s.id=c.subscription_id
    `;
    await Promise.all(rows.map(async (r) => {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth_key } }, JSON.stringify({
          title: noticeLabel(r.lead_type),
          body: `Neue Anfrage bei ${brandLabel(r.brand)}. Bitte im Admin-Panel prüfen.`,
          tag: r.id,
        }), { TTL: 3600, timeout: 4500 });
        await sql`UPDATE admin_push_deliveries SET sent_at=NOW(),claimed_at=NULL,last_http_status=201 WHERE id=${r.id}`;
        pushSent++;
      } catch (e) {
        const status = typeof (e as {statusCode?:unknown})?.statusCode === "number" ? (e as {statusCode:number}).statusCode : null;
        await sql`UPDATE admin_push_deliveries SET last_http_status=${status} WHERE id=${r.id}`;
        // Discard expired endpoints (not valid subscriptions) after 404/410; cascading removes old delivery rows.
        if (status === 404 || status === 410) await sql`DELETE FROM admin_push_subscriptions WHERE endpoint=${r.endpoint}`;
        console.error("[admin-push] delivery failed", status ?? "network");
      }
    }));
  }
  let emailSent = 0;
  if (configuredEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const rows = await sql<EmailDelivery[]>`
      WITH next AS (
        SELECT e.id FROM admin_alert_emails e
        WHERE e.sent_at IS NULL AND e.attempts < 8
          AND (e.claimed_at IS NULL OR e.claimed_at < NOW() - INTERVAL '5 minutes')
        ORDER BY e.created_at ASC LIMIT 12 FOR UPDATE SKIP LOCKED
      )
      UPDATE admin_alert_emails e SET attempts=e.attempts+1,claimed_at=NOW()
      WHERE e.id IN (SELECT id FROM next)
      RETURNING e.id,e.recipient,e.brand,e.lead_type
    `;
    await Promise.all(rows.map(async (r) => {
      const from = (r.brand === "agiworks" ? process.env.BOOKING_FROM_EMAIL_AGIWORKS : process.env.BOOKING_FROM_EMAIL_NEXCEL) || process.env.BOOKING_FROM_EMAIL;
      if (!from) return;
      try {
        const response = await resend.emails.send({ from, to: r.recipient,
          subject: `${noticeLabel(r.lead_type)} · ${brandLabel(r.brand)}`,
          html: `<p>Es liegt eine neue ${r.lead_type === "booking" ? "Terminanfrage" : "Kontakt- oder Projektanfrage"} vor.</p><p>Bitte öffnen Sie das geschützte Admin-Panel. Kundendaten werden bewusst nicht in Benachrichtigungen übertragen.</p>`,
        });
        if (response.error) throw new Error("provider refused");
        await sql`UPDATE admin_alert_emails SET sent_at=NOW(),claimed_at=NULL WHERE id=${r.id}`;
        emailSent++;
      } catch { console.error("[admin-alert-email] provider submission failed"); }
    }));
  }
  return { pushSent, emailSent, configuredPush, configuredEmail };
}
