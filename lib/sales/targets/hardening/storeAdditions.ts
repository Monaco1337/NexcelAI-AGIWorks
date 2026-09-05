/**
 * Zusätzliche Store-Funktionen für die Production-Hardening-Ebene.
 *
 * Diese Datei liegt bewusst NEBEN `store.ts` (statt darin), damit die
 * bestehende Store-API stabil bleibt und Reviews sich auf die neuen
 * Funktionen konzentrieren können. Die Funktionen decken:
 *
 *  - idempotenten Source-Upsert (dedup key)
 *  - idempotenten Audit-Upsert (snapshot-hash-dedup)
 *  - Optimistic Locking bei Target-Updates
 *  - Advisory-Lock pro Zielkunde während Enrichment
 *  - Provider-Request-Logging (echte Kostenmessung)
 *  - Ground-Truth-Evaluationen (CRUD)
 *  - Sales-Outcome-Feedback (CRUD)
 *  - Data-Quality-Metriken (Aggregatabfragen)
 *  - Review-Queue (High-Score/Low-Confidence, Konflikte)
 *  - Golden-Dataset-Flag
 *  - POSSIBLE_DUPLICATE-Verlinkung
 */

import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import { newTargetId } from "../model";
import type { TargetSource, WebsiteAudit } from "../model";

/* -------------------------------------------------------------------------- */
/*  Idempotent Source-Upsert                                                   */
/* -------------------------------------------------------------------------- */

export interface IdempotentSourceInput {
  targetId: string;
  field: string;
  value: string;
  provider: string;
  sourceUrl?: string | null;
  confidence?: number;
  verificationStatus?: TargetSource["verificationStatus"];
  isPreferred?: boolean;
  note?: string | null;
}

/**
 * Dedup-Key = md5(field | value | provider).
 * Bei Kollision aktualisieren wir `retrieved_at`, ziehen die höhere
 * Confidence, und übernehmen den verification_status nur, wenn er
 * strenger ist.
 */
export async function upsertSourceIdempotent(input: IdempotentSourceInput): Promise<TargetSource> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const valueHash = md5(`${input.field}|${input.value}|${input.provider}`);
  const id = newTargetId("src");
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_sources (
      id, target_id, field, value, value_hash, provider, source_url,
      confidence, verification_status, is_preferred, note
    ) VALUES (
      ${id}, ${input.targetId}, ${input.field}, ${input.value}, ${valueHash},
      ${input.provider}, ${input.sourceUrl ?? null},
      ${input.confidence ?? 0.5}, ${input.verificationStatus ?? "unverified"},
      ${input.isPreferred ?? false}, ${input.note ?? null}
    )
    ON CONFLICT (target_id, field, provider, value_hash) DO UPDATE
      SET retrieved_at = NOW(),
          confidence = GREATEST(sales_target_sources.confidence, EXCLUDED.confidence),
          verification_status = CASE
            WHEN EXCLUDED.verification_status = 'verified' THEN 'verified'
            WHEN sales_target_sources.verification_status = 'verified' THEN 'verified'
            WHEN EXCLUDED.verification_status = 'high' AND sales_target_sources.verification_status IN ('unverified','low','medium') THEN 'high'
            WHEN EXCLUDED.verification_status = 'medium' AND sales_target_sources.verification_status IN ('unverified','low') THEN 'medium'
            ELSE sales_target_sources.verification_status
          END,
          is_preferred = sales_target_sources.is_preferred OR EXCLUDED.is_preferred,
          note = COALESCE(EXCLUDED.note, sales_target_sources.note),
          source_url = COALESCE(EXCLUDED.source_url, sales_target_sources.source_url)
    RETURNING *
  `;
  return mapSource(rows[0]);
}

function mapSource(row: Record<string, unknown>): TargetSource {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    field: row.field as string,
    value: row.value as string,
    provider: row.provider as string,
    sourceUrl: (row.source_url as string | null) ?? null,
    retrievedAt: asIsoRequired(row.retrieved_at),
    confidence: Number(row.confidence),
    verificationStatus:
      (row.verification_status as TargetSource["verificationStatus"]) ?? "unverified",
    isPreferred: Boolean(row.is_preferred),
    note: (row.note as string | null) ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Idempotenter Website-Audit (Snapshot-Hash-Dedup)                          */
/* -------------------------------------------------------------------------- */

/**
 * Wenn ein identischer Snapshot (gleicher Content-Hash) bereits für den
 * Ziel-Lead existiert, geben wir den bestehenden zurück statt neu
 * einzufügen. So bleibt die Historie sauber „ein Audit pro tatsächlicher
 * Änderung".
 */
export async function saveWebsiteAuditIdempotent(audit: WebsiteAudit): Promise<WebsiteAudit> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  if (audit.snapshotHash) {
    const existing = await sql<Record<string, unknown>[]>`
      SELECT * FROM sales_target_website_audits
      WHERE target_id = ${audit.targetId} AND snapshot_hash = ${audit.snapshotHash}
      LIMIT 1
    `;
    if (existing[0]) return mapAudit(existing[0]);
  }
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_website_audits (
      id, target_id, url, final_url, audited_at, http_status, ttfb_ms, transfer_bytes,
      redirect_chain, website_score, design_score, performance_score, seo_score,
      conversion_score, mobile_score, trust_score, technology_score, subscores,
      findings, tech_stack, snapshot_hash, error
    ) VALUES (
      ${audit.id}, ${audit.targetId}, ${audit.url}, ${audit.finalUrl}, ${audit.auditedAt},
      ${audit.httpStatus}, ${audit.ttfbMs}, ${audit.transferBytes},
      ${sql.json(jsonParam(audit.redirectChain))},
      ${audit.websiteScore}, ${audit.designScore}, ${audit.performanceScore}, ${audit.seoScore},
      ${audit.conversionScore}, ${audit.mobileScore}, ${audit.trustScore}, ${audit.technologyScore},
      ${sql.json(jsonParam(audit.subscores))},
      ${sql.json(jsonParam(audit.findings))},
      ${sql.json(jsonParam(audit.techStack))},
      ${audit.snapshotHash}, ${audit.error}
    )
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  if (rows[0]) return mapAudit(rows[0]);
  // Fallback: falls das unique index (target_id, snapshot_hash) getriggert hat.
  const fallback = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_website_audits
    WHERE target_id = ${audit.targetId} AND snapshot_hash = ${audit.snapshotHash}
    ORDER BY audited_at DESC LIMIT 1
  `;
  if (!fallback[0]) throw new TargetError("INTERNAL", "Audit-Insert lieferte kein Ergebnis");
  return mapAudit(fallback[0]);
}

