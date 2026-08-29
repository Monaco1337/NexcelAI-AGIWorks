"use client";

/**
 * Zielkunden-Intelligence-Dashboard.
 *
 * Design-Grundsatz: gleiche Optik wie das restliche Sales-Modul
 * (glass cards, dark theme, brand-accent). Neu ist die Fokussierung
 * auf ranked Opportunities statt einer CRM-Tabelle. Der User bekommt
 * innerhalb von wenigen Sekunden die Antwort auf:
 *   „Wen soll ich JETZT kontaktieren und warum?"
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Section,
  EmptyState,
  Field,
  inputClasses,
  selectClasses,
  buttonPrimary,
  buttonSecondary,
} from "../HelperUI";
import type {
  PriorityClass,
  TargetCompany,
  LeadScore,
  SalesBrief,
} from "@/lib/sales/targets/model";
import { PRIORITY_CLASS_COLOR, PRIORITY_CLASS_LABEL } from "@/lib/sales/targets/model";
import TargetSearchModal from "./TargetSearchModal";
import TargetDetail from "./TargetDetail";

export interface TargetListItemDTO {
  target: TargetCompany;
  leadScore: LeadScore | null;
  salesBrief: SalesBrief | null;
  contactSummary: {
    phoneCount: number;
    mobileCount: number;
    emailCount: number;
    directEmailCount: number;
    hasContactForm: boolean;
    hasWebsite: boolean;
  };
  decisionMakerCount: number;
}

interface Filters {
  q: string;
  city: string;
  industry: string;
  priority: PriorityClass | "";
  minScore: number | null;
  maxDistanceKm: number | null;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasDm: boolean;
  weakWebsite: boolean;
  softwareOpp: boolean;
  sort: "score" | "distance" | "recent" | "name";
}

const DEFAULT_FILTERS: Filters = {
  q: "",
  city: "",
  industry: "",
  priority: "",
  minScore: null,
  maxDistanceKm: null,
  hasWebsite: false,
  hasPhone: false,
  hasEmail: false,
  hasDm: false,
  weakWebsite: false,
  softwareOpp: false,
  sort: "score",
};

export default function TargetsCenter({ accent }: { accent: string }) {
  const [items, setItems] = useState<TargetListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showSearch, setShowSearch] = useState(false);
  const [openTargetId, setOpenTargetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.city) params.set("city", filters.city);
    if (filters.industry) params.set("industry", filters.industry);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.minScore !== null) params.set("minScore", String(filters.minScore));
    if (filters.maxDistanceKm !== null) params.set("maxDistanceKm", String(filters.maxDistanceKm));
    if (filters.hasWebsite) params.set("hasWebsite", "1");
    if (filters.hasPhone) params.set("hasPhone", "1");
    if (filters.hasEmail) params.set("hasEmail", "1");
    if (filters.hasDm) params.set("hasDm", "1");
    if (filters.weakWebsite) params.set("weakWebsite", "1");
    if (filters.softwareOpp) params.set("softwareOpp", "1");
    if (filters.sort) params.set("sort", filters.sort);
    params.set("limit", "150");

    try {
      const res = await fetch(`/api/admin/sales/targets?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: TargetListItemDTO[] };
      setItems(data.items ?? []);
    } catch (err) {
      setError((err as Error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const total = items.length;
    const hot = items.filter((i) => i.leadScore && (i.leadScore.priorityClass === "A+" || i.leadScore.priorityClass === "A")).length;
    const withBrief = items.filter((i) => Boolean(i.salesBrief)).length;
    const withDm = items.filter((i) => i.decisionMakerCount > 0).length;
    return { total, hot, withBrief, withDm };
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Vertrieb / Intelligence</div>
          <h2 className="text-lg font-semibold text-white">Zielkunden</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className={buttonSecondary}
            disabled={loading}
          >
            {loading ? "Lädt…" : "Aktualisieren"}
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className={buttonPrimary}
            style={{ backgroundColor: accent, color: "#000" }}
          >
            Automatisch suchen
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Gesamt" value={totals.total} />
        <Kpi label="Priorität A+/A" value={totals.hot} accent={accent} />
        <Kpi label="Mit Sales Brief" value={totals.withBrief} />
        <Kpi label="Entscheider bekannt" value={totals.withDm} />
      </div>

      {/* Intelligence-Quality-Strip (Phase 17) */}
      <IntelligenceQualityStrip accent={accent} />

      {/* Filter */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Liste */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Zielkunden konnten nicht geladen werden: {error}
        </div>
      )}
      {!loading && items.length === 0 && !error && (
        <Section title="Noch keine Zielkunden">
          <EmptyState
            title="Automatisch Zielkunden entdecken"
            hint="Starte deine erste automatische Suche für eine Region, Branche oder ein Radius. Sobald Firmen entdeckt sind, wird jede automatisch angereichert, bewertet und mit einem Sales Brief versehen."
            action={
              <button
                onClick={() => setShowSearch(true)}
                className={buttonPrimary}
                style={{ backgroundColor: accent, color: "#000" }}
              >
                Erste Suche starten
              </button>
            }
          />
        </Section>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {items.map((it) => (
            <TargetCard key={it.target.id} item={it} accent={accent} onOpen={() => setOpenTargetId(it.target.id)} />
          ))}
        </div>
      )}

      {showSearch && (
        <TargetSearchModal
          accent={accent}
          onClose={() => setShowSearch(false)}
          onCompleted={() => {
            setShowSearch(false);
            void load();
          }}
        />
      )}
      {openTargetId && (
        <TargetDetail
          targetId={openTargetId}
          accent={accent}
          onClose={() => setOpenTargetId(null)}
          onChanged={() => void load()}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  KPI                                                                        */
/* -------------------------------------------------------------------------- */

function Kpi({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-1 text-2xl font-semibold" style={{ color: accent ?? "white" }}>
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Filter                                                                     */
/* -------------------------------------------------------------------------- */

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });
  const chip = (key: keyof Pick<Filters, "hasWebsite" | "hasPhone" | "hasEmail" | "hasDm" | "weakWebsite" | "softwareOpp">, label: string) => (
    <button
      key={String(key)}
      onClick={() => set(key, !filters[key])}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        filters[key]
          ? "border-white/40 bg-white/10 text-white"
          : "border-white/[0.06] bg-white/[0.03] text-white/60 hover:text-white/90"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <Field label="Suche">
            <input
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Firma, Stadt, Branche…"
              className={inputClasses}
            />
          </Field>
        </div>
        <Field label="Stadt">
          <input
            value={filters.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputClasses}
            placeholder="alle"
          />
        </Field>
        <Field label="Branche">
          <input
            value={filters.industry}
            onChange={(e) => set("industry", e.target.value)}
            className={inputClasses}
            placeholder="alle"
          />
        </Field>
        <Field label="Priorität">
          <select
            value={filters.priority}
            onChange={(e) => set("priority", e.target.value as PriorityClass | "")}
            className={selectClasses}
          >
            <option value="">alle</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </Field>
        <Field label="Sortierung">
          <select
            value={filters.sort}
            onChange={(e) => set("sort", e.target.value as Filters["sort"])}
            className={selectClasses}
          >
            <option value="score">Beste Opportunity zuerst</option>
            <option value="distance">Nächste zuerst</option>
            <option value="recent">Zuletzt aktualisiert</option>
            <option value="name">Alphabetisch</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Score / Distanz</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min. Lead-Score">
              <input
                type="number"
                min={0}
                max={100}
                value={filters.minScore ?? ""}
                onChange={(e) => set("minScore", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="z. B. 70"
                className={inputClasses}
              />
            </Field>
            <Field label="Max. Distanz (km)">
              <input
                type="number"
                min={0}
                value={filters.maxDistanceKm ?? ""}
                onChange={(e) => set("maxDistanceKm", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="z. B. 25"
                className={inputClasses}
              />
            </Field>
          </div>
        </div>
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Schnellfilter</div>
          <div className="flex flex-wrap gap-2">
            {chip("hasPhone", "Telefon vorhanden")}
            {chip("hasEmail", "E-Mail vorhanden")}
            {chip("hasDm", "Entscheider gefunden")}
            {chip("hasWebsite", "Website vorhanden")}
            {chip("weakWebsite", "Website schwach")}
            {chip("softwareOpp", "Software-Opportunity")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

function TargetCard({ item, accent, onOpen }: { item: TargetListItemDTO; accent: string; onOpen: () => void }) {
  const { target, leadScore, salesBrief, contactSummary, decisionMakerCount } = item;
  const priority = leadScore?.priorityClass ?? "D";
  const priorityColor = PRIORITY_CLASS_COLOR[priority];
  const distance = target.distanceKm !== null ? `${target.distanceKm.toFixed(1)} km` : null;
  const opportunity = salesBrief?.mainOpportunity ?? "—";
  const projectValue =
    salesBrief?.projectValueMinCents && salesBrief.projectValueMaxCents
      ? `${eur(salesBrief.projectValueMinCents)} – ${eur(salesBrief.projectValueMaxCents)}`
      : null;

  return (
    <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold"
              style={{
                color: priorityColor,
                borderColor: `${priorityColor}66`,
                background: `${priorityColor}18`,
              }}
              title={PRIORITY_CLASS_LABEL[priority]}
            >
              {priority}
            </span>
            <div className="truncate text-base font-semibold text-white">{target.name}</div>
          </div>
          <div className="mt-1 truncate text-xs text-white/60">
            {[target.industry, target.city, distance].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Lead-Score</div>
          <div className="text-3xl font-semibold" style={{ color: accent }}>
            {leadScore?.totalScore ?? "—"}
          </div>
        </div>
      </div>

      {salesBrief && (
        <div className="mt-3 space-y-1 text-xs">
          <div className="text-white/50">Hauptopportunity</div>
          <div className="text-sm text-white">{opportunity}</div>
          {salesBrief.opportunityReason && (
            <div className="text-white/60">{salesBrief.opportunityReason}</div>
          )}
          {salesBrief.recommendedEntry && (
            <div className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-white/70">
              {salesBrief.recommendedEntry}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <MiniStat label="Telefon" ok={contactSummary.phoneCount > 0 || contactSummary.mobileCount > 0} />
        <MiniStat label="E-Mail" ok={contactSummary.directEmailCount > 0} sub={contactSummary.directEmailCount > 0 ? "direkt" : contactSummary.emailCount > 0 ? "generic" : undefined} />
        <MiniStat label="Website" ok={contactSummary.hasWebsite} />
        <MiniStat label="Entscheider" ok={decisionMakerCount > 0} sub={decisionMakerCount > 0 ? `${decisionMakerCount}` : undefined} />
      </div>

      {projectValue && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-white/50">Projektpotenzial</span>
          <span className="font-medium text-white">{projectValue}</span>
        </div>
      )}
      {leadScore?.capacityClass && (
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-white/50">Commercial Capacity</span>
          <span className="font-medium text-white">
            {leadScore.capacityClass}
            {leadScore.capacityConfidence != null && (
              <span className="ml-2 text-white/50">Conf {(leadScore.capacityConfidence * 100).toFixed(0)} %</span>
            )}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {target.phone && (
          <a href={`tel:${target.phone}`} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.08]">
            Anrufen
          </a>
        )}
        {target.email && (
          <a href={`mailto:${target.email}`} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.08]">
            E-Mail
          </a>
        )}
        {target.website && (
          <a href={target.website} target="_blank" rel="noreferrer" className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.08]">
            Website
          </a>
        )}
        <button onClick={onOpen} className={buttonPrimary} style={{ backgroundColor: accent, color: "#000" }}>
          Analyse öffnen
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, ok, sub }: { label: string; ok: boolean; sub?: string }) {
  return (
    <div className={`rounded-lg border p-2 ${ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/[0.06] bg-white/[0.02]"}`}>
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/50">{label}</div>
      <div className={`text-sm font-semibold ${ok ? "text-emerald-200" : "text-white/40"}`}>{ok ? "✓" : "—"}</div>
      {sub && <div className="text-[10px] text-white/50">{sub}</div>}
    </div>
  );
}

function eur(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

/* -------------------------------------------------------------------------- */
/*  Intelligence-Quality-Strip (Phase 17)                                     */
/* -------------------------------------------------------------------------- */

interface DataQualityMetricsDTO {
  totalCompanies: number;
  companiesReady: number;
  websiteCoverage: number;
  phoneCoverage: number;
  verifiedPhoneRate: number;
  emailCoverage: number;
  verifiedEmailRate: number;
  decisionMakerCoverage: number;
  opportunityCoverage: number;
  averageConfidence: number;
  conflictingContactCount: number;
  possibleDuplicateCount: number;
  staleWebsiteAudits: number;
  providerFailures: Array<{ provider: string; state: string; consecutiveFail: number }>;
  totalProviderCostCents: number;
  perQualifiedLeadCostCents: number | null;
  reviewQueueSize: number;
  goldenDatasetCount: number;
  updatedAt: string;
}
interface ProviderHealthDTO {
  provider: string;
  state: "HEALTHY" | "DEGRADED" | "RATE_LIMITED" | "UNAVAILABLE" | "MISCONFIGURED";
  consecutiveFail: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
  note: string | null;
}

function IntelligenceQualityStrip({ accent }: { accent: string }) {
  const [metrics, setMetrics] = useState<DataQualityMetricsDTO | null>(null);
  const [providers, setProviders] = useState<ProviderHealthDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/sales/targets/metrics", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { metrics: DataQualityMetricsDTO; providerHealth: ProviderHealthDTO[] };
        if (!alive) return;
        setMetrics(data.metrics ?? null);
        setProviders(data.providerHealth ?? []);
      } catch (err) {
        if (!alive) return;
        setError((err as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 text-xs text-white/50">
        Intelligence-Quality wird geladen…
      </div>
    );
  }
  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 text-xs text-white/50">
        Intelligence-Quality nicht verfügbar{error ? ` (${error})` : ""}.
      </div>
    );
  }
  const pct = (n: number) => `${Math.round(n * 100)} %`;
  const eur0 = (c: number | null) =>
    c === null ? "—" : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(c / 100);
  const conflictingTotal = metrics.conflictingContactCount + metrics.possibleDuplicateCount;
  const providerFailCount = metrics.providerFailures.length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Intelligence Quality</div>
          <div className="text-sm text-white/80">Datenqualität, Provider-Health und Review-Bedarf.</div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-white/70 transition hover:text-white"
        >
          {expanded ? "Weniger" : "Details"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
        <QualityCell label="Companies" value={String(metrics.totalCompanies)} />
        <QualityCell label="Phone Coverage" value={pct(metrics.phoneCoverage)} accent={accent} />
        <QualityCell label="Email Coverage" value={pct(metrics.emailCoverage)} />
        <QualityCell label="Decision Maker" value={pct(metrics.decisionMakerCoverage)} />
        <QualityCell label="Opportunity" value={pct(metrics.opportunityCoverage)} />
        <QualityCell
          label="Review-Queue"
          value={String(metrics.reviewQueueSize)}
          tone={metrics.reviewQueueSize > 0 ? "warn" : undefined}
        />
      </div>
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
            <QualityCell label="Verified Phone" value={pct(metrics.verifiedPhoneRate)} />
            <QualityCell label="Verified Email" value={pct(metrics.verifiedEmailRate)} />
            <QualityCell
              label="Ø Confidence"
              value={pct(metrics.averageConfidence)}
            />
            <QualityCell label="Conflicting" value={String(conflictingTotal)} tone={conflictingTotal > 0 ? "warn" : undefined} />
            <QualityCell label="Stale Audits" value={String(metrics.staleWebsiteAudits)} tone={metrics.staleWebsiteAudits > 0 ? "warn" : undefined} />
            <QualityCell label="Golden Set" value={String(metrics.goldenDatasetCount)} accent={accent} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <QualityCell
              label="Provider Issues"
              value={String(providerFailCount)}
              tone={providerFailCount > 0 ? "warn" : undefined}
            />
            <QualityCell label="Provider Cost" value={eur0(metrics.totalProviderCostCents)} />
            <QualityCell label="Cost / Qualified Lead" value={eur0(metrics.perQualifiedLeadCostCents)} />
            <QualityCell label="Stand" value={new Date(metrics.updatedAt).toLocaleTimeString("de-DE")} />
          </div>
          {providers.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Provider Health</div>
              <div className="flex flex-wrap gap-2">
                {providers.map((p) => (
                  <ProviderChip key={p.provider} health={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QualityCell({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: string;
  tone?: "warn";
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "warn"
          ? "border-amber-400/25 bg-amber-400/5"
          : "border-white/[0.06] bg-white/[0.025]"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div
        className={`mt-1 text-sm font-semibold ${tone === "warn" ? "text-amber-200" : "text-white"}`}
        style={accent && !tone ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function ProviderChip({ health }: { health: ProviderHealthDTO }) {
  const color =
    health.state === "HEALTHY"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : health.state === "DEGRADED"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : health.state === "RATE_LIMITED"
      ? "border-orange-400/30 bg-orange-400/10 text-orange-100"
      : health.state === "UNAVAILABLE"
      ? "border-red-400/40 bg-red-400/10 text-red-100"
      : "border-white/[0.1] bg-white/[0.05] text-white/70";
  return (
    <div className={`rounded-full border px-3 py-1 text-[11px] ${color}`}>
      <span className="font-medium">{health.provider}</span>
      <span className="mx-1.5 text-white/40">·</span>
      <span>{health.state}</span>
      {health.consecutiveFail > 0 && <span className="ml-1 text-white/60">×{health.consecutiveFail}</span>}
    </div>
  );
}
