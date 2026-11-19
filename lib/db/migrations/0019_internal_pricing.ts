/** Additive, immutable commercial pricing history; never exposed publicly. */
import type { Migration } from '../migrationRunner';
export const migration0019:Migration={id:'0019',name:'internal_pricing_versions_and_quotes',up:async(sql)=>{
  await sql`CREATE TABLE IF NOT EXISTS internal_pricing_versions (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL CHECK (brand IN ('nexcel','agiworks')),
    version INTEGER NOT NULL CHECK(version>0),
    state TEXT NOT NULL CHECK(state IN ('draft','pending','active','superseded','rejected')),
    rules JSONB NOT NULL,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    UNIQUE(brand,version)
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS internal_pricing_one_active ON internal_pricing_versions (brand) WHERE state='active'`;
  await sql`CREATE INDEX IF NOT EXISTS internal_pricing_recent ON internal_pricing_versions(brand,created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS internal_pricing_quotes (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL CHECK(brand IN ('nexcel','agiworks')),
    price_version_id TEXT REFERENCES internal_pricing_versions(id),
    customer_label TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    selection JSONB NOT NULL,
    calculation JSONB NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}};