function mapAudit(row: Record<string, unknown>): WebsiteAudit {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    url: row.url as string,
    finalUrl: (row.final_url as string | null) ?? null,
    auditedAt: asIsoRequired(row.audited_at),
    httpStatus: numOrNull(row.http_status),
    ttfbMs: numOrNull(row.ttfb_ms),
    transferBytes: numOrNull(row.transfer_bytes),
    redirectChain: (row.redirect_chain as string[]) ?? [],
    websiteScore: numOrNull(row.website_score),
    designScore: numOrNull(row.design_score),
    performanceScore: numOrNull(row.performance_score),
    seoScore: numOrNull(row.seo_score),
    conversionScore: numOrNull(row.conversion_score),
    mobileScore: numOrNull(row.mobile_score),
    trustScore: numOrNull(row.trust_score),
    technologyScore: numOrNull(row.technology_score),
    subscores: (row.subscores as Record<string, number>) ?? {},
    findings:
      (row.findings as WebsiteAudit["findings"]) ?? { facts: [], inferences: [], recommendations: [] },
    techStack: (row.tech_stack as Record<string, unknown>) ?? {},
    snapshotHash: (row.snapshot_hash as string | null) ?? null,
    error: (row.error as string | null) ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Optimistic Locking                                                         */
/* -------------------------------------------------------------------------- */

/** Liest aktuelle Version des Targets. */
export async function getTargetVersion(targetId: string): Promise<number | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT version FROM sales_target_companies WHERE id = ${targetId} AND deleted_at IS NULL LIMIT 1
  `;
  return rows[0] ? Number(rows[0].version) : null;
}

/**
 * Setzt `enrichment_status`+ `last_enrichment_at` + `last_enrichment_error`
 * strikt versioniert. Wirft `VERSION_CONFLICT`, wenn zwischenzeitlich
 * jemand geschrieben hat. Diese Funktion ersetzt bewusst NICHT
 * `updateTarget` — sie ist gezielt für den Enrichment-Pfad gedacht,
 * wo Race-Conditions realistisch sind.
 */
export async function updateEnrichmentStatusWithVersion(
  targetId: string,
  expectedVersion: number,
  patch: {
    enrichmentStatus?: string;
    lastEnrichmentAt?: string | null;
    lastEnrichmentError?: string | null;
    domain?: string | null;
  }
): Promise<{ version: number }> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const rows = await sql<Record<string, unknown>[]>`
    UPDATE sales_target_companies
    SET
      enrichment_status = COALESCE(${patch.enrichmentStatus ?? null}, enrichment_status),
      last_enrichment_at = ${patch.lastEnrichmentAt === undefined ? sql`last_enrichment_at` : patch.lastEnrichmentAt},
      last_enrichment_error = ${patch.lastEnrichmentError === undefined ? sql`last_enrichment_error` : patch.lastEnrichmentError},
      domain = COALESCE(${patch.domain ?? null}, domain),
      updated_at = NOW(),
      version = version + 1
    WHERE id = ${targetId}
      AND deleted_at IS NULL
      AND version = ${expectedVersion}
    RETURNING version
  `;
  if (!rows[0]) {
    const current = await getTargetVersion(targetId);
    if (current === null) throw new TargetError("NOT_FOUND");
    throw new TargetError(
      "VERSION_CONFLICT",
      `Erwartete Version ${expectedVersion}, aktuelle Version ${current}`
    );
  }
  return { version: Number(rows[0].version) };
}

/* -------------------------------------------------------------------------- */
/*  Persistenter Lease-Lock pro Zielkunde                                      */
/* -------------------------------------------------------------------------- */

/**
 * Persistenter, token-gebundener Lease statt eines session-scoped Advisory
 * Locks. Der alte Lock konnte auf einer Pool-Session erworben und auf einer
 * anderen freigegeben werden. Dieser Lease überlebt Serverless-Abbrüche und
 * kann nach Ablauf sicher übernommen werden.
 */
export async function tryAcquireEnrichmentLock(
  targetId: string
): Promise<{ acquired: boolean; lockKey: LockKey }> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const token = crypto.randomUUID();
  const leaseExpiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const rows = await sql<{ id: string }[]>`
    INSERT INTO sales_target_phase_states (
      id, target_id, phase, status, last_started_at, state
    ) VALUES (
      ${newTargetId("phase")}, ${targetId}, '__full_enrichment__', 'running', NOW(),
      ${sql.json(jsonParam({ token, leaseExpiresAt }))}
    )
    ON CONFLICT (target_id, phase) DO UPDATE SET
      status = 'running',
      last_started_at = NOW(),
      state = EXCLUDED.state,
      version = sales_target_phase_states.version + 1,
      updated_at = NOW()
    WHERE sales_target_phase_states.status <> 'running'
       OR COALESCE(
         NULLIF(sales_target_phase_states.state->>'leaseExpiresAt', '')::timestamptz,
         'epoch'::timestamptz
       ) < NOW()
    RETURNING id
  `;
  return { acquired: rows.length === 1, lockKey: { targetId, token } };
}

export async function releaseEnrichmentLock(lockKey: LockKey): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_phase_states
    SET status = 'pending', state = '{}'::jsonb, updated_at = NOW(),
        version = version + 1
    WHERE target_id = ${lockKey.targetId}
      AND phase = '__full_enrichment__'
      AND state->>'token' = ${lockKey.token}
  `;
}

