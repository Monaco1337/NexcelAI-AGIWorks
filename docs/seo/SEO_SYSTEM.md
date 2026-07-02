# SEO / AEO / GEO Authority System

One Next.js 14 (App Router) codebase serves **two independent brands** from two
domains:

| Brand      | Key        | Canonical domain          | Route tree      |
| ---------- | ---------- | ------------------------- | --------------- |
| NEXCEL AI  | `nexcel`   | `https://www.nexcelai.de` | `/*` (root)     |
| AGI Works  | `agiworks` | `https://www.agiworks.de` | `/agiworks/*`   |

`middleware.ts` rewrites `agiworks.de/x` → internal `/agiworks/x` (the public URL
stays clean) and hard-`301`s any leaked internal `/agiworks/*` URL on a
production host to the clean `agiworks.de` URL.

## Hard rules (non-negotiable)

- **One URL = one brand = one canonical domain.** Canonical tags alone are not
  enough; cross-domain duplicates are blocked at the middleware (301) **and** by
  the `crossdomain` CI guard.
- **Deny-by-default indexing.** A page is `index,follow` only when
  `approved && manualIndexApproval && quality.index === true`. See
  [`INDEXING_POLICY.md`](./INDEXING_POLICY.md).
- **No fake signals.** No ranking guarantees, no unsupported superlatives, no
  fake reviews/ratings, no fake office locations, geo coordinates or opening
  hours. See [`CONTENT_QUALITY_POLICY.md`](./CONTENT_QUALITY_POLICY.md) and
  [`LOCAL_SEO_POLICY.md`](./LOCAL_SEO_POLICY.md).
- **Nothing is indexed until every gate passes** and `manualIndexApproval` is
  explicitly set.

## Source-of-truth files (Phase 1)

| Concern              | File                              |
| -------------------- | --------------------------------- |
| Host ↔ brand ↔ domain | `config/seo/domains.ts`           |
| Brand facts          | `config/seo/brands.ts`            |
| Legal addresses      | `config/businessLocations.ts`     |
| Page registry        | `config/seo/pageRegistry.ts`      |
| Indexing policy      | `config/seo/indexing.ts`          |
| Brand resolution     | `lib/seo/brandFromRequest.ts`     |
| Canonicals           | `lib/seo/canonical.ts`            |
| Metadata engine      | `lib/seo/metadata.ts`             |
| JSON-LD builders     | `lib/seo/jsonld.ts`               |
| robots / sitemap / llms | `app/robots.ts`, `app/sitemap.ts`, `app/llms.txt/route.ts` |

## Guards & CI (Phase 2)

All guards are pure functions returning `Finding[]`
(`blocker | warning | info`). A **blocker** fails `seo:all` (non-zero exit);
warnings and info never fail the build.

| Guard / validator      | File                                  |
| ---------------------- | ------------------------------------- |
| Finding model + reporter | `lib/seo/findings.ts`               |
| Content rules          | `lib/seo/contentRules.ts`             |
| Quality gate           | `lib/seo/qualityGate.ts`              |
| Fingerprint (shingles/Jaccard) | `lib/seo/contentFingerprint.ts` |
| Duplicate guard        | `lib/seo/duplicateGuard.ts`           |
| Cross-domain guard     | `lib/seo/crossDomainGuard.ts`         |
| Brand guard            | `lib/seo/brandGuard.ts`               |
| Location guard         | `lib/seo/locationGuard.ts`            |
| Route validator        | `lib/seo/routeValidator.ts`           |
| Link validator         | `lib/seo/linkValidator.ts`            |
| Schema validator       | `lib/seo/schemaValidator.ts`          |
| Lead-map guard (Phase 3) | `lib/seo/leadMap.ts`                |
| Negative fixtures      | `lib/seo/__fixtures__/crossDomainDuplicates.ts` |
| Check registry / runner | `scripts/seo/checks.ts`, `scripts/seo/run.ts` |

## Lead attribution & form security (Phase 3)

