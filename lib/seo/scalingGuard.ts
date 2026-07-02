/**
 * Scaling guard (Phase 9) — keeps national scaling safe.
 *
 * Same-type near-duplicates are handled by each type's own generic-template guard
 * (money/location/knowledge, ≥ 0.70). This guard governs the SYSTEM level:
 *
 *  - Location expansion allowlist: every location slug must be an approved
 *    scaling-tier city (`config/seo/scaling.ts`). No unlisted doorway cities.
 *  - Candidate caps per type: exceeding a cap forces human review.
 *  - Cross-type doorway scan: pages of DIFFERENT types that are near-identical are
 *    flagged as doorway/near-duplicate content across the whole candidate corpus.
 *
 * Includes a negative-fixture self-test. CI-only module: not imported by the app.
 */

import { MONEY_PAGES, type MoneyPage } from "@/data/moneyPages";
import { LOCATION_PAGES, type LocationPage } from "@/data/locationPages";
import { KNOWLEDGE_PAGES, type KnowledgePage } from "@/data/knowledgePages";
import {
  ALLOWED_LOCATION_SLUGS,
  CANDIDATE_CAPS,
  CROSS_TYPE_DOORWAY_THRESHOLD,
} from "@/config/seo/scaling";
import type { BrandKey } from "@/config/seo/domains";
import { fingerprint, similarity, type Fingerprint } from "./contentFingerprint";
import { blocker, warning, info, hasBlockers, type Finding } from "./findings";

type ScalableType = "money" | "location" | "knowledge";

interface CorpusEntry {
  id: string;
  brand: BrandKey;
  type: ScalableType;
  path: string;
  text: string;
}

function moneyCorpusText(mp: MoneyPage): string {
  return [mp.title, mp.description, mp.aeoAnswer, mp.problem, mp.solutionIntro].join("\n");
}
function locationCorpusText(lp: LocationPage): string {
  return [lp.title, lp.description, lp.aeoAnswer, lp.localContext].join("\n");
}
function knowledgeCorpusText(kp: KnowledgePage): string {
  return [kp.title, kp.description, kp.aeoAnswer, kp.sections[0]?.body ?? ""].join("\n");
}

function buildCorpus(): CorpusEntry[] {
  return [
    ...MONEY_PAGES.map((p) => ({ id: p.id, brand: p.brand, type: "money" as const, path: p.path, text: moneyCorpusText(p) })),
    ...LOCATION_PAGES.map((p) => ({ id: p.id, brand: p.brand, type: "location" as const, path: p.path, text: locationCorpusText(p) })),
    ...KNOWLEDGE_PAGES.map((p) => ({ id: p.id, brand: p.brand, type: "knowledge" as const, path: p.path, text: knowledgeCorpusText(p) })),
  ];
}

/** Location slugs must be approved scaling-tier cities. */
function checkLocationAllowlist(pages: LocationPage[] = LOCATION_PAGES): Finding[] {
  const findings: Finding[] = [];
  for (const lp of pages) {
    if (!ALLOWED_LOCATION_SLUGS.includes(lp.slug)) {
      findings.push(
        blocker(
          "SCALING_CITY_NOT_ALLOWLISTED",
          `Location "${lp.slug}" is not an approved scaling-tier city`,
          { brand: lp.brand, pageId: lp.id, path: lp.path }
        )
      );
    }
  }
  return findings;
}

/** Candidate volume per type must stay under its cap. */
function checkCandidateCaps(): Finding[] {
  const findings: Finding[] = [];
  const counts: Record<ScalableType, number> = {
    money: MONEY_PAGES.filter((p) => !p.approved).length,
    location: LOCATION_PAGES.filter((p) => !p.approved).length,
    knowledge: KNOWLEDGE_PAGES.filter((p) => !p.approved).length,
  };
  (Object.keys(counts) as ScalableType[]).forEach((type) => {
    const cap = CANDIDATE_CAPS[type];
    if (counts[type] > cap) {
      findings.push(
        blocker("SCALING_CAP_EXCEEDED", `${counts[type]} candidate ${type} pages exceed cap ${cap} — review before scaling`, {})
      );
    } else {
      findings.push(info("SCALING_CAP_OK", `${type}: ${counts[type]}/${cap} candidate pages`));
    }
  });
  return findings;
}

/** Cross-type doorway / near-duplicate detection across the candidate corpus. */
function checkCrossTypeDoorways(corpus: CorpusEntry[]): Finding[] {
  const findings: Finding[] = [];
  const fps: (Fingerprint & { meta: CorpusEntry })[] = corpus.map((e) => ({ ...fingerprint(e.id, e.text), meta: e }));
  for (let i = 0; i < fps.length; i++) {
    for (let j = i + 1; j < fps.length; j++) {
      const a = fps[i];
      const b = fps[j];
      if (a.meta.type === b.meta.type) continue; // same-type handled per-type guard
      const sim = similarity(a, b);
      if (sim >= CROSS_TYPE_DOORWAY_THRESHOLD) {
        findings.push(
          blocker(
            "DOORWAY_NEAR_DUPLICATE",
            `Cross-type near-duplicate (${sim.toFixed(2)} ≥ ${CROSS_TYPE_DOORWAY_THRESHOLD}): ${a.meta.id} (${a.meta.type}) ↔ ${b.meta.id} (${b.meta.type})`,
            { detail: `${a.meta.path} vs ${b.meta.path}` }
          )
        );
      }
    }
  }
  return findings;
}

export function checkScaling(): Finding[] {
  const findings: Finding[] = [];
  const corpus = buildCorpus();

  findings.push(...checkLocationAllowlist());
  findings.push(...checkCandidateCaps());
  findings.push(...checkCrossTypeDoorways(corpus));

  // Self-test: known-bad inputs MUST be flagged.
  const badCity = checkLocationAllowlist([
    { ...LOCATION_PAGES[0], id: "agiworks:/standorte/atlantis", slug: "atlantis", path: "/standorte/atlantis" },
  ]);
  const doorwaySelf = checkCrossTypeDoorways([
    { id: "a", brand: "agiworks", type: "money", path: "/leistungen/x", text: "Identischer Doorway Text über Systeme und Automatisierung im Ruhrgebiet" },
    { id: "b", brand: "agiworks", type: "location", path: "/standorte/x", text: "Identischer Doorway Text über Systeme und Automatisierung im Ruhrgebiet" },
  ]);
  if (hasBlockers(badCity) && hasBlockers(doorwaySelf)) {
    findings.push(info("GUARD_SELFTEST_OK", "scaling: negative fixtures correctly flagged"));
  } else {
    findings.push(blocker("GUARD_SELFTEST_FAILED", "scaling guard failed on known-bad fixtures"));
  }

  if (!hasBlockers(findings)) {
    findings.push(
      info(
        "SCALING_OK",
        `Scaling policy holds: ${corpus.length} candidate pages, ${ALLOWED_LOCATION_SLUGS.length} allowlisted cities, no cross-type doorways`
      )
    );
    const planned = ALLOWED_LOCATION_SLUGS.length - LOCATION_PAGES.length / 2;
    if (planned > 0) {
      findings.push(warning("SCALING_HEADROOM", `${planned} allowlisted cities not yet built as candidate location pages`));
    }
  }
  return findings;
}
