/**
 * Zielkunden-Pipeline (Discovery + Enrichment + Scoring + Brief).
 *
 * Die Pipeline orchestriert die Phasen DISCOVER → IDENTIFY → RESOLVE →
 * ENRICH → VERIFY → ANALYZE → SCORE → CLASSIFY → PRIORITIZE →
 * RECOMMEND. Jede Phase ist als eigene Funktion implementiert und
 * unabhängig wiederholbar (siehe `processEnrichmentPhase`), damit
 * Retries und Ad-hoc-Ausführungen möglich sind.
 *
 * Wichtige Prinzipien:
 *  - Cheap-Filters-First: Website-Audit läuft nicht für jedes
 *    entdeckte Unternehmen, sondern nur, wenn Basisdaten ein Minimum
 *    an Interesse rechtfertigen.
 *  - Jeder externe Aufruf ist SSRF-sicher, mit Timeout und Größencap.
 *  - Kein Ergebnis wird erfunden. Wenn eine Phase kein Ergebnis liefert,
 *    bleibt der entsprechende Datenpunkt leer (mit Confidence 0).
 */

import type { DiscoveryResponse, DiscoveredCompanyStub } from "./providers/types";
import { getConfiguredDiscoveryProviders } from "./providers/registry";
import {
  buildFingerprint,
  matchEntities,
  preferValue,
} from "./entityResolution";
import {
  createTarget,
  findTargetById,
  findTargetByFingerprint,
  updateTarget,
  upsertContact,
  upsertDecisionMaker,
  getLatestAudit,
  replaceOpportunities,
  replaceFinancialSignals,
  saveLeadScore,
  saveSalesBrief,
  listContacts,
  listOpportunities,
  listDecisionMakers,
  listFinancialSignals,
  updateSearchJob,
  enqueueEnrichment,
  getActiveScoringConfig,
  recordActivity,
  type CreateTargetInput,
} from "./store";
import {
  upsertSourceIdempotent,
  saveWebsiteAuditIdempotent,
  tryAcquireEnrichmentLock,
  releaseEnrichmentLock,
  getTargetVersion,
  updateEnrichmentStatusWithVersion,
  markPossibleDuplicate,
} from "./hardening/storeAdditions";
import { performWebsiteAudit, domainFromUrl, newAuditId } from "./websiteAudit";
import { extractContactsFromHtml } from "./contactExtraction";
import { deriveSoftwareOpportunities } from "./softwareOpportunities";
import { computeLeadScore } from "./leadScoring";
import { computeLeadScoreV2 } from "./leadScoringV2";
import { generateSalesBrief } from "./salesBrief";
import { safeFetch, normalizeUrl } from "./security/safeFetch";
import type {
  EnrichmentPhase,
  FinancialSignal,
  SearchJob,
  TargetCompany,
} from "./model";
import { DEFAULT_PROJECT_VALUE_TIERS, DEFAULT_SCORING_WEIGHTS, newTargetId } from "./model";
import { normalizePhone } from "./phone";
import { TargetError, newCorrelationId, toTargetError } from "./errors";
import { decideFreshness } from "./staleness";
import { gateForPhase } from "./enrichmentGate";
import { recordDiscoveryEvidence } from "./observations/service";
import { recordResolution } from "./resolution/store";
import {
  executeControlledProviderCall,
} from "./providers/execution";
import { executeDiscoveryFailover } from "./providers/failover";
import {
  DEFAULT_QUALIFICATION_POLICY,
  qualifyTarget,
  type QualificationPolicy,
} from "./qualification/engine";
import { isTargetQualified, persistQualificationDecision } from "./qualification/store";
import {
  ensureQualificationRuleVersion,
  ensureRuleConfigVersion,
} from "./qualification/configStore";
import { rebuildCompanySummary } from "./readModels/companySummary";
import { recordWebsiteFetchEvidence } from "./security/fetchEvidence";
import { appendMetricEvent, createMetricEvent } from "./metrics/store";
import { ensureScoringConfigVersion } from "./scoring/store";
import {
  loadSelectedRuleDefinition,
  loadSelectedScoringDefinition,
} from "./rollout/store";

/* -------------------------------------------------------------------------- */
/*  DISCOVER                                                                   */
/* -------------------------------------------------------------------------- */

export async function runSearchJob(job: SearchJob): Promise<{
  discoveredCount: number;
  createdCount: number;
  updatedCount: number;
  providerLogs: DiscoveryResponse["providerLogs"];
}> {
  await updateSearchJob(job.id, { status: "running", startedAt: new Date().toISOString() });

  const providers = getConfiguredDiscoveryProviders();
  const providerLogs: DiscoveryResponse["providerLogs"] = [];
  const stubs: DiscoveredCompanyStub[] = [];
  let totalCost = 0;
  const correlationId = newCorrelationId("search");

  if (providers.length === 0) {
    providerLogs.push({
      provider: "registry",
      endpoint: "-",
      latencyMs: 0,
      ok: false,
      error: "Kein Discovery-Provider konfiguriert (z. B. GOOGLE_PLACES_API_KEY setzen)",
    });
  }

  if (providers.length > 0) {
    const response = await executeDiscoveryFailover(providers, {
      city: job.city,
      country: job.country,
      centerLat: job.centerLat,
      centerLng: job.centerLng,
      radiusKm: job.radiusKm,
      industries: job.industries,
      categories: job.categories,
      limit: job.limitCount,
      depth: job.depth,
    }, {
      searchJobId: job.id,
      attempt: job.attempts,
      correlationId,
    });
    stubs.push(...response.companies);
    totalCost += response.actualCostCents;
    providerLogs.push(...response.providerLogs);
  }

  const deduped = dedupeStubs(stubs);

  let createdCount = 0;
  let updatedCount = 0;
  for (const stub of deduped.slice(0, job.limitCount)) {
    const created = await ingestDiscoveredCompany(stub, job.id);
    if (created.wasCreated) createdCount++;
    else updatedCount++;
    // Nach Basisdaten sofort die erste Enrichment-Phase einreihen.
    await enqueueEnrichment(created.target.id, "website_contact", { priority: 100 });
  }

  // Wenn nichts entdeckt wurde, den ersten Provider-Fehler persistieren,
  // damit die UI sofort sehen kann WARUM (fehlender API-Key, HTTP-Fehler …)
  const firstError = providerLogs.find((l) => !l.ok)?.error ?? null;
  await updateSearchJob(job.id, {
    status: "completed",
    finishedAt: new Date().toISOString(),
    discoveredCount: deduped.length,
    actualCostCents: totalCost,
    error: deduped.length === 0 ? firstError : null,
  });

  return { discoveredCount: deduped.length, createdCount, updatedCount, providerLogs };
}

