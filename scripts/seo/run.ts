/**
 * SEO-CI runner.
 *
 *   tsx scripts/seo/run.ts <check>   run a single check (routes, crossdomain, …)
 *   tsx scripts/seo/run.ts all       run every check; exit non-zero on any blocker
 *   tsx scripts/seo/run.ts audit     alias for `all` (full report)
 *
 * Exit codes: 0 = no blockers, 1 = one or more blockers, 2 = usage error.
 */

import { CHECKS, CHECK_BY_NAME, type Check } from "./checks";
import {
  countBySeverity,
  hasBlockers,
  type CheckReport,
  type Finding,
  type Severity,
} from "@/lib/seo/findings";

const ICON: Record<Severity, string> = {
  blocker: "✖",
  warning: "▲",
  info: "•",
};

function line(f: Finding): string {
  const loc = [f.brand, f.pageId ?? f.path].filter(Boolean).join(" ");
  const where = loc ? ` [${loc}]` : "";
  const detail = f.detail ? `  — ${f.detail}` : "";
  return `  ${ICON[f.severity]} ${f.code}${where}: ${f.message}${detail}`;
}

function printReport(report: CheckReport): void {
  const counts = countBySeverity(report.findings);
  console.log(
    `\n=== ${report.name} === (${counts.blocker} blockers, ${counts.warning} warnings, ${counts.info} info)`
  );
  // Blockers first, then warnings, then info.
  const order: Severity[] = ["blocker", "warning", "info"];
  for (const sev of order) {
    for (const f of report.findings.filter((x) => x.severity === sev)) {
      console.log(line(f));
    }
  }
}

async function runOne(check: Check): Promise<CheckReport> {
  const report = await check.run();
  printReport(report);
  return report;
}

async function main(): Promise<void> {
  const arg = (process.argv[2] ?? "all").toLowerCase();

  if (arg === "list") {
    console.log("Available checks:", CHECKS.map((c) => c.name).join(", "));
    process.exit(0);
  }

  const runAll = arg === "all" || arg === "audit";
  const checks = runAll ? CHECKS : CHECK_BY_NAME[arg] ? [CHECK_BY_NAME[arg]] : null;

  if (!checks) {
    console.error(`Unknown check "${arg}". Available: ${CHECKS.map((c) => c.name).join(", ")}, all, audit`);
    process.exit(2);
  }

  const all: Finding[] = [];
  for (const c of checks) {
    const report = await runOne(c);
    all.push(...report.findings);
  }

  const totals = countBySeverity(all);
  console.log(
    `\n================ SEO-CI SUMMARY ================\n` +
      `checks: ${checks.length}  blockers: ${totals.blocker}  warnings: ${totals.warning}  info: ${totals.info}`
  );

  if (hasBlockers(all)) {
    console.error(`\nFAILED: ${totals.blocker} blocker(s) must be fixed before deploy.`);
    process.exit(1);
  }
  console.log(`\nPASSED: no blockers.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("SEO-CI crashed:", err);
  process.exit(1);
});
