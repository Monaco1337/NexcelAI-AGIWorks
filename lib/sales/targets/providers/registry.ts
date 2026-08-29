/**
 * Provider-Registry.
 *
 * Zentraler Zugriffspunkt für Discovery-Provider. Neue Provider werden
 * hier registriert. Reihenfolge in `getConfiguredDiscoveryProviders()`
 * bestimmt Bevorzugung — der erste konfigurierte Provider wird zuerst
 * genutzt, weitere ergänzen.
 */

import type { DiscoveryProvider } from "./types";
import { GooglePlacesProvider } from "./googlePlacesProvider";
import { OverpassProvider } from "./overpassProvider";

let cachedProviders: DiscoveryProvider[] | null = null;

export function getDiscoveryProviders(): DiscoveryProvider[] {
  if (cachedProviders) return cachedProviders;
  // Reihenfolge = Priorität. Google Places liefert die reichhaltigsten
  // Business-Signale (Rating, Reviews, business_status), Overpass ist
  // der kostenlose Fallback für DACH und läuft parallel — beide
  // Ergebnisse werden anschließend fingerprint-basiert dedupliziert.
  cachedProviders = [new GooglePlacesProvider(), new OverpassProvider()];
  return cachedProviders;
}

export function getConfiguredDiscoveryProviders(): DiscoveryProvider[] {
  return getDiscoveryProviders().filter((p) => p.isConfigured());
}

export function providerStatus(): Array<{ key: string; label: string; configured: boolean; note?: string }> {
  return getDiscoveryProviders().map((p) => ({
    key: p.key,
    label: p.label,
    configured: p.isConfigured(),
    note: p.isConfigured() ? undefined : noteForProvider(p.key),
  }));
}

function noteForProvider(key: string): string {
  switch (key) {
    case "google_places":
      return "Optional: GOOGLE_PLACES_API_KEY setzen für Ratings, Reviews und höhere Trefferqualität";
    case "overpass_osm":
      return "Deaktiviert via DISABLE_OVERPASS_DISCOVERY=1";
    default:
      return `Setze Umgebungsvariable ${key.toUpperCase()}_API_KEY`;
  }
}
