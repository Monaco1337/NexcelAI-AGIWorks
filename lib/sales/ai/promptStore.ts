/**
 * Speicherzugriff auf `sales_ai_prompts`.
 *
 * Prompts sind versioniert und pro Brand-Kontext hinterlegt. Beim
 * Ausführen wird immer der aktive Prompt geladen; Änderungen erzeugen
 * eine neue Version, alte bleiben zur Reproduzierbarkeit erhalten.
 */

import { db } from "@/lib/pg";
import { SalesError, newId, type BrandContext } from "../model";
import type { SalesPromptKey } from "./promptSeeds";

export type PromptBrand = BrandContext | "any";

export interface SalesPrompt {
  id: string;
  key: SalesPromptKey;
  version: number;
  brandContext: PromptBrand;
  model: string;
  temperature: number;
  system: string;
  userTemplate: string;
  outputFormat: "json" | "text" | "markdown";
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  key: string;
  version: number;
  brand_context: string;
  model: string;
  temperature: string;
  system_prompt: string;
  user_template: string;
  output_format: string;
  is_active: boolean;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

function rowTo(row: Row): SalesPrompt {
  return {
    id: row.id,
    key: row.key as SalesPromptKey,
    version: row.version,
    brandContext: row.brand_context as PromptBrand,
    model: row.model,
    temperature: Number(row.temperature),
    system: row.system_prompt,
    userTemplate: row.user_template,
    outputFormat: row.output_format as SalesPrompt["outputFormat"],
    isActive: row.is_active,
    notes: row.notes ?? "",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listPrompts(): Promise<SalesPrompt[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT id, key, version, brand_context, model, temperature,
           system_prompt, user_template, output_format, is_active, notes,
           created_at, updated_at
    FROM sales_ai_prompts
    ORDER BY key ASC, brand_context ASC, version DESC
  `;
  return rows.map(rowTo);
}

/**
 * Aktivsten Prompt für Key + Brand ermitteln. Bevorzugt exakten
 * Brand-Match; fällt sonst auf den generischen "any"-Prompt zurück.
 */
export async function getActivePrompt(
  key: SalesPromptKey,
  brand: PromptBrand = "any"
): Promise<SalesPrompt | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT id, key, version, brand_context, model, temperature,
           system_prompt, user_template, output_format, is_active, notes,
           created_at, updated_at
    FROM sales_ai_prompts
    WHERE key = ${key} AND is_active = TRUE
      AND (brand_context = ${brand} OR brand_context = 'any')
    ORDER BY (brand_context = ${brand}) DESC, version DESC
    LIMIT 1
  `;
  return rows[0] ? rowTo(rows[0]) : null;
}

export interface CreatePromptVersionInput {
  key: SalesPromptKey;
  brandContext?: PromptBrand;
  model?: string;
  temperature?: number;
  system: string;
  userTemplate: string;
  outputFormat?: SalesPrompt["outputFormat"];
  notes?: string;
  activate?: boolean;
  createdBy?: string | null;
}

export async function createPromptVersion(
  input: CreatePromptVersionInput
): Promise<SalesPrompt> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const brand: PromptBrand = input.brandContext ?? "any";
  const id = newId("sprmt");

  return await sql.begin(async (tx) => {
    const rows = await tx<{ next: number }[]>`
      SELECT COALESCE(MAX(version), 0) + 1 AS next
      FROM sales_ai_prompts WHERE key = ${input.key} AND brand_context = ${brand}
    `;
    const version = rows[0]?.next ?? 1;
    if (input.activate) {
      await tx`
        UPDATE sales_ai_prompts SET is_active = FALSE
        WHERE key = ${input.key} AND brand_context = ${brand}
      `;
    }
    await tx`
      INSERT INTO sales_ai_prompts (
        id, key, version, brand_context, model, temperature,
        system_prompt, user_template, output_format, is_active, notes, created_by
      ) VALUES (
        ${id}, ${input.key}, ${version}, ${brand},
        ${input.model ?? "gpt-4o-mini"}, ${input.temperature ?? 0.3},
        ${input.system}, ${input.userTemplate},
        ${input.outputFormat ?? "json"},
        ${input.activate ?? true}, ${input.notes ?? ""},
        ${input.createdBy ?? null}
      )
    `;
    const created = await tx<Row[]>`
      SELECT id, key, version, brand_context, model, temperature,
             system_prompt, user_template, output_format, is_active, notes,
             created_at, updated_at
      FROM sales_ai_prompts WHERE id = ${id}
    `;
    return rowTo(created[0]);
  });
}

export async function togglePromptActive(id: string, active: boolean): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_ai_prompts SET is_active = ${active}, updated_at = NOW() WHERE id = ${id}`;
}

/**
 * Einfacher Template-Renderer: ersetzt `{{key}}` durch den Wert aus
 * `vars`. Fehlende Keys werden zu einem leeren String.
 */
export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const value = vars[key];
    if (value == null) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  });
}
