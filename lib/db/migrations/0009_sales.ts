/**
 * 0009 — NEXCEL Vertriebsmodul V1.
 *
 * Legt das komplette Datenmodell für das Vertriebsmodul an: zentrale
 * Unternehmensakten, Kontakte, markenkontextsensitive Verkaufschancen,
 * Aktivitäten-/Notiztimeline, Solution-Scope-Snapshots,
 * Angebotsgenerator mit unveränderlichen Versionen, Einwände,
 * versionierte Playbooks und Prompts sowie ein AI-Ausführungsprotokoll.
 *
 * Entwurfsentscheidungen:
 *  - Companies und Contacts bleiben markenübergreifend zentral. Nur
 *    `sales_opportunities.brand_context` trägt den Brand-Kontext
 *    (nexcel | agiworks | both), damit ein Kunde nicht dupliziert werden
 *    muss, wenn dasselbe Kundenprojekt beide Marken involviert.
 *  - Kein Prisma-Modell — wir folgen der bestehenden `postgres.js`-
 *    Konvention aller anderen Migrationen (0001–0008).
 *  - Keine parallele Audit-Tabelle: die bestehende `audit_log` aus
 *    Migration 0003 wird via `writeAuditTx` weiterverwendet.
 *    `sales_activities` erfasst nur die menschlich lesbare Timeline
 *    (Anzeige im Vertriebsmodul), das Audit bleibt Wahrheitsquelle.
 *  - `version INTEGER NOT NULL DEFAULT 1` erlaubt optimistische Sperren
 *    (analog Tickets/Rechnungen).
 *  - Soft-Delete via `deleted_at`; alle Leseabfragen filtern darauf.
 */

import type { Migration } from "../migrationRunner";
import {
  SALES_PROMPT_SEEDS,
  SALES_PLAYBOOK_SEEDS,
} from "../../sales/ai/promptSeeds";