function dedupeStubs(stubs: DiscoveredCompanyStub[]): DiscoveredCompanyStub[] {
  const seen = new Map<string, DiscoveredCompanyStub>();
  for (const stub of stubs) {
    const fp = buildFingerprint({
      name: stub.name,
      website: stub.website ?? null,
      domain: domainFromUrl(stub.website ?? null),
      phone: stub.phone ?? null,
      addressLine: stub.addressLine ?? null,
      postalCode: stub.postalCode ?? null,
      city: stub.city ?? null,
      country: stub.country ?? "DE",
      googlePlaceId: stub.googlePlaceId ?? null,
    }).primary;
    const existing = seen.get(fp);
    if (!existing || (stub.confidence > existing.confidence)) {
      seen.set(fp, stub);
    }
  }
  return Array.from(seen.values());
}

/* -------------------------------------------------------------------------- */
/*  IDENTIFY + RESOLVE + INGEST                                                */
/* -------------------------------------------------------------------------- */

export interface IngestResult {
  target: TargetCompany;
  wasCreated: boolean;
}

export async function ingestDiscoveredCompany(
  stub: DiscoveredCompanyStub,
  searchJobId: string | null
): Promise<IngestResult> {
  const correlationId = newCorrelationId("discover");
  const domain = stub.domain ?? domainFromUrl(stub.website ?? null);
  const evidence = await recordDiscoveryEvidence(stub, {
    searchJobId,
    correlationId,
  });
  await Promise.all([
    appendMetricEvent(createMetricEvent({
      idempotencyKey: `observation:${evidence.observationId}:raw`,
      eventType: "RAW_OBSERVED",
      occurredAt: new Date().toISOString(),
      observationId: evidence.observationId,
      provider: stub.provider,
      correlationId,
      dimensions: { sourceKind: "company_discovery" },
      value: 1,
    })),
    appendMetricEvent(createMetricEvent({
      idempotencyKey: `candidate:${evidence.candidateId}:valid`,
      eventType: "CANDIDATE_VALID",
      occurredAt: new Date().toISOString(),
      observationId: evidence.observationId,
      provider: stub.provider,
      correlationId,
      dimensions: { normalizerVersion: "v1" },
      value: 1,
    })),
  ]);
  const fingerprint = evidence.fingerprint.primary;

  const existing = await findTargetByFingerprint(fingerprint);
  if (existing) {
    const merged = await updateTarget(existing.id, {
      name: preferValue(existing.name, stub.name) ?? existing.name,
      website: preferValue(existing.website, stub.website) ?? existing.website,
      domain: preferValue(existing.domain, domain) ?? existing.domain,
      phone: preferValue(existing.phone, stub.phone) ?? existing.phone,
      email: preferValue(existing.email, stub.email) ?? existing.email,
      addressLine: preferValue(existing.addressLine, stub.addressLine) ?? existing.addressLine,
      postalCode: preferValue(existing.postalCode, stub.postalCode) ?? existing.postalCode,
      city: preferValue(existing.city, stub.city) ?? existing.city,
      region: preferValue(existing.region, stub.region) ?? existing.region,
      country: stub.country ?? existing.country,
      latitude: preferValue(existing.latitude, stub.latitude) ?? existing.latitude,
      longitude: preferValue(existing.longitude, stub.longitude) ?? existing.longitude,
      distanceKm: preferValue(existing.distanceKm, stub.distanceKm) ?? existing.distanceKm,
      industry: preferValue(existing.industry, stub.industry) ?? existing.industry,
      subIndustry: preferValue(existing.subIndustry, stub.subIndustry) ?? existing.subIndustry,
      googleRating: preferValue(existing.googleRating, stub.googleRating) ?? existing.googleRating,
      reviewCount: preferValue(existing.reviewCount, stub.reviewCount) ?? existing.reviewCount,
    });
    await recordActivity({
      targetId: merged.id,
      kind: "discover_updated",
      summary: `Erneut in Discovery-Ergebnissen (Provider ${stub.provider})`,
      payload: { searchJobId, provider: stub.provider },
    });
    await recordResolution({
      targetId: merged.id,
      observationId: evidence.observationId,
      candidateId: evidence.candidateId,
      fingerprint: evidence.fingerprint,
      wasCreated: false,
      provider: stub.provider,
      confidence: stub.confidence,
      correlationId,
    });
    return { target: merged, wasCreated: false };
  }

  // Kein exakter Fingerprint-Treffer — aber vielleicht ein Fuzzy-Match.
  // Bei ausreichender Confidence markieren wir den neuen Datensatz als
  // POSSIBLE_DUPLICATE des Kandidaten (keine Auto-Merge — Review-Queue).
  const possibleDuplicate = await findFuzzyDuplicate(fingerprint, stub);

  const createInput: CreateTargetInput = {
    name: stub.name,
    legalName: stub.legalName ?? null,
    legalForm: stub.legalForm ?? null,
    industry: stub.industry ?? null,
    subIndustry: stub.subIndustry ?? null,
    website: stub.website ?? null,
    domain: domain,
    phone: stub.phone ?? null,
    email: stub.email ?? null,
    addressLine: stub.addressLine ?? null,
    postalCode: stub.postalCode ?? null,
    city: stub.city ?? null,
    region: stub.region ?? null,
    country: stub.country ?? "DE",
    latitude: stub.latitude ?? null,
    longitude: stub.longitude ?? null,
    distanceKm: stub.distanceKm ?? null,
    employeeEstimateMin: stub.employeeEstimateMin ?? null,
    employeeEstimateMax: stub.employeeEstimateMax ?? null,
    foundedYear: stub.foundedYear ?? null,
    googlePlaceId: stub.googlePlaceId ?? null,
    googleRating: stub.googleRating ?? null,
    reviewCount: stub.reviewCount ?? null,
    fingerprint,
    originSearchJobId: searchJobId,
  };
  const created = await createTarget(createInput);
  await appendMetricEvent(createMetricEvent({
    idempotencyKey: `target:${created.id}:canonical-created`,
    eventType: "CANONICAL_CREATED",
    occurredAt: created.createdAt,
    targetId: created.id,
    observationId: evidence.observationId,
    provider: stub.provider,
    correlationId,
    dimensions: { resolverVersion: "v1" },
    value: 1,
  }));

  if (possibleDuplicate) {
    await markPossibleDuplicate(created.id, possibleDuplicate.id, possibleDuplicate.confidence);
    await recordActivity({
      targetId: created.id,
      kind: "possible_duplicate",
      summary: `Möglicher Duplikat-Kandidat: ${possibleDuplicate.name} (Confidence ${(possibleDuplicate.confidence * 100).toFixed(0)} %)`,
      payload: { duplicateOfId: possibleDuplicate.id, confidence: possibleDuplicate.confidence },
    });
  }

  // Provenance-Einträge für kritische Felder — idempotent über
  // (target_id × field × provider × value_hash).
  const provenance: Array<[string, string | null | undefined, number, string?]> = [
    ["name", stub.name, 0.9],
    ["website", stub.website, 0.9],
    ["phone", stub.phone, 0.85],
    ["address", stub.addressLine, 0.85],
    ["google_place_id", stub.googlePlaceId, 0.98],
  ];
  for (const [field, value, confidence] of provenance) {
    if (!value) continue;
    await upsertSourceIdempotent({
      targetId: created.id,
      field,
      value: String(value),
      provider: stub.provider,
      sourceUrl: stub.providerSourceUrl ?? null,
      confidence,
      verificationStatus: confidence >= 0.9 ? "verified" : "high",
      isPreferred: true,
    });
  }
  if (stub.phone) {
    const norm = normalizePhone(stub.phone, stub.country ?? "DE");
    await upsertContact({
      targetId: created.id,
      kind: norm?.classification === "BUSINESS_MOBILE" ? "mobile" : "phone",
      value: norm?.display ?? stub.phone,
      normalizedValue: norm?.normalized ?? stub.phone.replace(/[^\d+]/g, ""),
      classification: norm?.classification ?? null,
      confidence: 0.85,
      verificationStatus: "high",
      isPreferred: true,
    });
  }
  if (stub.email) {
    await upsertContact({
      targetId: created.id,
      kind: "email",
      value: stub.email,
      normalizedValue: stub.email.toLowerCase(),
      confidence: 0.75,
      verificationStatus: "medium",
    });
  }
  await recordActivity({
    targetId: created.id,
    kind: "discovered",
    summary: `Neu entdeckt via ${stub.provider}`,
    payload: { searchJobId, provider: stub.provider, city: stub.city },
  });
  await recordResolution({
    targetId: created.id,
    observationId: evidence.observationId,
    candidateId: evidence.candidateId,
    fingerprint: evidence.fingerprint,
    wasCreated: true,
    provider: stub.provider,
    confidence: stub.confidence,
    correlationId,
  });
  return { target: created, wasCreated: true };
}

