import { headers } from "next/headers";
import { hostToBrand } from "@/config/seo/domains";
import { getBrandConfig } from "@/config/seo/brands";
import { getPagesForBrand } from "@/config/seo/pageRegistry";
import { isPageIndexable } from "@/config/seo/indexing";
import { canonicalForPage } from "@/lib/seo/canonical";

/**
 * Host-aware llms.txt — a short, factual, brand-specific description for LLM
 * crawlers. No ranking claims, no superlatives, no invented facts. Lists only
 * indexable registry URLs for the brand that owns the current host.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const host = (await headers()).get("host");
  const brand = hostToBrand(host);

  if (!brand) {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const cfg = getBrandConfig(brand);
  const pages = getPagesForBrand(brand).filter((p) => isPageIndexable(p));

  const lines: string[] = [];
  lines.push(`# ${cfg.publicName}`);
  lines.push("");
  lines.push(
    `${cfg.publicName} (${cfg.primaryOwner}) mit Sitz in Unna, Nordrhein-Westfalen.`
  );
  lines.push(`Themen: ${cfg.topics.join(", ")}.`);
  lines.push(`Tätigkeitsgebiet: ${cfg.areaServed.join(", ")}.`);
  lines.push(cfg.cooperationLine);
  lines.push("");
  lines.push(`Website: ${cfg.canonicalDomain}/`);
  lines.push(`Kontakt: ${cfg.email}`);
  lines.push("");
  lines.push("## Seiten");
  pages.forEach((p) => {
    lines.push(`- ${p.title}: ${canonicalForPage(p)}`);
  });
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
