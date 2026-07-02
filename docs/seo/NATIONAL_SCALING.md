# National Scaling Policy (Phase 9)

Controls how the system grows beyond the initial NRW footprint **without** turning
into doorway pages, city stuffing or mass-produced near-duplicates.

- Policy: `config/seo/scaling.ts`
- Guard: `lib/seo/scalingGuard.ts` — `npm run seo:scaling`

## Location expansion is allowlisted

A location page may only use a city slug that is an approved scaling tier
(`SCALING_TIERS`). Unlisted cities are blocked (`SCALING_CITY_NOT_ALLOWLISTED`).

| Tier | Cities | Status |
| --- | --- | --- |
| `tier1_nrw` | dortmund, unna, bochum, essen, duesseldorf | live candidates |
| `tier2_national` | koeln, hamburg, berlin, muenchen, frankfurt, stuttgart | approved, not yet built |

To expand nationally: add the city to a tier, then create a real, differentiated
candidate location page (it must still pass `seo:location-pages`).

## Candidate caps per type

`CANDIDATE_CAPS` governs how many **candidate** pages may exist per scalable type
(money / location / knowledge). Exceeding a cap is a blocker
(`SCALING_CAP_EXCEEDED`) — a signal to review quality and differentiation before
scaling further, not a product limit.

## Cross-type doorway scan

Same-type near-duplicates are handled by each type's own generic-template guard
(≥ 0.70). The scaling guard adds a **system-wide** scan across the whole candidate
corpus and flags pages of **different** types that are near-identical
(`DOORWAY_NEAR_DUPLICATE`, similarity ≥ `CROSS_TYPE_DOORWAY_THRESHOLD` = 0.55).

## Non-negotiable invariants (`SCALING_POLICY`)

- Deny-by-default; scaling only ever adds **candidate** (noindex) pages.
- Nothing is indexed without passing every gate **and** explicit
  `manualIndexApproval`.
- One URL = one brand = one canonical domain.
