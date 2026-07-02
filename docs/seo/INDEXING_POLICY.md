# Indexing Policy

**Deny-by-default.** The single decision point is
`config/seo/indexing.ts → getRobotsForPage(page, qualityOverride?)`.

## Truth table

| approved | manualIndexApproval | quality.index | Result           |
| :------: | :-----------------: | :-----------: | ---------------- |
| false    | –                   | –             | `noindex, follow` |
| true     | false               | –             | `noindex, follow` |
| true     | true                | false         | `noindex, follow` |
| true     | true                | true          | `index, follow`  |

`follow` is always kept so link equity flows even on noindex pages.

## Two independent layers

1. **Indexing policy** (`indexing.ts`) — the registry flags above.
2. **Quality gate** (`lib/seo/qualityGate.ts`) — stricter, score-based. Even an
   approved+cleared page must reach the per-type score threshold and have **zero
   content-rule blockers** before `getIndexabilityStatus().canIndex` is true.

Per-type minimum score (`qualityGate.ts → TYPE_THRESHOLDS`):

| type    | min score |
| ------- | :-------: |
| home    | 80 |
| money   | 80 |
| tool    | 70 |
| content | 70 |
| legal   | 50 |

Scoring starts at 100; each warning −8, each blocker −40 (and any blocker forces
`canIndex = false`).

## Sitemap & robots

- `app/sitemap.ts` emits **only** pages where `isPageIndexable(page)` is true, on
  the requesting host's canonical domain.
- `app/robots.ts` is host-aware and points to that domain's sitemap.
- `seo:sitemap` blocks if any indexable page's canonical is not on its brand's
  domain, or if a brand has zero indexable pages.

## Promoting a new page to indexable

1. Add it to `config/seo/pageRegistry.ts` (starts non-approved → noindex).
2. Ensure it passes `seo:all` (routes, content, quality, cross-domain, brand,
   location, schema).
3. Set `approved: true`, then `manualIndexApproval: true`, then `quality.index:
   true`.
4. Re-run `seo:all` and `npm run build`; verify it appears in the correct
   sitemap only.
