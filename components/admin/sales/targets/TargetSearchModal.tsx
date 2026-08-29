"use client";

/**
 * Automatische Zielkunden-Suche starten.
 * Startet einen Search-Job synchron, zeigt Ergebnisse als Toast/Log
 * und triggert eine Neuladung der Liste.
 */

import { useState } from "react";
import { Field, inputClasses, selectClasses, buttonPrimary, buttonSecondary } from "../HelperUI";
import type { SearchDepth } from "@/lib/sales/targets/model";
import { SEARCH_DEPTH_LABEL } from "@/lib/sales/targets/model";

interface Props {
  accent: string;
  onClose: () => void;
  onCompleted: () => void;
}

const INDUSTRY_PRESETS = [
  "Handwerk",
  "Sanitär / Heizung",
  "Elektro",
  "Ärzte / Praxen",
  "Kanzleien",
  "Steuerberatung",
  "Gastronomie",
  "Immobilien",
  "Fitness / Beauty",
  "Automotive",
  "Einzelhandel",
  "Industrie",
];

export default function TargetSearchModal({ accent, onClose, onCompleted }: Props) {
  const [city, setCity] = useState("Unna");
  const [radius, setRadius] = useState(25);
  const [industry, setIndustry] = useState("Handwerk");
  const [depth, setDepth] = useState<SearchDepth>("STANDARD");
  const [limit, setLimit] = useState(50);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ provider: string; ok: boolean; error?: string }>>([]);
  const [summary, setSummary] = useState<{ discovered: number; created: number; updated: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setError(null);
    setLogs([]);
    setSummary(null);
    try {
      const res = await fetch("/api/admin/sales/targets/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          radiusKm: radius,
          industries: [industry],
          depth,
          limitCount: limit,
          country: "DE",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
      }
      const providerLogs = (data.result?.providerLogs ?? []) as Array<{ provider: string; ok: boolean; error?: string }>;
      setLogs(providerLogs);
      setSummary({
        discovered: data.result?.discoveredCount ?? 0,
        created: data.result?.createdCount ?? 0,
        updated: data.result?.updatedCount ?? 0,
      });
      // Nur bei erfolgreichem Ergebnis auto-close
      if ((data.result?.createdCount ?? 0) + (data.result?.updatedCount ?? 0) > 0) {
        setTimeout(onCompleted, 800);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0B0B0F] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Neue Suche</div>
          <h3 className="text-lg font-semibold text-white">Zielkunden automatisch entdecken</h3>
          <p className="mt-1 text-xs text-white/50">
            Wir kombinieren konfigurierte Provider (aktuell Google Places, wenn ein API-Key gesetzt ist) und
            legen die entdeckten Firmen mit Provenance an. Jede wird anschließend automatisch angereichert.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stadt">
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClasses} required />
            </Field>
            <Field label="Radius (km)">
              <input
                type="number"
                min={1}
                max={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className={inputClasses}
              />
            </Field>
          </div>
          <Field label="Branche">
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClasses}>
              {INDUSTRY_PRESETS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Suchtiefe">
              <select value={depth} onChange={(e) => setDepth(e.target.value as SearchDepth)} className={selectClasses}>
                {(["QUICK", "STANDARD", "DEEP"] as SearchDepth[]).map((d) => (
                  <option key={d} value={d}>
                    {SEARCH_DEPTH_LABEL[d]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Max. Anzahl">
              <input
                type="number"
                min={5}
                max={500}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className={inputClasses}
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>
          )}
          {logs.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-xs">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white/70">
                  <span className={log.ok ? "text-emerald-300" : "text-red-300"}>{log.ok ? "✓" : "!"}</span>
                  <span className="font-medium">{log.provider}</span>
                  {log.error && <span className="text-white/50">— {log.error}</span>}
                </div>
              ))}
            </div>
          )}
          {summary && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-200">
              {summary.discovered} entdeckt · {summary.created} neu angelegt · {summary.updated} aktualisiert
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={buttonSecondary} disabled={running}>
              Schließen
            </button>
            <button type="submit" className={buttonPrimary} style={{ backgroundColor: accent, color: "#000" }} disabled={running}>
              {running ? "Sucht…" : "Zielkunden finden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
