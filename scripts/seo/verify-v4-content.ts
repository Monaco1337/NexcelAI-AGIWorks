import { AUTHORITY_PAGES } from "../../data/authorityPortfolio";
import depth from "../../data/authorityDepth.json";
import commercial from "../../data/commercialDepth.json";
import { MONEY_PAGES } from "../../data/moneyPages";

const errors: string[] = [];
const deep = depth as Record<string, {decision:string;validation:string}>;
const money = commercial as Record<string, {intent:string;architecture:string;deliverable:string;acceptance:string;related:string[]}>;
if (AUTHORITY_PAGES.length !== 100) errors.push("authority page count != 100");
if (Object.keys(deep).length !== 100) errors.push("depth records != 100");
for (const page of AUTHORITY_PAGES) {
  const item = deep[page.slug];
  if (!item) { errors.push(`missing authority depth ${page.slug}`); continue; }
  if (item.decision.length < 110 || item.validation.length < 110) errors.push(`thin depth ${page.slug}`);
  if (page.approved !== true || page.manualIndexApproval !== true) errors.push(`unexpected index state ${page.slug}`);
}
if (Object.keys(money).length !== 8) errors.push("commercial records != 8");
for (const [id,item] of Object.entries(money)) {
  const base = MONEY_PAGES.find(p=>`${p.brand}:${p.path}`===id);
  if (!base) errors.push(`unknown commercial page ${id}`);
  for (const field of ["intent","architecture","deliverable","acceptance"] as const)
    if (item[field].length < 95) errors.push(`thin commercial ${id} ${field}`);
  for (const link of item.related) {
    const expectedRoot = base?.brand === "agiworks" ? "/engineering/" : "/anwendungen/";
    if (!link.startsWith(expectedRoot)) errors.push(`cross-brand or invalid link ${id}: ${link}`);
    if (!AUTHORITY_PAGES.some(p => p.brand===base?.brand && p.path===link)) errors.push(`missing topic ${id}: ${link}`);
  }
}
// Textual fingerprints must not repeat across the 100 records.
const normalized = Object.values(deep).map(e=>`${e.decision} ${e.validation}`.toLowerCase().replace(/\s+/g," ").trim());
if (new Set(normalized).size!==100) errors.push("duplicate authored depth text");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("V4_CONTENT_GATE_OK: 100/100 authority; 8/8 commercial; links clean; index state preserved");
