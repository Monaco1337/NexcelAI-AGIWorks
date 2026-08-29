/**
 * 0011 — NEXCEL Sales Target Intelligence · Production Hardening.
 *
 * Diese Migration folgt strikt der Regel „bestehende Architektur nicht neu bauen".
 * Sie ergänzt ausschließlich Constraints, Spalten und Tabellen, die für den
 * Produktivbetrieb der bestehenden Engine erforderlich sind:
 *
 *  1. Idempotenz-Dedup für `sales_target_sources` (Field × Provider × Value)
 *     — verhindert, dass jeder Re-Enrichment-Lauf die Provenance verdoppelt.
 *  2. Content-Hash-Dedup für `sales_target_website_audits` — identische
 *     Audits werden nur einmal geschrieben; Aggregate-Views können sich
 *     verlassen auf „ein Audit pro tatsächliche Änderung".
 *  3. Score-Versionierung: `score_version` + zusätzliche Sub-Scores
 *     (`propensity_score`, `contactability_score`, `dm_relevance_score`,
 *     `evidence_confidence`). V1-Scores bleiben unverändert reproduzierbar.
 *  4. Ground-Truth-System: `sales_target_evaluations`. Menschliche Reviews
 *     werden getrennt vom Produktionsdatensatz gespeichert.
 *  5. Sales-Outcome-Feedback (`sales_target_outcomes`) — CRM-Ergebnisse
 *     zurück ins Intelligence-System, aber ohne Auto-Learning-Loop.
 *  6. Golden-Dataset-Flag auf Companies (`is_golden_dataset`).
 *  7. POSSIBLE_DUPLICATE-Beziehung (`possible_duplicate_of`) — konservative
 *     Alternative zum Auto-Merge.
 *  8. Provider-Health-Tabelle (`sales_target_provider_health`) für
 *     Circuit-Breaker + Ratelimit-Semantik.
 *  9. Zusätzliche Indizes für die realen Query-Pfade (Score-Sortierung,
 *     Priority-Filter, Freshness-Checks).
 *
 * Alle Änderungen sind additiv — kein DROP, kein ALTER auf bestehende
 * Spalten mit Semantik-Änderung.
 */

import type { Migration } from "../migrationRunner";

