import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { createPlaybookVersion, listPlaybooks } from "@/lib/sales/playbooksStore";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const playbooks = await listPlaybooks();
  return NextResponse.json({ playbooks });
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.playbook.manage");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => ({}));
  if (!body?.key || !body?.structured) {
    return NextResponse.json({ error: "key_and_structured_required" }, { status: 400 });
  }
  try {
    const playbook = await createPlaybookVersion({
      key: body.key,
      brandContext: body.brandContext,
      structured: body.structured,
      activate: body.activate !== false,
      createdBy: gate.auth.userId,
    });
    return NextResponse.json({ playbook }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
