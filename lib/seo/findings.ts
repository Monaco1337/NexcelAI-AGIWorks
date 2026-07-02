/**
 * Shared finding / severity model for all SEO guards and CI checks.
 *
 * A "blocker" MUST fail `seo:all` (non-zero exit). Warnings and info never fail
 * the build but are reported. Every guard returns Finding[] so the CI runner can
 * aggregate uniformly.
 *
 * CI-only module: not imported by the Next app graph.
 */

import type { BrandKey } from "@/config/seo/domains";

export type Severity = "blocker" | "warning" | "info";

export interface Finding {
  severity: Severity;
  /** Stable machine code, e.g. "CROSS_DOMAIN_CANONICAL". */
  code: string;
  message: string;
  brand?: BrandKey;
  pageId?: string;
  path?: string;
  detail?: string;
}

export interface CheckReport {
  /** Human name of the check, e.g. "cross-domain". */
  name: string;
  findings: Finding[];
}

export function blocker(
  code: string,
  message: string,
  extra: Partial<Finding> = {}
): Finding {
  return { severity: "blocker", code, message, ...extra };
}

export function warning(
  code: string,
  message: string,
  extra: Partial<Finding> = {}
): Finding {
  return { severity: "warning", code, message, ...extra };
}

export function info(
  code: string,
  message: string,
  extra: Partial<Finding> = {}
): Finding {
  return { severity: "info", code, message, ...extra };
}

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  return findings.reduce(
    (acc, f) => {
      acc[f.severity] += 1;
      return acc;
    },
    { blocker: 0, warning: 0, info: 0 } as Record<Severity, number>
  );
}

export function hasBlockers(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === "blocker");
}
