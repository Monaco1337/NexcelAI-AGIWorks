# Case Study System (Phase 5)

The case-study system stores **real work only** and forbids fabricated numbers.
It is the structured, brand-separated foundation for future proof/authority pages
(`/projekte/<slug>`), rendered through the Phase 4 `CaseStudyTemplate`.

## Files

| File | Purpose |
| --- | --- |
| `data/caseStudies.ts` | Single source of truth: `CaseStudy` model + seed data. |
| `lib/caseStudies/toTemplateProps.ts` | Maps a `CaseStudy` → `CaseStudyTemplateProps` (canonical URL + breadcrumbs on the brand's own domain). |
| `lib/seo/caseStudyGuard.ts` | `seo:case-studies` guard (real-only, no fake metrics, brand/system integrity, cross-domain duplicate protection). |

## Hard rules (enforced by `npm run seo:case-studies`)

1. **Real work only.** Every case study is grounded in a real system offering:
   `systemSlug` must exist in `lib/systems-data.tsx`. Unknown slugs are a blocker.
2. **No fake metrics.** Numeric performance claims (`+30%`, `5x`, `€…`, `100 Leads`,
   `spart 10 Stunden`, …) are **blocked** unless the case study sets
   `verifiedMetrics: true` — an explicit owner attestation that the numbers are
   real and verifiable. The seed contains **no** metrics; outcomes are factual
   capabilities.
3. **No invented clients.** `client` is only set when it is a real, publication-
   cleared reference. Otherwise it is omitted.
4. **Brand separation.** NEXCEL AI (unternehmenssystem / customer-experience /
   process lens) and AGI Works (software-architecture / platform / integration
   lens) must read differently. Near-identical cross-domain copy triggers
   `CROSS_DOMAIN_DUPLICATE` (Jaccard ≥ 0.6).
5. **No banned phrases.** Ranking guarantees, unsupported superlatives and
   template placeholders are blocked (shared `scanBannedPhrases`).
6. **Deny-by-default indexing.** A case study is only publishable/indexable once
   `approved && manualIndexApproval` are both true. An indexable case study that
   still has blockers fails the build (`CS_INDEXABLE_WITH_BLOCKERS`). The seed
   ships **non-indexable**.

## Adding a real case study

1. Add an entry to `CASE_STUDIES` in `data/caseStudies.ts`.
2. Set `systemSlug` to the real underlying system, `id` to `${brand}:${slug}`.
3. Write a factual `challenge`, `approach`, and qualitative `outcomes`.
4. Only add numbers if they are real — then set `verifiedMetrics: true`.
5. Only set `client` if the reference is real and cleared for publication.
6. When ready to publish, set `approved: true` and `manualIndexApproval: true`
   (and register the `/projekte/<slug>` route + page-registry entry — that
   route creation is a separate, explicitly-approved step).
7. Run `npm run seo:case-studies` and `npm run seo:all`.

## Self-test

The guard runs negative fixtures on every invocation (a fake-metric string and a
cross-domain duplicate pair). If the guard fails to flag them it emits
`GUARD_SELFTEST_FAILED` — proving the guard itself still works.
