/**
 * Zielkunden-Data-Store (Postgres).
 *
 * Kapselt alle DB-Zugriffe für die 13 Zielkunden-Tabellen. Ohne
 * DB-Verbindung liefern Read-Funktionen leere Ergebnisse und Write-
 * Funktionen werfen `SalesError("db_unavailable")` — passt zu der
 * bestehenden Konvention (siehe `companiesStore.ts`).
 *
 * Wir halten die Store-Funktionen so klein wie möglich und legen die
 * Business-Logik in den Engine-Modulen ab. Der Store ist reine
 * Persistenz + Mapping.
 */

import { db, jsonParam } from "@/lib/pg";
import { SalesError } from "../model";
import type {
  EnrichmentJob,
  EnrichmentPhase,
  FinancialSignal,
  JobStatus,
  LeadScore,
  SalesBrief,
  ScoringConfig,
  SearchJob,
  TargetActivity,
  TargetCompany,
  TargetContact,
  TargetDecisionMaker,
  TargetOpportunity,
  TargetSource,
  WatchlistEntry,
  WebsiteAudit,
  EnrichmentStatus,
} from "./model";
import { newTargetId } from "./model";

/* -------------------------------------------------------------------------- */
/*  Companies                                                                  */
/* -------------------------------------------------------------------------- */

export interface TargetListFilters {
  cities?: string[];
  industries?: string[];
  priorityClasses?: string[];
  hasWebsite?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasDecisionMaker?: boolean;
  onlyWebsiteWeak?: boolean;
  onlyWithSoftwareOpportunity?: boolean;
  maxDistanceKm?: number;
  minLeadScore?: number;
  search?: string;
  status?: EnrichmentStatus[];
  limit?: number;
  offset?: number;
  sortBy?: "score" | "distance" | "recent" | "name";
  /** Geodesischer Radius-Filter (Haversine über t.latitude/t.longitude). */
  centerLat?: number;
  centerLng?: number;
  centerRadiusKm?: number;
  /**
   * Filialen ueberregionaler Ketten einbeziehen. Standard ist false: der
   * Katalog zielt auf Mittelstand und kleine Betriebe, und eine Filiale
   * entscheidet vor Ort weder ueber Budget noch ueber Software.
   */
  includeChains?: boolean;
  /** Stable score-order keyset. Only valid with sortBy="score". */
  cursor?: { score: number; updatedAt: string; id: string };
}

export interface TargetListItem {
  target: TargetCompany;
  leadScore: LeadScore | null;
  salesBrief: SalesBrief | null;
  contactSummary: {
    phoneCount: number;
    mobileCount: number;
    emailCount: number;
    directEmailCount: number;
    hasContactForm: boolean;
    hasWebsite: boolean;
  };
  decisionMakerCount: number;
}

const TARGET_COLUMNS = `
  id, name, legal_name, legal_form, industry, sub_industry, description,
  website, domain, phone, email, address_line, postal_code, city, region, country,
  latitude, longitude, distance_km, employee_estimate_min, employee_estimate_max,
  founded_year, locations_estimate, google_place_id, google_rating, review_count,
  opening_hours, social, registry_info, tags, fingerprint, origin_search_job_id,
  linked_sales_company_id, enrichment_status, last_enrichment_at, last_enrichment_error,
  do_not_contact, do_not_contact_reason, version, is_chain, pre_score, pre_score_class,
  is_golden_dataset, possible_duplicate_of, possible_duplicate_confidence, review_flags,
  created_at, updated_at
`;

