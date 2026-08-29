/**
 * Zielkunden – Production-Hardening (Phase 2).
 *
 * Deterministische Unit-Tests für die neuen Kernbausteine, die ohne
 * Datenbank auskommen:
 *
 *  - Error-Taxonomy (TargetError, toTargetError, newCorrelationId)
 *  - Source-Authority-Matrix (pickAuthoritative, effectiveAuthority)
 *  - Staleness-Policies (decideFreshness)
 *  - Contactability-Score (deterministisch, UNKNOWN-Semantik)
 *  - Propensity-Score (UNKNOWN vs. 0-Semantik)
 *
 * Ausführung: `npx tsx tests/sales/targetHardening.test.ts`.
 */

import { TargetError, toTargetError, newCorrelationId } from "../../lib/sales/targets/errors";
import { pickAuthoritative, effectiveAuthority } from "../../lib/sales/targets/sourceAuthority";
import { decideFreshness, freshnessPolicy } from "../../lib/sales/targets/staleness";
import { computeContactability } from "../../lib/sales/targets/contactability";
import { computePropensity } from "../../lib/sales/targets/propensity";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

async function main(): Promise<void> {
  /* ---------------------- Error-Taxonomy ---------------------- */
  const err = new TargetError("PROVIDER_RATE_LIMITED", "test", { correlationId: "trc_x" });
  assert(err.code === "PROVIDER_RATE_LIMITED", "Error-Code korrekt");
  assert(err.httpStatus === 429, "Rate-Limit ist HTTP 429");
  const wrapped = toTargetError(new Error("foo"), "PARSE_FAILED");
  assert(wrapped.code === "PARSE_FAILED", "toTargetError setzt fallback code");
  const passthrough = toTargetError(err);
  assert(passthrough === err, "TargetError bleibt referentiell identisch");
  const cid = newCorrelationId("test");
  assert(cid.startsWith("test_") && cid.length > 8, `correlationId sinnvoll (${cid})`);

  /* ---------------------- Source-Authority -------------------- */
  const decision = pickAuthoritative<string>([
    {
      value: "old-registry-name",
      provider: "registry",
      field: "legal_form",
      retrievedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      value: "aggregator-name",
      provider: "aggregator",
      field: "legal_form",
      retrievedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
  ]);
  assert(decision !== null, "Autoritativer Kandidat gefunden");
  // Registry (1.00 + Feld-Bonus) schlägt Aggregator (0.40) auch dann,
  // wenn Aggregator jünger ist. Kein Konflikt, weil der Abstand > 0.05 ist.
  assert(decision!.chosen.value === "old-registry-name", `Registry-Autorität gewinnt (${decision!.chosen.value})`);
  assert(!decision!.conflicting, "Kein Konflikt bei großer Autoritäts-Differenz");

  // Konflikt: zwei ähnlich starke Quellen mit unterschiedlichem Wert
  const conflict = pickAuthoritative<string>([
    {
      value: "030 12345",
      provider: "google_places",
      field: "phone",
      retrievedAt: new Date().toISOString(),
    },
    {
      value: "030 67890",
      provider: "impressum",
      field: "phone",
      retrievedAt: new Date().toISOString(),
    },
  ]);
  // Impressum sollte gewinnen (0.99 + 0.03 vs 0.90 + 0.02). Aber Delta > 0.05.
  assert(conflict!.chosen.provider === "impressum", "Impressum autoritativer bei Phone");

  const auth = effectiveAuthority({
    provider: "manual",
    field: "phone",
    retrievedAt: new Date().toISOString(),
    verificationStatus: "verified",
  });
  assert(auth >= 0.95, `manual+verified >= 0.95 (${auth})`);

  const authLow = effectiveAuthority({
    provider: "aggregator",
    field: "phone",
    retrievedAt: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString(),
    verificationStatus: "conflicting",
  });
  assert(authLow < 0.35, `Aggregator+alt+conflicting < 0.35 (${authLow})`);

  /* ---------------------- Staleness --------------------------- */
  assert(freshnessPolicy("website_audit").ttlSeconds > 0, "Website-Audit-TTL definiert");
  const fresh = decideFreshness("website_audit", new Date().toISOString());
  assert(fresh.action === "skip", "Frisches Audit wird geskippt");
  const stale = decideFreshness(
    "website_audit",
    new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString()
  );
  assert(stale.action === "run", "Altes Audit wird erneut ausgeführt");
  const forced = decideFreshness("website_audit", new Date().toISOString(), { force: true });
  assert(forced.action === "run", "force überschreibt Freshness");
  const nullState = decideFreshness("website_audit", null);
  assert(nullState.action === "run", "Ohne bisherigen Run → run");

  /* ---------------------- Contactability ---------------------- */
  // Reichhaltiger Datensatz: mehrere Kontakte + Decision-Maker mit Business-Contact.
  const contactability = computeContactability({
    contacts: [
      { kind: "phone", value: "+49 30 111111", verificationStatus: "verified" } as any,
      { kind: "email", value: "info@example.de", classification: "role_based", verificationStatus: "verified" } as any,
      { kind: "contact_form", value: "/kontakt", verificationStatus: "medium" } as any,
    ],
    decisionMakers: [
      { name: "M. Meyer", businessEmail: "m.meyer@example.de", businessPhone: null, businessMobile: null } as any,
    ],
  });
  assert(contactability.score >= 40, `Contactability >= 40 (${contactability.score})`);

  // Leerer Datensatz: 0, aber nicht negativ
  const contactabilityLow = computeContactability({ contacts: [], decisionMakers: [] });
  assert(contactabilityLow.score === 0, "Ohne Kontakte → 0");

  /* ---------------------- Propensity -------------------------- */
  const stubCompany = {
    id: "t1",
    name: "Test GmbH",
    industry: null,
    website: null,
    domain: null,
    phone: null,
    email: null,
    city: null,
    postalCode: null,
    addressLine: null,
    region: null,
    country: "DE",
    latitude: null,
    longitude: null,
    distanceKm: null,
    foundedYear: null,
    employeeEstimateMin: null,
    employeeEstimateMax: null,
    reviewCount: null,
    googleRating: null,
    doNotContact: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  } as any;

  // Ohne Signale muss Propensity UNKNOWN (null) sein — NICHT 0. Das ist
  // die zentrale Anforderung aus Phase 39 ("no-data semantics").
  const propensityUnknown = computePropensity({ company: stubCompany, audit: null, signals: [] });
  assert(propensityUnknown.score === null, `Ohne Signale → UNKNOWN (null), nicht 0 (${propensityUnknown.score})`);

  // Mit Signal: Propensity-Score wird berechnet
  const propensity = computePropensity({
    company: stubCompany,
    audit: {
      id: "wa1",
      targetId: "t1",
      auditedAt: new Date().toISOString(),
      websiteScore: 85,
      performanceScore: null,
      seoScore: null,
      mobileScore: null,
      conversionScore: null,
      trustScore: null,
      designScore: null,
      technologyScore: null,
      findings: [],
      technologies: [],
      httpStatus: 200,
      finalUrl: "https://example.de",
      snapshotHash: "x",
    } as any,
    signals: [],
  });
  assert(typeof propensity.score === "number" && propensity.score !== null, "Mit Signalen → Score gesetzt");

  console.log("OK · Zielkunden-Hardening");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
