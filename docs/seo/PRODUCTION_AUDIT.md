# Production Audit & Go-Live (Phase 9)

The final audit aggregates system-level invariants on top of the individual
guards and produces a GO / NO-GO verdict.

- Readiness invariants: `lib/seo/auditReport.ts` — `npm run seo:readiness`
- Full audit (all 18 checks + verdict): `npm run seo:all` / `npm run seo:audit`

## Automated go-live invariants (blockers)

| Code | Invariant |
| --- | --- |
| `READINESS_INDEXABLE_FAILS_GATE` | Every registry-indexable page also passes the LIVE quality gate (score ≥ type threshold, 0 content blockers). |
| `READINESS_CANONICAL_HOST` | Every indexable page's canonical host equals its own brand host. |
| `READINESS_NO_INDEXABLE` | Each brand has ≥ 1 indexable page (sitemap never empty). |
| `READINESS_CANDIDATE_INDEXED` | No money/location/knowledge page is indexable without approval + manual clearance. |

The readiness check also prints counts per brand and per type (indexable vs
candidate) and a `READINESS_GO` verdict when there are no blockers.

## How `seo:all` gates deploy

`npm run seo:all` runs all 18 checks. Any blocker → exit 1 and
`GO-LIVE VERDICT: NO-GO`. Zero blockers → exit 0 and
`GO-LIVE VERDICT: GO (pending manual deploy checklist)`.

## Manual go-live checklist (not automatable)

`READINESS_MANUAL_STEP` is a standing reminder. Before flipping any page to
indexed:

1. `npm run seo:all` is green (GO verdict).
2. Verify `robots.txt` and `sitemap.xml` respond per host (nexcelai.de vs
   agiworks.de) — see `DEPLOYMENT_CHECKLIST.md`.
3. Confirm the middleware 301s cross-domain paths (no `/agiworks` leakage on
   nexcelai.de and vice versa).
4. Only then set `approved: true` + `manualIndexApproval: true` on the specific
   page(s) to promote, and re-run `seo:all`.
5. Submit sitemaps in Search Console per property.

## Current state (candidate-first)

All Phase 5–8 content (case studies, money, location, knowledge) ships as
**candidate / noindex** by design. Only the pre-existing live core pages are
indexable. The system is production-ready; indexing of new pages is a deliberate,
per-page manual step.