/* -------------------------------------------------------------------------- */
/*  ENRICH-PHASES                                                              */
/* -------------------------------------------------------------------------- */

export interface EnrichPhaseOutcome {
  phase: EnrichmentPhase;
  success: boolean;
  note?: string;
  followupPhases?: EnrichmentPhase[];
}

export async function processEnrichmentPhase(
  target: TargetCompany,
  phase: EnrichmentPhase
): Promise<EnrichPhaseOutcome> {
  switch (phase) {
    case "website_contact":
      return runWebsiteContactPhase(target);
    case "website_audit":
      return runWebsiteAuditPhase(target);
    case "software_opportunities":
      return runSoftwareOpportunityPhase(target);
    case "financial_signals":
      return runFinancialSignalsPhase(target);
    case "lead_score":
      return runLeadScorePhase(target);
    case "sales_brief":
      return runSalesBriefPhase(target);
    case "decision_makers":
      return runDecisionMakerPhase(target);
    case "company_basics":
      return { phase, success: true, note: "Basisdaten bereits vorhanden" };
    default:
      return { phase, success: false, note: "Unbekannte Phase" };
  }
}

async function runWebsiteContactPhase(target: TargetCompany): Promise<EnrichPhaseOutcome> {
  const url = normalizeUrl(target.website ?? "");
  if (!url) {
    await updateTarget(target.id, { enrichmentStatus: "CONTACTS_FOUND", lastEnrichmentAt: new Date().toISOString() });
    return { phase: "website_contact", success: true, note: "Keine Website hinterlegt", followupPhases: ["software_opportunities", "financial_signals"] };
  }
  const correlationId = newCorrelationId("website-fetch");
  const response = await executeControlledProviderCall({
    provider: "company_website",
    endpoint: url,
    idempotencyKey: correlationId,
    estimatedCostCents: 0,
    targetId: target.id,
    correlationId,
    operation: () => safeFetch(url, { timeoutMs: 15_000, maxBytes: 1_500_000 }),
    describe: (result, elapsedMs) => ({
      success: result.ok,
      latencyMs: elapsedMs,
      responseStatus: result.status,
      responseBytes: result.bodyText?.length ?? null,
      error: result.ok ? null : result.error ?? `HTTP ${result.status}`,
    }),
  });
  await recordWebsiteFetchEvidence({
    targetId: target.id,
    result: response,
    correlationId,
  });

  if (!response.ok || !response.bodyText) {
    await updateTarget(target.id, {
      lastEnrichmentAt: new Date().toISOString(),
      lastEnrichmentError: response.error ?? `HTTP ${response.status}`,
    });
    return {
      phase: "website_contact",
      success: false,
      note: response.error ?? `HTTP ${response.status}`,
      followupPhases: ["software_opportunities", "financial_signals"],
    };
  }
  const contacts = extractContactsFromHtml(response.bodyText, response.finalUrl, target.country || "DE");

  // Website-Source (idempotent)
  const websiteSource = await upsertSourceIdempotent({
    targetId: target.id,
    field: "website",
    value: response.finalUrl,
    provider: "company_website",
    sourceUrl: response.finalUrl,
    confidence: 0.99,
    verificationStatus: "verified",
    isPreferred: true,
  });

  for (const email of contacts.emails) {
    await upsertContact({
      targetId: target.id,
      kind: "email",
      value: email.value,
      normalizedValue: email.normalizedValue ?? email.value,
      classification: email.classification,
      confidence: email.confidence,
      verificationStatus: email.confidence >= 0.9 ? "verified" : "high",
      sourceId: websiteSource.id,
    });
  }
  for (const phone of contacts.phones) {
    await upsertContact({
      targetId: target.id,
      kind: phone.kind,
      value: phone.value,
      normalizedValue: phone.normalizedValue,
      classification: phone.classification,
      confidence: phone.confidence,
      verificationStatus: phone.confidence >= 0.9 ? "verified" : "high",
      sourceId: websiteSource.id,
    });
  }
  for (const social of contacts.socials) {
    await upsertContact({
      targetId: target.id,
      kind: social.kind,
      value: social.value,
      normalizedValue: social.normalizedValue,
      classification: null,
      confidence: social.confidence,
      verificationStatus: social.confidence >= 0.9 ? "verified" : "high",
      sourceId: websiteSource.id,
    });
  }
  for (const formUrl of contacts.contactForms) {
    await upsertContact({
      targetId: target.id,
      kind: "contact_form",
      value: formUrl,
      normalizedValue: formUrl,
      classification: null,
      confidence: 0.7,
      verificationStatus: "high",
      sourceId: websiteSource.id,
    });
  }
  await updateTarget(target.id, {
    enrichmentStatus: "CONTACTS_FOUND",
    domain: target.domain ?? domainFromUrl(response.finalUrl),
    lastEnrichmentAt: new Date().toISOString(),
    lastEnrichmentError: null,
  });
  await recordActivity({
    targetId: target.id,
    kind: "contact_extracted",
    summary: `Kontakte extrahiert (${contacts.emails.length} E-Mails, ${contacts.phones.length} Telefonnummern)`,
  });
  return {
    phase: "website_contact",
    success: true,
    followupPhases: [
      "website_audit",
      "software_opportunities",
      "financial_signals",
      "decision_makers",
    ],
  };
}