export interface LockKey {
  targetId: string;
  token: string;
}

/* -------------------------------------------------------------------------- */
/*  Provider-Request-Logging (echte Kostenmessung)                             */
/* -------------------------------------------------------------------------- */

export interface ProviderRequestLog {
  targetId?: string | null;
  searchJobId?: string | null;
  enrichmentJobId?: string | null;
  provider: string;
  endpoint: string;
  requestHash: string;
  responseStatus?: number | null;
  responseBytes?: number | null;
  latencyMs?: number | null;
  estimatedCostCents?: number | null;
  costCents?: number | null;
  cached?: boolean;
  error?: string | null;
  correlationId?: string | null;
  externalRequestId?: string | null;
  providerConfigId?: string | null;
  budgetId?: string | null;
  errorCode?: string | null;
  providerVersion?: string | null;
  attemptSequence?: number;
  fallbackFromProvider?: string | null;
  fallbackReason?: string | null;
  providerObservedCount?: number;
  contractRejectedCount?: number;
}

export async function logProviderRequest(entry: ProviderRequestLog): Promise<string> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const id = newTargetId("pr");
  await sql`
    INSERT INTO sales_target_provider_requests (
      id, target_id, search_job_id, enrichment_job_id, provider, endpoint,
      request_hash, response_status, response_bytes, latency_ms, cost_cents,
      estimated_cost_cents, cached, error, correlation_id, external_request_id,
      provider_config_id, budget_id, error_code, provider_version,
      attempt_sequence, fallback_from_provider, fallback_reason,
      provider_observed_count, contract_rejected_count, completed_at
    ) VALUES (
      ${id}, ${entry.targetId ?? null}, ${entry.searchJobId ?? null},
      ${entry.enrichmentJobId ?? null}, ${entry.provider}, ${entry.endpoint},
      ${entry.requestHash}, ${entry.responseStatus ?? null},
      ${entry.responseBytes ?? null}, ${entry.latencyMs ?? null},
      ${entry.costCents ?? 0}, ${entry.estimatedCostCents ?? 0},
      ${entry.cached ?? false}, ${entry.error ?? null},
      ${entry.correlationId ?? null}, ${entry.externalRequestId ?? null},
      ${entry.providerConfigId ?? null}, ${entry.budgetId ?? null},
      ${entry.errorCode ?? null}, ${entry.providerVersion ?? null},
      ${entry.attemptSequence ?? 1}, ${entry.fallbackFromProvider ?? null},
      ${entry.fallbackReason ?? null}, ${entry.providerObservedCount ?? 0},
      ${entry.contractRejectedCount ?? 0}, NOW()
    )
  `;
  return id;
}

