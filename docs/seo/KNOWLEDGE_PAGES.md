# Knowledge Pages (Phase 8)

AEO/GEO editorial content (explainers, guides) for answer- and generative-engine
visibility. They ship as **candidate** (noindex,follow) and are indexed only after
passing all guards **and** manual approval.

- Data: `data/knowledgePages.ts` (`KNOWLEDGE_PAGES`)
- Template: `components/templates/KnowledgePageTemplate.tsx`
- Routes (catch-all, SSG):
  - NEXCEL: `app/wissen/[slug]/page.tsx` → `/wissen/<slug>`
  - AGI Works: `app/agiworks/wissen/[slug]/page.tsx` → `/wissen/<slug>`
- Registry: `config/seo/pageRegistry.ts` (`type: "knowledge"`, candidate)
- Guard: `lib/seo/knowledgePageGuard.ts` — `npm run seo:knowledge-pages`

## Topics (4 × 2 brands = 8)

- **AGI Works** (technical): `was-ist-eine-web-app`,
  `individualsoftware-vs-standardsoftware`, `was-kostet-softwareentwicklung`,
  `erp-system-einfuehren`.
- **NEXCEL AI** (strategic): `was-ist-ki-automatisierung`, `was-ist-ein-ki-agent`,
  `prozesse-automatisieren-im-mittelstand`, `customer-experience-mit-ki-verbessern`.

## Structure (AEO-first)

Every page leads with a direct, quotable answer, then scannable takeaways, then
long-form sections and an FAQ:

- `aeoAnswer` — 2–4 sentence direct answer (the AEO block).
- `takeaways[]` — key points (≥ 3).
- `sections[]` — `{ heading, body }` (≥ 3; `body` uses blank lines for paragraphs).
- `faq[]` — real questions (≥ 4); drives FAQPage JSON-LD.
- `relatedPaths[]` — internal links to money pages / core routes.

JSON-LD: `Article` + `Person` author (E-E-A-T) + `WebPage` + `BreadcrumbList` +
`FAQPage` (only when FAQ present).

## Hard rules (guarded)

| Rule | Blocks |
| --- | --- |
| Structure | `< 3` sections, `< 4` FAQ, `< 3` takeaways, missing aeoAnswer/intro, empty section |
| E-E-A-T | empty explicit author; invalid/`YYYY-MM-DD` dates; `dateModified < datePublished` |
| Banned phrases | ranking guarantees, superlatives, placeholders |
| Fake metrics | invented `%`, `€`, `3x`, "N Kunden", "spart N Stunden" |
| Links | `relatedPath` not a registered same-brand route |
| Duplicates | cross-domain similarity ≥ 0.60 (AGI vs NEXCEL) |
| Generic template | same-brand body similarity ≥ 0.70 |

The author is always the **legally responsible brand owner** (from the brand
config) — no invented experts. The cost topic stays qualitative on purpose (no
prices/percentages) and points to the Preiskalkulator.

## Promotion checklist (candidate → indexed)

1. Content reviewed: factual, genuinely helpful, real author.
2. `npm run seo:all` green (0 blockers), incl. `seo:knowledge-pages`.
3. Quality gate ≥ **80** (knowledge threshold in `qualityGate.ts`).
4. In `data/knowledgePages.ts` set `approved: true` **and**
   `manualIndexApproval: true` for the page; update `dateModified`.
5. Re-run `npm run seo:all` — the page becomes index-gated and only goes
   `index,follow` when approved + manually cleared + quality index passes.
