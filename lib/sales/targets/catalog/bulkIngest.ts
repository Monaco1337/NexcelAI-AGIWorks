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
  const result: BulkIngestResult = { ...EMPTY, received: stubs.length };

  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const rows: Array<Record<string, unknown>> = chunk.map(([fingerprint, { stub, domain }]) => ({
      id: `tg_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
      name: truncate(stub.name, 300),
      industry: stub.industry ?? null,
      sub_industry: stub.subIndustry ?? null,
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
    }));

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
        "origin_search_job_id"
      )}
      ON CONFLICT (fingerprint) WHERE deleted_at IS NULL DO NOTHING
      RETURNING id, fingerprint
    `) as unknown as Array<{ id: string; fingerprint: string }>;
    result.inserted += insertedRaw.length;
    result.duplicates += chunk.length - insertedRaw.length;
    if (insertedRaw.length === 0) continue;

    const idByFingerprint = new Map<string, string>(
      insertedRaw.map((r) => [r.fingerprint, r.id] as [string, string])
    );

    // 2. Provenance. Jedes belegte Feld bekommt eine Source-Zeile, damit
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
            "is_preferred"
          )}
          ON CONFLICT (target_id, field, provider, value_hash) DO NOTHING
        `;
        result.sourcesWritten += part.length;
      }
    }

    // 3. External-IDs (OSM-Element-Referenz) für spätere Dedup-Läufe.
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

    // 4. Enrichment anstoßen. Genau eine Startphase pro Firma; die
    //    Folgephasen kaskadiert der bestehende Enrichment-Worker.
    const jobRows: Array<Record<string, unknown>> = insertedRaw.map((r) => ({
      id: `ej_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
      target_id: r.id,
      phase: "website_contact",
      priority: 100,
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
