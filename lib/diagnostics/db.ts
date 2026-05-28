/**
 * NEXCEL AI · Diagnostik · SQLite Persistence Layer
 *
 * better-sqlite3 — synchron, in-process, kein Pool nötig.
 * Schema wird beim ersten Zugriff angelegt (idempotent).
 *
 * Serverless: SQLite-File lebt in /tmp (ephemeral). Eine Produktiv-Migration
 * auf Postgres/SQL läuft über denselben Repository-Pattern weiter.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type {
  AnalysisEvent,
  AnalysisFinding,
  AnalysisRecommendation,
  AnalysisScores,
  AnalysisUpload,
  CompanyAnalysis,
  LeadClassification,
} from "./types";

const IS_SERVERLESS =
  process.env.VERCEL === "1" ||
  !!process.env.VERCEL_ENV ||
  process.env.NODE_ENV === "production";

const DATA_DIR = IS_SERVERLESS
  ? "/tmp/nexcel-diagnostics"
  : path.join(process.cwd(), "data");

const DB_PATH = path.join(DATA_DIR, "diagnostics.db");

let _db: Database.Database | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS company_analyses (
  id              TEXT PRIMARY KEY,
  url             TEXT,
  domain          TEXT,
  status          TEXT NOT NULL,
  phases_json     TEXT NOT NULL,
  session_id      TEXT,
  device          TEXT,
  referrer        TEXT,
  ip_hash         TEXT,
  started_at      INTEGER NOT NULL,
  finished_at     INTEGER,
  error_message   TEXT,
  degradation_reasons_json TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_company_analyses_status ON company_analyses(status);
CREATE INDEX IF NOT EXISTS idx_company_analyses_started_at ON company_analyses(started_at);

CREATE TABLE IF NOT EXISTS analysis_uploads (
  id                       TEXT PRIMARY KEY,
  analysis_id              TEXT NOT NULL REFERENCES company_analyses(id) ON DELETE CASCADE,
  filename                 TEXT NOT NULL,
  mime_type                TEXT NOT NULL,
  bytes                    INTEGER NOT NULL,
  sha256                   TEXT NOT NULL,
  storage_path             TEXT NOT NULL,
  extracted_text_preview   TEXT,
  created_at               INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_analysis ON analysis_uploads(analysis_id);

CREATE TABLE IF NOT EXISTS analysis_scores (
  analysis_id           TEXT PRIMARY KEY REFERENCES company_analyses(id) ON DELETE CASCADE,
  operations            INTEGER NOT NULL,
  automation_potential  INTEGER NOT NULL,
  system_fragmentation  INTEGER NOT NULL,
  scalability_risk      INTEGER NOT NULL,
  technical_risk        INTEGER NOT NULL,
  conversion_risk       INTEGER NOT NULL,
  confidence            INTEGER NOT NULL,
  computed_at           INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis_findings (
  id                TEXT PRIMARY KEY,
  analysis_id       TEXT NOT NULL REFERENCES company_analyses(id) ON DELETE CASCADE,
  rule_id           TEXT NOT NULL,
  category          TEXT NOT NULL,
  severity          TEXT NOT NULL,
  title             TEXT NOT NULL,
  detail            TEXT NOT NULL,
  source            TEXT NOT NULL,
  score_impact_json TEXT,
  recommendation    TEXT,
  created_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_findings_analysis ON analysis_findings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON analysis_findings(severity);

CREATE TABLE IF NOT EXISTS analysis_recommendations (
  id                    TEXT PRIMARY KEY,
  analysis_id           TEXT NOT NULL REFERENCES company_analyses(id) ON DELETE CASCADE,
  product_key           TEXT NOT NULL,
  name                  TEXT NOT NULL,
  oneliner              TEXT NOT NULL,
  modules_json          TEXT NOT NULL,
  estimated_weeks       INTEGER,
  priority              INTEGER NOT NULL,
  reason_finding_ids_json TEXT NOT NULL,
  created_at            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recs_analysis ON analysis_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_recs_priority ON analysis_recommendations(priority);

CREATE TABLE IF NOT EXISTS analysis_events (
  id           TEXT PRIMARY KEY,
  analysis_id  TEXT NOT NULL REFERENCES company_analyses(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_analysis ON analysis_events(analysis_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON analysis_events(type);
CREATE INDEX IF NOT EXISTS idx_events_created ON analysis_events(created_at);

CREATE TABLE IF NOT EXISTS lead_classifications (
  analysis_id   TEXT PRIMARY KEY REFERENCES company_analyses(id) ON DELETE CASCADE,
  id            TEXT NOT NULL UNIQUE,
  tier          TEXT NOT NULL,
  signals_json  TEXT NOT NULL,
  raw_score     INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON lead_classifications(tier);
`;

export function db(): Database.Database {
  if (_db) return _db;
  ensureDataDir();
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.exec(SCHEMA);
  return _db;
}

/* ─── Mappers (DB-Row → Domain) ──────────────────────────────────── */

