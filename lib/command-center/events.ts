/** Atomic domain-event record and direct in-app notification. */
import { randomUUID } from "node:crypto";
import type { Tx } from "@/lib/db/migrationRunner";
import { jsonParam } from "@/lib/pg";

type Brand = "nexcel" | "agiworks";
export type CommandEvent = {
  key: string;
  type: string;
  brand: Brand;
  entityType: string;
  entityId: string;
  actorId: string | null;
  recipientId?: string | null;
  title?: string;
  detail?: string;
  targetTab?: string;
  payload?: Record<string, unknown>;
};

/**
 * Never sends email or performs destructive actions. Both records are inserted
 * inside the caller's existing business transaction. The event log is durable
 * for a future explicitly authorized worker; Phase 1 handles only in-app fanout.
 */
export async function recordCommandEventTx(tx: Tx, event: CommandEvent): Promise<void> {
  // Rollout compatibility: an old database stays operational until migration 0020.
  const [schema] = await tx<{ exists: string | null }[]>`
    SELECT to_regclass('public.command_events')::text AS exists
  `;
  if (!schema?.exists) return;
  const inserted = await tx<{ id: string }[]>`
    INSERT INTO command_events (
      id, event_key, event_type, brand, entity_type, entity_id, actor_id, payload
    ) VALUES (
      ${randomUUID()}, ${event.key}, ${event.type}, ${event.brand},
      ${event.entityType}, ${event.entityId}, ${event.actorId},
      ${tx.json(jsonParam(event.payload ?? {}))}
    ) ON CONFLICT (event_key) DO NOTHING RETURNING id
  `;
  if (!inserted.length || !event.recipientId || event.recipientId === event.actorId) return;
  await tx`
    INSERT INTO command_notifications (
      id, event_key, recipient_id, brand, title, detail, target_tab
    ) VALUES (
      ${randomUUID()}, ${event.key}, ${event.recipientId}, ${event.brand},
      ${event.title ?? "Neue Aufgabe"}, ${event.detail ?? ""},
      ${event.targetTab ?? "overview"}
    ) ON CONFLICT (event_key, recipient_id) DO NOTHING
  `;
}
