/**
 * SEO-CI check registry. Each check builds inputs from the real registry (which
 * must stay clean) and, where relevant, runs the negative fixtures as a
 * self-test that PROVES the guard can fail. Guards that fail to flag known-bad
 * fixtures produce a blocker themselves.
 *
 * Run via tsx: `tsx scripts/seo/run.ts <check|all|audit>`.
 */

import { PAGE_REGISTRY, type SeoPage } from "@/config/seo/pageRegistry";
import { SEO_BRANDS } from "@/config/seo/brands";
import { isPageIndexable } from "@/config/seo/indexing";
import { canonicalForPage } from "@/lib/seo/canonical";
import { CANONICAL_DOMAIN, type BrandKey } from "@/config/seo/domains";

import { type CheckReport, type Finding, blocker, info, hasBlockers } from "@/lib/seo/findings";
import { analyzeContent, type ContentInput } from "@/lib/seo/contentRules";
import { getIndexabilityStatus } from "@/lib/seo/qualityGate";
import { checkDuplicates, type DuplicateInput } from "@/lib/seo/duplicateGuard";
import {
  checkRegistryCrossDomain,
  checkCrossDomainOwnership,
} from "@/lib/seo/crossDomainGuard";
import { checkRegistryBrands } from "@/lib/seo/brandGuard";
import { checkRegistryLocations } from "@/lib/seo/locationGuard";
import { validateRoutes } from "@/lib/seo/routeValidator";
import { validateLinks } from "@/lib/seo/linkValidator";
import { validateSchemas } from "@/lib/seo/schemaValidator";
import { checkLeadMap } from "@/lib/seo/leadMap";
import { validateTemplates } from "@/lib/seo/templatesGuard";
import { checkCaseStudies } from "@/lib/seo/caseStudyGuard";
import {
  BAD_CROSS_DOMAIN_PAGES,
  BAD_DUPLICATE_PAGES,
  BAD_CONTENT,
} from "@/lib/seo/__fixtures__/crossDomainDuplicates";

function brandCities(brand: BrandKey): string[] {
  return SEO_BRANDS[brand].areaServed;
}

function contentInputs(): ContentInput[] {
  return PAGE_REGISTRY.map((p) => ({
    brand: p.brand,
    pageId: p.id,
    path: p.path,
    title: p.title,
    description: p.description,
  }));
}

function duplicateInputs(): DuplicateInput[] {
  return PAGE_REGISTRY.map((p) => ({
    id: p.id,
    brand: p.brand,
    path: p.path,
    text: `${p.title} ${p.description}`,
    isBoilerplate: p.type === "legal",
  }));
}

/** Assert a self-test: known-bad input MUST produce blockers. */
function selfTest(label: string, findings: Finding[]): Finding {
  if (hasBlockers(findings)) {
    return info("GUARD_SELFTEST_OK", `${label}: negative fixtures correctly flagged`);
  }
  return blocker(
    "GUARD_SELFTEST_FAILED",
    `${label}: guard did NOT flag known-bad fixtures (guard is broken)`
  );
}

export interface Check {
  name: string;
  run: () => Promise<CheckReport> | CheckReport;
}

const routes: Check = {
  name: "routes",
  run: async () => ({ name: "routes", findings: await validateRoutes() }),
};

const crossdomain: Check = {
  name: "crossdomain",
  run: () => {
    const findings: Finding[] = [];
    findings.push(...checkRegistryCrossDomain());
    findings.push(selfTest("crossdomain", checkCrossDomainOwnership(BAD_CROSS_DOMAIN_PAGES)));
    return { name: "crossdomain", findings };
  },
};

const duplicates: Check = {
  name: "duplicates",
  run: () => {
    const findings: Finding[] = [];
    findings.push(...checkDuplicates(duplicateInputs()));
    findings.push(selfTest("duplicates", checkDuplicates(BAD_DUPLICATE_PAGES)));
    if (!hasBlockers(findings)) {
      findings.push(info("DUPLICATES_OK", `No cross-domain duplicates in ${PAGE_REGISTRY.length} pages`));
    }
    return { name: "duplicates", findings };
  },
};