export const migration0011: Migration = {
  id: "0011",
  name: "sales_target_hardening",
  up: async (sql) => {
    /* ── 1. Sources: Dedup-Constraint ─────────────────────────────── */
    // Beobachtung im Audit: `upsertSource` machte immer INSERT ohne Dedup.
    // Wir dedupen jetzt strikt über (target_id, field, provider, value_hash).
    // Der Hash beinhaltet Value, damit ein wiederkehrender identischer
    // Datenpunkt nur seine `retrieved_at` und `confidence` aktualisiert.
    await sql`
      ALTER TABLE sales_target_sources
        ADD COLUMN IF NOT EXISTS value_hash TEXT
    `;
    // Backfill (Hash = md5(field || value || provider))
    await sql`
      UPDATE sales_target_sources
      SET value_hash = md5(coalesce(field,'') || '|' || coalesce(value,'') || '|' || coalesce(provider,''))
      WHERE value_hash IS NULL
    `;
    await sql`
      ALTER TABLE sales_target_sources
        ALTER COLUMN value_hash SET NOT NULL
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_sources_dedup
        ON sales_target_sources (target_id, field, provider, value_hash)
    `;

    /* ── 2. Website-Audit: Content-Hash-Dedup ─────────────────────── */
    // `snapshot_hash` existierte bereits. Wir setzen jetzt einen UNIQUE-Index
    // auf (target_id, snapshot_hash), damit identische Snapshots nicht
    // gespeichert werden und Aggregate stabil bleiben.
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_audits_snapshot_unique
        ON sales_target_website_audits (target_id, snapshot_hash)
        WHERE snapshot_hash IS NOT NULL
    `;

    /* ── 3. Lead-Score V2: Versionierung + neue Sub-Scores ────────── */
    // Wir überschreiben V1 nicht destruktiv — jede Score-Zeile bekommt
    // eine explizite Version. Neue Sub-Scores werden `NULL` bei alten
    // Zeilen und getrennt bei V2 gefüllt. `is_current` bleibt pro
    // (target_id, score_version) eindeutig, damit V1 und V2 nebenher
    // laufen können.
    await sql`
      ALTER TABLE sales_target_lead_scores
        ADD COLUMN IF NOT EXISTS score_version TEXT NOT NULL DEFAULT 'v1'
    `;
    await sql`
      ALTER TABLE sales_target_lead_scores
        ADD COLUMN IF NOT EXISTS propensity_score       INTEGER,
        ADD COLUMN IF NOT EXISTS contactability_score   INTEGER,
        ADD COLUMN IF NOT EXISTS dm_relevance_score     INTEGER,
        ADD COLUMN IF NOT EXISTS evidence_confidence    NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS matrix_priority        TEXT,
        ADD COLUMN IF NOT EXISTS explainability         JSONB NOT NULL DEFAULT '[]'::jsonb
    `;
    // Bestehenden Unique-Index umziehen: „current pro (target_id, version)".
    // Postgres erlaubt das Ersetzen nur explizit — wir droppen den alten
    // und legen den neuen an. Existierende V1-Rows bleiben unangetastet.
    await sql`DROP INDEX IF EXISTS idx_sales_target_scores_current`;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_scores_current_v2
        ON sales_target_lead_scores (target_id, score_version)
        WHERE is_current = TRUE
    `;
    // Sortier-Indizes für Real-World-Queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_scores_total
        ON sales_target_lead_scores (target_id, score_version, total_score DESC)
        WHERE is_current = TRUE
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_scores_priority
        ON sales_target_lead_scores (priority_class, total_score DESC)
        WHERE is_current = TRUE
    `;

    /* ── 4. Ground-Truth: Evaluationen ────────────────────────────── */
    // Manuelle Reviews werden strikt getrennt vom Produktionsdatensatz
    // gespeichert. Ein Evaluator (User) markiert für einen Ziel-Lead pro
    // Feld: correct / partial / no / unknown. Diese Datei ist die
    // Grundlage der Precision-Metriken und der Golden-Dataset-Regression.
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_evaluations (
        id                        TEXT PRIMARY KEY,
        target_id                 TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        score_version             TEXT NOT NULL DEFAULT 'v1',
        evaluator_id              TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        evaluator_email           TEXT,
        evaluated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        phone_verdict             TEXT,   /* YES | NO | UNKNOWN */
        email_verdict             TEXT,
        decision_maker_verdict    TEXT,
        website_verdict           TEXT,   /* YES | PARTIAL | NO */
        opportunity_verdict       TEXT,   /* YES | PARTIAL | NO */
        commercial_fit_verdict    TEXT,   /* OVER | CORRECT | UNDER | UNKNOWN */
        priority_verdict          TEXT,   /* TOO_HIGH | CORRECT | TOO_LOW */
        would_contact             BOOLEAN,
        notes                     TEXT,
        system_prediction         JSONB NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT sales_target_eval_verdict_phone   CHECK (phone_verdict IN ('YES','NO','UNKNOWN') OR phone_verdict IS NULL),
        CONSTRAINT sales_target_eval_verdict_email   CHECK (email_verdict IN ('YES','NO','UNKNOWN') OR email_verdict IS NULL),
        CONSTRAINT sales_target_eval_verdict_dm      CHECK (decision_maker_verdict IN ('YES','NO','UNKNOWN') OR decision_maker_verdict IS NULL),
        CONSTRAINT sales_target_eval_verdict_web     CHECK (website_verdict IN ('YES','PARTIAL','NO','UNKNOWN') OR website_verdict IS NULL),
        CONSTRAINT sales_target_eval_verdict_opp     CHECK (opportunity_verdict IN ('YES','PARTIAL','NO','UNKNOWN') OR opportunity_verdict IS NULL),
        CONSTRAINT sales_target_eval_verdict_fit     CHECK (commercial_fit_verdict IN ('OVER','CORRECT','UNDER','UNKNOWN') OR commercial_fit_verdict IS NULL),
        CONSTRAINT sales_target_eval_verdict_prio    CHECK (priority_verdict IN ('TOO_HIGH','CORRECT','TOO_LOW','UNKNOWN') OR priority_verdict IS NULL)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_evals_target ON sales_target_evaluations (target_id, evaluated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_evals_version ON sales_target_evaluations (score_version, evaluated_at DESC)`;

    /* ── 5. Sales-Outcome-Feedback ────────────────────────────────── */
    // Rückfluss aus dem CRM. Diese Daten werden NICHT automatisch in
    // Scoring-Gewichte zurückgeschrieben (Data Leakage, Bias) — sie sind
    // Grundlage für die Offline-Kalibrierung.
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_outcomes (
        id                    TEXT PRIMARY KEY,
        target_id             TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        linked_sales_company_id TEXT REFERENCES sales_companies(id) ON DELETE SET NULL,
        event_kind            TEXT NOT NULL,   /* CONTACTED | REPLIED | MEETING_BOOKED | PROPOSAL | WON | LOST | NO_INTEREST | WRONG_CONTACT | WRONG_NEED | NO_BUDGET | NO_TIMING */
        event_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        actual_deal_value_cents BIGINT,
        note                  TEXT,
        recorded_by           TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_outcome_kind CHECK (event_kind IN (
          'CONTACTED','REPLIED','MEETING_BOOKED','PROPOSAL','WON','LOST',
          'NO_INTEREST','WRONG_CONTACT','WRONG_NEED','NO_BUDGET','NO_TIMING'
        ))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_outcomes_target ON sales_target_outcomes (target_id, event_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_outcomes_kind ON sales_target_outcomes (event_kind, event_at DESC)`;

    /* ── 6. Companies: Golden Dataset + POSSIBLE_DUPLICATE ────────── */
    await sql`
      ALTER TABLE sales_target_companies
        ADD COLUMN IF NOT EXISTS is_golden_dataset       BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS possible_duplicate_of   TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS possible_duplicate_confidence NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS review_flags            JSONB NOT NULL DEFAULT '{}'::jsonb
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_golden
        ON sales_target_companies (is_golden_dataset)
        WHERE is_golden_dataset = TRUE AND deleted_at IS NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_dup
        ON sales_target_companies (possible_duplicate_of)
        WHERE possible_duplicate_of IS NOT NULL AND deleted_at IS NULL
    `;

    /* ── 7. Provider-Health (Circuit-Breaker-Basis) ───────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_provider_health (
        provider          TEXT PRIMARY KEY,
        state             TEXT NOT NULL DEFAULT 'HEALTHY',   /* HEALTHY | DEGRADED | RATE_LIMITED | UNAVAILABLE | MISCONFIGURED */
        consecutive_fail  INTEGER NOT NULL DEFAULT 0,
        last_success_at   TIMESTAMPTZ,
        last_failure_at   TIMESTAMPTZ,
        cooldown_until    TIMESTAMPTZ,
        note              TEXT,
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_provider_state CHECK (
          state IN ('HEALTHY','DEGRADED','RATE_LIMITED','UNAVAILABLE','MISCONFIGURED')
        )
      )
    `;

    /* ── 8. Provider-Requests: zusätzliche Nutzungs-Indizes ────────── */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_pr_target
        ON sales_target_provider_requests (target_id, created_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_pr_search
        ON sales_target_provider_requests (search_job_id, created_at DESC)
        WHERE search_job_id IS NOT NULL
    `;
  },
};
