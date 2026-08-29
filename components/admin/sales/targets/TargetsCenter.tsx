"use client";

/**
 * Zielkunden-Intelligence-Cockpit.
 *
 * Neuer Grundsatz (Phase 2): keine Modal-Ceremony. Die Ansicht öffnet
 * SOFORT eine relevante Liste, der User setzt Stadt + Radius im Header
 * und die Karten laden inline. Für Regionen bis 250 km wird bei
 * Bedarf eine Tile-basierte Discovery im Hintergrund gestartet, deren
 * Fortschritt oben in Echtzeit sichtbar bleibt.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { normalizeCategoryFromRawIndustry, ALL_CATEGORIES } from "@/lib/sales/targets/categoryMap";
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
  radiusKm: number;
  industries: string[];
  priority: PriorityClass | "";
  minScore: number | null;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasDm: boolean;
  weakWebsite: boolean;
  softwareOpp: boolean;
  sort: "score" | "distance" | "recent" | "name";
}

// Für die Discovery-Filter zeigen wir die kanonische Kategorie-Liste,
// die auch das Backend beim Katalogisieren verwendet.
const INDUSTRY_OPTIONS = ALL_CATEGORIES.filter((c) => c !== "Sonstige");

const STORAGE_KEY = "nx.targets.cockpit.v2";

const DEFAULT_FILTERS: Filters = {
  q: "",
  city: "Unna",
  radiusKm: 25,
  industries: [],
  priority: "",
  minScore: null,
  hasWebsite: false,
  hasPhone: false,
  hasEmail: false,
  hasDm: false,
  weakWebsite: false,
  softwareOpp: false,
  sort: "score",
};

interface GeoPoint {
  lat: number;
  lng: number;
  city: string;
  country: string;
  source: "static" | "google_places";
}

interface AreaJob {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  discoveredCount: number;
  city: string | null;
  industries: string[];
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  actualCostCents: number;
}

interface ProviderStatusDTO {
  key: string;
  label: string;
  configured: boolean;
  note?: string;
}

/**
 * Zustand des serverseitigen Katalogaufbaus. Reine Anzeige: der Browser
 * startet keine Discovery und arbeitet keine Jobs ab. Der Aufbau läuft
 * im Cron-getriebenen Worker, auch wenn niemand das Panel geöffnet hat.
 */
interface CatalogStatusDTO {
  scope: { key: string; label: string; bbox: BBox } | null;
  publishState: "NONE" | "DRAFT" | "PUBLISHED" | "FAILED";
  publishedAt: string | null;
  targetCount: number;
  discoveredCount: number;
  qualityReport: QualityReportDTO | null;
  firstError: string | null;
  progress: {
    total: number;
    done: number;
    queued: number;
    running: number;
    failed: number;
    pct: number;
  } | null;
}

interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface QualityReportDTO {
  passed?: boolean;
  totalCompanies?: number;
  checks?: Array<{ key: string; label: string; passed: boolean; actual: number; required: number; unit: string }>;
}

interface LiveCountersDTO {
  total: number;
  hot: number;
  withBrief: number;
  withDm: number;
  enrichmentQueued: number;
}