function rowToAnalysis(row: any): CompanyAnalysis {
  return {
    id: row.id,
    url: row.url,
    domain: row.domain,
    status: row.status,
    phases: JSON.parse(row.phases_json),
    sessionId: row.session_id,
    device: row.device,
    referrer: row.referrer,
    ipHash: row.ip_hash,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorMessage: row.error_message,
    degradationReasons: JSON.parse(row.degradation_reasons_json || "[]"),
  };
}

function rowToUpload(row: any): AnalysisUpload {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    filename: row.filename,
    mimeType: row.mime_type,
    bytes: row.bytes,
    sha256: row.sha256,
    storagePath: row.storage_path,
    extractedTextPreview: row.extracted_text_preview,
    createdAt: row.created_at,
  };
}

function rowToFinding(row: any): AnalysisFinding {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    ruleId: row.rule_id,
    category: row.category,
    severity: row.severity,
    title: row.title,
    detail: row.detail,
    source: row.source,
    scoreImpact: row.score_impact_json ? JSON.parse(row.score_impact_json) : null,
    recommendation: row.recommendation,
    createdAt: row.created_at,
  };
}

function rowToScores(row: any): AnalysisScores {
  return {
    analysisId: row.analysis_id,
    operations: row.operations,
    automationPotential: row.automation_potential,
    systemFragmentation: row.system_fragmentation,
    scalabilityRisk: row.scalability_risk,
    technicalRisk: row.technical_risk,
    conversionRisk: row.conversion_risk,
    confidence: row.confidence,
    computedAt: row.computed_at,
  };
}

function rowToRec(row: any): AnalysisRecommendation {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    productKey: row.product_key,
    name: row.name,
    oneliner: row.oneliner,
    modules: JSON.parse(row.modules_json),
    estimatedWeeks: row.estimated_weeks,
    priority: row.priority,
    reasonFindingIds: JSON.parse(row.reason_finding_ids_json),
    createdAt: row.created_at,
  };
}

function rowToEvent(row: any): AnalysisEvent {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    type: row.type,
    payload: JSON.parse(row.payload_json),
    createdAt: row.created_at,
  };
}

function rowToLead(row: any): LeadClassification {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    tier: row.tier,
    signals: JSON.parse(row.signals_json),
    rawScore: row.raw_score,
    createdAt: row.created_at,
  };
}

/* ─── Repository API ─────────────────────────────────────────────── */

