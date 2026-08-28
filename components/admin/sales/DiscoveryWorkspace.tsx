"use client";

/**
 * Discovery-Workspace (Focus Mode).
 *
 * Geführte Bedarfsanalyse — kein 25-Felder-Formular. Jede Kategorie ist
 * ein visueller Block mit:
 *
 *   • Beobachtung / Hypothese (Was wir bereits sehen)
 *   • konkreter Gesprächsfrage
 *   • Live-Notizfeld (Autosave)
 *   • strukturierten Feldern
 *   • Klärungsstatus (Offen / Teilweise / Geklärt)
 *   • Evidenzklasse (Kundenaussage / Verifiziert / Indiz / Hypothese …)
 *
 * Rechts eine kompakte Completeness-Übersicht: Was ist geklärt, was
 * fehlt und was ist für ein hochwertiges Angebot kritisch. Alle Daten
 * fließen in dieselbe Discovery-Notiz — Solution und Proposal
 * verwenden sie automatisch.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BrandContext,
  SalesCompany,
  SalesContact,
  SalesOpportunity,
} from "./shared";
import { BRAND_CONTEXT_LABEL } from "./shared";
import {
  DISCOVERY_BLOCKS,
  DISCOVERY_GROUPS,
  DISCOVERY_STATUS_LABEL,
  EVIDENCE_KINDS,
  EVIDENCE_LABEL,
  EVIDENCE_COLOR,
  analyzeDiscovery,
  coerceDiscovery,
  emptyDiscovery,
  findBlock,
  type DiscoveryBlockDefinition,
  type DiscoveryBlockKey,
  type DiscoveryData,
  type DiscoveryStatus,
  type EvidenceKind,
} from "@/lib/sales/discoveryModel";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  inputClasses,
  Pill,
  selectClasses,
  textareaClasses,
} from "./HelperUI";

interface Props {
  company: SalesCompany;
  contacts: SalesContact[];
  opportunity: SalesOpportunity;
  brand: BrandContext;
  accent: string;
  onClose: () => void;
  onCompleted: () => void;
}

export default function DiscoveryWorkspace({
  company,
  contacts,
  opportunity,
  brand,
  accent,
  onClose,
  onCompleted,
}: Props) {
  const [data, setData] = useState<DiscoveryData>(emptyDiscovery());
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showRecap, setShowRecap] = useState(false);
  const [openBlock, setOpenBlock] = useState<DiscoveryBlockKey | null>(DISCOVERY_BLOCKS[0].key);
  const [elapsedSec, setElapsedSec] = useState(0);

  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const dataRef = useRef<DiscoveryData>(data);
  dataRef.current = data;
  const startTsRef = useRef<number>(Date.now());

  /* ───────── Initial laden ───────── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/sales/opportunities/${opportunity.id}/discovery`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const payload = (await res.json()) as { discovery: DiscoveryData };
          if (alive) setData(coerceDiscovery(payload.discovery));
        }
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [opportunity.id]);

  /* ───────── Timer ───────── */
  useEffect(() => {
    const t = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTsRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  /* ───────── ESC ───────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showRecap) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, showRecap]);

  /* ───────── Autosave ───────── */
  const persist = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!loaded) return;
      if (savingRef.current) {
        pendingRef.current = true;
        return;
      }
      savingRef.current = true;
      setSaveState("saving");
      try {
        const res = await fetch(
          `/api/admin/sales/opportunities/${opportunity.id}/discovery`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              discovery: dataRef.current,
              silent: opts?.silent ?? true,
            }),
          }
        );
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      } finally {
        savingRef.current = false;
        if (pendingRef.current) {
          pendingRef.current = false;
          window.setTimeout(() => persist({ silent: true }), 100);
        }
      }
    },
    [loaded, opportunity.id]
  );

  const persistRef = useRef(persist);
  persistRef.current = persist;

  // Debounced Autosave
  const autoTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    autoTimer.current = window.setTimeout(() => {
      void persistRef.current({ silent: true });
    }, 1600);
    return () => {
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
    };
  }, [data, loaded]);

  /* ───────── Cmd/Ctrl+S ───────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void persist({ silent: false });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [persist]);

  const analysis = useMemo(() => analyzeDiscovery(data), [data]);

  const updateBlock = (key: DiscoveryBlockKey, updater: (b: (typeof data.blocks)[DiscoveryBlockKey]) => (typeof data.blocks)[DiscoveryBlockKey]) => {
    setData({
      ...data,
      blocks: { ...data.blocks, [key]: updater(data.blocks[key]) },
    });
  };

  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;
  const primaryName = primaryContact
    ? [primaryContact.firstName, primaryContact.lastName].filter(Boolean).join(" ")
    : null;

  const finalize = async () => {
    await persist({ silent: false });
    // Opportunity-Status auf 'bedarfsgespraech_abgeschlossen' setzen (soft).
    try {
      await fetch(`/api/admin/sales/opportunities/${opportunity.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: opportunity.version,
          status:
            opportunity.status === "termin_vereinbart" ||
            opportunity.status === "bedarfsgespraech_abgeschlossen"
              ? "bedarfsgespraech_abgeschlossen"
              : opportunity.status,
          contactOutcome: "bedarf_bestaetigt",
        }),
      });
    } catch {
      /* nicht kritisch */
    }
    onCompleted();
  };

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-[#050508]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showRecap) onClose();
      }}
    >
      <div className="mx-auto min-h-screen max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
              <span>Bedarfsgespräch</span>
              <span>·</span>
              <span>{BRAND_CONTEXT_LABEL[brand]}</span>
              <span>·</span>
              <span>{opportunity.title}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl font-semibold text-white">{company.name}</h2>
              {primaryName && (
                <span className="text-sm text-white/60">
                  {primaryName}
                  {primaryContact?.position ? ` · ${primaryContact.position}` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-sm text-white/85">
              {formatTimer(elapsedSec)}
            </div>
            <SaveIndicator state={saveState} />
            <button onClick={onClose} className={buttonGhost}>
              Fokus verlassen
            </button>
          </div>
        </header>

        {!loaded ? (
          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-sm text-white/60">
            Bedarfsdaten werden geladen …
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pt-4 lg:grid-cols-[1fr_320px]">
            {/* LINKS: Themenblöcke gruppiert */}
            <section className="space-y-4">
              {DISCOVERY_GROUPS.map((group) => (
                <div key={group.key} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold text-white/90">{group.label}</h3>
                    <span className="text-[11px] text-white/40">{group.hint}</span>
                  </div>
                  <div className="space-y-2">
                    {DISCOVERY_BLOCKS.filter((b) => b.group === group.key).map((def) => {
                      const block = data.blocks[def.key];
                      const open = openBlock === def.key;
                      return (
                        <BlockCard
                          key={def.key}
                          def={def}
                          block={block}
                          open={open}
                          onToggle={() => setOpenBlock(open ? null : def.key)}
                          onChange={(partial) => updateBlock(def.key, (b) => ({ ...b, ...partial }))}
                          onFieldChange={(k, v) =>
                            updateBlock(def.key, (b) => ({
                              ...b,
                              fields: { ...b.fields, [k]: v },
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
                <label className="block">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">
                    Bestätigter Bedarf (Recap)
                  </div>
                  <textarea
                    value={data.bestaetigterBedarf}
                    onChange={(e) => setData({ ...data, bestaetigterBedarf: e.target.value })}
                    className={`${textareaClasses} mt-1 min-h-[100px]`}
                    placeholder="Bringen Sie mich kurz auf den Punkt: was ist am Ende bestätigt?"
                  />
                </label>
                <label className="mt-3 block">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">
                    Vereinbarter nächster Schritt
                  </div>
                  <input
                    value={data.naechsterSchritt}
                    onChange={(e) => setData({ ...data, naechsterSchritt: e.target.value })}
                    className={`${inputClasses} mt-1`}
                    placeholder="z. B. Lösung ausarbeiten und Termin am 12.09."
                  />
                </label>
              </div>
            </section>

            {/* RECHTS: Completeness */}
            <aside className="space-y-3 lg:sticky lg:top-4 lg:h-fit">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-white/90">Discovery-Status</h3>
                  <span className="text-[11px] text-white/40">
                    {Math.round(analysis.ratio * 100)}%
                  </span>
                </div>
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(4, Math.round(analysis.ratio * 100))}%`,
                      background: accent,
                    }}
                  />
                </div>

                <ReadyBadge ready={analysis.readyForSolution} criticalOpen={analysis.criticalOpen.length} />

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <Stat label="Geklärt" value={analysis.clarified.length} color="#22C55E" />
                  <Stat label="Teilweise" value={analysis.partial.length} color="#F59E0B" />
                  <Stat label="Offen" value={analysis.open.length} color="#94A3B8" />
                </div>

                {analysis.criticalOpen.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wider text-amber-300/80">
                      Kritisch für Angebot
                    </div>
                    <ul className="mt-1 space-y-1">
                      {analysis.criticalOpen.map((k) => {
                        const def = findBlock(k);
                        return (
                          <li key={k}>
                            <button
                              type="button"
                              onClick={() => setOpenBlock(k)}
                              className="w-full rounded-md border border-amber-400/25 bg-amber-400/[0.06] px-2 py-1.5 text-left text-xs text-amber-100 hover:bg-amber-400/[0.1]"
                            >
                              {def.letter} · {def.title}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
                <button
                  onClick={() => setShowRecap(true)}
                  className={buttonPrimary}
                  style={{ backgroundColor: accent, width: "100%" }}
                >
                  Gespräch abschließen →
                </button>
                <div className="mt-2 text-[11px] text-white/40">
                  Zeigt eine Zusammenfassung. Alles Weitere (Post-Call, Lösung, Angebot) verwendet diese Erkenntnisse automatisch.
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 text-[13px] leading-relaxed text-white/70">
                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/45">
                  Beratungsmechanik
                </div>
                Beobachtung → Hypothese → Frage → Kundenrealität → Auswirkung → Opportunity.
              </div>
            </aside>
          </div>
        )}

        {showRecap && (
          <RecapDialog
            data={data}
            company={company}
            onCancel={() => setShowRecap(false)}
            onConfirm={async () => {
              setShowRecap(false);
              await finalize();
            }}
            accent={accent}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  BlockCard                                                                  */
/* -------------------------------------------------------------------------- */

function BlockCard({
  def,
  block,
  open,
  onToggle,
  onChange,
  onFieldChange,
}: {
  def: DiscoveryBlockDefinition;
  block: DiscoveryData["blocks"][DiscoveryBlockKey];
  open: boolean;
  onToggle: () => void;
  onChange: (partial: Partial<DiscoveryData["blocks"][DiscoveryBlockKey]>) => void;
  onFieldChange: (key: string, value: string) => void;
}) {
  const statusColor =
    block.status === "clarified"
      ? "#22C55E"
      : block.status === "partial"
        ? "#F59E0B"
        : "#94A3B8";
  const has = Boolean(
    block.note ||
      Object.values(block.fields ?? {}).some((v) => v && v.trim().length > 0)
  );
  return (
    <div
      className={`rounded-xl border ${open ? "border-white/[0.12]" : "border-white/[0.06]"} bg-black/[0.15]`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        <span
          className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white/70"
          style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}
        >
          {def.letter}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white/90">{def.title}</span>
            {def.criticalForProposal && (
              <span
                className="rounded-md border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-200"
                title="Kritisch für Angebot"
              >
                !
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/45 line-clamp-1">
            {has ? summary(block) : def.purpose}
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-wider" style={{ color: statusColor }}>
          {DISCOVERY_STATUS_LABEL[block.status]}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/[0.05] px-4 py-3">
          <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/45">Mögliche Frage</div>
            <div className="mt-0.5 text-sm text-white/85">{def.question}</div>
          </div>

          <div className="mt-3">
            <label className="text-[11px] uppercase tracking-wider text-white/45">
              Live-Notiz
            </label>
            <textarea
              value={block.note}
              onChange={(e) => onChange({ note: e.target.value })}
              className={`${textareaClasses} mt-1 min-h-[90px]`}
              placeholder="Kundenaussagen, Zitate, Beobachtungen …"
            />
          </div>

          {def.fields.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {def.fields.map((f) => (
                <label key={f.key} className="block">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">{f.label}</div>
                  <input
                    value={block.fields?.[f.key] ?? ""}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    className={`${inputClasses} mt-1`}
                    placeholder={f.placeholder}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPicker
              value={block.status}
              onChange={(status) => onChange({ status })}
            />
            <EvidencePicker
              value={block.evidence}
              onChange={(evidence) => onChange({ evidence })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function summary(block: DiscoveryData["blocks"][DiscoveryBlockKey]): string {
  if (block.note && block.note.length > 0) return block.note.slice(0, 120);
  const firstField = Object.values(block.fields ?? {}).find(
    (v) => v && v.trim().length > 0
  );
  return firstField ? firstField.slice(0, 120) : "Noch nichts erfasst.";
}

function StatusPicker({
  value,
  onChange,
}: {
  value: DiscoveryStatus;
  onChange: (v: DiscoveryStatus) => void;
}) {
  const options: { key: DiscoveryStatus; label: string; color: string }[] = [
    { key: "open", label: "Offen", color: "#94A3B8" },
    { key: "partial", label: "Teilweise", color: "#F59E0B" },
    { key: "clarified", label: "Geklärt", color: "#22C55E" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] p-1">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`rounded-md px-2 py-1 text-[11px] font-medium ${
              active ? "text-white" : "text-white/55"
            }`}
            style={active ? { background: `${o.color}22`, color: o.color } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function EvidencePicker({
  value,
  onChange,
}: {
  value: EvidenceKind;
  onChange: (v: EvidenceKind) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EvidenceKind)}
      className={`${selectClasses} w-auto min-w-[160px] text-xs`}
      style={{ borderColor: `${EVIDENCE_COLOR[value]}55` }}
    >
      {EVIDENCE_KINDS.map((k) => (
        <option key={k} value={k}>
          {EVIDENCE_LABEL[k]}
        </option>
      ))}
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sidebar-Bausteine                                                          */
/* -------------------------------------------------------------------------- */

function ReadyBadge({
  ready,
  criticalOpen,
}: {
  ready: boolean;
  criticalOpen: number;
}) {
  if (ready) {
    return (
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-2 text-sm text-emerald-100">
        <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Status</div>
        <div className="mt-0.5 font-medium">Lösungsbereit</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-sm text-amber-100">
      <div className="text-[11px] uppercase tracking-wider text-amber-300/80">Status</div>
      <div className="mt-0.5 font-medium">
        {criticalOpen > 0
          ? `Weitere Klärung nötig · ${criticalOpen} kritisch offen`
          : "Weitere Klärung nötig"}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-0.5 text-lg font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const map = {
    idle: { color: "#64748B", label: "Bereit" },
    saving: { color: "#F59E0B", label: "Speichert…" },
    saved: { color: "#22C55E", label: "Gespeichert" },
    error: { color: "#EF4444", label: "Fehler" },
  } as const;
  const cur = map[state];
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white/70">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${state === "saving" ? "animate-pulse" : ""}`}
        style={{ background: cur.color }}
      />
      {cur.label}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recap                                                                      */
/* -------------------------------------------------------------------------- */

function RecapDialog({
  data,
  company,
  onCancel,
  onConfirm,
  accent,
}: {
  data: DiscoveryData;
  company: SalesCompany;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  accent: string;
}) {
  const analysis = analyzeDiscovery(data);
  const importantKeys: DiscoveryBlockKey[] = [
    "A_ziel",
    "E_pain",
    "F_ursache",
    "G_auswirkung",
    "J_potenzial",
    "K_business_value",
    "L_zielzustand",
    "M_erfolgskriterien",
    "Q_stakeholder",
    "O_timing",
    "T_budget",
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
        <h3 className="text-lg font-semibold text-white">Bedarf abschließen — Zusammenfassung</h3>
        <p className="mt-1 text-sm text-white/60">
          Prüfe die zentralen Erkenntnisse. Nach Bestätigung ist der Bedarf im gesamten Prozess (Lösung, Angebot) verfügbar.
        </p>

        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {data.bestaetigterBedarf && (
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Bestätigter Bedarf</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">
                {data.bestaetigterBedarf}
              </div>
            </div>
          )}
          {data.naechsterSchritt && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Nächster Schritt</div>
              <div className="mt-1 text-sm text-white/85">{data.naechsterSchritt}</div>
            </div>
          )}
          {importantKeys.map((k) => {
            const def = findBlock(k);
            const b = data.blocks[k];
            if (!b.note && !Object.values(b.fields ?? {}).some((v) => v && v.trim().length > 0)) {
              return null;
            }
            return (
              <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">
                    {def.letter} · {def.title}
                  </div>
                  <Pill color={EVIDENCE_COLOR[b.evidence]}>{EVIDENCE_LABEL[b.evidence]}</Pill>
                </div>
                {b.note && (
                  <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">{b.note}</div>
                )}
                {Object.entries(b.fields ?? {})
                  .filter(([, v]) => v && v.trim().length > 0)
                  .map(([k2, v]) => (
                    <div key={k2} className="mt-1 text-[12px] text-white/70">
                      <span className="text-white/45">{k2}:</span> {v}
                    </div>
                  ))}
              </div>
            );
          })}

          {analysis.criticalOpen.length > 0 && (
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.05] px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-amber-300/80">
                Noch offen und kritisch für ein Angebot
              </div>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {analysis.criticalOpen.map((k) => (
                  <li
                    key={k}
                    className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100"
                  >
                    {findBlock(k).title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className={buttonSecondary}>
            Zurück ins Gespräch
          </button>
          <button
            onClick={() => void onConfirm()}
            className={buttonPrimary}
            style={{ backgroundColor: accent }}
          >
            Bedarf bestätigen & speichern
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
