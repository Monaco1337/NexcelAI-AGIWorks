import { safeFetch } from "../security/safeFetch";
import type {
  DiscoveredCompanyStub,
  DiscoveryProvider,
  DiscoveryRequest,
  DiscoveryResponse,
} from "./types";
import type { ProviderMetadata } from "../contracts/provider";

const ENDPOINT = "https://query.wikidata.org/sparql";
const MAX_LIMIT = 100;
const AXIS_INDUSTRY_PATTERN: Record<string, string> = {
  immobilien: "real estate|property|immobilien",
  beauty: "beauty|cosmetic|hairdress|friseur|kosmetik",
  fitness: "fitness|sport|gym|health club|dance|tanz",
  bildung: "education|school|training|bildung|schule|ausbildung",
  shop: "retail|commerce|einzelhandel|handel",
  craft: "craft|construction|trade|handwerk|bau",
  healthcare: "health|medical|care|gesundheit|medizin|pflege",
  tourism: "tourism|hotel|hospitality|tourismus|hotellerie",
  industrial: "manufactur|industrial|industrie|produktion",
};

interface SparqlBinding {
  item?: { value?: string };
  itemLabel?: { value?: string };
  officialName?: { value?: string };
  coordinate?: { value?: string };
  website?: { value?: string };
  phone?: { value?: string };
  address?: { value?: string };
  postalCode?: { value?: string };
  locationLabel?: { value?: string };
  legalFormLabel?: { value?: string };
  industryLabel?: { value?: string };
}

interface SparqlResponse {
  results?: { bindings?: SparqlBinding[] };
}

export class WikidataProvider implements DiscoveryProvider {
  readonly key = "wikidata";
  readonly label = "Wikidata Query Service";
  readonly metadata: ProviderMetadata = {
    id: "wikidata",
    contractVersion: 1,
    displayName: "Wikidata Query Service",
    capabilities: ["DISCOVERY", "COMPANY_BASICS", "CONTACTS", "WEBSITE"],
    countries: ["DE"],
    secretNames: [],
    policy: {
      license: "CC0 1.0",
      attribution: "Wikidata contributors",
      retentionClass: "PERMITTED",
      maxRetentionDays: 365,
      permittedFields: [
        "name",
        "official_name",
        "coordinates",
        "website",
        "phone",
        "street_address",
        "postal_code",
        "administrative_location",
        "legal_form",
        "industry",
      ],
      storesRawPayload: false,
    },
  };

  isConfigured(): boolean {
    return process.env.WIKIDATA_DISCOVERY_ENABLED !== "false";
  }

  supports(request: DiscoveryRequest): boolean {
    return Boolean(
      request.bbox ||
        (Number.isFinite(request.centerLat) &&
          Number.isFinite(request.centerLng) &&
          Number.isFinite(request.radiusKm)),
    );
  }

  async discover(request: DiscoveryRequest): Promise<DiscoveryResponse> {
    if (!this.supports(request)) {
      return failed("WIKIDATA_UNSUPPORTED_GEOGRAPHY", "Wikidata requires a bbox or center/radius");
    }
    const started = Date.now();
    const query = buildQuery(request);
    const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
    const result = await safeFetch(url, {
      timeoutMs: 20_000,
      maxBytes: 2_000_000,
      maxRedirects: 1,
      userAgent: "NEXCEL-SalesIntel/1.0 (https://nexcel.ai)",
      allowedContentTypes: [
        "application/sparql-results+json",
        "application/json",
        "application/json-rdf",
      ],
    });
    if (!result.ok) {
      return {
        companies: [],
        estimatedCostCents: 0,
        actualCostCents: 0,
        providerLogs: [{
          provider: this.key,
          endpoint: ENDPOINT,
          ok: false,
          latencyMs: result.latencyMs,
          error: result.error ?? "WIKIDATA_FETCH_FAILED",
        }],
      };
    }

    let payload: SparqlResponse;
    try {
      payload = JSON.parse(result.bodyText) as SparqlResponse;
    } catch {
      return failed("WIKIDATA_INVALID_JSON", "Wikidata returned invalid JSON", result.status, result.latencyMs);
    }
    const fetchedAt = new Date().toISOString();
    const companies = (payload.results?.bindings ?? [])
      .map((binding) => toCompany(binding, fetchedAt))
      .filter((company): company is DiscoveredCompanyStub => company !== null)
      .slice(0, Math.min(request.limit, MAX_LIMIT));
    return {
      companies,
      estimatedCostCents: 0,
      actualCostCents: 0,
      providerLogs: [{
        provider: this.key,
        endpoint: ENDPOINT,
        ok: result.status >= 200 && result.status < 300,
        latencyMs: Date.now() - started,
      }],
    };
  }
}

