/**
 * OpenStreetMap Overpass Discovery-Provider.
 *
 * Kostenfrei, keine Registrierung, reale DACH-Geschäftsdaten aus
 * OpenStreetMap. Perfekt als Fundament, wenn (noch) kein
 * `GOOGLE_PLACES_API_KEY` konfiguriert ist.
 *
 * Wir kombinieren die im UI gesetzten Branchen mit passenden OSM-Tags
 * (`shop`, `craft`, `office`, `amenity`, `healthcare`) und laden Nodes,
 * Ways und Relations mit `name` + `phone|website|contact:*` in einem
 * Kreis um `centerLat/centerLng`.
 *
 * Wichtig:
 *  - Overpass ist rate-limited (öffentlicher Endpoint). Wir verwenden
 *    eine kurze Timeout und einen konservativen Result-Cap.
 *  - Kein SSRF-Risiko: fester Host (`overpass-api.de`), keine
 *    externen Redirects.
 *  - Wir liefern nur Places mit einem Namen und mindestens einer
 *    Kontakt- oder Standort-Information.
 */

import type {
  DiscoveredCompanyStub,
  DiscoveryBBox,
  DiscoveryProvider,
  DiscoveryRequest,
  DiscoveryResponse,
} from "./types";
import type { ProviderMetadata } from "../contracts/provider";
import { normalizeCategoryFromTags } from "../categoryMap";
import { safeFetch } from "../security/safeFetch";

/**
 * Overpass-Endpoints, absteigend nach Vertrauenswürdigkeit.
 *
 * Zwei Lehren aus der Messung an einer NRW-Kachel (Achse `shop`):
 *
 *  - Ein Mirror muss den weltweiten Datenbestand führen.
 *    `overpass.osm.ch` stand ursprünglich in dieser Liste und war die
 *    Ursache stiller Leerläufe: die Instanz kennt nur Schweizer Daten
 *    und beantwortet eine NRW-Box in 93 ms mit HTTP 200 und null
 *    Elementen — für den Aufrufer nicht von „Region ohne Unternehmen"
 *    zu unterscheiden.
 *  - Ein toter Mirror kostet mehr, als er nützt.
 *    `overpass.kumi.systems` lieferte HTTP 504 nach 65 s,
 *    `overpass.private.coffee` HTTP 500. Beide hätten pro Segment das
 *    Zeitbudget aufgebraucht, ohne je Daten zu liefern; die Haupt-
 *    instanz antwortete dieselbe Anfrage in 7,9 s mit 12.000 Elementen.
 *
 * Über `OVERPASS_ENDPOINTS` lassen sich Mirrors ohne Code-Änderung
 * ergänzen, sobald wieder ein verlässlicher verfügbar ist.
 */
const OVERPASS_ENDPOINTS = (process.env.OVERPASS_ENDPOINTS ?? "https://overpass-api.de/api/interpreter")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Overpass akzeptiert einen Radius in Metern; Max ~50 km sinnvoll. */
const MAX_RADIUS_M = 50_000;
/** Server-seitiges Query-Budget (Overpass respektiert diesen Wert intern). */
const OVERPASS_TIMEOUT_S = 12;
/** Client-seitiger HTTP-Cutoff — muss > OVERPASS_TIMEOUT_S sein. */
const HTTP_TIMEOUT_MS = 18_000;

/**
 * bbox-Läufe dürfen länger rechnen als die interaktive Umkreissuche:
 * eine bbox-Query liefert Tausende Treffer und wird von einem
 * Hintergrund-Worker aufgerufen, nicht aus einem UI-Request. Gemessen
 * liegt eine Kachel je Achse bei wenigen Sekunden; die Grenze fängt nur
 * überlastete Mirrors ab.
 */
const BBOX_OVERPASS_TIMEOUT_S = 50;
const BBOX_HTTP_TIMEOUT_MS = 55_000;
/**
 * Harte Obergrenze über ALLE Mirror-Versuche hinweg. Ohne sie könnte
 * ein Segment bei drei toten Mirrors das Dreifache des Einzeltimeouts
 * verbrauchen und die Serverless-Laufzeitgrenze reißen.
 */
const BBOX_TOTAL_BUDGET_MS = 75_000;