export const analysisRepo = {
  insert(a: CompanyAnalysis): void {
    db()
      .prepare(
        `INSERT INTO company_analyses
        (id, url, domain, status, phases_json, session_id, device, referrer, ip_hash, started_at, finished_at, error_message, degradation_reasons_json)
        VALUES (@id, @url, @domain, @status, @phases_json, @session_id, @device, @referrer, @ip_hash, @started_at, @finished_at, @error_message, @degradation_reasons_json)`,
      )
      .run({
        id: a.id,
        url: a.url,
        domain: a.domain,
        status: a.status,
        phases_json: JSON.stringify(a.phases),
        session_id: a.sessionId,
        device: a.device,
        referrer: a.referrer,
        ip_hash: a.ipHash,
        started_at: a.startedAt,
        finished_at: a.finishedAt,
        error_message: a.errorMessage,
        degradation_reasons_json: JSON.stringify(a.degradationReasons),
      });
  },
  update(a: CompanyAnalysis): void {
    db()
      .prepare(
        `UPDATE company_analyses
         SET url=@url, domain=@domain, status=@status, phases_json=@phases_json,
             session_id=@session_id, device=@device, referrer=@referrer, ip_hash=@ip_hash,
             started_at=@started_at, finished_at=@finished_at, error_message=@error_message,
             degradation_reasons_json=@degradation_reasons_json
         WHERE id=@id`,
      )
      .run({
        id: a.id,
        url: a.url,
        domain: a.domain,
        status: a.status,
        phases_json: JSON.stringify(a.phases),
        session_id: a.sessionId,
        device: a.device,
        referrer: a.referrer,
        ip_hash: a.ipHash,
        started_at: a.startedAt,
        finished_at: a.finishedAt,
        error_message: a.errorMessage,
        degradation_reasons_json: JSON.stringify(a.degradationReasons),
      });
  },
  findById(id: string): CompanyAnalysis | null {
    const row = db()
      .prepare("SELECT * FROM company_analyses WHERE id = ?")
      .get(id);
    return row ? rowToAnalysis(row) : null;
  },
  listRecent(limit = 50): CompanyAnalysis[] {
    const rows = db()
      .prepare(
        "SELECT * FROM company_analyses ORDER BY started_at DESC LIMIT ?",
      )
      .all(limit) as any[];
    return rows.map(rowToAnalysis);
  },
};

export const uploadRepo = {
  insert(u: AnalysisUpload): void {
    db()
      .prepare(
        `INSERT INTO analysis_uploads (id, analysis_id, filename, mime_type, bytes, sha256, storage_path, extracted_text_preview, created_at)
         VALUES (@id, @analysis_id, @filename, @mime_type, @bytes, @sha256, @storage_path, @extracted_text_preview, @created_at)`,
      )
      .run({
        id: u.id,
        analysis_id: u.analysisId,
        filename: u.filename,
        mime_type: u.mimeType,
        bytes: u.bytes,
        sha256: u.sha256,
        storage_path: u.storagePath,
        extracted_text_preview: u.extractedTextPreview,
        created_at: u.createdAt,
      });
  },
  listByAnalysis(analysisId: string): AnalysisUpload[] {
    const rows = db()
      .prepare(
        "SELECT * FROM analysis_uploads WHERE analysis_id = ? ORDER BY created_at ASC",
      )
      .all(analysisId) as any[];
    return rows.map(rowToUpload);
  },
};

export const findingRepo = {
  insertMany(findings: AnalysisFinding[]): void {
    if (!findings.length) return;
    const stmt = db().prepare(
      `INSERT INTO analysis_findings (id, analysis_id, rule_id, category, severity, title, detail, source, score_impact_json, recommendation, created_at)
       VALUES (@id, @analysis_id, @rule_id, @category, @severity, @title, @detail, @source, @score_impact_json, @recommendation, @created_at)`,
    );
    const tx = db().transaction((items: AnalysisFinding[]) => {
      for (const f of items) {
        stmt.run({
          id: f.id,
          analysis_id: f.analysisId,
          rule_id: f.ruleId,
          category: f.category,
          severity: f.severity,
          title: f.title,
          detail: f.detail,
          source: f.source,
          score_impact_json: f.scoreImpact ? JSON.stringify(f.scoreImpact) : null,
          recommendation: f.recommendation,
          created_at: f.createdAt,
        });
      }
    });
    tx(findings);
  },
  listByAnalysis(analysisId: string): AnalysisFinding[] {
    const rows = db()
      .prepare(
        "SELECT * FROM analysis_findings WHERE analysis_id = ? ORDER BY created_at ASC",
      )
      .all(analysisId) as any[];
    return rows.map(rowToFinding);
  },
};

