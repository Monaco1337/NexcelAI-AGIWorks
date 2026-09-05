# Sales Target Intelligence — as-is baseline

Status: repository inspection on 2026-09-05. This document describes verified
source code only. It does not claim production database state, throughput,
provider capacity, data quality, or migration status.

## Runtime and deployment

- Next.js 14 App Router, React 18, strict TypeScript and Vercel serverless.
- PostgreSQL access uses `postgres.js` through `lib/pg.ts`.
- TypeScript migrations `0001`–`0027` are registered by
  `lib/db/migrations/index.ts`; the sales schema is not defined by Prisma.
- Vercel Cron calls the catalog tick every five minutes. Search jobs have
  PostgreSQL leases; the existing enrichment flow historically had incomplete
  scheduling/recovery.
- Admin API authorization is route-local and centralized through
  `lib/auth/authorize.ts` permissions.

## Current sales-target flow

1. Optional Google Places, Overpass and Wikidata adapters form a bounded
   discovery portfolio. Provider compatibility is checked before routing.
2. Every external provider attempt crosses the atomic reservation boundary.
   Overpass performs one DNS-pinned HTTP call per reservation; fallback
   attribution is stored in `sales_target_provider_requests`.
3. Provider records are validated against the V1 observation contract before
   catalog bulk ingestion writes raw evidence, normalized candidates, identity
   claims and canonical `sales_target_companies`.
4. Contacts, sources, decision makers, audits, opportunities, financial
   signals, scores, briefs, activities, outcomes and evaluations are stored in
   related `sales_target_*` tables.
5. Enrichment jobs execute cheap phases first. Expensive phases are skipped
   with persisted reasons when deterministic gates fail.
6. The Admin → Vertrieb → Zielkunden UI reads list, detail and metrics routes
   and can convert a target into the downstream CRM.

## Assets to keep

- PostgreSQL as transactional source of truth and bounded serverless workers.
- Existing target and CRM lifecycle separation.
- Provider adapters, NRW segmentation, category mapping and pre-score.
- Provenance-related tables, deterministic website audit, contact extraction,
  SSRF guards, score history, outcomes and centralized RBAC.
- Existing Admin visual language and route hierarchy.

## Remaining evidence gaps

- A 500–1,000 record Golden Dataset is not complete until human reviewers have
  submitted the required labels. Synthetic identity fixtures are regression
  data, not production ground truth.
- Sustainable qualified-net-new throughput remains `INSUFFICIENT_EVIDENCE`
  until repeated live canaries provide observed provider, canonicalization,
  qualification, contactability and worker-service rates.
- Wikidata and Overpass are shared public services. Their observed health and
  fair-use limits, not configured concurrency, constrain discovery capacity.
- Optional Google Places production availability remains unknown until an
  approved credential, budget and terms review are present.

## Baseline evidence commands

Run from the repository root:

```sh
npm ci
npm run typecheck
npm run lint
npm run test:sales
npm run test:security
npm run test:db-disposable
npm run build
```

`test:db-disposable` provisions an isolated local PostgreSQL cluster and must
not point at production. Live acquisition remains a separate, staged command:
start with `CANARY_PARTITIONS=1 npm run canary:providers`, inspect stop
conditions and persisted evidence, then increase the sample deliberately.

## Runtime evidence still required

- Applied migration versions and exact production schema shape.
- Company/observation/job counts, oldest queue age and stranded leases.
- Query plans and p50/p95/p99 latency for list, count and metrics routes.
- Provider credentials, quotas, licensing/retention terms, success/yield,
  duplicate rate and attributable billed cost.
- Exact business qualification policy, quality guardrails, timezone and data
  retention periods.
- Whether the approved provider portfolio can sustainably produce the desired
  daily qualified-net-new target.

Unknown values must remain `unknown` or `insufficient_evidence`; fixture or
insert counts must not be reported as qualified leads or production capacity.
