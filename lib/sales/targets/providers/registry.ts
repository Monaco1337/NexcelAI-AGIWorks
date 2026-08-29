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

let cachedProviders: DiscoveryProvider[] | null = null;

export function getDiscoveryProviders(): DiscoveryProvider[] {
  if (cachedProviders) return cachedProviders;
  cachedProviders = [new GooglePlacesProvider()];
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
    note: p.isConfigured() ? undefined : `Setze Umgebungsvariable ${envVarForProvider(p.key)}`,
  }));
}

function envVarForProvider(key: string): string {
  switch (key) {
    case "google_places":
      return "GOOGLE_PLACES_API_KEY";
    default:
      return key.toUpperCase() + "_API_KEY";
  }
}
