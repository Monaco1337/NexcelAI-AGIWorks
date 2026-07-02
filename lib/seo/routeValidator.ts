/**
 * Route validator — reconciles the physical app router tree with the page
 * registry.
 *
 *  - Every registry page MUST have a matching app/**\/page.tsx (else BLOCKER):
 *    a registered indexable page that 404s is a hard error.
 *  - Content-type app routes that are not registered are reported as INFO/
 *    WARNING (utility/auth/dynamic routes are ignored).
 *
 * Node-only (fast-glob + fs). CI-only module: not imported by the Next app graph.
 */

import fg from "fast-glob";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  AGI_INTERNAL_PREFIX,
  cleanAgiPath,
  type BrandKey,
} from "@/config/seo/domains";
import { PAGE_REGISTRY, type SeoPage } from "@/config/seo/pageRegistry";
import { blocker, warning, info, type Finding } from "./findings";

const APP_DIR = path.resolve(process.cwd(), "app");

/** Route segments that are intentionally NOT part of the SEO registry. */
const IGNORED_FIRST_SEGMENTS = new Set([
  "api",
  "admin",
  "demo",
  "demo-anfordern",
  "login",
  "verify-email",
  "diagnose",
  "systemanalyse", // /systemanalyse/deep is a tool sub-route
  "systeme", // dynamic /systeme/[slug]
]);

/** Convert an app-relative page.tsx file to its route pathname. */
function fileToRoute(file: string): string {
  // file like "preise/page.tsx" or "agiworks/impressum/page.tsx" or "page.tsx"
  const dir = file.replace(/\/?page\.tsx$/, "");
  if (dir === "" || dir === ".") return "/";
  return "/" + dir;
}

function routeToBrandPath(route: string): { brand: BrandKey; cleanPath: string } {
  if (route === AGI_INTERNAL_PREFIX || route.startsWith(AGI_INTERNAL_PREFIX + "/")) {
    return { brand: "agiworks", cleanPath: cleanAgiPath(route) };
  }
  return { brand: "nexcel", cleanPath: route };
}

function expectedFileForPage(page: SeoPage): string {
  const internal = page.internalPath;
  if (internal === "/") return path.join(APP_DIR, "page.tsx");
  return path.join(APP_DIR, internal.replace(/^\//, ""), "page.tsx");
}

/**
 * Some registry pages are served by a catch-all dynamic route (e.g. money pages
 * under app/loesungen/[slug]/page.tsx) instead of a static folder per slug.
 * Treat a page as present when its parent directory contains a `[param]/page.tsx`.
 */
function hasDynamicBacking(page: SeoPage): boolean {
  const internal = page.internalPath;
  if (internal === "/") return false;
  const parent = internal.replace(/\/[^/]+$/, "");
  const parentDir = path.join(APP_DIR, parent.replace(/^\//, ""));
  if (!existsSync(parentDir)) return false;
  const matches = fg.sync("*/page.tsx", { cwd: parentDir, dot: false });
  return matches.some((f) => /^\[[^\]]+\]\/page\.tsx$/.test(f));
}

export async function validateRoutes(pages: SeoPage[] = PAGE_REGISTRY): Promise<Finding[]> {
  const findings: Finding[] = [];

  // 1. Every registry page must have a physical route file (static folder or a
  //    catch-all dynamic route in its parent directory).
  for (const p of pages) {
    const file = expectedFileForPage(p);
    if (!existsSync(file) && !hasDynamicBacking(p)) {
      findings.push(
        blocker("REGISTRY_ROUTE_MISSING", `No page.tsx for registry page ${p.id}`, {
          brand: p.brand,
          pageId: p.id,
          path: p.path,
          detail: path.relative(process.cwd(), file),
        })
      );
    }
  }

  // 2. Discover app routes and flag unregistered content routes.
  const files = await fg("**/page.tsx", { cwd: APP_DIR, dot: false });
  const registrySet = new Set(pages.map((p) => `${p.brand}:${p.path}`));

  for (const file of files) {
    const route = fileToRoute(file);
    const firstSeg = route.replace(/^\//, "").split("/")[0];
    const agiFirstSeg = route.startsWith(AGI_INTERNAL_PREFIX + "/")
      ? route.replace(AGI_INTERNAL_PREFIX + "/", "").split("/")[0]
      : firstSeg;

    // Ignore dynamic segments and known non-SEO subtrees.
    if (route.includes("[")) continue;
    if (IGNORED_FIRST_SEGMENTS.has(firstSeg)) continue;
    if (route.startsWith(AGI_INTERNAL_PREFIX) && IGNORED_FIRST_SEGMENTS.has(agiFirstSeg)) continue;

    const { brand, cleanPath } = routeToBrandPath(route);
    const key = `${brand}:${cleanPath}`;
    if (!registrySet.has(key)) {
      findings.push(
        info("ROUTE_NOT_REGISTERED", `App route not in registry: ${route}`, {
          brand,
          path: cleanPath,
          detail: file,
        })
      );
    }
  }

  if (!findings.some((f) => f.severity === "blocker")) {
    findings.push(info("ROUTES_OK", `Validated ${pages.length} registry pages against app tree`));
  }
  return findings;
}
