# Lead Attribution (Phase 3 — implemented)

Privacy-first, server-authoritative lead attribution. Every inbound lead is
attributed to its **brand**, **entry page**, **channel** and optional
**campaign** — no third-party trackers, no cross-site fingerprinting, no PII in
URLs.

## Modules

| Concern                         | File                                 |
| ------------------------------- | ------------------------------------ |
| Attribution model + resolver    | `lib/seo/leadAttribution.ts`         |
| Client first-touch capture      | `lib/leadAttributionClient.ts`       |
| Lead endpoint (hardened)        | `app/api/lead/route.ts`              |
| CI guard                        | `lib/seo/leadMap.ts` (`seo:lead-map`) |

## Model (`lib/seo/leadAttribution.ts`)

```ts
interface LeadAttribution {
  brand: BrandKey;            // ALWAYS derived server-side from the request host
  landingPath: string;        // first-touch internal path (cleaned, /agiworks stripped)
  referrerHost: string | null;
  channel: "organic" | "direct" | "referral" | "paid" | "email" | "social" | "unknown";
  source?: string;            // utm_source
  medium?: string;            // utm_medium
  campaign?: string;          // utm_campaign
  term?: string;              // utm_term
  content?: string;           // utm_content
  firstSeenAt: string;        // ISO, validated (never in the future)
}
```

`resolveAttribution(input)` is **pure** and deterministic (self-tested in CI).

### Channel rules (`classifyChannel`)

Explicit UTM `medium` wins over referrer:

- `cpc | ppc | paid | paidsearch | paid_social | display | cpm | banner` → `paid`
- `email | newsletter | mail` → `email`
- `social | social_media | sm | paid_social` → `social`
- else, by referrer host: known search engine → `organic`; known social host →
  `social`; other external host → `referral`; no referrer → `direct`.

### Privacy constraints (enforced)

- **Brand is server-authoritative.** `hostToBrand(host)` from
  `config/seo/domains.ts`; the client-supplied brand is only a fallback for
  local/preview hosts and is never stored as-is.
- **UTM allow-list only:** `utm_source|medium|campaign|term|content`, each
  sanitized (control chars stripped, capped at 120 chars). Any other query key
  (e.g. `email`, `name`, `phone`) is dropped — verified by `seo:lead-map`.
- **No full query strings, no PII, no IP** in the attribution record.
- `landingPath` is path-only (query/hash removed), `/agiworks` prefix stripped.

## Client capture (`lib/leadAttributionClient.ts`)

- `captureFirstTouch()` runs on mount and stores `{landingPath, referrer, utm,
  firstSeenAt}` **once** in first-party `localStorage` (`nx_attribution`).
  First-touch wins for the whole visit.
- `getAttributionPayload()` returns that payload for the lead submission (falls
  back to the current page if storage is unavailable).
- No cookies are set; the payload is non-PII and is only sent when the user
  voluntarily submits a lead.

## Legal basis

A lead is a user-initiated inquiry — processing it (incl. low-risk, non-PII
attribution metadata) rests on **Art. 6(1)(b) DSGVO** (pre-contractual measures).
No consent banner is required for the inquiry itself. Optional analytics tracking
(`lib/track.ts`) remains governed by `lib/cookieConsent.ts`.

## CI guard (`seo:lead-map`)

`lib/seo/leadMap.ts` blocks on:

- `ATTRIBUTION_CHANNEL_WRONG` — a channel case classifies incorrectly (7 cases).
- `ATTRIBUTION_BRAND_NOT_SERVER_DERIVED` — host does not win over client brand.
- `ATTRIBUTION_PII_LEAK` — a non-allow-listed key survives `sanitizeUtm`.
- `LEAD_NO_ATTRIBUTION | LEAD_BRAND_NOT_SERVER | LEAD_NO_RATELIMIT |
  LEAD_NO_HONEYPOT | LEAD_NO_HONEYPOT_FIELD` — the lead route lost a required
  protection.

Run: `npm run seo:lead-map` (also part of `npm run seo:all`).