export const scoresRepo = {
  upsert(s: AnalysisScores): void {
    db()
      .prepare(
        `INSERT INTO analysis_scores (analysis_id, operations, automation_potential, system_fragmentation, scalability_risk, technical_risk, conversion_risk, confidence, computed_at)
         VALUES (@analysis_id, @operations, @automation_potential, @system_fragmentation, @scalability_risk, @technical_risk, @conversion_risk, @confidence, @computed_at)
         ON CONFLICT(analysis_id) DO UPDATE SET
           operations = excluded.operations,
           automation_potential = excluded.automation_potential,
           system_fragmentation = excluded.system_fragmentation,
           scalability_risk = excluded.scalability_risk,
           technical_risk = excluded.technical_risk,
           conversion_risk = excluded.conversion_risk,
           confidence = excluded.confidence,
           computed_at = excluded.computed_at`,
      )
      .run({
        analysis_id: s.analysisId,
        operations: s.operations,
        automation_potential: s.automationPotential,
        system_fragmentation: s.systemFragmentation,
        scalability_risk: s.scalabilityRisk,
        technical_risk: s.technicalRisk,
        conversion_risk: s.conversionRisk,
        confidence: s.confidence,
        computed_at: s.computedAt,
      });
  },
  get(analysisId: string): AnalysisScores | null {
    const row = db()
      .prepare("SELECT * FROM analysis_scores WHERE analysis_id = ?")
      .get(analysisId);
    return row ? rowToScores(row) : null;
  },
};

export const recommendationRepo = {
  insertMany(recs: AnalysisRecommendation[]): void {
    if (!recs.length) return;
    const stmt = db().prepare(
      `INSERT INTO analysis_recommendations (id, analysis_id, product_key, name, oneliner, modules_json, estimated_weeks, priority, reason_finding_ids_json, created_at)
       VALUES (@id, @analysis_id, @product_key, @name, @oneliner, @modules_json, @estimated_weeks, @priority, @reason_finding_ids_json, @created_at)`,
    );
    const tx = db().transaction((items: AnalysisRecommendation[]) => {
      for (const r of items) {
        stmt.run({
          id: r.id,
          analysis_id: r.analysisId,
          product_key: r.productKey,
          name: r.name,
          oneliner: r.oneliner,
          modules_json: JSON.stringify(r.modules),
          estimated_weeks: r.estimatedWeeks,
          priority: r.priority,
          reason_finding_ids_json: JSON.stringify(r.reasonFindingIds),
          created_at: r.createdAt,
        });
      }
    });
    tx(recs);
  },
  listByAnalysis(analysisId: string): AnalysisRecommendation[] {
    const rows = db()
      .prepare(
        "SELECT * FROM analysis_recommendations WHERE analysis_id = ? ORDER BY priority ASC, created_at ASC",
      )
      .all(analysisId) as any[];
    return rows.map(rowToRec);
  },
};

export const eventRepo = {
  insert(e: AnalysisEvent): void {
    db()
      .prepare(
        `INSERT INTO analysis_events (id, analysis_id, type, payload_json, created_at)
         VALUES (@id, @analysis_id, @type, @payload_json, @created_at)`,
      )
      .run({
        id: e.id,
        analysis_id: e.analysisId,
        type: e.type,
        payload_json: JSON.stringify(e.payload),
        created_at: e.createdAt,
      });
  },
  listByAnalysis(analysisId: string): AnalysisEvent[] {
    const rows = db()
      .prepare(
        "SELECT * FROM analysis_events WHERE analysis_id = ? ORDER BY created_at ASC",
      )
      .all(analysisId) as any[];
    return rows.map(rowToEvent);
  },
  listRecent(limit = 100): AnalysisEvent[] {
    const rows = db()
      .prepare("SELECT * FROM analysis_events ORDER BY created_at DESC LIMIT ?")
      .all(limit) as any[];
    return rows.map(rowToEvent);
  },
};

export const leadRepo = {
  upsert(l: LeadClassification): void {
    db()
      .prepare(
        `INSERT INTO lead_classifications (analysis_id, id, tier, signals_json, raw_score, created_at)
         VALUES (@analysis_id, @id, @tier, @signals_json, @raw_score, @created_at)
         ON CONFLICT(analysis_id) DO UPDATE SET
           id = excluded.id,
           tier = excluded.tier,
           signals_json = excluded.signals_json,
           raw_score = excluded.raw_score,
           created_at = excluded.created_at`,
      )
      .run({
        analysis_id: l.analysisId,
        id: l.id,
        tier: l.tier,
        signals_json: JSON.stringify(l.signals),
        raw_score: l.rawScore,
        created_at: l.createdAt,
      });
  },
  get(analysisId: string): LeadClassification | null {
    const row = db()
      .prepare("SELECT * FROM lead_classifications WHERE analysis_id = ?")
      .get(analysisId);
    return row ? rowToLead(row) : null;
  },
};