function mapTargetRow(row: Record<string, unknown>): TargetCompany {
  return {
    id: row.id as string,
    name: row.name as string,
    legalName: (row.legal_name as string | null) ?? null,
    legalForm: (row.legal_form as string | null) ?? null,
    industry: (row.industry as string | null) ?? null,
    subIndustry: (row.sub_industry as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    domain: (row.domain as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    addressLine: (row.address_line as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    country: (row.country as string) ?? "DE",
    latitude: numOrNull(row.latitude),
    longitude: numOrNull(row.longitude),
    distanceKm: numOrNull(row.distance_km),
    employeeEstimateMin: numOrNull(row.employee_estimate_min),
    employeeEstimateMax: numOrNull(row.employee_estimate_max),
    foundedYear: numOrNull(row.founded_year),
    locationsEstimate: numOrNull(row.locations_estimate),
    googlePlaceId: (row.google_place_id as string | null) ?? null,
    googleRating: numOrNull(row.google_rating),
    reviewCount: numOrNull(row.review_count),
    openingHours: (row.opening_hours as Record<string, unknown>) ?? {},
    social: (row.social as Record<string, unknown>) ?? {},
    registryInfo: (row.registry_info as Record<string, unknown>) ?? {},
    tags: (row.tags as string[] | null) ?? [],
    fingerprint: (row.fingerprint as string) ?? "",
    originSearchJobId: (row.origin_search_job_id as string | null) ?? null,
    linkedSalesCompanyId: (row.linked_sales_company_id as string | null) ?? null,
    enrichmentStatus: ((row.enrichment_status as string) ?? "DISCOVERED") as EnrichmentStatus,
    lastEnrichmentAt: asIso(row.last_enrichment_at),
    lastEnrichmentError: (row.last_enrichment_error as string | null) ?? null,
    doNotContact: Boolean(row.do_not_contact),
    doNotContactReason: (row.do_not_contact_reason as string | null) ?? null,
    version: Number(row.version ?? 1),
    isChain: Boolean(row.is_chain),
    preScore: numOrNull(row.pre_score),
    preScoreClass: (row.pre_score_class as TargetCompany["preScoreClass"]) ?? null,
    isGoldenDataset: Boolean(row.is_golden_dataset),
    possibleDuplicateOf: (row.possible_duplicate_of as string | null) ?? null,
    possibleDuplicateConfidence: numOrNull(row.possible_duplicate_confidence),
    reviewFlags: asJsonObject<Record<string, unknown>>(row.review_flags),
    createdAt: asIsoRequired(row.created_at),
    updatedAt: asIsoRequired(row.updated_at),
  };
}

export async function findTargetByFingerprint(fingerprint: string): Promise<TargetCompany | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT ${sql.unsafe(TARGET_COLUMNS)}
    FROM sales_target_companies
    WHERE fingerprint = ${fingerprint} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ? mapTargetRow(rows[0]) : null;
}

export async function findTargetById(id: string): Promise<TargetCompany | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT ${sql.unsafe(TARGET_COLUMNS)}
    FROM sales_target_companies
    WHERE id = ${id} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ? mapTargetRow(rows[0]) : null;
}

export interface CreateTargetInput {
  name: string;
  fingerprint: string;
  legalName?: string | null;
  legalForm?: string | null;
  industry?: string | null;
  subIndustry?: string | null;
  description?: string | null;
  website?: string | null;
  domain?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  employeeEstimateMin?: number | null;
  employeeEstimateMax?: number | null;
  foundedYear?: number | null;
  locationsEstimate?: number | null;
  googlePlaceId?: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  openingHours?: Record<string, unknown>;
  social?: Record<string, unknown>;
  registryInfo?: Record<string, unknown>;
  tags?: string[];
  isChain?: boolean;
  preScore?: number | null;
  preScoreClass?: TargetCompany["preScoreClass"];
  originSearchJobId?: string | null;
  createdBy?: string | null;
}

export async function createTarget(input: CreateTargetInput): Promise<TargetCompany> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newTargetId();
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_companies (
      id, name, legal_name, legal_form, industry, sub_industry, description,
      website, domain, phone, email, address_line, postal_code, city, region, country,
      latitude, longitude, distance_km, employee_estimate_min, employee_estimate_max,
      founded_year, locations_estimate, google_place_id, google_rating, review_count,
      opening_hours, social, registry_info, tags, fingerprint, origin_search_job_id,
      is_chain, pre_score, pre_score_class,
      enrichment_status, created_by, updated_by
    ) VALUES (
      ${id}, ${input.name}, ${input.legalName ?? null}, ${input.legalForm ?? null},
      ${input.industry ?? null}, ${input.subIndustry ?? null}, ${input.description ?? null},
      ${input.website ?? null}, ${input.domain ?? null}, ${input.phone ?? null}, ${input.email ?? null},
      ${input.addressLine ?? null}, ${input.postalCode ?? null}, ${input.city ?? null},
      ${input.region ?? null}, ${input.country ?? "DE"},
      ${input.latitude ?? null}, ${input.longitude ?? null}, ${input.distanceKm ?? null},
      ${input.employeeEstimateMin ?? null}, ${input.employeeEstimateMax ?? null},
      ${input.foundedYear ?? null}, ${input.locationsEstimate ?? null},
      ${input.googlePlaceId ?? null}, ${input.googleRating ?? null}, ${input.reviewCount ?? null},
      ${sql.json(jsonParam(input.openingHours ?? {}))},
      ${sql.json(jsonParam(input.social ?? {}))},
      ${sql.json(jsonParam(input.registryInfo ?? {}))},
      ${input.tags ?? []},
      ${input.fingerprint}, ${input.originSearchJobId ?? null},
      ${input.isChain ?? false}, ${input.preScore ?? null}, ${input.preScoreClass ?? null},
      'DISCOVERED',
      ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    RETURNING ${sql.unsafe(TARGET_COLUMNS)}
  `;
  return mapTargetRow(rows[0]);
}

export interface UpdateTargetPatch {
  name?: string;
  legalName?: string | null;
  legalForm?: string | null;
  industry?: string | null;
  subIndustry?: string | null;
  description?: string | null;
  website?: string | null;
  domain?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  employeeEstimateMin?: number | null;
  employeeEstimateMax?: number | null;
  foundedYear?: number | null;
  locationsEstimate?: number | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  openingHours?: Record<string, unknown>;
  social?: Record<string, unknown>;
  registryInfo?: Record<string, unknown>;
  tags?: string[];
  isChain?: boolean;
  preScore?: number | null;
  preScoreClass?: TargetCompany["preScoreClass"];
  isGoldenDataset?: boolean;
  possibleDuplicateOf?: string | null;
  possibleDuplicateConfidence?: number | null;
  reviewFlags?: Record<string, unknown>;
  enrichmentStatus?: EnrichmentStatus;
  lastEnrichmentAt?: string | null;
  lastEnrichmentError?: string | null;
  doNotContact?: boolean;
  doNotContactReason?: string | null;
  linkedSalesCompanyId?: string | null;
  updatedBy?: string | null;
}

export async function updateTarget(id: string, patch: UpdateTargetPatch): Promise<TargetCompany> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql<Record<string, unknown>[]>`
    UPDATE sales_target_companies
    SET
      name = COALESCE(${patch.name ?? null}, name),
      legal_name = ${patch.legalName === undefined ? sql`legal_name` : patch.legalName},
      legal_form = ${patch.legalForm === undefined ? sql`legal_form` : patch.legalForm},
      industry = ${patch.industry === undefined ? sql`industry` : patch.industry},
      sub_industry = ${patch.subIndustry === undefined ? sql`sub_industry` : patch.subIndustry},
      description = ${patch.description === undefined ? sql`description` : patch.description},
      website = ${patch.website === undefined ? sql`website` : patch.website},
      domain = ${patch.domain === undefined ? sql`domain` : patch.domain},
      phone = ${patch.phone === undefined ? sql`phone` : patch.phone},
      email = ${patch.email === undefined ? sql`email` : patch.email},
      address_line = ${patch.addressLine === undefined ? sql`address_line` : patch.addressLine},
      postal_code = ${patch.postalCode === undefined ? sql`postal_code` : patch.postalCode},
      city = ${patch.city === undefined ? sql`city` : patch.city},
      region = ${patch.region === undefined ? sql`region` : patch.region},
      country = COALESCE(${patch.country ?? null}, country),
      latitude = ${patch.latitude === undefined ? sql`latitude` : patch.latitude},
      longitude = ${patch.longitude === undefined ? sql`longitude` : patch.longitude},
      distance_km = ${patch.distanceKm === undefined ? sql`distance_km` : patch.distanceKm},
      employee_estimate_min = ${patch.employeeEstimateMin === undefined ? sql`employee_estimate_min` : patch.employeeEstimateMin},
      employee_estimate_max = ${patch.employeeEstimateMax === undefined ? sql`employee_estimate_max` : patch.employeeEstimateMax},
      founded_year = ${patch.foundedYear === undefined ? sql`founded_year` : patch.foundedYear},
      locations_estimate = ${patch.locationsEstimate === undefined ? sql`locations_estimate` : patch.locationsEstimate},
      google_rating = ${patch.googleRating === undefined ? sql`google_rating` : patch.googleRating},
      review_count = ${patch.reviewCount === undefined ? sql`review_count` : patch.reviewCount},
      opening_hours = ${patch.openingHours === undefined ? sql`opening_hours` : sql.json(jsonParam(patch.openingHours))},
      social = ${patch.social === undefined ? sql`social` : sql.json(jsonParam(patch.social))},
      registry_info = ${patch.registryInfo === undefined ? sql`registry_info` : sql.json(jsonParam(patch.registryInfo))},
      tags = COALESCE(${patch.tags ?? null}::text[], tags),
      is_chain = COALESCE(${patch.isChain ?? null}, is_chain),
      pre_score = ${patch.preScore === undefined ? sql`pre_score` : patch.preScore},
      pre_score_class = ${patch.preScoreClass === undefined ? sql`pre_score_class` : patch.preScoreClass},
      is_golden_dataset = COALESCE(${patch.isGoldenDataset ?? null}, is_golden_dataset),
      possible_duplicate_of = ${patch.possibleDuplicateOf === undefined ? sql`possible_duplicate_of` : patch.possibleDuplicateOf},
      possible_duplicate_confidence = ${patch.possibleDuplicateConfidence === undefined ? sql`possible_duplicate_confidence` : patch.possibleDuplicateConfidence},
      review_flags = ${patch.reviewFlags === undefined ? sql`review_flags` : sql.json(jsonParam(patch.reviewFlags))},
      enrichment_status = COALESCE(${patch.enrichmentStatus ?? null}, enrichment_status),
      last_enrichment_at = ${patch.lastEnrichmentAt === undefined ? sql`last_enrichment_at` : patch.lastEnrichmentAt},
      last_enrichment_error = ${patch.lastEnrichmentError === undefined ? sql`last_enrichment_error` : patch.lastEnrichmentError},
      do_not_contact = COALESCE(${patch.doNotContact ?? null}, do_not_contact),
      do_not_contact_reason = ${patch.doNotContactReason === undefined ? sql`do_not_contact_reason` : patch.doNotContactReason},
      linked_sales_company_id = ${patch.linkedSalesCompanyId === undefined ? sql`linked_sales_company_id` : patch.linkedSalesCompanyId},
      updated_by = COALESCE(${patch.updatedBy ?? null}, updated_by),
      updated_at = NOW(),
      version = version + 1
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING ${sql.unsafe(TARGET_COLUMNS)}
  `;
  if (!rows[0]) throw new SalesError("Zielkunde nicht gefunden", "not_found", 404);
  return mapTargetRow(rows[0]);
}

export async function softDeleteTarget(id: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_target_companies SET deleted_at = NOW() WHERE id = ${id}`;
}

export async function listTargets(filters: TargetListFilters = {}): Promise<TargetListItem[]> {
  const sql = await db();
  if (!sql) return [];
  const {
    cities = [],
    industries = [],
    priorityClasses = [],
    maxDistanceKm,
    minLeadScore,
    search,
    status = [],
    limit = 100,
    offset = 0,
    sortBy = "score",
    hasWebsite,
    hasPhone,
    hasEmail,
    hasDecisionMaker,
    onlyWebsiteWeak,
    onlyWithSoftwareOpportunity,
    centerLat,
    centerLng,
    centerRadiusKm,
    cursor,
  } = filters;

  // Bounding-Box-Vorfilter für den Radius, um Full-Table-Scans zu vermeiden.
  const useCenter =
    centerLat !== undefined &&
    centerLng !== undefined &&
    centerRadiusKm !== undefined &&
    Number.isFinite(centerLat) &&
    Number.isFinite(centerLng) &&
    Number.isFinite(centerRadiusKm) &&
    centerRadiusKm > 0;
  const latDelta = useCenter ? centerRadiusKm! / 111 : null;
  const lngDelta =
    useCenter && centerLat !== undefined
      ? centerRadiusKm! / (111 * Math.max(0.1, Math.cos((centerLat! * Math.PI) / 180)))
      : null;

  const rows = await sql<Record<string, unknown>[]>`
    WITH ranked_targets AS MATERIALIZED (
      SELECT
      t.*,
      summary.current_lead_score_id,
      summary.current_sales_brief_id,
      summary.current_website_audit_id,
      summary.total_score AS summary_total_score,
      summary.priority_class AS summary_priority_class
      FROM sales_target_companies t
      LEFT JOIN sales_target_company_summaries summary ON summary.target_id = t.id
      WHERE t.deleted_at IS NULL
        AND (${filters.includeChains ?? false} OR t.is_chain = FALSE)
        AND (${cities.length === 0} OR t.city = ANY(${cities}::text[]))
        AND (${industries.length === 0} OR t.industry = ANY(${industries}::text[]))
        AND (${status.length === 0} OR t.enrichment_status = ANY(${status}::text[]))
        AND (${priorityClasses.length === 0} OR COALESCE(summary.priority_class, t.pre_score_class) = ANY(${priorityClasses}::text[]))
        AND (${maxDistanceKm ?? null}::numeric IS NULL OR t.distance_km IS NULL OR t.distance_km <= ${maxDistanceKm ?? null})
        AND (${minLeadScore ?? null}::int IS NULL OR COALESCE(summary.total_score, t.pre_score) >= ${minLeadScore ?? null})
        AND (${hasWebsite ?? null}::boolean IS NULL OR (${hasWebsite ?? null} AND t.website IS NOT NULL) OR (NOT ${hasWebsite ?? null} AND t.website IS NULL))
        AND (${hasPhone ?? null}::boolean IS NULL OR (${hasPhone ?? null} AND EXISTS (
          SELECT 1 FROM sales_target_contacts c
          WHERE c.target_id = t.id AND c.deleted_at IS NULL AND c.kind = 'phone'
        )))
        AND (${hasEmail ?? null}::boolean IS NULL OR (${hasEmail ?? null} AND EXISTS (
          SELECT 1 FROM sales_target_contacts c
          WHERE c.target_id = t.id AND c.deleted_at IS NULL AND c.kind = 'email'
        )))
        AND (${hasDecisionMaker ?? null}::boolean IS NULL OR (${hasDecisionMaker ?? null} AND EXISTS (
          SELECT 1 FROM sales_target_decision_makers d
          WHERE d.target_id = t.id AND d.deleted_at IS NULL
        )))
        AND (${onlyWebsiteWeak ?? null}::boolean IS NULL OR (${onlyWebsiteWeak ?? null} AND (
          SELECT a.website_score < 55
          FROM sales_target_website_audits a
          WHERE a.target_id = t.id
          ORDER BY a.audited_at DESC
          LIMIT 1
        ) IS TRUE))
        AND (${onlyWithSoftwareOpportunity ?? null}::boolean IS NULL OR (${onlyWithSoftwareOpportunity ?? null} AND EXISTS (
          SELECT 1 FROM sales_target_opportunities o WHERE o.target_id = t.id AND o.source = 'software' AND o.deleted_at IS NULL
        )))
        AND (${search ?? null}::text IS NULL OR
             t.search_vector @@ plainto_tsquery('german', ${search ?? null}) OR
             t.name ILIKE ${"%" + (search ?? "") + "%"})
        AND (${cursor?.id ?? null}::text IS NULL OR ${sortBy} <> 'score' OR
          (
            COALESCE(summary.total_score, t.pre_score, -1),
            t.updated_at,
            t.id
          ) < (
            ${cursor?.score ?? -1},
            ${cursor?.updatedAt ?? new Date(0).toISOString()}::timestamptz,
            ${cursor?.id ?? ""}
          )
        )
        AND (${useCenter ? 1 : 0}::int = 0 OR (
          t.latitude IS NOT NULL AND t.longitude IS NOT NULL
          AND t.latitude BETWEEN ${(centerLat ?? 0) - (latDelta ?? 0)} AND ${(centerLat ?? 0) + (latDelta ?? 0)}
          AND t.longitude BETWEEN ${(centerLng ?? 0) - (lngDelta ?? 0)} AND ${(centerLng ?? 0) + (lngDelta ?? 0)}
          AND (2 * 6371 * asin(sqrt(
            power(sin(radians((t.latitude - ${centerLat ?? 0}) / 2)), 2) +
            cos(radians(${centerLat ?? 0})) * cos(radians(t.latitude)) *
            power(sin(radians((t.longitude - ${centerLng ?? 0}) / 2)), 2)
          ))) <= ${centerRadiusKm ?? 0}
        ))
      ORDER BY
        CASE WHEN ${sortBy} = 'name' THEN t.name ELSE NULL END ASC NULLS LAST,
        CASE WHEN ${sortBy} = 'recent' THEN t.updated_at ELSE NULL END DESC NULLS LAST,
        CASE WHEN ${sortBy} = 'distance' THEN t.distance_km ELSE NULL END ASC NULLS LAST,
        COALESCE(summary.total_score, t.pre_score) DESC NULLS LAST,
        t.updated_at DESC,
        t.id DESC
      LIMIT ${limit} OFFSET ${cursor && sortBy === "score" ? 0 : offset}
    )
    SELECT
      t.*,
      ls.total_score AS ls_total_score,
      ls.priority_class AS ls_priority_class,
      ls.need_score AS ls_need_score,
      ls.opportunity_score AS ls_opp_score,
      ls.website_score AS ls_website_score,
      ls.software_opportunity_score AS ls_software_score,
      ls.commercial_capacity_score AS ls_capacity_score,
      ls.reachability_score AS ls_reach_score,
      ls.decision_maker_score AS ls_dm_score,
      ls.data_confidence_score AS ls_dc_score,
      ls.capacity_class AS ls_capacity_class,
      ls.capacity_confidence AS ls_capacity_conf,
      ls.estimated_budget_min_cents AS ls_budget_min,
      ls.estimated_budget_max_cents AS ls_budget_max,
      ls.currency AS ls_currency,
      ls.weights AS ls_weights,
      ls.breakdown AS ls_breakdown,
      ls.calculated_at AS ls_calc_at,
      ls.config_key AS ls_config_key,
      ls.id AS ls_id,
      ls.score_version AS ls_version,
      ls.propensity_score AS ls_propensity,
      ls.contactability_score AS ls_contactability,
      ls.dm_relevance_score AS ls_dm_relevance,
      ls.evidence_confidence AS ls_evidence_conf,
      ls.matrix_priority AS ls_matrix_prio,
      ls.explainability AS ls_explain,
      sb.id AS sb_id,
      sb.headline AS sb_headline,
      sb.business_summary AS sb_summary,
      sb.main_opportunity AS sb_main_opp,
      sb.opportunity_reason AS sb_reason,
      sb.recommended_entry AS sb_entry,
      sb.sales_angle AS sb_angle,
      sb.why_now AS sb_why,
      sb.recommended_action AS sb_action,
      sb.recommended_time AS sb_time,
      sb.decision_maker_id AS sb_dm,
      sb.project_value_min_cents AS sb_val_min,
      sb.project_value_max_cents AS sb_val_max,
      sb.capacity_class AS sb_cap_class,
      sb.capacity_confidence AS sb_cap_conf,
      sb.confidence AS sb_conf,
      sb.structured AS sb_struct,
      sb.generated_at AS sb_gen_at,
      sb.generated_by AS sb_gen_by,
      cs.phone_count, cs.mobile_count, cs.email_count, cs.direct_email_count, cs.has_form,
      dm.dm_count,
      la.website_score AS la_website_score
    FROM ranked_targets t
    LEFT JOIN sales_target_lead_scores ls ON ls.id = t.current_lead_score_id
    LEFT JOIN sales_target_sales_briefs sb ON sb.id = t.current_sales_brief_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE kind='phone') AS phone_count,
        COUNT(*) FILTER (WHERE kind='mobile') AS mobile_count,
        COUNT(*) FILTER (WHERE kind='email') AS email_count,
        COUNT(*) FILTER (WHERE kind='email' AND classification='DIRECT_DECISION_MAKER') AS direct_email_count,
        BOOL_OR(kind='contact_form') AS has_form
      FROM sales_target_contacts
      WHERE target_id = t.id AND deleted_at IS NULL
    ) cs ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS dm_count
      FROM sales_target_decision_makers
      WHERE target_id = t.id AND deleted_at IS NULL
    ) dm ON TRUE
    LEFT JOIN sales_target_website_audits la ON la.id = t.current_website_audit_id
    ORDER BY
      CASE WHEN ${sortBy} = 'name' THEN t.name ELSE NULL END ASC NULLS LAST,
      CASE WHEN ${sortBy} = 'recent' THEN t.updated_at ELSE NULL END DESC NULLS LAST,
      CASE WHEN ${sortBy} = 'distance' THEN t.distance_km ELSE NULL END ASC NULLS LAST,
      COALESCE(t.summary_total_score, t.pre_score) DESC NULLS LAST,
      t.updated_at DESC,
      t.id DESC
  `;

  return rows.map((row) => {
    const target = mapTargetRow(row);
    const leadScore = row.ls_id
      ? {
          id: row.ls_id as string,
          targetId: target.id,
          calculatedAt: asIsoRequired(row.ls_calc_at),
          configKey: (row.ls_config_key as string) ?? "default",
          weights: (row.ls_weights as LeadScore["weights"]) ?? ({} as LeadScore["weights"]),
          breakdown: (row.ls_breakdown as LeadScore["breakdown"]) ?? [],
          totalScore: (row.ls_total_score as number) ?? 0,
          priorityClass: ((row.ls_priority_class as string) ?? "D") as LeadScore["priorityClass"],
          needScore: numOrNull(row.ls_need_score),
          opportunityScore: numOrNull(row.ls_opp_score),
          websiteScore: numOrNull(row.ls_website_score),
          softwareOpportunityScore: numOrNull(row.ls_software_score),
          commercialCapacityScore: numOrNull(row.ls_capacity_score),
          reachabilityScore: numOrNull(row.ls_reach_score),
          decisionMakerScore: numOrNull(row.ls_dm_score),
          dataConfidenceScore: numOrNull(row.ls_dc_score),
          capacityClass: (row.ls_capacity_class as LeadScore["capacityClass"]) ?? null,
          capacityConfidence: numOrNull(row.ls_capacity_conf),
          estimatedBudgetMinCents: bigOrNull(row.ls_budget_min),
          estimatedBudgetMaxCents: bigOrNull(row.ls_budget_max),
          currency: (row.ls_currency as string) ?? "EUR",
          isCurrent: true,
          scoreVersion: ((row.ls_version as string) ?? "v1") as "v1" | "v2",
          propensityScore: numOrNull(row.ls_propensity),
          contactabilityScore: numOrNull(row.ls_contactability),
          dmRelevanceScore: numOrNull(row.ls_dm_relevance),
          evidenceConfidence: numOrNull(row.ls_evidence_conf),
          matrixPriority: (row.ls_matrix_prio as string | null) ?? null,
          explainability: (row.ls_explain as LeadScore["explainability"]) ?? [],
        }
      : null;
    const salesBrief = row.sb_id
      ? {
          id: row.sb_id as string,
          targetId: target.id,
          generatedAt: asIsoRequired(row.sb_gen_at),
          generatedBy: ((row.sb_gen_by as string) ?? "rule") as SalesBrief["generatedBy"],
          headline: (row.sb_headline as string) ?? "",
          businessSummary: (row.sb_summary as string | null) ?? null,
          mainOpportunity: (row.sb_main_opp as string | null) ?? null,
          opportunityReason: (row.sb_reason as string | null) ?? null,
          recommendedEntry: (row.sb_entry as string | null) ?? null,
          salesAngle: (row.sb_angle as string | null) ?? null,
          whyNow: (row.sb_why as string | null) ?? null,
          recommendedAction: ((row.sb_action as string) ?? "CALL_NOW") as SalesBrief["recommendedAction"],
          recommendedTime: (row.sb_time as string | null) ?? null,
          decisionMakerId: (row.sb_dm as string | null) ?? null,
          projectValueMinCents: bigOrNull(row.sb_val_min),
          projectValueMaxCents: bigOrNull(row.sb_val_max),
          capacityClass: (row.sb_cap_class as SalesBrief["capacityClass"]) ?? null,
          capacityConfidence: numOrNull(row.sb_cap_conf),
          confidence: (row.sb_conf as number) ?? 0.5,
          structured: (row.sb_struct as Record<string, unknown>) ?? {},
          isCurrent: true,
        }
      : null;
    return {
      target,
      leadScore,
      salesBrief,
      contactSummary: {
        phoneCount: Number(row.phone_count ?? 0),
        mobileCount: Number(row.mobile_count ?? 0),
        emailCount: Number(row.email_count ?? 0),
        directEmailCount: Number(row.direct_email_count ?? 0),
        hasContactForm: Boolean(row.has_form),
        hasWebsite: Boolean(target.website),
      },
      decisionMakerCount: Number(row.dm_count ?? 0),
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Sources / Contacts / DMs                                                   */
/* -------------------------------------------------------------------------- */

export interface CreateSourceInput {
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

export async function upsertSource(input: CreateSourceInput): Promise<TargetSource> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newTargetId("src");
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_sources (
      id, target_id, field, value, provider, source_url,
      confidence, verification_status, is_preferred, note
    ) VALUES (
      ${id}, ${input.targetId}, ${input.field}, ${input.value}, ${input.provider}, ${input.sourceUrl ?? null},
      ${input.confidence ?? 0.5}, ${input.verificationStatus ?? "unverified"},
      ${input.isPreferred ?? false}, ${input.note ?? null}
    )
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
    verificationStatus: (row.verification_status as TargetSource["verificationStatus"]) ?? "unverified",
    isPreferred: Boolean(row.is_preferred),
    note: (row.note as string | null) ?? null,
  };
}

export async function listSources(targetId: string): Promise<TargetSource[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_sources WHERE target_id = ${targetId}
    ORDER BY is_preferred DESC, confidence DESC, retrieved_at DESC
  `;
  return rows.map(mapSource);
}

export interface CreateContactInput {
  targetId: string;
  kind: TargetContact["kind"];
  value: string;
  normalizedValue?: string | null;
  classification?: TargetContact["classification"];
  confidence?: number;
  verificationStatus?: TargetContact["verificationStatus"];
  isPreferred?: boolean;
  sourceId?: string | null;
}

export async function upsertContact(input: CreateContactInput): Promise<TargetContact> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const existing = await sql<Record<string, unknown>[]>`
    SELECT id, confidence FROM sales_target_contacts
    WHERE target_id = ${input.targetId} AND kind = ${input.kind}
      AND normalized_value = ${input.normalizedValue ?? null}
      AND deleted_at IS NULL
    LIMIT 1
  `;
  if (existing[0]) {
    const rows = await sql<Record<string, unknown>[]>`
      UPDATE sales_target_contacts
      SET last_seen_at = NOW(),
          confidence = GREATEST(confidence, ${input.confidence ?? 0.5}),
          verification_status = COALESCE(${input.verificationStatus ?? null}, verification_status),
          classification = COALESCE(${input.classification ?? null}, classification),
          is_preferred = COALESCE(${input.isPreferred ?? null}, is_preferred),
          source_id = COALESCE(${input.sourceId ?? null}, source_id)
      WHERE id = ${existing[0].id as string}
      RETURNING *
    `;
    return mapContact(rows[0]);
  }
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_contacts (
      id, target_id, kind, value, normalized_value, classification,
      confidence, verification_status, is_preferred, source_id
    ) VALUES (
      ${newTargetId("ct")}, ${input.targetId}, ${input.kind}, ${input.value},
      ${input.normalizedValue ?? null}, ${input.classification ?? null},
      ${input.confidence ?? 0.5}, ${input.verificationStatus ?? "unverified"},
      ${input.isPreferred ?? false}, ${input.sourceId ?? null}
    )
    RETURNING *
  `;
  return mapContact(rows[0]);
}

function mapContact(row: Record<string, unknown>): TargetContact {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    kind: row.kind as TargetContact["kind"],
    value: row.value as string,
    normalizedValue: (row.normalized_value as string | null) ?? null,
    classification: (row.classification as TargetContact["classification"]) ?? null,
    confidence: Number(row.confidence),
    verificationStatus: (row.verification_status as TargetContact["verificationStatus"]) ?? "unverified",
    isPreferred: Boolean(row.is_preferred),
    sourceId: (row.source_id as string | null) ?? null,
    firstSeenAt: asIsoRequired(row.first_seen_at),
    lastSeenAt: asIsoRequired(row.last_seen_at),
  };
}

export async function listContacts(targetId: string): Promise<TargetContact[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_contacts WHERE target_id = ${targetId} AND deleted_at IS NULL
    ORDER BY is_preferred DESC, confidence DESC, last_seen_at DESC
  `;
  return rows.map(mapContact);
}

export interface CreateDecisionMakerInput {
  targetId: string;
  name: string;
  role?: string | null;
  roleCategory?: TargetDecisionMaker["roleCategory"];
  businessEmail?: string | null;
  businessPhone?: string | null;
  businessMobile?: string | null;
  linkedinUrl?: string | null;
  confidence?: number;
  sourceId?: string | null;
  sourceUrl?: string | null;
}

export async function upsertDecisionMaker(input: CreateDecisionMakerInput): Promise<TargetDecisionMaker> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const existing = await sql<Record<string, unknown>[]>`
    SELECT id FROM sales_target_decision_makers
    WHERE target_id = ${input.targetId} AND name = ${input.name} AND deleted_at IS NULL
    LIMIT 1
  `;
  if (existing[0]) {
    const rows = await sql<Record<string, unknown>[]>`
      UPDATE sales_target_decision_makers
      SET role = COALESCE(${input.role ?? null}, role),
          role_category = COALESCE(${input.roleCategory ?? null}, role_category),
          business_email = COALESCE(${input.businessEmail ?? null}, business_email),
          business_phone = COALESCE(${input.businessPhone ?? null}, business_phone),
          business_mobile = COALESCE(${input.businessMobile ?? null}, business_mobile),
          linkedin_url = COALESCE(${input.linkedinUrl ?? null}, linkedin_url),
          confidence = GREATEST(confidence, ${input.confidence ?? 0.5}),
          source_id = COALESCE(${input.sourceId ?? null}, source_id),
          source_url = COALESCE(${input.sourceUrl ?? null}, source_url),
          updated_at = NOW()
      WHERE id = ${existing[0].id as string}
      RETURNING *
    `;
    return mapDecisionMaker(rows[0]);
  }
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_decision_makers (
      id, target_id, name, role, role_category,
      business_email, business_phone, business_mobile, linkedin_url,
      confidence, source_id, source_url
    ) VALUES (
      ${newTargetId("dm")}, ${input.targetId}, ${input.name}, ${input.role ?? null},
      ${input.roleCategory ?? null},
      ${input.businessEmail ?? null}, ${input.businessPhone ?? null},
      ${input.businessMobile ?? null}, ${input.linkedinUrl ?? null},
      ${input.confidence ?? 0.5}, ${input.sourceId ?? null}, ${input.sourceUrl ?? null}
    )
    RETURNING *
  `;
  return mapDecisionMaker(rows[0]);
}

function mapDecisionMaker(row: Record<string, unknown>): TargetDecisionMaker {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    name: row.name as string,
    role: (row.role as string | null) ?? null,
    roleCategory: (row.role_category as TargetDecisionMaker["roleCategory"]) ?? null,
    businessEmail: (row.business_email as string | null) ?? null,
    businessPhone: (row.business_phone as string | null) ?? null,
    businessMobile: (row.business_mobile as string | null) ?? null,
    linkedinUrl: (row.linkedin_url as string | null) ?? null,
    confidence: Number(row.confidence),
    sourceId: (row.source_id as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    createdAt: asIsoRequired(row.created_at),
    updatedAt: asIsoRequired(row.updated_at),
  };
}

export async function listDecisionMakers(targetId: string): Promise<TargetDecisionMaker[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_decision_makers WHERE target_id = ${targetId} AND deleted_at IS NULL
    ORDER BY confidence DESC, created_at ASC
  `;
  return rows.map(mapDecisionMaker);
}

/* -------------------------------------------------------------------------- */
/*  Website Audits                                                             */
/* -------------------------------------------------------------------------- */

export async function saveWebsiteAudit(audit: WebsiteAudit): Promise<WebsiteAudit> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
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
    RETURNING *
  `;
  return mapAudit(rows[0]);
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
    findings: (row.findings as WebsiteAudit["findings"]) ?? { facts: [], inferences: [], recommendations: [] },
    techStack: (row.tech_stack as Record<string, unknown>) ?? {},
    snapshotHash: (row.snapshot_hash as string | null) ?? null,
    error: (row.error as string | null) ?? null,
  };
}

export async function getLatestAudit(targetId: string): Promise<WebsiteAudit | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_website_audits
    WHERE target_id = ${targetId}
    ORDER BY audited_at DESC
    LIMIT 1
  `;
  return rows[0] ? mapAudit(rows[0]) : null;
}

/* -------------------------------------------------------------------------- */
/*  Opportunities                                                              */
/* -------------------------------------------------------------------------- */

export interface CreateOpportunityInput {
  targetId: string;
  source: TargetOpportunity["source"];
  kind: TargetOpportunity["kind"];
  title: string;
  problem?: string | null;
  proposedSolution?: string | null;
  businessImpact?: string | null;
  reason?: string | null;
  evidence?: unknown[];
  confidence?: number;
  opportunityScore?: number | null;
  estimatedMinCents?: number | null;
  estimatedRecommendedCents?: number | null;
  estimatedMaxCents?: number | null;
  currency?: string;
  ruleConfigVersionId?: string | null;
  ruleVersion?: string;
  evidenceConfidence?: number | null;
}

export async function replaceOpportunities(
  targetId: string,
  source: "website" | "software",
  inputs: CreateOpportunityInput[]
): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`
    UPDATE sales_target_opportunities
    SET deleted_at = NOW()
    WHERE target_id = ${targetId} AND source = ${source} AND deleted_at IS NULL
  `;
  for (const input of inputs) {
    await sql`
      INSERT INTO sales_target_opportunities (
        id, target_id, source, kind, title, problem, proposed_solution, business_impact,
        reason, evidence, confidence, opportunity_score,
        estimated_min_cents, estimated_recommended_cents, estimated_max_cents, currency,
        rule_config_version_id, rule_version, evidence_confidence
      ) VALUES (
        ${newTargetId("opp")}, ${targetId}, ${input.source}, ${input.kind}, ${input.title},
        ${input.problem ?? null}, ${input.proposedSolution ?? null}, ${input.businessImpact ?? null},
        ${input.reason ?? null},
        ${sql.json(jsonParam(input.evidence ?? []))},
        ${input.confidence ?? 0.5}, ${input.opportunityScore ?? null},
        ${input.estimatedMinCents ?? null}, ${input.estimatedRecommendedCents ?? null},
        ${input.estimatedMaxCents ?? null}, ${input.currency ?? "EUR"},
        ${input.ruleConfigVersionId ?? null}, ${input.ruleVersion ?? "opportunity-v1"},
        ${input.evidenceConfidence ?? input.confidence ?? 0.5}
      )
    `;
  }
}

export async function listOpportunities(targetId: string): Promise<TargetOpportunity[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_opportunities WHERE target_id = ${targetId} AND deleted_at IS NULL
    ORDER BY confidence DESC, opportunity_score DESC NULLS LAST
  `;
  return rows.map(mapOpportunity);
}

function mapOpportunity(row: Record<string, unknown>): TargetOpportunity {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    source: row.source as TargetOpportunity["source"],
    kind: row.kind as TargetOpportunity["kind"],
    title: row.title as string,
    problem: (row.problem as string | null) ?? null,
    proposedSolution: (row.proposed_solution as string | null) ?? null,
    businessImpact: (row.business_impact as string | null) ?? null,
    reason: (row.reason as string | null) ?? null,
    evidence: (row.evidence as unknown[]) ?? [],
    confidence: Number(row.confidence),
    opportunityScore: numOrNull(row.opportunity_score),
    estimatedMinCents: bigOrNull(row.estimated_min_cents),
    estimatedRecommendedCents: bigOrNull(row.estimated_recommended_cents),
    estimatedMaxCents: bigOrNull(row.estimated_max_cents),
    currency: (row.currency as string) ?? "EUR",
    detectedAt: asIsoRequired(row.detected_at),
    ruleConfigVersionId: (row.rule_config_version_id as string | null) ?? null,
    ruleVersion: (row.rule_version as string) ?? "legacy-v1",
    evidenceConfidence: numOrNull(row.evidence_confidence),
  };
}

