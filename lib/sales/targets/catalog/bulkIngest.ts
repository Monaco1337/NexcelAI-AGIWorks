/**
 * Batch-Ingest für Katalog-Läufe.
 *
 * Der interaktive Pfad `ingestDiscoveredCompany` in `pipeline.ts` macht
 * pro Firma sechs und mehr Round-Trips (Fingerprint-Lookup, Fuzzy-Match,
 * Insert, Source, Activity, Enrichment-Enqueue). Das ist für eine
 * Einzelsuche mit 50 Treffern richtig, aber bei 1.500 Firmen pro
 * Segment unbrauchbar: es überschreitet jedes Funktionszeitbudget.
 *
 * Dieser Pfad schreibt dieselben Tabellen mit derselben Semantik, aber
 * mengenorientiert:
 *
 *   1. ein Fingerprint-Lookup für den gesamten Batch
 *   2. ein mehrzeiliges INSERT … ON CONFLICT (fingerprint) DO NOTHING
 *   3. ein mehrzeiliges INSERT für die Provenance-Zeilen
 *   4. ein mehrzeiliges INSERT für die Enrichment-Jobs
 *
 * Damit werden aus über 9.000 Round-Trips vier Anweisungen. Der
 * Fuzzy-Duplikat-Check entfällt hier bewusst — er ist teuer und für
 * exakte OSM-Element-Dubletten nicht nötig; die Review-Queue findet
 * verbleibende Kandidaten weiterhin über den bestehenden Sweep.
 *
 * Es entsteht keine neue Speicherarchitektur: geschrieben wird
 * ausschließlich in `sales_target_companies`, `sales_target_sources`,
 * `sales_target_external_ids` und `sales_target_enrichment_jobs`.
 */

import { db } from "@/lib/pg";
import { createHash, randomUUID } from "node:crypto";
import type { DiscoveredCompanyStub } from "../providers/types";
import { buildFingerprint } from "../entityResolution";
import { domainFromUrl } from "../websiteAudit";
import {
  preScoreFromStub,
  preScoreClass,
  enrichmentPriorityFromPreScore,
} from "../preScore";
import { getDiscoveryProviders } from "../providers/registry";
import { normalizePhone } from "../phone";

export interface BulkIngestResult {
  received: number;
  inserted: number;
  duplicates: number;
  sourcesWritten: number;
  enrichmentQueued: number;
}

const EMPTY: BulkIngestResult = {
  received: 0,
  inserted: 0,
  duplicates: 0,
  sourcesWritten: 0,
  enrichmentQueued: 0,
};

/** Postgres verträgt keine beliebig großen Multi-Row-Inserts pro Anweisung. */
const CHUNK = 500;

