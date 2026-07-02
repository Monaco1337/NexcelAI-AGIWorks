/**
 * Schema validator — validates the JSON-LD builders emit only factual,
 * policy-compliant structured data.
 *
 * BLOCKS on forbidden keys (fake trust signals): aggregateRating, review,
 * ratingValue, openingHours, geo/latitude/longitude. Verifies required top-level
 * keys and that every URL lives on the owning brand's canonical domain.
 *
 * CI-only module: not imported by the Next app graph.
 */

import { CANONICAL_DOMAIN, type BrandKey } from "@/config/seo/domains";
import { PAGE_REGISTRY, type SeoPage } from "@/config/seo/pageRegistry";
import {
  organizationSchema,
  webSiteSchema,
  personSchema,
  webPageSchema,
  faqSchema,
  serviceSchema,
  articleSchema,
} from "./jsonld";
import { blocker, warning, info, type Finding } from "./findings";

const FORBIDDEN_KEYS = [
  "aggregateRating",
  "review",
  "ratingValue",
  "ratingCount",
  "reviewCount",
  "openingHours",
  "openingHoursSpecification",
  "geo",
  "latitude",
  "longitude",
];

function collectForbidden(node: unknown, path: string, out: { key: string; at: string }[]): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectForbidden(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.includes(k)) out.push({ key: k, at: `${path}.${k}` });
      collectForbidden(v, `${path}.${k}`, out);
    }
  }
}

function collectUrls(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((v) => collectUrls(v, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const v of Object.values(node as Record<string, unknown>)) collectUrls(v, out);
    return;
  }
  if (typeof node === "string" && /^https?:\/\//i.test(node)) out.push(node);
}

function validateSchema(
  label: string,
  schema: Record<string, unknown>,
  brand: BrandKey
): Finding[] {
  const findings: Finding[] = [];
  const meta = { brand, detail: label };

  if (!schema["@context"]) {
    findings.push(blocker("SCHEMA_NO_CONTEXT", `${label}: missing @context`, meta));
  }
  if (!schema["@type"]) {
    findings.push(blocker("SCHEMA_NO_TYPE", `${label}: missing @type`, meta));
  }

  const forbidden: { key: string; at: string }[] = [];
  collectForbidden(schema, label, forbidden);
  for (const f of forbidden) {
    findings.push(blocker("SCHEMA_FORBIDDEN_KEY", `${label}: forbidden key "${f.key}" at ${f.at}`, meta));
  }

  const expectedHost = new URL(CANONICAL_DOMAIN[brand]).host;
  const urls: string[] = [];
  collectUrls(schema, urls);
  for (const u of urls) {
    let host: string;
    try {
      host = new URL(u).host;
    } catch {
      findings.push(blocker("SCHEMA_INVALID_URL", `${label}: invalid URL "${u}"`, meta));
      continue;
    }
    // Only enforce our own domains; external URLs (schema.org, social) are fine.
    const isOurDomain = Object.values(CANONICAL_DOMAIN).some((d) => new URL(d).host === host);
    if (isOurDomain && host !== expectedHost) {
      findings.push(
        blocker("SCHEMA_CROSS_DOMAIN_URL", `${label}: URL host "${host}" != brand host "${expectedHost}"`, {
          ...meta,
          detail: u,
        })
      );
    }
  }

  return findings;
}

export function validateSchemas(pages: SeoPage[] = PAGE_REGISTRY): Finding[] {
  const findings: Finding[] = [];

  (["nexcel", "agiworks"] as BrandKey[]).forEach((brand) => {
    const origin = CANONICAL_DOMAIN[brand];
    findings.push(...validateSchema(`organization(${brand})`, organizationSchema(brand), brand));
    findings.push(...validateSchema(`website(${brand})`, webSiteSchema(brand), brand));
    findings.push(...validateSchema(`person(${brand})`, personSchema(brand), brand));
    findings.push(
      ...validateSchema(
        `service(${brand})`,
        serviceSchema({
          brand,
          name: "Systemdesign",
          description: "Konzeption und Umsetzung digitaler Unternehmenssysteme.",
          url: `${origin}/leistungen/systemdesign`,
        }),
        brand
      )
    );
    findings.push(
      ...validateSchema(
        `article(${brand})`,
        articleSchema({
          brand,
          headline: "Wie digitale Systemarchitektur funktioniert",
          description: "Grundlagen strukturierter Unternehmenssysteme.",
          url: `${origin}/wissen/systemarchitektur`,
        }),
        brand
      )
    );
  });

  for (const p of pages) {
    findings.push(...validateSchema(`webpage(${p.id})`, webPageSchema(p), p.brand));
  }

  // Self-test: faqSchema must only be emitted for non-empty FAQ. An empty FAQ
  // schema is a policy smell (structured data without visible content).
  const emptyFaq = faqSchema([]);
  const mainEntity = emptyFaq.mainEntity;
  if (Array.isArray(mainEntity) && mainEntity.length === 0) {
    findings.push(
      warning(
        "FAQ_EMPTY_GUARD",
        "faqSchema([]) yields an empty FAQPage — callers must only render it with visible FAQ items"
      )
    );
  }

  if (!findings.some((f) => f.severity === "blocker")) {
    findings.push(info("SCHEMA_OK", `Validated JSON-LD for ${pages.length} pages + 2 brands`));
  }
  return findings;
}
