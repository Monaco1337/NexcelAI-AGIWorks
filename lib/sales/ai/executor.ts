/**
 * Zentraler AI-Executor.
 *
 * Führt einen Workflow-Prompt aus:
 *  1. Aktiven Prompt laden
 *  2. Sanitize + Template-Rendering
 *  3. Run in DB anlegen (PROCESSING)
 *  4. Provider aufrufen
 *  5. Optional JSON parsen
 *  6. Run finalisieren (REVIEW_REQUIRED oder FAILED)
 *  7. Activity-Log-Eintrag
 *
 * Ein Workflow ist eine Kombination aus einem Prompt-Key, dem
 * Entity-Kontext und den Template-Variablen.
 */

import { logActivity } from "../activitiesStore";
import { SalesError, type BrandContext } from "../model";
import type { AuthContext } from "@/lib/auth/authorize";
import { getActivePrompt, renderTemplate } from "./promptStore";
import type { SalesPromptKey } from "./promptSeeds";
import { getAiProvider } from "./provider";
import { defaultReviewStatus, parseJsonSafely, sanitizeUntrustedInput } from "./guards";
import {
  createRun,
  finishRun,
  type RunEntity,
  type SalesAiRun,
} from "./runStore";

export interface RunWorkflowInput {
  promptKey: SalesPromptKey;
  brandContext?: BrandContext;
  entityType: RunEntity;
  entityId?: string | null;
  companyId?: string | null;
  vars: Record<string, unknown>;
  auth: AuthContext | null;
  activitySummary: string;
  activityKind:
    | "precall"
    | "postcall"
    | "client_preview"
    | "discovery_prep"
    | "solution_updated"
    | "proposal_version"
    | "ai_run_completed";
  /** Bestimmte Freitextvariablen als "untrusted" markieren (Prompt-Injection-Schutz). */
  untrustedVars?: string[];
}

export interface RunWorkflowResult {
  run: SalesAiRun;
  parsed: unknown | null;
}

export async function runWorkflow(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  const brand = input.brandContext ?? "nexcel";
  const prompt = await getActivePrompt(input.promptKey, brand);
  if (!prompt) {
    throw new SalesError(
      `Kein aktiver Prompt für ${input.promptKey} gefunden`,
      "prompt_missing",
      500
    );
  }

  // Freitext-Variablen entschärfen.
  const safeVars: Record<string, unknown> = { ...input.vars, brandContext: brand };
  if (input.untrustedVars) {
    for (const key of input.untrustedVars) {
      const value = safeVars[key];
      if (typeof value === "string") {
        safeVars[key] = sanitizeUntrustedInput(value);
      }
    }
  }

  const userText = renderTemplate(prompt.userTemplate, safeVars);
  const inputSnapshot = {
    promptKey: prompt.key,
    promptVersion: prompt.version,
    brand,
    vars: input.vars,
  };

  const run = await createRun({
    promptKey: prompt.key,
    promptVersion: prompt.version,
    brandContext: brand,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    inputSnapshot,
    model: prompt.model,
    temperature: prompt.temperature,
    actorId: input.auth?.userId ?? null,
    status: "PROCESSING",
  });

  const provider = getAiProvider();
  try {
    const response = await provider.chat({
      model: prompt.model,
      temperature: prompt.temperature,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: userText },
      ],
      jsonMode: prompt.outputFormat === "json",
      maxOutputTokens: 4000,
    });

    const parsed =
      prompt.outputFormat === "json" ? parseJsonSafely(response.text) : null;

    const finished = await finishRun({
      runId: run.id,
      status: defaultReviewStatus(),
      output: parsed as Record<string, unknown> | null,
      outputText: response.text,
      tokensIn: response.tokensIn,
      tokensOut: response.tokensOut,
      provider: response.provider,
    });

    await logActivity({
      entityType: (input.entityType === "lead_query" ? "company" : input.entityType) as
        | "company"
        | "opportunity"
        | "contact"
        | "proposal",
      entityId: input.entityId ?? "-",
      companyId: input.companyId ?? null,
      kind: input.activityKind,
      summary: input.activitySummary,
      payload: { runId: finished.id, provider: response.provider },
      actorId: input.auth?.userId ?? null,
      actorEmail: input.auth?.email ?? null,
    });

    return { run: finished, parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = await finishRun({
      runId: run.id,
      status: "FAILED",
      error: message,
    });
    await logActivity({
      entityType: (input.entityType === "lead_query" ? "company" : input.entityType) as
        | "company"
        | "opportunity"
        | "contact"
        | "proposal",
      entityId: input.entityId ?? "-",
      companyId: input.companyId ?? null,
      kind: "ai_run_failed",
      summary: `AI-Run fehlgeschlagen (${input.promptKey})`,
      payload: { runId: failed.id, error: message.slice(0, 400) },
      actorId: input.auth?.userId ?? null,
      actorEmail: input.auth?.email ?? null,
    });
    return { run: failed, parsed: null };
  }
}