/* -------------------------------------------------------------------------- */
/*  Ground-Truth-Evaluationen                                                  */
/* -------------------------------------------------------------------------- */

export type Verdict = "YES" | "NO" | "PARTIAL" | "UNKNOWN" | "OVER" | "CORRECT" | "UNDER" | "TOO_HIGH" | "TOO_LOW";

export interface EvaluationSubmission {
  targetId: string;
  scoreVersion?: string;
  evaluatorId?: string | null;
  evaluatorEmail?: string | null;
  phoneVerdict?: "YES" | "NO" | "UNKNOWN" | null;
  emailVerdict?: "YES" | "NO" | "UNKNOWN" | null;
  decisionMakerVerdict?: "YES" | "NO" | "UNKNOWN" | null;
  websiteVerdict?: "YES" | "PARTIAL" | "NO" | "UNKNOWN" | null;
  opportunityVerdict?: "YES" | "PARTIAL" | "NO" | "UNKNOWN" | null;
  commercialFitVerdict?: "OVER" | "CORRECT" | "UNDER" | "UNKNOWN" | null;
  priorityVerdict?: "TOO_HIGH" | "CORRECT" | "TOO_LOW" | "UNKNOWN" | null;
  wouldContact?: boolean | null;
  reviewStatus?: "DRAFT" | "COMPLETED";
  reviewVersion?: string;
  comparisonTargetId?: string | null;
  identityVerdict?: "SAME_ENTITY" | "DISTINCT_ENTITY" | "UNCERTAIN" | "NOT_APPLICABLE" | null;
  validCompany?: boolean | null;
  canonicalNameCorrect?: boolean | null;
  geographyCorrect?: boolean | null;
  targetFitVerdict?: "YES" | "NO" | "UNKNOWN" | null;
  qualificationCorrect?: boolean | null;
  provenanceComplete?: boolean | null;
  notes?: string | null;
  systemPrediction?: Record<string, unknown>;
}

export interface EvaluationRecord {
  id: string;
  targetId: string;
  scoreVersion: string;
  evaluatorEmail: string | null;
  evaluatedAt: string;
  phoneVerdict: string | null;
  emailVerdict: string | null;
  decisionMakerVerdict: string | null;
  websiteVerdict: string | null;
  opportunityVerdict: string | null;
  commercialFitVerdict: string | null;
  priorityVerdict: string | null;
  wouldContact: boolean | null;
  reviewStatus: string;
  reviewVersion: string;
  comparisonTargetId: string | null;
  identityVerdict: string | null;
  validCompany: boolean | null;
  canonicalNameCorrect: boolean | null;
  geographyCorrect: boolean | null;
  targetFitVerdict: string | null;
  qualificationCorrect: boolean | null;
  provenanceComplete: boolean | null;
  reviewCompletedAt: string | null;
  notes: string | null;
  systemPrediction: Record<string, unknown>;
}