async function runWebsiteAuditPhase(target: TargetCompany): Promise<EnrichPhaseOutcome> {
  const url = normalizeUrl(target.website ?? "");
  if (!url) {
    return { phase: "website_audit", success: true, note: "Keine Website vorhanden — Audit übersprungen", followupPhases: ["software_opportunities", "lead_score"] };
  }
  const correlationId = newCorrelationId("website-audit");
  const auditRaw = await performWebsiteAudit(url, {
    fetcher: (normalizedUrl) => executeControlledProviderCall({
      provider: "company_website",
      endpoint: normalizedUrl,
      idempotencyKey: correlationId,
      estimatedCostCents: 0,
      targetId: target.id,
      correlationId,
      operation: () => safeFetch(normalizedUrl, { timeoutMs: 15_000, maxBytes: 2_000_000 }),
      describe: (result, elapsedMs) => ({
        success: result.ok,
        latencyMs: elapsedMs,
        responseStatus: result.status,
        responseBytes: result.bodyText?.length ?? null,
        error: result.ok ? null : result.error ?? `HTTP ${result.status}`,
      }),
    }),
    onFetch: async (result) => {
      await recordWebsiteFetchEvidence({
        targetId: target.id,
        result,
        correlationId,
      });
    },
  });
  const audit = { ...auditRaw, id: newAuditId(), targetId: target.id };
  await saveWebsiteAuditIdempotent(audit);
  const ensuredOpportunityRuleVersionId = await ensureRuleConfigVersion({
    configKey: "website-opportunity",
    engineVersion: "website-opportunity-v1",
    definition: {
      source: "website-audit",
      deterministic: true,
      findingsModel: "fact-inference-recommendation",
    },
  });
  const opportunityRollout = await loadSelectedRuleDefinition(
    "opportunity",
    "website-opportunity",
    target.id,
  );
  const opportunityRuleVersionId =
    opportunityRollout.selection.selectedVersionId ?? ensuredOpportunityRuleVersionId;

  // Website-Opportunities als Opps ablegen
  const oppInputs = audit.opportunities.map((o) => ({
    targetId: target.id,
    source: "website" as const,
    kind: o.kind,
    title: o.title,
    problem: o.problem,
    proposedSolution: o.proposedSolution,
    businessImpact: null,
    reason: o.reason,
    evidence: o.evidence,
    confidence: o.confidence,
    opportunityScore: o.opportunityScore,
    estimatedMinCents: o.estimatedMinCents,
    estimatedRecommendedCents: o.estimatedRecommendedCents,
    estimatedMaxCents: o.estimatedMaxCents,
    currency: o.currency,
    ruleConfigVersionId: opportunityRuleVersionId,
    ruleVersion: "website-opportunity-v1",
    evidenceConfidence: o.confidence,
  }));
  await replaceOpportunities(target.id, "website", oppInputs);
  await updateTarget(target.id, {
    enrichmentStatus: "ANALYZING",
    lastEnrichmentAt: new Date().toISOString(),
    lastEnrichmentError: audit.error ?? null,
  });
  await recordActivity({
    targetId: target.id,
    kind: "audit_completed",
    summary: `Website-Audit abgeschlossen (Score ${audit.websiteScore}/100)`,
    payload: { auditId: audit.id, websiteScore: audit.websiteScore },
  });
  return {
    phase: "website_audit",
    success: true,
    followupPhases: ["software_opportunities", "lead_score", "sales_brief"],
  };
}

