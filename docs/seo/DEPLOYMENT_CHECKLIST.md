# Deployment Checklist

Run before every deploy. All must pass.

## 1. Gates (must be green)

```bash
npm run seo:all      # 18 checks, 0 blockers, ends with GO-LIVE VERDICT: GO
npx tsc --noEmit     # no type errors
npm run build        # Next production build succeeds
```

`seo:all` must report **0 blockers** and print `GO-LIVE VERDICT: GO`. Warnings are
acceptable but should be reviewed. The self-tests (`GUARD_SELFTEST_OK`) must be
present — their absence means a guard was silently disabled.

The final audit (`seo:readiness`, included in `seo:all`) asserts every indexable
page passes the live quality gate, has a correct canonical host and that each
brand's sitemap is non-empty; `seo:scaling` enforces the national-scaling policy
(city allowlist, candidate caps, cross-type doorway scan). See
[`PRODUCTION_AUDIT.md`](./PRODUCTION_AUDIT.md).

## 2. Cross-domain ownership (critical)

- `seo:crossdomain` → 0 blockers (no page canonicalizes to the wrong domain, no
  `/agiworks` prefix leaks into a public path/canonical).
- `seo:duplicates` → 0 blockers (no cross-domain near-duplicates).

## 3. Host-aware routes (spot-check after deploy)

Verify both hosts return the correct, brand-specific output:

```bash
curl -s -H "Host: www.nexcelai.de"  https://<deploy>/robots.txt
curl -s -H "Host: www.agiworks.de"  https://<deploy>/robots.txt
curl -s -H "Host: www.nexcelai.de"  https://<deploy>/sitemap.xml
curl -s -H "Host: www.agiworks.de"  https://<deploy>/sitemap.xml
curl -s -H "Host: www.nexcelai.de"  https://<deploy>/llms.txt
```

- Each `robots.txt` points at **its own** domain's sitemap.
- Each `sitemap.xml` lists **only** that brand's indexable canonical URLs.

## 4. 301 redirects (production hosts)

```bash
curl -sI "https://www.nexcelai.de/agiworks/impressum"   # → 301 https://www.agiworks.de/impressum
curl -sI "https://www.agiworks.de/agiworks/impressum"   # → 301 https://www.agiworks.de/impressum
```

## 5. Indexability changes

If any page's `approved` / `manualIndexApproval` / `quality.index` changed:

- Confirm the intended index/noindex in the rendered `<meta name="robots">`.
- Confirm sitemap membership matches.
- Follow the promotion steps in [`INDEXING_POLICY.md`](./INDEXING_POLICY.md).

## 6. Post-deploy

- Google Search Console: submit/confirm both sitemaps (one per property).
- Watch coverage for unexpected `noindex` or duplicate warnings.
