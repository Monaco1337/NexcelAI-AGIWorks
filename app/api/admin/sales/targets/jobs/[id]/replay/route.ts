import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { replayDeadLetterEnrichmentJob } from "@/lib/sales/targets/store";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await context.params;
  const replayed = await replayDeadLetterEnrichmentJob(id, gate.auth.userId);
  if (!replayed) {
    return NextResponse.json(
      { error: "job_not_dead_lettered_or_already_replayed" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, jobId: id, status: "queued" });
}
