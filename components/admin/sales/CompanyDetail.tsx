"use client";

/**
 * Firmen-Sales-Cockpit.
 *
 * V2 macht aus dem klassischen CompanyDetail einen geführten
 * Arbeitsplatz: prominente „Nächster Schritt"-Karte, Intelligence-
 * Summary, Live-Call- und Discovery-Workspaces direkt aus der
 * Firmenakte startbar. Die alten Tabs (Kontakte, Opportunities,
 * Historie …) bleiben inhaltlich erhalten, damit vorhandene Flows
 * und Daten verlustfrei weiterfunktionieren.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type SalesSolution,
  type SalesStatus,
} from "./shared";
import {
  BrandChip,
  ClassificationBadge,
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
import NextStepCard from "./NextStepCard";
import IntelligenceSummary from "./IntelligenceSummary";
import LiveCallWorkspace from "./LiveCallWorkspace";
import DiscoveryWorkspace from "./DiscoveryWorkspace";
import SolutionReview from "./SolutionReview";
import {
  analyzeDiscovery,
  coerceDiscovery,
  type DiscoveryData,
} from "@/lib/sales/discoveryModel";

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
  | "calls"
  | "discovery"
  | "solution"
  | "proposals"
  | "ai"
  | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Übersicht" },
  { id: "contacts", label: "Kontakte" },
  { id: "opportunities", label: "Opportunities" },
  { id: "calls", label: "Gespräche" },
  { id: "discovery", label: "Bedarf" },
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
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(
    initialOpportunityId
  );

  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [solution, setSolution] = useState<SalesSolution | null>(null);

  const [showCall, setShowCall] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setData(null);
      try {
        const res = await fetch(`/api/admin/sales/companies/${companyId}`, {
          cache: "no-store",
        });
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

  // Discovery + Solution der primären Opportunity nachladen.
  useEffect(() => {
    if (!data) return;
    const primary = data.opportunities[0];
    if (!primary) {
      setDiscovery(null);
      setSolution(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [d, s] = await Promise.all([
          fetch(`/api/admin/sales/opportunities/${primary.id}/discovery`, {
            cache: "no-store",
          }),
          fetch(`/api/admin/sales/opportunities/${primary.id}/solution`, {
            cache: "no-store",
          }),
        ]);
        if (!alive) return;
        if (d.ok) {
          const payload = (await d.json()) as { discovery: DiscoveryData };
          setDiscovery(coerceDiscovery(payload.discovery));
        } else {
          setDiscovery(null);
        }
        if (s.ok) {
          const payload = (await s.json()) as { solution: SalesSolution | null };
          setSolution(payload.solution ?? null);
        } else {
          setSolution(null);
        }
      } catch {
        /* leise ignorieren */
      }
    })();
    return () => {
      alive = false;
    };
  }, [data, refreshTick]);

  const primaryOpportunity = useMemo(
    () => data?.opportunities[0] ?? null,
    [data]
  );

  const primaryBrand: BrandContext = primaryOpportunity?.brandContext ?? "nexcel";
  const brandBusinessLabel =
    primaryBrand === "agiworks" ? "AGI Works" : primaryBrand === "both" ? "NEXCEL & AGI Works" : "NEXCEL AI";

  const bump = () => {
    setRefreshTick((t) => t + 1);
    void load(true);
    onChanged();
  };

  const navigateTo = (target: string, oppId?: string) => {
    if (oppId) setSelectedOpportunityId(oppId);
    if (target === "call") {
      setShowCall(true);
      return;
    }
    if (target === "discovery") {
      if (data?.opportunities.length === 0) return;
      setShowDiscovery(true);
      return;
    }
    if ((TABS as { id: string }[]).some((t) => t.id === target)) {
      setTab(target as Tab);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error}
        <div className="mt-3">
          <button onClick={onClose} className={buttonSecondary}>
            Zurück
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/50">
        Firma wird geladen…
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

      <NextStepCard
        companyId={data.company.id}
        accent={accent}
        onNavigate={(t, oppId) => navigateTo(t, oppId)}
        onStartCall={(oppId) => {
          setSelectedOpportunityId(oppId);
          setShowCall(true);
        }}
        onStartDiscovery={(oppId) => {
          setSelectedOpportunityId(oppId);
          setShowDiscovery(true);
        }}
      />

      <div className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
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
        <OverviewTab
          company={data.company}
          contacts={data.contacts}
          opportunities={data.opportunities}
          discovery={discovery}
          solution={solution}
          accent={accent}
          onStartCall={() => {
            if (primaryOpportunity) setSelectedOpportunityId(primaryOpportunity.id);
            setShowCall(true);
          }}
          onStartDiscovery={() => {
            if (primaryOpportunity) setSelectedOpportunityId(primaryOpportunity.id);
            setShowDiscovery(true);
          }}
          onGoTab={(t) => setTab(t)}
        />
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
          brandDefault="nexcel"
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
      {tab === "calls" && (
        <CallsTab
          opportunity={primaryOpportunity}
          onStartCall={() => setShowCall(true)}
        />
      )}
      {tab === "discovery" && (
        <DiscoveryTab
          opportunity={primaryOpportunity}
          discovery={discovery}
          onOpen={() => setShowDiscovery(true)}
          accent={accent}
        />
      )}
      {tab === "solution" && (
        <PerOpportunitySection
          opportunities={data.opportunities}
          selectedOpportunityId={selectedOpportunityId}
          onSelect={setSelectedOpportunityId}
          render={(oppId) => (
            <SolutionTabSection
              opportunityId={oppId}
              accent={accent}
              onChanged={bump}
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
              onChanged={bump}
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

      {showCall && primaryOpportunity && (
        <LiveCallWorkspace
          company={data.company}
          contacts={data.contacts}
          opportunity={primaryOpportunity}
          brand={primaryOpportunity.brandContext}
          accent={accent}
          brandBusinessLabel={brandBusinessLabel}
          onClose={() => setShowCall(false)}
          onCompleted={() => {
            setShowCall(false);
            bump();
          }}
        />
      )}

      {showDiscovery && primaryOpportunity && (
        <DiscoveryWorkspace
          company={data.company}
          contacts={data.contacts}
          opportunity={primaryOpportunity}
          brand={primaryOpportunity.brandContext}
          accent={accent}
          onClose={() => setShowDiscovery(false)}
          onCompleted={() => {
            setShowDiscovery(false);
            bump();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Solution Tab Section — lädt Solution vor SolutionReview                    */
/* -------------------------------------------------------------------------- */

function SolutionTabSection({
  opportunityId,
  accent,
  onChanged,
}: {
  opportunityId: string;
  accent: string;
  onChanged: () => void;
}) {
  const [opportunity, setOpportunity] = useState<SalesOpportunity | null>(null);
  const [solution, setSolution] = useState<SalesSolution | null>(null);
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [oppRes, solRes] = await Promise.all([
        fetch(`/api/admin/sales/opportunities/${opportunityId}`, { cache: "no-store" }),
        fetch(`/api/admin/sales/opportunities/${opportunityId}/solution`, {
          cache: "no-store",
        }),
      ]);
      if (!alive) return;
      if (oppRes.ok) {
        const payload = (await oppRes.json()) as { opportunity: SalesOpportunity };
        setOpportunity(payload.opportunity);
      }
      if (solRes.ok) {
        const payload = (await solRes.json()) as { solution: SalesSolution | null };
        setSolution(payload.solution ?? null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [opportunityId, reloadKey]);

  const createEmpty = async () => {
    setCreating(true);
    try {
      const res = await fetch(
        `/api/admin/sales/opportunities/${opportunityId}/solution`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            structured: {},
            challengeMode: {},
          }),
        }
      );
      if (res.ok) {
        setReloadKey((k) => k + 1);
        onChanged();
      }
    } finally {
      setCreating(false);
    }
  };

  if (!opportunity) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/50">
        Opportunity wird geladen…
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center">
        <div className="text-base font-semibold text-white/85">Noch keine Lösung angelegt.</div>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/55">
          Sobald der Bedarf ausreichend geklärt ist, kannst du hier den Lösungsentwurf ausarbeiten. Du kannst später jederzeit die Sektionen erweitern oder eine neue Version speichern.
        </p>
        <button
          onClick={createEmpty}
          disabled={creating}
          className={buttonPrimary}
          style={{ backgroundColor: accent, marginTop: "1rem" }}
        >
          {creating ? "Wird angelegt…" : "Lösungsentwurf starten"}
        </button>
      </div>
    );
  }

  return (
    <SolutionReview
      opportunity={opportunity}
      solution={solution}
      accent={accent}
      onChanged={() => {
        setReloadKey((k) => k + 1);
        onChanged();
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  OverviewTab (V2)                                                           */
/* -------------------------------------------------------------------------- */

function OverviewTab({
  company,
  contacts,
  opportunities,
  discovery,
  solution,
  accent,
  onStartCall,
  onStartDiscovery,
  onGoTab,
}: {
  company: SalesCompany;
  contacts: SalesContact[];
  opportunities: SalesOpportunity[];
  discovery: DiscoveryData | null;
  solution: SalesSolution | null;
  accent: string;
  onStartCall: () => void;
  onStartDiscovery: () => void;
  onGoTab: (t: Tab) => void;
}) {
  const primary = opportunities[0] ?? null;
  const analysis = discovery ? analyzeDiscovery(discovery) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <IntelligenceSummary
          company={company}
          contacts={contacts}
          opportunity={primary}
          discovery={discovery}
          solution={solution}
        />

        <Section title={`Offene Opportunities (${opportunities.length})`}>
          {opportunities.length === 0 ? (
            <EmptyBlock
              title="Noch keine Opportunity."
              hint="Sobald ein konkreter Bedarf oder ein relevantes Potenzial erkennbar ist, lege im Tab Opportunities die passende Chance an."
              cta="Zu Opportunities"
              onCta={() => onGoTab("opportunities")}
            />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {opportunities.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate">
                      <BrandChip value={o.brandContext} />
                      <span className="truncate text-white/90">{o.title}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/45">
                      Erwartet {formatEuroFromCents(o.expectedValueCents)}
                      {o.closeDate ? ` · Ziel-Close ${formatDateTimeDe(o.closeDate)}` : ""}
                    </div>
                  </div>
                  <StatusPill value={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {company.notes && (
          <Section title="Notizen">
            <div className="whitespace-pre-wrap text-sm text-white/80">{company.notes}</div>
          </Section>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-white/45">
            Schnellzugriff
          </div>
          <div className="space-y-2">
            <QuickAction
              label="Erstkontakt führen"
              hint="Live-Skript, Live-Notizen, Autosave."
              onClick={onStartCall}
              accent={accent}
              disabled={!primary}
              disabledReason={!primary ? "Zuerst Opportunity anlegen." : undefined}
            />
            <QuickAction
              label="Bedarfsgespräch öffnen"
              hint="Geführte Analyse, kein Formular."
              onClick={onStartDiscovery}
              accent={accent}
              disabled={!primary}
              disabledReason={!primary ? "Zuerst Opportunity anlegen." : undefined}
            />
            <QuickAction
              label="KI-Workflow starten"
              hint="Pre-Call, Post-Call, Lösung, Angebot."
              onClick={() => onGoTab("ai")}
              accent={accent}
            />
            <QuickAction
              label="Angebot vorbereiten"
              hint="Nach freigegebener Lösung."
              onClick={() => onGoTab("proposals")}
              accent={accent}
              disabled={!solution?.approvedAt}
              disabledReason={!solution?.approvedAt ? "Lösung noch nicht freigegeben." : undefined}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-white/45">
            Kontakte
          </div>
          {contacts.length === 0 ? (
            <div className="text-xs text-white/45">
              Noch keine Kontakte. Lege den Hauptkontakt im Tab Kontakte an — er wird automatisch in Gespräche übernommen.
            </div>
          ) : (
            <ul className="space-y-2">
              {contacts.slice(0, 4).map((c) => (
                <li key={c.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white/90">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") || "Kontakt"}
                    </span>
                    {c.isPrimary && <Pill color="#0091C2">Hauptkontakt</Pill>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/45">
                    {[c.position, c.phone, c.email].filter(Boolean).join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {analysis && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Bedarfsstand</div>
              <span className="text-[11px] text-white/40">{Math.round(analysis.ratio * 100)}%</span>
            </div>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(4, Math.round(analysis.ratio * 100))}%`, background: accent }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <MiniStat label="Geklärt" value={analysis.clarified.length} color="#22C55E" />
              <MiniStat label="Teilweise" value={analysis.partial.length} color="#F59E0B" />
              <MiniStat label="Offen" value={analysis.open.length} color="#94A3B8" />
            </div>
            <button
              onClick={onStartDiscovery}
              className={`${buttonSecondary} mt-3 w-full`}
              disabled={!primary}
            >
              Bedarf öffnen →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function QuickAction({
  label,
  hint,
  onClick,
  accent,
  disabled,
  disabledReason,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  accent: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group relative w-full rounded-xl border p-3 text-left transition ${
        disabled
          ? "cursor-not-allowed border-white/[0.04] bg-white/[0.01] text-white/40"
          : "border-white/[0.06] bg-white/[0.02] text-white/85 hover:bg-white/[0.05]"
      }`}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-0.5 text-[11px] text-white/45">{disabled ? disabledReason ?? hint : hint}</div>
        </div>
        <span
          className="text-lg opacity-40 transition group-hover:opacity-100"
          style={{ color: accent }}
        >
          →
        </span>
      </div>
    </button>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-black/[0.15] px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-0.5 text-base font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function EmptyBlock({
  title,
  hint,
  cta,
  onCta,
}: {
  title: string;
  hint: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center">
      <div className="text-sm font-medium text-white/85">{title}</div>
      <div className="mx-auto mt-1 max-w-md text-[12px] text-white/45">{hint}</div>
      {cta && onCta && (
        <button onClick={onCta} className={`${buttonSecondary} mt-3`}>
          {cta}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CallsTab                                                                   */
/* -------------------------------------------------------------------------- */

interface NoteLite {
  id: string;
  kind: "call" | "discovery" | "internal";
  body: string;
  structured: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  authorName?: string | null;
}

function CallsTab({
  opportunity,
  onStartCall,
}: {
  opportunity: SalesOpportunity | null;
  onStartCall: () => void;
}) {
  const [notes, setNotes] = useState<NoteLite[] | null>(null);

  useEffect(() => {
    if (!opportunity) {
      setNotes([]);
      return;
    }
    let alive = true;
    (async () => {
      const res = await fetch(
        `/api/admin/sales/opportunities/${opportunity.id}/notes`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const payload = (await res.json()) as { notes: NoteLite[] };
        if (alive) setNotes(payload.notes.filter((n) => n.kind === "call"));
      }
    })();
    return () => {
      alive = false;
    };
  }, [opportunity]);

  if (!opportunity) {
    return (
      <EmptyBlock
        title="Noch keine Opportunity vorhanden."
        hint="Ein Gespräch ist immer einer Verkaufschance zugeordnet. Lege im Tab Opportunities zuerst eine an."
      />
    );
  }

  return (
    <Section
      title="Gespräche"
      actions={
        <button onClick={onStartCall} className={buttonPrimary} style={{ backgroundColor: "#0091C2" }}>
          Gespräch starten →
        </button>
      }
    >
      {notes === null ? (
        <div className="text-sm text-white/45">Gespräche werden geladen…</div>
      ) : notes.length === 0 ? (
        <EmptyBlock
          title="Noch keine Gespräche dokumentiert."
          hint="Starte den Live-Gesprächs-Modus — Skript, Pre-Call-Briefing und Live-Notizen laufen automatisch parallel."
          cta="Gespräch starten"
          onCta={onStartCall}
        />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => {
            const s = n.structured as {
              kontaktErgebnis?: string;
              nextAction?: string;
              termin?: string;
              interesse?: string;
            };
            return (
              <li key={n.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-white/90">
                    {formatDateTimeDe(n.updatedAt)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                    {s.kontaktErgebnis && <Pill color="#22C55E">{s.kontaktErgebnis}</Pill>}
                    {s.interesse && <Pill color="#A78BFA">{s.interesse}</Pill>}
                  </div>
                </div>
                {n.body && (
                  <div className="mt-2 whitespace-pre-wrap text-[13px] text-white/75 line-clamp-6">
                    {n.body}
                  </div>
                )}
                {n.authorName && (
                  <div className="mt-1 text-[11px] text-white/40">von {n.authorName}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  DiscoveryTab                                                               */
/* -------------------------------------------------------------------------- */

function DiscoveryTab({
  opportunity,
  discovery,
  onOpen,
  accent,
}: {
  opportunity: SalesOpportunity | null;
  discovery: DiscoveryData | null;
  onOpen: () => void;
  accent: string;
}) {
  if (!opportunity) {
    return (
      <EmptyBlock
        title="Kein Bedarf vorhanden."
        hint="Ein Bedarfsgespräch ist einer Opportunity zugeordnet. Lege im Tab Opportunities zuerst eine an."
      />
    );
  }

  const analysis = discovery ? analyzeDiscovery(discovery) : null;

  return (
    <div className="space-y-3">
      <Section
        title="Bedarf"
        actions={
          <button onClick={onOpen} className={buttonPrimary} style={{ backgroundColor: accent }}>
            Bedarfsgespräch öffnen →
          </button>
        }
      >
        {!discovery || !analysis ? (
          <EmptyBlock
            title="Noch kein Bedarfsgespräch."
            hint="Öffne den geführten Modus — Ziel, Pain, Ursache, Auswirkung, Business Value und Timing werden dort strukturiert erfasst."
            cta="Bedarfsgespräch öffnen"
            onCta={onOpen}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard label="Geklärt" value={analysis.clarified.length} color="#22C55E" />
            <StatCard label="Teilweise" value={analysis.partial.length} color="#F59E0B" />
            <StatCard label="Offen" value={analysis.open.length} color="#94A3B8" />
            <div className="md:col-span-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/45">
                Status
              </div>
              <div className="mt-1 text-sm text-white/85">
                {analysis.readyForSolution
                  ? "Lösungsbereit — alle angebotsrelevanten Themen sind geklärt."
                  : analysis.criticalOpen.length > 0
                    ? `Weitere Klärung nötig · ${analysis.criticalOpen.length} kritisch offen`
                    : "Bedarf in Arbeit."}
              </div>
            </div>
            {discovery.bestaetigterBedarf && (
              <div className="md:col-span-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-3">
                <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">
                  Bestätigter Bedarf
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">
                  {discovery.bestaetigterBedarf}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header, ContactsTab, OpportunitiesTab, ActivityTab, Helpers (unverändert)  */
/* -------------------------------------------------------------------------- */

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

  // Inline-Save für Status / nächste Aktion / Fälligkeit / Meeting
  const inlinePatch = async (patch: Partial<SalesCompany>) => {
    const merged = { ...form, ...patch };
    setForm(merged);
    await fetch(`/api/admin/sales/companies/${company.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: company.version, ...patch }),
    });
    onSaved();
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
                <a
                  href={form.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Website ↗
                </a>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm(company);
                }}
                className={buttonSecondary}
                type="button"
              >
                Abbrechen
              </button>
              <button
                onClick={save}
                disabled={saving}
                className={buttonPrimary}
                style={{ backgroundColor: accent }}
                type="button"
              >
                {saving ? "Speichere…" : "Speichern"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className={buttonSecondary}
              type="button"
            >
              Bearbeiten
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
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
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Notizen">
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={textareaClasses} />
            </Field>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <InlineField
            label="Status"
            value={SALES_STATUS_LABEL[form.status]}
            onSelect={(v) => inlinePatch({ status: v as SalesStatus })}
            options={(Object.keys(SALES_STATUS_LABEL) as SalesStatus[]).map((s) => ({
              value: s,
              label: SALES_STATUS_LABEL[s],
            }))}
            currentValue={form.status}
          />
          <InlineField
            label="Nächste Aktion"
            value={form.nextAction ? NEXT_ACTION_LABEL[form.nextAction] : "—"}
            onSelect={(v) => inlinePatch({ nextAction: (v || null) as NextAction | null })}
            options={[
              { value: "", label: "Offen" },
              ...(Object.keys(NEXT_ACTION_LABEL) as NextAction[]).map((n) => ({
                value: n,
                label: NEXT_ACTION_LABEL[n],
              })),
            ]}
            currentValue={form.nextAction ?? ""}
          />
          <InlineDatetime
            label="Fällig"
            value={form.nextActionDueAt}
            onChange={(v) => inlinePatch({ nextActionDueAt: v })}
          />
          <InlineDatetime
            label="Nächstes Meeting"
            value={form.nextMeetingAt}
            onChange={(v) => inlinePatch({ nextMeetingAt: v })}
          />
          <Snapshot label="Erwartet" value={formatEuroFromCents(form.expectedValueCents)} />
          <Snapshot label="Angebot" value={formatEuroFromCents(form.proposalValueCents)} />
          <Snapshot label="Letzter Kontakt" value={formatDateTimeDe(form.lastContactAt)} />
          <Snapshot
            label="Kontakt-Ergebnis"
            value={form.contactOutcome ? CONTACT_OUTCOME_LABEL[form.contactOutcome] : "—"}
          />
        </div>
      )}
    </div>
  );
}

function InlineField({
  label,
  value,
  onSelect,
  options,
  currentValue,
}: {
  label: string;
  value: string;
  onSelect: (v: string) => void | Promise<void>;
  options: { value: string; label: string }[];
  currentValue: string;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      {editing ? (
        <select
          autoFocus
          value={currentValue}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            void onSelect(e.target.value);
            setEditing(false);
          }}
          className={`${selectClasses} mt-1`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 block w-full text-left text-sm text-white/90 hover:text-white"
        >
          {value}
        </button>
      )}
    </div>
  );
}

function InlineDatetime({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(toLocalInput(value));
  useEffect(() => setLocal(toLocalInput(value)), [value]);
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      {editing ? (
        <input
          autoFocus
          type="datetime-local"
          value={local}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            setLocal(e.target.value);
            void onChange(fromLocalInput(e.target.value));
          }}
          className={`${inputClasses} mt-1`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 block w-full text-left text-sm text-white/90 hover:text-white"
        >
          {formatDateTimeDe(value)}
        </button>
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

/* -------------------------------------------------------------------------- */
/*  Contacts + Opportunities + Activity (aus V1 übernommen)                    */
/* -------------------------------------------------------------------------- */

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
        <button onClick={() => setCreating(true)} className={buttonSecondary} type="button">
          + Neuer Kontakt
        </button>
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
        <EmptyBlock
          title="Noch keine Kontakte."
          hint="Ohne Ansprechpartner keine gute Beratung. Lege den Hauptkontakt an — er wird in Gesprächen automatisch vorbelegt."
          cta="Kontakt anlegen"
          onCta={() => setCreating(true)}
        />
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
          <EmptyBlock
            title="Noch keine Opportunity."
            hint="Ein Deal beginnt hier: Titel vergeben, Marke wählen und im Detail Ziel, Bedarf und Angebot ausarbeiten."
            cta="Erste Opportunity anlegen"
            onCta={() => setCreating(true)}
          />
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
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-6 text-sm text-white/45">
            Wähle links eine Opportunity — Details, Notizen, Einwände und die Deal-Entscheidung findest du dort.
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
      <EmptyBlock
        title="Keine Opportunity vorhanden."
        hint="Ohne Verkaufschance können wir hier nichts ausarbeiten. Lege im Tab Opportunities zuerst eine an."
      />
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
        <EmptyBlock
          title="Noch keine Aktivitäten."
          hint="Sobald Kontakte, Notizen, Angebote oder Statusänderungen entstehen, siehst du hier eine chronologische Historie."
        />
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

/* Import-Referenzen, damit ungenutzte Warnungen ausbleiben */
export type __V2Cockpit = typeof BRAND_CONTEXT_LABEL;