/**
 * Die OSM-Tag-Achsen, entlang derer ein Katalog segmentiert wird.
 * Eine Achse pro Search-Job hält jede einzelne Overpass-Query klein
 * genug, um innerhalb des Worker-Zeitbudgets zurückzukommen.
 */
export const OVERPASS_TAG_AXES = [
  // Schwerpunktbranchen zuerst: sie sollen im Katalog stehen, bevor die
  // breiten Massenachsen das Zeitbudget verbrauchen.
  "immobilien",
  "beauty",
  "fitness",
  "bildung",
  "shop",
  "craft",
  "office",
  "amenity",
  "healthcare",
  "tourism",
  "leisure",
  "industrial",
] as const;

export type OverpassTagAxis = (typeof OVERPASS_TAG_AXES)[number];

/**
 * Nicht jeder Wert einer Achse ist ein Unternehmen. Für die breiten
 * Achsen filtern wir auf die geschäftlich relevanten Werte, damit keine
 * Parkbänke, Mülleimer oder Bushaltestellen im Vertriebskatalog landen.
 */
const AXIS_FILTER: Record<string, string | string[]> = {
  /* ── Fokusachsen ──────────────────────────────────────────────────
   * Immobilien, Beauty, Fitness und Bildung sind Schwerpunktbranchen,
   * liegen aber verstreut in den breiten Achsen `shop`, `office`,
   * `leisure` und `amenity`. Das ist ein Problem: eine breite Achse
   * stösst in dicht besiedelten Kacheln an das Ergebnislimit, und
   * Overpass liefert dann eine beliebige Teilmenge. Seltene Kategorien
   * verlieren dabei ueberproportional — in der Stichprobe Unna machen
   * Immobilien nur 0,8 % und Bildung 0,5 % aller Objekte aus. Genau so
   * sind die fehlenden Immobilienbetriebe in Unna entstanden.
   *
   * Eigene Achsen loesen das: die Abfrage ist so klein, dass sie das
   * Limit nie erreicht, und die Branche damit vollstaendig erfasst wird.
   * Die Ueberschneidung mit den breiten Achsen ist gewollt und
   * unschaedlich — die Fingerprint-Deduplizierung faengt sie ab.
   */
  immobilien: [
    '["office"~"^(estate_agent|property_management)$"]',
    '["shop"="estate_agent"]',
  ],
  beauty: [
    '["shop"~"^(hairdresser|beauty|nail_salon|nails|cosmetics|massage|tattoo|perfumery|herbalist)$"]',
    '["leisure"~"^(spa|sauna|tanning_salon)$"]',
    '["amenity"~"^(spa|public_bath)$"]',
    '["craft"~"^(beautician|cosmetics)$"]',
  ],
  /*
   * Bewusst ohne `leisure=pitch` und `leisure=swimming_pool`. Beide
   * klingen nach Fitness, sind es aber nicht: hinter `pitch` stecken in
   * NRW 56.254 Bolz-, Tennis- und Sportplätze, fast durchweg kommunale
   * Anlagen ohne Betreiber, hinter `swimming_pool` weitere 11.886
   * überwiegend private Gartenpools. Sie würden den Katalog mit
   * Objekten fluten, die niemand anrufen kann.
   */
  fitness: [
    '["leisure"~"^(fitness_centre|sports_centre|sports_hall|dance|horse_riding|golf_course|climbing|bowling_alley|yoga)$"]',
    '["shop"~"^(sports|fitness)$"]',
    '["amenity"~"^(gym|dojo)$"]',
  ],
  bildung: [
    '["amenity"~"^(school|college|university|driving_school|language_school|music_school|training|prep_school|research_institute|kindergarten)$"]',
    '["office"~"^(educational_institution|tutoring|research)$"]',
  ],

  /* ── Breite Achsen ────────────────────────────────────────────── */
  shop: '["shop"]',
  craft: '["craft"]',
  office: '["office"]',
  amenity:
    '["amenity"~"^(restaurant|cafe|bar|pub|fast_food|biergarten|food_court|ice_cream|pharmacy|doctors|dentist|clinic|veterinary|bank|bureau_de_change|car_rental|car_wash|car_repair|fuel|charging_station|driving_school|language_school|music_school|kindergarten|childcare|nightclub|cinema|theatre|coworking_space|internet_cafe|marketplace|funeral_directors)$"]',
  healthcare: '["healthcare"]',
  tourism: '["tourism"~"^(hotel|guest_house|hostel|motel|apartment|chalet|resort|camp_site|caravan_site)$"]',
  leisure: '["leisure"~"^(fitness_centre|sports_centre|dance|golf_course|swimming_pool|bowling_alley|escape_game|adult_gaming_centre)$"]',
  industrial: '["industrial"]',
};

