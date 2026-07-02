# Local SEO Policy

Both brands are **Einzelunternehmen** with a **registered legal address only**
(`config/businessLocations.ts`, mirrored from the Impressum):

| Brand      | Legal address                     | City | Region |
| ---------- | --------------------------------- | ---- | ------ |
| NEXCEL AI  | Ziegelstraße 9, 59423 Unna        | Unna | NRW    |
| AGI Works  | Hansastraße 34, 59423 Unna        | Unna | NRW    |

`isPublicOfficeClaimAllowed === false` for both. The address is a legal address,
**not** a walk-in office / storefront.

## Allowed

- Naming the registered legal address in the Impressum / `PostalAddress` JSON-LD.
- `areaServed` as a **service-area** statement: Unna, Kreis Unna, Dortmund, NRW,
  Deutschland (regions served, not offices).
- Modelling the entity as `Organization` (not `LocalBusiness`).

## Forbidden (blocked by `lib/seo/locationGuard.ts`)

| Code                    | Rule |
| ----------------------- | ---- |
| `PUBLIC_OFFICE_CLAIM`   | "besuchen Sie uns", "unser Büro/Standort/Filiale", "kommen Sie vorbei", "showroom", "walk-in". |
| `OPENING_HOURS_CLAIM`   | Any opening-hours text ("Öffnungszeiten", "Mo–Fr", "geöffnet von", "9:00–17:00 Uhr"). |
| `GEO_COORDINATES`       | Any latitude/longitude coordinates. |
| `FAKE_OFFICE_LOCATION`  | "Büro/Standort/Filiale/Niederlassung in `<City>`" for any city other than the real legal city (Unna). |

## Coverage note

The location guard runs on registry title/description by default and accepts
optional rendered body text. Full page-body coverage requires feeding rendered
HTML into `checkRegistryLocations(bodyByPageId)`; DOM coverage is therefore
**partial** until Phase 4 renders and pipes page bodies into the guard.

## Local scaling (Phase 7 — implemented)

NRW location pages ship as `candidate` (noindex) with **real local
differentiation** — never a generic templated city page. Data lives in
`data/locationPages.ts` (5 cities × 2 brands), rendered by
`components/templates/LocationPageTemplate.tsx` under `/standorte/<city>` via
catch-all routes. See [`LOCATION_PAGES.md`](./LOCATION_PAGES.md).

The dedicated guard `lib/seo/locationPageGuard.ts` (`npm run seo:location-pages`):

- reuses `checkLocation` on the **full page body** (not just title/description) —
  the `location` check now feeds rendered location bodies via `locationBodies()`,
  closing the earlier partial-DOM gap for these pages;
- blocks generic same-brand city templates (`LP_GENERIC_CITY_TEMPLATE`, body
  similarity ≥ 0.70) and cross-domain duplicates (≥ 0.60);
- requires city-specific `localContext`, min structure and resolving nearby-city
  and related links.

Pages are indexed only after passing content, duplicate and location guards, the
quality gate (threshold 90) **and** manual approval (`approved` +
`manualIndexApproval`).