/* -------------------------------------------------------------------------- */
/*  Financial Signals                                                          */
/* -------------------------------------------------------------------------- */

export async function replaceFinancialSignals(
  targetId: string,
  signals: FinancialSignal[]
): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_target_financial_signals SET deleted_at = NOW() WHERE target_id = ${targetId} AND deleted_at IS NULL`;
  for (const s of signals) {
    await sql`
      INSERT INTO sales_target_financial_signals (
        id, target_id, kind, value, weight, polarity, evidence, source_url, source_id,
        confidence, retrieved_at
      ) VALUES (
        ${s.id || newTargetId("fs")}, ${targetId}, ${s.kind}, ${s.value ?? null},
        ${s.weight}, ${s.polarity}, ${s.evidence ?? null}, ${s.sourceUrl ?? null},
        ${s.sourceId ?? null}, ${s.confidence}, ${s.retrievedAt}
      )
    `;
  }
}

export async function listFinancialSignals(targetId: string): Promise<FinancialSignal[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_financial_signals
    WHERE target_id = ${targetId} AND deleted_at IS NULL
    ORDER BY weight DESC, retrieved_at DESC
  `;
  return rows.map((row) => ({
    id: row.id as string,
    targetId: row.target_id as string,
    kind: row.kind as FinancialSignal["kind"],
    value: (row.value as string | null) ?? null,
    weight: Number(row.weight),
    polarity: (row.polarity as FinancialSignal["polarity"]) ?? "neutral",
    evidence: (row.evidence as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    sourceId: (row.source_id as string | null) ?? null,
    confidence: Number(row.confidence),
    retrievedAt: asIsoRequired(row.retrieved_at),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Lead-Score + Sales Brief                                                   */
/* -------------------------------------------------------------------------- */

export async function saveLeadScore(score: LeadScore): Promise<LeadScore> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const version = score.scoreVersion ?? "v1";
  // Nur die is_current-Zeile der GLEICHEN Score-Version deaktivieren —
  // V1 und V2 laufen bewusst parallel.
  await sql`
    UPDATE sales_target_lead_scores
    SET is_current = FALSE
    WHERE target_id = ${score.targetId} AND score_version = ${version} AND is_current = TRUE
  `;
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_lead_scores (
      id, target_id, calculated_at, config_key, weights, breakdown, total_score,
      priority_class, need_score, opportunity_score, website_score, software_opportunity_score,
      commercial_capacity_score, reachability_score, decision_maker_score,
      data_confidence_score, capacity_class, capacity_confidence,
      estimated_budget_min_cents, estimated_budget_max_cents, currency, is_current,
      score_version, propensity_score, contactability_score, dm_relevance_score,
      evidence_confidence, matrix_priority, explainability,
      rule_config_version_id, scoring_config_version_id, feature_snapshot
    ) VALUES (
      ${score.id}, ${score.targetId}, ${score.calculatedAt}, ${score.configKey},
      ${sql.json(jsonParam(score.weights))},
      ${sql.json(jsonParam(score.breakdown))},
      ${score.totalScore}, ${score.priorityClass},
      ${score.needScore}, ${score.opportunityScore}, ${score.websiteScore},
      ${score.softwareOpportunityScore}, ${score.commercialCapacityScore},
      ${score.reachabilityScore}, ${score.decisionMakerScore}, ${score.dataConfidenceScore},
      ${score.capacityClass}, ${score.capacityConfidence},
      ${score.estimatedBudgetMinCents}, ${score.estimatedBudgetMaxCents},
      ${score.currency}, TRUE,
      ${version},
      ${score.propensityScore ?? null},
      ${score.contactabilityScore ?? null},
      ${score.dmRelevanceScore ?? null},
      ${score.evidenceConfidence ?? null},
      ${score.matrixPriority ?? null},
      ${sql.json(jsonParam(score.explainability ?? []))},
      ${score.ruleConfigVersionId ?? null},
      ${score.scoringConfigVersionId ?? null},
      ${sql.json(jsonParam(score.featureSnapshot ?? {}))}
    )
    RETURNING *
  `;
  return {
    ...score,
    isCurrent: true,
    calculatedAt: asIsoRequired(rows[0].calculated_at),
  };
}

export async function saveSalesBrief(brief: SalesBrief): Promise<SalesBrief> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_target_sales_briefs SET is_current = FALSE WHERE target_id = ${brief.targetId} AND is_current = TRUE`;
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_sales_briefs (
      id, target_id, generated_at, generated_by, headline, business_summary,
      main_opportunity, opportunity_reason, recommended_entry, sales_angle, why_now,
      recommended_action, recommended_time, decision_maker_id,
      project_value_min_cents, project_value_max_cents,
      capacity_class, capacity_confidence, confidence, structured, is_current,
      rule_config_version_id, scoring_config_version_id
    ) VALUES (
      ${brief.id}, ${brief.targetId}, ${brief.generatedAt}, ${brief.generatedBy},
      ${brief.headline}, ${brief.businessSummary}, ${brief.mainOpportunity},
      ${brief.opportunityReason}, ${brief.recommendedEntry}, ${brief.salesAngle},
      ${brief.whyNow},
      ${brief.recommendedAction}, ${brief.recommendedTime}, ${brief.decisionMakerId},
      ${brief.projectValueMinCents}, ${brief.projectValueMaxCents},
      ${brief.capacityClass}, ${brief.capacityConfidence}, ${brief.confidence},
      ${sql.json(jsonParam(brief.structured))}, TRUE,
      ${brief.ruleConfigVersionId ?? null}, ${brief.scoringConfigVersionId ?? null}
    )
    RETURNING *
  `;
  return { ...brief, isCurrent: true, generatedAt: asIsoRequired(rows[0].generated_at) };
}

export async function getCurrentLeadScore(
  targetId: string,
  scoreVersion: "v1" | "v2" = "v2"
): Promise<LeadScore | null> {
  const sql = await db();
  if (!sql) return null;
  // Bevorzuge angeforderte Version; wenn nicht vorhanden, fallback auf die
  // jeweils andere.
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_lead_scores
    WHERE target_id = ${targetId} AND is_current = TRUE
    ORDER BY (score_version = ${scoreVersion}) DESC, calculated_at DESC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const row = rows[0];
  return mapLeadScoreRow(row);
}

function mapLeadScoreRow(row: Record<string, unknown>): LeadScore {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    calculatedAt: asIsoRequired(row.calculated_at),
    configKey: (row.config_key as string) ?? "default",
    weights: (row.weights as LeadScore["weights"]) ?? ({} as LeadScore["weights"]),
    breakdown: (row.breakdown as LeadScore["breakdown"]) ?? [],
    totalScore: Number(row.total_score),
    priorityClass: (row.priority_class as LeadScore["priorityClass"]) ?? "D",
    needScore: numOrNull(row.need_score),
    opportunityScore: numOrNull(row.opportunity_score),
    websiteScore: numOrNull(row.website_score),
    softwareOpportunityScore: numOrNull(row.software_opportunity_score),
    commercialCapacityScore: numOrNull(row.commercial_capacity_score),
    reachabilityScore: numOrNull(row.reachability_score),
    decisionMakerScore: numOrNull(row.decision_maker_score),
    dataConfidenceScore: numOrNull(row.data_confidence_score),
    capacityClass: (row.capacity_class as LeadScore["capacityClass"]) ?? null,
    capacityConfidence: numOrNull(row.capacity_confidence),
    estimatedBudgetMinCents: bigOrNull(row.estimated_budget_min_cents),
    estimatedBudgetMaxCents: bigOrNull(row.estimated_budget_max_cents),
    currency: (row.currency as string) ?? "EUR",
    isCurrent: true,
    scoreVersion: ((row.score_version as string) ?? "v1") as "v1" | "v2",
    propensityScore: numOrNull(row.propensity_score),
    contactabilityScore: numOrNull(row.contactability_score),
    dmRelevanceScore: numOrNull(row.dm_relevance_score),
    evidenceConfidence: numOrNull(row.evidence_confidence),
    matrixPriority: (row.matrix_priority as string | null) ?? null,
    explainability: (row.explainability as LeadScore["explainability"]) ?? [],
    ruleConfigVersionId: (row.rule_config_version_id as string | null) ?? null,
    scoringConfigVersionId: (row.scoring_config_version_id as string | null) ?? null,
    featureSnapshot: (row.feature_snapshot as Record<string, unknown>) ?? {},
  };
}

export async function getCurrentSalesBrief(targetId: string): Promise<SalesBrief | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_sales_briefs WHERE target_id = ${targetId} AND is_current = TRUE LIMIT 1
  `;
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    generatedAt: asIsoRequired(row.generated_at),
    generatedBy: (row.generated_by as SalesBrief["generatedBy"]) ?? "rule",
    headline: (row.headline as string) ?? "",
    businessSummary: (row.business_summary as string | null) ?? null,
    mainOpportunity: (row.main_opportunity as string | null) ?? null,
    opportunityReason: (row.opportunity_reason as string | null) ?? null,
    recommendedEntry: (row.recommended_entry as string | null) ?? null,
    salesAngle: (row.sales_angle as string | null) ?? null,
    whyNow: (row.why_now as string | null) ?? null,
    recommendedAction: (row.recommended_action as SalesBrief["recommendedAction"]) ?? "CALL_NOW",
    recommendedTime: (row.recommended_time as string | null) ?? null,
    decisionMakerId: (row.decision_maker_id as string | null) ?? null,
    projectValueMinCents: bigOrNull(row.project_value_min_cents),
    projectValueMaxCents: bigOrNull(row.project_value_max_cents),
    capacityClass: (row.capacity_class as SalesBrief["capacityClass"]) ?? null,
    capacityConfidence: numOrNull(row.capacity_confidence),
    confidence: Number(row.confidence),
    structured: (row.structured as Record<string, unknown>) ?? {},
    isCurrent: true,
  };
}

/* -------------------------------------------------------------------------- */
/*  Search Jobs                                                                */
/* -------------------------------------------------------------------------- */

export interface CreateSearchJobInput {
  label?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string;
  centerLat?: number | null;
  centerLng?: number | null;
  radiusKm?: number;
  industries?: string[];
  categories?: string[];
  filters?: SearchJob["filters"];
  depth?: SearchJob["depth"];
  limitCount?: number;
  providerPreferences?: Record<string, unknown>;
  createdBy?: string | null;
  /** Verknüpft den Job mit einem Katalog-/Area-Run. */
  areaScanId?: string | null;
}

export async function createSearchJob(input: CreateSearchJobInput): Promise<SearchJob> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newTargetId("sj");
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_search_jobs (
      id, label, city, region, country, center_lat, center_lng, radius_km,
      industries, categories, filters, depth, limit_count, provider_preferences,
      status, created_by, area_scan_id
    ) VALUES (
      ${id}, ${input.label ?? null}, ${input.city ?? null}, ${input.region ?? null},
      ${input.country ?? "DE"}, ${input.centerLat ?? null}, ${input.centerLng ?? null},
      ${input.radiusKm ?? 25},
      ${input.industries ?? []}, ${input.categories ?? []},
      ${sql.json(jsonParam(input.filters ?? {}))},
      ${input.depth ?? "STANDARD"}, ${input.limitCount ?? 100},
      ${sql.json(jsonParam(input.providerPreferences ?? {}))},
      'queued', ${input.createdBy ?? null}, ${input.areaScanId ?? null}
    )
    RETURNING *
  `;
  return mapSearchJob(rows[0]);
}

export async function updateSearchJob(id: string, patch: Partial<SearchJob>): Promise<SearchJob> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql<Record<string, unknown>[]>`
    UPDATE sales_target_search_jobs
    SET status = COALESCE(${patch.status ?? null}, status),
        started_at = COALESCE(${patch.startedAt ?? null}, started_at),
        finished_at = COALESCE(${patch.finishedAt ?? null}, finished_at),
        error = ${patch.error === undefined ? sql`error` : patch.error},
        estimated_cost_cents = COALESCE(${patch.estimatedCostCents ?? null}::bigint, estimated_cost_cents),
        actual_cost_cents = COALESCE(${patch.actualCostCents ?? null}::bigint, actual_cost_cents),
        discovered_count = COALESCE(${patch.discoveredCount ?? null}, discovered_count),
        enriched_count = COALESCE(${patch.enrichedCount ?? null}, enriched_count)
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) throw new SalesError("Search-Job nicht gefunden", "not_found", 404);
  return mapSearchJob(rows[0]);
}