export async function submitEvaluation(input: EvaluationSubmission): Promise<EvaluationRecord> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  if (input.reviewStatus === "COMPLETED" && !isCompleteEvaluation(input)) {
    throw new TargetError(
      "VALIDATION_FAILED",
      "Ein vollständiges Golden-Review benötigt alle Qualitätslabels",
    );
  }
  if (input.comparisonTargetId === input.targetId) {
    throw new TargetError("VALIDATION_FAILED", "Vergleichsziel darf nicht das Ziel selbst sein");
  }
  const id = newTargetId("eval");
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_evaluations (
      id, target_id, score_version, evaluator_id, evaluator_email,
      phone_verdict, email_verdict, decision_maker_verdict,
      website_verdict, opportunity_verdict, commercial_fit_verdict,
      priority_verdict, would_contact, review_status, review_version,
      comparison_target_id, identity_verdict, valid_company,
      canonical_name_correct, geography_correct, target_fit_verdict,
      qualification_correct, provenance_complete, review_completed_at,
      notes, system_prediction
    ) VALUES (
      ${id}, ${input.targetId}, ${input.scoreVersion ?? "v1"},
      ${input.evaluatorId ?? null}, ${input.evaluatorEmail ?? null},
      ${input.phoneVerdict ?? null}, ${input.emailVerdict ?? null},
      ${input.decisionMakerVerdict ?? null}, ${input.websiteVerdict ?? null},
      ${input.opportunityVerdict ?? null}, ${input.commercialFitVerdict ?? null},
      ${input.priorityVerdict ?? null}, ${input.wouldContact ?? null},
      ${input.reviewStatus ?? "DRAFT"}, ${input.reviewVersion ?? "v1"},
      ${input.comparisonTargetId ?? null}, ${input.identityVerdict ?? null},
      ${input.validCompany ?? null}, ${input.canonicalNameCorrect ?? null},
      ${input.geographyCorrect ?? null}, ${input.targetFitVerdict ?? null},
      ${input.qualificationCorrect ?? null}, ${input.provenanceComplete ?? null},
      ${input.reviewStatus === "COMPLETED" ? new Date().toISOString() : null},
      ${input.notes ?? null},
      ${sql.json(jsonParam(input.systemPrediction ?? {}))}
    )
    RETURNING *
  `;
  return mapEvaluation(rows[0]);
}

export async function listEvaluations(
  targetId: string,
  limit = 50
): Promise<EvaluationRecord[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_evaluations
    WHERE target_id = ${targetId}
    ORDER BY evaluated_at DESC LIMIT ${limit}
  `;
  return rows.map(mapEvaluation);
}

function mapEvaluation(row: Record<string, unknown>): EvaluationRecord {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    scoreVersion: (row.score_version as string) ?? "v1",
    evaluatorEmail: (row.evaluator_email as string | null) ?? null,
    evaluatedAt: asIsoRequired(row.evaluated_at),
    phoneVerdict: (row.phone_verdict as string | null) ?? null,
    emailVerdict: (row.email_verdict as string | null) ?? null,
    decisionMakerVerdict: (row.decision_maker_verdict as string | null) ?? null,
    websiteVerdict: (row.website_verdict as string | null) ?? null,
    opportunityVerdict: (row.opportunity_verdict as string | null) ?? null,
    commercialFitVerdict: (row.commercial_fit_verdict as string | null) ?? null,
    priorityVerdict: (row.priority_verdict as string | null) ?? null,
    wouldContact: (row.would_contact as boolean | null) ?? null,
    reviewStatus: (row.review_status as string) ?? "DRAFT",
    reviewVersion: (row.review_version as string) ?? "v1",
    comparisonTargetId: (row.comparison_target_id as string | null) ?? null,
    identityVerdict: (row.identity_verdict as string | null) ?? null,
    validCompany: (row.valid_company as boolean | null) ?? null,
    canonicalNameCorrect: (row.canonical_name_correct as boolean | null) ?? null,
    geographyCorrect: (row.geography_correct as boolean | null) ?? null,
    targetFitVerdict: (row.target_fit_verdict as string | null) ?? null,
    qualificationCorrect: (row.qualification_correct as boolean | null) ?? null,
    provenanceComplete: (row.provenance_complete as boolean | null) ?? null,
    reviewCompletedAt: row.review_completed_at ? asIsoRequired(row.review_completed_at) : null,
    notes: (row.notes as string | null) ?? null,
    systemPrediction: (row.system_prediction as Record<string, unknown>) ?? {},
  };
}

function isCompleteEvaluation(input: EvaluationSubmission): boolean {
  return (
    typeof input.validCompany === "boolean" &&
    typeof input.canonicalNameCorrect === "boolean" &&
    typeof input.geographyCorrect === "boolean" &&
    Boolean(input.identityVerdict) &&
    Boolean(input.phoneVerdict) &&
    Boolean(input.emailVerdict) &&
    Boolean(input.decisionMakerVerdict) &&
    Boolean(input.websiteVerdict) &&
    Boolean(input.targetFitVerdict) &&
    typeof input.qualificationCorrect === "boolean" &&
    typeof input.provenanceComplete === "boolean" &&
    typeof input.wouldContact === "boolean"
  );
}

/* -------------------------------------------------------------------------- */
/*  Sales-Outcome-Feedback                                                     */
/* -------------------------------------------------------------------------- */

export type OutcomeKind =
  | "CONTACTED"
  | "REPLIED"
  | "MEETING_BOOKED"
  | "PROPOSAL"
  | "WON"
  | "LOST"
  | "NO_INTEREST"
  | "WRONG_CONTACT"
  | "WRONG_NEED"
  | "NO_BUDGET"
  | "NO_TIMING";

