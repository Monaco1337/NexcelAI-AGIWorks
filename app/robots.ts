import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostToBrand } from "@/config/seo/domains";
import { getCanonicalDomain } from "@/config/seo/brands";

/**
 * Host-aware robots.txt.
 *  - nexcelai.de  → allow, points to the NEXCEL sitemap.
 *  - agiworks.de  → allow, points to the AGI Works sitemap.
 *  - unknown / local / preview → disallow all (prevents preview indexing).
 *
 * Must be dynamic because the response depends on the request Host header.
 */
export const dynamic = "force-dynamic";

const DISALLOWED = ["/admin", "/api", "/demo", "/login", "/verify-email", "/diagnose"];

export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host");
  const brand = hostToBrand(host);

  if (!brand) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  const origin = getCanonicalDomain(brand);
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