export const migration0009: Migration = {
  id: "0009",
  name: "sales_module",
  up: async (sql) => {
    /* ── Unternehmensakte ─────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_companies (
        id                    TEXT PRIMARY KEY,
        name                  TEXT NOT NULL,
        website               TEXT,
        industry              TEXT,
        city                  TEXT,
        country               TEXT NOT NULL DEFAULT 'DE',
        source                TEXT,
        classification        TEXT,  /* A | B | C | D | null */
        status                TEXT NOT NULL DEFAULT 'neu',
        owner_id              TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        org_id                TEXT REFERENCES crm_organizations(id) ON DELETE SET NULL,
        expected_value_cents  BIGINT,
        proposal_value_cents  BIGINT,
        currency              TEXT NOT NULL DEFAULT 'EUR',
        last_contact_at       TIMESTAMPTZ,
        contact_outcome       TEXT,
        next_action           TEXT,
        next_action_due_at    TIMESTAMPTZ,
        next_meeting_at       TIMESTAMPTZ,
        notes                 TEXT NOT NULL DEFAULT '',
        icp_score             INTEGER,
        icp_evidence          JSONB NOT NULL DEFAULT '{}'::jsonb,
        deleted_at            TIMESTAMPTZ,
        version               INTEGER NOT NULL DEFAULT 1,
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        search_vector         tsvector GENERATED ALWAYS AS (
          setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(website, '')), 'B') ||
          setweight(to_tsvector('german', coalesce(city, '')), 'C')
        ) STORED
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_companies_search ON sales_companies USING GIN (search_vector)`;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_companies_status
      ON sales_companies (status, next_action_due_at ASC NULLS LAST)
      WHERE deleted_at IS NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_companies_owner
      ON sales_companies (owner_id, created_at DESC)
      WHERE deleted_at IS NULL AND owner_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_companies_class
      ON sales_companies (classification, next_action_due_at ASC NULLS LAST)
      WHERE deleted_at IS NULL
    `;

    /* ── Kontakte ────────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_contacts (
        id            TEXT PRIMARY KEY,
        company_id    TEXT NOT NULL REFERENCES sales_companies(id) ON DELETE CASCADE,
        first_name    TEXT,
        last_name     TEXT,
        position      TEXT,
        phone         TEXT,
        email         TEXT,
        role          TEXT NOT NULL DEFAULT 'unbekannt',
        is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
        notes         TEXT NOT NULL DEFAULT '',
        deleted_at    TIMESTAMPTZ,
        created_by    TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by    TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_contacts_company
      ON sales_contacts (company_id, is_primary DESC, created_at ASC)
      WHERE deleted_at IS NULL
    `;

    /* ── Verkaufschancen (Brand-Context) ─────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_opportunities (
        id                    TEXT PRIMARY KEY,
        company_id            TEXT NOT NULL REFERENCES sales_companies(id) ON DELETE CASCADE,
        title                 TEXT NOT NULL,
        brand_context         TEXT NOT NULL DEFAULT 'nexcel',
        status                TEXT NOT NULL DEFAULT 'neu',
        classification        TEXT,  /* A | B | C | D | null */
        contact_outcome       TEXT,
        next_action           TEXT,
        next_action_due_at    TIMESTAMPTZ,
        next_meeting_at       TIMESTAMPTZ,
        expected_value_cents  BIGINT,
        proposal_value_cents  BIGINT,
        currency              TEXT NOT NULL DEFAULT 'EUR',
        close_date            DATE,
        owner_id              TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        lost_reason           TEXT,
        lost_notes            TEXT,
        learning              TEXT,
        won_at                TIMESTAMPTZ,
        lost_at               TIMESTAMPTZ,
        deferred_at           TIMESTAMPTZ,
        deleted_at            TIMESTAMPTZ,
        version               INTEGER NOT NULL DEFAULT 1,
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_opp_brand_context CHECK (brand_context IN ('nexcel','agiworks','both'))
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_opp_company
      ON sales_opportunities (company_id, created_at DESC)
      WHERE deleted_at IS NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_opp_status_brand
      ON sales_opportunities (status, brand_context, next_action_due_at ASC NULLS LAST)
      WHERE deleted_at IS NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_opp_owner_open
      ON sales_opportunities (owner_id, next_action_due_at ASC NULLS LAST)
      WHERE deleted_at IS NULL
        AND status NOT IN ('gewonnen','verloren','zurueckgestellt')
    `;

    /* ── Aktivitäts-Timeline (menschlich lesbar) ─────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_activities (
        id            TEXT PRIMARY KEY,
        entity_type   TEXT NOT NULL,  /* company | opportunity | contact | proposal */
        entity_id     TEXT NOT NULL,
        company_id    TEXT REFERENCES sales_companies(id) ON DELETE CASCADE,
        kind          TEXT NOT NULL,
        summary       TEXT NOT NULL,
        payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
        actor_id      TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        actor_email   TEXT,
        occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_activities_entity
      ON sales_activities (entity_type, entity_id, occurred_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_activities_company
      ON sales_activities (company_id, occurred_at DESC)
      WHERE company_id IS NOT NULL
    `;

    /* ── Notizen (Call- und Discovery-Notes) ─────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_notes (
        id            TEXT PRIMARY KEY,
        entity_type   TEXT NOT NULL,   /* company | opportunity */
        entity_id     TEXT NOT NULL,
        kind          TEXT NOT NULL,   /* call | discovery | internal */
        body          TEXT NOT NULL DEFAULT '',
        structured    JSONB NOT NULL DEFAULT '{}'::jsonb,
        author_id     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        deleted_at    TIMESTAMPTZ,
        version       INTEGER NOT NULL DEFAULT 1,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_notes_entity
      ON sales_notes (entity_type, entity_id, updated_at DESC)
      WHERE deleted_at IS NULL
    `;

    /* ── AI-Prompts (versioniert, editierbar) ─────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_ai_prompts (
        id             TEXT PRIMARY KEY,
        key            TEXT NOT NULL,
        version        INTEGER NOT NULL,
        brand_context  TEXT NOT NULL DEFAULT 'any',  /* nexcel | agiworks | both | any */
        model          TEXT NOT NULL DEFAULT 'gpt-4o-mini',
        temperature    NUMERIC(3,2) NOT NULL DEFAULT 0.30,
        system_prompt  TEXT NOT NULL,
        user_template  TEXT NOT NULL,
        output_format  TEXT NOT NULL DEFAULT 'json', /* json | text | markdown */
        is_active      BOOLEAN NOT NULL DEFAULT TRUE,
        notes          TEXT NOT NULL DEFAULT '',
        created_by     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_prompt_brand CHECK (brand_context IN ('nexcel','agiworks','both','any'))
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_prompts_unique
      ON sales_ai_prompts (key, version, brand_context)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_prompts_active
      ON sales_ai_prompts (key, brand_context, is_active, version DESC)
    `;

    /* ── AI-Runs (Ausführungsprotokoll) ──────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_ai_runs (
        id                TEXT PRIMARY KEY,
        prompt_key        TEXT NOT NULL,
        prompt_version    INTEGER NOT NULL,
        brand_context     TEXT NOT NULL DEFAULT 'any',
        entity_type       TEXT NOT NULL,   /* company | opportunity | lead_query */
        entity_id         TEXT,
        status            TEXT NOT NULL DEFAULT 'QUEUED',
        input_snapshot    JSONB NOT NULL DEFAULT '{}'::jsonb,
        output            JSONB,
        output_text       TEXT,
        model             TEXT NOT NULL,
        temperature       NUMERIC(3,2),
        tokens_in         INTEGER,
        tokens_out        INTEGER,
        provider          TEXT NOT NULL DEFAULT 'openai',
        error             TEXT,
        actor_id          TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        reviewer_id       TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        reviewed_at       TIMESTAMPTZ,
        review_note       TEXT,
        started_at        TIMESTAMPTZ,
        finished_at       TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_run_status CHECK (
          status IN ('QUEUED','PROCESSING','REVIEW_REQUIRED','APPROVED','REJECTED','SUPERSEDED','FAILED')
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_runs_entity
      ON sales_ai_runs (entity_type, entity_id, created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_runs_key
      ON sales_ai_runs (prompt_key, created_at DESC)
    `;

    /* ── Solution Scope ──────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_solutions (
        id                    TEXT PRIMARY KEY,
        opportunity_id        TEXT NOT NULL REFERENCES sales_opportunities(id) ON DELETE CASCADE,
        structured            JSONB NOT NULL DEFAULT '{}'::jsonb,
        challenge_mode        JSONB NOT NULL DEFAULT '{}'::jsonb,
        quality_gate          TEXT,  /* angebotsreif | weitere_klaerung | kein_fit | null */
        quality_gate_note     TEXT,
        run_id                TEXT REFERENCES sales_ai_runs(id) ON DELETE SET NULL,
        approved_at           TIMESTAMPTZ,
        approved_by           TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        version               INTEGER NOT NULL DEFAULT 1,
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_solution_gate CHECK (
          quality_gate IS NULL OR quality_gate IN ('angebotsreif','weitere_klaerung','kein_fit')
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_solutions_opp
      ON sales_solutions (opportunity_id, updated_at DESC)
    `;

    /* ── Angebote + immutable Versionen ──────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_proposals (
        id                    TEXT PRIMARY KEY,
        opportunity_id        TEXT NOT NULL REFERENCES sales_opportunities(id) ON DELETE CASCADE,
        solution_id           TEXT REFERENCES sales_solutions(id) ON DELETE SET NULL,
        title                 TEXT NOT NULL,
        brand_context         TEXT NOT NULL DEFAULT 'nexcel',
        status                TEXT NOT NULL DEFAULT 'draft',
        current_version_id    TEXT,
        customer_snapshot     JSONB NOT NULL DEFAULT '{}'::jsonb,
        total_cents           BIGINT,
        currency              TEXT NOT NULL DEFAULT 'EUR',
        valid_until           DATE,
        sent_at               TIMESTAMPTZ,
        accepted_at           TIMESTAMPTZ,
        rejected_at           TIMESTAMPTZ,
        deleted_at            TIMESTAMPTZ,
        version               INTEGER NOT NULL DEFAULT 1,
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_proposal_brand CHECK (brand_context IN ('nexcel','agiworks','both')),
        CONSTRAINT sales_proposal_status CHECK (
          status IN ('draft','preview','approved','sent','accepted','rejected','expired','superseded')
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_proposals_opp
      ON sales_proposals (opportunity_id, created_at DESC)
      WHERE deleted_at IS NULL
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_proposal_versions (
        id                        TEXT PRIMARY KEY,
        proposal_id               TEXT NOT NULL REFERENCES sales_proposals(id) ON DELETE CASCADE,
        version                   INTEGER NOT NULL,
        generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        generated_by              TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        solution_scope_version    INTEGER,
        prompt_version            INTEGER,
        structured                JSONB NOT NULL,
        pricing_snapshot          JSONB NOT NULL DEFAULT '{}'::jsonb,
        payment_plan_snapshot     JSONB NOT NULL DEFAULT '{}'::jsonb,
        timeframe_snapshot        JSONB NOT NULL DEFAULT '{}'::jsonb,
        run_id                    TEXT REFERENCES sales_ai_runs(id) ON DELETE SET NULL,
        approved_at               TIMESTAMPTZ,
        approved_by               TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        sent_at                   TIMESTAMPTZ,
        document_id               TEXT,
        CONSTRAINT sales_proposal_version_unique UNIQUE (proposal_id, version)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_proposal_versions_proposal
      ON sales_proposal_versions (proposal_id, version DESC)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_proposal_documents (
        id                     TEXT PRIMARY KEY,
        proposal_version_id    TEXT NOT NULL REFERENCES sales_proposal_versions(id) ON DELETE CASCADE,
        mime                   TEXT NOT NULL DEFAULT 'application/pdf',
        bytes                  BYTEA NOT NULL,
        sha256                 TEXT NOT NULL,
        size                   INTEGER NOT NULL DEFAULT 0,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_proposal_documents_version
      ON sales_proposal_documents (proposal_version_id)
    `;

    /* ── Angebots-Follow-ups (fällige Erinnerungen) ─────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_proposal_followups (
        id                 TEXT PRIMARY KEY,
        proposal_id        TEXT NOT NULL REFERENCES sales_proposals(id) ON DELETE CASCADE,
        stage              TEXT NOT NULL,  /* first | second | final */
        due_at             TIMESTAMPTZ NOT NULL,
        status             TEXT NOT NULL DEFAULT 'open', /* open | done | cancelled */
        note               TEXT NOT NULL DEFAULT '',
        completed_at       TIMESTAMPTZ,
        completed_by       TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_proposal_followups_open
      ON sales_proposal_followups (due_at ASC)
      WHERE status = 'open'
    `;

    /* ── Einwände ────────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_objections (
        id                TEXT PRIMARY KEY,
        opportunity_id    TEXT NOT NULL REFERENCES sales_opportunities(id) ON DELETE CASCADE,
        type              TEXT NOT NULL, /* preis | wert | timing | prioritaet | entscheider | wettbewerber | bestand | scope | sonstiges */
        body              TEXT NOT NULL,
        resolution        TEXT,
        resolved_at       TIMESTAMPTZ,
        created_by        TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_objections_opp
      ON sales_objections (opportunity_id, created_at DESC)
    `;

    /* ── Playbooks (versioniert) ─────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_playbooks (
        id             TEXT PRIMARY KEY,
        key            TEXT NOT NULL,
        version        INTEGER NOT NULL,
        brand_context  TEXT NOT NULL DEFAULT 'any',
        structured     JSONB NOT NULL,
        is_active      BOOLEAN NOT NULL DEFAULT TRUE,
        created_by     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_playbook_brand CHECK (brand_context IN ('nexcel','agiworks','both','any'))
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_playbooks_unique
      ON sales_playbooks (key, version, brand_context)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_playbooks_active
      ON sales_playbooks (key, brand_context, is_active, version DESC)
    `;

    /* ── Sales-Assets (Kundenlogos, Farb-Referenzen) ─────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_assets (
        id            TEXT PRIMARY KEY,
        company_id    TEXT REFERENCES sales_companies(id) ON DELETE CASCADE,
        kind          TEXT NOT NULL DEFAULT 'customer_logo',
        mime          TEXT NOT NULL,
        bytes         BYTEA NOT NULL,
        sha256        TEXT NOT NULL,
        size          INTEGER NOT NULL DEFAULT 0,
        note          TEXT NOT NULL DEFAULT '',
        created_by    TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_assets_company
      ON sales_assets (company_id, created_at DESC)
    `;

    /* ── Seeds: Prompts (Version 1 pro Key) ──────────────────────── */
    for (const seed of SALES_PROMPT_SEEDS) {
      const id = `prompt_${seed.key.toLowerCase()}_${seed.brandContext}_v${seed.version}`;
      await sql`
        INSERT INTO sales_ai_prompts (
          id, key, version, brand_context, model, temperature,
          system_prompt, user_template, output_format, is_active, notes
        ) VALUES (
          ${id}, ${seed.key}, ${seed.version}, ${seed.brandContext}, ${seed.model}, ${seed.temperature},
          ${seed.system}, ${seed.userTemplate}, ${seed.outputFormat}, TRUE,
          ${"Seed v1 — automatisch aus promptSeeds.ts geseedet"}
        )
        ON CONFLICT (key, version, brand_context) DO NOTHING
      `;
    }

    /* ── Seeds: Playbooks (Version 1 pro Key) ────────────────────── */
    for (const seed of SALES_PLAYBOOK_SEEDS) {
      const id = `playbook_${seed.key.toLowerCase()}_${seed.brandContext}_v${seed.version}`;
      await sql`
        INSERT INTO sales_playbooks (
          id, key, version, brand_context, structured, is_active
        ) VALUES (
          ${id}, ${seed.key}, ${seed.version}, ${seed.brandContext},
          ${JSON.stringify(seed.structured)}::jsonb, TRUE
        )
        ON CONFLICT (key, version, brand_context) DO NOTHING
      `;
    }
  },
};
