import {
  buildFingerprint,
  matchEntities,
  normalizeCompanyName,
} from "../../lib/sales/targets/entityResolution";
import { qualifyTarget } from "../../lib/sales/targets/qualification/engine";
import type { LeadScore, TargetCompany } from "../../lib/sales/targets/model";
import { SALES_TARGET_GOLDEN } from "../fixtures/salesTargetGolden";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

let falseMerges = 0;
let falseSplits = 0;
let sameEntityPairs = 0;
let distinctEntityPairs = 0;
for (const record of SALES_TARGET_GOLDEN) {
  if (record.expectedNormalizedName) {
    assert(
      normalizeCompanyName(record.input.name) === record.expectedNormalizedName,
      `normalization ${record.id}`,
    );
  }
}
for (let left = 0; left < SALES_TARGET_GOLDEN.length; left++) {
  for (let right = left + 1; right < SALES_TARGET_GOLDEN.length; right++) {
    const a = SALES_TARGET_GOLDEN[left];
    const b = SALES_TARGET_GOLDEN[right];
    const expectedSame = a.entity === b.entity;
    const predictedSame = matchEntities(
      buildFingerprint(a.input),
      buildFingerprint(b.input),
    ).isMatch;
    if (expectedSame) {
      sameEntityPairs++;
      if (!predictedSame) falseSplits++;
    } else {
      distinctEntityPairs++;
      if (predictedSame) falseMerges++;
    }
  }
}
assert(falseMerges === 0, `false merge count ${falseMerges}`);
assert(falseSplits === 0, `false split count ${falseSplits}`);

const company = {
  id: "golden-qualified",
  name: "Reviewed Qualified GmbH",
  country: "DE",
  addressLine: "Reviewstraße 1",
  enrichmentStatus: "SCORING",
  doNotContact: false,
  deletedAt: null,
} as unknown as TargetCompany;
const score = { totalScore: 80 } as LeadScore;
assert(
  qualifyTarget({
    company,
    score,
    hasVerifiedContact: true,
    evidenceConfidence: 0.9,
  }).state === "QUALIFIED",
  "reviewed strong case qualifies",
);
assert(
  qualifyTarget({
    company: { ...company, id: "golden-unqualified", doNotContact: true },
    score,
    hasVerifiedContact: true,
    evidenceConfidence: 0.9,
  }).state === "REJECTED",
  "do-not-contact remains rejected regardless of score",
);

console.log(JSON.stringify({
  goldenRecordCount: SALES_TARGET_GOLDEN.length,
  sameEntityPairs,
  distinctEntityPairs,
  falseMerges,
  falseSplits,
  reviewedScope: "synthetic identity regression cases",
  releaseSizeGate: "OPEN",
}));
