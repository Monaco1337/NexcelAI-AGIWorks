"use client";

/**
 * Zielkunden-/Firmenliste mit ICP-Klassifizierung.
 */

import { useCallback, useEffect, useState } from "react";
import {
  CLASSIFICATION_LABEL,
  SALES_STATUS_LABEL,
  formatDateTimeDe,
  formatEuroFromCents,
  NEXT_ACTION_LABEL,
  type SalesClassification,
  type SalesCompany,
  type SalesStatus,
} from "./shared";
import {
  ClassificationBadge,
  EmptyState,
  StatusPill,
  buttonSecondary,
  inputClasses,
  selectClasses,
} from "./HelperUI";

export default function CompanyList({
  accent,
  onOpenCompany,
  refreshKey,
}: {
  accent: string;
  onOpenCompany: (id: string) => void;
  refreshKey?: number;
}) {
  const [companies, setCompanies] = useState<SalesCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<SalesClassification | "">("");
  const [statusFilter, setStatusFilter] = useState<SalesStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (classFilter) params.set("class", classFilter);
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/admin/sales/companies?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { companies: SalesCompany[] };
        setCompanies(data.companies);
      }
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Firma, Website oder Ort suchen…"
          className={`${inputClasses} max-w-md`}
        />
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value as typeof classFilter)} className={`${selectClasses} w-auto`}>
          <option value="">Alle Klassifizierungen</option>
          {(["A", "B", "C", "D"] as SalesClassification[]).map((c) => (
            <option key={c} value={c}>{CLASSIFICATION_LABEL[c]}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={`${selectClasses} w-auto`}>
          <option value="">Alle Stati</option>
          {(Object.keys(SALES_STATUS_LABEL) as SalesStatus[]).map((s) => (
            <option key={s} value={s}>{SALES_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button onClick={load} className={`${buttonSecondary} ml-auto`}>Aktualisieren</button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/50">Firmen laden…</div>
      ) : companies.length === 0 ? (
        <EmptyState title="Noch keine Firmen." hint="Lege eine neue Firma an oder importiere Ziele über das Lead-Research." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-2 text-left w-10">Klasse</th>
                <th className="px-4 py-2 text-left">Firma</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Nächster Schritt</th>
                <th className="px-4 py-2 text-right">Erwartet</th>
                <th className="px-4 py-2 text-left">Fällig</th>
                <th className="px-4 py-2 text-right">Opps</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onOpenCompany(c.id)}
                  className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-2"><ClassificationBadge value={c.classification} /></td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-white/90">{c.name}</div>
                    {c.city && <div className="text-[11px] text-white/45">{c.city}</div>}
                  </td>
                  <td className="px-4 py-2"><StatusPill value={c.status} /></td>
                  <td className="px-4 py-2 text-xs text-white/70">
                    {c.nextAction ? NEXT_ACTION_LABEL[c.nextAction] : "—"}
                    {c.nextActionDueAt && (
                      <div className="text-[11px] text-white/40">{formatDateTimeDe(c.nextActionDueAt)}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-white/70">{formatEuroFromCents(c.expectedValueCents)}</td>
                  <td className="px-4 py-2 text-white/50">{formatDateTimeDe(c.nextActionDueAt)}</td>
                  <td className="px-4 py-2 text-right text-white/60">
                    <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px]">{c.openOpportunityCount}/{c.opportunityCount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