| Concern                      | File                            |
| ---------------------------- | ------------------------------- |
| Attribution model + resolver | `lib/seo/leadAttribution.ts`    |
| Client first-touch capture   | `lib/leadAttributionClient.ts`  |
| Rate limiter                 | `lib/security/rateLimit.ts`     |
| Honeypot / timing            | `lib/security/honeypot.ts`      |
| Hardened lead endpoint       | `app/api/lead/route.ts`         |

See [`LEAD_ATTRIBUTION.md`](./LEAD_ATTRIBUTION.md) and
[`SECURITY_POLICY.md`](./SECURITY_POLICY.md).

## Templates & E-E-A-T (Phase 4)

Reusable, brand-aware page templates + trust components (building blocks only —
no new indexable pages). Guarded by `seo:templates` (banned-phrase / fake-trust
scan). See [`TEMPLATES.md`](./TEMPLATES.md) and [`EEAT_TRUST.md`](./EEAT_TRUST.md).

| Area              | Location |
| ----------------- | -------- |
| Templates (7) + frame + primitives | `components/templates/*` |
| Trust / E-E-A-T components | `components/trust/*` |
| Prop contracts    | `lib/templates/types.ts` |
| Template guard    | `lib/seo/templatesGuard.ts` (`seo:templates`) |
| JSON-LD builders  | `serviceSchema`, `articleSchema`, `webPageForUrl` in `lib/seo/jsonld.ts` |

The guard files under `lib/seo/*` used by CI are **not imported by the Next app
graph**, so `next build` never bundles Node-only code (`fast-glob`, `fs`).

## Case studies (Phase 5)

Real-work-only case-study system, brand-separated, deny-by-default. See
[`CASE_STUDIES.md`](./CASE_STUDIES.md).

| Area | Location |
| --- | --- |
| Data model + seed | `data/caseStudies.ts` |
| → template props | `lib/caseStudies/toTemplateProps.ts` |
| Guard (`seo:case-studies`) | `lib/seo/caseStudyGuard.ts` |

## Money pages (Phase 6)

First commercial pages as **candidate** (noindex): AGI Works `/leistungen/*`
(technical) and NEXCEL AI `/loesungen/*` (strategic). Data-driven, served by
catch-all routes, nothing auto-indexed. See [`MONEY_PAGES.md`](./MONEY_PAGES.md).

| Area | Location |
| --- | --- |
| Data model + content | `data/moneyPages.ts` |
| Template | `components/templates/MoneyPageTemplate.tsx` |
| Routes | `app/loesungen/[slug]`, `app/agiworks/leistungen/[slug]` |
| Guard (`seo:money-pages`) | `lib/seo/moneyPageGuard.ts` |

The route validator accepts catch-all backing (a registry page is "present" when
its parent has a `[param]/page.tsx`). The quality check only index-gates pages
that are `approved && manualIndexApproval`; candidate pages are noindex by design.

## Location pages (Phase 7)

NRW city pages as **candidate** (noindex) with **real local differentiation** —
never a generic templated city page. 5 cities × 2 brands. Both brands are legally
based in Unna only: no office/branch claims, opening hours or geo per city; each
city is a `Service` `areaServed`. See [`LOCATION_PAGES.md`](./LOCATION_PAGES.md).

| Area | Location |
| --- | --- |
| Data model + content | `data/locationPages.ts` |
| Template | `components/templates/LocationPageTemplate.tsx` |
| Routes | `app/standorte/[city]`, `app/agiworks/standorte/[city]` |
| Guard (`seo:location-pages`) | `lib/seo/locationPageGuard.ts` |

The guard reuses the shared `checkLocation` on full bodies (fake-signal scan),
blocks generic same-brand city templates (body similarity ≥ 0.70) and cross-domain
duplicates (≥ 0.60), and requires city-specific `localContext` + nearby-city links.
Location pages carry a dedicated quality threshold of **90**.

## Knowledge pages (Phase 8)

