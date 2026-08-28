"use client";

/**
 * Opportunity-Panel.
 *
 * Zeigt alle Vertriebsbausteine einer Opportunity mit sichtbarem Fokus
 * (Übersicht / Solution / Angebote). Rendert immer das komplette Panel,
 * scrollt aber zum gewünschten Bereich.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BRAND_CONTEXT_LABEL,
  CLASSIFICATION_LABEL,
  CONTACT_OUTCOME_LABEL,
  LOST_REASON_LABEL,
  NEXT_ACTION_LABEL,
  OBJECTION_TYPE_LABEL,
  PROPOSAL_STATUS_LABEL,
  QUALITY_GATE_LABEL,
  SALES_STATUS_LABEL,
  formatDateDe,
  formatDateTimeDe,
  formatEuroFromCents,
  type BrandContext,
  type ContactOutcome,
  type LostReason,
  type NextAction,
  type ObjectionType,
  type ProposalVersion,
  type QualityGate,
  type SalesActivity,
  type SalesClassification,
  type SalesNote,
  type SalesObjection,
  type SalesOpportunity,
  type SalesProposal,
  type SalesSolution,
  type SalesStatus,
} from "./shared";
import {
  BrandChip,
  ClassificationBadge,
  DangerButton,
  EmptyState,
  Field,
  Pill,
  Section,
  StatusPill,
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  inputClasses,
  selectClasses,
  textareaClasses,
} from "./HelperUI";

interface DetailResponse {
  opportunity: SalesOpportunity;
  notes: SalesNote[];
  objections: SalesObjection[];
  solution: SalesSolution | null;
  proposals: SalesProposal[];
  activities: SalesActivity[];
}

export default function OpportunityPanel({
  opportunityId,
  accent,
  focus,
  onChanged,
}: {
  opportunityId: string;
  accent: string;
  focus: "overview" | "solution" | "proposals";
  onChanged: () => void;
}) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const focusAnchor = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/sales/opportunities/${opportunityId}`, { cache: "no-store" });
    if (res.ok) {
      const parsed = (await res.json()) as DetailResponse;
      setData(parsed);
    }
  }, [opportunityId]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (focus !== "overview" && focusAnchor.current) {
      focusAnchor.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus, data]);

  const bump = useCallback(() => {
    setReloadKey((n) => n + 1);
    onChanged();
  }, [onChanged]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/50">
        Lade Opportunity…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OpportunityHeader opp={data.opportunity} accent={accent} onSaved={bump} />

      <NotesBlock opp={data.opportunity} notes={data.notes} onChanged={bump} />

      <ObjectionsBlock opp={data.opportunity} objections={data.objections} onChanged={bump} />

      <div ref={focus === "solution" ? focusAnchor : null}>
        <SolutionBlock opp={data.opportunity} solution={data.solution} onChanged={bump} accent={accent} />
      </div>

      <div ref={focus === "proposals" ? focusAnchor : null}>
        <ProposalsBlock
          opp={data.opportunity}
          proposals={data.proposals}
          solutionApproved={Boolean(data.solution?.approvedAt)}
          onChanged={bump}
          accent={accent}
        />
      </div>

      <WonLostBlock opp={data.opportunity} onChanged={bump} accent={accent} />
    </div>
  );
}

/* ── Header ─────────────────────────────────────────────────────────── */

