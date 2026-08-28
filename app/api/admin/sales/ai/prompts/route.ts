import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { createPromptVersion, listPrompts } from "@/lib/sales/ai/promptStore";
import { SalesError } from "@/lib/sales/model";
import type { SalesPromptKey } from "@/lib/sales/ai/promptSeeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const prompts = await listPrompts();
  return NextResponse.json({ prompts });
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.prompt.manage");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => ({}));
  if (!body?.key || !body?.system || !body?.userTemplate) {
    return NextResponse.json({ error: "key_system_template_required" }, { status: 400 });
  }
  try {
    const prompt = await createPromptVersion({
      key: body.key as SalesPromptKey,
      brandContext: body.brandContext ?? "any",
      model: body.model,
      temperature: body.temperature,
      system: body.system,
      userTemplate: body.userTemplate,
      outputFormat: body.outputFormat,
      notes: body.notes,
      activate: body.activate !== false,
      createdBy: gate.auth.userId,
    });
    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
