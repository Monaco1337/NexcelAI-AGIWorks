/**
 * Leichtgewichtiges Stadt-Geocoding (DACH-Fokus).
 *
 * Strategie:
 *  1. Statische Tabelle für die 300+ wichtigsten DACH-Städte — deckt >95 %
 *     der realen Anfragen ab, ist offline verfügbar, kostet nichts.
 *  2. Google-Places-Text-Search als Fallback, wenn der Key konfiguriert
 *     ist. Nutzt denselben Provider-Key wie Discovery.
 *
 * Bewusst KEIN Third-Party-Geocoder (Nominatim/OSM) — deren Rate-Limits
 * sind für Produktions-Workloads ungeeignet und würden die Ansicht
 * unzuverlässig machen.
 */

import { executeControlledProviderCall } from "./providers/execution";
import { newCorrelationId } from "./errors";

export interface GeoPoint {
  lat: number;
  lng: number;
  city: string;
  country: string;
  source: "static" | "google_places";
}

/**
 * Statisch hinterlegte DACH-Städte (Stand: aktuelle Landkreis-Zentren).
 * Wir bewusst nur `city → { lat, lng, country }` — keine Region/PLZ,
 * die brauchen wir hier nicht.
 */
const STATIC_DACH: Record<string, { lat: number; lng: number; country: string }> = {
  /* ── Deutschland — Metropolen & Landkreis-Zentren ──────────────── */
  berlin: { lat: 52.520008, lng: 13.404954, country: "DE" },
  hamburg: { lat: 53.551086, lng: 9.993682, country: "DE" },
  münchen: { lat: 48.135125, lng: 11.581981, country: "DE" },
  muenchen: { lat: 48.135125, lng: 11.581981, country: "DE" },
  köln: { lat: 50.937531, lng: 6.960279, country: "DE" },
  koeln: { lat: 50.937531, lng: 6.960279, country: "DE" },
  frankfurt: { lat: 50.110924, lng: 8.682127, country: "DE" },
  "frankfurt am main": { lat: 50.110924, lng: 8.682127, country: "DE" },
  stuttgart: { lat: 48.775846, lng: 9.182932, country: "DE" },
  düsseldorf: { lat: 51.227741, lng: 6.773456, country: "DE" },
  duesseldorf: { lat: 51.227741, lng: 6.773456, country: "DE" },
  dortmund: { lat: 51.513587, lng: 7.465298, country: "DE" },
  essen: { lat: 51.455643, lng: 7.011555, country: "DE" },
  leipzig: { lat: 51.339695, lng: 12.373075, country: "DE" },
  bremen: { lat: 53.079296, lng: 8.801694, country: "DE" },
  dresden: { lat: 51.050409, lng: 13.737262, country: "DE" },
  hannover: { lat: 52.375892, lng: 9.732010, country: "DE" },
  nürnberg: { lat: 49.452103, lng: 11.076665, country: "DE" },
  nuernberg: { lat: 49.452103, lng: 11.076665, country: "DE" },
  duisburg: { lat: 51.434408, lng: 6.762329, country: "DE" },
  bochum: { lat: 51.481845, lng: 7.216236, country: "DE" },
  wuppertal: { lat: 51.256213, lng: 7.150764, country: "DE" },
  bielefeld: { lat: 52.030228, lng: 8.532471, country: "DE" },
  bonn: { lat: 50.737430, lng: 7.098207, country: "DE" },
  münster: { lat: 51.960665, lng: 7.626135, country: "DE" },
  muenster: { lat: 51.960665, lng: 7.626135, country: "DE" },
  karlsruhe: { lat: 49.006889, lng: 8.403653, country: "DE" },
  mannheim: { lat: 49.487459, lng: 8.466039, country: "DE" },
  augsburg: { lat: 48.370545, lng: 10.897790, country: "DE" },
  wiesbaden: { lat: 50.082820, lng: 8.240990, country: "DE" },
  mönchengladbach: { lat: 51.180067, lng: 6.442490, country: "DE" },
  moenchengladbach: { lat: 51.180067, lng: 6.442490, country: "DE" },
  gelsenkirchen: { lat: 51.517744, lng: 7.085717, country: "DE" },
  aachen: { lat: 50.775345, lng: 6.083887, country: "DE" },
  braunschweig: { lat: 52.268874, lng: 10.526770, country: "DE" },
  chemnitz: { lat: 50.827847, lng: 12.921370, country: "DE" },
  kiel: { lat: 54.323293, lng: 10.122765, country: "DE" },
  halle: { lat: 51.482780, lng: 11.969700, country: "DE" },
  magdeburg: { lat: 52.120533, lng: 11.627624, country: "DE" },
  freiburg: { lat: 47.999008, lng: 7.842104, country: "DE" },
  krefeld: { lat: 51.339386, lng: 6.585866, country: "DE" },
  mainz: { lat: 49.992863, lng: 8.247253, country: "DE" },
  lübeck: { lat: 53.865467, lng: 10.686559, country: "DE" },
  luebeck: { lat: 53.865467, lng: 10.686559, country: "DE" },
  erfurt: { lat: 50.984768, lng: 11.029880, country: "DE" },
  oberhausen: { lat: 51.496578, lng: 6.862978, country: "DE" },
  rostock: { lat: 54.092441, lng: 12.099147, country: "DE" },
  kassel: { lat: 51.312801, lng: 9.481544, country: "DE" },
  hagen: { lat: 51.360921, lng: 7.475117, country: "DE" },
  potsdam: { lat: 52.390569, lng: 13.064473, country: "DE" },
  saarbrücken: { lat: 49.240161, lng: 6.996932, country: "DE" },
  saarbruecken: { lat: 49.240161, lng: 6.996932, country: "DE" },
  hamm: { lat: 51.680139, lng: 7.820551, country: "DE" },
  mülheim: { lat: 51.432979, lng: 6.879976, country: "DE" },
  muelheim: { lat: 51.432979, lng: 6.879976, country: "DE" },
  ludwigshafen: { lat: 49.481200, lng: 8.451300, country: "DE" },
  leverkusen: { lat: 51.045810, lng: 7.018776, country: "DE" },
  oldenburg: { lat: 53.143890, lng: 8.213890, country: "DE" },
  osnabrück: { lat: 52.279911, lng: 8.047179, country: "DE" },
  osnabrueck: { lat: 52.279911, lng: 8.047179, country: "DE" },
  solingen: { lat: 51.170529, lng: 7.083335, country: "DE" },
  heidelberg: { lat: 49.398752, lng: 8.672434, country: "DE" },
  darmstadt: { lat: 49.872826, lng: 8.651193, country: "DE" },
  paderborn: { lat: 51.719045, lng: 8.757533, country: "DE" },
  regensburg: { lat: 49.013432, lng: 12.101624, country: "DE" },
  würzburg: { lat: 49.791304, lng: 9.953355, country: "DE" },
  wuerzburg: { lat: 49.791304, lng: 9.953355, country: "DE" },
  neuss: { lat: 51.198036, lng: 6.687629, country: "DE" },
  ingolstadt: { lat: 48.765778, lng: 11.423430, country: "DE" },
  offenbach: { lat: 50.099516, lng: 8.767839, country: "DE" },
  fürth: { lat: 49.477520, lng: 10.988670, country: "DE" },
  fuerth: { lat: 49.477520, lng: 10.988670, country: "DE" },
  ulm: { lat: 48.401870, lng: 9.987340, country: "DE" },
  heilbronn: { lat: 49.142909, lng: 9.218293, country: "DE" },
  pforzheim: { lat: 48.891810, lng: 8.698041, country: "DE" },
  göttingen: { lat: 51.541260, lng: 9.915800, country: "DE" },
  goettingen: { lat: 51.541260, lng: 9.915800, country: "DE" },
  bottrop: { lat: 51.523691, lng: 6.928565, country: "DE" },
  trier: { lat: 49.749992, lng: 6.637143, country: "DE" },
  recklinghausen: { lat: 51.614280, lng: 7.197780, country: "DE" },
  reutlingen: { lat: 48.491581, lng: 9.204438, country: "DE" },
  bremerhaven: { lat: 53.539341, lng: 8.580820, country: "DE" },
  koblenz: { lat: 50.356943, lng: 7.588908, country: "DE" },
  "bergisch gladbach": { lat: 50.985586, lng: 7.132790, country: "DE" },
  jena: { lat: 50.927054, lng: 11.589237, country: "DE" },
  remscheid: { lat: 51.178993, lng: 7.192612, country: "DE" },
  erlangen: { lat: 49.596170, lng: 11.004340, country: "DE" },
  moers: { lat: 51.451801, lng: 6.626460, country: "DE" },
  siegen: { lat: 50.884469, lng: 8.024007, country: "DE" },
  hildesheim: { lat: 52.154778, lng: 9.957390, country: "DE" },
  salzgitter: { lat: 52.150793, lng: 10.336790, country: "DE" },
  wilhelmshaven: { lat: 53.523232, lng: 8.111133, country: "DE" },
  cottbus: { lat: 51.756330, lng: 14.332845, country: "DE" },
  gera: { lat: 50.880502, lng: 12.081269, country: "DE" },
  witten: { lat: 51.443340, lng: 7.335160, country: "DE" },
  iserlohn: { lat: 51.377110, lng: 7.696450, country: "DE" },
  ratingen: { lat: 51.297230, lng: 6.849650, country: "DE" },
  lünen: { lat: 51.615822, lng: 7.528693, country: "DE" },
  luenen: { lat: 51.615822, lng: 7.528693, country: "DE" },
  velbert: { lat: 51.339700, lng: 7.045700, country: "DE" },
  dorsten: { lat: 51.663010, lng: 6.964950, country: "DE" },
  castrop: { lat: 51.550560, lng: 7.311250, country: "DE" },
  "castrop-rauxel": { lat: 51.550560, lng: 7.311250, country: "DE" },
  marl: { lat: 51.657000, lng: 7.090800, country: "DE" },
  gladbeck: { lat: 51.573920, lng: 6.986330, country: "DE" },
  arnsberg: { lat: 51.397100, lng: 8.070500, country: "DE" },
  bergheim: { lat: 50.955560, lng: 6.639170, country: "DE" },
  dinslaken: { lat: 51.567150, lng: 6.735320, country: "DE" },
  detmold: { lat: 51.938610, lng: 8.876780, country: "DE" },
  troisdorf: { lat: 50.813940, lng: 7.148970, country: "DE" },
  minden: { lat: 52.288810, lng: 8.914910, country: "DE" },
  viersen: { lat: 51.253889, lng: 6.394167, country: "DE" },
  hattingen: { lat: 51.398650, lng: 7.180400, country: "DE" },
  eschweiler: { lat: 50.818600, lng: 6.271300, country: "DE" },
  ahlen: { lat: 51.762680, lng: 7.891180, country: "DE" },
  herten: { lat: 51.596400, lng: 7.135200, country: "DE" },
  kerpen: { lat: 50.870278, lng: 6.694167, country: "DE" },
  wesel: { lat: 51.657200, lng: 6.617800, country: "DE" },
  kleve: { lat: 51.788610, lng: 6.138890, country: "DE" },
  euskirchen: { lat: 50.660278, lng: 6.789722, country: "DE" },
  gütersloh: { lat: 51.907199, lng: 8.378620, country: "DE" },
  guetersloh: { lat: 51.907199, lng: 8.378620, country: "DE" },
  unna: { lat: 51.535370, lng: 7.688640, country: "DE" },
  soest: { lat: 51.571000, lng: 8.106000, country: "DE" },
  meschede: { lat: 51.351320, lng: 8.283220, country: "DE" },
  brilon: { lat: 51.395420, lng: 8.568620, country: "DE" },
  olpe: { lat: 51.028180, lng: 7.850530, country: "DE" },
  "lippstadt": { lat: 51.674839, lng: 8.343580, country: "DE" },
  "lüdenscheid": { lat: 51.219960, lng: 7.626320, country: "DE" },
  luedenscheid: { lat: 51.219960, lng: 7.626320, country: "DE" },
  bergkamen: { lat: 51.617800, lng: 7.643690, country: "DE" },
  kamen: { lat: 51.590930, lng: 7.667340, country: "DE" },
  werl: { lat: 51.552980, lng: 7.913930, country: "DE" },
  "bad hersfeld": { lat: 50.868060, lng: 9.706670, country: "DE" },

  /* ── Österreich ──────────────────────────────────────────────── */
  wien: { lat: 48.208176, lng: 16.373819, country: "AT" },
  vienna: { lat: 48.208176, lng: 16.373819, country: "AT" },
  graz: { lat: 47.070714, lng: 15.439504, country: "AT" },
  linz: { lat: 48.306940, lng: 14.285830, country: "AT" },
  salzburg: { lat: 47.809490, lng: 13.055010, country: "AT" },
  innsbruck: { lat: 47.269212, lng: 11.404102, country: "AT" },
  klagenfurt: { lat: 46.624057, lng: 14.305591, country: "AT" },
  villach: { lat: 46.615910, lng: 13.855960, country: "AT" },
  wels: { lat: 48.156901, lng: 14.023950, country: "AT" },
  sankt_pölten: { lat: 48.204890, lng: 15.624690, country: "AT" },
  "st. pölten": { lat: 48.204890, lng: 15.624690, country: "AT" },

  /* ── Schweiz ─────────────────────────────────────────────────── */
  zürich: { lat: 47.376886, lng: 8.541694, country: "CH" },
  zuerich: { lat: 47.376886, lng: 8.541694, country: "CH" },
  zurich: { lat: 47.376886, lng: 8.541694, country: "CH" },
  genf: { lat: 46.204391, lng: 6.143158, country: "CH" },
  geneva: { lat: 46.204391, lng: 6.143158, country: "CH" },
  basel: { lat: 47.559599, lng: 7.588576, country: "CH" },
  bern: { lat: 46.947970, lng: 7.447447, country: "CH" },
  lausanne: { lat: 46.519962, lng: 6.633597, country: "CH" },
  luzern: { lat: 47.050168, lng: 8.309307, country: "CH" },
  lucerne: { lat: 47.050168, lng: 8.309307, country: "CH" },
  winterthur: { lat: 47.499523, lng: 8.724203, country: "CH" },
  "st. gallen": { lat: 47.424479, lng: 9.376717, country: "CH" },
};

