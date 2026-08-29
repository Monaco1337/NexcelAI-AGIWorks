/**
 * Google Places Discovery-Provider.
 *
 * Aktiv, wenn `GOOGLE_PLACES_API_KEY` gesetzt ist. Verwendet die
 * Text-Search + Details-Endpoints. Ohne Key liefert `discover()` eine
 * leere Antwort mit einem klaren `providerLogs`-Eintrag, damit die
 * Pipeline im UI kommuniziert: „Provider nicht konfiguriert".
 *
 * Wir speichern Rohdaten NICHT im Klartext, sondern extrahieren nur
 * die Felder, die wir tatsächlich brauchen (Datensparsamkeit).
 */

import type { DiscoveredCompanyStub, DiscoveryProvider, DiscoveryRequest, DiscoveryResponse } from "./types";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

const REQUIRED_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.primaryType",
  "places.regularOpeningHours",
];

export class GooglePlacesProvider implements DiscoveryProvider {
  key = "google_places";
  label = "Google Places";
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || null;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async discover(request: DiscoveryRequest): Promise<DiscoveryResponse> {
    const providerLogs: DiscoveryResponse["providerLogs"] = [];
    if (!this.apiKey) {
      providerLogs.push({
        provider: this.key,
        endpoint: BASE_URL,
        latencyMs: 0,
        ok: false,
        error: "GOOGLE_PLACES_API_KEY nicht gesetzt",
      });
      return { companies: [], estimatedCostCents: 0, actualCostCents: 0, providerLogs };
    }

    const textQuery = buildTextQuery(request);
    const body: Record<string, unknown> = {
      textQuery,
      pageSize: Math.min(20, request.limit),
    };
    if (request.centerLat !== null && request.centerLng !== null) {
      body.locationBias = {
        circle: {
          center: { latitude: request.centerLat, longitude: request.centerLng },
          radius: Math.max(100, Math.min(50000, request.radiusKm * 1000)),
        },
      };
    }

    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": REQUIRED_FIELDS.join(","),
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      providerLogs.push({
        provider: this.key,
        endpoint: BASE_URL,
        latencyMs: Date.now() - started,
        ok: false,
        error: `Fetch-Fehler: ${(err as Error).message}`,
      });
      return { companies: [], estimatedCostCents: 0, actualCostCents: 0, providerLogs };
    }
    const latency = Date.now() - started;

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      providerLogs.push({
        provider: this.key,
        endpoint: BASE_URL,
        latencyMs: latency,
        ok: false,
        error: `HTTP ${response.status}: ${errBody.slice(0, 200)}`,
      });
      return { companies: [], estimatedCostCents: 0, actualCostCents: 0, providerLogs };
    }

    interface PlacesResponse {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        internationalPhoneNumber?: string;
        nationalPhoneNumber?: string;
        websiteUri?: string;
        rating?: number;
        userRatingCount?: number;
        primaryType?: string;
        businessStatus?: string;
        regularOpeningHours?: unknown;
      }>;
    }

    const json = (await response.json().catch(() => ({}))) as PlacesResponse;
    providerLogs.push({ provider: this.key, endpoint: BASE_URL, latencyMs: latency, ok: true });

    const companies: DiscoveredCompanyStub[] = (json.places ?? [])
      .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
      .map((p) => {
        const name = p.displayName?.text ?? "";
        const website = p.websiteUri ?? null;
        const phone = p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null;
        const address = p.formattedAddress ?? null;
        const { city, postalCode, region, country } = parseFormattedAddress(address);
        const distanceKm =
          request.centerLat !== null && request.centerLng !== null && p.location?.latitude && p.location?.longitude
            ? haversineKm(request.centerLat, request.centerLng, p.location.latitude, p.location.longitude)
            : null;
        return {
          name,
          website,
          phone,
          addressLine: address,
          postalCode,
          city,
          region,
          country: country ?? request.country,
          latitude: p.location?.latitude ?? null,
          longitude: p.location?.longitude ?? null,
          distanceKm,
          googlePlaceId: p.id ?? null,
          googleRating: p.rating ?? null,
          reviewCount: p.userRatingCount ?? null,
          industry: p.primaryType ?? null,
          provider: this.key,
          providerSourceUrl: p.id ? `https://www.google.com/maps/place/?q=place_id:${p.id}` : null,
          providerRawId: p.id ?? null,
          confidence: 0.9,
        };
      })
      .slice(0, request.limit);

    return {
      companies,
      estimatedCostCents: companies.length * 3,
      actualCostCents: companies.length * 3,
      providerLogs,
    };
  }
}

function buildTextQuery(request: DiscoveryRequest): string {
  const industry = request.industries.length ? request.industries.join(" ") : "";
  const location = request.city ?? "";
  return [industry, "in", location].filter(Boolean).join(" ").trim() || "Unternehmen";
}

function parseFormattedAddress(input: string | null): {
  city: string | null;
  postalCode: string | null;
  region: string | null;
  country: string | null;
} {
  if (!input) return { city: null, postalCode: null, region: null, country: null };
  const parts = input.split(",").map((p) => p.trim());
  const country = parts.length > 0 ? (parts[parts.length - 1] || null) : null;
  let city: string | null = null;
  let postalCode: string | null = null;
  for (const part of parts) {
    const m = part.match(/^(\d{4,5})\s+(.+)$/);
    if (m) {
      postalCode = m[1];
      city = m[2];
      break;
    }
  }
  if (!city && parts.length >= 2) city = parts[parts.length - 2] ?? null;
  return { city, postalCode, region: null, country };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