export interface OutcomeInput {
  targetId: string;
  linkedSalesCompanyId?: string | null;
  eventKind: OutcomeKind;
  eventAt?: string;
  actualDealValueCents?: number | null;
  note?: string | null;
  recordedBy?: string | null;
}

export interface OutcomeRecord {
  id: string;
  targetId: string;
  linkedSalesCompanyId: string | null;
  eventKind: OutcomeKind;
  eventAt: string;
  actualDealValueCents: number | null;
  note: string | null;
  recordedBy: string | null;
  createdAt: string;
}

export async function recordOutcome(input: OutcomeInput): Promise<OutcomeRecord> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const id = newTargetId("out");
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_outcomes (
      id, target_id, linked_sales_company_id, event_kind, event_at,
      actual_deal_value_cents, note, recorded_by
    ) VALUES (
      ${id}, ${input.targetId}, ${input.linkedSalesCompanyId ?? null},
      ${input.eventKind}, ${input.eventAt ?? new Date().toISOString()},
      ${input.actualDealValueCents ?? null}, ${input.note ?? null},
      ${input.recordedBy ?? null}
    )
    RETURNING *
  `;
  return mapOutcome(rows[0]);
}

export async function listOutcomes(targetId: string, limit = 50): Promise<OutcomeRecord[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_outcomes WHERE target_id = ${targetId}
    ORDER BY event_at DESC LIMIT ${limit}
  `;
  return rows.map(mapOutcome);
}

function mapOutcome(row: Record<string, unknown>): OutcomeRecord {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    linkedSalesCompanyId: (row.linked_sales_company_id as string | null) ?? null,
    eventKind: row.event_kind as OutcomeKind,
    eventAt: asIsoRequired(row.event_at),
    actualDealValueCents: numOrNull(row.actual_deal_value_cents),
    note: (row.note as string | null) ?? null,
    recordedBy: (row.recorded_by as string | null) ?? null,
    createdAt: asIsoRequired(row.created_at),
  };
}

/* -------------------------------------------------------------------------- */
/*  Data-Quality-Metriken                                                      */
/* -------------------------------------------------------------------------- */

export interface DataQualityMetrics {
  totalCompanies: number;
  companiesReady: number;
  websiteCoverage: number;
  phoneCoverage: number;
  emailCoverage: number;
  decisionMakerCoverage: number;
  opportunityCoverage: number;
  verifiedPhoneRate: number;
  verifiedEmailRate: number;
  averageConfidence: number;
  conflictingContactCount: number;
  possibleDuplicateCount: number;
  staleWebsiteAudits: number;
  providerFailures: Array<{ provider: string; state: string; consecutiveFail: number }>;
  totalProviderCostCents: number;
  perQualifiedLeadCostCents: number | null;
}

