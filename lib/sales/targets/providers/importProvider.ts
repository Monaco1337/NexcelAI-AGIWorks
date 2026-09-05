import { createHash } from "node:crypto";
import { z } from "zod";
import type { DiscoveredCompanyStub } from "./types";

const importRecordSchema = z.object({
  externalId: z.string().trim().min(1).max(300).optional(),
  name: z.string().trim().min(1).max(300),
  legalName: z.string().trim().max(300).nullable().optional(),
  legalForm: z.string().trim().max(100).nullable().optional(),
  website: z.string().trim().max(2_000).nullable().optional(),
  phone: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().email().max(320).nullable().optional(),
  addressLine: z.string().trim().max(500).nullable().optional(),
  postalCode: z.string().trim().max(30).nullable().optional(),
  city: z.string().trim().max(200).nullable().optional(),
  region: z.string().trim().max(200).nullable().optional(),
  country: z.string().trim().length(2).default("DE"),
  industry: z.string().trim().max(200).nullable().optional(),
  subIndustry: z.string().trim().max(200).nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  confidence: z.coerce.number().min(0).max(1).default(0.8),
}).strict();

export type ImportRecord = z.infer<typeof importRecordSchema>;

export interface ParsedImport {
  batchId: string;
  records: ImportRecord[];
  stubs: DiscoveredCompanyStub[];
}

export function parseControlledImport(
  input: unknown,
  format: "json" | "csv",
  suppliedBatchId?: string | null,
): ParsedImport {
  const rawRecords = format === "csv"
    ? parseCsv(String(input))
    : Array.isArray(input)
      ? input
      : (input as { records?: unknown[] } | null)?.records;
  if (!Array.isArray(rawRecords)) throw new Error("Import erwartet ein records-Array");
  if (rawRecords.length === 0 || rawRecords.length > 1_000) {
    throw new Error("Import muss zwischen 1 und 1.000 Datensätzen enthalten");
  }
  const records = rawRecords.map((record) => importRecordSchema.parse(normalizeEmpty(record)));
  const batchId = suppliedBatchId?.trim() || createHash("sha256")
    .update(stableStringify(records))
    .digest("hex")
    .slice(0, 24);
  return {
    batchId,
    records,
    stubs: records.map((record, index) => ({
      name: record.name,
      legalName: record.legalName ?? null,
      legalForm: record.legalForm ?? null,
      website: record.website ?? null,
      phone: record.phone ?? null,
      email: record.email ?? null,
      addressLine: record.addressLine ?? null,
      postalCode: record.postalCode ?? null,
      city: record.city ?? null,
      region: record.region ?? null,
      country: record.country.toUpperCase(),
      latitude: record.latitude ?? null,
      longitude: record.longitude ?? null,
      industry: record.industry ?? null,
      subIndustry: record.subIndustry ?? null,
      provider: "controlled_import",
      providerRawId: record.externalId ?? `${batchId}:${index}`,
      providerSourceUrl: `import://${batchId}/${encodeURIComponent(record.externalId ?? String(index))}`,
      confidence: record.confidence,
      signals: ["controlled_import", `batch:${batchId}`],
    })),
  };
}

export function parseCsv(csv: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index++;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("Nicht geschlossene CSV-Anführungszeichen");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  const headers = rows.shift()?.map((header) => header.trim());
  if (!headers?.length || headers.some((header) => !header)) {
    throw new Error("CSV-Header fehlt oder ist ungültig");
  }
  return rows.map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index]?.trim() ?? ""]),
  ));
}

function normalizeEmpty(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      item === "" ? undefined : item,
    ]),
  );
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
