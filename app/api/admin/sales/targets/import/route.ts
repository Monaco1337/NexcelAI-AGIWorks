import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { parseControlledImport } from "@/lib/sales/targets/providers/importProvider";
import { ingestDiscoveredCompany } from "@/lib/sales/targets/pipeline";
import { enqueueEnrichment } from "@/lib/sales/targets/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    const batchHeader = request.headers.get("x-import-batch-id");
    const parsed = contentType.includes("text/csv")
      ? parseControlledImport(await boundedText(request), "csv", batchHeader)
      : await parseJsonImport(request, batchHeader);
    let created = 0;
    let matched = 0;
    const targetIds: string[] = [];
    for (const stub of parsed.stubs) {
      const result = await ingestDiscoveredCompany(stub, null);
      if (result.wasCreated) created++;
      else matched++;
      targetIds.push(result.target.id);
      await enqueueEnrichment(result.target.id, "website_contact", { priority: 100 });
    }
    return NextResponse.json({
      ok: true,
      batchId: parsed.batchId,
      received: parsed.records.length,
      created,
      matched,
      targetIds,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "invalid_import", message: error instanceof Error ? error.message : "Import fehlgeschlagen" },
      { status: 400 },
    );
  }
}

async function parseJsonImport(request: NextRequest, batchHeader: string | null) {
  const text = await boundedText(request);
  const body = JSON.parse(text) as { records?: unknown[]; batchId?: string };
  return parseControlledImport(body, "json", batchHeader ?? body.batchId ?? null);
}

async function boundedText(request: NextRequest): Promise<string> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 2_000_000) throw new Error("Import überschreitet 2 MB");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > 2_000_000) throw new Error("Import überschreitet 2 MB");
  return text;
}