export async function bulkIngestCompanies(
  stubs: DiscoveredCompanyStub[],
  opts: { searchJobId: string | null; region?: string | null }
): Promise<BulkIngestResult> {
  const sql = await db();
  if (!sql || stubs.length === 0) return { ...EMPTY, received: stubs.length };

  // Fingerprints berechnen und innerhalb des Batches deduplizieren:
  // dieselbe Firma kann über mehrere Tag-Achsen hereinkommen.
  const byFingerprint = new Map<string, { stub: DiscoveredCompanyStub; domain: string | null }>();
  for (const stub of stubs) {
    const domain = stub.domain ?? domainFromUrl(stub.website ?? null);
    const fp = buildFingerprint({
      name: stub.name,
      website: stub.website ?? null,
      domain,
      phone: stub.phone ?? null,
      addressLine: stub.addressLine ?? null,
      postalCode: stub.postalCode ?? null,
      city: stub.city ?? null,
      country: stub.country ?? "DE",
      googlePlaceId: stub.googlePlaceId ?? null,
    }).primary;
    const prev = byFingerprint.get(fp);
    if (!prev || stub.confidence > prev.stub.confidence) {
      byFingerprint.set(fp, { stub, domain });
    }
  }

  const entries = Array.from(byFingerprint.entries());
  const result: BulkIngestResult = {
    ...EMPTY,
    received: stubs.length,
    duplicates: stubs.length - entries.length,
  };
  const providerPolicies = new Map(
    getDiscoveryProviders().map((provider) => [provider.key, provider.metadata.policy] as const),
  );
  const coverageRunRows = opts.searchJobId
    ? await sql<{ id: string }[]>`
        SELECT id
        FROM sales_target_coverage_runs
        WHERE search_job_id = ${opts.searchJobId}
        ORDER BY created_at DESC
        LIMIT 1
      `
    : [];
  const coverageRunId = coverageRunRows[0]?.id ?? null;

  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    // Bewertung aus Discovery-Daten: kostenlos, sofort, und die einzige
    // Grundlage, um die Anreicherung sinnvoll zu ordnen.
    const preScores = new Map<string, number>();
    const rows: Array<Record<string, unknown>> = chunk.map(([fingerprint, { stub, domain }]) => {
      const pre = preScoreFromStub(stub);
      preScores.set(fingerprint, pre.score);
      return {
      id: `tg_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
      name: truncate(stub.name, 300),
      industry: stub.industry ?? null,
      sub_industry: stub.subIndustry ?? null,
      is_chain: stub.isChain ?? false,
      website: stub.website ?? null,
      domain,
      phone: stub.phone ?? null,
      email: stub.email ?? null,
      address_line: stub.addressLine ?? null,
      postal_code: stub.postalCode ?? null,
      city: stub.city ?? null,
      region: stub.region ?? opts.region ?? null,
      country: (stub.country ?? "DE").toUpperCase(),
      latitude: numOrNull(stub.latitude),
      longitude: numOrNull(stub.longitude),
      employee_estimate_min: intOrNull(stub.employeeEstimateMin),
      employee_estimate_max: intOrNull(stub.employeeEstimateMax),
      founded_year: intOrNull(stub.foundedYear),
      fingerprint,
      origin_search_job_id: opts.searchJobId,
      pre_score: pre.score,
      pre_score_class: preScoreClass(pre.score),
      // Die verdichteten Quellmerkmale gehoeren ins Profil, nicht in den
      // Papierkorb: sie tragen Digitalisierungs- und Groessenhinweise.
      tags: stub.signals ?? [],
      };
    });

    // 1. Firmen. ON CONFLICT auf dem UNIQUE-Fingerprint-Index aus 0013.
    //    DO NOTHING statt UPDATE: ein bereits bekannter Datensatz kann
    //    durch Enrichment reichere Daten haben als der rohe Stub.
    const insertedRaw = (await sql`
      INSERT INTO sales_target_companies ${sql(
        rows,
        "id",
        "name",
        "industry",
        "sub_industry",
        "is_chain",
        "website",
        "domain",
        "phone",
        "email",
        "address_line",
        "postal_code",
        "city",
        "region",
        "country",
        "latitude",
        "longitude",
        "employee_estimate_min",
        "employee_estimate_max",
        "founded_year",
        "fingerprint",
        "origin_search_job_id",
        "pre_score",
        "pre_score_class",
        "tags"
      )}
      ON CONFLICT (fingerprint) WHERE deleted_at IS NULL DO NOTHING
      RETURNING id, fingerprint
    `) as unknown as Array<{ id: string; fingerprint: string }>;
    result.inserted += insertedRaw.length;
    result.duplicates += chunk.length - insertedRaw.length;
    const allTargets = await sql<{ id: string; fingerprint: string }[]>`
      SELECT id, fingerprint
      FROM sales_target_companies
      WHERE deleted_at IS NULL
        AND fingerprint = ANY(${chunk.map(([fingerprint]) => fingerprint)})
    `;
    const idByFingerprint = new Map(
      allTargets.map((row) => [row.fingerprint, row.id] as const),
    );

    // 2. Immutable raw observations and normalized candidates for both new
    // and already-known companies. Canonical deduplication must never erase
    // evidence or provider-yield accounting.
    const observationByFingerprint = new Map<string, string>();
    const observationKeyByFingerprint = new Map<string, string>();
    const candidateByFingerprint = new Map<string, string>();
    const observationRows: Array<Record<string, unknown>> = chunk.flatMap(([fingerprint, { stub }]) => {
      const targetId = idByFingerprint.get(fingerprint);
      if (!targetId) return [];
      const id = `obs_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
      const payloadHash = sha256(stableStringify(stub));
      const idempotencyKey = sha256(stableStringify({
        provider: stub.provider,
        sourceKind: "company_discovery",
        externalRecordId: stub.providerRawId ?? null,
        payloadHash,
      }));
      observationKeyByFingerprint.set(fingerprint, idempotencyKey);
      const policy = providerPolicies.get(stub.provider);
      return [{
        id,
        target_id: targetId,
        search_job_id: opts.searchJobId,
        provider: stub.provider,
        source_kind: "company_discovery",
        source_locator: stub.providerSourceUrl ?? null,
        external_record_id: stub.providerRawId ?? null,
        content_type: "application/json",
        payload: JSON.parse(JSON.stringify(stub)) as Record<string, unknown>,
        payload_hash: payloadHash,
        idempotency_key: idempotencyKey,
        schema_version: "v1",
        observed_at: new Date().toISOString(),
        provenance: { provider: stub.provider, confidence: stub.confidence },
        retention_class: policy?.retentionClass.toLowerCase() ?? "operational",
        retain_until: policy?.maxRetentionDays
          ? new Date(Date.now() + policy.maxRetentionDays * 86_400_000).toISOString()
          : null,
      }];
    });
    if (observationRows.length > 0) {
      await sql`
        INSERT INTO sales_target_raw_observations ${sql(
          observationRows,
          "id", "target_id", "search_job_id", "provider", "source_kind",
          "source_locator", "external_record_id", "content_type", "payload",
          "payload_hash", "idempotency_key", "schema_version", "observed_at", "provenance",
          "retention_class", "retain_until"
        )}
        ON CONFLICT (idempotency_key) DO NOTHING
      `;
      const observationKeys = [...observationKeyByFingerprint.values()];
      const persisted = await sql<{ id: string; idempotency_key: string }[]>`
        SELECT id, idempotency_key
        FROM sales_target_raw_observations
        WHERE idempotency_key = ANY(${observationKeys})
      `;
      const idByKey = new Map(persisted.map((row) => [row.idempotency_key, row.id]));
      for (const [fingerprint, key] of observationKeyByFingerprint) {
        const persistedId = idByKey.get(key);
        if (persistedId) observationByFingerprint.set(fingerprint, persistedId);
      }
    }
    const candidateRows: Array<Record<string, unknown>> = chunk.flatMap(([fingerprint, { stub, domain }]) => {
      const targetId = idByFingerprint.get(fingerprint);
      const observationId = observationByFingerprint.get(fingerprint);
      if (!targetId || !observationId) return [];
      const id = `cand_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
      candidateByFingerprint.set(fingerprint, id);
      return [{
        id,
        observation_id: observationId,
        target_id: targetId,
        entity_kind: "company",
        field_path: "company",
        raw_value: JSON.parse(JSON.stringify(stub)) as Record<string, unknown>,
        normalized_value: JSON.parse(JSON.stringify({ ...stub, domain })) as Record<string, unknown>,
        normalized_text: stub.name.toLowerCase(),
        normalization_key: fingerprint,
        normalizer_name: "company-discovery",
        normalizer_version: "v1",
        confidence: clamp01(stub.confidence),
        provenance: { provider: stub.provider },
      }];
    });
    if (candidateRows.length > 0) {
      await sql`
        INSERT INTO sales_target_normalized_candidates ${sql(
          candidateRows,
          "id", "observation_id", "target_id", "entity_kind", "field_path",
          "raw_value", "normalized_value", "normalized_text", "normalization_key",
          "normalizer_name", "normalizer_version", "confidence", "provenance"
        )}
        ON CONFLICT (
          observation_id, field_path, normalizer_name, normalizer_version
        ) DO NOTHING
      `;
      const observationIds = [...observationByFingerprint.values()];
      const persisted = await sql<{ id: string; observation_id: string }[]>`
        SELECT id, observation_id
        FROM sales_target_normalized_candidates
        WHERE observation_id = ANY(${observationIds})
          AND field_path = 'company'
          AND normalizer_name = 'company-discovery'
          AND normalizer_version = 'v1'
      `;
      const candidateByObservation = new Map(
        persisted.map((row) => [row.observation_id, row.id]),
      );
      for (const [fingerprint, observationId] of observationByFingerprint) {
        const candidateId = candidateByObservation.get(observationId);
        if (candidateId) candidateByFingerprint.set(fingerprint, candidateId);
      }
    }
    const insertedIds = new Set(insertedRaw.map((row) => row.id));
    const claimByFingerprint = new Map<string, string>();
    const claimRows = chunk.flatMap(([fingerprint, { stub }]) => {
      const targetId = idByFingerprint.get(fingerprint);
      const observationId = observationByFingerprint.get(fingerprint);
      const candidateId = candidateByFingerprint.get(fingerprint);
      if (!targetId || !observationId || !candidateId) return [];
      const id = `claim_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
      claimByFingerprint.set(fingerprint, id);
      return [{
        id,
        target_id: targetId,
        candidate_id: candidateId,
        observation_id: observationId,
        subject_kind: "company",
        claim_kind: "composite_fingerprint",
        namespace: "fingerprint",
        claimed_value: fingerprint,
        normalized_value: fingerprint,
        identity_key_hash: sha256(`fingerprint:${fingerprint}`),
        asserted_by: stub.provider,
        confidence: clamp01(stub.confidence),
        provenance: { provider: stub.provider },
      }];
    });
    if (claimRows.length > 0) {
      await sql`
        INSERT INTO sales_target_identity_claims ${sql(
          claimRows,
          "id", "target_id", "candidate_id", "observation_id", "subject_kind",
          "claim_kind", "namespace", "claimed_value", "normalized_value",
          "identity_key_hash", "asserted_by", "confidence", "provenance"
        )}
        ON CONFLICT (candidate_id, namespace, identity_key_hash)
          WHERE candidate_id IS NOT NULL
        DO NOTHING
      `;
      const candidateIds = [...candidateByFingerprint.values()];
      const persisted = await sql<{ id: string; candidate_id: string }[]>`
        SELECT id, candidate_id
        FROM sales_target_identity_claims
        WHERE candidate_id = ANY(${candidateIds})
          AND namespace = 'fingerprint'
      `;
      const claimByCandidate = new Map(
        persisted.map((row) => [row.candidate_id, row.id]),
      );
      for (const [fingerprint, candidateId] of candidateByFingerprint) {
        const claimId = claimByCandidate.get(candidateId);
        if (claimId) claimByFingerprint.set(fingerprint, claimId);
      }
    }
    const resolutionRows = chunk.flatMap(([fingerprint, { stub }]) => {
      const targetId = idByFingerprint.get(fingerprint);
      const observationId = observationByFingerprint.get(fingerprint);
      const candidateId = candidateByFingerprint.get(fingerprint);
      const claimId = claimByFingerprint.get(fingerprint);
      if (!targetId || !observationId || !candidateId || !claimId) return [];
      return [{
        id: `res_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
        claim_id: claimId,
        candidate_id: candidateId,
        observation_id: observationId,
        resolved_target_id: targetId,
        decision_kind: insertedIds.has(targetId) ? "CREATE" : "LINK",
        resolver: "bulk-fingerprint-resolver",
        resolver_version: "v1",
        confidence: clamp01(stub.confidence),
        rationale: { fingerprint },
        evidence: [{ claimId }],
        config_snapshot: { strategy: "exact-fingerprint" },
        provenance: { provider: stub.provider },
      }];
    });
    if (resolutionRows.length > 0) {
      await sql`
        INSERT INTO sales_target_resolution_decisions ${sql(
          resolutionRows,
          "id", "claim_id", "candidate_id", "observation_id", "resolved_target_id",
          "decision_kind", "resolver", "resolver_version", "confidence", "rationale",
          "evidence", "config_snapshot", "provenance"
        )}
        ON CONFLICT (candidate_id, resolver, resolver_version)
          WHERE candidate_id IS NOT NULL
        DO NOTHING
      `;
    }
    const now = new Date().toISOString();
    const metricRows: Array<Record<string, unknown>> = [];
    for (const [fingerprint, { stub }] of chunk) {
      const targetId = idByFingerprint.get(fingerprint);
      const observationId = observationByFingerprint.get(fingerprint);
      const candidateId = candidateByFingerprint.get(fingerprint);
      if (!targetId || !observationId || !candidateId) continue;
      metricRows.push(
        {
          id: `met_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
          metric_key: "RAW_OBSERVED",
          event_kind: "increment",
          target_id: targetId,
          coverage_run_id: coverageRunId,
          value: 1,
          unit: "count",
          dimensions: { provider: stub.provider },
          source_system: "revenue_intelligence",
          deduplication_key: `observation:${observationId}:raw`,
          occurred_at: now,
          provenance: { definitionVersion: "revenue-intelligence-v1" },
        },
        {
          id: `met_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
          metric_key: "CANDIDATE_VALID",
          event_kind: "increment",
          target_id: targetId,
          coverage_run_id: coverageRunId,
          value: 1,
          unit: "count",
          dimensions: { provider: stub.provider },
          source_system: "revenue_intelligence",
          deduplication_key: `candidate:${candidateId}:valid`,
          occurred_at: now,
          provenance: { definitionVersion: "revenue-intelligence-v1" },
        },
      );
      if (insertedIds.has(targetId)) {
        metricRows.push({
          id: `met_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
          metric_key: "CANONICAL_CREATED",
          event_kind: "increment",
          target_id: targetId,
          coverage_run_id: coverageRunId,
          value: 1,
          unit: "count",
          dimensions: { provider: stub.provider },
          source_system: "revenue_intelligence",
          deduplication_key: `target:${targetId}:canonical-created`,
          occurred_at: now,
          provenance: { definitionVersion: "revenue-intelligence-v1" },
        });
      }
    }
    if (metricRows.length > 0) {
      for (let m = 0; m < metricRows.length; m += CHUNK) {
        const part = metricRows.slice(m, m + CHUNK);
        await sql`
          INSERT INTO sales_target_metric_events ${sql(
            part,
            "id", "metric_key", "event_kind", "target_id", "coverage_run_id", "value", "unit",
            "dimensions", "source_system", "deduplication_key", "occurred_at",
            "provenance"
          )}
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // 3. Provenance. Jedes belegte Feld bekommt eine Source-Zeile, damit
    //    das Quality Gate „jede Firma hat mindestens eine Quelle" hält.
    const sourceRows: Array<Record<string, unknown>> = [];
    for (const [fingerprint, { stub }] of chunk) {
      const targetId = idByFingerprint.get(fingerprint);
      if (!targetId) continue;
      const fields: Array<[string, string | null]> = [
        ["name", stub.name],
        ["phone", stub.phone ?? null],
        ["email", stub.email ?? null],
        ["website", stub.website ?? null],
        ["address", stub.addressLine ?? null],
      ];
      for (const [field, value] of fields) {
        if (!value) continue;
        sourceRows.push({
          id: `src_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
          target_id: targetId,
          field,
          value: truncate(value, 500),
          value_hash: md5(`${field}|${value}|${stub.provider}`),
          provider: stub.provider,
          source_url: stub.providerSourceUrl ?? null,
          confidence: clamp01(stub.confidence),
          verification_status: "unverified",
          is_preferred: false,
          raw_observation_id: observationByFingerprint.get(fingerprint) ?? null,
          normalized_candidate_id: candidateByFingerprint.get(fingerprint) ?? null,
          observed_at: new Date().toISOString(),
          provenance: { provider: stub.provider },
        });
      }
    }
    if (sourceRows.length > 0) {
      for (let s = 0; s < sourceRows.length; s += CHUNK) {
        const part = sourceRows.slice(s, s + CHUNK);
        await sql`
          INSERT INTO sales_target_sources ${sql(
            part,
            "id",
            "target_id",
            "field",
            "value",
            "value_hash",
            "provider",
            "source_url",
            "confidence",
            "verification_status",
            "is_preferred",
            "raw_observation_id",
            "normalized_candidate_id",
            "observed_at",
            "provenance"
          )}
          ON CONFLICT (target_id, field, provider, value_hash) DO NOTHING
        `;
        result.sourcesWritten += part.length;
      }
    }

    // Promote provider-supplied reachable contacts into the same canonical
    // contact table used by interactive ingestion. The source row remains the
    // provenance anchor; confidence determines whether qualification may treat
    // the contact as verified/high or only medium.
    const targetIds = [...new Set(
      chunk.map(([fingerprint]) => idByFingerprint.get(fingerprint)).filter(
        (id): id is string => Boolean(id),
      ),
    )];
    const persistedSources = targetIds.length > 0
      ? await sql<{ id: string; target_id: string; field: string; provider: string; value_hash: string }[]>`
          SELECT id, target_id, field, provider, value_hash
          FROM sales_target_sources
          WHERE target_id = ANY(${targetIds}) AND field IN ('phone', 'email')
        `
      : [];
    const sourceByKey = new Map(persistedSources.map((source) => [
      `${source.target_id}:${source.field}:${source.provider}:${source.value_hash}`,
      source.id,
    ]));
    const contactRows: Array<Record<string, unknown>> = [];
    for (const [fingerprint, { stub }] of chunk) {
      const targetId = idByFingerprint.get(fingerprint);
      if (!targetId) continue;
      const verificationStatus = stub.confidence >= 0.8 ? "high" : "medium";
      if (stub.phone) {
        const normalized = normalizePhone(stub.phone, stub.country ?? "DE");
        const valueHash = md5(`phone|${stub.phone}|${stub.provider}`);
        contactRows.push({
          id: `contact_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
          target_id: targetId,
          kind: normalized?.classification === "BUSINESS_MOBILE" ? "mobile" : "phone",
          value: normalized?.display ?? stub.phone,
          normalized_value: normalized?.normalized ?? stub.phone.replace(/[^\d+]/g, ""),
          classification: normalized?.classification ?? null,
          confidence: clamp01(stub.confidence),
          verification_status: verificationStatus,
          is_preferred: true,
          source_id: sourceByKey.get(`${targetId}:phone:${stub.provider}:${valueHash}`) ?? null,
        });
      }
      if (stub.email) {
        const valueHash = md5(`email|${stub.email}|${stub.provider}`);
        contactRows.push({
          id: `contact_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
          target_id: targetId,
          kind: "email",
          value: stub.email,
          normalized_value: stub.email.toLowerCase(),
          classification: "GENERAL",
          confidence: clamp01(stub.confidence),
          verification_status: verificationStatus,
          is_preferred: true,
          source_id: sourceByKey.get(`${targetId}:email:${stub.provider}:${valueHash}`) ?? null,
        });
      }
    }
    if (contactRows.length > 0) {
      await sql`
        INSERT INTO sales_target_contacts ${sql(
          contactRows,
          "id", "target_id", "kind", "value", "normalized_value",
          "classification", "confidence", "verification_status",
          "is_preferred", "source_id"
        )}
        ON CONFLICT (target_id, kind, normalized_value)
          WHERE deleted_at IS NULL AND normalized_value IS NOT NULL
        DO UPDATE SET
          value = EXCLUDED.value,
          confidence = GREATEST(sales_target_contacts.confidence, EXCLUDED.confidence),
          verification_status = CASE
            WHEN sales_target_contacts.verification_status IN ('verified', 'high')
              THEN sales_target_contacts.verification_status
            ELSE EXCLUDED.verification_status
          END,
          source_id = COALESCE(EXCLUDED.source_id, sales_target_contacts.source_id),
          last_seen_at = NOW()
      `;
    }

    // 4. External-IDs (OSM-Element-Referenz) für spätere Dedup-Läufe.
    const extRows: Array<Record<string, unknown>> = [];
    for (const [fp, { stub }] of chunk) {
      const targetId = idByFingerprint.get(fp);
      if (!targetId || !stub.providerRawId) continue;
      extRows.push({
        target_id: targetId,
        namespace: stub.provider,
        external_id: String(stub.providerRawId),
        confidence: clamp01(stub.confidence),
        source_url: stub.providerSourceUrl ?? null,
      });
    }
    if (extRows.length > 0) {
      await sql`
        INSERT INTO sales_target_external_ids ${sql(
          extRows,
          "target_id",
          "namespace",
          "external_id",
          "confidence",
          "source_url"
        )}
        ON CONFLICT (namespace, external_id) DO NOTHING
      `;
    }

    // 5. Enrichment anstoßen. Genau eine Startphase pro Firma; die
    //    Folgephasen kaskadiert der bestehende Enrichment-Worker.
    // Reihenfolge nach Pre-Score: kleinere Zahl wird zuerst gezogen.
    // Vorher bekam jede Firma pauschal 100, wodurch die Tiefenanalyse in
    // Einfuegereihenfolge lief — bei sechsstelliger Katalogroesse heisst
    // das, dass die aussichtsreichen Betriebe rechnerisch nie an die
    // Reihe kommen.
    const jobRows: Array<Record<string, unknown>> = insertedRaw.map((r) => ({
      id: `ej_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
      target_id: r.id,
      phase: "website_contact",
      priority: enrichmentPriorityFromPreScore(preScores.get(r.fingerprint) ?? 0),
    }));
    for (let j = 0; j < jobRows.length; j += CHUNK) {
      const part = jobRows.slice(j, j + CHUNK);
      await sql`
        INSERT INTO sales_target_enrichment_jobs ${sql(part, "id", "target_id", "phase", "priority")}
        ON CONFLICT DO NOTHING
      `;
      result.enrichmentQueued += part.length;
    }
  }

  return result;
}

function truncate(v: string, max: number): string {
  return v.length > max ? v.slice(0, max) : v;
}

function numOrNull(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function intOrNull(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  return Math.max(0, Math.min(1, v));
}

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
