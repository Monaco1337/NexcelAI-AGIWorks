# Content Quality Policy

Enforced by `lib/seo/contentRules.ts` (run via `seo:content` and folded into
`seo:quality`).

## Blockers (fail `seo:all`)

| Code                    | Rule |
| ----------------------- | ---- |
| `RANKING_GUARANTEE`     | No ranking promises ("garantiert Platz 1", "#1 bei Google", "guaranteed ranking", "sofort auf Seite 1", …). |
| `UNSUPPORTED_SUPERLATIVE` | No absolute market claims ("weltweit führend", "Marktführer", "Nummer 1", "die beste Agentur", "unschlagbar", "world-class", "best-in-class", "#1"). |
| `TEMPLATE_PLACEHOLDER`  | No unresolved placeholders (`{{city}}`, `[stadt]`, `LOREM IPSUM`, `TODO`, `PLACEHOLDER`, `XXX`). |
| `MISSING_TITLE`         | Title must not be empty. |
| `MISSING_DESCRIPTION`   | Description must not be empty. |

## Warnings (reported, non-blocking)

| Code                | Rule (`CONTENT_RULE_LIMITS`) |
| ------------------- | ---------------------------- |
| `TITLE_TOO_SHORT` / `TITLE_TOO_LONG` | Title 15–65 chars. |
| `DESC_TOO_SHORT` / `DESC_TOO_LONG`   | Description 50–165 chars. |
| `CITY_STUFFING`     | A single city name repeated > 4× in one text block. |
| `WEAK_FAQ_ANSWER`   | Visible FAQ answer < 40 chars. |

## Duplicate protection

`lib/seo/contentFingerprint.ts` builds 3-word shingles; `duplicateGuard.ts`
compares every pair via Jaccard similarity:

| Scope        | Threshold | Severity |
| ------------ | :-------: | -------- |
| Cross-domain (nexcel ↔ agiworks) | `0.60` | **BLOCKER** (`CROSS_DOMAIN_DUPLICATE`) |
| Within-brand (non-boilerplate)   | `0.85` | Warning (`WITHIN_BRAND_DUPLICATE`) |

Legal/boilerplate pages (`type: "legal"`) legitimately overlap and are exempt
from the within-brand check when both sides are boilerplate.

## Brand consistency

`lib/seo/brandGuard.ts`:

- `WRONG_PRIMARY_BRAND` (blocker): title is branded as the partner brand but not
  the owning brand.
- `FOREIGN_BRAND_IN_TITLE` / `BRAND_NAME_MISSING` (warnings).

Cross-mentioning the partner brand in body copy (cooperation) is allowed.

## Structured-data policy

`lib/seo/schemaValidator.ts` blocks any JSON-LD containing `aggregateRating`,
`review`, `ratingValue`, `openingHours`, `geo`, `latitude`, `longitude`, or a URL
pointing at the wrong brand domain. `FAQPage` is emitted **only** when the FAQ is
visibly rendered.

## Self-tests

`contentRules`, `duplicateGuard` and `crossDomainGuard` are exercised with
deliberately-bad fixtures (`lib/seo/__fixtures__/crossDomainDuplicates.ts`). The
CI asserts each fixture is rejected, guaranteeing the checks can fail.
