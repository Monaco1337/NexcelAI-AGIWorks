/**
 * 0003 — Audit-Log für alle schreibenden Vorgänge im CRM.
 *
 * Bisher gab es keinerlei Nachvollziehbarkeit: wer einen Kontakt gelöscht oder
 * eine Referenz geändert hat, war nach dem Vorgang nicht mehr feststellbar.
 *
 * Das Log ist bewusst append-only modelliert — es gibt keine UPDATE- oder
 * DELETE-Pfade in der Anwendung. Der Akteur wird als Text mitgeschrieben statt
 * nur als Fremdschlüssel, damit der Eintrag auch dann aussagekräftig bleibt,
 * wenn der Nutzer später entfernt wird.
 */

import type { Migration } from "../migrationRunner";

export const migration0003: Migration = {
  id: "0003",
  name: "audit_log",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id           TEXT PRIMARY KEY,
        /* Akteur: Fremdschlüssel für Joins, Klartext für Beständigkeit. */
        actor_id     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        actor_email  TEXT NOT NULL DEFAULT '',
        actor_role   TEXT NOT NULL DEFAULT '',
        /* "system" für Hintergrundprozesse ohne angemeldeten Nutzer. */
        actor_kind   TEXT NOT NULL DEFAULT 'user',
        /* Punktnotation, z. B. "ticket.status_changed", "reference.deleted". */
        action       TEXT NOT NULL,
        entity_type  TEXT NOT NULL,
        entity_id    TEXT NOT NULL,
        /* Zustand vor und nach der Änderung, auf geänderte Felder reduziert. */
        before_state JSONB,
        after_state  JSONB,
        /* Freier Kontext: Grund, Massenvorgangs-ID, ausgelöste Automation. */
        context      JSONB NOT NULL DEFAULT '{}',
        ip           TEXT,
        user_agent   TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    /* Häufigste Abfrage: Verlauf eines bestimmten Objekts, neueste zuerst. */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_entity
      ON audit_log (entity_type, entity_id, created_at DESC)
    `;
    /* Zweithäufigste: was hat ein bestimmter Nutzer zuletzt getan. */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_actor
      ON audit_log (actor_id, created_at DESC) WHERE actor_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_created
      ON audit_log (created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_action
      ON audit_log (action, created_at DESC)
    `;
  },
};
