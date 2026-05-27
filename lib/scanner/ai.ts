// Lazy Transformers.js loader — runs entirely in the browser.
// Models: a tiny multilingual embedding (semantic similarity) + a small
// instruct LLM for natural-language synthesis. Both are downloaded on
// first use, cached by the browser, and never leave the device.

"use client";

import type { ScanResult } from "./types";

type Loader<T> = () => Promise<T>;

let pipelinePromise: Promise<unknown> | null = null;

async function importTransformers() {
  // dynamic import so the (~1MB) wrapper is only loaded when the user
  // actually requests AI synthesis.
  const mod = await import("@huggingface/transformers");
  // Use only WebGPU/WASM in browser; let the lib auto-pick.
  // Disable telemetry by default.
  (mod as unknown as { env: { allowLocalModels: boolean } }).env.allowLocalModels = false;
  return mod;
}

interface EmbedderHandle {
  embed: (texts: string[]) => Promise<number[][]>;
}

let embedder: EmbedderHandle | null = null;

const getEmbedder: Loader<EmbedderHandle> = async () => {
  if (embedder) return embedder;
  const t = await importTransformers();
  // Small multilingual embedding model — ~25MB
  const pipe = await t.pipeline(
    "feature-extraction",
    "Xenova/multilingual-e5-small",
    { device: "auto" as const },
  );
  embedder = {
    async embed(texts: string[]) {
      const out = await pipe(texts, { pooling: "mean", normalize: true });
      return (out as unknown as { tolist: () => number[][] }).tolist();
    },
  };
  return embedder;
};

interface SynthHandle {
  generate: (prompt: string, max?: number) => Promise<string>;
}

let synth: SynthHandle | null = null;

const getSynth: Loader<SynthHandle> = async () => {
  if (synth) return synth;
  const t = await importTransformers();
  // Tiny instruct LLM — ~500–700 MB compressed (Xenova hosts quantized variants)
  // Falls auf einem Gerät WebGPU fehlt, wird WASM benutzt (langsamer, aber läuft).
  const pipe = await t.pipeline(
    "text-generation",
    "Xenova/Qwen2.5-0.5B-Instruct",
    { device: "auto" as const },
  );
  synth = {
    async generate(prompt: string, max = 220) {
      const messages = [
        {
          role: "system",
          content:
            "Du bist ein deutscher Senior-Architekt. Antworte präzise, klar, in höchstens 5 prägnanten Sätzen.",
        },
        { role: "user", content: prompt },
      ];
      const out = await (pipe as unknown as (
        m: unknown,
        opts: Record<string, unknown>,
      ) => Promise<unknown>)(messages, {
        max_new_tokens: max,
        do_sample: false,
        temperature: 0.2,
      });
      type GenItem = { generated_text?: Array<{ content?: string }> | string };
      const arr = out as GenItem[];
      const gt = arr?.[0]?.generated_text;
      const text = Array.isArray(gt) ? gt.at(-1)?.content ?? "" : gt ?? "";
      return String(text).trim();
    },
  };
  return synth;
};

/**
 * High-end summary: combines deterministic findings with a tiny LLM
 * to produce a polished German narrative.
 */
export async function synthesizeNarrative(result: ScanResult): Promise<string> {
  const top = result.findings.slice(0, 6).map((f) => `- [${f.severity}] ${f.area}: ${f.title}`).join("\n");
  const tech = result.detected.map((d) => d.name).slice(0, 6).join(", ") || "—";
  const prompt =
    `Analyse für ${result.source} (Modus: ${result.mode}). ` +
    `Score: ${result.score.overall}/100. ` +
    `Erkannter Stack: ${tech}. ` +
    `Wichtigste Befunde:\n${top}\n` +
    `Schreibe eine prägnante Executive-Summary (4–5 Sätze) für eine C-Level-Person. ` +
    `Keine Markdown-Listen. Klare Empfehlung am Ende.`;
  try {
    const s = await getSynth();
    const text = await s.generate(prompt, 240);
    return text.length > 0 ? text : result.summary;
  } catch (err) {
    return result.summary;
  }
}

/**
 * Optional: rank an array of issue templates by semantic similarity to
 * the user's free-form goal. Used to surface the most relevant
 * recommendations.
 */
export async function rankBySimilarity(
  query: string,
  candidates: string[],
): Promise<{ index: number; score: number }[]> {
  if (!query.trim() || candidates.length === 0) return [];
  try {
    const e = await getEmbedder();
    const all = await e.embed([query, ...candidates]);
    const q = all[0];
    const cs = all.slice(1);
    const dot = (a: number[], b: number[]) =>
      a.reduce((s, v, i) => s + v * b[i], 0);
    return cs
      .map((v, i) => ({ index: i, score: dot(q, v) }))
      .sort((a, b) => b.score - a.score);
  } catch {
    return candidates.map((_, i) => ({ index: i, score: 0 }));
  }
}

export const aiStatus = {
  isLoaded: () => !!synth,
  isEmbedderLoaded: () => !!embedder,
};
