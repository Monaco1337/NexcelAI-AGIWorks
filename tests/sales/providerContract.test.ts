import assert from "node:assert/strict";
import { normalizeProviderCompany } from "../../lib/sales/targets/providers/execution";
import { WikidataProvider } from "../../lib/sales/targets/providers/wikidataProvider";
import type {
  DiscoveryProvider,
  DiscoveryRequest,
} from "../../lib/sales/targets/providers/types";

const provider = new WikidataProvider();
const request: DiscoveryRequest = {
  city: null,
  country: "DE",
  centerLat: null,
  centerLng: null,
  radiusKm: 0,
  industries: [],
  categories: [],
  limit: 20,
  depth: "STANDARD",
  bbox: { south: 51, west: 7, north: 51.5, east: 7.5 },
  tagAxis: "office",
};

assert.equal(provider.isConfigured(), true);
assert.equal(provider.supports(request), true);
assert.equal(provider.supports({ ...request, bbox: null }), false);

const valid = normalizeProviderCompany(
  provider,
  {
    provider: "wikidata",
    providerRawId: "Q123",
    name: "  Muster GmbH  ",
    legalName: "Muster GmbH",
    legalForm: "GmbH",
    addressLine: "Musterstraße 1",
    postalCode: "44135",
    city: "Dortmund",
    region: "Nordrhein-Westfalen",
    country: "de",
    latitude: 51.5136,
    longitude: 7.4653,
    website: "https://www.muster.example/about",
    confidence: 0.8,
  },
  "2026-09-05T12:00:00.000Z",
);
assert(valid, "valid provider record was rejected");
assert.equal(valid.normalizedName, "muster");
assert.equal(valid.domain, "muster.example");
assert.equal(valid.country, "DE");
assert.equal(valid.providerVersion, "adapter-v1");
assert.equal(valid.fetchedAt, "2026-09-05T12:00:00.000Z");

assert.equal(
  normalizeProviderCompany(provider, {
    provider: "overpass_osm",
    name: "Wrong source",
    confidence: 0.8,
  }),
  null,
  "cross-provider payload must be rejected",
);
assert.equal(
  normalizeProviderCompany(provider, {
    provider: "wikidata",
    name: "",
    confidence: 0.8,
  }),
  null,
  "empty company name must be rejected",
);
assert.equal(
  normalizeProviderCompany(provider, {
    provider: "wikidata",
    name: "Invalid confidence",
    confidence: 2,
  }),
  null,
  "out-of-range confidence must be rejected",
);

const incompleteProvider = {
  ...provider,
  key: "other",
} as DiscoveryProvider;
assert.equal(
  normalizeProviderCompany(incompleteProvider, {
    provider: "other",
    name: "Valid Other",
    country: "DE",
    confidence: 0.5,
  }),
  null,
  "metadata and payload provider identity must remain contract-valid",
);

console.log("OK: provider observation contract");
