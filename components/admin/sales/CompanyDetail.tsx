"use client";

/**
 * Firmen-Detail: Kopf, Kontakte, Aktivitäten, Notizen, Opportunities,
 * Solution, Angebote, AI-Panels. Alles ohne Sub-Routen (Single Page).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BRAND_CONTEXT_LABEL,
  CLASSIFICATION_LABEL,
  CONTACT_OUTCOME_LABEL,
  CONTACT_ROLE_LABEL,
  NEXT_ACTION_LABEL,
  SALES_STATUS_LABEL,
  formatDateTimeDe,
  formatEuroFromCents,
  type BrandContext,
  type ContactOutcome,
  type ContactRole,
  type NextAction,
  type SalesActivity,
  type SalesClassification,
  type SalesCompany,
  type SalesContact,
  type SalesOpportunity,
  type SalesStatus,
} from "./shared";
import {
  BrandChip,
  ClassificationBadge,
  DangerButton,
  Field,
  Pill,
  Section,
  StatusPill,
  buttonPrimary,
  buttonSecondary,
  buttonGhost,
  inputClasses,
  selectClasses,
  textareaClasses,
} from "./HelperUI";
import OpportunityPanel from "./OpportunityPanel";
import AiPanel from "./AiPanel";

interface CompanyDetailResponse {
  company: SalesCompany;
  contacts: SalesContact[];
  opportunities: SalesOpportunity[];
  activities: SalesActivity[];
}

type Tab =
  | "overview"
  | "contacts"
  | "opportunities"
  | "solution"
  | "proposals"
  | "ai"
  | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Übersicht" },
  { id: "contacts", label: "Kontakte" },
  { id: "opportunities", label: "Opportunities" },
  { id: "solution", label: "Lösung" },
  { id: "proposals", label: "Angebote" },
  { id: "ai", label: "KI-Analyse" },
  { id: "activity", label: "Historie" },
];

export default function CompanyDetail({
  companyId,
  initialOpportunityId,
  accent,
  onClose,
  onChanged,
}: {
  companyId: string;
  initialOpportunityId: string | null;
  accent: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<CompanyDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(initialOpportunityId ? "opportunities" : "overview");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(initialOpportunityId);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setData(null);
      try {
        const res = await fetch(`/api/admin/sales/companies/${companyId}`, { cache: "no-store" });
        if (!res.ok) {
          setError("Firma nicht gefunden.");
          return;
        }
        const parsed = (await res.json()) as CompanyDetailResponse;
        setData(parsed);
        if (!selectedOpportunityId && parsed.opportunities.length > 0) {
          setSelectedOpportunityId(parsed.opportunities[0].id);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [companyId, selectedOpportunityId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error}
        <div className="mt-3">
          <button onClick={onClose} className={buttonSecondary}>Zurück</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/50">
        Lade Firma…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CompanyHeader
        company={data.company}
        accent={accent}
        onSaved={() => {
          void load(true);
          onChanged();
        }}
      />

      <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "bg-white/[0.08] text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab company={data.company} contacts={data.contacts} opportunities={data.opportunities} onChanged={() => void load(true)} />
      )}
      {tab === "contacts" && (
        <ContactsTab
          companyId={data.company.id}
          contacts={data.contacts}
          onChanged={() => void load(true)}
        />
      )}
      {tab === "opportunities" && (
        <OpportunitiesTab
          companyId={data.company.id}
          brandDefault={"nexcel"}
          opportunities={data.opportunities}
          selectedOpportunityId={selectedOpportunityId}
          onSelect={setSelectedOpportunityId}
          onChanged={() => {
            void load(true);
            onChanged();
          }}
          accent={accent}
        />
      )}
      {tab === "solution" && (
        <PerOpportunitySection
          opportunities={data.opportunities}
          selectedOpportunityId={selectedOpportunityId}
          onSelect={setSelectedOpportunityId}
          render={(oppId) => (
            <OpportunityPanel
              opportunityId={oppId}
              accent={accent}
              focus="solution"
              onChanged={() => {
                void load(true);
                onChanged();
              }}
            />
          )}
        />
      )}
      {tab === "proposals" && (
        <PerOpportunitySection
          opportunities={data.opportunities}
          selectedOpportunityId={selectedOpportunityId}
          onSelect={setSelectedOpportunityId}
          render={(oppId) => (
            <OpportunityPanel
              opportunityId={oppId}
              accent={accent}
              focus="proposals"
              onChanged={() => {
                void load(true);
                onChanged();
              }}
            />
          )}
        />
      )}
      {tab === "ai" && (
        <AiPanel
          company={data.company}
          contacts={data.contacts}
          opportunities={data.opportunities}
          selectedOpportunityId={selectedOpportunityId}
          onSelectOpportunity={setSelectedOpportunityId}
          accent={accent}
          onChanged={() => void load(true)}
        />
      )}
      {tab === "activity" && <ActivityTab activities={data.activities} />}
    </div>
  );
}

/* ── Header ─────────────────────────────────────────────────────────── */