export async function listSearchJobs(limit = 30): Promise<SearchJob[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_search_jobs ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(mapSearchJob);
}

/* -------------------------------------------------------------------------- */
/*  Search-Job-Queue (Lease-Semantik, identisch zu takeNextEnrichmentJob)      */
/* -------------------------------------------------------------------------- */

/** Wie lange ein geleaster Job als „in Arbeit" gilt, bevor er zurückfällt. */
const SEARCH_LEASE_MS = 5 * 60_000;

/**
 * Gibt Jobs frei, deren Lease abgelaufen ist. Notwendig, weil eine
 * Serverless-Funktion jederzeit hart beendet werden kann — ohne das
 * hier bleiben solche Jobs für immer in `running` hängen (genau das
 * Symptom, das die Discovery zuvor blockiert hat).
 */
export async function reclaimExpiredSearchJobs(): Promise<number> {
  const sql = await db();
  if (!sql) return 0;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_search_jobs
       SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END,
           error = COALESCE(error, 'Lease abgelaufen — Job wurde erneut eingereiht'),
           lease_expires_at = NULL,
           lease_owner = NULL,
           lease_token = NULL,
           heartbeat_at = NULL,
           dead_lettered_at = CASE WHEN attempts >= max_attempts THEN NOW() ELSE dead_lettered_at END,
           last_error_code = 'LEASE_EXPIRED',
           next_attempt_at = NOW(),
           updated_at = NOW()
     WHERE status = 'running'
       AND lease_expires_at IS NOT NULL
       AND lease_expires_at < NOW()
    RETURNING id
  `;
  return rows.length;
}

/**
 * Leased den nächsten fälligen Search-Job. `FOR UPDATE SKIP LOCKED`
 * erlaubt mehrere parallele Worker ohne Doppelverarbeitung — dasselbe
 * Muster wie `takeNextEnrichmentJob`.
 */
export async function takeNextSearchJob(opts?: {
  areaScanId?: string | null;
  workerId?: string;
}): Promise<SearchJob | null> {
  const sql = await db();
  if (!sql) return null;
  const areaScanId = opts?.areaScanId ?? null;
  const leaseUntil = new Date(Date.now() + SEARCH_LEASE_MS).toISOString();
  const leaseToken = crypto.randomUUID();
  const rows = await sql<Record<string, unknown>[]>`
    UPDATE sales_target_search_jobs
       SET status = 'running',
           started_at = COALESCE(started_at, NOW()),
           attempts = attempts + 1,
           lease_expires_at = ${leaseUntil},
           lease_owner = ${opts?.workerId ?? "anonymous-worker"},
           lease_token = ${leaseToken},
           leased_at = NOW(),
           heartbeat_at = NOW(),
           updated_at = NOW()
     WHERE id = (
       SELECT id FROM sales_target_search_jobs
        WHERE status = 'queued'
          AND next_attempt_at <= NOW()
          AND (${areaScanId}::text IS NULL OR area_scan_id = ${areaScanId})
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
     )
    RETURNING *
  `;
  return rows[0] ? mapSearchJob(rows[0]) : null;
}

/** Erfolgreicher Abschluss — Lease freigeben. */
export async function completeSearchJob(
  id: string,
  patch: { discoveredCount?: number; actualCostCents?: number; error?: string | null },
  leaseToken?: string | null,
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_search_jobs
       SET status = 'completed',
           finished_at = NOW(),
           lease_expires_at = NULL,
           lease_owner = NULL,
           lease_token = NULL,
           heartbeat_at = NULL,
           discovered_count = COALESCE(${patch.discoveredCount ?? null}, discovered_count),
           actual_cost_cents = COALESCE(${patch.actualCostCents ?? null}::bigint, actual_cost_cents),
           error = ${patch.error ?? null}
     WHERE id = ${id} AND status = 'running'
       AND (${leaseToken ?? null}::text IS NULL OR lease_token = ${leaseToken ?? null})
    RETURNING id
  `;
  return rows.length === 1;
}

