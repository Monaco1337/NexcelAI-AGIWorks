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