function CompanyHeader({
  company,
  accent,
  onSaved,
}: {
  company: SalesCompany;
  accent: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SalesCompany>(company);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(company), [company]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sales/companies/${company.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: company.version,
          name: form.name,
          website: form.website,
          industry: form.industry,
          city: form.city,
          country: form.country,
          source: form.source,
          classification: form.classification,
          status: form.status,
          expectedValueCents: form.expectedValueCents,
          proposalValueCents: form.proposalValueCents,
          contactOutcome: form.contactOutcome,
          nextAction: form.nextAction,
          nextActionDueAt: form.nextActionDueAt,
          nextMeetingAt: form.nextMeetingAt,
          notes: form.notes,
          icpScore: form.icpScore,
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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ClassificationBadge value={form.classification} />
            <h1 className="text-xl font-semibold text-white">{form.name}</h1>
            <StatusPill value={form.status} />
          </div>
          <div className="mt-1 text-xs text-white/50">
            {form.industry ?? "Branche offen"}
            {form.city ? ` · ${form.city}` : ""}
            {form.website ? (
              <>
                {" · "}
                <a href={form.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Website ↗
                </a>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(company); }} className={buttonSecondary} type="button">Abbrechen</button>
              <button onClick={save} disabled={saving} className={buttonPrimary} style={{ backgroundColor: accent }} type="button">
                {saving ? "Speichere…" : "Speichern"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className={buttonSecondary} type="button">Bearbeiten</button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
      )}

      {editing ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Firmenname">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
          </Field>
          <Field label="Website">
            <input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClasses} />
          </Field>
          <Field label="Branche">
            <input value={form.industry ?? ""} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputClasses} />
          </Field>
          <Field label="Ort">
            <input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClasses} />
          </Field>
          <Field label="Land">
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClasses} />
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
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SalesStatus })} className={selectClasses}>
              {(Object.keys(SALES_STATUS_LABEL) as SalesStatus[]).map((s) => (
                <option key={s} value={s}>{SALES_STATUS_LABEL[s]}</option>
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
            <input
              type="datetime-local"
              value={toLocalInput(form.nextActionDueAt)}
              onChange={(e) => setForm({ ...form, nextActionDueAt: fromLocalInput(e.target.value) })}
              className={inputClasses}
            />
          </Field>
          <Field label="Erwartet (Cent)">
            <input
              type="number"
              value={form.expectedValueCents ?? ""}
              onChange={(e) => setForm({ ...form, expectedValueCents: e.target.value ? Number(e.target.value) : null })}
              className={inputClasses}
            />
          </Field>
          <Field label="Angebotswert (Cent)">
            <input
              type="number"
              value={form.proposalValueCents ?? ""}
              onChange={(e) => setForm({ ...form, proposalValueCents: e.target.value ? Number(e.target.value) : null })}
              className={inputClasses}
            />
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
          <Field label="Nächstes Meeting">
            <input
              type="datetime-local"
              value={toLocalInput(form.nextMeetingAt)}
              onChange={(e) => setForm({ ...form, nextMeetingAt: fromLocalInput(e.target.value) })}
              className={inputClasses}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Notizen">
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={textareaClasses} />
            </Field>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Snapshot label="Nächste Aktion" value={form.nextAction ? NEXT_ACTION_LABEL[form.nextAction] : "—"} />
          <Snapshot label="Fällig" value={formatDateTimeDe(form.nextActionDueAt)} />
          <Snapshot label="Erwartet" value={formatEuroFromCents(form.expectedValueCents)} />
          <Snapshot label="Angebot" value={formatEuroFromCents(form.proposalValueCents)} />
          <Snapshot label="Letzter Kontakt" value={formatDateTimeDe(form.lastContactAt)} />
          <Snapshot label="Nächstes Meeting" value={formatDateTimeDe(form.nextMeetingAt)} />
          <Snapshot label="Kontakt-Ergebnis" value={form.contactOutcome ? CONTACT_OUTCOME_LABEL[form.contactOutcome] : "—"} />
          <Snapshot label="ICP-Score" value={form.icpScore != null ? `${form.icpScore}/100` : "—"} />
        </div>
      )}
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-sm text-white/90">{value}</div>
    </div>
  );
}

