/**
 * Templates guard — keeps the Phase 4 template + trust components free of banned
 * phrases and fake trust signals.
 *
 * Scans component source under components/templates/** and components/trust/**
 * for ranking guarantees, unsupported superlatives, template placeholders and
 * fake trust markers (star ratings, review counts, invented awards). Includes a
 * self-test proving the scan can fail.
 *
 * Node-only (fast-glob + fs). CI-only module: not imported by the Next app graph.
 */

import fg from "fast-glob";
import { readFileSync } from "node:fs";
import path from "node:path";
import { scanBannedPhrases } from "./contentRules";
import { blocker, info, type Finding } from "./findings";

const ROOT = process.cwd();

/** Fake-trust markers that must never be hard-coded into a template. */
const FAKE_TRUST_PATTERNS: { code: string; re: RegExp }[] = [
  { code: "FAKE_STAR_RATING", re: /\b\d(?:[.,]\d)?\s*\/\s*5\b|\b\d(?:[.,]\d)?\s*sterne\b|★{2,}/i },
  { code: "FAKE_REVIEW_COUNT", re: /\b\d{2,}\+?\s*(bewertungen|reviews|kundenbewertungen)\b/i },
  { code: "FAKE_AWARD", re: /\b(ausgezeichnet als|award[-\s]?winning|preisgekr(ö|o)nt)\b/i },
];

function scanText(text: string): { code: string; hit: string }[] {
  const hits = scanBannedPhrases(text);
  for (const { code, re } of FAKE_TRUST_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push({ code, hit: m[0] });
  }
  return hits;
}

export async function validateTemplates(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const files = await fg(
    ["components/templates/**/*.{ts,tsx}", "components/trust/**/*.{ts,tsx}"],
    { cwd: ROOT, dot: false }
  );

  for (const rel of files) {
    let src: string;
    try {
      src = readFileSync(path.join(ROOT, rel), "utf8");
    } catch {
      continue;
    }
    for (const { code, hit } of scanText(src)) {
      findings.push(blocker(code, `Banned/fake-trust phrase in template: "${hit}"`, { detail: rel }));
    }
  }

  // Self-test: the scanner must flag a known-bad string.
  const bad = scanText('Wir sind garantiert Platz 1 bei Google, 5 sterne, weltweit führend.');
  if (bad.length === 0) {
    findings.push(
      blocker("GUARD_SELFTEST_FAILED", "templates guard failed to flag known-bad phrases")
    );
  } else {
    findings.push(info("GUARD_SELFTEST_OK", "templates: negative fixture correctly flagged"));
  }

  if (!findings.some((f) => f.severity === "blocker")) {
    findings.push(info("TEMPLATES_OK", `Scanned ${files.length} template/trust files, no banned phrases`));
  }
  return findings;
}
