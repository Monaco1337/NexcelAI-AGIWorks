/**
 * Lead-map guard — verifies the lead attribution + form-security wiring.
 *
 *  - Self-tests the pure attribution model (channel classification, UTM
 *    allow-list / no-PII, server-authoritative brand). A wrong result is a
 *    blocker, proving the guard can fail.
 *  - Statically asserts the canonical lead route derives brand server-side and
 *    is protected by the rate limiter + honeypot.
 *
 * Node-only (fs). CI-only module: not imported by the Next app graph.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  resolveAttribution,
  sanitizeUtm,
  classifyChannel,
  UTM_ALLOWLIST,
  type LeadChannel,
} from "./leadAttribution";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";
import { blocker, info, warning, type Finding } from "./findings";

interface ChannelCase {
  label: string;
  referrer: string | null;
  medium?: string;
  expected: LeadChannel;
}

const CHANNEL_CASES: ChannelCase[] = [
  { label: "google organic", referrer: "https://www.google.com/search?q=x", expected: "organic" },
  { label: "bing organic", referrer: "https://www.bing.com/", expected: "organic" },
  { label: "no referrer → direct", referrer: null, expected: "direct" },
  { label: "linkedin social", referrer: "https://www.linkedin.com/feed", expected: "social" },
  { label: "external referral", referrer: "https://some-blog.example/post", expected: "referral" },
  { label: "utm cpc → paid", referrer: null, medium: "cpc", expected: "paid" },
  { label: "utm newsletter → email", referrer: null, medium: "newsletter", expected: "email" },
];

function checkChannels(): Finding[] {
  const findings: Finding[] = [];
  for (const c of CHANNEL_CASES) {
    const host = c.referrer ? new URL(c.referrer).host : null;
    const got = classifyChannel(host, c.medium);
    if (got !== c.expected) {
      findings.push(
        blocker(
          "ATTRIBUTION_CHANNEL_WRONG",
          `Channel for "${c.label}" was "${got}", expected "${c.expected}"`
        )
      );
    }
  }
  return findings;
}

function checkBrandAuthority(): Finding[] {
  // Host must win over any client-provided fallback brand.
  const a = resolveAttribution({ host: "www.agiworks.de", fallbackBrand: "nexcel" });
  if (a.brand !== "agiworks") {
    return [
      blocker(
        "ATTRIBUTION_BRAND_NOT_SERVER_DERIVED",
        `Brand should be host-derived "agiworks", got "${a.brand}"`
      ),
    ];
  }
  const b = resolveAttribution({ host: "www.nexcelai.de", fallbackBrand: "agiworks" });
  if (b.brand !== "nexcel") {
    return [
      blocker(
        "ATTRIBUTION_BRAND_NOT_SERVER_DERIVED",
        `Brand should be host-derived "nexcel", got "${b.brand}"`
      ),
    ];
  }
  return [];
}

function checkUtmAllowlist(): Finding[] {
  const dirty = {
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "spring",
    email: "leak@example.com",
    name: "Should Not Persist",
    phone: "+49123",
  } as Record<string, string>;
  const clean = sanitizeUtm(dirty);
  const keys = Object.keys(clean);
  const leaked = keys.filter((k) => !UTM_ALLOWLIST.includes(k as (typeof UTM_ALLOWLIST)[number]));
  if (leaked.length > 0) {
    return [blocker("ATTRIBUTION_PII_LEAK", `Non-allow-listed keys survived sanitizeUtm: ${leaked.join(", ")}`)];
  }
  return [];
}

function checkRouteWiring(): Finding[] {
  const routeFile = path.resolve(process.cwd(), "app/api/lead/route.ts");
  if (!existsSync(routeFile)) {
    return [blocker("LEAD_ROUTE_MISSING", "app/api/lead/route.ts not found")];
  }
  const src = readFileSync(routeFile, "utf8");
  const findings: Finding[] = [];
  const require = (needle: string, code: string, msg: string) => {
    if (!src.includes(needle)) findings.push(blocker(code, msg, { detail: "app/api/lead/route.ts" }));
  };
  require("resolveAttribution", "LEAD_NO_ATTRIBUTION", "Lead route does not call resolveAttribution");
  require("brand: attribution.brand", "LEAD_BRAND_NOT_SERVER", "Lead route does not store server-derived brand");
  require("rateLimit", "LEAD_NO_RATELIMIT", "Lead route is not rate-limited");
  require("checkHoneypot", "LEAD_NO_HONEYPOT", "Lead route has no honeypot check");
  if (!src.includes("HONEYPOT_FIELD") && !src.includes(HONEYPOT_FIELD)) {
    findings.push(
      blocker("LEAD_NO_HONEYPOT_FIELD", "Lead route does not reference the honeypot field", {
        detail: "app/api/lead/route.ts",
      })
    );
  }
  // Client brand must not be blindly stored (only used as fallback).
  if (/brand:\s*body\.brand\b/.test(src)) {
    findings.push(warning("LEAD_TRUSTS_CLIENT_BRAND", "Lead route may store client-provided brand directly"));
  }
  return findings;
}

export function checkLeadMap(): Finding[] {
  const findings: Finding[] = [
    ...checkChannels(),
    ...checkBrandAuthority(),
    ...checkUtmAllowlist(),
    ...checkRouteWiring(),
  ];
  if (!findings.some((f) => f.severity === "blocker")) {
    findings.push(
      info(
        "LEAD_MAP_OK",
        `Attribution model + lead-route security verified (${CHANNEL_CASES.length} channel cases)`
      )
    );
  }
  return findings;
}
