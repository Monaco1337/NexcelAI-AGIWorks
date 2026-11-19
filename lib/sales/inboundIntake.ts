/**
 * Server-only inbound lead ingestion.
 * Data minimisation, transactional idempotency, deterministic prioritisation.
 * No AI-generated claims, external enrichment, outreach or automated messaging.
 */
import { randomUUID } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { dispatchAdminAlerts } from "@/lib/push/dispatch";

export type IntakeBrand = "nexcel" | "agiworks";
export type IntakeResult = "inserted" | "duplicate" | "unavailable";

export interface IntakeInput {
  sourceType: "contact-form" | "calculator" | "booking";
  sourceId: string;
  brand: IntakeBrand;
  name: string;
  email: string;
  company?: string | null;
  subject?: string | null;
  message?: string | null;
  attribution?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
}

function shorten(value: string | null | undefined, max: number): string {
  return (typeof value === "string" ? value : "").trim().slice(0, max);
}

/** Explainable triage is a queue priority, not a sales or purchase prediction. */
export function classifyPriority(company: string, subject: string, message: string): "high" | "normal" {
  const intent = /\b(erp|crm|saas|llm|rag|softwareentwicklung|automation|automatisierung|ki.agent|plattform|integration)\b/i;
  return company.trim().length > 1 && intent.test(`${subject} ${message}`) ? "high" : "normal";
}

export async function recordInboundLead(input: IntakeInput): Promise<IntakeResult> {
  const sql = await db();
  if (!sql) return "unavailable";
  const name = shorten(input.name, 160);
  const email = shorten(input.email, 254).toLowerCase();
  const company = shorten(input.company, 160);
  const subject = shorten(input.subject, 180);
  const message = shorten(input.message, 6000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid inbound lead");
  if (!input.sourceId || input.sourceId.length > 150) throw new Error("invalid source id");
  const safeAttribution = input.attribution ?? {};
  const safeDetails = input.details ?? {};
  if (JSON.stringify(safeAttribution).length > 6000 || JSON.stringify(safeDetails).length > 10000) {
    throw new Error("intake metadata too large");
  }
  const priority = classifyPriority(company, subject, message);
  const id = `in_${randomUUID()}`;
  const rows = await sql<{ id: string }[]>`
    INSERT INTO marketing_inbound_leads (
      id, source_type, source_id, brand, name, email, company, subject, message,
      attribution, details, priority, next_action_at
    ) VALUES (
      ${id}, ${input.sourceType}, ${input.sourceId}, ${input.brand},
      ${name}, ${email}, ${company || null}, ${subject}, ${message},
      ${sql.json(jsonParam(safeAttribution))}, ${sql.json(jsonParam(safeDetails))},
      ${priority}, NOW() + INTERVAL '1 day'
    )
    ON CONFLICT (source_type, source_id) DO NOTHING
    RETURNING id
  `;
  if (rows.length) {
    try { await dispatchAdminAlerts(sql); }
    catch { console.error("[admin alerts] immediate dispatch deferred to cron"); }
  }
  return rows.length ? "inserted" : "duplicate";
}
