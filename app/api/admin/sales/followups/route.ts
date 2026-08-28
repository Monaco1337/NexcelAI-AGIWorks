import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listOpenFollowups } from "@/lib/sales/proposalsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const followups = await listOpenFollowups();
  return NextResponse.json({ followups });
}
