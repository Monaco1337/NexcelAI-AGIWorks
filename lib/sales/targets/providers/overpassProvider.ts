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

import type { DiscoveredCompanyStub, DiscoveryProvider, DiscoveryRequest, DiscoveryResponse } from "./types";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

/** Overpass akzeptiert einen Radius in Metern; Max ~50 km sinnvoll. */
const MAX_RADIUS_M = 50_000;
/** Server-seitiges Query-Budget (Overpass respektiert diesen Wert intern). */
const OVERPASS_TIMEOUT_S = 12;
/** Client-seitiger HTTP-Cutoff — muss > OVERPASS_TIMEOUT_S sein. */
const HTTP_TIMEOUT_MS = 18_000;

/**
 * Branche → Overpass-Tag-Filter. Wenn nichts passt, laden wir generisch
 * alle Objekte mit `name` + `phone|contact:phone|website|contact:website`.
 */
const INDUSTRY_TAG_MAP: Record<string, string[]> = {
  "handwerk": ['["craft"]', '["shop"~"^(hardware|paint|doityourself|electrical)$"]'],
  "sanitär": ['["craft"="plumber"]', '["craft"="hvac"]', '["craft"="heating_engineer"]'],
  "sanitär / heizung": ['["craft"~"^(plumber|hvac|heating_engineer)$"]'],
  "elektro": ['["craft"="electrician"]', '["shop"="electrical"]', '["shop"="appliance"]'],
  "ärzte": ['["healthcare"~"^(doctor|clinic|centre|dentist)$"]', '["amenity"="doctors"]'],
  "ärzte / praxen": ['["healthcare"~"^(doctor|clinic|centre|dentist|psychotherapist)$"]', '["amenity"="doctors"]'],
  "kanzleien": ['["office"~"^(lawyer|notary)$"]'],
  "steuerberatung": ['["office"~"^(tax_advisor|accountant|financial)$"]'],
  "gastronomie": ['["amenity"~"^(restaurant|cafe|bar|pub|fast_food|biergarten)$"]'],
  "immobilien": ['["office"="estate_agent"]', '["office"="property_management"]'],
  "fitness / beauty": ['["leisure"~"^(fitness_centre|sports_centre)$"]', '["shop"~"^(beauty|hairdresser|cosmetics)$"]'],
  "automotive": ['["shop"~"^(car|car_repair|motorcycle|tyres)$"]', '["amenity"="car_rental"]'],
  "einzelhandel": ['["shop"]'],
  "industrie": ['["industrial"]', '["landuse"="industrial"]', '["office"~"^(company|it|engineering)$"]'],
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
    const logs: DiscoveryResponse["providerLogs"] = [];
    if (request.centerLat === null || request.centerLng === null) {
      logs.push({
        provider: this.key,
        endpoint: "overpass",
        latencyMs: 0,
        ok: false,
        error: "Overpass benötigt centerLat/centerLng",
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

async function runQueryWithFallback(
  query: string,
  providerKey: string
): Promise<{
  ok: boolean;
  elements: OverpassElement[];
  log: { provider: string; endpoint: string; latencyMs: number; ok: boolean; error?: string };
}> {
  let lastError = "no endpoint responded";
  let lastLatency = 0;
  let lastEndpoint = OVERPASS_ENDPOINTS[0];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const started = Date.now();
    lastEndpoint = endpoint;
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "NEXCEL-SalesIntel/1.0 (+https://nexcel.ai/bot)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });
      const latency = Date.now() - started;
      lastLatency = latency;
      if (!resp.ok) {
        lastError = `HTTP ${resp.status}`;
        continue;
      }
      const json = (await resp.json()) as { elements?: OverpassElement[] };
      return {
        ok: true,
        elements: json.elements ?? [],
        log: { provider: providerKey, endpoint, latencyMs: latency, ok: true },
      };
    } catch (err) {
      lastLatency = Date.now() - started;
      lastError = (err as Error).message || "network error";
    }
  }
  return {
    ok: false,
    elements: [],
    log: { provider: providerKey, endpoint: lastEndpoint, latencyMs: lastLatency, ok: false, error: `Overpass: ${lastError}` },
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
  lat: number;
  lng: number;
  radiusM: number;
  filter: string;
  limit: number;
}): string {
  const around = `(around:${opts.radiusM},${opts.lat},${opts.lng})`;
  // Nodes + Ways reichen für Geschäfte praktisch immer aus. Relationen
  // sind für POIs selten und verlangsamen die Query stark.
  const body = `node${opts.filter}${around};way${opts.filter}${around};`;
  return `[out:json][timeout:${OVERPASS_TIMEOUT_S}];(${body});out tags center ${opts.limit};`;
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
  const name = (tags.name ?? tags["operator"] ?? "").trim();
  if (!name) return null;
  const lat = el.type === "node" ? el.lat : el.center?.lat;
  const lng = el.type === "node" ? el.lon : el.center?.lon;
  const phone = pickPhone(tags);
  const website = pickWebsite(tags);
  const email = tags.email ?? tags["contact:email"] ?? null;
  const street = tags["addr:street"] ?? "";
  const houseNo = tags["addr:housenumber"] ?? "";
  const postalCode = tags["addr:postcode"] ?? null;
  const city = tags["addr:city"] ?? request.city ?? null;
  const country = (tags["addr:country"] ?? request.country ?? "DE").toUpperCase();
  const addressLine =
    street || houseNo ? `${street}${street && houseNo ? " " : ""}${houseNo}`.trim() : null;
  const industry = pickIndustry(tags);
  const distanceKm =
    request.centerLat !== null && request.centerLng !== null && lat != null && lng != null
      ? haversineKm(request.centerLat, request.centerLng, lat, lng)
      : null;

  // Wir behalten alles mit Name + Geokoordinate. Ohne mindestens diese
  // beiden Basisdaten kann die Pipeline später nichts sinnvoll
  // enrichen. Kontaktinformationen sind Bonus, aber nicht Pflicht.
  if (lat == null || lng == null) return null;

  return {
    name,
    website,
    phone,
    email,
    addressLine,
    postalCode,
    city,
    country,
    latitude: lat ?? null,
    longitude: lng ?? null,
    distanceKm,
    industry,
    provider,
    providerSourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    providerRawId: `${el.type}/${el.id}`,
    confidence: 0.6,
  };
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
