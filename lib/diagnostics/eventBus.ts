/**
 * NEXCEL AI · Diagnostik · In-Process Event-Bus
 *
 * Verbindet den Analyse-Orchestrator mit der SSE-Route. Jede laufende Analyse
 * hat einen Channel (analysisId), Konsumenten registrieren sich per `subscribe`,
 * der Orchestrator publiziert.
 *
 * NICHT für Cluster-Setups geeignet — pro Node-Prozess. Für die geforderte
 * Architektur (lokal/dev + single-instance Production) absolut ausreichend.
 *
 * Persistenz übernimmt `analysis_events` in der DB — der Bus ist nur das
 * Live-Transport-Layer.
 */

import type { AnalysisEvent, AnalysisPhase, AnalysisStatus } from "./types";

export type BusMessage =
  | { kind: "phase"; phase: AnalysisPhase }
  | { kind: "status"; status: AnalysisStatus; error?: string }
  | { kind: "event"; event: AnalysisEvent }
  | { kind: "done" };

type Subscriber = (msg: BusMessage) => void;

/**
 * Wichtig: Next.js (besonders im Dev-Mode mit HMR) kann einzelne Module
 * mehrfach evaluieren, sodass plain `const channels = new Map()` zwischen
 * Routen NICHT geteilt wird. Wir verankern den Bus deshalb an `globalThis`
 * — eine bewährte Strategie für Singletons in Next.js-Routen.
 */
interface BusState {
  channels: Map<string, Set<Subscriber>>;
  buffers: Map<string, BusMessage[]>;
}
const G = globalThis as unknown as { __nexcelDiagnosticsBus?: BusState };
function getState(): BusState {
  if (!G.__nexcelDiagnosticsBus) {
    G.__nexcelDiagnosticsBus = {
      channels: new Map(),
      buffers: new Map(),
    };
  }
  return G.__nexcelDiagnosticsBus;
}

const MAX_BUFFER = 200;

export function publish(analysisId: string, msg: BusMessage): void {
  const { channels, buffers } = getState();
  const buf = buffers.get(analysisId) ?? [];
  buf.push(msg);
  if (buf.length > MAX_BUFFER) buf.splice(0, buf.length - MAX_BUFFER);
  buffers.set(analysisId, buf);

  const subs = channels.get(analysisId);
  if (!subs) return;
  for (const s of subs) {
    try {
      s(msg);
    } catch {
      // Subscriber kaputt — ignorieren, wird beim nächsten Schreibversuch entfernt
    }
  }
}

export function subscribe(
  analysisId: string,
  fn: Subscriber,
): { unsubscribe: () => void; replay: BusMessage[] } {
  const { channels, buffers } = getState();
  if (!channels.has(analysisId)) channels.set(analysisId, new Set());
  channels.get(analysisId)!.add(fn);
  const replay = buffers.get(analysisId) ?? [];
  return {
    unsubscribe: () => {
      channels.get(analysisId)?.delete(fn);
      if (channels.get(analysisId)?.size === 0) channels.delete(analysisId);
    },
    replay,
  };
}

export function clearBuffer(analysisId: string): void {
  getState().buffers.delete(analysisId);
}