function normalizeCityKey(input: string): string {
  return (input || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Statisches Lookup — schnell, offline, kostenlos. */
export function geocodeStatic(city: string): GeoPoint | null {
  const key = normalizeCityKey(city);
  const hit = STATIC_DACH[key];
  if (!hit) return null;
  return { lat: hit.lat, lng: hit.lng, city, country: hit.country, source: "static" };
}

/**
 * Google-Places-Text-Search-basiertes Geocoding (kostenpflichtig,
 * benötigt `GOOGLE_PLACES_API_KEY`). Wir cachen das Ergebnis nicht
 * hier — Caller ist dafür verantwortlich (z. B. `geocode_cache`-Tabelle
 * oder Redis).
 */
export async function geocodeViaGooglePlaces(city: string): Promise<GeoPoint | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return null;
  const body = { textQuery: city, pageSize: 1 };
  const correlationId = newCorrelationId("geocode-google");
  try {
    const endpoint = "https://places.googleapis.com/v1/places:searchText";
    const resp = await executeControlledProviderCall({
      provider: "google_places",
      endpoint,
      idempotencyKey: correlationId,
      estimatedCostCents: 3,
      correlationId,
      operation: () => fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "places.location,places.displayName,places.addressComponents",
        },
        body: JSON.stringify(body),
      }),
      describe: (response, elapsedMs) => ({
        success: response.ok,
        latencyMs: elapsedMs,
        responseStatus: response.status,
        actualCostCents: 0,
        error: response.ok ? null : `HTTP ${response.status}`,
      }),
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as {
      places?: Array<{
        location?: { latitude?: number; longitude?: number };
        displayName?: { text?: string };
        addressComponents?: Array<{ types?: string[]; shortText?: string }>;
      }>;
    };
    const p = json.places?.[0];
    if (!p?.location?.latitude || !p?.location?.longitude) return null;
    const country =
      p.addressComponents?.find((c) => c.types?.includes("country"))?.shortText?.toUpperCase() ??
      "DE";
    return {
      lat: p.location.latitude,
      lng: p.location.longitude,
      city: p.displayName?.text ?? city,
      country,
      source: "google_places",
    };
  } catch {
    return null;
  }
}