function readStoredFilters(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export default function TargetsCenter({ accent }: { accent: string }) {
  const [items, setItems] = useState<TargetListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [openTargetId, setOpenTargetId] = useState<string | null>(null);
  const [center, setCenter] = useState<GeoPoint | null>(null);
  const [centerError, setCenterError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogStatusDTO | null>(null);
  const [catalogHidden, setCatalogHidden] = useState(false);
  const [liveCounters, setLiveCounters] = useState<LiveCountersDTO | null>(null);
  const filtersReadyRef = useRef(false);
  const listOffsetRef = useRef(0);
  const PAGE_SIZE = 250;
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Persistenz — Filter über Reloads hinweg
  useEffect(() => {
    setFilters(readStoredFilters());
    filtersReadyRef.current = true;
  }, []);
  useEffect(() => {
    if (!filtersReadyRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      /* noop */
    }
  }, [filters]);

  // Stadt → Koordinaten (debounced)
  useEffect(() => {
    const city = filters.city.trim();
    if (!city) {
      setCenter(null);
      setCenterError(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/sales/targets/geocode?city=${encodeURIComponent(city)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { point: GeoPoint };
          if (!cancelled) {
            setCenter(data.point);
            setCenterError(null);
          }
        } else {
          if (!cancelled) {
            setCenter(null);
            setCenterError("Stadt nicht auflösbar");
          }
        }
      } catch {
        if (!cancelled) setCenterError("Geocoding fehlgeschlagen");
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filters.city]);

  const buildListParams = useCallback(
    (offset: number, limit: number): URLSearchParams => {
      const p = new URLSearchParams();
      if (filters.q) p.set("q", filters.q);
      if (filters.industries.length > 0) p.set("industry", filters.industries.join(","));
      if (filters.priority) p.set("priority", filters.priority);
      if (filters.minScore !== null) p.set("minScore", String(filters.minScore));
      if (filters.hasWebsite) p.set("hasWebsite", "1");
      if (filters.hasPhone) p.set("hasPhone", "1");
      if (filters.hasEmail) p.set("hasEmail", "1");
      if (filters.hasDm) p.set("hasDm", "1");
      if (filters.weakWebsite) p.set("weakWebsite", "1");
      if (filters.softwareOpp) p.set("softwareOpp", "1");
      if (filters.sort) p.set("sort", filters.sort);
      if (center) {
        p.set("centerLat", String(center.lat));
        p.set("centerLng", String(center.lng));
        p.set("centerRadiusKm", String(filters.radiusKm));
      }
      p.set("limit", String(limit));
      p.set("offset", String(offset));
      return p;
    },
    [filters, center]
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    listOffsetRef.current = 0;
    try {
      const params = buildListParams(0, PAGE_SIZE);
      const res = await fetch(`/api/admin/sales/targets?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: TargetListItemDTO[] };
      const arr = data.items ?? [];
      setItems(arr);
      setHasMore(arr.length === PAGE_SIZE);
    } catch (err) {
      setError((err as Error).message);
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [buildListParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextOffset = listOffsetRef.current + PAGE_SIZE;
      const params = buildListParams(nextOffset, PAGE_SIZE);
      const res = await fetch(`/api/admin/sales/targets?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: TargetListItemDTO[] };
      const arr = data.items ?? [];
      setItems((prev) => [...prev, ...arr]);
      listOffsetRef.current = nextOffset;
      setHasMore(arr.length === PAGE_SIZE);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }, [buildListParams, hasMore, loadingMore]);

  // Auto-Load, sobald Filter/Center wechseln
  useEffect(() => {
    if (!filtersReadyRef.current) return;
    void load();
  }, [load]);

  // ── Katalog-Status ───────────────────────────────────────────────
  // Reine Statusabfrage gegen PostgreSQL: wie weit ist der serverseitige
  // Aufbau, ist der Katalog veröffentlicht. Der Browser stösst nichts an
  // und arbeitet nichts ab — er zeigt nur an, was der Worker tut.
  const catalogBuilding = Boolean(
    catalog && catalog.publishState !== "PUBLISHED" && catalog.progress && catalog.progress.done < catalog.progress.total
  );

  useEffect(() => {
    let cancelled = false;
    let stop = false;

    async function poll() {
      try {
        const res = await fetch("/api/admin/sales/targets/catalog", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as CatalogStatusDTO;
        if (cancelled) return;
        setCatalog(data);
        // Fertig und veröffentlicht: kein weiteres Polling nötig.
        if (data.publishState === "PUBLISHED" && (!data.progress || data.progress.done >= data.progress.total)) {
          stop = true;
        }
      } catch {
        /* silent */
      }
    }

    void poll();
    const iv = setInterval(() => {
      if (stop) return;
      void poll();
    }, 8000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  // Während der Katalog wächst, die Liste periodisch nachladen.
  useEffect(() => {
    if (!catalogBuilding) return;
    const iv = setInterval(() => void load(), 10000);
    return () => clearInterval(iv);
  }, [catalogBuilding, load]);

  // ── Live-Counter ────────────────────────────────────────────────
  // Sehr günstiger Poll: nur COUNTs, keine Rows. Während der Katalog
  // aufgebaut wird häufiger, danach als leichte Aktualisierung.
  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      const p = new URLSearchParams();
      if (filters.industries.length > 0) p.set("industry", filters.industries.join(","));
      if (center) {
        p.set("centerLat", String(center.lat));
        p.set("centerLng", String(center.lng));
        p.set("centerRadiusKm", String(filters.radiusKm));
      }
      try {
        const res = await fetch(`/api/admin/sales/targets/count?${p.toString()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as LiveCountersDTO;
        if (!cancelled) setLiveCounters(data);
      } catch {
        /* silent */
      }
    }
    void fetchCount();
    const iv = setInterval(fetchCount, catalogBuilding ? 5000 : 20000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [center, filters.radiusKm, filters.industries, catalogBuilding]);

  const listTotals = useMemo(() => {
    // Fallback für Client-seitige Auswertung (falls der Live-Counter
    // temporär nicht verfügbar ist).
    const total = items.length;
    const hot = items.filter((i) => i.leadScore && (i.leadScore.priorityClass === "A+" || i.leadScore.priorityClass === "A")).length;
    const withBrief = items.filter((i) => Boolean(i.salesBrief)).length;
    const withDm = items.filter((i) => i.decisionMakerCount > 0).length;
    return { total, hot, withBrief, withDm };
  }, [items]);

  // Server-Live-Counter bevorzugen — spiegelt den echten Postgres-Stand,
  // nicht nur die aktuell gerenderte Page.
  const totals = liveCounters
    ? {
        total: liveCounters.total,
        hot: liveCounters.hot,
        withBrief: liveCounters.withBrief,
        withDm: liveCounters.withDm,
      }
    : listTotals;

  const runningEnrichment = (liveCounters?.enrichmentQueued ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Vertrieb / Intelligence</div>
          <h2 className="text-lg font-semibold text-white">Zielkunden-Cockpit</h2>
        </div>
        <div className="flex items-center gap-3">
          <LivePulse
            accent={accent}
            city={center?.city ?? filters.city}
            radius={filters.radiusKm}
            discovering={catalogBuilding}
            catalogLabel={catalog?.scope?.label ?? null}
            enriching={runningEnrichment}
            enrichmentQueued={liveCounters?.enrichmentQueued ?? 0}
          />
          <button onClick={() => void load()} className={buttonSecondary} disabled={loading}>
            {loading ? "Lädt…" : "Aktualisieren"}
          </button>
        </div>
      </div>

      {/* Persistente Location-Bar (Stadt · Radius · Branchen) */}
      <LocationBar
        filters={filters}
        onChange={setFilters}
        center={center}
        centerError={centerError}
        accent={accent}
      />

      {/* KPIs — echte Postgres-Zähler, nicht die aktuell gerenderte Page */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Zielkunden gesamt" value={totals.total} />
        <Kpi label="Priorität A+/A" value={totals.hot} accent={accent} />
        <Kpi label="Mit Sales Brief" value={totals.withBrief} />
        <Kpi label="Entscheider bekannt" value={totals.withDm} />
      </div>

      {/* Katalog-Fortschritt — nur solange der Server noch aufbaut.
          Reine Anzeige; der Aufbau läuft unabhängig vom Browser. */}
      {catalog && !catalogHidden && catalogBuilding && (
        <CatalogProgress catalog={catalog} accent={accent} onClose={() => setCatalogHidden(true)} />
      )}

      {/* Intelligence-Quality-Strip */}
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
        <Section title={catalogBuilding ? "Katalog wird aufgebaut" : "Keine Treffer für diese Auswahl"}>
          <EmptyState
            title={
              catalogBuilding
                ? `${catalog?.scope?.label ?? "Region"} wird erfasst — ${catalog?.discoveredCount ?? 0} Firmen gespeichert`
                : "Keine Firmen im gewählten Ausschnitt"
            }
            hint={
              catalogBuilding
                ? "Der Aufbau läuft serverseitig weiter, auch wenn du diese Seite schließt. Neue Firmen erscheinen automatisch."
                : `Der Katalog enthält ${totals.total} Firmen. Erweitere den Radius oder entferne Filter, um mehr zu sehen.`
            }
          />
        </Section>
      )}
      {items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {items.map((it) => (
              <TargetCard key={it.target.id} item={it} accent={accent} onOpen={() => setOpenTargetId(it.target.id)} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => void loadMore()}
                className={buttonSecondary}
                disabled={loadingMore}
              >
                {loadingMore ? "Lädt weitere…" : `Weitere ${PAGE_SIZE} Firmen laden`}
              </button>
            </div>
          )}
        </>
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
/*  Live-Pulse (ambient status im Header)                                     */
/* -------------------------------------------------------------------------- */

function LivePulse({
  accent,
  city,
  radius,
  discovering,
  catalogLabel,
  enriching,
  enrichmentQueued,
}: {
  accent: string;
  city: string;
  radius: number;
  discovering: boolean;
  catalogLabel: string | null;
  enriching: boolean;
  enrichmentQueued: number;
}) {
  const active = discovering || enriching;
  const label = discovering
    ? `Katalog wird aufgebaut · ${catalogLabel ?? "Region"}`
    : enriching
      ? `Analyse läuft · ${enrichmentQueued} Firmen in der Queue`
      : `Bereit · ${city} · ${radius} km`;
  return (
    <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 md:inline-flex">
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${
          active ? "" : "bg-white/40"
        }`}
        style={active ? { backgroundColor: accent } : undefined}
      >
        {active && (
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{ backgroundColor: accent, opacity: 0.5 }}
          />
        )}
      </span>
      <span className="text-[11px] text-white/70">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Location Bar (Stadt · Radius · Branchen)                                  */
/* -------------------------------------------------------------------------- */

function LocationBar({
  filters,
  onChange,
  center,
  centerError,
  accent,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  center: GeoPoint | null;
  centerError: string | null;
  accent: string;
}) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });
  const toggleIndustry = (i: string) => {
    const has = filters.industries.includes(i);
    onChange({ ...filters, industries: has ? filters.industries.filter((x) => x !== i) : [...filters.industries, i] });
  };
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Suchregion</div>
        <div className="text-[11px] text-white/50">
          {center ? (
            <>
              <span className="text-white/70">{center.city}</span>
              <span className="mx-1">·</span>
              <span>
                {center.lat.toFixed(3)}, {center.lng.toFixed(3)}
              </span>
              <span className="mx-1">·</span>
              <span className="text-white/40">
                {center.source === "static" ? "cache" : center.source}
              </span>
            </>
          ) : centerError ? (
            <span className="text-red-300">{centerError}</span>
          ) : (
            <span className="text-white/40">geokodiere…</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-4">
          <Field label="Stadt">
            <input
              value={filters.city}
              onChange={(e) => set("city", e.target.value)}
              className={inputClasses}
              placeholder="z. B. Unna, Dortmund, Berlin"
            />
          </Field>
        </div>
        <div className="col-span-12 md:col-span-4">
          <Field label={`Radius: ${filters.radiusKm} km`}>
            <input
              type="range"
              min={1}
              max={250}
              step={1}
              value={filters.radiusKm}
              onChange={(e) => set("radiusKm", Number(e.target.value))}
              className="w-full accent-white"
              style={{ accentColor: accent }}
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/40">
              <span>1</span>
              <span>25</span>
              <span>50</span>
              <span>100</span>
              <span>250 km</span>
            </div>
          </Field>
        </div>
        <div className="col-span-12 md:col-span-4">
          <Field label="Branchen (Discovery)">
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRY_OPTIONS.map((i) => {
                const active = filters.industries.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleIndustry(i)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                      active
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/[0.06] bg-white/[0.03] text-white/60 hover:text-white/90"
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Area Progress (Live-Fortschritt der Tile-Discovery)                       */
/* -------------------------------------------------------------------------- */

function CatalogProgress({
  catalog,
  accent,
  onClose,
}: {
  catalog: CatalogStatusDTO;
  accent: string;
  onClose: () => void;
}) {
  const p = catalog.progress;
  const pct = p?.pct ?? 0;
  const problem = Boolean(catalog.firstError) || (p != null && p.failed > 0 && p.failed === p.total);
  const failedChecks = (catalog.qualityReport?.checks ?? []).filter((c) => !c.passed);
  return (
    <div
      className={`rounded-2xl border p-4 ${
        problem ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-white/[0.08] bg-black/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            {problem ? "Katalogaufbau mit Problemen" : "Katalog wird aufgebaut"}
          </div>
          <div className="mt-1 text-sm font-medium text-white">
            {catalog.scope?.label ?? "Region"}
            {p ? ` · ${p.total} Segmente` : ""}
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Firmen gespeichert</div>
            <div className="text-2xl font-semibold" style={{ color: problem ? "#fbbf24" : accent }}>
              {catalog.discoveredCount}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60 hover:text-white"
          >
            ausblenden
          </button>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(3, pct)}%`, backgroundColor: problem ? "#fbbf24" : accent }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/60">
        {p && (
          <>
            <span>
              Fortschritt: {pct}% ({p.done}/{p.total})
            </span>
            <span>Aktiv: {p.running}</span>
            <span>Wartend: {p.queued}</span>
            {p.failed > 0 && <span className="text-red-300">Fehler: {p.failed}</span>}
          </>
        )}
        <span>Status: {catalog.publishState === "PUBLISHED" ? "veröffentlicht" : "Entwurf"}</span>
        <span className="text-white/45">Läuft serverseitig weiter — Fenster kann geschlossen werden.</span>
      </div>
      {failedChecks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Freigabe offen:</span>
          {failedChecks.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200"
            >
              {c.label}: {c.actual}
              {c.unit === "percent" ? "%" : ""} / {c.required}
              {c.unit === "percent" ? "%" : ""}
            </span>
          ))}
        </div>
      )}
      {catalog.firstError && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/[0.08] p-3 text-xs text-red-100">
          <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-red-200/80">Fehlermeldung des Providers</div>
          <div className="font-mono text-[12px] leading-relaxed">{catalog.firstError}</div>
        </div>
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <Field label="Suche in Liste">
            <input
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Firma, Stadt, Branche…"
              className={inputClasses}
            />
          </Field>
        </div>
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
  const budgetMin = salesBrief?.projectValueMinCents ?? leadScore?.estimatedBudgetMinCents ?? null;
  const budgetMax = salesBrief?.projectValueMaxCents ?? leadScore?.estimatedBudgetMaxCents ?? null;
  const projectValue = budgetMin && budgetMax ? `${eur(budgetMin)} – ${eur(budgetMax)}` : null;
  const capacityClass = leadScore?.capacityClass ?? salesBrief?.capacityClass ?? null;
  const capacityConfidence = leadScore?.capacityConfidence ?? salesBrief?.capacityConfidence ?? null;

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
            {(() => {
              const cat = normalizeCategoryFromRawIndustry(target.industry);
              const category = cat.category !== "Sonstige" ? cat.category : target.industry;
              const sub = target.subIndustry ?? cat.subCategory;
              const catLine = [category, sub].filter(Boolean).join(" · ");
              return [catLine, target.city, distance].filter(Boolean).join(" · ");
            })()}
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

      {(projectValue || capacityClass) && (
        <div
          className="mt-3 rounded-xl border border-white/[0.08] p-3"
          style={{ background: `linear-gradient(135deg, ${accent}10, transparent 60%)` }}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Erwarteter Projektwert</span>
            {capacityClass && (
              <span className="text-[10px] text-white/50">
                {capacityClass}
                {capacityConfidence != null && (
                  <span className="ml-1 text-white/40">· Conf {(capacityConfidence * 100).toFixed(0)}%</span>
                )}
              </span>
            )}
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            {projectValue ?? <span className="text-white/40">—</span>}
          </div>
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
