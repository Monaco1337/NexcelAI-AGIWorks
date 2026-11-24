/** Command Center Phase 1: additive only, no mutation of existing business data. */
import type { Migration } from "../migrationRunner";

export const migration0020: Migration = {
  id: "0020",
  name: "command_center_tasks_events_notifications",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS command_tasks (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL CHECK (brand IN ('nexcel','agiworks')),
        title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
        due_at TIMESTAMPTZ,
        assigned_to TEXT,
        created_by TEXT NOT NULL,
        source_type TEXT NOT NULL DEFAULT 'manual',
        source_id TEXT,
        client_request_id TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (created_by, client_request_id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_command_tasks_open
      ON command_tasks(brand, status, due_at, created_at DESC)
      WHERE deleted_at IS NULL AND status IN ('open','in_progress')
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_command_tasks_assignee
      ON command_tasks(assigned_to, status, due_at)
      WHERE deleted_at IS NULL
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS command_events (
        id TEXT PRIMARY KEY,
        event_key TEXT NOT NULL UNIQUE,
        event_type TEXT NOT NULL,
        brand TEXT NOT NULL CHECK (brand IN ('nexcel','agiworks')),
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        actor_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_command_events_pending
      ON command_events(created_at, id) WHERE processed_at IS NULL
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS command_notifications (
        id TEXT PRIMARY KEY,
        event_key TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        brand TEXT NOT NULL CHECK (brand IN ('nexcel','agiworks')),
        title TEXT NOT NULL,
        detail TEXT NOT NULL DEFAULT '',
        target_tab TEXT NOT NULL,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (event_key, recipient_id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_command_notifications_user
      ON command_notifications(recipient_id, read_at, created_at DESC)
    `;
  },
};