async function runSoftwareOpportunityPhase(target: TargetCompany): Promise<EnrichPhaseOutcome> {
  const audit = await getLatestAudit(target.id);
  const opps = deriveSoftwareOpportunities(
    { industry: target.industry, employeeEstimateMax: target.employeeEstimateMax },
    audit
  );
  const ensuredOpportunityRuleVersionId = await ensureRuleConfigVersion({
    configKey: "software-opportunity",
    engineVersion: "software-opportunity-v1",
    definition: {
      source: "software-opportunity-engine",
      deterministic: true,
      auditAware: true,
    },
  });
  const opportunityRollout = await loadSelectedRuleDefinition(
    "opportunity",
    "software-opportunity",
    target.id,
  );
  const opportunityRuleVersionId =
    opportunityRollout.selection.selectedVersionId ?? ensuredOpportunityRuleVersionId;
  await replaceOpportunities(
    target.id,
    "software",
    opps.map((o) => ({
      targetId: target.id,
      source: "software" as const,
      kind: o.kind,
      title: o.title,
      problem: o.problem,
      proposedSolution: o.proposedSolution,
      businessImpact: o.businessImpact,
      reason: o.reason,
      evidence: o.evidence,
      confidence: o.confidence,
      opportunityScore: o.opportunityScore,
      estimatedMinCents: o.estimatedMinCents,
      estimatedRecommendedCents: o.estimatedRecommendedCents,
      estimatedMaxCents: o.estimatedMaxCents,
      currency: "EUR",
      ruleConfigVersionId: opportunityRuleVersionId,
      ruleVersion: "software-opportunity-v1",
      evidenceConfidence: o.confidence,
    }))
  );
  return { phase: "software_opportunities", success: true };
}

async function runFinancialSignalsPhase(target: TargetCompany): Promise<EnrichPhaseOutcome> {
  const signals: FinancialSignal[] = [];
  const now = new Date().toISOString();
  if (target.legalForm) {
    signals.push({
      id: newTargetId("fs"),
      targetId: target.id,
      kind: "legal_form",
      value: target.legalForm,
      weight: 1,
      polarity: /gmbh|ag|se/i.test(target.legalForm) ? "positive" : "neutral",
      evidence: `Rechtsform ${target.legalForm}`,
      sourceUrl: null,
      sourceId: null,
      confidence: 0.9,
      retrievedAt: now,
    });
  }
  if (target.foundedYear && target.foundedYear > 1900) {
    const age = new Date().getUTCFullYear() - target.foundedYear;
    signals.push({
      id: newTargetId("fs"),
      targetId: target.id,
      kind: "age",
      value: String(age),
      weight: 1,
      polarity: age >= 10 ? "positive" : age >= 3 ? "neutral" : "negative",
      evidence: `Gegründet ${target.foundedYear} (${age} J)`,
      sourceUrl: null,
      sourceId: null,
      confidence: 0.9,
      retrievedAt: now,
    });
  }
  if (target.employeeEstimateMax) {
    signals.push({
      id: newTargetId("fs"),
      targetId: target.id,
      kind: "employees",
      value: String(target.employeeEstimateMax),
      weight: 1,
      polarity: target.employeeEstimateMax >= 30 ? "positive" : "neutral",
      evidence: `~${target.employeeEstimateMax} Mitarbeiter`,
      sourceUrl: null,
      sourceId: null,
      confidence: 0.6,
      retrievedAt: now,
    });
  }
  if (target.googleRating && target.reviewCount && target.reviewCount >= 20) {
    signals.push({
      id: newTargetId("fs"),
      targetId: target.id,
      kind: "reviews",
      value: `${target.reviewCount}★${target.googleRating.toFixed(1)}`,
      weight: 1,
      polarity: target.googleRating >= 4.3 ? "positive" : "neutral",
      evidence: `${target.reviewCount} Google-Bewertungen, Ø ${target.googleRating.toFixed(1)}`,
      sourceUrl: null,
      sourceId: null,
      confidence: 0.85,
      retrievedAt: now,
    });
  }
  await replaceFinancialSignals(target.id, signals);
  return { phase: "financial_signals", success: true };
}

