import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { saveControllerSnapshot } from "@/lib/sales/targets/coverage/store";
import { newCorrelationId } from "@/lib/sales/targets/errors";
import { evaluateRuntimeAcquisition } from "@/lib/sales/targets/coverage/runtimeController";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { snapshot, decision } = await evaluateRuntimeAcquisition();
  return NextResponse.json({ snapshot, decision, generatedAt: new Date().toISOString() });
}

export async function POST() {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { snapshot, decision } = await evaluateRuntimeAcquisition();
  const correlationId = newCorrelationId("controller");
  const sequenceNo = Math.floor(Date.now() / 1000);
  await saveControllerSnapshot({
    controllerKey: "sales-targets-default",
    controllerVersion: "v1",
    sequenceNo,
    observed: snapshot,
    decision,
    correlationId,
  });
  return NextResponse.json({ snapshot, decision, correlationId });
}


