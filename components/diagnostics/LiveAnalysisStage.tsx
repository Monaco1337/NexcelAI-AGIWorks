"use client";

/**
 * NEXCEL AI · LiveAnalysisStage
 *
 * Verbindet sich per Server-Sent Events mit /api/diagnostics/stream/[id]
 * und zeigt die ECHTEN Phasen, die das Backend feuert. Nichts wird simuliert.
 *
 * Wenn das Backend eine Phase als `skipped` markiert (z. B. weil ein Modul
 * fehlt), wird das hier transparent dargestellt — kein Fake-Loading.
 *
 * Bei Status `completed` oder `partial` leitet die Komponente auf
 *    /diagnose/[id]
 * weiter (vollständiger Report).
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type PhaseStatus = "pending" | "running" | "done" | "skipped" | "error";

interface Phase {
  id: string;
  label: string;
  status: PhaseStatus;
  note?: string;
}

type Status = "queued" | "running" | "completed" | "partial" | "failed";

interface Props {
  analysisId: string;
  url: string;
  uploads: { uploadId: string; filename: string; bytes: number }[];
}

export default function LiveAnalysisStage({ analysisId, url, uploads }: Props) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [status, setStatus] = useState<Status>("queued");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evt = new EventSource(`/api/diagnostics/stream/${analysisId}`);
    evt.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.kind === "phase") {
          setPhases((prev) => {
            const idx = prev.findIndex((p) => p.id === msg.phase.id);
            if (idx === -1) return [...prev, msg.phase];
            const copy = prev.slice();
            copy[idx] = msg.phase;
            return copy;
          });
        } else if (msg.kind === "status") {
          setStatus(msg.status);
          if (msg.error) setError(msg.error);
        } else if (msg.kind === "done") {
          evt.close();
        }
      } catch {
        // ignore malformed
      }
    };
    evt.onerror = () => {
      // Browser reconnectet automatisch — beim Final-Done ist die Verbindung
      // serverseitig schon geschlossen, also ist das ein no-op-Fehler.
    };
    return () => evt.close();
  }, [analysisId]);

  // Redirect, wenn fertig
  useEffect(() => {
    if (status === "completed" || status === "partial") {
      const t = setTimeout(() => {
        window.location.href = `/diagnose/${analysisId}`;
      }, 900);
      return () => clearTimeout(t);
    }
  }, [status, analysisId]);

  const headerStatus = useMemo(() => {
    if (status === "failed") return { label: "Analyse nicht möglich", color: "#ef4444" };
    if (status === "completed") return { label: "Fertig — Ergebnis wird geladen", color: "#10B981" };
    if (status === "partial") return { label: "Fast fertig", color: "#F59E0B" };
    return { label: "Auswertung läuft", color: "var(--brand-primary)" };
  }, [status]);

  return (
    <div className="mt-6">
      {/* Header */}
      <div
        className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <motion.span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{
              background: headerStatus.color,
              boxShadow: `0 0 10px ${headerStatus.color}80`,
            }}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: headerStatus.color }}
            >
              {headerStatus.label}
            </div>
            <div className="mt-0.5 truncate text-[12.5px] text-white/55">
              {url ? new URL(/^https?:\/\//.test(url) ? url : "https://" + url).host : "Ihre Unterlagen"}
              {uploads.length > 0 ? ` · ${uploads.length} Datei(en)` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Phasen-Liste */}
      <div
        className="mt-4 overflow-hidden rounded-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <ScanLines />
        <ul className="relative divide-y divide-white/[0.04]">
          {phases.length === 0 ? (
            <li className="px-5 py-6 text-center text-[12.5px] text-white/40">
              Kurz geduld — wir werten Ihre Angaben aus …
            </li>
          ) : (
            phases.map((p) => <PhaseRow key={p.id} phase={p} />)
          )}
        </ul>
      </div>

      <AnimatePresence>
        {status === "failed" && error ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl px-4 py-3 text-[13px]"
            style={{
              color: "#fecaca",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.28)",
            }}
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PhaseRow({ phase }: { phase: Phase }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <StatusDot status={phase.status} />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] text-white/90">{phase.label}</div>
        {phase.note ? (
          <div className="mt-0.5 truncate text-[11.5px] text-white/45">
            {phase.note}
          </div>
        ) : null}
      </div>
      <PhaseStateLabel status={phase.status} />
    </li>
  );
}

function StatusDot({ status }: { status: PhaseStatus }) {
  if (status === "running") {
    return (
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: "rgba(167,139,250,0.18)" }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <span
          className="relative inline-block h-2 w-2 rounded-full"
          style={{
            background: "#A78BFA",
            boxShadow: "0 0 8px rgba(167,139,250,0.85)",
          }}
        />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(16,185,129,0.18)" }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="m5 12 5 5 9-11"
            stroke="#10B981"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <span className="block h-[2px] w-[6px] bg-white/40" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(239,68,68,0.18)" }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M6 18 18 6"
            stroke="#ef4444"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: "rgba(255,255,255,0.18)" }}
    />
  );
}

function PhaseStateLabel({ status }: { status: PhaseStatus }) {
  const map: Record<PhaseStatus, { label: string; color: string }> = {
    pending: { label: "wartet", color: "rgba(255,255,255,0.35)" },
    running: { label: "läuft", color: "#A78BFA" },
    done: { label: "fertig", color: "#10B981" },
    skipped: { label: "übersprungen", color: "rgba(255,255,255,0.45)" },
    error: { label: "fehler", color: "#ef4444" },
  };
  const e = map[status];
  return (
    <span
      className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: e.color }}
    >
      {e.label}
    </span>
  );
}

function ScanLines() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 h-[1px] z-10"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(167,139,250,0.55), transparent)",
        boxShadow: "0 0 12px rgba(167,139,250,0.4)",
      }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
