/**
 * Ollama-Adapter — komplett lokal (kein Cloud-Call).
 *
 * Der Daemon läuft typischerweise unter http://127.0.0.1:11434.
 * Modell-Defaults sind bewusst groß genug für sinnvolle JSON-Antworten,
 * aber klein genug, dass sie auf einem Apple Silicon flüssig laufen.
 *
 * ENV-Override:
 *   OLLAMA_HOST           z.B. http://127.0.0.1:11434
 *   OLLAMA_MODEL          z.B. llama3.1:8b-instruct-q5_K_M
 *   OLLAMA_VISION_MODEL   z.B. llava:13b   (für Screenshot-Analyse)
 */

export interface OllamaInfo {
  host: string;
  reachable: boolean;
  models: string[];
  defaultModel: string;
  visionModel: string;
}

const DEFAULT_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const DEFAULT_VISION = process.env.OLLAMA_VISION_MODEL || "llava:13b";

export async function ollamaInfo(): Promise<OllamaInfo> {
  const host = DEFAULT_HOST.replace(/\/$/, "");
  try {
    const res = await fetch(`${host}/api/tags`, { cache: "no-store" });
    if (!res.ok) {
      return {
        host,
        reachable: false,
        models: [],
        defaultModel: DEFAULT_MODEL,
        visionModel: DEFAULT_VISION,
      };
    }
    const data = (await res.json()) as { models?: { name: string }[] };
    return {
      host,
      reachable: true,
      models: (data.models || []).map((m) => m.name),
      defaultModel: DEFAULT_MODEL,
      visionModel: DEFAULT_VISION,
    };
  } catch {
    return {
      host,
      reachable: false,
      models: [],
      defaultModel: DEFAULT_MODEL,
      visionModel: DEFAULT_VISION,
    };
  }
}

export interface OllamaGenerateOptions {
  model: string;
  prompt: string;
  /** Pflicht: System-Anweisungen */
  system?: string;
  /** Optional: base64-Bilder ohne data:-Prefix für Vision-Modelle */
  images?: string[];
  /** Erzwingt JSON-Antwort */
  format?: "json";
  /** Sampling */
  temperature?: number;
  /** Max. Tokens (Ollama: num_predict) */
  numPredict?: number;
}

export interface OllamaGenerateResult {
  response: string;
  model: string;
  totalDurationMs: number;
}

/**
 * Synchroner generate-Call. Streamt nicht — gibt die fertige Antwort als String zurück,
 * damit wir sie strukturiert weiterverarbeiten können.
 */
export async function ollamaGenerate(
  opts: OllamaGenerateOptions,
): Promise<OllamaGenerateResult> {
  const host = DEFAULT_HOST.replace(/\/$/, "");
  const t0 = Date.now();
  const res = await fetch(`${host}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      prompt: opts.prompt,
      system: opts.system,
      images: opts.images,
      format: opts.format,
      stream: false,
      options: {
        temperature: opts.temperature ?? 0.4,
        num_predict: opts.numPredict ?? 1400,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { response?: string; model?: string };
  return {
    response: data.response ?? "",
    model: data.model ?? opts.model,
    totalDurationMs: Date.now() - t0,
  };
}

/**
 * Versucht, aus einem Modell-Output ein JSON-Objekt zu extrahieren.
 * Tolerant gegenüber führendem/abschließendem Text oder Code-Fences.
 */
export function parseJsonLoose<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Strip code fences
  const noFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  try {
    return JSON.parse(noFence) as T;
  } catch {
    // Find largest balanced { ... } block
    const start = noFence.indexOf("{");
    const end = noFence.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const slice = noFence.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      return null;
    }
  }
}
