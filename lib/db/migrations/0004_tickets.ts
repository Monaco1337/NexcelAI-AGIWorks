/**
 * 0004 — Ticket-Kernmodell.
 *
 * Entwurfsentscheidungen, die den Rest des Moduls prägen:
 *
 *  - EIN Tabellenstamm für alle Ticketarten (Störung, Problem, Änderung,
 *    Aufgabe, Sicherheit, Support) statt sechs getrennter Tabellen. Die Arten
 *    unterscheiden sich in Ablauf und Pflichtfeldern, nicht in ihrer Struktur.
 *    Getrennte Tabellen würden jede Suche, jede Liste und jede Verknüpfung
 *    über UNION erzwingen.
 *
 *  - KEINE eigene Aktivitätstabelle. Das Audit-Log aus Migration 0003 erfasst
 *    Akteur, Aktion und Feldänderungen bereits vollständig; eine zweite
 *    Historie würde dieselben Daten ein zweites Mal führen und zwangsläufig
 *    auseinanderlaufen.
 *
 *  - Weiches Löschen über `deleted_at`, damit Wiederherstellen möglich ist.
 *    Alle Leseabfragen filtern darauf; ein Teilindex hält sie schnell.
 *
 *  - `version` für optimistische Sperren: zwei gleichzeitig geöffnete
 *    Bearbeitungsmasken dürfen sich nicht gegenseitig überschreiben.
 *
 *  - Volltextsuche als generierte Spalte statt Trigger. Sie kann nie
 *    veralten, weil Postgres sie bei jedem Schreibvorgang selbst pflegt.
 */

import type { Migration } from "../migrationRunner";

export const migration0004: Migration = {
  id: "0004",
  name: "tickets_core",
  up: async (sql) => {
    /* ── Lesbare Ticketnummern ──────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_counters (
        scope TEXT PRIMARY KEY,
        value INTEGER NOT NULL DEFAULT 0
      )
    `;
    await sql`
      INSERT INTO ticket_counters (scope, value) VALUES ('ticket', 0)
      ON CONFLICT (scope) DO NOTHING
    `;

    /* ── Tickets ────────────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id             TEXT PRIMARY KEY,
        /* Lesbare Nummer wie "TIC-1042" — in Gesprächen und E-Mails nutzbar. */
        key            TEXT NOT NULL,
        type           TEXT NOT NULL DEFAULT 'support',
        status         TEXT NOT NULL DEFAULT 'new',
        priority       TEXT NOT NULL DEFAULT 'normal',
        /* Nur für Störungen und Sicherheitsvorfälle relevant, sonst NULL. */
        severity       TEXT,

        title          TEXT NOT NULL,
        description    TEXT NOT NULL DEFAULT '',

        brand          TEXT NOT NULL DEFAULT 'nexcel',
        org_id         TEXT REFERENCES crm_organizations(id) ON DELETE SET NULL,

        requester_id   TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        assignee_id    TEXT REFERENCES crm_users(id) ON DELETE SET NULL,

        /* manual | portal | email | automation */
        source         TEXT NOT NULL DEFAULT 'manual',
        labels         TEXT[] NOT NULL DEFAULT '{}',

        /* internal: nur für Mitarbeiter. shared: im späteren Kundenportal
           für die zugehörige Organisation sichtbar. */
        visibility     TEXT NOT NULL DEFAULT 'internal',

        due_at              TIMESTAMPTZ,
        first_response_at   TIMESTAMPTZ,
        resolved_at         TIMESTAMPTZ,
        closed_at           TIMESTAMPTZ,

        /* SLA-Felder werden hier bereits angelegt, damit Phase 4 keine
           Änderung an einer dann gefüllten Tabelle braucht. */
        sla_policy_id        TEXT,
        sla_response_due_at  TIMESTAMPTZ,
        sla_resolution_due_at TIMESTAMPTZ,
        sla_breached         BOOLEAN NOT NULL DEFAULT FALSE,

        archived_at    TIMESTAMPTZ,
        deleted_at     TIMESTAMPTZ,

        version        INTEGER NOT NULL DEFAULT 1,
        created_by     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        /* Deutsche Textsuchkonfiguration: stemmt "Rechnungen" auf "rechnung"
           und ignoriert Füllwörter. Der Titel wiegt schwerer als der Text. */
        search_vector  tsvector GENERATED ALWAYS AS (
          setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('german', coalesce(description, '')), 'B') ||
          setweight(to_tsvector('simple', coalesce(key, '')), 'A')
        ) STORED
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_key ON tickets (key)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_search ON tickets USING GIN (search_vector)`;

    /* Die Standardliste: offene Tickets, neueste zuerst. Der Teilindex hält
       gelöschte Zeilen komplett heraus. */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_board
      ON tickets (created_at DESC, id DESC)
      WHERE deleted_at IS NULL AND archived_at IS NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_status
      ON tickets (status, priority, created_at DESC) WHERE deleted_at IS NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_assignee
      ON tickets (assignee_id, status) WHERE deleted_at IS NULL AND assignee_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_requester
      ON tickets (requester_id, created_at DESC) WHERE deleted_at IS NULL AND requester_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_org
      ON tickets (org_id, created_at DESC) WHERE deleted_at IS NULL AND org_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_type_brand
      ON tickets (type, brand, created_at DESC) WHERE deleted_at IS NULL
    `;
    /* Für die SLA-Überwachung im Hintergrundlauf: nur unerledigte Tickets mit
       gesetzter Frist. */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_sla_due
      ON tickets (sla_resolution_due_at)
      WHERE deleted_at IS NULL AND resolved_at IS NULL AND sla_resolution_due_at IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_labels ON tickets USING GIN (labels)
    `;

    /* ── Kommentare ─────────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id          TEXT PRIMARY KEY,
        ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        author_id   TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        body        TEXT NOT NULL,
        /* Interne Notizen bleiben im späteren Kundenportal unsichtbar. */
        is_internal BOOLEAN NOT NULL DEFAULT TRUE,
        edited_at   TIMESTAMPTZ,
        deleted_at  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket
      ON ticket_comments (ticket_id, created_at ASC) WHERE deleted_at IS NULL
    `;

    /* ── Anhänge ────────────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id           TEXT PRIMARY KEY,
        ticket_id    TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        comment_id   TEXT REFERENCES ticket_comments(id) ON DELETE CASCADE,
        filename     TEXT NOT NULL,
        content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        byte_size    INTEGER NOT NULL DEFAULT 0,
        data         BYTEA NOT NULL,
        uploaded_by  TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    /* Ohne eigene Spaltenliste würde jede Anhangsliste die Binärdaten
       mitlesen — der Index deckt die Metadatenabfrage ab. */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket
      ON ticket_attachments (ticket_id, created_at ASC)
    `;

    /* ── Beziehungen ────────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_relations (
        id           TEXT PRIMARY KEY,
        from_ticket  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        to_ticket    TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        /* blocks | duplicates | relates_to | caused_by | child_of */
        relation     TEXT NOT NULL,
        created_by   TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        /* Ein Ticket kann sich nicht selbst blockieren. */
        CONSTRAINT ticket_relation_not_self CHECK (from_ticket <> to_ticket)
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_relations_unique
      ON ticket_relations (from_ticket, to_ticket, relation)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ticket_relations_to
      ON ticket_relations (to_ticket)
    `;

    /* ── Beobachter ─────────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_watchers (
        ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id    TEXT NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (ticket_id, user_id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ticket_watchers_user
      ON ticket_watchers (user_id)
    `;
  },
};