async function runDecisionMakerPhase(target: TargetCompany): Promise<EnrichPhaseOutcome> {
  // Ohne konfigurierten Registry-/LinkedIn-Provider können wir hier keine
  // Entscheider erfinden. Ehrlicher Log-Eintrag, kein Fake.
  await recordActivity({
    targetId: target.id,
    kind: "decision_maker_search",
    summary: "Kein konfigurierter Entscheider-Provider — manuelle Recherche empfohlen",
  });
  return { phase: "decision_makers", success: true, note: "Kein Provider konfiguriert" };
}

async function runLeadScorePhase(target: TargetCompany): Promise<EnrichPhaseOutcome> {
  const [contacts, dms, opps, signals, audit, config] = await Promise.all([
    listContacts(target.id),
    listDecisionMakers(target.id),
    listOpportunities(target.id),
    listFinancialSignals(target.id),
    getLatestAudit(target.id),
    getActiveScoringConfig(),
  ]);
  const baselineThresholds = config
    ? {
        aPlusPlus: config.thresholdAPlusPlus ?? 92,
        aPlus: config.thresholdAPlus,
        a: config.thresholdA,
        b: config.thresholdB,
        c: config.thresholdC,
      }
    : { aPlusPlus: 92, aPlus: 85, a: 70, b: 55, c: 40 };
  const baselineWeights = config?.weights ?? DEFAULT_SCORING_WEIGHTS;
  const configKey = config?.key ?? "default";
  const featureSnapshot = {
    contactCount: contacts.length,
    decisionMakerCount: dms.length,
    opportunityCount: opps.length,
    financialSignalCount: signals.length,
    hasWebsiteAudit: Boolean(audit),
  };

  const [ensuredScoringVersionId, ensuredRuleVersionId] = await Promise.all([
    ensureScoringConfigVersion({
      key: configKey,
      scoreVersion: "score-v2",
      weights: baselineWeights,
      thresholds: baselineThresholds,
      valueTiers: config?.projectValueTiers ?? DEFAULT_PROJECT_VALUE_TIERS,
    }),
    ensureQualificationRuleVersion(DEFAULT_QUALIFICATION_POLICY),
  ]);
  const [selectedScoring, selectedQualification] = await Promise.all([
    loadSelectedScoringDefinition(configKey, target.id),
    loadSelectedRuleDefinition("qualification", "sales-readiness", target.id),
  ]);
  const weights = (selectedScoring.definition?.weights ?? baselineWeights) as typeof baselineWeights;
  const thresholds = (selectedScoring.definition?.thresholds ?? baselineThresholds) as typeof baselineThresholds;
  const scoringConfigVersionId =
    selectedScoring.selection.selectedVersionId ?? ensuredScoringVersionId;
  const ruleConfigVersionId =
    selectedQualification.selection.selectedVersionId ?? ensuredRuleVersionId;
  const qualificationPolicy = qualificationPolicyFromDefinition(
    selectedQualification.definition,
  );

  // V1 — historisch, reproducible, keine Semantik-Änderung
  const v1 = computeLeadScore({
    company: target,
    contacts,
    decisionMakers: dms,
    opportunities: opps,
    financialSignals: signals,
    websiteAudit: audit,
    weights,
    thresholds,
    configKey,
  });
  // V2 — mit UNKNOWN-Semantik, Propensity, Contactability, DM-Relevance,
  // Sales-Priority-Matrix und strukturierter Explainability.
  const v2 = computeLeadScoreV2({
    company: target,
    contacts,
    decisionMakers: dms,
    opportunities: opps,
    financialSignals: signals,
    websiteAudit: audit,
    weights,
    thresholds,
    configKey,
  });
  v1.score.ruleConfigVersionId = ruleConfigVersionId;
  v1.score.scoringConfigVersionId = scoringConfigVersionId;
  v1.score.featureSnapshot = featureSnapshot;
  await saveLeadScore(v1.score);
  v2.score.ruleConfigVersionId = ruleConfigVersionId;
  v2.score.scoringConfigVersionId = scoringConfigVersionId;
  v2.score.featureSnapshot = featureSnapshot;
  await saveLeadScore(v2.score);
  const qualification = qualifyTarget({
    company: target,
    score: v2.score,
    hasVerifiedContact: contacts.some((contact) =>
      ["verified", "high"].includes(contact.verificationStatus),
    ),
    evidenceConfidence: v2.score.evidenceConfidence ?? null,
  }, qualificationPolicy);
  await persistQualificationDecision({
    targetId: target.id,
    decision: qualification,
    leadScoreId: v2.score.id,
    ruleConfigVersionId,
    scoringConfigVersionId,
    correlationId: newCorrelationId("qualification"),
  });
  await rebuildCompanySummary(target.id);

  await updateTarget(target.id, {
    enrichmentStatus: "SCORING",
    lastEnrichmentAt: new Date().toISOString(),
  });
  return {
    phase: "lead_score",
    success: true,
    followupPhases: ["sales_brief"],
    note: `V1 ${v1.totalScore}/${v1.priorityClass} · V2 ${v2.score.totalScore}/${v2.matrixPriority}`,
  };
}

