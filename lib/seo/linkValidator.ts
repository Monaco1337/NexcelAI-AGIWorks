/**
 * Link validator — scans app/ and components/ for static internal links
 * (href="/...") and verifies each resolves to a real route.
 *
 * Only static string hrefs are checked (template/expression hrefs are skipped to
 * avoid false positives). Unknown internal targets are WARNINGS (the parser is
 * intentionally conservative).
 *
 * Node-only (fast-glob + fs). CI-only module: not imported by the Next app graph.
 */

import fg from "fast-glob";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanAgiPath } from "@/config/seo/domains";
import { warning, info, type Finding } from "./findings";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");

/** Dynamic / utility route prefixes that accept arbitrary sub-paths. */
const ALLOWED_PREFIXES = [
  "/systeme/",
  "/leistungen/",
  "/loesungen/",
  "/standorte/",
  "/wissen/",
  "/diagnose/",
  "/systemanalyse",
  "/admin",
  "/login",
  "/demo",
  "/demo-anfordern",
  "/verify-email",
  "/api/",
];

const HREF_RE = /\bhref=["'](\/[^"'{}\s]*)["']/g;

/** Static-asset extensions and public asset dirs are not routes. */
const ASSET_EXT_RE = /\.(png|jpe?g|svg|gif|webp|avif|ico|css|js|mjs|json|txt|xml|pdf|woff2?|ttf|eot|mp4|webm|map)$/i;
const ASSET_PREFIXES = ["/images/", "/img/", "/assets/", "/fonts/", "/icons/", "/_next/", "/static/", "/videos/"];

function isAsset(target: string): boolean {
  const clean = target.split(/[?#]/)[0] || "";
  if (ASSET_EXT_RE.test(clean)) return true;
  return ASSET_PREFIXES.some((p) => clean.startsWith(p));
}

async function knownCleanRoutes(): Promise<Set<string>> {
  const files = await fg("**/page.tsx", { cwd: APP_DIR, dot: false });
  const set = new Set<string>(["/"]);
  for (const file of files) {
    if (file.includes("[")) continue; // dynamic → covered by prefixes
    const dir = file.replace(/\/?page\.tsx$/, "");
    const route = dir === "" || dir === "." ? "/" : "/" + dir;
    const clean = cleanAgiPath(route) || "/";
    set.add(clean);
    set.add(route);
  }
  return set;
}

function isAllowed(target: string, known: Set<string>): boolean {
  const clean = (target.split(/[?#]/)[0] || "/").replace(/\/$/, "") || "/";
  if (known.has(clean)) return true;
  if (known.has(cleanAgiPath(clean) || "/")) return true;
  return ALLOWED_PREFIXES.some((p) => clean === p || clean.startsWith(p));
}

export async function validateLinks(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const known = await knownCleanRoutes();

  const files = await fg(["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"], {
    cwd: ROOT,
    dot: false,
    ignore: ["**/node_modules/**"],
  });

  const seen = new Set<string>();
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    let m: RegExpExecArray | null;
    HREF_RE.lastIndex = 0;
    while ((m = HREF_RE.exec(content)) !== null) {
      const target = m[1];
      if (!target.startsWith("/") || target.startsWith("//")) continue;
      if (isAsset(target)) continue;
      if (isAllowed(target, known)) continue;
      const key = `${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(
        warning("UNKNOWN_INTERNAL_LINK", `Static link to unknown route: ${target}`, { detail: rel })
      );
    }
  }

  if (findings.length === 0) {
    findings.push(info("LINKS_OK", "All static internal links resolve to known routes"));
  }
  return findings;
}