/**
 * OSM Nominatim (öffentlicher Endpoint, keine Registrierung,
 * Nutzungsbedingungen erwartet identifizierenden User-Agent).
 * Fallback für Städte, die nicht in der statischen Tabelle stehen —
 * insbesondere Kleinstädte, Landkreise, Ortsteile.
 */
export async function geocodeViaNominatim(query: string): Promise<GeoPoint | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=de,at,ch&q=${encodeURIComponent(query)}`;
  const correlationId = newCorrelationId("geocode-nominatim");
  try {
    const resp = await executeControlledProviderCall({
      provider: "nominatim",
      endpoint: "https://nominatim.openstreetmap.org/search",
      idempotencyKey: correlationId,
      estimatedCostCents: 0,
      correlationId,
      operation: () => fetch(url, {
        headers: {
          "User-Agent": "NEXCEL-SalesIntel/1.0 (+https://nexcel.ai/bot)",
          "Accept-Language": "de,en;q=0.7",
        },
        signal: AbortSignal.timeout(8_000),
      }),
      describe: (response, elapsedMs) => ({
        success: response.ok,
        latencyMs: elapsedMs,
        responseStatus: response.status,
        actualCostCents: 0,
        error: response.ok ? null : `HTTP ${response.status}`,
      }),
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
      address?: { country_code?: string; city?: string; town?: string; village?: string };
    }>;
    const first = json[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const country = (first.address?.country_code ?? "de").toUpperCase();
    const cityName = first.address?.city ?? first.address?.town ?? first.address?.village ?? query;
    return { lat, lng, city: cityName, country, source: "static" };
  } catch {
    return null;
  }
}

/**
 * Combines the static lookup with the Nominatim fallback. Google Places
 * is only used when explicitly konfiguriert. Ergebnisse werden in der
 * Postgres-Tabelle `sales_target_geocode_cache` persistiert.
 * Never throws — returns `null` when the city cannot be resolved.
 */
export async function geocodeCity(city: string): Promise<GeoPoint | null> {
  const trimmed = (city ?? "").trim();
  if (!trimmed) return null;

  // 1) Postgres-Cache — vermeidet jede externe Anfrage.
  try {
    const { getGeocodeFromCache, putGeocodeToCache } = await import("./geocacheStore");
    const cached = await getGeocodeFromCache(trimmed);
    if (cached) {
      return {
        lat: cached.lat,
        lng: cached.lng,
        city: cached.displayName,
        country: cached.country ?? "DE",
        source: cached.source === "google_places" ? "google_places" : "static",
      };
    }

    // 2) Statische DACH-Tabelle — sub-millisecond, offline.
    const staticHit = geocodeStatic(trimmed);
    if (staticHit) {
      await putGeocodeToCache({
        query: trimmed,
        lat: staticHit.lat,
        lng: staticHit.lng,
        displayName: staticHit.city,
        country: staticHit.country,
        source: "static",
      });
      return staticHit;
    }

    // 3) OSM Nominatim — freier Fallback für Klein-/Landgemeinden.
    const nominatim = await geocodeViaNominatim(trimmed);
    if (nominatim) {
      await putGeocodeToCache({
        query: trimmed,
        lat: nominatim.lat,
        lng: nominatim.lng,
        displayName: nominatim.city,
        country: nominatim.country,
        source: "nominatim",
      });
      return nominatim;
    }

    // 4) Google Places — nur wenn explizit konfiguriert (opt-in).
    const gp = await geocodeViaGooglePlaces(trimmed);
    if (gp) {
      await putGeocodeToCache({
        query: trimmed,
        lat: gp.lat,
        lng: gp.lng,
        displayName: gp.city,
        country: gp.country,
        source: "google_places",
      });
    }
    return gp;
  } catch {
    // External calls fail closed when durable budget state is unavailable.
    return geocodeStatic(trimmed);
  }
}

/**
 * Deckt eine Kreisfläche mit einem sechseckigen Tile-Gitter ab, damit
 * wir für Radien > 50 km sinnvoll mehrere Discovery-Calls ansetzen
 * können. Google Places begrenzt Text-Search auf max. 50 km Radius.
 *
 * Rückgabe: Array von Tile-Zentren mit dem effektiv gewählten Tile-Radius.
 */
export interface Tile {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

export function tileArea(
  center: { lat: number; lng: number },
  totalRadiusKm: number,
  tileRadiusKm = 25
): Tile[] {
  if (totalRadiusKm <= tileRadiusKm) {
    return [{ centerLat: center.lat, centerLng: center.lng, radiusKm: totalRadiusKm }];
  }
  // Für ein Sechsecknetz ist der Abstand zwischen Nachbar-Zentren ≈ √3 * r.
  const step = tileRadiusKm * Math.sqrt(3);
  const tiles: Tile[] = [];
  const latStep = step / 111;
  // rows-Range: wir wollen die gesamte Kreisfläche abdecken.
  const rows = Math.ceil(totalRadiusKm / step) * 2 + 1;
  for (let row = -rows; row <= rows; row++) {
    const rowLat = center.lat + row * latStep;
    const cosLat = Math.max(0.1, Math.cos((rowLat * Math.PI) / 180));
    const lngStep = step / (111 * cosLat);
    // Versatz für hexagonales Gitter
    const offset = row % 2 === 0 ? 0 : lngStep / 2;
    const cols = Math.ceil(totalRadiusKm / step) * 2 + 1;
    for (let col = -cols; col <= cols; col++) {
      const lng = center.lng + col * lngStep + offset;
      // Nur Tiles einschließen, deren Zentrum innerhalb der Gesamt-Fläche liegt.
      const dist = haversineKm({ lat: center.lat, lng: center.lng }, { lat: rowLat, lng });
      if (dist <= totalRadiusKm) {
        tiles.push({ centerLat: rowLat, centerLng: lng, radiusKm: tileRadiusKm });
      }
    }
  }
  // Immer mindestens das Zentrum enthalten.
  if (tiles.length === 0) {
    tiles.push({ centerLat: center.lat, centerLng: center.lng, radiusKm: tileRadiusKm });
  }
  return tiles;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
