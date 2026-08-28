import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { runPostCall } from "@/lib/sales/ai/workflows";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.ai.execute");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => ({}));
  if (!body?.opportunityId) return NextResponse.json({ error: "opportunityId_required" }, { status: 400 });
  try {
    const result = await runPostCall(gate.auth, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "workflow_failed" }, { status: 500 });
  }
}
