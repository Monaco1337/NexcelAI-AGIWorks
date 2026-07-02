# E-E-A-T & Trust Components (Phase 4)

Reusable trust components that express **Experience, Expertise,
Authoritativeness and Trustworthiness** with factual data only. They source from
the SEO brand config and the registered legal address — never invented signals.

## Components

| Component        | File                               | Purpose |
| ---------------- | ---------------------------------- | ------- |
| `Breadcrumbs`    | `components/trust/Breadcrumbs.tsx` | Visible breadcrumb trail + `BreadcrumbList` JSON-LD (derived from the same items). |
| `AuthorByline`   | `components/trust/AuthorByline.tsx`| Real responsible person (brand owner) + Impressum link; optional `Person` JSON-LD. |
| `TrustStrip`     | `components/trust/TrustStrip.tsx`  | Factual signals: responsible person, legal seat (Unna, NRW), service region, contact. |
| `ExperienceNote` | `components/trust/ExperienceNote.tsx` | Prop-driven experience / methodology statements. |
| `FaqSection`     | `components/trust/FaqSection.tsx`  | Visible FAQ accordion + `FAQPage` JSON-LD **only when items are present**. |

## Hard rules (enforced)

- **No fake trust signals.** No star ratings, review counts, invented awards or
  certifications. `seo:templates` blocks the build if any appear in the
  template/trust source.
- **Real person for authorship.** `AuthorByline` and Knowledge `Article` JSON-LD
  use the actual brand owner (`SEO_BRANDS[brand].primaryOwner`).
- **Legal address only.** `TrustStrip` shows the legal seat and a *service
  region*, never a public-office / "visit us" claim
  (see [`LOCAL_SEO_POLICY.md`](./LOCAL_SEO_POLICY.md)).
- **Structured data matches visible content.** `FAQPage` is emitted only when the
  FAQ renders; breadcrumb JSON-LD is built from the visible trail.

## Why this matters

Search and answer engines reward verifiable expertise and clear authorship. By
sourcing trust from factual config and blocking fake signals in CI, both brands
build durable authority without risking manual actions for deceptive markup.
