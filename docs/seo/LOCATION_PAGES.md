# Location Pages (Phase 7)

NRW city pages for local SEO/GEO. They ship as **candidate** (noindex,follow) and
are indexed only after passing all guards **and** manual approval.

- Data: `data/locationPages.ts` (`LOCATION_PAGES`)
- Template: `components/templates/LocationPageTemplate.tsx`
- Routes (catch-all, SSG):
  - NEXCEL: `app/standorte/[city]/page.tsx` → `/standorte/<city>`
  - AGI Works: `app/agiworks/standorte/[city]/page.tsx` → `/standorte/<city>`
- Registry: `config/seo/pageRegistry.ts` (`type: "location"`, candidate)
- Guard: `lib/seo/locationPageGuard.ts` — `npm run seo:location-pages`

## Cities (5 × 2 brands = 10)

`dortmund`, `unna`, `bochum`, `essen`, `duesseldorf` — for both **AGI Works**
(Softwareentwicklung) and **NEXCEL AI** (KI-Automatisierung).

## Hard rules (no fake local signals)

Both brands are **Einzelunternehmen** legally based in **Unna** only
(`config/businessLocations.ts`, `isPublicOfficeClaimAllowed = false`). Every city
other than Unna is a **service area**, never a location.

Blocked (shared `checkLocation` + `seo:location-pages`):

| Rule                    | Example that is blocked |
| ----------------------- | ----------------------- |
| `PUBLIC_OFFICE_CLAIM`   | "besuchen Sie uns", "unser Büro/Standort/Filiale", "kommen Sie vorbei", "showroom" |
| `OPENING_HOURS_CLAIM`   | "Öffnungszeiten", "Mo–Fr", "9:00–17:00 Uhr" |
| `GEO_COORDINATES`       | latitude/longitude |
| `FAKE_OFFICE_LOCATION`  | "Büro/Standort/Filiale/Niederlassung in <Stadt>" for any city ≠ Unna |

Allowed phrasing: "für Unternehmen in <Stadt>", "im Ruhrgebiet", "aus NRW",
"remote und vor Ort nach Vereinbarung", "als Servicegebiet". The JSON-LD is a
`Service` with `areaServed` (service area) — **no** `PostalAddress` per city.

## Real local differentiation (no generic template)

Each page must carry city-specific facts, not a templated string with the city
swapped. The guard enforces:

- `localContext` ≥ 120 chars **and** names the city.
- min structure: ≥ 3 services, ≥ 5 FAQ, ≥ 3 process steps, ≥ 3 industries, ≥ 1
  nearby city.
- `LP_GENERIC_CITY_TEMPLATE`: two same-brand city pages with body similarity
  ≥ 0.70 are blocked.
- `CROSS_DOMAIN_DUPLICATE`: AGI vs NEXCEL for the same city must differ
  (similarity < 0.60) — different service and angle.
- internal links (`relatedPaths`) resolve to a registered same-brand route;
  `nearbyCities` resolve to real same-brand location pages (no self-link).
- no banned phrases (ranking guarantees, superlatives, placeholders), no invented
  numeric metrics.

## Promotion checklist (candidate → indexed)

1. Content reviewed: real, city-specific, factual; no fake local signals.
2. `npm run seo:all` green (0 blockers), incl. `seo:location-pages`.
3. Quality gate ≥ **90** (location threshold in `qualityGate.ts`).
4. In `data/locationPages.ts` set `approved: true` **and**
   `manualIndexApproval: true` for the page.
5. Re-run `npm run seo:all` — the page becomes index-gated; it only goes
   `index,follow` when approved + manually cleared + quality index passes.
