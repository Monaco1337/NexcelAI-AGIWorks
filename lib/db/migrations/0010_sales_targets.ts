/**
 * 0010 — NEXCEL Sales Target Intelligence Engine.
 *
 * Legt das Datenmodell für den neuen Zielkunden-Intelligence-Bereich an
 * (Admin Panel → Vertrieb → Zielkunden). Bewusst getrennt von
 * `sales_companies`, weil Prospects und aktive CRM-Firmen unterschiedliche
 * Lebenszyklen haben:
 *
 *   sales_target_companies    — automatisch entdeckte Firmen (Prospecting-Pool)
 *   sales_companies (0009)    — vom Vertrieb qualifizierte Firmen (CRM)
 *
 * Konvertierung Prospect → CRM erfolgt via `sales_target_companies.linked_sales_company_id`
 * (idempotent, aufhebbar) und einen expliziten „In CRM übernehmen" Schritt.
 *
 * Kernprinzipien dieses Modells:
 *  - Provenance first: Jeder gespeicherte Datenpunkt bekommt seine Quelle,
 *    Confidence und Verifikationsstatus über `sales_target_sources`.
 *  - Klare Trennung von Rohdaten und aggregierten Feldern: aggregierte
 *    „preferred"-Werte auf der Firma sind eine berechnete Ableitung aus
 *    Sources — nicht die Wahrheit, sondern eine Cache-Ansicht.
 *  - Kein blindes Überschreiben bei Konflikten: mehrere Werte pro Feld
 *    dürfen koexistieren; `is_preferred` markiert den bevorzugten.
 *  - Alle Enrichment-Ergebnisse (Website-Audit, Financial-Signals,
 *    Opportunities, Sales Brief, Lead Score) sind eigene Tabellen mit
 *    Zeitstempel, damit historische Analysen möglich sind.
 *  - Job-Queue (search_jobs, enrichment_jobs, provider_requests) für
 *    asynchrone, teure Provider-Aufrufe mit Retry+Backoff, Kosten- und
 *    Cache-Tracking.
 */

import type { Migration } from "../migrationRunner";

