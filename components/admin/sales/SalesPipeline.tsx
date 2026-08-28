"use client";

/**
 * Pipeline-Ansicht: Tabelle + Kanban (umschaltbar).
 * Zeigt Opportunities über Firmen hinweg mit Filtern für Brand-Kontext,
 * Status, Klassifizierung und Suchtext.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BRAND_CONTEXT_LABEL,
  CLASSIFICATION_LABEL,
  PIPELINE_ORDER,
  SALES_STATUS_LABEL,
  SALES_STATUS_COLOR,
  formatEuroFromCents,
  formatDateDe,
  type BrandContext,
  type SalesClassification,
  type SalesOpportunity,
  type SalesStatus,
} from "./shared";
import {
  BrandChip,
  ClassificationBadge,
  EmptyState,
  StatusPill,
  buttonSecondary,
  inputClasses,
  selectClasses,
} from "./HelperUI";

interface Props {
  accent: string;
  onOpenCompany: (companyId: string, opportunityId?: string) => void;
  refreshKey?: number;
}

type ViewMode = "table" | "kanban";

export default function SalesPipeline({ accent, onOpenCompany, refreshKey }: Props) {
  const [mode, setMode] = useState<ViewMode>("table");
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState<"all" | BrandContext>("all");
  const [classFilter, setClassFilter] = useState<SalesClassification | "">("");
  const [statusFilter, setStatusFilter] = useState<SalesStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("open", "1");
    if (search) params.set("q", search);
    if (brand !== "all") params.set("brand", brand);
    if (classFilter) params.set("class", classFilter);
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/admin/sales/opportunities?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { opportunities: SalesOpportunity[] };
        setOpportunities(data.opportunities);
      }
    } finally {
      setLoading(false);
    }
  }, [search, brand, classFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const grouped = useMemo(() => {
    const byStatus: Record<string, SalesOpportunity[]> = {};
    for (const status of PIPELINE_ORDER) byStatus[status] = [];
    for (const o of opportunities) {
      if (byStatus[o.status]) byStatus[o.status].push(o);
    }
    return byStatus;
  }, [opportunities]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche…"
          className={`${inputClasses} max-w-xs`}
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value as typeof brand)} className={`${selectClasses} w-auto`}>
          <option value="all">Alle Marken</option>
          <option value="nexcel">NEXCEL AI</option>
          <option value="agiworks">AGI Works</option>
          <option value="both">Beide</option>
        </select>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value as typeof classFilter)} className={`${selectClasses} w-auto`}>
          <option value="">Alle Klassifizierungen</option>
          {(["A", "B", "C", "D"] as SalesClassification[]).map((c) => (
            <option key={c} value={c}>
              {CLASSIFICATION_LABEL[c]}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={`${selectClasses} w-auto`}>
          <option value="">Alle Stati</option>
          {PIPELINE_ORDER.map((s) => (
            <option key={s} value={s}>
              {SALES_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/[0.08] p-1">
          <button
            type="button"
            onClick={() => setMode("table")}
            className={`rounded-md px-2 py-1 text-xs ${mode === "table" ? "bg-white/[0.08] text-white" : "text-white/60"}`}
          >
            Tabelle
          </button>
          <button
            type="button"
            onClick={() => setMode("kanban")}
            className={`rounded-md px-2 py-1 text-xs ${mode === "kanban" ? "bg-white/[0.08] text-white" : "text-white/60"}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/50">
          Pipeline lädt…
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState title="Noch keine Opportunities." hint="Sobald Firmen den Status 'qualifiziert' oder höher erreichen, erscheinen sie hier." />
      ) : mode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-2 text-left">Firma</th>
                <th className="px-4 py-2 text-left">Titel</th>
                <th className="px-4 py-2 text-left">Marke</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Klasse</th>
                <th className="px-4 py-2 text-right">Erwartet</th>
                <th className="px-4 py-2 text-right">Angebot</th>
                <th className="px-4 py-2 text-left">Fällig</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => onOpenCompany(o.companyId, o.id)}
                  className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-2 font-medium text-white/90">{o.companyName}</td>
                  <td className="px-4 py-2 text-white/70">{o.title}</td>
                  <td className="px-4 py-2"><BrandChip value={o.brandContext} /></td>
                  <td className="px-4 py-2"><StatusPill value={o.status} /></td>
                  <td className="px-4 py-2"><ClassificationBadge value={o.classification} /></td>
                  <td className="px-4 py-2 text-right text-white/70">{formatEuroFromCents(o.expectedValueCents)}</td>
                  <td className="px-4 py-2 text-right text-white/70">{formatEuroFromCents(o.proposalValueCents)}</td>
                  <td className="px-4 py-2 text-white/60">{formatDateDe(o.nextActionDueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE_ORDER.map((status) => (
            <div
              key={status}
              className="w-72 flex-shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold" style={{ color: SALES_STATUS_COLOR[status] }}>
                  {SALES_STATUS_LABEL[status]}
                </div>
                <div className="text-[11px] text-white/40">{grouped[status]?.length ?? 0}</div>
              </div>
              <div className="space-y-2">
                {(grouped[status] ?? []).map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => onOpenCompany(o.companyId, o.id)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-white/[0.14] hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium text-white/90">{o.companyName}</div>
                      <ClassificationBadge value={o.classification} />
                    </div>
                    <div className="mt-1 line-clamp-1 text-[11px] text-white/50">{o.title}</div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
                      <BrandChip value={o.brandContext} />
                      <span>{formatEuroFromCents(o.expectedValueCents)}</span>
                    </div>
                  </button>
                ))}
                {(grouped[status]?.length ?? 0) === 0 && (
                  <div className="rounded-lg border border-dashed border-white/[0.05] py-6 text-center text-[11px] text-white/25">
                    Leer
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={load} className={buttonSecondary}>Aktualisieren</button>
      </div>
    </div>
  );
}
