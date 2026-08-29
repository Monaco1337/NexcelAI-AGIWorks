/**
 * Provider-Interfaces für Zielkunden-Discovery und -Enrichment.
 *
 * Jeder Provider ist austauschbar. In der Erstversion existiert ein
 * `GooglePlacesDiscoveryProvider` (optional aktiv via ENV) und ein
 * eingebauter `WebsiteFetcher`, der die interne `safeFetch`-Pipeline
 * verwendet.
 *
 * Wichtige Konventionen:
 *  - Provider müssen selbst signalisieren, ob sie konfiguriert sind
 *    (`isConfigured`); die Pipeline fragt vor Aufruf ab.
 *  - Provider dürfen niemals Mock-Daten liefern; wenn nichts vorhanden
 *    ist, geben sie `[]` zurück. Confidence bleibt ehrlich.
 *  - Cost-Tracking läuft via `estimatedCost`; die Pipeline logt die
 *    tatsächlich abgerechneten Kosten in `sales_target_provider_requests`.
 */

export interface DiscoveredCompanyStub {
  name: string;
  legalName?: string | null;
  legalForm?: string | null;
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
  industry?: string | null;
  subIndustry?: string | null;
  googlePlaceId?: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  provider: string;
  providerSourceUrl?: string | null;
  providerRawId?: string | null;
  confidence: number;
}

export interface DiscoveryRequest {
  city: string | null;
  country: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number;
  industries: string[];
  categories: string[];
  limit: number;
  depth: "QUICK" | "STANDARD" | "DEEP";
}

export interface DiscoveryResponse {
  companies: DiscoveredCompanyStub[];
  estimatedCostCents: number;
  actualCostCents: number;
  providerLogs: Array<{ provider: string; endpoint: string; latencyMs: number; ok: boolean; error?: string }>;
}

export interface DiscoveryProvider {
  key: string;
  label: string;
  isConfigured(): boolean;
  discover(request: DiscoveryRequest): Promise<DiscoveryResponse>;
}