const content: Check = {
  name: "content",
  run: () => {
    const findings: Finding[] = [];
    for (const ci of contentInputs()) {
      findings.push(...analyzeContent(ci, brandCities(ci.brand)));
    }
    const badFindings: Finding[] = [];
    for (const bad of BAD_CONTENT) badFindings.push(...analyzeContent(bad, []));
    findings.push(selfTest("content", badFindings));
    if (!findings.some((f) => f.severity === "blocker")) {
      findings.push(info("CONTENT_OK", `Content rules passed for ${PAGE_REGISTRY.length} pages`));
    }
    return { name: "content", findings };
  },
};

const quality: Check = {
  name: "quality",
  run: () => {
    const findings: Finding[] = [];
    for (const p of PAGE_REGISTRY) {
      const res = getIndexabilityStatus(p, { cities: brandCities(p.brand) });
      findings.push(...res.findings);
    }
    return { name: "quality", findings };
  },
};

const brand: Check = {
  name: "brand",
  run: () => ({ name: "brand", findings: checkRegistryBrands() }),
};

const location: Check = {
  name: "location",
  run: () => ({ name: "location", findings: checkRegistryLocations() }),
};

const schema: Check = {
  name: "schema",
  run: () => ({ name: "schema", findings: validateSchemas() }),
};

const links: Check = {
  name: "links",
  run: async () => ({ name: "links", findings: await validateLinks() }),
};

const sitemap: Check = {
  name: "sitemap",
  run: () => {
    const findings: Finding[] = [];
    const perBrand: Record<BrandKey, number> = { nexcel: 0, agiworks: 0 };
    const indexable = PAGE_REGISTRY.filter((p: SeoPage) => isPageIndexable(p));
    for (const p of indexable) {
      perBrand[p.brand] += 1;
      const url = canonicalForPage(p);
      let host = "";
      try {
        host = new URL(url).host;
      } catch {
        findings.push(blocker("SITEMAP_INVALID_URL", `Invalid canonical for ${p.id}: ${url}`, { brand: p.brand, pageId: p.id }));
        continue;
      }
      const wantHost = new URL(CANONICAL_DOMAIN[p.brand]).host;
      if (host !== wantHost) {
        findings.push(
          blocker("SITEMAP_CROSS_DOMAIN", `Sitemap URL ${url} not on ${wantHost}`, { brand: p.brand, pageId: p.id, path: p.path })
        );
      }
    }
    (["nexcel", "agiworks"] as BrandKey[]).forEach((b) => {
      if (perBrand[b] === 0) {
        findings.push(blocker("SITEMAP_EMPTY", `No indexable pages for ${b}`, { brand: b }));
      } else {
        findings.push(info("SITEMAP_COUNT", `${perBrand[b]} indexable URLs for ${b}`, { brand: b }));
      }
    });
    return { name: "sitemap", findings };
  },
};

const leadMap: Check = {
  name: "lead-map",
  run: () => ({ name: "lead-map", findings: checkLeadMap() }),
};

const templates: Check = {
  name: "templates",
  run: async () => ({ name: "templates", findings: await validateTemplates() }),
};

const caseStudies: Check = {
  name: "case-studies",
  run: () => ({ name: "case-studies", findings: checkCaseStudies() }),
};

export const CHECKS: Check[] = [
  routes,
  crossdomain,
  duplicates,
  content,
  quality,
  brand,
  location,
  schema,
  links,
  sitemap,
  leadMap,
  templates,
  caseStudies,
];

export const CHECK_BY_NAME: Record<string, Check> = Object.fromEntries(
  CHECKS.map((c) => [c.name, c])
);
