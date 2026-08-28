"use client";

/**
 * AI-Panel.
 *
 * Zeigt für die gewählte Firma / Opportunity alle sieben Workflows als
 * ausführbare Karten. Rechts eine chronologische Liste aller Runs mit
 * Review-Actions (Freigabe / Ablehnung).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BRAND_CONTEXT_LABEL,
  formatDateTimeDe,
  type BrandContext,
  type SalesAiRun,
  type SalesCompany,
  type SalesContact,
  type SalesOpportunity,
  type SalesPromptKey,
  type RunStatus,
} from "./shared";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  Field,
  inputClasses,
  Pill,
  Section,
  selectClasses,
  textareaClasses,
} from "./HelperUI";

interface Props {
  company: SalesCompany;
  contacts: SalesContact[];
  opportunities: SalesOpportunity[];
  selectedOpportunityId: string | null;
  onSelectOpportunity: (id: string) => void;
  accent: string;
  onChanged: () => void;
}

const WORKFLOWS: {
  key: SalesPromptKey;
  label: string;
  hint: string;
  scope: "company" | "opportunity" | "lead";
}[] = [
  { key: "LEAD_RESEARCH", label: "Lead Research", hint: "Findet neue Zielkunden anhand ICP.", scope: "lead" },
  { key: "PRE_CALL", label: "Pre-Call-Intelligence", hint: "Kurzbriefing vor dem Erstanruf.", scope: "company" },
  { key: "POST_CALL", label: "Post-Call-Tiefenanalyse", hint: "Auswertung nach Erstgespräch.", scope: "opportunity" },
  { key: "CLIENT_PREVIEW", label: "Kundenvorschau", hint: "Übersichts-Storytelling für den Kunden.", scope: "opportunity" },
  { key: "DISCOVERY_PREP", label: "Discovery-Leitfaden", hint: "Fragenkatalog fürs Bedarfsgespräch.", scope: "opportunity" },
  { key: "SOLUTION_SCOPE", label: "Lösung & Umfang", hint: "Zieht die Solution-Struktur.", scope: "opportunity" },
  { key: "PROPOSAL", label: "Angebot generieren", hint: "Erst nach freigegebener Lösung.", scope: "opportunity" },
];

export default function AiPanel({
  company,
  contacts,
  opportunities,
  selectedOpportunityId,
  onSelectOpportunity,
  accent,
  onChanged,
}: Props) {
  const [runs, setRuns] = useState<SalesAiRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<SalesPromptKey | null>(null);
  const [runVars, setRunVars] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("companyId", company.id);
    if (selectedOpportunityId) params.set("opportunityId", selectedOpportunityId);
    try {
      const res = await fetch(`/api/admin/sales/ai/runs?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { runs: SalesAiRun[] };
        setRuns(data.runs);
      }
    } finally {
      setLoading(false);
    }
  }, [company.id, selectedOpportunityId]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const runWorkflow = async (wf: typeof WORKFLOWS[number]) => {
    setBusy(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { ...runVars };
      let path = "";
      switch (wf.key) {
        case "LEAD_RESEARCH":
          path = "/api/admin/sales/ai/workflows/lead-research";
          break;
        case "PRE_CALL":
          path = "/api/admin/sales/ai/workflows/pre-call";
          body.companyId = company.id;
          body.observations = runVars.observations ?? "";
          break;
        case "POST_CALL":
          if (!selectedOpportunityId) throw new Error("Bitte Opportunity wählen.");
          path = "/api/admin/sales/ai/workflows/post-call";
          body.opportunityId = selectedOpportunityId;
          body.gespraechsNotizen = runVars.gespraechsNotizen ?? "";
          break;
        case "CLIENT_PREVIEW":
          if (!selectedOpportunityId) throw new Error("Bitte Opportunity wählen.");
          path = "/api/admin/sales/ai/workflows/client-preview";
          body.opportunityId = selectedOpportunityId;
          try {
            body.postCallJson = runVars.postCallJson ? JSON.parse(runVars.postCallJson) : {};
          } catch {
            body.postCallJson = {};
          }
          body.folgetermin = runVars.folgetermin ?? "";
          break;
        case "DISCOVERY_PREP":
          if (!selectedOpportunityId) throw new Error("Bitte Opportunity wählen.");
          path = "/api/admin/sales/ai/workflows/discovery-prep";
          body.opportunityId = selectedOpportunityId;
          break;
        case "SOLUTION_SCOPE":
          if (!selectedOpportunityId) throw new Error("Bitte Opportunity wählen.");
          path = "/api/admin/sales/ai/workflows/solution-scope";
          body.opportunityId = selectedOpportunityId;
          body.bestaetigteAnforderungen = runVars.bestaetigteAnforderungen ?? "";
          body.eigeneIdeen = runVars.eigeneIdeen ?? "";
          break;
        case "PROPOSAL":
          if (!selectedOpportunityId) throw new Error("Bitte Opportunity wählen.");
          path = "/api/admin/sales/ai/workflows/proposal";
          body.opportunityId = selectedOpportunityId;
          body.projectName = runVars.projectName ?? "";
          body.approvedPrice = runVars.approvedPrice ?? "";
          body.approvedPaymentPlan = runVars.approvedPaymentPlan ?? "";
          body.approvedProjectTimeframe = runVars.approvedProjectTimeframe ?? "";
          body.offerValidUntil = runVars.offerValidUntil ?? "";
          body.customerResponsibilities = runVars.customerResponsibilities ?? "";
          break;
      }
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        setMessage(t || "Workflow fehlgeschlagen.");
        return;
      }
      const data = await res.json();
      setMessage(`Workflow abgeschlossen · Status ${data.run?.status ?? "?"}`);
      setSelectedKey(null);
      setRunVars({});
      await loadRuns();
      onChanged();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reviewRun = async (run: SalesAiRun, status: RunStatus, note?: string) => {
    const res = await fetch(`/api/admin/sales/ai/runs/${run.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    if (res.ok) {
      await loadRuns();
      onChanged();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
      <Section title="KI-Workflows">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-white/45">Opportunity</span>
          <select
            value={selectedOpportunityId ?? ""}
            onChange={(e) => onSelectOpportunity(e.target.value)}
            className={`${selectClasses} max-w-xs`}
          >
            <option value="">— keine —</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
        </div>
        {message && <div className="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/70">{message}</div>}

        <ul className="space-y-2">
          {WORKFLOWS.map((wf) => {
            const disabled = wf.scope === "opportunity" && !selectedOpportunityId;
            const active = selectedKey === wf.key;
            return (
              <li key={wf.key}>
                <div className={`rounded-xl border border-white/[0.06] bg-black/20 p-3 ${disabled ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-white/90">{wf.label}</div>
                      <div className="text-[11px] text-white/45">{wf.hint}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedKey(active ? null : wf.key);
                        setRunVars({});
                      }}
                      disabled={disabled}
                      className={buttonSecondary}
                    >
                      {active ? "Schließen" : "Vorbereiten"}
                    </button>
                  </div>
                  {active && (
                    <div className="mt-3 space-y-2">
                      <WorkflowFields wfKey={wf.key} vars={runVars} setVars={setRunVars} />
                      <div className="flex justify-end">
                        <button
                          onClick={() => runWorkflow(wf)}
                          disabled={busy}
                          className={buttonPrimary}
                          style={{ backgroundColor: accent }}
                        >
                          {busy ? "…" : "Ausführen"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={`Runs (${runs.length})`}>
        {loading ? (
          <div className="text-sm text-white/45">Laden…</div>
        ) : runs.length === 0 ? (
          <div className="text-sm text-white/45">Noch keine Runs für diese Firma.</div>
        ) : (
          <ul className="space-y-2">
            {runs.map((r) => {
              const isOpen = openRunId === r.id;
              return (
                <li key={r.id} className="rounded-xl border border-white/[0.06] bg-black/20">
                  <button
                    type="button"
                    onClick={() => setOpenRunId(isOpen ? null : r.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        {r.promptKey}
                        <Pill color={statusColor(r.status)}>{r.status}</Pill>
                      </div>
                      <div className="text-[11px] text-white/45">
                        {r.model} · {formatDateTimeDe(r.finishedAt ?? r.createdAt)}
                        {r.tokensIn && r.tokensOut ? ` · ${r.tokensIn}/${r.tokensOut} tok` : ""}
                      </div>
                    </div>
                    <span className="text-white/40">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/[0.05] p-3">
                      {r.error && (
                        <div className="mb-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                          Fehler: {r.error}
                        </div>
                      )}
                      <pre className="max-h-72 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-relaxed text-white/70">
{JSON.stringify(r.output ?? r.outputText ?? {}, null, 2)}
                      </pre>
                      {r.status === "REVIEW_REQUIRED" && (
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button onClick={() => reviewRun(r, "REJECTED", prompt("Ablehnungsgrund?") ?? undefined)} className={buttonSecondary}>
                            Ablehnen
                          </button>
                          <button onClick={() => reviewRun(r, "APPROVED")} className={buttonPrimary} style={{ backgroundColor: "#22C55E" }}>
                            Freigeben
                          </button>
                        </div>
                      )}
                      {r.reviewNote && (
                        <div className="mt-2 text-[11px] text-white/50">Review-Notiz: {r.reviewNote}</div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function WorkflowFields({
  wfKey,
  vars,
  setVars,
}: {
  wfKey: SalesPromptKey;
  vars: Record<string, string>;
  setVars: (v: Record<string, string>) => void;
}) {
  const set = (k: string, v: string) => setVars({ ...vars, [k]: v });

  switch (wfKey) {
    case "LEAD_RESEARCH":
      return (
        <>
          <Field label="Region" hint="Standardregion wird verwendet, wenn leer.">
            <input value={vars.region ?? ""} onChange={(e) => set("region", e.target.value)} className={inputClasses} placeholder="Unna, Kreis Unna …" />
          </Field>
          <Field label="Zusatz-Kontext">
            <textarea value={vars.additional ?? ""} onChange={(e) => set("additional", e.target.value)} className={textareaClasses} placeholder="Bekannte Kunden ausschließen, Region einschränken …" />
          </Field>
        </>
      );
    case "PRE_CALL":
      return (
        <Field label="Beobachtungen (optional)">
          <textarea value={vars.observations ?? ""} onChange={(e) => set("observations", e.target.value)} className={textareaClasses} placeholder="Was ist beim Recherche-Blick aufgefallen?" />
        </Field>
      );
    case "POST_CALL":
      return (
        <Field label="Gesprächsnotizen (Pflicht)">
          <textarea value={vars.gespraechsNotizen ?? ""} onChange={(e) => set("gespraechsNotizen", e.target.value)} className={textareaClasses} placeholder="Was wurde besprochen? Zitate willkommen." />
        </Field>
      );
    case "CLIENT_PREVIEW":
      return (
        <>
          <Field label="Post-Call-JSON (aus Run)">
            <textarea value={vars.postCallJson ?? ""} onChange={(e) => set("postCallJson", e.target.value)} className={textareaClasses} placeholder='{"themen":[...],"probleme":[...]}' />
          </Field>
          <Field label="Folgetermin (optional)">
            <input value={vars.folgetermin ?? ""} onChange={(e) => set("folgetermin", e.target.value)} className={inputClasses} placeholder="Mi 15:00 vor Ort" />
          </Field>
        </>
      );
    case "DISCOVERY_PREP":
      return <div className="text-[11px] text-white/45">Nutzt die neuesten Notizen automatisch.</div>;
    case "SOLUTION_SCOPE":
      return (
        <>
          <Field label="Bestätigte Anforderungen">
            <textarea value={vars.bestaetigteAnforderungen ?? ""} onChange={(e) => set("bestaetigteAnforderungen", e.target.value)} className={textareaClasses} />
          </Field>
          <Field label="Eigene Ideen / Optionen">
            <textarea value={vars.eigeneIdeen ?? ""} onChange={(e) => set("eigeneIdeen", e.target.value)} className={textareaClasses} />
          </Field>
        </>
      );
    case "PROPOSAL":
      return (
        <>
          <Field label="Projektname">
            <input value={vars.projectName ?? ""} onChange={(e) => set("projectName", e.target.value)} className={inputClasses} placeholder="z. B. Digitalisierungspaket Q3" />
          </Field>
          <Field label="Freigegebener Preis">
            <input value={vars.approvedPrice ?? ""} onChange={(e) => set("approvedPrice", e.target.value)} className={inputClasses} placeholder="24.000 EUR Einmalig" />
          </Field>
          <Field label="Zahlungsplan">
            <textarea value={vars.approvedPaymentPlan ?? ""} onChange={(e) => set("approvedPaymentPlan", e.target.value)} className={textareaClasses} placeholder="50% bei Auftrag, 50% bei Livegang" />
          </Field>
          <Field label="Zeitrahmen">
            <input value={vars.approvedProjectTimeframe ?? ""} onChange={(e) => set("approvedProjectTimeframe", e.target.value)} className={inputClasses} placeholder="8 Wochen ab Kick-off" />
          </Field>
          <Field label="Gültig bis">
            <input value={vars.offerValidUntil ?? ""} onChange={(e) => set("offerValidUntil", e.target.value)} className={inputClasses} placeholder="31.10.2026" />
          </Field>
          <Field label="Kunden-Verantwortlichkeiten">
            <textarea value={vars.customerResponsibilities ?? ""} onChange={(e) => set("customerResponsibilities", e.target.value)} className={textareaClasses} />
          </Field>
        </>
      );
  }
}

function statusColor(status: RunStatus): string {
  switch (status) {
    case "APPROVED":
      return "#22C55E";
    case "REJECTED":
      return "#EF4444";
    case "REVIEW_REQUIRED":
      return "#F59E0B";
    case "FAILED":
      return "#EF4444";
    case "SUPERSEDED":
      return "#6B7280";
    default:
      return "#0091C2";
  }
}