AEO/GEO editorial explainers as **candidate** (noindex): direct answer +
takeaways + long-form sections + FAQ, with a real author (E-E-A-T). 4 topics ×
2 brands (technical for AGI, strategic for NEXCEL). See
[`KNOWLEDGE_PAGES.md`](./KNOWLEDGE_PAGES.md).

| Area | Location |
| --- | --- |
| Data model + content | `data/knowledgePages.ts` |
| Template | `components/templates/KnowledgePageTemplate.tsx` |
| Routes | `app/wissen/[slug]`, `app/agiworks/wissen/[slug]` |
| Guard (`seo:knowledge-pages`) | `lib/seo/knowledgePageGuard.ts` |

Emits `Article` + `Person` author JSON-LD. The guard blocks thin structure, fake
metrics, banned phrases, invalid/ordered dates, broken links, cross-domain
duplicates (≥ 0.60) and generic same-brand clones (≥ 0.70). Quality threshold **80**.

## Phase roadmap

- **0–4** stabilization, SEO core, guards+CI, lead attribution+security,
  templates+E-E-A-T. ✅
- **5** case-study system (real-only). ✅
- **6** money pages as candidate (AGI `/leistungen`, NEXCEL `/loesungen`). ✅
- **7** NRW location pages as candidate with real local differentiation. ✅
- **8** AEO/GEO knowledge pages as candidate (real author, E-E-A-T). ✅
- **9** national scaling policy + final production audit (GO/NO-GO). ✅ Nothing is
  indexed until every gate passes and `manualIndexApproval` is explicitly set.

## National scaling + final audit (Phase 9)

Controlled growth and a system-wide go-live gate. See
[`NATIONAL_SCALING.md`](./NATIONAL_SCALING.md) and
[`PRODUCTION_AUDIT.md`](./PRODUCTION_AUDIT.md).

| Area | Location |
| --- | --- |
| Scaling policy (tiers, caps, thresholds) | `config/seo/scaling.ts` |
| Scaling guard (`seo:scaling`) | `lib/seo/scalingGuard.ts` |
| Readiness audit (`seo:readiness`) | `lib/seo/auditReport.ts` |

`seo:scaling` allowlists location cities, caps candidate volume per type and scans
the whole candidate corpus for cross-type doorway near-duplicates (≥ 0.55).
`seo:readiness` asserts every indexable page passes the live gate + canonical host
+ non-empty sitemap, and prints a GO / NO-GO verdict. `seo:all` now runs **18
checks** and ends with the go-live verdict.

## Commands

```bash
npm run seo:all          # run every check; exit 1 on any blocker (CI gate)
npm run seo:audit        # same, full report
npm run seo:crossdomain  # single check (routes|crossdomain|duplicates|content|
npm run seo:quality      #   quality|brand|location|schema|links|sitemap|
                         #   lead-map|templates)
tsx scripts/seo/run.ts list   # list checks
```

### Negative-fixture self-tests

`crossdomain`, `duplicates` and `content` also run deliberately-broken fixtures
(`__fixtures__/crossDomainDuplicates.ts`) and assert the guard flags them. If a
guard fails to detect known-bad input, it emits a `GUARD_SELFTEST_FAILED`
blocker — proving the checks can actually fail.

## Documented deviations

- Paths use root-level `config/`, `lib/seo/`, `scripts/seo/`, `docs/seo/` (no
  `src/`), matching the existing repo convention.
- Brand keys are `nexcel` / `agiworks` (existing `BrandConfig.id`); the SEO layer
  maps them to the public domains.
- SEO-CI scripts run through **one dispatcher** (`scripts/seo/run.ts`) rather
  than one file per check, to stay DRY. Each `seo:*` npm script targets a named
  check through the dispatcher.
- Body/DOM-level content analysis is **partial**: guards run on registry
  title/description by default and accept optional rendered HTML text. Full DOM
  coverage (via `cheerio`) is wired for future rendered-HTML input.