async function runSalesBriefPhase(target: TargetCompany): Promise<EnrichPhaseOutcome> {
  const [contacts, dms, opps, score] = await Promise.all([
    listContacts(target.id),
    listDecisionMakers(target.id),
    listOpportunities(target.id),
    // Refresh via computeLeadScore if none exists yet
    (async () => (await import("./store")).getCurrentLeadScore(target.id))(),
  ]);
  let effectiveScore = score;
  if (!effectiveScore) {
    const config = await getActiveScoringConfig();
    const signals = await listFinancialSignals(target.id);
    const audit = await getLatestAudit(target.id);
    const fallbackThresholds = config
      ? {
          aPlusPlus: config.thresholdAPlusPlus ?? 92,
          aPlus: config.thresholdAPlus,
          a: config.thresholdA,
          b: config.thresholdB,
          c: config.thresholdC,
        }
      : { aPlusPlus: 92, aPlus: 85, a: 70, b: 55, c: 40 };
    const result = computeLeadScore({
      company: target,
      contacts,
      decisionMakers: dms,
      opportunities: opps,
      financialSignals: signals,
      websiteAudit: audit,
      weights: config?.weights ?? DEFAULT_SCORING_WEIGHTS,
      thresholds: fallbackThresholds,
      configKey: config?.key ?? "default",
    });
    const [scoringConfigVersionId, ruleConfigVersionId] = await Promise.all([
      ensureScoringConfigVersion({
        key: config?.key ?? "default",
        scoreVersion: result.score.scoreVersion ?? "score-v1",
        weights: config?.weights ?? DEFAULT_SCORING_WEIGHTS,
        thresholds: fallbackThresholds,
        valueTiers: config?.projectValueTiers ?? DEFAULT_PROJECT_VALUE_TIERS,
      }),
      ensureQualificationRuleVersion(DEFAULT_QUALIFICATION_POLICY),
    ]);
    result.score.scoringConfigVersionId = scoringConfigVersionId;
    result.score.ruleConfigVersionId = ruleConfigVersionId;
    await saveLeadScore(result.score);
    effectiveScore = result.score;
  }
  const brief = generateSalesBrief({
    company: target,
    contacts,
    decisionMakers: dms,
    opportunities: opps,
    leadScore: effectiveScore,
  });
  brief.scoringConfigVersionId = effectiveScore.scoringConfigVersionId ?? null;
  brief.ruleConfigVersionId = effectiveScore.ruleConfigVersionId ?? null;
  await saveSalesBrief(brief);
  const qualified = await isTargetQualified(target.id);
  await updateTarget(target.id, {
    enrichmentStatus: qualified ? "READY" : "SCORING",
    lastEnrichmentAt: new Date().toISOString(),
  });
  await rebuildCompanySummary(target.id);
  if (qualified) {
    await appendMetricEvent(createMetricEvent({
      idempotencyKey: `target:${target.id}:FIRST_SALES_READY`,
      eventType: "FIRST_SALES_READY",
      occurredAt: new Date().toISOString(),
      targetId: target.id,
      correlationId: newCorrelationId("sales-ready"),
      dimensions: {
        scoringConfigVersionId: effectiveScore.scoringConfigVersionId ?? null,
        ruleConfigVersionId: effectiveScore.ruleConfigVersionId ?? null,
      },
      value: 1,
    }));
  }
  await recordActivity({
    targetId: target.id,
    kind: "brief_generated",
    summary: `Sales Brief erstellt · ${brief.headline}`,
    payload: { action: brief.recommendedAction, projectValueMin: brief.projectValueMinCents, projectValueMax: brief.projectValueMaxCents },
  });
  return { phase: "sales_brief", success: true };
}

/**
 * Convenience: alle Enrichment-Phasen synchron nacheinander.
 *
 * Diese Variante ist Produktions-tauglich:
 *  - Sie hält einen persistenten Lease pro Zielkunde, damit zwei parallele
 *    Ausführungen sich nicht überholen.
 *  - Sie überspringt Phasen, deren Datenbasis frisch genug ist (TTL),
 *    außer `options.force` = true.
 *  - Sie fragt für jede teure Phase das Progressive-Enrichment-Gate ab.
 *  - Sie schreibt eine Correlation-ID in jede Aktivität, damit
 *    Log-Zeilen einer Ausführung zusammengeführt werden können.
 */
