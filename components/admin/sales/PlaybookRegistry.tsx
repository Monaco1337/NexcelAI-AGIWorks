"use client";

/**
 * Playbook-Registry.
 *
 * ICP, Telefonskript, Discovery-Leitfaden und Kundenvorschau-Storyline
 * werden als versionierte Playbooks im System gepflegt.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SalesPlaybook } from "./shared";
import { BrandChip, Field, Pill, Section, buttonPrimary, buttonSecondary, buttonGhost, inputClasses, selectClasses, textareaClasses } from "./HelperUI";
import { formatDateTimeDe } from "./shared";
import PlaybookView from "./PlaybookView";

const KEY_LABEL: Record<string, string> = {
  ICP: "Ideal Customer Profile",
  PHONE_SCRIPT: "Telefonskript",
  DISCOVERY_GUIDE: "Discovery-Leitfaden",
  CLIENT_PREVIEW_STORY: "Kundenvorschau-Story",
};

export default function PlaybookRegistry({ accent }: { accent: string }) {
  const [playbooks, setPlaybooks] = useState<SalesPlaybook[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("ICP");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sales/playbooks", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { playbooks: SalesPlaybook[] };
      setPlaybooks(data.playbooks);
      if (data.playbooks.length > 0 && !selectedId) {
        const active = data.playbooks.find((p) => p.key === selectedKey && p.isActive);
        setSelectedId(active?.id ?? data.playbooks[0].id);
        setJson(JSON.stringify(active?.structured ?? data.playbooks[0].structured, null, 2));
      }
    }
  }, [selectedId, selectedKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => playbooks.filter((p) => p.key === selectedKey), [playbooks, selectedKey]);
  const selected = useMemo(() => playbooks.find((p) => p.id === selectedId) ?? null, [playbooks, selectedId]);

  useEffect(() => {
    if (selected) setJson(JSON.stringify(selected.structured, null, 2));
  }, [selected]);

  const saveNewVersion = async () => {
    setBusy(true);
    setMessage(null);
    try {
      let structured: unknown;
      try {
        structured = JSON.parse(json);
      } catch (err) {
        setMessage(`JSON ungültig: ${(err as Error).message}`);
        return;
      }
      const res = await fetch("/api/admin/sales/playbooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: selectedKey,
          brandContext: selected?.brandContext ?? "any",
          structured,
          activate: true,
        }),
      });
      if (res.ok) {
        setMessage("Neue Version angelegt und aktiviert.");
        await load();
      } else {
        const t = await res.text();
        setMessage(t || "Speichern fehlgeschlagen.");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: SalesPlaybook) => {
    const res = await fetch(`/api/admin/sales/playbooks/${p.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !p.isActive }),
    });
    if (res.ok) void load();
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <Section title="Playbooks">
        <div className="mb-3 space-y-1">
          {Object.keys(KEY_LABEL).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setSelectedKey(k);
                const active = playbooks.find((p) => p.key === k && p.isActive) ?? playbooks.find((p) => p.key === k);
                setSelectedId(active?.id ?? null);
              }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                selectedKey === k ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.03]"
              }`}
            >
              {KEY_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-white/[0.05] pt-3">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Versionen</div>
          <ul className="mt-2 space-y-1">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${
                    selectedId === p.id ? "bg-white/[0.05] text-white" : "text-white/60 hover:bg-white/[0.03]"
                  }`}
                >
                  <span>v{p.version} · {p.brandContext}</span>
                  {p.isActive && <Pill color="#22C55E">aktiv</Pill>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="text-xs text-white/40">Keine Versionen.</li>}
          </ul>
        </div>
      </Section>

      <Section
        title={selected ? `${KEY_LABEL[selected.key] ?? selected.key} v${selected.version}` : "Playbook"}
        actions={
          selected && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRaw((v) => !v);
                  setEditMode(false);
                }}
                className={buttonGhost}
                title="Zeigt die technische Datenstruktur"
              >
                {showRaw ? "Lesbare Ansicht" : "Rohdaten anzeigen"}
              </button>
              {showRaw && (
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  className={buttonSecondary}
                >
                  {editMode ? "Nur lesen" : "Bearbeiten"}
                </button>
              )}
              <button onClick={() => selected && toggleActive(selected)} className={buttonSecondary}>
                {selected.isActive ? "Deaktivieren" : "Aktivieren"}
              </button>
              {showRaw && editMode && (
                <button onClick={saveNewVersion} disabled={busy} className={buttonPrimary} style={{ backgroundColor: accent }}>
                  {busy ? "…" : "Als neue Version speichern"}
                </button>
              )}
            </div>
          )
        }
      >
        {message && <div className="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/70">{message}</div>}
        {selected ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-white/45">
              <span>Erstellt {formatDateTimeDe(selected.createdAt)}</span>
              <span>·</span>
              <span>Aktualisiert {formatDateTimeDe(selected.updatedAt)}</span>
              <span>·</span>
              <span>Marke: {selected.brandContext}</span>
              {selected.isActive && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
                  aktiv
                </span>
              )}
            </div>
            {showRaw ? (
              editMode ? (
                <textarea
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  className={`${textareaClasses} min-h-[420px] font-mono text-[12px]`}
                  spellCheck={false}
                />
              ) : (
                <pre className="max-h-[520px] overflow-auto rounded-xl border border-white/[0.05] bg-black/40 p-4 text-[12px] leading-relaxed text-white/70">
{json}
                </pre>
              )
            ) : (
              <PlaybookView playbookKey={selected.key} structured={selected.structured} />
            )}
          </>
        ) : (
          <EmptyPlaybook />
        )}
      </Section>
    </div>
  );
}

function EmptyPlaybook() {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] px-6 py-10 text-center">
      <div className="text-sm font-medium text-white/70">Wähle links ein Playbook aus.</div>
      <div className="mx-auto mt-2 max-w-md text-xs text-white/40">
        Playbooks sind versionierte, freigegebene Standard-Vorgehen deines Vertriebs — Ideal Customer Profile, Telefonskript, Discovery-Leitfaden, Kundenvorschau-Storyline. Sie werden in Firmen- und Gesprächskontext automatisch verwendet.
      </div>
    </div>
  );
}
