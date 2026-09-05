# Revenue acquisition runbook

This runbook controls production evidence collection. Configured limits and
synthetic fixtures are never reported as measured capacity.

## Provider portfolio

- `google_places`: optional paid source; requires `GOOGLE_PLACES_API_KEY`,
  approved budget and Google Maps Platform retention compliance.
- `overpass_osm`: keyless ODbL source; one bounded, DNS-pinned network call per
  atomic reservation. Attribution: © OpenStreetMap contributors.
- `wikidata`: keyless CC0 fallback through the public Wikidata Query Service.
  Disable with `WIKIDATA_DISCOVERY_ENABLED=false`.
- Controlled imports use the import-provider boundary and the same evidence,
  normalization and entity-resolution path. CSV rows never bypass ingestion.

Public endpoints are shared infrastructure. Keep
`DISCOVERY_MAX_PROVIDER_ATTEMPTS` at or below three. Provider health starts as
`UNKNOWN`; only observed calls can make it `HEALTHY`.

## Staged canary

Use an isolated PostgreSQL database first:

```sh
CANARY_PARTITIONS=1 CANARY_COMPANIES_PER_PARTITION=5 \
  npm exec tsx scripts/db/with-disposable-postgres.ts npm run canary:providers
```

Inspect provider attempts, fallback reasons, contract rejects, raw yield,
canonical-new yield, duplicate rate, qualification reasons, verified
contactability, worker latency and actual cost. Increase deliberately to 3, 6,
12 and at most 24 partitions; do not jump stages.

Stop immediately when any of these occurs:

- three consecutive acquisition slices have no successful source/yield;
- cost exceeds `CANARY_MAX_COST_CENTS`;
- terms, attribution, retention or authorization are uncertain;
- malformed-response, wrong-country, false-merge or false-qualification rates
  breach the approved quality gate;
- provider rate limiting or queue age makes continued calls harmful;
- any secret, PII or unapproved raw payload appears in logs.

## Rollback and recovery

1. Disable the affected provider through the provider-control endpoint.
2. Roll back provider, qualification or scoring canaries through
   `/api/admin/sales/targets/control/rollouts`.
3. Let active leases expire; recovery uses token-guarded reclaim and
   `SKIP LOCKED`. Never delete active jobs to recover a worker.
4. Reconcile expired provider reservations before resuming.
5. For a bad merge, use merge-ledger undo/split. Never rewrite provenance or
   remove raw observations to conceal a resolution error.

## Golden Dataset

Open a target in Admin → Vertrieb → Zielkunden → Qualitätsreview. A complete
review requires labels for company validity, identity, canonical name,
geography, phone, email, decision maker, website, target fit, qualification,
provenance and sales usability. Only then can the server mark the target as
Golden. `UNKNOWN` is valid evidence; a missing label is not.

The release-size gate remains open until 500–1,000 representative, human-
reviewed records exist. Synthetic fixtures are retained only for deterministic
regression testing.

## Capacity reporting

Report:

`observed successful requests/hour × accepted raw/request × canonical-new rate
× qualification rate × contactability/sales-ready rate`

with sample count, observation window, freshness and confidence interval.
If any factor is missing or stale, return `INSUFFICIENT_EVIDENCE`. Backlog age,
budget exhaustion and circuit state may only reduce requested concurrency; they
must never be converted into claimed leads/day.
