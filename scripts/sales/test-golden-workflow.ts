import { db } from "../../lib/pg";
import {
  markGoldenDataset,
  submitEvaluation,
} from "../../lib/sales/targets/hardening/storeAdditions";

async function main(): Promise<void> {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const suffix = Date.now().toString(36);
  const targetId = `golden_target_${suffix}`;
  await sql`
    INSERT INTO sales_target_companies (
      id, name, fingerprint, country, region, city, website
    ) VALUES (
      ${targetId}, 'Golden Workflow Muster GmbH', ${`golden-${suffix}`},
      'DE', 'Nordrhein-Westfalen', 'Dortmund', 'https://example.com'
    )
  `;

  let rejectedWithoutReview = false;
  try {
    await markGoldenDataset(targetId, true);
  } catch {
    rejectedWithoutReview = true;
  }
  assert(rejectedWithoutReview, "unreviewed target was admitted to golden dataset");

  await submitEvaluation({
    targetId,
    evaluatorId: null,
    evaluatorEmail: "reviewer@example.test",
    reviewStatus: "COMPLETED",
    reviewVersion: "acceptance-v1",
    identityVerdict: "NOT_APPLICABLE",
    validCompany: true,
    canonicalNameCorrect: true,
    geographyCorrect: true,
    phoneVerdict: "UNKNOWN",
    emailVerdict: "UNKNOWN",
    decisionMakerVerdict: "UNKNOWN",
    websiteVerdict: "YES",
    targetFitVerdict: "YES",
    qualificationCorrect: true,
    provenanceComplete: true,
    wouldContact: true,
    systemPrediction: { fixture: true, purpose: "workflow acceptance" },
  });
  await markGoldenDataset(targetId, true);
  const result = await sql<{ is_golden_dataset: boolean; reviews: number }[]>`
    SELECT company.is_golden_dataset,
      (
        SELECT COUNT(*)::int FROM sales_target_evaluations evaluation
        WHERE evaluation.target_id = company.id AND evaluation.review_status = 'COMPLETED'
      ) AS reviews
    FROM sales_target_companies company
    WHERE company.id = ${targetId}
  `;
  assert(result[0]?.is_golden_dataset === true, "reviewed target was not admitted");
  assert(Number(result[0]?.reviews) === 1, "completed review was not persisted");

  console.log(JSON.stringify({
    unreviewedAdmissionRejected: true,
    completedReviewPersisted: true,
    reviewedAdmissionAccepted: true,
  }));
  await sql.end({ timeout: 5 });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
