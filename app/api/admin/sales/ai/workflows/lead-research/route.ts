import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { runLeadResearch } from "@/lib/sales/ai/workflows";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.ai.execute");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => ({}));
  try {
    const result = await runLeadResearch(gate.auth, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[SALES] Lead-Research fehlgeschlagen:", error);
    return NextResponse.json({ error: "workflow_failed" }, { status: 500 });
  }
}