function buildQuery(request: DiscoveryRequest): string {
  const limit = Math.max(1, Math.min(request.limit, MAX_LIMIT));
  const geoClause = request.bbox
    ? `
      SERVICE wikibase:box {
        ?item wdt:P625 ?coordinate.
        bd:serviceParam wikibase:cornerWest "Point(${request.bbox.west} ${request.bbox.south})"^^geo:wktLiteral.
        bd:serviceParam wikibase:cornerEast "Point(${request.bbox.east} ${request.bbox.north})"^^geo:wktLiteral.
      }`
    : `
      SERVICE wikibase:around {
        ?item wdt:P625 ?coordinate.
        bd:serviceParam wikibase:center "Point(${request.centerLng} ${request.centerLat})"^^geo:wktLiteral.
        bd:serviceParam wikibase:radius "${Math.min(request.radiusKm ?? 10, 20)}".
      }`;
  const pattern = request.tagAxis ? AXIS_INDUSTRY_PATTERN[request.tagAxis] : null;
  const industryClause = pattern
    ? `
      ?item wdt:P452 ?industry.
      ?industry rdfs:label ?industryFilterLabel.
      FILTER(LANG(?industryFilterLabel) IN ("de", "en"))
      FILTER(REGEX(STR(?industryFilterLabel), "${pattern}", "i"))`
    : "OPTIONAL { ?item wdt:P452 ?industry. }";
  return `
    SELECT DISTINCT ?item ?itemLabel ?officialName ?coordinate ?website ?phone
      ?address ?postalCode ?locationLabel ?legalFormLabel ?industryLabel WHERE {
      VALUES ?companyClass { wd:Q4830453 wd:Q6881511 }
      ?item wdt:P31/wdt:P279* ?companyClass.
      ${geoClause}
      ${industryClause}
      FILTER NOT EXISTS { ?item wdt:P576 ?dissolvedAt }
      OPTIONAL { ?item wdt:P1448 ?officialName. FILTER(LANG(?officialName) IN ("de", "en", "")) }
      OPTIONAL { ?item wdt:P856 ?website. }
      OPTIONAL { ?item wdt:P1329 ?phone. }
      OPTIONAL { ?item wdt:P6375 ?address. FILTER(LANG(?address) IN ("de", "en", "")) }
      OPTIONAL { ?item wdt:P281 ?postalCode. }
      OPTIONAL { ?item wdt:P131 ?location. }
      OPTIONAL { ?item wdt:P1454 ?legalForm. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
    }
    LIMIT ${limit}
  `;
}

function toCompany(binding: SparqlBinding, fetchedAt: string): DiscoveredCompanyStub | null {
  const entityUrl = binding.item?.value;
  const name = binding.officialName?.value ?? binding.itemLabel?.value;
  const coordinates = parsePoint(binding.coordinate?.value);
  if (!entityUrl || !name || !coordinates) return null;
  const qid = entityUrl.split("/").pop() ?? entityUrl;
  if (!binding.officialName?.value && name === qid) return null;
  return {
    provider: "wikidata",
    providerVersion: "wdqs-2026-09",
    providerRawId: qid,
    observedAt: fetchedAt,
    fetchedAt,
    name,
    legalName: binding.officialName?.value ?? null,
    legalForm: binding.legalFormLabel?.value ?? null,
    industry: binding.industryLabel?.value ?? null,
    subIndustry: binding.industryLabel?.value ?? null,
    categoryRaw: binding.industryLabel?.value ?? null,
    categoryNormalized: binding.industryLabel?.value ?? null,
    addressLine: binding.address?.value ?? null,
    postalCode: binding.postalCode?.value ?? null,
    city: binding.locationLabel?.value ?? null,
    state: null,
    region: "NRW",
    country: "DE",
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    website: binding.website?.value ?? null,
    domain: domainFromUrl(binding.website?.value),
    phone: binding.phone?.value ?? null,
    email: null,
    employeeEstimateMin: null,
    employeeEstimateMax: null,
    googleRating: null,
    reviewCount: null,
    providerSourceUrl: entityUrl,
    socialUrls: [],
    rawPayloadReference: null,
    confidence: binding.officialName?.value ? 0.78 : 0.72,
    isChain: undefined,
  };
}

function parsePoint(value: string | undefined): { latitude: number; longitude: number } | null {
  const match = value?.match(/^Point\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)$/);
  if (!match) return null;
  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function domainFromUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function failed(code: string, error: string, _status: number | null = null, latencyMs = 0): DiscoveryResponse {
  return {
    companies: [],
    estimatedCostCents: 0,
    actualCostCents: 0,
    providerLogs: [{
      provider: "wikidata",
      endpoint: ENDPOINT,
      ok: false,
      latencyMs,
      error: `${code}: ${error}`,
    }],
  };
}