/**
 * Branche → Overpass-Tag-Filter. Deutlich breiter als vorher, alle
 * wichtigen DACH-Business-Kategorien abgedeckt. Reihenfolge ist so,
 * dass die konkretesten Filter zuerst greifen.
 */
const INDUSTRY_TAG_MAP: Record<string, string[]> = {
  "handwerk": [
    '["craft"]',
    '["shop"~"^(hardware|paint|doityourself|electrical|trade|building_materials|tiles|flooring|carpet)$"]',
  ],
  "sanitär": ['["craft"~"^(plumber|hvac|heating_engineer|sanitary)$"]'],
  "sanitär / heizung": ['["craft"~"^(plumber|hvac|heating_engineer|sanitary)$"]'],
  "elektro": [
    '["craft"~"^(electrician|electronics_repair)$"]',
    '["shop"~"^(electrical|appliance|electronics|hifi|computer)$"]',
  ],
  "ärzte": [
    '["healthcare"~"^(doctor|clinic|centre|dentist|psychotherapist|physiotherapist|alternative)$"]',
    '["amenity"~"^(doctors|dentist|clinic)$"]',
  ],
  "ärzte / praxen": [
    '["healthcare"~"^(doctor|clinic|centre|dentist|psychotherapist|physiotherapist|alternative)$"]',
    '["amenity"~"^(doctors|dentist|clinic)$"]',
  ],
  "kanzleien": ['["office"~"^(lawyer|notary|advocate)$"]'],
  "steuerberatung": ['["office"~"^(tax_advisor|accountant|financial|financial_advisor)$"]'],
  "gastronomie": ['["amenity"~"^(restaurant|cafe|bar|pub|fast_food|biergarten|food_court|ice_cream)$"]'],
  "immobilien": ['["office"~"^(estate_agent|property_management|real_estate)$"]'],
  "fitness / beauty": [
    '["leisure"~"^(fitness_centre|sports_centre|dance)$"]',
    '["shop"~"^(beauty|hairdresser|cosmetics|massage|tattoo|piercing|nails|perfumery)$"]',
  ],
  "automotive": [
    '["shop"~"^(car|car_repair|car_parts|motorcycle|motorcycle_repair|tyres|bicycle|caravan)$"]',
    '["amenity"~"^(car_rental|car_wash|fuel|charging_station|driving_school)$"]',
  ],
  "einzelhandel": ['["shop"]'],
  "industrie": [
    '["industrial"]',
    '["landuse"="industrial"]',
    '["office"~"^(company|it|engineering|logistics|research|coworking|architect|consulting|advertising_agency|association|foundation|forestry|newspaper|educational_institution|employment_agency|guide|government|graphic_design|insurance|logistics|marketing|marketing_agency|ngo|political_party|publisher|surveyor|telecommunication|travel_agent|water_utility)$"]',
  ],
  "hotellerie": ['["tourism"~"^(hotel|guest_house|hostel|motel|apartment|chalet|resort)$"]'],
  "bildung": [
    '["amenity"~"^(school|kindergarten|college|university|language_school|driving_school|music_school)$"]',
    '["office"~"^(educational_institution|research)$"]',
  ],
  "finanzen": [
    '["amenity"~"^(bank|bureau_de_change|atm)$"]',
    '["office"~"^(financial|insurance|financial_advisor|bank|tax_advisor)$"]',
  ],
  "logistik": ['["office"~"^(logistics|forwarding)$"]', '["shop"~"^(logistics)$"]'],
  "agentur": [
    '["office"~"^(advertising_agency|marketing|marketing_agency|it|coworking|consulting|graphic_design|publisher|newspaper|architect)$"]',
  ],
};