/**
 * Fehlschlag mit Backoff. Unterhalb von `max_attempts` wandert der Job
 * mit exponentiell wachsender Wartezeit zurück in die Queue, danach
 * endgültig auf `failed`.
 */
export async function failSearchJob(id: string, error: string, leaseToken?: string | null): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_search_jobs
       SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END,
           error = ${error.slice(0, 1000)},
           lease_expires_at = NULL,
           lease_owner = NULL,
           lease_token = NULL,
           heartbeat_at = NULL,
           dead_lettered_at = CASE WHEN attempts >= max_attempts THEN NOW() ELSE dead_lettered_at END,
           finished_at = CASE WHEN attempts >= max_attempts THEN NOW() ELSE finished_at END,
           next_attempt_at = NOW() + (INTERVAL '30 seconds' * POWER(2, LEAST(attempts, 5)))
     WHERE id = ${id} AND status = 'running'
       AND (${leaseToken ?? null}::text IS NULL OR lease_token = ${leaseToken ?? null})
    RETURNING id
  `;
  return rows.length === 1;
}

/**
 * Legt ein Segment unbenutzt zurück in die Queue.
 *
 * Gedacht für den Fall, dass der Provider gerade keinen Slot vergibt: das
 * Segment selbst ist einwandfrei, es kam nur nicht an die Reihe. Deshalb
 * wird der Versuchszähler wieder zurückgenommen — sonst wäre eine
 * Drosselungsphase nach `max_attempts` Ticks in der Lage, sämtliche
 * Segmente endgültig auf `failed` zu setzen, obwohl nie eine Abfrage lief.
 *
 * `retryAfterSeconds` stammt aus der Slot-Auskunft des Providers, damit der
 * nächste Zugriff nicht erneut in dieselbe Sperre läuft.
 */
export async function requeueSearchJob(
  id: string,
  reason: string,
  retryAfterSeconds: number,
  leaseToken?: string | null,
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const delay = Math.max(5, Math.min(900, Math.round(retryAfterSeconds)));
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_search_jobs
       SET status = 'queued',
           attempts = GREATEST(0, attempts - 1),
           error = ${reason.slice(0, 1000)},
           lease_expires_at = NULL,
           lease_owner = NULL,
           lease_token = NULL,
           heartbeat_at = NULL,
           next_attempt_at = NOW() + (${delay}::int * INTERVAL '1 second')
     WHERE id = ${id} AND status = 'running'
       AND (${leaseToken ?? null}::text IS NULL OR lease_token = ${leaseToken ?? null})
    RETURNING id
  `;
  return rows.length === 1;
}

