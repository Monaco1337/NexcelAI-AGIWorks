# Page Templates (Phase 4)

Reusable, brand-aware page templates. Phase 4 ships the **building blocks only** —
no new indexable pages are created here. Later phases assemble `candidate`
(noindex) pages from these templates; nothing is indexed until it passes the
quality/duplicate/cross-domain/brand/location gates **and** manual approval
(see [`INDEXING_POLICY.md`](./INDEXING_POLICY.md)).

## Templates

| Template            | File                                        | Type-specific JSON-LD |
| ------------------- | ------------------------------------------- | --------------------- |
| Service             | `components/templates/ServiceTemplate.tsx`   | `Service` |
| Industry            | `components/templates/IndustryTemplate.tsx`  | `Service` |
| Location            | `components/templates/LocationTemplate.tsx`  | `Service` (areaServed) |
| Knowledge (AEO/GEO) | `components/templates/KnowledgeTemplate.tsx` | `Article` + `Person` |
| Cost                | `components/templates/CostTemplate.tsx`      | — |
| Comparison          | `components/templates/ComparisonTemplate.tsx`| — |
| Case Study          | `components/templates/CaseStudyTemplate.tsx` | — |

Shared chrome lives in `components/templates/TemplateFrame.tsx` (breadcrumbs,
hero, FAQ, trust block, CTA, `WebPage` JSON-LD) and `primitives.tsx`
(`TemplateSection`, `GradientHeading`, `GlassCard`, `CardGrid`, `TemplateCta`).

## Prop contracts

All props are typed in `lib/templates/types.ts`. The types are intentionally
**factual-only**: there is no field for ratings, review counts, fake
certifications, opening hours or geo coordinates, so those cannot be passed in.

`TemplateBase` (shared by every template):

```ts
interface TemplateBase {
  brand: BrandKey;
  canonicalUrl: string;        // absolute canonical URL of the page
  breadcrumbs: BreadcrumbNode[];
  title: string;
  eyebrow?: string;
  intro: string;
  faq?: FaqItem[];             // FAQPage JSON-LD only rendered when present
}
```

## Usage (in a future candidate page)

```tsx
import ServiceTemplate from "@/components/templates/ServiceTemplate";

export default function Page() {
  return (
    <ServiceTemplate
      brand="nexcel"
      canonicalUrl="https://www.nexcelai.de/leistungen/systemdesign"
      breadcrumbs={[
        { label: "Start", href: "/" },
        { label: "Leistungen", href: "/leistungen" },
        { label: "Systemdesign", href: "/leistungen/systemdesign" },
      ]}
      eyebrow="Leistung"
      title="Systemdesign"
      intro="Konzeption und Umsetzung digitaler Unternehmenssysteme."
      serviceName="Systemdesign"
      features={[{ title: "Systemarchitektur", description: "…" }]}
      process={[{ title: "Analyse", description: "…" }]}
      faq={[{ question: "…", answer: "…" }]}
    />
  );
}
```

The template renders WebPage + Service + Breadcrumb (+ FAQ when present) JSON-LD
automatically, all on the brand's canonical domain.

## CI guard (`seo:templates`)

`lib/seo/templatesGuard.ts` scans `components/templates/**` and
`components/trust/**` for banned phrases (ranking guarantees, unsupported
superlatives, placeholders) and fake trust markers (star ratings, review counts,
invented awards). It self-tests against a known-bad string. Run:
`npm run seo:templates` (also part of `npm run seo:all`).

## Design system

Templates inherit the active brand via `useBrand()` and the brand CSS variables
(`--brand-headline-gradient`, `--brand-card-border`, `--brand-line-mid`,
`--brand-wash`, …), so both NEXCEL AI and AGI Works render in their own identity
without per-brand forks.