export class OverpassProvider implements DiscoveryProvider {
  key = "overpass_osm";
  label = "OpenStreetMap (Overpass)";
  metadata: ProviderMetadata = {
    id: "overpass_osm",
    contractVersion: 1,
    displayName: "OpenStreetMap (Overpass)",
    capabilities: ["DISCOVERY", "COMPANY_BASICS", "CONTACTS"],
    countries: ["DE", "AT", "CH"],
    secretNames: [],
    policy: {
      license: "Open Database License 1.0",
      attribution: "© OpenStreetMap contributors",
      retentionClass: "PERMITTED",
      maxRetentionDays: null,
      permittedFields: [
        "name", "website", "phone", "email", "address", "location",
        "opening_hours", "category", "external_id",
      ],
      storesRawPayload: true,
    },
  };

  isConfigured(): boolean {
    // Overpass benötigt keinen Key — als Fallback IMMER aktiv, außer
    // ein Deployment deaktiviert ihn explizit über eine Env-Flag.
    return process.env.DISABLE_OVERPASS_DISCOVERY !== "1";
  }

  supports(request: DiscoveryRequest): boolean {
    return Boolean(
      request.bbox ||
        (request.centerLat !== null && request.centerLng !== null),
    );
  }

  async discover(request: DiscoveryRequest): Promise<DiscoveryResponse> {
    // bbox hat Vorrang: ein Segment-Lauf des Katalog-Workers.
    if (request.bbox) return this.discoverByBBox(request, request.bbox);
    return this.discoverByRadius(request);
  }

  /**
   * Bulk-Pfad. Eine Query pro Tag-Achse über eine Bounding-Box.
   * Liefert um Größenordnungen mehr Treffer pro Request als die
   * Umkreissuche und ist damit der einzige praktikable Weg, einen
   * Regionalkatalog in vertretbarer Zeit aufzubauen.
   */
  private async discoverByBBox(request: DiscoveryRequest, bbox: DiscoveryBBox): Promise<DiscoveryResponse> {
    const axisFilter = request.tagAxis ? AXIS_FILTER[request.tagAxis] : null;
    const filters = axisFilter ?? buildFilters(request.industries);
    if (!filters || (Array.isArray(filters) && filters.length === 0)) {
      return {
        companies: [],
        estimatedCostCents: 0,
        actualCostCents: 0,
        providerLogs: [{
          provider: this.key,
          endpoint: "overpass",
          latencyMs: 0,
          ok: false,
          error: `Unbekannte Overpass-Achse: ${request.tagAxis ?? "none"}`,
        }],
      };
    }
    const query = buildOverpassQL({
      bbox,
      filter: filters,
      limit: request.limit,
      timeoutS: BBOX_OVERPASS_TIMEOUT_S,
    });
    const { ok, elements, attempts } = await runQueryWithFallback(
      query,
      this.key,
      BBOX_HTTP_TIMEOUT_MS,
      BBOX_TOTAL_BUDGET_MS,
    );
    const seen = new Map<string, DiscoveredCompanyStub>();
    for (const el of elements) {
      const stub = mapElement(el, request, this.key);
      if (!stub) continue;
      const key = `${el.type}/${el.id}`;
      if (!seen.has(key)) seen.set(key, stub);
    }
    if (!ok) {
      return { companies: [], estimatedCostCents: 0, actualCostCents: 0, providerLogs: attempts };
    }
    return {
      companies: Array.from(seen.values()).slice(0, request.limit),
      estimatedCostCents: 0,
      actualCostCents: 0,
      providerLogs: attempts,
    };
  }

