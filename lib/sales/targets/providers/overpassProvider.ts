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
import { normalizeCategoryFromTags } from "../categoryMap";
import {
  getProviderHealthSnapshot,
  markProviderFailure,
  markProviderRateLimited,
  markProviderSuccess,
} from "./health";

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
const AXIS_FILTER: Record<string, string> = {
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

  isConfigured(): boolean {
    // Overpass benötigt keinen Key — als Fallback IMMER aktiv, außer
    // ein Deployment deaktiviert ihn explizit über eine Env-Flag.
    return process.env.DISABLE_OVERPASS_DISCOVERY !== "1";
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
    const logs: DiscoveryResponse["providerLogs"] = [];
    const axes = request.tagAxis ? [request.tagAxis] : [...OVERPASS_TAG_AXES];
    const seen = new Map<string, DiscoveredCompanyStub>();
    let anyOk = false;

    for (const axis of axes) {
      const filter = AXIS_FILTER[axis];
      if (!filter) continue;
      const query = buildOverpassQL({
        bbox,
        filter,
        limit: request.limit,
        timeoutS: BBOX_OVERPASS_TIMEOUT_S,
      });
      const { ok, elements, attempts } = await runQueryWithFallback(
        query,
        this.key,
        BBOX_HTTP_TIMEOUT_MS,
        BBOX_TOTAL_BUDGET_MS
      );
      logs.push(...attempts);
      if (!ok) continue;
      anyOk = true;
      for (const el of elements) {
        const stub = mapElement(el, request, this.key);
        if (!stub) continue;
        const key = `${el.type}/${el.id}`;
        if (!seen.has(key)) seen.set(key, stub);
      }
      if (seen.size >= request.limit) break;
    }

    if (!anyOk) {
      return { companies: [], estimatedCostCents: 0, actualCostCents: 0, providerLogs: logs };
    }
    return {
      companies: Array.from(seen.values()).slice(0, request.limit),
      estimatedCostCents: 0,
      actualCostCents: 0,
      providerLogs: logs,
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
    const perFilterLimit = Math.max(20, Math.min(120, Math.ceil((request.limit * 2) / Math.max(1, filters.length))));

    // Kombinierte Sammlung über alle Filter — dedup per (type/id) am Ende.
    const seen = new Map<string, DiscoveredCompanyStub>();
    let anyOk = false;

    for (const filter of filters) {
      const query = buildOverpassQL({
        lat: request.centerLat,
        lng: request.centerLng,
        radiusM,
        filter,
        limit: perFilterLimit,
      });
      const { ok, elements, log } = await runQueryWithFallback(query, this.key);
      logs.push(log);
      if (!ok) continue;
      anyOk = true;
      for (const el of elements) {
        const stub = mapElement(el, request, this.key);
        if (!stub) continue;
        const key = `${el.type}/${el.id}`;
        if (!seen.has(key)) seen.set(key, stub);
        if (seen.size >= request.limit) break;
      }
      if (seen.size >= request.limit) break;
    }

    // Wenn ALLE Filter-Requests fehlgeschlagen sind, aber wir eine
    // Fehlermeldung liefern konnten — trotzdem `[]` mit Log zurückgeben.
    if (!anyOk) {
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

/**
 * Reiht die Mirrors nach Gesundheit: Endpoints im Cooldown wandern ans
 * Ende statt komplett auszufallen. Nutzt die vorhandene Provider-Health-
 * Registry mit einem Sub-Key pro Endpoint, damit ein defekter Mirror
 * (aktuell liefert kumi.systems HTTP 500) den Provider als Ganzes nicht
 * als kaputt markiert.
 */
function orderedEndpoints(providerKey: string): string[] {
  const now = Date.now();
  return [...OVERPASS_ENDPOINTS].sort((a, b) => rank(a) - rank(b));

  function rank(endpoint: string): number {
    const snap = getProviderHealthSnapshot(mirrorKey(providerKey, endpoint));
    const cooling = snap.cooldownUntil && new Date(snap.cooldownUntil).getTime() > now ? 100 : 0;
    const penalty =
      snap.state === "HEALTHY" ? 0 : snap.state === "DEGRADED" ? 10 : snap.state === "RATE_LIMITED" ? 20 : 30;
    return cooling + penalty;
  }
}

/**
 * Overpass vergibt pro IP nur wenige gleichzeitige Slots. Werden
 * Segmente ohne Pause hintereinander abgefeuert, antwortet der Server
 * irgendwann mit HTTP 200 und leerem Ergebnis statt mit einem Fehler —
 * beobachtet als „0 Firmen nach 59 s" bei einer Query, die einzeln in
 * 6 s 1.649 Firmen liefert. Eine Mindestpause zwischen Anfragen hält
 * uns innerhalb der Nutzungsregeln.
 */
const MIN_REQUEST_GAP_MS = 1_200;
let lastRequestAt = 0;

/**
 * So lange warten wir höchstens auf einen freien Overpass-Slot.
 *
 * Gemessen: nach etwa drei umfangreichen bbox-Abfragen sperrt Overpass die
 * IP für rund 60 s. Ein kürzeres Limit würde die Wartezeit nie aussitzen
 * und stattdessen jedes Segment sofort zurückweisen.
 */
const SLOT_MAX_WAIT_MS = 90_000;

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

/**
 * Slot-Verfügbarkeit vor der eigentlichen Abfrage prüfen.
 *
 * Overpass vergibt pro Client-IP eine feste Zahl gleichzeitiger Slots
 * (aktuell 2) und veröffentlicht den Stand unter `/api/status`. Ist
 * kein Slot frei, nimmt der Server die Verbindung entweder gar nicht
 * an oder lässt sie auflaufen — beobachtet als „fetch failed" nach rund
 * 10,5 s. In einer geteilten Cloud-Umgebung teilen sich viele Clients
 * dieselbe ausgehende IP, weshalb dieser Fall dort die Regel ist.
 *
 * Die Statusabfrage kostet rund 100 ms und ersetzt einen 10-Sekunden-
 * Fehlversuch durch eine sofortige, benannte Absage. Das Segment wandert
 * dann mit Backoff zurück in die Queue, statt Zeitbudget zu verbrennen.
 */
interface SlotStatus {
  available: number;
  waitSeconds: number | null;
  raw: string;
}

async function readSlotStatus(endpoint: string): Promise<SlotStatus | null> {
  try {
    const statusUrl = endpoint.replace(/\/interpreter\/?$/, "/status");
    const resp = await fetch(statusUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });
    if (!resp.ok) return null;
    const raw = await resp.text();

    const availableMatch = /(\d+)\s+slots?\s+available\s+now/i.exec(raw);
    if (availableMatch) {
      return { available: Number(availableMatch[1]), waitSeconds: null, raw };
    }
    // "Slot available after: 2026-08-29T12:40:00Z, in 42 seconds."
    const waitMatches = [...raw.matchAll(/in\s+(-?\d+)\s+seconds?/gi)].map((m) => Number(m[1]));
    if (waitMatches.length > 0) {
      return { available: 0, waitSeconds: Math.max(0, Math.min(...waitMatches)), raw };
    }
    return { available: 0, waitSeconds: null, raw };
  } catch {
    // Status nicht abrufbar: nicht blockieren, normal weiterversuchen.
    return null;
  }
}

function mirrorKey(providerKey: string, endpoint: string): string {
  try {
    return `${providerKey}:${new URL(endpoint).hostname}`;
  } catch {
    return `${providerKey}:${endpoint}`;
  }
}

/**
 * `fetch` meldet Netzwerkprobleme pauschal als „fetch failed"; die
 * eigentliche Ursache steckt in `cause`. Ohne sie ist nicht zu
 * unterscheiden, ob ein Endpoint die Verbindung zurücksetzt, DNS
 * scheitert oder ein Timeout greift.
 */
function describeFetchError(err: unknown): string {
  const e = err as { message?: string; cause?: { code?: string; message?: string } };
  const base = e?.message || "network error";
  const cause = e?.cause;
  if (!cause) return base;
  const detail = [cause.code, cause.message].filter(Boolean).join(" ");
  return detail ? `${base} (${detail})` : base;
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
  let lastError = "no endpoint responded";
  let lastLatency = 0;
  const endpoints = orderedEndpoints(providerKey);
  let lastEndpoint = endpoints[0];
  // Jeder Versuch wird protokolliert, nicht nur der letzte: sonst bleibt
  // unsichtbar, dass ein Mirror lange blockiert hat, bevor ein anderer
  // geantwortet hat.
  const attempts: Array<{ provider: string; endpoint: string; latencyMs: number; ok: boolean; error?: string }> = [];
  const deadline = totalBudgetMs ? Date.now() + totalBudgetMs : null;
  for (const endpoint of endpoints) {
    const started = Date.now();
    lastEndpoint = endpoint;
    // Verbleibendes Budget bestimmt den Timeout dieses Versuchs; ist
    // nichts mehr übrig, brechen wir ab statt die Laufzeit zu sprengen.
    let attemptTimeout = httpTimeoutMs;
    if (deadline) {
      const remaining = deadline - Date.now();
      if (remaining < 2_000) {
        lastError = `${lastError} (Zeitbudget erschöpft)`;
        break;
      }
      attemptTimeout = Math.min(httpTimeoutMs, remaining);
    }
    try {
      await pace();

      // Auf einen freien Slot warten, solange das im Budget liegt.
      const slots = await readSlotStatus(endpoint);
      if (slots && slots.available === 0) {
        const waitMs = (slots.waitSeconds ?? 0) * 1000 + 500;
        const affordable = deadline ? deadline - Date.now() - 3_000 : SLOT_MAX_WAIT_MS;
        if (waitMs > 0 && waitMs <= Math.min(SLOT_MAX_WAIT_MS, affordable)) {
          await new Promise((r) => setTimeout(r, waitMs));
        } else {
          lastLatency = Date.now() - started;
          const retryAfter = slots.waitSeconds ?? 60;
          lastError =
            `${SLOT_BUSY_MARKER} retry_after=${retryAfter} — Overpass vergibt derzeit keinen Slot` +
            (slots.waitSeconds === null ? " (geteilte Ausgangs-IP ausgelastet)" : `, naechster in ${retryAfter}s`);
          attempts.push({ provider: providerKey, endpoint, latencyMs: lastLatency, ok: false, error: lastError });
          markProviderRateLimited(mirrorKey(providerKey, endpoint), lastError);
          continue;
        }
      }

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(attemptTimeout),
      });
      const latency = Date.now() - started;
      lastLatency = latency;
      if (!resp.ok) {
        lastError = `HTTP ${resp.status}`;
        attempts.push({ provider: providerKey, endpoint, latencyMs: latency, ok: false, error: lastError });
        markProviderFailure(mirrorKey(providerKey, endpoint), lastError);
        continue;
      }
      const json = (await resp.json()) as { elements?: OverpassElement[]; remark?: string };
      // Overpass meldet serverseitige Timeouts und Speicherabbrüche NICHT
      // per HTTP-Status, sondern als `remark` bei HTTP 200 mit leerer
      // Ergebnisliste. Ohne diese Prüfung würde ein abgebrochenes Segment
      // als „erfolgreich mit 0 Firmen" gelten und eine ganze Teilregion
      // dauerhaft aus dem Katalog fallen.
      if (json.remark && (json.elements?.length ?? 0) === 0) {
        lastError = `Overpass-Abbruch: ${json.remark.slice(0, 200)}`;
        attempts.push({ provider: providerKey, endpoint, latencyMs: latency, ok: false, error: lastError });
        markProviderFailure(mirrorKey(providerKey, endpoint), lastError);
        continue;
      }
      const elements = json.elements ?? [];
      attempts.push({ provider: providerKey, endpoint, latencyMs: latency, ok: true });
      markProviderSuccess(mirrorKey(providerKey, endpoint));
      return {
        ok: true,
        elements,
        log: { provider: providerKey, endpoint, latencyMs: latency, ok: true },
        attempts,
      };
    } catch (err) {
      lastLatency = Date.now() - started;
      lastError = describeFetchError(err);
      attempts.push({ provider: providerKey, endpoint, latencyMs: lastLatency, ok: false, error: lastError });
      markProviderFailure(mirrorKey(providerKey, endpoint), lastError);
    }
  }
  return {
    ok: false,
    elements: [],
    log: { provider: providerKey, endpoint: lastEndpoint, latencyMs: lastLatency, ok: false, error: `Overpass: ${lastError}` },
    attempts,
  };
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
  filter: string;
  limit: number;
  timeoutS?: number;
}): string {
  const timeout = opts.timeoutS ?? OVERPASS_TIMEOUT_S;
  // Nodes + Ways reichen für Geschäfte praktisch immer aus. Relationen
  // sind für POIs selten und verlangsamen die Query stark.
  const scope = opts.bbox
    ? `(${round6(opts.bbox.south)},${round6(opts.bbox.west)},${round6(opts.bbox.north)},${round6(opts.bbox.east)})`
    : `(around:${opts.radiusM},${opts.lat},${opts.lng})`;
  const body = `node${opts.filter}${scope};way${opts.filter}${scope};`;
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