/** Aggregatabfragen für das Intelligence-Quality-Dashboard. */
export async function computeDataQualityMetrics(): Promise<DataQualityMetrics> {
  const sql = await db();
  if (!sql) {
    return {
      totalCompanies: 0,
      companiesReady: 0,
      websiteCoverage: 0,
      phoneCoverage: 0,
      emailCoverage: 0,
      decisionMakerCoverage: 0,
      opportunityCoverage: 0,
      verifiedPhoneRate: 0,
      verifiedEmailRate: 0,
      averageConfidence: 0,
      conflictingContactCount: 0,
      possibleDuplicateCount: 0,
      staleWebsiteAudits: 0,
      providerFailures: [],
      totalProviderCostCents: 0,
      perQualifiedLeadCostCents: null,
    };
  }

  const [
    totals,
    contactCoverage,
    verified,
    dmCoverage,
    oppCoverage,
    duplicates,
    stale,
    providerHealth,
    costs,
  ] = await Promise.all([
    sql<Record<string, unknown>[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE enrichment_status = 'READY')::int AS ready,
        COUNT(*) FILTER (WHERE website IS NOT NULL)::int AS with_website
      FROM sales_target_companies WHERE deleted_at IS NULL
    `,
    sql<Record<string, unknown>[]>`
      SELECT
        COUNT(DISTINCT target_id) FILTER (WHERE kind IN ('phone','mobile'))::int AS with_phone,
        COUNT(DISTINCT target_id) FILTER (WHERE kind = 'email')::int AS with_email
      FROM sales_target_contacts WHERE deleted_at IS NULL
    `,
    sql<Record<string, unknown>[]>`
      SELECT
        COALESCE(AVG(confidence) FILTER (WHERE deleted_at IS NULL), 0)::numeric AS avg_conf,
        COUNT(*) FILTER (WHERE kind IN ('phone','mobile') AND verification_status IN ('verified','high') AND deleted_at IS NULL)::int AS verified_phone,
        COUNT(*) FILTER (WHERE kind IN ('phone','mobile') AND deleted_at IS NULL)::int AS all_phone,
        COUNT(*) FILTER (WHERE kind = 'email' AND verification_status IN ('verified','high') AND deleted_at IS NULL)::int AS verified_email,
        COUNT(*) FILTER (WHERE kind = 'email' AND deleted_at IS NULL)::int AS all_email,
        COUNT(*) FILTER (WHERE verification_status = 'conflicting' AND deleted_at IS NULL)::int AS conflicting
      FROM sales_target_contacts
    `,
    sql<Record<string, unknown>[]>`
      SELECT COUNT(DISTINCT target_id)::int AS with_dm
      FROM sales_target_decision_makers WHERE deleted_at IS NULL
    `,
    sql<Record<string, unknown>[]>`
      SELECT COUNT(DISTINCT target_id)::int AS with_opp
      FROM sales_target_opportunities WHERE deleted_at IS NULL
    `,
    sql<Record<string, unknown>[]>`
      SELECT COUNT(*)::int AS dup_count
      FROM sales_target_companies WHERE possible_duplicate_of IS NOT NULL AND deleted_at IS NULL
    `,
    sql<Record<string, unknown>[]>`
      SELECT COUNT(DISTINCT target_id)::int AS stale
      FROM sales_target_website_audits
      WHERE audited_at < NOW() - INTERVAL '30 days'
    `,
    sql<Record<string, unknown>[]>`
      SELECT provider, state, consecutive_fail
      FROM sales_target_provider_health
      WHERE state != 'HEALTHY'
      ORDER BY updated_at DESC
    `,
    sql<Record<string, unknown>[]>`
      WITH qualified AS (
        SELECT DISTINCT target_id
        FROM sales_target_milestone_events
        WHERE milestone_key = 'FIRST_QUALIFIED' AND target_id IS NOT NULL
      ),
      cost_by_target AS (
        SELECT target_id, SUM(cost_cents)::bigint AS cost_cents
        FROM sales_target_provider_requests
        WHERE target_id IS NOT NULL
        GROUP BY target_id
      )
      SELECT
        (SELECT COALESCE(SUM(cost_cents), 0)::bigint
         FROM sales_target_provider_requests) AS total_cost,
        COALESCE(SUM(cost_by_target.cost_cents), 0)::bigint AS qualified_cost,
        COUNT(qualified.target_id)::int AS qualified_targets
      FROM qualified
      LEFT JOIN cost_by_target ON cost_by_target.target_id = qualified.target_id
    `,
  ]);

  const total = Number(totals[0]?.total ?? 0);
  const ready = Number(totals[0]?.ready ?? 0);
  const withWebsite = Number(totals[0]?.with_website ?? 0);
  const withPhone = Number(contactCoverage[0]?.with_phone ?? 0);
  const withEmail = Number(contactCoverage[0]?.with_email ?? 0);
  const withDm = Number(dmCoverage[0]?.with_dm ?? 0);
  const withOpp = Number(oppCoverage[0]?.with_opp ?? 0);

  const verifiedPhone = Number(verified[0]?.verified_phone ?? 0);
  const allPhone = Number(verified[0]?.all_phone ?? 0);
  const verifiedEmail = Number(verified[0]?.verified_email ?? 0);
  const allEmail = Number(verified[0]?.all_email ?? 0);
  const avgConf = Number(verified[0]?.avg_conf ?? 0);
  const conflicting = Number(verified[0]?.conflicting ?? 0);

  const dupCount = Number(duplicates[0]?.dup_count ?? 0);
  const staleAudits = Number(stale[0]?.stale ?? 0);

  const totalCost = Number(costs[0]?.total_cost ?? 0);
  const qualifiedCost = Number(costs[0]?.qualified_cost ?? 0);
  const qualifiedTargets = Number(costs[0]?.qualified_targets ?? 0);

  return {
    totalCompanies: total,
    companiesReady: ready,
    websiteCoverage: total === 0 ? 0 : withWebsite / total,
    phoneCoverage: total === 0 ? 0 : withPhone / total,
    emailCoverage: total === 0 ? 0 : withEmail / total,
    decisionMakerCoverage: total === 0 ? 0 : withDm / total,
    opportunityCoverage: total === 0 ? 0 : withOpp / total,
    verifiedPhoneRate: allPhone === 0 ? 0 : verifiedPhone / allPhone,
    verifiedEmailRate: allEmail === 0 ? 0 : verifiedEmail / allEmail,
    averageConfidence: avgConf,
    conflictingContactCount: conflicting,
    possibleDuplicateCount: dupCount,
    staleWebsiteAudits: staleAudits,
    providerFailures: providerHealth.map((r) => ({
      provider: r.provider as string,
      state: r.state as string,
      consecutiveFail: Number(r.consecutive_fail ?? 0),
    })),
    totalProviderCostCents: totalCost,
    perQualifiedLeadCostCents:
      qualifiedTargets === 0 ? null : Math.round(qualifiedCost / qualifiedTargets),
  };
}

/* -------------------------------------------------------------------------- */
/*  Review-Queue                                                               */
/* -------------------------------------------------------------------------- */

export interface ReviewQueueItem {
  targetId: string;
  name: string;
  city: string | null;
  priorityClass: string | null;
  totalScore: number | null;
  evidenceConfidence: number | null;
  reason: "HIGH_SCORE_LOW_CONFIDENCE" | "POSSIBLE_DUPLICATE" | "CONFLICTING_CONTACT";
  flag: Record<string, unknown>;
}

export async function listReviewQueue(limit = 100): Promise<ReviewQueueItem[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM (
      /* HIGH_SCORE + LOW_CONFIDENCE */
      SELECT
        t.id AS target_id,
        t.name,
        t.city,
        ls.priority_class,
        ls.total_score,
        ls.evidence_confidence,
        'HIGH_SCORE_LOW_CONFIDENCE'::text AS reason,
        jsonb_build_object('threshold', 0.5) AS flag
      FROM sales_target_companies t
      JOIN sales_target_lead_scores ls ON ls.target_id = t.id AND ls.is_current = TRUE
      WHERE t.deleted_at IS NULL
        AND ls.total_score >= 65
        AND (ls.evidence_confidence IS NULL OR ls.evidence_confidence < 0.5)

      UNION ALL

      /* POSSIBLE_DUPLICATE */
      SELECT
        t.id, t.name, t.city, NULL, NULL, NULL,
        'POSSIBLE_DUPLICATE'::text,
        jsonb_build_object('duplicate_of', t.possible_duplicate_of, 'confidence', t.possible_duplicate_confidence)
      FROM sales_target_companies t
      WHERE t.deleted_at IS NULL AND t.possible_duplicate_of IS NOT NULL

      UNION ALL

      /* CONFLICTING_CONTACT */
      SELECT
        t.id, t.name, t.city, NULL, NULL, NULL,
        'CONFLICTING_CONTACT'::text,
        jsonb_build_object('conflicts', COUNT(c.*))
      FROM sales_target_companies t
      JOIN sales_target_contacts c ON c.target_id = t.id AND c.verification_status = 'conflicting' AND c.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
      GROUP BY t.id, t.name, t.city
    ) q
    ORDER BY reason, total_score DESC NULLS LAST
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    targetId: r.target_id as string,
    name: r.name as string,
    city: (r.city as string | null) ?? null,
    priorityClass: (r.priority_class as string | null) ?? null,
    totalScore: numOrNull(r.total_score),
    evidenceConfidence: numOrNull(r.evidence_confidence),
    reason: r.reason as ReviewQueueItem["reason"],
    flag: (r.flag as Record<string, unknown>) ?? {},
  }));
}

/* -------------------------------------------------------------------------- */
/*  Golden-Dataset / POSSIBLE_DUPLICATE                                        */
/* -------------------------------------------------------------------------- */

export async function markGoldenDataset(targetId: string, flag: boolean): Promise<void> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  if (flag) {
    const completed = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM sales_target_evaluations
        WHERE target_id = ${targetId} AND review_status = 'COMPLETED'
      ) AS exists
    `;
    if (!completed[0]?.exists) {
      throw new TargetError(
        "VALIDATION_FAILED",
        "Golden-Dataset-Aufnahme erfordert ein abgeschlossenes menschliches Review",
      );
    }
  }
  await sql`
    UPDATE sales_target_companies
    SET is_golden_dataset = ${flag}, updated_at = NOW()
    WHERE id = ${targetId} AND deleted_at IS NULL
  `;
}

export async function markPossibleDuplicate(
  targetId: string,
  duplicateOf: string | null,
  confidence: number | null
): Promise<void> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  await sql`
    UPDATE sales_target_companies
    SET possible_duplicate_of = ${duplicateOf},
        possible_duplicate_confidence = ${confidence},
        updated_at = NOW()
    WHERE id = ${targetId} AND deleted_at IS NULL
  `;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
function asIsoRequired(v: unknown): string {
  if (!v) return new Date(0).toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return new Date(0).toISOString();
}

/**
 * MD5 — ausschließlich für Dedup-Hashes (kein Security-Zweck).
 */
function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}