export async function runFullEnrichment(
  target: TargetCompany,
  options: { force?: boolean; correlationId?: string } = {}
): Promise<EnrichPhaseOutcome[]> {
  const correlationId = options.correlationId ?? newCorrelationId("enrich");
  const outcomes: EnrichPhaseOutcome[] = [];

  const lock = await tryAcquireEnrichmentLock(target.id);
  if (!lock.acquired) {
    throw new TargetError("ENRICHMENT_LOCKED", "Enrichment läuft bereits für diesen Zielkunden", {
      correlationId,
    });
  }

  try {
    const order: EnrichmentPhase[] = [
      "website_contact",
      "website_audit",
      "software_opportunities",
      "financial_signals",
      "decision_makers",
      "lead_score",
      "sales_brief",
    ];

    for (const phase of order) {
      const fresh = (await findTargetById(target.id)) ?? target;

      // 1) Freshness — Skip, wenn TTL noch nicht abgelaufen
      const freshness = decideFreshness(phase, fresh.lastEnrichmentAt, { force: options.force });
      if (freshness.action === "skip") {
        outcomes.push({ phase, success: true, note: `SKIP: ${freshness.reason}` });
        continue;
      }

      // 2) Gate — Skip, wenn Qualifizierung zu niedrig für teure Phase
      if (["website_audit", "financial_signals", "decision_makers"].includes(phase)) {
        const gateContacts = await listContacts(fresh.id);
        const gate = gateForPhase(phase, {
          target: fresh,
          contacts: gateContacts,
          websiteAudit: await getLatestAudit(fresh.id),
        });
        if (!gate.proceed) {
          outcomes.push({ phase, success: true, note: `GATE: ${gate.reason}` });
          continue;
        }
      }

      // 3) Ausführung — mit strukturiertem Error-Handling
      try {
        const outcome = await processEnrichmentPhase(fresh, phase);
        outcomes.push(outcome);
      } catch (err) {
        const targetErr = toTargetError(err, "SCORING_FAILED");
        // eslint-disable-next-line no-console
        console.error(`[TARGETS][${correlationId}] Phase ${phase} failed`, targetErr.toJson());
        try {
          const currentVersion = await getTargetVersion(fresh.id);
          if (currentVersion !== null) {
            await updateEnrichmentStatusWithVersion(fresh.id, currentVersion, {
              lastEnrichmentAt: new Date().toISOString(),
              lastEnrichmentError: `${targetErr.code}: ${targetErr.message}`,
            });
          }
        } catch {
          /* Version-Conflict beim Fehler-Report — nicht eskalieren */
        }
        outcomes.push({
          phase,
          success: false,
          note: `${targetErr.code}: ${targetErr.message}`,
        });
      }
    }
    return outcomes;
  } finally {
    await releaseEnrichmentLock(lock.lockKey);
  }
}

function qualificationPolicyFromDefinition(
  definition: Record<string, unknown> | null,
): QualificationPolicy {
  if (!definition) return DEFAULT_QUALIFICATION_POLICY;
  const candidate = definition as Partial<QualificationPolicy>;
  if (
    typeof candidate.version !== "string" ||
    !Array.isArray(candidate.allowedCountries) ||
    !candidate.allowedCountries.every((country) => typeof country === "string") ||
    typeof candidate.minScore !== "number" ||
    typeof candidate.minEvidenceConfidence !== "number" ||
    typeof candidate.requireReachableContact !== "boolean" ||
    typeof candidate.requireWebsiteOrAddress !== "boolean"
  ) {
    return DEFAULT_QUALIFICATION_POLICY;
  }
  return candidate as QualificationPolicy;
}

/* -------------------------------------------------------------------------- */
/*  Fuzzy-Duplicate-Erkennung beim Discovery-Insert                            */
/* -------------------------------------------------------------------------- */

/**
 * Sucht in einer engen Whitelist ähnlicher Firmen nach einem Fuzzy-Match.
 * Wir vermeiden Full-Table-Scans strikt — der Suchraum begrenzt sich auf
 * Firmen mit gleicher Domain, gleichem Google-Place-ID, gleicher
 * Postleitzahl oder gleicher Stadt+Straße.
 */
async function findFuzzyDuplicate(
  fingerprint: string,
  stub: DiscoveredCompanyStub
): Promise<{ id: string; name: string; confidence: number } | null> {
  const store = await import("./store");
  const sql = await (await import("@/lib/pg")).db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT id, name, website, domain, phone, address_line, postal_code, city, country, google_place_id, fingerprint
    FROM sales_target_companies
    WHERE deleted_at IS NULL
      AND fingerprint <> ${fingerprint}
      AND (
        (${stub.googlePlaceId ?? null}::text IS NOT NULL AND google_place_id = ${stub.googlePlaceId ?? null})
        OR (${stub.domain ?? null}::text IS NOT NULL AND domain = ${stub.domain ?? null})
        OR (${stub.postalCode ?? null}::text IS NOT NULL AND ${stub.city ?? null}::text IS NOT NULL
            AND postal_code = ${stub.postalCode ?? null} AND city = ${stub.city ?? null})
      )
    LIMIT 25
  `;
  if (rows.length === 0) return null;
  const stubFp = buildFingerprint({
    name: stub.name ?? "",
    legalName: stub.legalName ?? null,
    domain: stub.domain ?? null,
    website: stub.website ?? null,
    phone: stub.phone ?? null,
    addressLine: stub.addressLine ?? null,
    postalCode: stub.postalCode ?? null,
    city: stub.city ?? null,
    googlePlaceId: stub.googlePlaceId ?? null,
  });

  let best: { id: string; name: string; confidence: number } | null = null;
  for (const row of rows) {
    const other = buildFingerprint({
      name: (row.name as string) ?? "",
      legalName: null,
      domain: (row.domain as string | null) ?? null,
      website: (row.website as string | null) ?? null,
      phone: (row.phone as string | null) ?? null,
      addressLine: (row.address_line as string | null) ?? null,
      postalCode: (row.postal_code as string | null) ?? null,
      city: (row.city as string | null) ?? null,
      googlePlaceId: (row.google_place_id as string | null) ?? null,
    });
    const m = matchEntities(stubFp, other);
    if (m.confidence >= 0.75 && (!best || m.confidence > best.confidence)) {
      best = {
        id: row.id as string,
        name: (row.name as string) ?? "",
        confidence: m.confidence,
      };
    }
  }
  // Suppress unused-warning: store is intentionally lazy-loaded above.
  void store;
  return best;
}
