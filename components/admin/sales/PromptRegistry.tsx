"use client";

/**
 * Prompt- & Run-Registry.
 *
 * Zwei Seiten:
 *  - Prompts (Master-Prompts pro Workflow, versioniert und aktivierbar)
 *  - Runs (chronologische Liste aller AI-Ausführungen mit Review)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SalesAiRun, SalesPrompt, SalesPromptKey, RunStatus } from "./shared";
import {
  Pill,
  Section,
  buttonPrimary,
  buttonSecondary,
  buttonGhost,
  inputClasses,
  selectClasses,
  textareaClasses,
  Field,
} from "./HelperUI";
import { formatDateTimeDe } from "./shared";

type Sub = "prompts" | "runs";

export default function PromptRegistry({ accent }: { accent: string }) {
  const [sub, setSub] = useState<Sub>("prompts");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        <button
          onClick={() => setSub("prompts")}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${sub === "prompts" ? "bg-white/[0.08] text-white" : "text-white/60"}`}
        >
          Master-Prompts
        </button>
        <button
          onClick={() => setSub("runs")}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${sub === "runs" ? "bg-white/[0.08] text-white" : "text-white/60"}`}
        >
          Alle Runs
        </button>
      </div>
      {sub === "prompts" ? <PromptList accent={accent} /> : <RunsList accent={accent} />}
    </div>
  );
}

/* ── Prompts ────────────────────────────────────────────────────────── */

function PromptList({ accent }: { accent: string }) {
  const [prompts, setPrompts] = useState<SalesPrompt[]>([]);
  const [selectedKey, setSelectedKey] = useState<SalesPromptKey>("LEAD_RESEARCH");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [system, setSystem] = useState("");
  const [userTemplate, setUserTemplate] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [model, setModel] = useState("gpt-4o");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sales/ai/prompts", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { prompts: SalesPrompt[] };
      setPrompts(data.prompts);
      const active = data.prompts.find((p) => p.key === selectedKey && p.isActive) ?? data.prompts.find((p) => p.key === selectedKey);
      setSelectedId(active?.id ?? null);
    }
  }, [selectedKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => prompts.find((p) => p.id === selectedId) ?? null, [prompts, selectedId]);
  const versions = useMemo(() => prompts.filter((p) => p.key === selectedKey), [prompts, selectedKey]);

  useEffect(() => {
    if (selected) {
      setSystem(selected.system);
      setUserTemplate(selected.userTemplate);
      setTemperature(selected.temperature);
      setModel(selected.model);
    }
  }, [selected]);

  const saveNewVersion = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sales/ai/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: selectedKey,
          brandContext: selected?.brandContext ?? "any",
          model,
          temperature,
          system,
          userTemplate,
          outputFormat: selected?.outputFormat ?? "json",
          activate: true,
        }),
      });
      if (res.ok) {
        setMessage("Neue Prompt-Version angelegt.");
        await load();
      } else {
        setMessage("Speichern fehlgeschlagen.");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: SalesPrompt) => {
    await fetch(`/api/admin/sales/ai/prompts/${p.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !p.isActive }),
    });
    void load();
  };

  const keys: SalesPromptKey[] = ["LEAD_RESEARCH", "PRE_CALL", "POST_CALL", "CLIENT_PREVIEW", "DISCOVERY_PREP", "SOLUTION_SCOPE", "PROPOSAL"];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <Section title="Prompts">
        <div className="mb-3 space-y-1">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => {
                setSelectedKey(k);
                const active = prompts.find((p) => p.key === k && p.isActive) ?? prompts.find((p) => p.key === k);
                setSelectedId(active?.id ?? null);
              }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                selectedKey === k ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.03]"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-white/[0.05] pt-3">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Versionen</div>
          <ul className="mt-2 space-y-1">
            {versions.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                    selectedId === p.id ? "bg-white/[0.05] text-white" : "text-white/60 hover:bg-white/[0.03]"
                  }`}
                >
                  <span>v{p.version} · {p.brandContext}</span>
                  {p.isActive && <Pill color="#22C55E">aktiv</Pill>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section
        title={selected ? `${selected.key} v${selected.version}` : "Prompt"}
        actions={
          selected && (
            <div className="flex items-center gap-2">
              <button onClick={() => toggleActive(selected)} className={buttonSecondary}>
                {selected.isActive ? "Deaktivieren" : "Aktivieren"}
              </button>
              <button onClick={saveNewVersion} disabled={busy} className={buttonPrimary} style={{ backgroundColor: accent }}>
                {busy ? "…" : "Als neue Version speichern"}
              </button>
            </div>
          )
        }
      >
        {message && <div className="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/70">{message}</div>}
        {selected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Modell"><input value={model} onChange={(e) => setModel(e.target.value)} className={inputClasses} /></Field>
              <Field label="Temperature"><input type="number" step="0.1" min="0" max="2" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className={inputClasses} /></Field>
            </div>
            <Field label="System-Prompt">
              <textarea value={system} onChange={(e) => setSystem(e.target.value)} className={`${textareaClasses} min-h-[240px] font-mono text-[12px]`} />
            </Field>
            <Field label="User-Template">
              <textarea value={userTemplate} onChange={(e) => setUserTemplate(e.target.value)} className={`${textareaClasses} min-h-[240px] font-mono text-[12px]`} />
            </Field>
          </div>
        ) : (
          <div className="text-sm text-white/50">Wähle einen Prompt aus.</div>
        )}
      </Section>
    </div>
  );
}