/**
 * Stellt gescheiterte Segmente eines Runs wieder in die Queue und setzt
 * ihren Versuchszähler zurück. Wird beim Resume aufgerufen.
 */
export async function resetFailedSearchJobs(areaScanId: string): Promise<number> {
  const sql = await db();
  if (!sql) return 0;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_search_jobs
       SET status = 'queued',
           attempts = 0,
           next_attempt_at = NOW(),
           lease_expires_at = NULL,
           finished_at = NULL
     WHERE area_scan_id = ${areaScanId}
       AND status = 'failed'
    RETURNING id
  `;
  return rows.length;
}

/** Fortschritt eines Katalog-Runs aus den zugehörigen Jobs. */
export async function searchJobProgress(areaScanId: string): Promise<{
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  discovered: number;
}> {
  const sql = await db();
  if (!sql) return { total: 0, queued: 0, running: 0, completed: 0, failed: 0, discovered: 0 };
  const rows = await sql<Record<string, unknown>[]>`
    SELECT
      COUNT(*)::int                                              AS total,
      COUNT(*) FILTER (WHERE status = 'queued')::int             AS queued,
      COUNT(*) FILTER (WHERE status = 'running')::int            AS running,
      COUNT(*) FILTER (WHERE status = 'completed')::int          AS completed,
      COUNT(*) FILTER (WHERE status = 'failed')::int             AS failed,
      COALESCE(SUM(discovered_count), 0)::int                    AS discovered
    FROM sales_target_search_jobs
    WHERE area_scan_id = ${areaScanId}
  `;
  const r = rows[0] ?? {};
  return {
    total: Number(r.total ?? 0),
    queued: Number(r.queued ?? 0),
    running: Number(r.running ?? 0),
    completed: Number(r.completed ?? 0),
    failed: Number(r.failed ?? 0),
    discovered: Number(r.discovered ?? 0),
  };
}

export async function getSearchJob(id: string): Promise<SearchJob | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_search_jobs WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapSearchJob(rows[0]) : null;
}

function mapSearchJob(row: Record<string, unknown>): SearchJob {
  return {
    id: row.id as string,
    label: (row.label as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    country: (row.country as string) ?? "DE",
    centerLat: numOrNull(row.center_lat),
    centerLng: numOrNull(row.center_lng),
    radiusKm: Number(row.radius_km),
    industries: (row.industries as string[]) ?? [],
    categories: (row.categories as string[]) ?? [],
    filters: asJsonObject<SearchJob["filters"]>(row.filters),
    depth: (row.depth as SearchJob["depth"]) ?? "STANDARD",
    limitCount: Number(row.limit_count),
    providerPreferences: asJsonObject<Record<string, unknown>>(row.provider_preferences),
    status: (row.status as SearchJob["status"]) ?? "queued",
    estimatedCostCents: Number(row.estimated_cost_cents ?? 0),
    actualCostCents: Number(row.actual_cost_cents ?? 0),
    discoveredCount: Number(row.discovered_count ?? 0),
    enrichedCount: Number(row.enriched_count ?? 0),
    error: (row.error as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: asIsoRequired(row.created_at),
    startedAt: asIso(row.started_at),
    finishedAt: asIso(row.finished_at),
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 3),
    nextAttemptAt: asIso(row.next_attempt_at),
    leaseExpiresAt: asIso(row.lease_expires_at),
    workerToken: (row.lease_token as string | null) ?? null,
    heartbeatAt: asIso(row.heartbeat_at),
    idempotencyKey: (row.idempotency_key as string | null) ?? null,
    areaScanId: (row.area_scan_id as string | null) ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Enrichment Jobs                                                            */
/* -------------------------------------------------------------------------- */

export async function enqueueEnrichment(
  targetId: string,
  phase: EnrichmentPhase,
  options: {
    priority?: number;
    payload?: Record<string, unknown>;
    delaySeconds?: number;
    idempotencyKey?: string;
  } = {}
): Promise<EnrichmentJob> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const nextAttempt = options.delaySeconds
    ? new Date(Date.now() + options.delaySeconds * 1000).toISOString()
    : new Date().toISOString();
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_enrichment_jobs (
      id, target_id, phase, status, priority, attempts, max_attempts,
      next_attempt_at, payload, idempotency_key
    ) VALUES (
      ${newTargetId("ej")}, ${targetId}, ${phase}, 'queued',
      ${options.priority ?? 100}, 0, 3, ${nextAttempt},
      ${sql.json(jsonParam(options.payload ?? {}))}, ${options.idempotencyKey ?? null}
    )
    ON CONFLICT (target_id, phase) WHERE status IN ('queued','running')
    DO UPDATE SET
      priority = LEAST(sales_target_enrichment_jobs.priority, EXCLUDED.priority),
      next_attempt_at = LEAST(sales_target_enrichment_jobs.next_attempt_at, EXCLUDED.next_attempt_at),
      updated_at = NOW()
    RETURNING *
  `;
  return mapEnrichmentJob(rows[0]);
}