  /** Interaktiver Pfad: Umkreissuche um einen Punkt. Unverändert. */
  private async discoverByRadius(request: DiscoveryRequest): Promise<DiscoveryResponse> {
    const logs: DiscoveryResponse["providerLogs"] = [];
    if (request.centerLat === null || request.centerLng === null) {
      logs.push({
        provider: this.key,
        endpoint: "overpass",
        latencyMs: 0,
        ok: false,
        error: "Overpass benötigt centerLat/centerLng oder eine bbox",
      });
      return { companies: [], estimatedCostCents: 0, actualCostCents: 0, providerLogs: logs };
    }

    const radiusM = Math.min(MAX_RADIUS_M, Math.max(500, Math.round(request.radiusKm * 1000)));
    const filters = buildFilters(request.industries);
    const resultLimit = Math.max(20, Math.min(500, request.limit * 2));
    const seen = new Map<string, DiscoveredCompanyStub>();
    const query = buildOverpassQL({
      lat: request.centerLat,
      lng: request.centerLng,
      radiusM,
      filter: filters,
      limit: resultLimit,
    });
    const { ok, elements, log } = await runQueryWithFallback(query, this.key);
    logs.push(log);
    for (const el of elements) {
      const stub = mapElement(el, request, this.key);
      if (!stub) continue;
      const key = `${el.type}/${el.id}`;
      if (!seen.has(key)) seen.set(key, stub);
      if (seen.size >= request.limit) break;
    }

    // Wenn ALLE Filter-Requests fehlgeschlagen sind, aber wir eine
    // Fehlermeldung liefern konnten — trotzdem `[]` mit Log zurückgeben.
    if (!ok) {
      return { companies: [], estimatedCostCents: 0, actualCostCents: 0, providerLogs: logs };
    }
    const stubs = Array.from(seen.values()).slice(0, request.limit);
    return { companies: stubs, estimatedCostCents: 0, actualCostCents: 0, providerLogs: logs };
  }
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

/** Eine Mindestpause hält öffentliche Overpass-Instanzen innerhalb ihrer Fair-Use-Grenzen. */
const MIN_REQUEST_GAP_MS = 1_200;
let lastRequestAt = 0;

/**
 * Kennzeichnet Fehler, die auf eine Slot-Sperre zurückgehen. Der Aufrufer
 * unterscheidet daran, ob das Segment fehlerhaft ist oder nur warten muss.
 */
export const SLOT_BUSY_MARKER = "OVERPASS_SLOT_BUSY";

/** Liest die Wartezeit aus einer mit SLOT_BUSY_MARKER markierten Meldung. */
export function parseSlotBusy(message: string | null | undefined): number | null {
  if (!message || !message.includes(SLOT_BUSY_MARKER)) return null;
  const m = /retry_after=(\d+)/.exec(message);
  return m ? Number(m[1]) : 60;
}

const USER_AGENT = "NEXCEL-SalesIntel/1.0 (+https://nexcel.ai/bot)";

async function pace(): Promise<void> {
  const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

async function runQueryWithFallback(
  query: string,
  providerKey: string,
  httpTimeoutMs: number = HTTP_TIMEOUT_MS,
  totalBudgetMs?: number
): Promise<{
  ok: boolean;
  elements: OverpassElement[];
  log: { provider: string; endpoint: string; latencyMs: number; ok: boolean; error?: string };
  attempts: Array<{ provider: string; endpoint: string; latencyMs: number; ok: boolean; error?: string }>;
}> {
  const endpoint = OVERPASS_ENDPOINTS[0];
  const attempts: Array<{ provider: string; endpoint: string; latencyMs: number; ok: boolean; error?: string }> = [];
  if (!endpoint) {
    const error = "Overpass: no endpoint configured";
    const log = { provider: providerKey, endpoint: "overpass", latencyMs: 0, ok: false, error };
    return { ok: false, elements: [], log, attempts: [log] };
  }
  await pace();
  const result = await safeFetch(endpoint, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    contentType: "application/x-www-form-urlencoded",
    accept: "application/json",
    userAgent: USER_AGENT,
    timeoutMs: Math.min(httpTimeoutMs, totalBudgetMs ?? httpTimeoutMs),
    maxBytes: 12_000_000,
    maxRedirects: 0,
    allowedContentTypes: ["application/json"],
  });
  if (!result.ok || result.status < 200 || result.status >= 300) {
    const rateLimited = result.status === 429;
    const error = rateLimited
      ? `${SLOT_BUSY_MARKER} retry_after=60 — Overpass rate limited`
      : `Overpass: ${result.error ?? `HTTP ${result.status}`}`;
    const log = { provider: providerKey, endpoint, latencyMs: result.latencyMs, ok: false, error };
    return { ok: false, elements: [], log, attempts: [log] };
  }
  let json: { elements?: OverpassElement[]; remark?: string };
  try {
    json = JSON.parse(result.bodyText) as { elements?: OverpassElement[]; remark?: string };
  } catch {
    const error = "Overpass: malformed JSON response";
    const log = { provider: providerKey, endpoint, latencyMs: result.latencyMs, ok: false, error };
    return { ok: false, elements: [], log, attempts: [log] };
  }
  if (json.remark && (json.elements?.length ?? 0) === 0) {
    const error = `Overpass-Abbruch: ${json.remark.slice(0, 200)}`;
    const log = { provider: providerKey, endpoint, latencyMs: result.latencyMs, ok: false, error };
    return { ok: false, elements: [], log, attempts: [log] };
  }
  const elements = json.elements ?? [];
  const log = { provider: providerKey, endpoint, latencyMs: result.latencyMs, ok: true };
  attempts.push(log);
  return { ok: true, elements, log, attempts };
}

function buildFilters(industries: string[]): string[] {
  if (!industries || industries.length === 0) {
    // Generisch: nur die 4 größten Business-Tags. Getrennte Queries
    // pro Tag halten die Overpass-Laufzeit unter dem Timeout.
    return ['["shop"]', '["craft"]', '["office"]', '["amenity"~"^(restaurant|cafe|bar|pub|fast_food|pharmacy|doctors|dentist|car_repair|bank|fuel)$"]'];
  }
  const parts: string[] = [];
  for (const raw of industries) {
    const k = (raw || "").trim().toLowerCase();
    if (!k) continue;
    const hit =
      INDUSTRY_TAG_MAP[k] ??
      Object.entries(INDUSTRY_TAG_MAP).find(([key]) => k.startsWith(key.split(" ")[0]))?.[1];
    if (hit) {
      for (const filter of hit) parts.push(filter);
    } else {
      parts.push(`["name"~"${escapeRegex(k)}", i]`);
    }
  }
  return parts.length > 0 ? parts : ['["shop"]', '["craft"]', '["office"]'];
}

function buildOverpassQL(opts: {
  lat?: number;
  lng?: number;
  radiusM?: number;
  bbox?: DiscoveryBBox;
  /** Ein Selektor oder mehrere, die als Vereinigung abgefragt werden. */
  filter: string | string[];
  limit: number;
  timeoutS?: number;
}): string {
  const timeout = opts.timeoutS ?? OVERPASS_TIMEOUT_S;
  // Nodes + Ways reichen für Geschäfte praktisch immer aus. Relationen
  // sind für POIs selten und verlangsamen die Query stark.
  const scope = opts.bbox
    ? `(${round6(opts.bbox.south)},${round6(opts.bbox.west)},${round6(opts.bbox.north)},${round6(opts.bbox.east)})`
    : `(around:${opts.radiusM},${opts.lat},${opts.lng})`;
  // Mehrere Selektoren sind noetig, wenn eine Branche ueber verschiedene
  // OSM-Schluessel verteilt ist — Immobilien etwa ueber office und shop.
  const selectors = Array.isArray(opts.filter) ? opts.filter : [opts.filter];
  const body = selectors.map((f) => `node${f}${scope};way${f}${scope};`).join("");
  return `[out:json][timeout:${timeout}];(${body});out tags center ${opts.limit};`;
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function mapElement(
  el: {
    type: "node" | "way" | "relation";
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat?: number; lon?: number };
    tags?: Record<string, string>;
  },
  request: DiscoveryRequest,
  provider: string
): DiscoveredCompanyStub | null {
  const tags = el.tags ?? {};
  const name = (tags.name ?? tags["name:de"] ?? tags["official_name"] ?? tags["operator"] ?? "").trim();
  if (!name) return null;
  const lat = el.type === "node" ? el.lat : el.center?.lat;
  const lng = el.type === "node" ? el.lon : el.center?.lon;
  const phone = pickPhone(tags);
  const website = pickWebsite(tags);
  const email = tags["contact:email"] ?? tags.email ?? null;
  const street = tags["addr:street"] ?? "";
  const houseNo = tags["addr:housenumber"] ?? "";
  const postalCode = tags["addr:postcode"] ?? null;
  const city = tags["addr:city"] ?? request.city ?? null;
  const country = (tags["addr:country"] ?? request.country ?? "DE").toUpperCase();
  const addressLine =
    street || houseNo ? `${street}${street && houseNo ? " " : ""}${houseNo}`.trim() : null;
  // Konsistente, deutsche Kategorien statt roher OSM-Tag-Werte.
  const cat = normalizeCategoryFromTags(tags);
  const industry = cat.category;
  // Die Fachkategorie ist aussagekräftiger als der Markenname: bei einer
  // Lidl-Filiale ist "Supermarkt" die brauchbare Angabe, nicht "Lidl".
  const subIndustry = cat.subCategory ?? pickSubIndustry(tags) ?? tags["brand"] ?? null;
  const isChain = detectChain(tags);
  const distanceKm =
    request.centerLat !== null && request.centerLng !== null && lat != null && lng != null
      ? haversineKm(request.centerLat, request.centerLng, lat, lng)
      : null;
  if (lat == null || lng == null) return null;

  const employeesTag = tags["employees"] ?? tags["employees:count"];
  const employees = employeesTag ? parseInt(employeesTag, 10) : null;
  const foundedTag = tags["start_date"] ?? tags["opening_date"];
  const foundedYear = foundedTag ? parseFoundedYear(foundedTag) : null;

  // OSM speichert häufig Bonusinformationen, die für Scoring nützlich sind:
  // opening_hours (Signal für aktives Geschäft), brand (Franchise),
  // description, wheelchair (Trust), cuisine (Segmentierung), delivery,
  // takeaway, wifi, payment:*. Wir bündeln diese als kompakte Confidence-
  // Signale in einem strukturierten `note`, aus dem Scoring später
  // Propensity-Signale ableitet.
  const signals = pickSignals(tags);

  return {
    name,
    website,
    phone,
    email,
    addressLine,
    postalCode,
    city,
    country,
    latitude: lat,
    longitude: lng,
    distanceKm,
    industry,
    subIndustry,
    employeeEstimateMin: Number.isFinite(employees) ? employees : null,
    employeeEstimateMax: Number.isFinite(employees) ? employees : null,
    foundedYear,
    provider,
    providerSourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    providerRawId: `${el.type}/${el.id}`,
    // Confidence-Boost, wenn OSM bereits reichhaltige Business-Signale
    // liefert (Website + Telefon + Adresse = 0.85, Basis 0.55).
    confidence: computeConfidence({ website, phone, addressLine, signals }),
    isChain,
    signals,
  };
}

/**
 * Erkennt Filialen grosser Ketten.
 *
 * Zielgruppe sind Mittelstand und kleine Betriebe. Eine Lidl- oder
 * KiK-Filiale entscheidet nichts vor Ort — Budget, Website und Software
 * kommen aus der Zentrale. Solche Datensaetze blaehen den Katalog auf und
 * verwaessern jede Priorisierung.
 *
 * OSM pflegt fuer Ketten `brand` und meist auch `brand:wikidata`; die
 * Wikidata-Referenz gibt es praktisch nur bei ueberregionalen Marken.
 * Gemessen im Raum Unna trifft das auf 14 Prozent der benannten Betriebe
 * zu — darunter KiK, Lidl, TEDi, REWE, dm und Rossmann.
 *
 * Bewusst nicht als Kettensignal gewertet: ein blosser `operator`, denn
 * den traegt auch die Inhaber-GmbH eines Einzelbetriebs.
 */
export function detectChain(tags: Record<string, string>): boolean {
  if (tags["brand:wikidata"] || tags["operator:wikidata"]) return true;
  if (tags["brand"]) return true;
  return false;
}

/**
 * Verdichtet die OSM-Tags eines Betriebs zu auswertbaren Signalen.
 *
 * Die Auswahl folgt dem, was für Vertrieb tatsächlich etwas aussagt —
 * gemessen an der Tag-Häufigkeit im Raum Unna, nicht geraten. Besonders
 * ergiebig sind die Zahlungsarten und `fax`: sie sind die einzigen
 * Hinweise auf den Digitalisierungsstand, die schon vor dem
 * Website-Audit vorliegen.
 */
function pickSignals(tags: Record<string, string>): string[] {
  const s: string[] = [];
  if (tags["opening_hours"]) s.push("has_opening_hours");
  if (tags["brand"]) s.push(`brand:${tags["brand"].toLowerCase().slice(0, 40)}`);
  if (tags["cuisine"]) s.push(`cuisine:${tags["cuisine"]}`);
  if (tags["wheelchair"] === "yes") s.push("wheelchair_accessible");
  if (tags["delivery"] === "yes") s.push("delivery");
  if (tags["takeaway"] === "yes") s.push("takeaway");
  if (tags["internet_access"] || tags["wifi"]) s.push("wifi");
  if (tags["outdoor_seating"] === "yes") s.push("outdoor_seating");
  if (tags["reservation"] || tags["booking"]) s.push("takes_reservation");
  if (tags["contact:facebook"] || tags["contact:instagram"] || tags["contact:linkedin"]) {
    s.push("has_social_media");
  }

  // Digitalisierungsstand. Fax ist das deutlichste Analogsignal, das OSM
  // kennt; Kartenzahlung umgekehrt ein Hinweis auf vorhandene Technik.
  if (tags["fax"] || tags["contact:fax"]) s.push("uses_fax");
  const cardPayment = Object.entries(tags).some(
    ([k, v]) => k.startsWith("payment:") && !/cash|coins|notes/.test(k) && v === "yes"
  );
  if (cardPayment) s.push("accepts_card_payment");
  else if (tags["payment:cash"] === "yes") s.push("cash_only");
  if (tags["website:menu"] || tags["opening_hours:url"]) s.push("has_online_booking");

  // Datenfrische: OSM-Mapper bestätigen gepflegte Objekte mit check_date.
  // Ein junger Zeitstempel erhöht das Vertrauen in Adresse und Telefon.
  const checked = tags["check_date"] ?? tags["check_date:opening_hours"];
  if (checked && isRecentIso(checked, 730)) s.push("data_recently_verified");

  // Größenhinweis: eine mehrgeschossige Betriebsstätte spricht gegen den
  // Ein-Raum-Betrieb. Schwaches, aber kostenloses Kapazitätssignal.
  const levels = parseInt(tags["building:levels"] ?? "", 10);
  if (Number.isFinite(levels) && levels >= 2) s.push("multi_storey_premises");

  // Fachliche Verfeinerung für Anzeige und Segmentierung.
  const speciality = tags["healthcare:speciality"] ?? tags["sport"];
  if (speciality) s.push(`speciality:${speciality.split(";")[0].slice(0, 40)}`);
  if (tags["wikidata"]) s.push(`wikidata:${tags["wikidata"]}`);

  return s;
}

/** Prüft, ob ein ISO-Datum jünger als `maxAgeDays` ist. */
function isRecentIso(value: string, maxAgeDays: number): boolean {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= maxAgeDays * 86_400_000;
}

function computeConfidence(opts: {
  website: string | null;
  phone: string | null;
  addressLine: string | null;
  signals: string[];
}): number {
  let c = 0.55;
  if (opts.website) c += 0.15;
  if (opts.phone) c += 0.1;
  if (opts.addressLine) c += 0.05;
  if (opts.signals.length >= 3) c += 0.05;
  return Math.min(0.92, c);
}

function parseFoundedYear(input: string): number | null {
  const m = input.match(/^(\d{4})/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return y >= 1800 && y <= new Date().getFullYear() ? y : null;
}

function pickSubIndustry(tags: Record<string, string>): string | null {
  return tags["cuisine"] ?? tags["brand"] ?? tags["operator:type"] ?? null;
}

function pickPhone(tags: Record<string, string>): string | null {
  return tags["contact:phone"] ?? tags.phone ?? tags["contact:mobile"] ?? tags.mobile ?? null;
}

function pickWebsite(tags: Record<string, string>): string | null {
  const w = tags["contact:website"] ?? tags.website ?? tags.url;
  if (!w) return null;
  if (/^https?:\/\//i.test(w)) return w;
  return `https://${w}`;
}

function pickIndustry(tags: Record<string, string>): string | null {
  return (
    tags.craft ??
    tags.shop ??
    tags.office ??
    tags.healthcare ??
    tags.amenity ??
    tags.industrial ??
    null
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