/* ── Runs ───────────────────────────────────────────────────────────── */

function RunsList({ accent }: { accent: string }) {
  const [runs, setRuns] = useState<SalesAiRun[]>([]);
  const [statusFilter, setStatusFilter] = useState<RunStatus | "">("");
  const [keyFilter, setKeyFilter] = useState<SalesPromptKey | "">("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (keyFilter) params.set("promptKey", keyFilter);
    const res = await fetch(`/api/admin/sales/ai/runs?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { runs: SalesAiRun[] };
      setRuns(data.runs);
    }
  }, [statusFilter, keyFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (r: SalesAiRun, status: RunStatus, note?: string) => {
    await fetch(`/api/admin/sales/ai/runs/${r.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    void load();
  };

  return (
    <Section title={`AI-Runs (${runs.length})`}>
      <div className="mb-3 flex flex-wrap gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RunStatus | "")} className={`${selectClasses} w-auto`}>
          <option value="">Alle Stati</option>
          <option value="REVIEW_REQUIRED">Freigabe offen</option>
          <option value="APPROVED">Freigegeben</option>
          <option value="REJECTED">Abgelehnt</option>
          <option value="FAILED">Fehler</option>
          <option value="SUPERSEDED">Ersetzt</option>
        </select>
        <select value={keyFilter} onChange={(e) => setKeyFilter(e.target.value as SalesPromptKey | "")} className={`${selectClasses} w-auto`}>
          <option value="">Alle Workflows</option>
          {["LEAD_RESEARCH", "PRE_CALL", "POST_CALL", "CLIENT_PREVIEW", "DISCOVERY_PREP", "SOLUTION_SCOPE", "PROPOSAL"].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {runs.length === 0 ? (
        <div className="text-sm text-white/45">Keine Runs.</div>
      ) : (
        <ul className="space-y-2">
          {runs.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/[0.06] bg-black/20">
              <button
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    {r.promptKey}
                    <Pill color={statusColor(r.status)}>{r.status}</Pill>
                    <span className="text-[11px] text-white/45">{r.entityType} · {r.entityId?.slice(-6) ?? "—"}</span>
                  </div>
                  <div className="text-[11px] text-white/45">{formatDateTimeDe(r.createdAt)} · {r.model}</div>
                </div>
                <span className="text-white/40">{openId === r.id ? "▲" : "▼"}</span>
              </button>
              {openId === r.id && (
                <div className="border-t border-white/[0.05] p-3">
                  {r.error && <div className="mb-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">{r.error}</div>}
                  <pre className="max-h-72 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-relaxed text-white/70">
{JSON.stringify(r.output ?? r.outputText ?? {}, null, 2)}
                  </pre>
                  {r.status === "REVIEW_REQUIRED" && (
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button onClick={() => review(r, "REJECTED", prompt("Ablehnungsgrund?") ?? undefined)} className={buttonSecondary}>Ablehnen</button>
                      <button onClick={() => review(r, "APPROVED")} className={buttonPrimary} style={{ backgroundColor: "#22C55E" }}>Freigeben</button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function statusColor(status: RunStatus): string {
  switch (status) {
    case "APPROVED":
      return "#22C55E";
    case "REJECTED":
    case "FAILED":
      return "#EF4444";
    case "REVIEW_REQUIRED":
      return "#F59E0B";
    case "SUPERSEDED":
      return "#6B7280";
    default:
      return "#0091C2";
  }
}