/* ── Tabs ───────────────────────────────────────────────────────────── */

function OverviewTab({
  company,
  contacts,
  opportunities,
  onChanged,
}: {
  company: SalesCompany;
  contacts: SalesContact[];
  opportunities: SalesOpportunity[];
  onChanged: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Section title="Notizen">
        <div className="whitespace-pre-wrap text-sm text-white/80">{company.notes || <span className="text-white/40">Noch keine Notizen.</span>}</div>
      </Section>
      <Section title={`Kontakte (${contacts.length})`}>
        {contacts.length === 0 ? (
          <div className="text-sm text-white/40">Noch keine Kontakte. Wechsle in den Tab „Kontakte“, um welche anzulegen.</div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {contacts.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-white/90">
                    {[c.firstName, c.lastName].filter(Boolean).join(" ") || "Kontakt"}
                    {c.isPrimary && <Pill color="#0091C2">Hauptkontakt</Pill>}
                  </div>
                  <div className="text-[11px] text-white/45">
                    {[c.position, CONTACT_ROLE_LABEL[c.role]].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="text-[11px] text-white/50">
                  {c.email || c.phone || ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title={`Offene Opportunities (${opportunities.length})`}>
        {opportunities.length === 0 ? (
          <div className="text-sm text-white/40">Noch keine Opportunity. Lege eine im Tab „Opportunities“ an.</div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {opportunities.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <div className="truncate">
                  <div className="truncate text-white/90">{o.title}</div>
                  <div className="text-[11px] text-white/45">
                    <BrandChip value={o.brandContext} /> · Erwartet {formatEuroFromCents(o.expectedValueCents)}
                  </div>
                </div>
                <StatusPill value={o.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function ContactsTab({
  companyId,
  contacts,
  onChanged,
}: {
  companyId: string;
  contacts: SalesContact[];
  onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<SalesContact>>({
    role: "unbekannt",
    isPrimary: contacts.length === 0,
  });
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/companies/${companyId}/contacts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setCreating(false);
        setDraft({ role: "unbekannt", isPrimary: false });
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Kontakt entfernen?")) return;
    const res = await fetch(`/api/admin/sales/contacts/${id}`, { method: "DELETE" });
    if (res.ok) onChanged();
  };

  const setPrimary = async (c: SalesContact) => {
    const res = await fetch(`/api/admin/sales/contacts/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isPrimary: true }),
    });
    if (res.ok) onChanged();
  };

  return (
    <Section
      title="Kontakte"
      actions={
        <button onClick={() => setCreating(true)} className={buttonSecondary} type="button">+ Neuer Kontakt</button>
      }
    >
      {creating && (
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-black/30 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Vorname">
              <input value={draft.firstName ?? ""} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} className={inputClasses} />
            </Field>
            <Field label="Nachname">
              <input value={draft.lastName ?? ""} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} className={inputClasses} />
            </Field>
            <Field label="Position">
              <input value={draft.position ?? ""} onChange={(e) => setDraft({ ...draft, position: e.target.value })} className={inputClasses} />
            </Field>
            <Field label="Rolle">
              <select value={draft.role ?? "unbekannt"} onChange={(e) => setDraft({ ...draft, role: e.target.value as ContactRole })} className={selectClasses}>
                {(Object.keys(CONTACT_ROLE_LABEL) as ContactRole[]).map((r) => (
                  <option key={r} value={r}>{CONTACT_ROLE_LABEL[r]}</option>
                ))}
              </select>
            </Field>
            <Field label="E-Mail">
              <input value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputClasses} />
            </Field>
            <Field label="Telefon">
              <input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputClasses} />
            </Field>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={draft.isPrimary ?? false} onChange={(e) => setDraft({ ...draft, isPrimary: e.target.checked })} />
                Als Hauptkontakt markieren
              </label>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notizen">
                <textarea value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={textareaClasses} />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className={buttonSecondary}>Abbrechen</button>
            <button onClick={create} disabled={busy} className={buttonPrimary} style={{ backgroundColor: "#0091C2" }}>
              {busy ? "…" : "Anlegen"}
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="text-sm text-white/40">Noch keine Kontakte hinterlegt.</div>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-white/90">
                    {[c.firstName, c.lastName].filter(Boolean).join(" ") || "Kontakt"}
                  </span>
                  {c.isPrimary && <Pill color="#0091C2">Hauptkontakt</Pill>}
                  <Pill color="#A78BFA">{CONTACT_ROLE_LABEL[c.role]}</Pill>
                </div>
                <div className="mt-0.5 text-[11px] text-white/50">
                  {[c.position, c.email, c.phone].filter(Boolean).join(" · ")}
                </div>
                {c.notes && <div className="mt-1 text-[11px] text-white/50">{c.notes}</div>}
              </div>
              <div className="flex items-center gap-1">
                {!c.isPrimary && (
                  <button onClick={() => setPrimary(c)} className={buttonGhost}>Als Hauptkontakt</button>
                )}
                <button onClick={() => remove(c.id)} className={buttonGhost}>Entfernen</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function OpportunitiesTab({
  companyId,
  brandDefault,
  opportunities,
  selectedOpportunityId,
  onSelect,
  onChanged,
  accent,
}: {
  companyId: string;
  brandDefault: BrandContext;
  opportunities: SalesOpportunity[];
  selectedOpportunityId: string | null;
  onSelect: (id: string) => void;
  onChanged: () => void;
  accent: string;
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState<BrandContext>(brandDefault);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/companies/${companyId}/opportunities`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), brandContext: brand }),
      });
      if (res.ok) {
        const data = (await res.json()) as { opportunity: SalesOpportunity };
        setCreating(false);
        setTitle("");
        onSelect(data.opportunity.id);
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <Section
        title={`Opportunities (${opportunities.length})`}
        actions={<button onClick={() => setCreating(true)} className={buttonSecondary}>+ Neu</button>}
      >
        {creating && (
          <div className="mb-3 rounded-xl border border-white/[0.06] bg-black/30 p-3">
            <Field label="Titel">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} placeholder="z. B. Rollout DACH" />
            </Field>
            <div className="mt-2">
              <Field label="Marke">
                <select value={brand} onChange={(e) => setBrand(e.target.value as BrandContext)} className={selectClasses}>
                  <option value="nexcel">NEXCEL AI</option>
                  <option value="agiworks">AGI Works</option>
                  <option value="both">Beide</option>
                </select>
              </Field>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className={buttonSecondary}>Abbrechen</button>
              <button onClick={create} disabled={busy} className={buttonPrimary} style={{ backgroundColor: accent }}>
                {busy ? "…" : "Anlegen"}
              </button>
            </div>
          </div>
        )}
        {opportunities.length === 0 ? (
          <div className="text-sm text-white/40">Noch keine Opportunity.</div>
        ) : (
          <ul className="space-y-1">
            {opportunities.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onSelect(o.id)}
                  className={`w-full rounded-lg border px-2 py-2 text-left text-sm transition ${
                    selectedOpportunityId === o.id
                      ? "border-white/[0.14] bg-white/[0.06] text-white"
                      : "border-transparent text-white/70 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BrandChip value={o.brandContext} />
                    <span className="truncate">{o.title}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/40">
                    <StatusPill value={o.status} />
                    <span>{formatEuroFromCents(o.expectedValueCents)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div>
        {selectedOpportunityId ? (
          <OpportunityPanel
            opportunityId={selectedOpportunityId}
            accent={accent}
            focus="overview"
            onChanged={onChanged}
          />
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/45">
            Wähle eine Opportunity oder lege eine neue an.
          </div>
        )}
      </div>
    </div>
  );
}

function PerOpportunitySection({
  opportunities,
  selectedOpportunityId,
  onSelect,
  render,
}: {
  opportunities: SalesOpportunity[];
  selectedOpportunityId: string | null;
  onSelect: (id: string) => void;
  render: (oppId: string) => JSX.Element;
}) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/50">
        Keine Opportunity vorhanden — Lege im Tab „Opportunities“ zuerst eine an.
      </div>
    );
  }
  const activeId = selectedOpportunityId ?? opportunities[0].id;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-white/45">Opportunity</span>
        <select value={activeId} onChange={(e) => onSelect(e.target.value)} className={`${selectClasses} max-w-xs`}>
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
      </div>
      {render(activeId)}
    </div>
  );
}

function ActivityTab({ activities }: { activities: SalesActivity[] }) {
  if (activities.length === 0) {
    return (
      <Section title="Historie">
        <div className="text-sm text-white/45">Noch keine Aktivitäten.</div>
      </Section>
    );
  }
  return (
    <Section title="Historie">
      <ul className="space-y-3">
        {activities.map((a) => (
          <li key={a.id} className="flex items-start gap-3 text-sm">
            <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-white/40" />
            <div className="min-w-0">
              <div className="text-white/85">{a.summary}</div>
              <div className="text-[11px] text-white/40">
                {formatDateTimeDe(a.occurredAt)}
                {a.actorName ? ` · ${a.actorName}` : ""}
                {" · "}
                <span className="uppercase tracking-wider">{a.kind}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────── */

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