const ENRICHMENT_LEASE_MS = 2 * 60_000;

export async function reclaimExpiredEnrichmentJobs(): Promise<number> {
  const sql = await db();
  if (!sql) return 0;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_enrichment_jobs
    SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END,
        dead_lettered_at = CASE WHEN attempts >= max_attempts THEN NOW() ELSE dead_lettered_at END,
        lease_owner = NULL,
        lease_token = NULL,
        lease_expires_at = NULL,
        heartbeat_at = NULL,
        next_attempt_at = CASE
          WHEN attempts >= max_attempts THEN next_attempt_at
          ELSE NOW() + (INTERVAL '15 seconds' * POWER(2, LEAST(attempts, 8)))
        END,
        last_error_code = 'LEASE_EXPIRED',
        error = 'Worker lease expired',
        updated_at = NOW()
    WHERE status = 'running' AND lease_expires_at < NOW()
    RETURNING id
  `;
  return rows.length;
}

export async function takeNextEnrichmentJob(
  options: { workerId?: string; leaseMs?: number } = {},
): Promise<EnrichmentJob | null> {
  const sql = await db();
  if (!sql) return null;
  const leaseToken = crypto.randomUUID();
  const leaseExpiresAt = new Date(Date.now() + (options.leaseMs ?? ENRICHMENT_LEASE_MS)).toISOString();
  const rows = await sql<Record<string, unknown>[]>`
    UPDATE sales_target_enrichment_jobs
    SET status = 'running',
        started_at = COALESCE(started_at, NOW()),
        attempts = attempts + 1,
        lease_owner = ${options.workerId ?? "anonymous-worker"},
        lease_token = ${leaseToken},
        leased_at = NOW(),
        heartbeat_at = NOW(),
        lease_expires_at = ${leaseExpiresAt},
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM sales_target_enrichment_jobs
      WHERE status = 'queued' AND next_attempt_at <= NOW()
      ORDER BY priority ASC, created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `;
  return rows[0] ? mapEnrichmentJob(rows[0]) : null;
}

export async function completeEnrichmentJob(id: string, leaseToken?: string | null): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_enrichment_jobs
    SET status = 'done', finished_at = NOW(), lease_owner = NULL,
        lease_token = NULL, lease_expires_at = NULL, heartbeat_at = NULL, updated_at = NOW()
    WHERE id = ${id}
      AND status = 'running'
      AND (${leaseToken ?? null}::text IS NULL OR lease_token = ${leaseToken ?? null})
    RETURNING id
  `;
  return rows.length === 1;
}

