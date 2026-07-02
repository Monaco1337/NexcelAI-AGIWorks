# Form & Lead Security Policy (Phase 3)

Public, unauthenticated endpoints (lead / contact / demo) are hardened with
layered, low-friction defenses. No CAPTCHA is used (UX cost); the layers below
stop the overwhelming majority of automated abuse.

## Layers

| Layer          | Module                        | Behavior |
| -------------- | ----------------------------- | -------- |
| Rate limiting  | `lib/security/rateLimit.ts`   | Fixed-window per-IP counter. Lead route: **6 requests / 10 min** per IP → `429` with `Retry-After`. |
| Honeypot       | `lib/security/honeypot.ts`    | Hidden `company_website` field; if filled → treated as bot. |
| Timing (opt.)  | `lib/security/honeypot.ts`    | Optional min-fill-time check (`form_rendered_at`); **off by default** on the lead route to avoid false positives. |
| Input validation | route handler               | Required fields + email regex; trimming; typed body. |
| Server-derived brand | `lib/seo/leadAttribution.ts` | Brand from host header, never trusted from the client. |

## Bot handling

When the honeypot triggers, the endpoint returns a **normal `200` success**
response but **does not store** the submission. This avoids revealing the trap to
bots while keeping the record store clean.

## Rate limiter scope

The limiter is **in-process (per server instance)** and dependency-free. On
serverless / multi-instance deployments each instance keeps its own window, so it
is a first line of defense, not a global quota. `@upstash/redis` and
`@vercel/kv` are already available and can be swapped in behind the same
`rateLimit()` interface for a distributed quota later.

## Honeypot field contract

- Field name: `company_website` (`HONEYPOT_FIELD`).
- Rendered off-screen, `tabIndex=-1`, `autoComplete="off"`, `aria-hidden`.
- Client also sends `form_rendered_at` (`HONEYPOT_TIME_FIELD`) for the optional
  timing check.
- Shared names via `honeypotFieldNames` in `lib/leadAttributionClient.ts` so the
  form and the server never drift.

## Privacy

- No raw IP is stored on the lead record (only used transiently as a rate-limit
  key). Analytics elsewhere hashes IPs (`lib/analytics-store.ts → hashIp`).
- Attribution stored with a lead is non-PII (see `LEAD_ATTRIBUTION.md`).

## CI enforcement

`seo:lead-map` blocks the build if the lead route loses rate limiting, the
honeypot, or server-side brand derivation. See
[`LEAD_ATTRIBUTION.md`](./LEAD_ATTRIBUTION.md).

## Applying to more endpoints

To harden another public form (e.g. `app/api/demo-request`, contact):

1. `import { rateLimit, rateLimitKey } from "@/lib/security/rateLimit"` and gate
   the handler.
2. `import { checkHoneypot, HONEYPOT_FIELD } from "@/lib/security/honeypot"` and
   drop bot submissions silently.
3. Render the hidden honeypot input + `getAttributionPayload()` in the form.
4. Extend `seo:lead-map` `checkRouteWiring()` to assert the new route too.