function OpportunityHeader({
  opp,
  accent,
  onSaved,
}: {
  opp: SalesOpportunity;
  accent: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(opp);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(opp), [opp]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sales/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: opp.version,
          title: form.title,
          brandContext: form.brandContext,
          status: form.status,
          classification: form.classification,
          contactOutcome: form.contactOutcome,
          nextAction: form.nextAction,
          nextActionDueAt: form.nextActionDueAt,
          nextMeetingAt: form.nextMeetingAt,
          expectedValueCents: form.expectedValueCents,
          proposalValueCents: form.proposalValueCents,
          closeDate: form.closeDate,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        setError(t || "Speichern fehlgeschlagen.");
        return;
      }
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ClassificationBadge value={form.classification} />
            <h2 className="text-lg font-semibold text-white">{form.title}</h2>
            <BrandChip value={form.brandContext} />
            <StatusPill value={form.status} />
          </div>
          <div className="mt-1 text-[11px] text-white/45">
            Erwartet {formatEuroFromCents(form.expectedValueCents)} · Angebot {formatEuroFromCents(form.proposalValueCents)}
            {form.closeDate ? ` · Close ${formatDateDe(form.closeDate)}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(opp); }} className={buttonSecondary}>Abbrechen</button>
              <button onClick={save} disabled={saving} className={buttonPrimary} style={{ backgroundColor: accent }}>
                {saving ? "Speichere…" : "Speichern"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className={buttonSecondary}>Bearbeiten</button>
          )}
        </div>
      </div>

      {error && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}

      {editing && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Titel"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClasses} /></Field>
          <Field label="Marke">
            <select value={form.brandContext} onChange={(e) => setForm({ ...form, brandContext: e.target.value as BrandContext })} className={selectClasses}>
              <option value="nexcel">NEXCEL AI</option>
              <option value="agiworks">AGI Works</option>
              <option value="both">Beide</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SalesStatus })} className={selectClasses}>
              {(Object.keys(SALES_STATUS_LABEL) as SalesStatus[]).map((s) => (
                <option key={s} value={s}>{SALES_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Klassifizierung">
            <select
              value={form.classification ?? ""}
              onChange={(e) => setForm({ ...form, classification: (e.target.value || null) as SalesClassification | null })}
              className={selectClasses}
            >
              <option value="">Offen</option>
              {(["A", "B", "C", "D"] as SalesClassification[]).map((c) => (
                <option key={c} value={c}>{CLASSIFICATION_LABEL[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Kontakt-Ergebnis">
            <select
              value={form.contactOutcome ?? ""}
              onChange={(e) => setForm({ ...form, contactOutcome: (e.target.value || null) as ContactOutcome | null })}
              className={selectClasses}
            >
              <option value="">Offen</option>
              {(Object.keys(CONTACT_OUTCOME_LABEL) as ContactOutcome[]).map((c) => (
                <option key={c} value={c}>{CONTACT_OUTCOME_LABEL[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Nächste Aktion">
            <select
              value={form.nextAction ?? ""}
              onChange={(e) => setForm({ ...form, nextAction: (e.target.value || null) as NextAction | null })}
              className={selectClasses}
            >
              <option value="">Offen</option>
              {(Object.keys(NEXT_ACTION_LABEL) as NextAction[]).map((a) => (
                <option key={a} value={a}>{NEXT_ACTION_LABEL[a]}</option>
              ))}
            </select>
          </Field>
          <Field label="Fällig am">
            <input type="datetime-local" value={toLocalInput(form.nextActionDueAt)} onChange={(e) => setForm({ ...form, nextActionDueAt: fromLocalInput(e.target.value) })} className={inputClasses} />
          </Field>
          <Field label="Nächstes Meeting">
            <input type="datetime-local" value={toLocalInput(form.nextMeetingAt)} onChange={(e) => setForm({ ...form, nextMeetingAt: fromLocalInput(e.target.value) })} className={inputClasses} />
          </Field>
          <Field label="Erwartet (Cent)">
            <input type="number" value={form.expectedValueCents ?? ""} onChange={(e) => setForm({ ...form, expectedValueCents: e.target.value ? Number(e.target.value) : null })} className={inputClasses} />
          </Field>
          <Field label="Angebotswert (Cent)">
            <input type="number" value={form.proposalValueCents ?? ""} onChange={(e) => setForm({ ...form, proposalValueCents: e.target.value ? Number(e.target.value) : null })} className={inputClasses} />
          </Field>
          <Field label="Close-Datum">
            <input type="date" value={toDateInput(form.closeDate)} onChange={(e) => setForm({ ...form, closeDate: e.target.value || null })} className={inputClasses} />
          </Field>
        </div>
      )}
    </div>
  );
}

/* ── Notes ──────────────────────────────────────────────────────────── */

function NotesBlock({
  opp,
  notes,
  onChanged,
}: {
  opp: SalesOpportunity;
  notes: SalesNote[];
  onChanged: () => void;
}) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"call" | "discovery" | "internal">("internal");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/opportunities/${opp.id}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: body.trim(), kind }),
      });
      if (res.ok) {
        setBody("");
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Notiz löschen?")) return;
    const res = await fetch(`/api/admin/sales/notes/${id}`, { method: "DELETE" });
    if (res.ok) onChanged();
  };

  return (
    <Section title="Notizen">
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={`${selectClasses} w-auto`}>
            <option value="internal">Interne Notiz</option>
            <option value="call">Telefonnotiz</option>
            <option value="discovery">Bedarfsgespräch</option>
          </select>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Was ist neu? Beobachtungen, Zitate, Verabredungen…"
          className={textareaClasses}
        />
        <div className="flex justify-end">
          <button onClick={add} disabled={busy || !body.trim()} className={buttonPrimary} style={{ backgroundColor: "#0091C2" }}>
            {busy ? "…" : "Notiz speichern"}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-sm text-white/40">Noch keine Notizen.</div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-white/45">
                <span>
                  <span className="uppercase tracking-wider">{n.kind}</span>
                  {n.authorName ? ` · ${n.authorName}` : ""} · {formatDateTimeDe(n.createdAt)}
                </span>
                <button onClick={() => remove(n.id)} className={buttonGhost}>Löschen</button>
              </div>
              <div className="whitespace-pre-wrap text-sm text-white/85">{n.body}</div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ── Objections ─────────────────────────────────────────────────────── */

function ObjectionsBlock({
  opp,
  objections,
  onChanged,
}: {
  opp: SalesOpportunity;
  objections: SalesObjection[];
  onChanged: () => void;
}) {
  const [type, setType] = useState<ObjectionType>("preis");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/opportunities/${opp.id}/objections`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, body: body.trim() }),
      });
      if (res.ok) {
        setBody("");
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const resolve = async (o: SalesObjection) => {
    const resolution = prompt("Wie wurde der Einwand behandelt?", o.resolution ?? "");
    if (!resolution) return;
    const res = await fetch(`/api/admin/sales/objections/${o.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resolution }),
    });
    if (res.ok) onChanged();
  };

  return (
    <Section title="Einwände">
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr_auto]">
        <select value={type} onChange={(e) => setType(e.target.value as ObjectionType)} className={selectClasses}>
          {(Object.keys(OBJECTION_TYPE_LABEL) as ObjectionType[]).map((t) => (
            <option key={t} value={t}>{OBJECTION_TYPE_LABEL[t]}</option>
          ))}
        </select>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Einwand notieren…" className={inputClasses} />
        <button onClick={add} disabled={busy || !body.trim()} className={buttonSecondary}>Hinzufügen</button>
      </div>

      {objections.length === 0 ? (
        <div className="text-sm text-white/40">Keine Einwände dokumentiert.</div>
      ) : (
        <ul className="space-y-2">
          {objections.map((o) => (
            <li key={o.id} className="rounded-xl border border-white/[0.05] bg-black/20 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill color="#F97316">{OBJECTION_TYPE_LABEL[o.type]}</Pill>
                  <span className="text-white/85">{o.body}</span>
                </div>
                {o.resolvedAt ? (
                  <Pill color="#22C55E">Gelöst</Pill>
                ) : (
                  <button onClick={() => resolve(o)} className={buttonGhost}>Als gelöst markieren</button>
                )}
              </div>
              {o.resolution && (
                <div className="mt-1 text-[11px] text-white/50">Lösung: {o.resolution}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ── Solution ───────────────────────────────────────────────────────── */

interface SolutionForm {
  ziele: string;
  scope_in: string;
  scope_out: string;
  meilensteine: string;
  investitionRange: string;
  investitionModell: string;
  zahlungsplan: string;
  challenges: string;
}

function toSolutionForm(solution: SalesSolution | null): SolutionForm {
  const s = (solution?.structured ?? {}) as Record<string, any>;
  const c = (solution?.challengeMode ?? {}) as Record<string, any>;
  const invest = (s.investition ?? {}) as Record<string, any>;
  const range = (invest.range ?? {}) as Record<string, any>;
  return {
    ziele: joinArray(s.ziele),
    scope_in: joinArray(s.scope_in),
    scope_out: joinArray(s.scope_out),
    meilensteine: joinArray((s.meilensteine ?? []).map((m: any) => (typeof m === "string" ? m : `${m.name ?? ""}${m.zeitraum ? " — " + m.zeitraum : ""}`))),
    investitionRange: range.min != null && range.max != null ? `${range.min} - ${range.max}` : "",
    investitionModell: invest.modell ?? "",
    zahlungsplan: joinArray((s.zahlungsplan ?? []).map((z: any) => (typeof z === "string" ? z : `${z.betrag ?? ""} - ${z.bedingung ?? ""}`))),
    challenges: joinArray(c.geprueft),
  };
}

function fromSolutionForm(form: SolutionForm): { structured: Record<string, any>; challengeMode: Record<string, any> } {
  return {
    structured: {
      ziele: splitLines(form.ziele),
      scope_in: splitLines(form.scope_in),
      scope_out: splitLines(form.scope_out),
      meilensteine: splitLines(form.meilensteine).map((line) => {
        const parts = line.split(/—|-/);
        return { name: (parts[0] ?? "").trim(), zeitraum: (parts[1] ?? "").trim() };
      }),
      investition: {
        range: parseRange(form.investitionRange),
        modell: form.investitionModell || null,
      },
      zahlungsplan: splitLines(form.zahlungsplan).map((line) => {
        const parts = line.split(/—|-/);
        return { betrag: (parts[0] ?? "").trim(), bedingung: (parts[1] ?? "").trim() };
      }),
    },
    challengeMode: {
      geprueft: splitLines(form.challenges),
    },
  };
}

function SolutionBlock({
  opp,
  solution,
  accent,
  onChanged,
}: {
  opp: SalesOpportunity;
  solution: SalesSolution | null;
  accent: string;
  onChanged: () => void;
}) {
  const [form, setForm] = useState<SolutionForm>(toSolutionForm(solution));
  const [gate, setGate] = useState<QualityGate | "">(solution?.qualityGate ?? "");
  const [gateNote, setGateNote] = useState(solution?.qualityGateNote ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(toSolutionForm(solution));
    setGate(solution?.qualityGate ?? "");
    setGateNote(solution?.qualityGateNote ?? "");
  }, [solution]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = fromSolutionForm(form);
      const res = await fetch(`/api/admin/sales/opportunities/${opp.id}/solution`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          qualityGate: gate || null,
          qualityGateNote: gateNote || null,
        }),
      });
      if (res.ok) {
        setMessage("Lösung gespeichert.");
        onChanged();
      } else {
        const t = await res.text();
        setMessage(t || "Speichern fehlgeschlagen.");
      }
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!solution) return;
    if (gate !== "angebotsreif") {
      alert("Nur mit Quality-Gate 'Angebotsreif' freigebbar.");
      return;
    }
    const res = await fetch(`/api/admin/sales/solutions/${solution.id}/approve`, { method: "POST" });
    if (res.ok) {
      setMessage("Lösung freigegeben.");
      onChanged();
    }
  };

  return (
    <Section
      title="Lösung & Leistungsumfang"
      actions={
        <div className="flex items-center gap-2">
          {solution?.approvedAt ? (
            <Pill color="#22C55E">Freigegeben · {formatDateTimeDe(solution.approvedAt)}</Pill>
          ) : (
            <Pill color="#F59E0B">Entwurf</Pill>
          )}
          <button onClick={save} disabled={saving} className={buttonSecondary}>{saving ? "…" : "Speichern"}</button>
          <button
            onClick={approve}
            disabled={!solution || Boolean(solution?.approvedAt) || gate !== "angebotsreif"}
            className={buttonPrimary}
            style={{ backgroundColor: accent }}
          >
            Freigeben
          </button>
        </div>
      }
    >
      {message && <div className="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/70">{message}</div>}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Field label="Ziele" hint="Eine Zeile pro Ziel."><textarea value={form.ziele} onChange={(e) => setForm({ ...form, ziele: e.target.value })} className={textareaClasses} /></Field>
        <Field label="Scope In" hint="Eine Zeile pro Leistung."><textarea value={form.scope_in} onChange={(e) => setForm({ ...form, scope_in: e.target.value })} className={textareaClasses} /></Field>
        <Field label="Scope Out" hint="Bewusst ausgeschlossen."><textarea value={form.scope_out} onChange={(e) => setForm({ ...form, scope_out: e.target.value })} className={textareaClasses} /></Field>
        <Field label="Meilensteine" hint='Format: "Name — Zeitraum".'><textarea value={form.meilensteine} onChange={(e) => setForm({ ...form, meilensteine: e.target.value })} className={textareaClasses} /></Field>
        <Field label="Investition Range" hint='Format: "min - max" (in EUR).'><input value={form.investitionRange} onChange={(e) => setForm({ ...form, investitionRange: e.target.value })} className={inputClasses} /></Field>
        <Field label="Investitionsmodell"><input value={form.investitionModell} onChange={(e) => setForm({ ...form, investitionModell: e.target.value })} className={inputClasses} placeholder="Festpreis / Retainer / T&M …" /></Field>
        <Field label="Zahlungsplan" hint='Format: "Betrag — Bedingung".'><textarea value={form.zahlungsplan} onChange={(e) => setForm({ ...form, zahlungsplan: e.target.value })} className={textareaClasses} /></Field>
        <Field label="Challenge-Mode: geprüfte Annahmen"><textarea value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} className={textareaClasses} /></Field>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Quality Gate">
          <select value={gate} onChange={(e) => setGate(e.target.value as QualityGate | "")} className={selectClasses}>
            <option value="">Noch offen</option>
            {(Object.keys(QUALITY_GATE_LABEL) as QualityGate[]).map((g) => (
              <option key={g} value={g}>{QUALITY_GATE_LABEL[g]}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Gate-Begründung">
            <textarea value={gateNote} onChange={(e) => setGateNote(e.target.value)} className={textareaClasses} />
          </Field>
        </div>
      </div>
    </Section>
  );
}

/* ── Proposals ──────────────────────────────────────────────────────── */

interface ProposalDetail extends SalesProposal {
  versions?: ProposalVersion[];
}

function ProposalsBlock({
  opp,
  proposals,
  solutionApproved,
  onChanged,
  accent,
}: {
  opp: SalesOpportunity;
  proposals: SalesProposal[];
  solutionApproved: boolean;
  onChanged: () => void;
  accent: string;
}) {
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [versionsById, setVersionsById] = useState<Record<string, ProposalVersion[]>>({});

  const createProposal = async () => {
    if (!solutionApproved) {
      alert("Erst wenn die Lösung freigegeben ist, kann ein Angebot erstellt werden.");
      return;
    }
    const title = prompt("Titel des Angebots?", `${opp.title} · Angebot`);
    if (!title) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/opportunities/${opp.id}/proposals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, brandContext: opp.brandContext }),
      });
      if (res.ok) onChanged();
      else {
        const t = await res.text();
        alert(t || "Anlegen fehlgeschlagen.");
      }
    } finally {
      setBusy(false);
    }
  };

  const loadVersions = async (proposalId: string) => {
    if (versionsById[proposalId]) return;
    const res = await fetch(`/api/admin/sales/proposals/${proposalId}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { proposal: SalesProposal; versions: ProposalVersion[] };
      setVersionsById((m) => ({ ...m, [proposalId]: data.versions }));
    }
  };

  const generateVersion = async (proposalId: string) => {
    const runId = prompt("ID des freigegebenen Angebots-Runs?");
    if (!runId) return;
    const res = await fetch(`/api/admin/sales/proposals/${proposalId}/versions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    if (res.ok) {
      setVersionsById((m) => ({ ...m, [proposalId]: [] }));
      onChanged();
    } else {
      alert("Version fehlgeschlagen. Ist der Run freigegeben?");
    }
  };

  const approveVersion = async (versionId: string) => {
    const res = await fetch(`/api/admin/sales/proposal-versions/${versionId}/approve`, { method: "POST" });
    if (res.ok) {
      setVersionsById({});
      onChanged();
    }
  };

  const sendVersion = async (versionId: string) => {
    if (!confirm("Angebot als versendet markieren? Es werden Follow-ups geplant.")) return;
    const res = await fetch(`/api/admin/sales/proposal-versions/${versionId}/send`, { method: "POST" });
    if (res.ok) {
      setVersionsById({});
      onChanged();
    }
  };

  return (
    <Section
      title="Angebote"
      actions={
        <button
          onClick={createProposal}
          disabled={busy}
          className={buttonPrimary}
          style={{ backgroundColor: solutionApproved ? accent : "#4B5563", opacity: solutionApproved ? 1 : 0.7 }}
        >
          + Neues Angebot
        </button>
      }
    >
      {!solutionApproved && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Angebote sind erst nach freigegebener Lösung erstellbar (Proposal Gate).
        </div>
      )}

      {proposals.length === 0 ? (
        <EmptyState title="Noch kein Angebot." />
      ) : (
        <ul className="space-y-2">
          {proposals.map((p) => {
            const expanded = expandedId === p.id;
            const versions = versionsById[p.id] ?? [];
            return (
              <li key={p.id} className="rounded-xl border border-white/[0.06] bg-black/20">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(expanded ? null : p.id);
                    if (!expanded) void loadVersions(p.id);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      {p.title}
                      <Pill color="#0091C2">{PROPOSAL_STATUS_LABEL[p.status]}</Pill>
                    </div>
                    <div className="text-[11px] text-white/45">
                      v{p.currentVersionNumber ?? "—"} · {formatEuroFromCents(p.totalCents)} · {p.sentAt ? `Gesendet ${formatDateTimeDe(p.sentAt)}` : "Noch nicht versendet"}
                    </div>
                  </div>
                  <span className="text-white/40">{expanded ? "▲" : "▼"}</span>
                </button>
                {expanded && (
                  <div className="border-t border-white/[0.05] px-4 py-3">
                    <div className="mb-3 flex items-center justify-end gap-2">
                      <button onClick={() => generateVersion(p.id)} className={buttonSecondary}>+ Version aus Run</button>
                    </div>
                    {versions.length === 0 ? (
                      <div className="text-sm text-white/45">Noch keine Versionen. Erzeuge eine Version aus einem freigegebenen Angebots-Run.</div>
                    ) : (
                      <ul className="space-y-2">
                        {versions.map((v) => (
                          <li key={v.id} className="rounded-lg border border-white/[0.05] bg-black/30 p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-white/85">
                                Version {v.version}
                                {v.approvedAt && <Pill color="#22C55E">Freigegeben</Pill>}
                                {v.sentAt && <Pill color="#0091C2">Gesendet</Pill>}
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/api/admin/sales/proposal-versions/${v.id}/pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={buttonGhost}
                                >
                                  PDF ansehen
                                </a>
                                {!v.approvedAt && (
                                  <button onClick={() => approveVersion(v.id)} className={buttonSecondary}>Freigeben</button>
                                )}
                                {v.approvedAt && !v.sentAt && (
                                  <button onClick={() => sendVersion(v.id)} className={buttonPrimary} style={{ backgroundColor: "#22C55E" }}>
                                    Als versendet markieren
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="mt-1 text-[11px] text-white/45">
                              Erzeugt {formatDateTimeDe(v.generatedAt)}
                              {v.solutionScopeVersion ? ` · Solution v${v.solutionScopeVersion}` : ""}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/* ── Won/Lost ───────────────────────────────────────────────────────── */

function WonLostBlock({ opp, onChanged, accent }: { opp: SalesOpportunity; onChanged: () => void; accent: string }) {
  const [reason, setReason] = useState<LostReason>("preis");
  const [notes, setNotes] = useState("");
  const [learning, setLearning] = useState(opp.learning ?? "");
  const [busy, setBusy] = useState(false);

  const isClosed = ["gewonnen", "verloren", "zurueckgestellt"].includes(opp.status);

  const winIt = async () => {
    if (!confirm("Opportunity als gewonnen markieren?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/sales/opportunities/${opp.id}/won`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: opp.version, learning: learning || undefined }),
    });
    setBusy(false);
    if (res.ok) onChanged();
    else alert("Fehler.");
  };

  const loseIt = async () => {
    if (!notes.trim()) {
      alert("Bitte kurze Verlustbegründung angeben.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/sales/opportunities/${opp.id}/lost`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: opp.version, reason, notes, learning: learning || undefined }),
    });
    setBusy(false);
    if (res.ok) onChanged();
    else alert("Fehler.");
  };

  const deferIt = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/sales/opportunities/${opp.id}/defer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: opp.version }),
    });
    setBusy(false);
    if (res.ok) onChanged();
    else alert("Fehler.");
  };

  return (
    <Section title="Abschluss">
      {isClosed ? (
        <div className="text-sm text-white/70">
          Status: <StatusPill value={opp.status} />
          {opp.wonAt && <span className="ml-2 text-[11px] text-white/45">Gewonnen {formatDateTimeDe(opp.wonAt)}</span>}
          {opp.lostAt && <span className="ml-2 text-[11px] text-white/45">Verloren {formatDateTimeDe(opp.lostAt)}</span>}
          {opp.deferredAt && <span className="ml-2 text-[11px] text-white/45">Zurückgestellt {formatDateTimeDe(opp.deferredAt)}</span>}
          {opp.lostNotes && <div className="mt-2 text-xs text-white/60">Begründung: {opp.lostNotes}</div>}
          {opp.learning && <div className="mt-2 text-xs text-white/60">Learning: {opp.learning}</div>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Verlustgrund">
              <select value={reason} onChange={(e) => setReason(e.target.value as LostReason)} className={selectClasses}>
                {(Object.keys(LOST_REASON_LABEL) as LostReason[]).map((r) => (
                  <option key={r} value={r}>{LOST_REASON_LABEL[r]}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Details zur Entscheidung">
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClasses} placeholder="Was war der Kern der Entscheidung?" />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Learning für nächste Ansprache">
                <textarea value={learning} onChange={(e) => setLearning(e.target.value)} className={textareaClasses} />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button onClick={deferIt} disabled={busy} className={buttonSecondary}>Zurückstellen</button>
            <DangerButton onClick={loseIt} disabled={busy}>Als verloren markieren</DangerButton>
            <button onClick={winIt} disabled={busy} className={buttonPrimary} style={{ backgroundColor: "#22C55E" }}>Gewonnen</button>
          </div>
        </>
      )}
    </Section>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function joinArray(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.filter(Boolean).join("\n");
}
function splitLines(value: string): string[] {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}
function parseRange(value: string): { min: number; max: number } | null {
  const m = value.match(/(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*)/);
  if (!m) return null;
  const parse = (v: string) => Number(v.replace(",", "."));
  const min = parse(m[1]);
  const max = parse(m[2]);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min, max };
}
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
