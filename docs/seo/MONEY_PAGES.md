# Money Pages (Phase 6)

Commercial service/solution pages for both brands, shipped as **candidate**
(noindex, follow). Nothing here is auto-indexed — promotion is a deliberate,
gated step.

| Brand     | Collection     | Angle                                             |
| --------- | -------------- | ------------------------------------------------- |
| AGI Works | `/leistungen/*`| Technisch: Architektur, Engineering, Umsetzung    |
| NEXCEL AI | `/loesungen/*` | Strategisch: Systemdesign, KI, CX, Wachstum       |

## Files

| File | Purpose |
| --- | --- |
| `data/moneyPages.ts` | Single source of truth: `MoneyPage` model + all content. |
| `components/templates/MoneyPageTemplate.tsx` | Renders the full money-page structure on the Phase 4 `TemplateFrame` + Service JSON-LD. |
| `app/loesungen/[slug]/page.tsx` | NEXCEL catch-all route (metadata, static params, `notFound`). |
| `app/agiworks/leistungen/[slug]/page.tsx` | AGI Works catch-all route. |
| `lib/seo/moneyPageGuard.ts` | `seo:money-pages` guard. |

## Page structure (every money page)

Hero (1× H1) → AEO-Kurzantwort → Problem → Lösung + Module → Ansatz
(brand-spezifisch) → Einsatzbereiche → Entscheidungsmatrix (wann / wann nicht /
Alternative) → Projektkorridor (kein Fixpreis) → Ablauf → interne Links → FAQ
(≥ 5) → Proof-Constraints → Trust-Strip → Author-Byline → CTA.

## Hard rules (enforced by `npm run seo:money-pages` + shared guards)

1. **Candidate by default.** `approved=false`, `manualIndexApproval=false`,
   `quality.index=false` → noindex,follow. Excluded from the sitemap.
2. **Brand separation.** AGI uses `/leistungen/*` (technical), NEXCEL uses
   `/loesungen/*` (strategic). Wrong collection for a brand is a blocker.
   Near-identical cross-domain copy triggers `CROSS_DOMAIN_DUPLICATE`.
3. **Structure minimums.** ≥ 6 modules, ≥ 5 FAQ, ≥ 4 process steps,
   ≥ 3 industries, ≥ 4 approach points, complete decision matrix.
4. **No fake signals.** No ranking guarantees, no unsupported superlatives, no
   invented numeric metrics, no fixed price promises — cost is always a
   "Projektkorridor" with a link to the calculator.
5. **Real internal links.** Every `relatedPaths` entry must resolve to a
   registered same-brand route.
6. **Grounded.** `systemSlug` (when set) must exist in `lib/systems-slugs.ts`.

## Rendering & routing

- Pages are served by **catch-all dynamic routes** (`[slug]`), not one static
  folder per slug. The route validator recognises this: a registry page counts
  as present when its parent directory has a `[param]/page.tsx`.
- Metadata comes from the registry-driven `generateSeoMetadata(brand, path)` and
  resolves to noindex while the page is a candidate.
- AGI pages inherit AGI theming via the `/agiworks` `BrandProvider`; NEXCEL pages
  inherit the root brand.

## Promoting a money page to indexable (later)

1. Ensure content is genuinely complete and unique (all sections substantive).
2. Confirm `seo:money-pages`, `seo:duplicates`, `seo:content` are clean.
3. In `data/moneyPages.ts` set `approved: true` and `manualIndexApproval: true`.
   The registry mirrors these; the quality gate then applies the money-page
   threshold (score ≥ 80, zero blockers) before the page can be indexed.
4. Run `npm run seo:all` — the page now appears in the sitemap only if every gate
   passes.

## CI

`npm run seo:money-pages` runs the guard (with negative-fixture self-tests).
It is part of `npm run seo:all`.
