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
  /** Filiale einer ueberregionalen Kette (siehe detectChain). */
  isChain?: boolean;
}

/**
 * Geografischer Ausschnitt für Bulk-Discovery.
 *
 * Provider, die Bounding-Boxes unterstützen (Overpass), liefern damit
 * um Größenordnungen mehr Treffer pro Request als eine Umkreissuche:
 * gemessen 4.000 Elemente in 11,4 s gegenüber 100 Elementen in 12,3 s
 * bei `around:25000`. Deshalb ist bbox der bevorzugte Pfad, sobald er
 * gesetzt ist; `centerLat`/`centerLng`/`radiusKm` bleiben der Standard
 * für die interaktive Umkreissuche.
 */
export interface DiscoveryBBox {
  south: number;
  west: number;
  north: number;
  east: number;
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
  /** Wenn gesetzt, hat der bbox-Pfad Vorrang vor der Umkreissuche. */
  bbox?: DiscoveryBBox | null;
  /**
   * Beschränkt die Discovery auf genau eine OSM-Tag-Achse
   * (`shop`, `craft`, `office`, …). Nur für segmentierte Bulk-Läufe;
   * ohne Angabe werden die Standard-Achsen des Providers verwendet.
   */
  tagAxis?: string | null;
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
