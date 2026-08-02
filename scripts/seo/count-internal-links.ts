/**
 * Internal-link census.
 *
 * Counts real internal links in the PRERENDERED HTML (`.next/server/app`), not
 * in the source, so navigation, footer, mega-menu and contextual blocks are all
 * included exactly as a crawler would see them.
 *
 * Reports the same shape Search Console does: total internal links plus the
 * most-linked target pages.
 *
 * Usage: npm run seo:links:count   (requires a prior `npm run build`)
 */

import fg from "fast-glob";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HTML_DIR = path.join(ROOT, ".next", "server", "app");

const HREF_RE = /href="(\/[^"#?]*)"/g;
const ASSET_RE = /\.(png|jpe?g|svg|gif|webp|avif|ico|css|js|mjs|json|txt|xml|pdf|woff2?|ttf)$/i;
const ASSET_PREFIX = ["/_next/", "/images/", "/img/", "/assets/", "/fonts/", "/icons/", "/videos/"];
const NON_INDEXABLE = ["/admin", "/api/", "/login", "/demo", "/verify-email", "/diagnose"];

function isCountable(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (ASSET_RE.test(href)) return false;
  if (ASSET_PREFIX.some((p) => href.startsWith(p))) return false;
  if (NON_INDEXABLE.some((p) => href === p || href.startsWith(p))) return false;
  return true;
}

/** ".next/server/app/agiworks/systeme/erp-systeme.html" → "agiworks | /systeme/erp-systeme" */
function routeOf(file: string): { brand: string; route: string } {
  let route = "/" + file.replace(/\.html$/, "");
  if (route.endsWith("/index")) route = route.slice(0, -"/index".length) || "/";
  if (route === "/index") route = "/";
  if (route === "/agiworks" || route.startsWith("/agiworks/")) {
    const clean = route.slice("/agiworks".length) || "/";
    return { brand: "agiworks", route: clean };
  }
  return { brand: "nexcel", route };
}

function main(): void {
  if (!existsSync(HTML_DIR)) {
    console.error(`No prerendered output at ${path.relative(ROOT, HTML_DIR)} — run "npm run build" first.`);
    process.exit(1);
  }

  const files = fg.sync("**/*.html", { cwd: HTML_DIR, dot: false });
  if (files.length === 0) {
    console.error("No .html files found in the build output.");
    process.exit(1);
  }

  let total = 0;
  const perBrand: Record<string, { pages: number; links: number }> = {};
  const inboundTo = new Map<string, number>();
  const outboundFrom: { page: string; count: number }[] = [];

  for (const file of files) {
    const { brand, route } = routeOf(file);
    const html = readFileSync(path.join(HTML_DIR, file), "utf8");

    let m: RegExpExecArray | null;
    HREF_RE.lastIndex = 0;
    let pageLinks = 0;
    while ((m = HREF_RE.exec(html)) !== null) {
      const href = m[1];
      if (!isCountable(href)) continue;
      pageLinks++;
      const key = `${brand}${href}`;
      inboundTo.set(key, (inboundTo.get(key) ?? 0) + 1);
    }

    total += pageLinks;
    perBrand[brand] = perBrand[brand] ?? { pages: 0, links: 0 };
    perBrand[brand].pages += 1;
    perBrand[brand].links += pageLinks;
    outboundFrom.push({ page: `${brand} ${route}`, count: pageLinks });
  }

  console.log("═══════════ INTERNE LINKS — GESAMTBILANZ ═══════════\n");
  console.log(`Gerenderte Seiten:      ${files.length}`);
  console.log(`Interne Links gesamt:   ${total.toLocaleString("de-DE")}`);
  console.log(`Ø Links pro Seite:      ${Math.round(total / files.length)}\n`);

  for (const [brand, s] of Object.entries(perBrand)) {
    console.log(`  ${brand.padEnd(10)} ${String(s.pages).padStart(4)} Seiten   ${String(s.links).padStart(6)} Links`);
  }

  const ranked = Array.from(inboundTo.entries()).sort((a, b) => b[1] - a[1]);
  console.log(`\nVerlinkte Ziel-URLs:    ${ranked.length}`);
  console.log("\n─── Top 20 meistverlinkte Seiten (GSC: Interne Links) ───");
  ranked.slice(0, 20).forEach(([target, n], i) => {
    console.log(`${String(i + 1).padStart(3)}. ${String(n).padStart(5)}  ${target}`);
  });

  const orphans = ranked.filter(([, n]) => n <= 2);
  console.log(`\nZiele mit ≤ 2 eingehenden Links: ${orphans.length}`);
  orphans.slice(0, 15).forEach(([target, n]) => console.log(`     ${n}  ${target}`));

  console.log(`\n${total >= 10000 ? "✅" : "⚠️ "} Ziel 10.000 interne Links: ${total.toLocaleString("de-DE")}`);
}

main();