export const migration0010: Migration = {
  id: "0010",
  name: "sales_target_intelligence",
  up: async (sql) => {
    /* ── Zielkunden (Prospect-Pool) ───────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_companies (
        id                          TEXT PRIMARY KEY,
        name                        TEXT NOT NULL,
        legal_name                  TEXT,
        legal_form                  TEXT,
        industry                    TEXT,
        sub_industry                TEXT,
        description                 TEXT,
        website                     TEXT,
        domain                      TEXT,
        phone                       TEXT,
        email                       TEXT,
        address_line                TEXT,
        postal_code                 TEXT,
        city                        TEXT,
        region                      TEXT,
        country                     TEXT NOT NULL DEFAULT 'DE',
        latitude                    NUMERIC(9,6),
        longitude                   NUMERIC(9,6),
        distance_from_lat           NUMERIC(9,6),
        distance_from_lng           NUMERIC(9,6),
        distance_km                 NUMERIC(6,2),
        employee_estimate_min       INTEGER,
        employee_estimate_max       INTEGER,
        founded_year                INTEGER,
        locations_estimate          INTEGER,
        google_place_id             TEXT,
        google_rating               NUMERIC(2,1),
        review_count                INTEGER,
        opening_hours               JSONB NOT NULL DEFAULT '{}'::jsonb,
        social                      JSONB NOT NULL DEFAULT '{}'::jsonb,
        registry_info               JSONB NOT NULL DEFAULT '{}'::jsonb,
        tags                        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        fingerprint                 TEXT NOT NULL,
        origin_search_job_id        TEXT,
        linked_sales_company_id     TEXT REFERENCES sales_companies(id) ON DELETE SET NULL,
        enrichment_status           TEXT NOT NULL DEFAULT 'DISCOVERED',
        last_enrichment_at          TIMESTAMPTZ,
        last_enrichment_error       TEXT,
        do_not_contact              BOOLEAN NOT NULL DEFAULT FALSE,
        do_not_contact_reason       TEXT,
        deleted_at                  TIMESTAMPTZ,
        version                     INTEGER NOT NULL DEFAULT 1,
        created_by                  TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by                  TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        search_vector               tsvector GENERATED ALWAYS AS (
          setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(domain, '')), 'B') ||
          setweight(to_tsvector('german', coalesce(city, '')), 'C') ||
          setweight(to_tsvector('german', coalesce(industry, '')), 'C') ||
          setweight(to_tsvector('german', coalesce(description, '')), 'D')
        ) STORED,
        CONSTRAINT sales_target_enrichment_status CHECK (enrichment_status IN (
          'DISCOVERED','QUEUED','ENRICHING','CONTACTS_FOUND','ANALYZING','SCORING','READY','FAILED','SUSPENDED'
        ))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_targets_search ON sales_target_companies USING GIN (search_vector)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_targets_fingerprint ON sales_target_companies (fingerprint) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_targets_status ON sales_target_companies (enrichment_status, updated_at DESC) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_targets_city ON sales_target_companies (city, industry) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_targets_domain ON sales_target_companies (domain) WHERE domain IS NOT NULL AND deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_targets_google_place ON sales_target_companies (google_place_id) WHERE google_place_id IS NOT NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_targets_linked ON sales_target_companies (linked_sales_company_id) WHERE linked_sales_company_id IS NOT NULL`;

    /* ── Provenance: Quellen pro Datenpunkt ──────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_sources (
        id                  TEXT PRIMARY KEY,
        target_id           TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        field               TEXT NOT NULL,           /* z. B. phone / email / website / address / decision_maker.email */
        value               TEXT NOT NULL,
        provider            TEXT NOT NULL,           /* company_website | impressum | google_places | linkedin | registry | manual | … */
        source_url          TEXT,
        retrieved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        confidence          NUMERIC(3,2) NOT NULL DEFAULT 0.5,
        verification_status TEXT NOT NULL DEFAULT 'unverified',
        is_preferred        BOOLEAN NOT NULL DEFAULT FALSE,
        note                TEXT,
        CONSTRAINT sales_target_source_verification CHECK (
          verification_status IN ('unverified','verified','low','medium','high','conflicting')
        )
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_sources_target ON sales_target_sources (target_id, field, is_preferred DESC, confidence DESC)`;

    /* ── Kontakte (mehrere Werte pro Kanal möglich) ──────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_contacts (
        id                    TEXT PRIMARY KEY,
        target_id             TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        kind                  TEXT NOT NULL,        /* phone | mobile | email | contact_form | whatsapp | linkedin | instagram | facebook | address | website */
        value                 TEXT NOT NULL,
        normalized_value      TEXT,                 /* E.164 für Telefon, lowercased für Email, … */
        classification        TEXT,                 /* BUSINESS_LANDLINE | BUSINESS_MOBILE | CENTRAL | SALES | SUPPORT | DIRECT_DECISION_MAKER | DEPARTMENT | GENERAL | UNKNOWN */
        confidence            NUMERIC(3,2) NOT NULL DEFAULT 0.5,
        verification_status   TEXT NOT NULL DEFAULT 'unverified',
        is_preferred          BOOLEAN NOT NULL DEFAULT FALSE,
        source_id             TEXT REFERENCES sales_target_sources(id) ON DELETE SET NULL,
        first_seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at            TIMESTAMPTZ,
        CONSTRAINT sales_target_contact_verification CHECK (
          verification_status IN ('unverified','verified','low','medium','high','conflicting')
        )
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_contacts_target ON sales_target_contacts (target_id, kind, is_preferred DESC, confidence DESC) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_contacts_normalized ON sales_target_contacts (normalized_value) WHERE normalized_value IS NOT NULL AND deleted_at IS NULL`;

    /* ── Entscheider / Decision Makers ────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_decision_makers (
        id                TEXT PRIMARY KEY,
        target_id         TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        name              TEXT NOT NULL,
        role              TEXT,
        role_category     TEXT,                  /* geschaeftsfuehrung | inhaber | marketing | it | operations | vertrieb | fachlich */
        business_email    TEXT,
        business_phone    TEXT,
        business_mobile   TEXT,
        linkedin_url      TEXT,
        confidence        NUMERIC(3,2) NOT NULL DEFAULT 0.5,
        source_id         TEXT REFERENCES sales_target_sources(id) ON DELETE SET NULL,
        source_url        TEXT,
        deleted_at        TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_dm_target ON sales_target_decision_makers (target_id, confidence DESC) WHERE deleted_at IS NULL`;

    /* ── Website-Audit (Snapshot pro Analyse) ─────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_website_audits (
        id                    TEXT PRIMARY KEY,
        target_id             TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        url                   TEXT NOT NULL,
        final_url             TEXT,
        audited_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        http_status           INTEGER,
        ttfb_ms               INTEGER,
        transfer_bytes        INTEGER,
        redirect_chain        JSONB NOT NULL DEFAULT '[]'::jsonb,
        website_score         INTEGER,
        design_score          INTEGER,
        performance_score     INTEGER,
        seo_score             INTEGER,
        conversion_score      INTEGER,
        mobile_score          INTEGER,
        trust_score           INTEGER,
        technology_score      INTEGER,
        subscores             JSONB NOT NULL DEFAULT '{}'::jsonb,
        findings              JSONB NOT NULL DEFAULT '{"facts":[],"inferences":[],"recommendations":[]}'::jsonb,
        tech_stack            JSONB NOT NULL DEFAULT '{}'::jsonb,
        snapshot_hash         TEXT,
        error                 TEXT,
        CONSTRAINT sales_target_audit_scores CHECK (
          website_score IS NULL OR (website_score BETWEEN 0 AND 100)
        )
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_audits_target ON sales_target_website_audits (target_id, audited_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_audits_snapshot ON sales_target_website_audits (snapshot_hash) WHERE snapshot_hash IS NOT NULL`;

    /* ── Opportunities (Website + Software) ──────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_opportunities (
        id                          TEXT PRIMARY KEY,
        target_id                   TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        source                      TEXT NOT NULL,       /* website | software | manual */
        kind                        TEXT NOT NULL,       /* NEW_WEBSITE | WEBSITE_REDESIGN | SEO | LANDING_PAGE | BOOKING_SYSTEM | ECOMMERCE | PERFORMANCE_OPTIMIZATION | CONVERSION_OPTIMIZATION | MAINTENANCE | CRM | LEAD_MGMT | TERMINE | KUNDENPORTAL | ANGEBOTSSYSTEM | RECHNUNGSSYSTEM | DOCS_AUTOMATION | AI_SUPPORT | AI_AGENT | EMAIL_AUTOMATION | WHATSAPP_AUTOMATION | DASHBOARD | REPORTING | ERP_INTEGRATION | MITARBEITERPORTAL | RECRUITING | WORKFLOW | DATA_ANALYSIS | CUSTOM_SOFTWARE | NO_IMMEDIATE_NEED */
        title                       TEXT NOT NULL,
        problem                     TEXT,
        proposed_solution           TEXT,
        business_impact             TEXT,
        reason                      TEXT,
        evidence                    JSONB NOT NULL DEFAULT '[]'::jsonb,
        confidence                  NUMERIC(3,2) NOT NULL DEFAULT 0.5,
        opportunity_score           INTEGER,
        estimated_min_cents         BIGINT,
        estimated_recommended_cents BIGINT,
        estimated_max_cents         BIGINT,
        currency                    TEXT NOT NULL DEFAULT 'EUR',
        detected_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at                  TIMESTAMPTZ,
        CONSTRAINT sales_target_opportunity_source CHECK (source IN ('website','software','manual'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_opps_target ON sales_target_opportunities (target_id, confidence DESC, opportunity_score DESC NULLS LAST) WHERE deleted_at IS NULL`;

    /* ── Financial Signals (mehrere pro Firma) ───────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_financial_signals (
        id            TEXT PRIMARY KEY,
        target_id     TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        kind          TEXT NOT NULL,      /* legal_form | age | employees | locations | rating | reviews | job_ads | growth | expansion | tech_stack | website_maturity | press | risk | insolvency | closed */
        value         TEXT,
        weight        NUMERIC(4,2) NOT NULL DEFAULT 1.0,
        polarity      TEXT NOT NULL DEFAULT 'neutral', /* positive | neutral | negative */
        evidence      TEXT,
        source_url    TEXT,
        source_id     TEXT REFERENCES sales_target_sources(id) ON DELETE SET NULL,
        confidence    NUMERIC(3,2) NOT NULL DEFAULT 0.5,
        retrieved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ,
        CONSTRAINT sales_target_fin_polarity CHECK (polarity IN ('positive','neutral','negative'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_fin_target ON sales_target_financial_signals (target_id, polarity, weight DESC) WHERE deleted_at IS NULL`;

    /* ── Lead Score (aktueller berechneter Wert + Historie) ──────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_lead_scores (
        id                            TEXT PRIMARY KEY,
        target_id                     TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        calculated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        config_key                    TEXT NOT NULL DEFAULT 'default',
        weights                       JSONB NOT NULL DEFAULT '{}'::jsonb,
        breakdown                     JSONB NOT NULL DEFAULT '[]'::jsonb,
        total_score                   INTEGER NOT NULL,
        priority_class                TEXT NOT NULL,
        need_score                    INTEGER,
        opportunity_score             INTEGER,
        website_score                 INTEGER,
        software_opportunity_score    INTEGER,
        commercial_capacity_score     INTEGER,
        reachability_score            INTEGER,
        decision_maker_score          INTEGER,
        data_confidence_score         INTEGER,
        capacity_class                TEXT,           /* VERY_LOW | LOW | MEDIUM | HIGH | VERY_HIGH */
        capacity_confidence           NUMERIC(3,2),
        estimated_budget_min_cents    BIGINT,
        estimated_budget_max_cents    BIGINT,
        currency                      TEXT NOT NULL DEFAULT 'EUR',
        is_current                    BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT sales_target_score_prio CHECK (priority_class IN ('A+','A','B','C','D')),
        CONSTRAINT sales_target_score_total CHECK (total_score BETWEEN 0 AND 100)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_scores_target ON sales_target_lead_scores (target_id, calculated_at DESC)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_scores_current ON sales_target_lead_scores (target_id) WHERE is_current = TRUE`;

    /* ── Sales Briefs ────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_sales_briefs (
        id                        TEXT PRIMARY KEY,
        target_id                 TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        generated_by              TEXT NOT NULL DEFAULT 'rule',   /* rule | llm */
        headline                  TEXT NOT NULL,
        business_summary          TEXT,
        main_opportunity          TEXT,
        opportunity_reason        TEXT,
        recommended_entry         TEXT,
        sales_angle               TEXT,
        why_now                   TEXT,
        recommended_action        TEXT NOT NULL DEFAULT 'CALL_NOW',
        recommended_time          TEXT,
        decision_maker_id         TEXT REFERENCES sales_target_decision_makers(id) ON DELETE SET NULL,
        project_value_min_cents   BIGINT,
        project_value_max_cents   BIGINT,
        capacity_class            TEXT,
        capacity_confidence       NUMERIC(3,2),
        confidence                NUMERIC(3,2) NOT NULL DEFAULT 0.5,
        structured                JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_current                BOOLEAN NOT NULL DEFAULT TRUE
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_briefs_target ON sales_target_sales_briefs (target_id, generated_at DESC)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_briefs_current ON sales_target_sales_briefs (target_id) WHERE is_current = TRUE`;

    /* ── Search-Jobs (Discovery-Runs, konfigurierbar) ─────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_search_jobs (
        id                    TEXT PRIMARY KEY,
        label                 TEXT,
        city                  TEXT,
        region                TEXT,
        country               TEXT NOT NULL DEFAULT 'DE',
        center_lat            NUMERIC(9,6),
        center_lng            NUMERIC(9,6),
        radius_km             INTEGER NOT NULL DEFAULT 25,
        industries            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        categories            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        filters               JSONB NOT NULL DEFAULT '{}'::jsonb,
        depth                 TEXT NOT NULL DEFAULT 'STANDARD',    /* QUICK | STANDARD | DEEP */
        limit_count           INTEGER NOT NULL DEFAULT 100,
        provider_preferences  JSONB NOT NULL DEFAULT '{}'::jsonb,
        status                TEXT NOT NULL DEFAULT 'queued',      /* queued | running | completed | failed | cancelled */
        estimated_cost_cents  BIGINT NOT NULL DEFAULT 0,
        actual_cost_cents     BIGINT NOT NULL DEFAULT 0,
        discovered_count      INTEGER NOT NULL DEFAULT 0,
        enriched_count        INTEGER NOT NULL DEFAULT 0,
        error                 TEXT,
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at            TIMESTAMPTZ,
        finished_at           TIMESTAMPTZ,
        CONSTRAINT sales_target_search_depth CHECK (depth IN ('QUICK','STANDARD','DEEP')),
        CONSTRAINT sales_target_search_status CHECK (status IN ('queued','running','completed','failed','cancelled'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_search_status ON sales_target_search_jobs (status, created_at DESC)`;

    /* ── Enrichment-Jobs (Phasenweise Anreicherung pro Firma) ───── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_enrichment_jobs (
        id                TEXT PRIMARY KEY,
        target_id         TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        phase             TEXT NOT NULL,        /* company_basics | website_contact | decision_makers | website_audit | software_opportunities | financial_signals | sales_brief | lead_score */
        status            TEXT NOT NULL DEFAULT 'queued',  /* queued | running | done | failed | skipped */
        priority          INTEGER NOT NULL DEFAULT 100,
        attempts          INTEGER NOT NULL DEFAULT 0,
        max_attempts      INTEGER NOT NULL DEFAULT 3,
        next_attempt_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at        TIMESTAMPTZ,
        finished_at       TIMESTAMPTZ,
        error             TEXT,
        payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
        actual_cost_cents BIGINT NOT NULL DEFAULT 0,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_enrichment_status CHECK (status IN ('queued','running','done','failed','skipped'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_enrich_target ON sales_target_enrichment_jobs (target_id, phase, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_enrich_queue ON sales_target_enrichment_jobs (status, next_attempt_at ASC) WHERE status IN ('queued','running')`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_enrich_uniq_active ON sales_target_enrichment_jobs (target_id, phase) WHERE status IN ('queued','running')`;

    /* ── Provider-Requests (Kostenkontrolle + Cache-Basis) ───────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_provider_requests (
        id                TEXT PRIMARY KEY,
        target_id         TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        search_job_id     TEXT REFERENCES sales_target_search_jobs(id) ON DELETE SET NULL,
        enrichment_job_id TEXT REFERENCES sales_target_enrichment_jobs(id) ON DELETE SET NULL,
        provider          TEXT NOT NULL,
        endpoint          TEXT NOT NULL,
        request_hash      TEXT NOT NULL,
        response_status   INTEGER,
        response_bytes    INTEGER,
        latency_ms        INTEGER,
        cost_cents        BIGINT NOT NULL DEFAULT 0,
        cached            BOOLEAN NOT NULL DEFAULT FALSE,
        error             TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_pr_hash ON sales_target_provider_requests (request_hash, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_pr_provider ON sales_target_provider_requests (provider, created_at DESC)`;

    /* ── Aktivitäten (menschlich lesbare Timeline pro Zielkunde) ── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_activities (
        id            TEXT PRIMARY KEY,
        target_id     TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        kind          TEXT NOT NULL,
        summary       TEXT NOT NULL,
        payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
        actor_id      TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        actor_email   TEXT,
        occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_activities_target ON sales_target_activities (target_id, occurred_at DESC)`;

    /* ── Watchlist (beobachtete Firmen pro Nutzer) ────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_watchlist (
        id            TEXT PRIMARY KEY,
        target_id     TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        user_id       TEXT NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
        added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_check_at TIMESTAMPTZ,
        criteria      JSONB NOT NULL DEFAULT '{}'::jsonb,
        note          TEXT NOT NULL DEFAULT '',
        CONSTRAINT sales_target_watchlist_unique UNIQUE (target_id, user_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_watchlist_user ON sales_target_watchlist (user_id, added_at DESC)`;

    /* ── Scoring-Konfiguration (Gewichtungen editierbar) ─────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_scoring_config (
        key                  TEXT PRIMARY KEY,
        label                TEXT NOT NULL,
        weights              JSONB NOT NULL DEFAULT '{}'::jsonb,
        threshold_a_plus     INTEGER NOT NULL DEFAULT 85,
        threshold_a          INTEGER NOT NULL DEFAULT 70,
        threshold_b          INTEGER NOT NULL DEFAULT 55,
        threshold_c          INTEGER NOT NULL DEFAULT 40,
        project_value_tiers  JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active            BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by           TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    /* Seed: Default-Scoring-Config falls noch nicht vorhanden */
    await sql`
      INSERT INTO sales_target_scoring_config (
        key, label, weights,
        threshold_a_plus, threshold_a, threshold_b, threshold_c,
        project_value_tiers, is_active
      ) VALUES (
        'default',
        'Standard-Gewichtung',
        ${JSON.stringify({
          need: 25,
          commercialCapacity: 20,
          reachability: 15,
          decisionMakerAccess: 10,
          digitalWeakness: 10,
          opportunityValue: 10,
          timingSignals: 5,
          localProximity: 5,
        })}::jsonb,
        85, 70, 55, 40,
        ${JSON.stringify({
          landingpage: { min: 200000, recommended: 300000, max: 400000 },
          website: { min: 500000, recommended: 800000, max: 1200000 },
          website_crm: { min: 1000000, recommended: 1500000, max: 2500000 },
          custom_automation: { min: 1500000, recommended: 3000000, max: 5000000 },
          enterprise_software: { min: 3000000, recommended: 6000000, max: 15000000 },
        })}::jsonb,
        TRUE
      )
      ON CONFLICT (key) DO NOTHING
    `;
  },
};
