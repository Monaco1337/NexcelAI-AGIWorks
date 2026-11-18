import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 20 || !header?.startsWith("Bearer ")) return false;
  const received = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Vercel Cron: reconcile contact_posts to the lead queue without duplicates. */
export async function GET(req: NextRequest) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sql = await db();
    if (!sql) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const rows = await sql<{ id: string }[]>`
      WITH pending AS (
        SELECT c.id, c.created_at, c.vorname, c.nachname, c.email,
               c.unternehmen, c.betreff, c.nachricht, c.brand, c.source_host
        FROM contact_posts c
        WHERE NOT EXISTS (
          SELECT 1 FROM marketing_inbound_leads m
          WHERE m.source_type = 'contact-form' AND m.source_id = c.id
        )
        ORDER BY c.created_at ASC
        LIMIT 200
      )
      INSERT INTO marketing_inbound_leads (
        id, source_type, source_id, brand, name, email, company, subject, message,
        attribution, priority, next_action_at, created_at
      )
      SELECT
        'in_contact_' || p.id, 'contact-form', p.id,
        CASE WHEN p.brand IN ('nexcel','agiworks') THEN p.brand ELSE 'nexcel' END,
        LEFT(TRIM(p.vorname || ' ' || p.nachname), 160),
        LEFT(LOWER(TRIM(p.email)), 254),
        NULLIF(LEFT(TRIM(COALESCE(p.unternehmen, '')), 160), ''),
        LEFT(p.betreff, 180), LEFT(p.nachricht, 6000),
        jsonb_build_object('sourceHost', p.source_host),
        CASE WHEN NULLIF(TRIM(COALESCE(p.unternehmen, '')), '') IS NOT NULL AND
          (p.betreff || ' ' || p.nachricht) ~* '(erp|crm|saas|llm|rag|softwareentwicklung|automation|automatisierung|ki.agent|plattform|integration)'
          THEN 'high' ELSE 'normal' END,
        GREATEST(NOW(), p.created_at + INTERVAL '1 day'), p.created_at
      FROM pending p
      ON CONFLICT (source_type, source_id) DO NOTHING
      RETURNING id
    `;
    const overdue = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM marketing_inbound_leads
      WHERE status IN ('new','in_review') AND next_action_at < NOW()
    `;
    return NextResponse.json({ ok: true, imported: rows.length, overdue: Number(overdue[0]?.count ?? 0) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // Never print contact PII or database details in the public cron response.
    console.error("[inbound-intake-cron] failed");
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