export async function failEnrichmentJob(
  id: string,
  error: string,
  leaseToken?: string | null,
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_enrichment_jobs
    SET status = CASE
          WHEN attempts >= max_attempts THEN 'failed'
          ELSE 'queued'
        END,
        next_attempt_at = CASE
          WHEN attempts >= max_attempts THEN next_attempt_at
          ELSE NOW() + (INTERVAL '30 seconds' * POWER(2, attempts))
        END,
        error = ${error},
        dead_lettered_at = CASE WHEN attempts >= max_attempts THEN NOW() ELSE dead_lettered_at END,
        lease_owner = NULL,
        lease_token = NULL,
        lease_expires_at = NULL,
        heartbeat_at = NULL,
        updated_at = NOW()
    WHERE id = ${id}
      AND status = 'running'
      AND (${leaseToken ?? null}::text IS NULL OR lease_token = ${leaseToken ?? null})
    RETURNING id
  `;
  return rows.length === 1;
}

export async function replayDeadLetterEnrichmentJob(
  id: string,
  actorId?: string | null,
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_enrichment_jobs
    SET status = 'queued',
        attempts = 0,
        next_attempt_at = NOW(),
        started_at = NULL,
        finished_at = NULL,
        error = NULL,
        dead_lettered_at = NULL,
        last_error_code = NULL,
        lease_owner = NULL,
        lease_token = NULL,
        lease_expires_at = NULL,
        heartbeat_at = NULL,
        replay_count = replay_count + 1,
        last_replayed_at = NOW(),
        last_replayed_by = ${actorId ?? null},
        updated_at = NOW()
    WHERE id = ${id}
      AND status = 'failed'
      AND dead_lettered_at IS NOT NULL
    RETURNING id
  `;
  return rows.length === 1;
}

export async function heartbeatEnrichmentJob(
  id: string,
  leaseToken: string,
  extendMs = ENRICHMENT_LEASE_MS,
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_enrichment_jobs
    SET heartbeat_at = NOW(),
        lease_expires_at = ${new Date(Date.now() + extendMs).toISOString()},
        updated_at = NOW()
    WHERE id = ${id} AND status = 'running' AND lease_token = ${leaseToken}
    RETURNING id
  `;
  return rows.length === 1;
}

function mapEnrichmentJob(row: Record<string, unknown>): EnrichmentJob {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    phase: row.phase as EnrichmentJob["phase"],
    status: row.status as JobStatus,
    priority: Number(row.priority),
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    nextAttemptAt: asIsoRequired(row.next_attempt_at),
    startedAt: asIso(row.started_at),
    finishedAt: asIso(row.finished_at),
    error: (row.error as string | null) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    actualCostCents: Number(row.actual_cost_cents ?? 0),
    leaseExpiresAt: asIso(row.lease_expires_at),
    workerToken: (row.lease_token as string | null) ?? null,
    heartbeatAt: asIso(row.heartbeat_at),
    idempotencyKey: (row.idempotency_key as string | null) ?? null,
    createdAt: asIsoRequired(row.created_at),
    updatedAt: asIsoRequired(row.updated_at),
  };
}

/* -------------------------------------------------------------------------- */
/*  Activities                                                                 */
/* -------------------------------------------------------------------------- */

export async function recordActivity(input: {
  targetId: string;
  kind: string;
  summary: string;
  payload?: Record<string, unknown>;
  actorId?: string | null;
  actorEmail?: string | null;
}): Promise<TargetActivity> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_activities (
      id, target_id, kind, summary, payload, actor_id, actor_email
    ) VALUES (
      ${newTargetId("ta")}, ${input.targetId}, ${input.kind}, ${input.summary},
      ${sql.json(jsonParam(input.payload ?? {}))},
      ${input.actorId ?? null}, ${input.actorEmail ?? null}
    )
    RETURNING *
  `;
  return {
    id: rows[0].id as string,
    targetId: rows[0].target_id as string,
    kind: rows[0].kind as string,
    summary: rows[0].summary as string,
    payload: (rows[0].payload as Record<string, unknown>) ?? {},
    actorId: (rows[0].actor_id as string | null) ?? null,
    actorEmail: (rows[0].actor_email as string | null) ?? null,
    occurredAt: asIsoRequired(rows[0].occurred_at),
  };
}

export async function listActivities(targetId: string, limit = 50): Promise<TargetActivity[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_activities WHERE target_id = ${targetId}
    ORDER BY occurred_at DESC LIMIT ${limit}
  `;
  return rows.map((row) => ({
    id: row.id as string,
    targetId: row.target_id as string,
    kind: row.kind as string,
    summary: row.summary as string,
    payload: (row.payload as Record<string, unknown>) ?? {},
    actorId: (row.actor_id as string | null) ?? null,
    actorEmail: (row.actor_email as string | null) ?? null,
    occurredAt: asIsoRequired(row.occurred_at),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Watchlist                                                                  */
/* -------------------------------------------------------------------------- */

export async function addWatchlist(input: {
  targetId: string;
  userId: string;
  criteria?: Record<string, unknown>;
  note?: string;
}): Promise<WatchlistEntry> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_watchlist (
      id, target_id, user_id, criteria, note
    ) VALUES (
      ${newTargetId("wl")}, ${input.targetId}, ${input.userId},
      ${sql.json(jsonParam(input.criteria ?? {}))}, ${input.note ?? ""}
    )
    ON CONFLICT (target_id, user_id) DO UPDATE
      SET criteria = EXCLUDED.criteria, note = EXCLUDED.note
    RETURNING *
  `;
  return {
    id: rows[0].id as string,
    targetId: rows[0].target_id as string,
    userId: rows[0].user_id as string,
    addedAt: asIsoRequired(rows[0].added_at),
    lastCheckAt: asIso(rows[0].last_check_at),
    criteria: (rows[0].criteria as Record<string, unknown>) ?? {},
    note: (rows[0].note as string) ?? "",
  };
}

export async function removeWatchlist(targetId: string, userId: string): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`DELETE FROM sales_target_watchlist WHERE target_id = ${targetId} AND user_id = ${userId}`;
}

export async function listWatchlistForUser(userId: string): Promise<WatchlistEntry[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_watchlist WHERE user_id = ${userId} ORDER BY added_at DESC
  `;
  return rows.map((row) => ({
    id: row.id as string,
    targetId: row.target_id as string,
    userId: row.user_id as string,
    addedAt: asIsoRequired(row.added_at),
    lastCheckAt: asIso(row.last_check_at),
    criteria: (row.criteria as Record<string, unknown>) ?? {},
    note: (row.note as string) ?? "",
  }));
}

/* -------------------------------------------------------------------------- */
/*  Scoring Config                                                             */
/* -------------------------------------------------------------------------- */

export async function getActiveScoringConfig(): Promise<ScoringConfig | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_scoring_config WHERE is_active = TRUE ORDER BY key = 'default' DESC LIMIT 1
  `;
  return rows[0] ? mapScoringConfig(rows[0]) : null;
}

export async function upsertScoringConfig(config: {
  key: string;
  label: string;
  weights: ScoringConfig["weights"];
  thresholdAPlusPlus?: number;
  thresholdAPlus?: number;
  thresholdA?: number;
  thresholdB?: number;
  thresholdC?: number;
  projectValueTiers?: ScoringConfig["projectValueTiers"];
  isActive?: boolean;
  updatedBy?: string | null;
}): Promise<ScoringConfig> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_scoring_config (
      key, label, weights, threshold_a_plus_plus, threshold_a_plus, threshold_a, threshold_b, threshold_c,
      project_value_tiers, is_active, updated_by
    ) VALUES (
      ${config.key}, ${config.label},
      ${sql.json(jsonParam(config.weights))},
      ${config.thresholdAPlusPlus ?? 92},
      ${config.thresholdAPlus ?? 85}, ${config.thresholdA ?? 70},
      ${config.thresholdB ?? 55}, ${config.thresholdC ?? 40},
      ${sql.json(jsonParam(config.projectValueTiers ?? {}))},
      ${config.isActive ?? true},
      ${config.updatedBy ?? null}
    )
    ON CONFLICT (key) DO UPDATE SET
      label = EXCLUDED.label,
      weights = EXCLUDED.weights,
      threshold_a_plus_plus = EXCLUDED.threshold_a_plus_plus,
      threshold_a_plus = EXCLUDED.threshold_a_plus,
      threshold_a = EXCLUDED.threshold_a,
      threshold_b = EXCLUDED.threshold_b,
      threshold_c = EXCLUDED.threshold_c,
      project_value_tiers = EXCLUDED.project_value_tiers,
      is_active = EXCLUDED.is_active,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *
  `;
  return mapScoringConfig(rows[0]);
}

function mapScoringConfig(row: Record<string, unknown>): ScoringConfig {
  return {
    key: row.key as string,
    label: row.label as string,
    weights: asJsonObject<ScoringConfig["weights"]>(row.weights),
    thresholdAPlusPlus: Number(row.threshold_a_plus_plus ?? 92),
    thresholdAPlus: Number(row.threshold_a_plus),
    thresholdA: Number(row.threshold_a),
    thresholdB: Number(row.threshold_b),
    thresholdC: Number(row.threshold_c),
    projectValueTiers: asJsonObject<ScoringConfig["projectValueTiers"]>(row.project_value_tiers),
    isActive: Boolean(row.is_active),
    updatedAt: asIsoRequired(row.updated_at),
  };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function bigOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return Number(v);
  if (typeof v === "number") return v;
  return null;
}

function asIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return null;
}

function asIsoRequired(v: unknown): string {
  return asIso(v) ?? new Date(0).toISOString();
}

/**
 * Liest eine jsonb-Spalte robust als Objekt.
 *
 * Ältere Zeilen wurden mit `${JSON.stringify(x)}::jsonb` geschrieben und
 * enthalten dadurch einen JSON-String statt eines JSON-Objekts. Ohne
 * diese Entpackung kämen solche Werte als Zeichenkette zurück und jeder
 * Feldzugriff liefe ins Leere.
 */
function asJsonObject<T>(v: unknown): T {
  if (v && typeof v === "object") return v as T;
  if (typeof v === "string" && v.length > 0) {
    try {
      const parsed = JSON.parse(v) as unknown;
      if (parsed && typeof parsed === "object") return parsed as T;
    } catch {
      /* keine gültige JSON-Zeichenkette — als leer behandeln */
    }
  }
  return {} as T;
}
