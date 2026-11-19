import type { Migration } from '../migrationRunner';
/** Append-only commercial changes. No destructive alteration of customer records. */
export const migration0020:Migration={id:'0020',name:'offer_template_versions_and_email_dispatches',up:async(sql)=>{
  await sql`CREATE TABLE IF NOT EXISTS sales_offer_template_versions (
    id TEXT PRIMARY KEY,
    template_brand TEXT NOT NULL CHECK (template_brand IN ('shared','nexcel','agiworks')),
    version INTEGER NOT NULL CHECK (version > 0),
    state TEXT NOT NULL CHECK (state IN ('draft','pending','active','superseded','rejected')),
    content JSONB NOT NULL,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    UNIQUE(template_brand,version)
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sales_offer_template_one_active
    ON sales_offer_template_versions(template_brand) WHERE state='active'`;
  await sql`CREATE INDEX IF NOT EXISTS sales_offer_template_latest
    ON sales_offer_template_versions(template_brand,version DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS sales_proposal_email_dispatches (
    id TEXT PRIMARY KEY,
    proposal_version_id TEXT NOT NULL UNIQUE REFERENCES sales_proposal_versions(id),
    recipient TEXT NOT NULL,
    sender TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('sending','sent','failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    claimed_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    provider_id TEXT,
    last_error TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS sales_proposal_email_status
    ON sales_proposal_email_dispatches(state,created_at)`;
}};
