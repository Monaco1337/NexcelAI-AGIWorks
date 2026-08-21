"use client";

/**
 * Rechnungsliste.
 *
 * Bewusst dicht: eine Zeile enthält Nummer, Kunde, Projekt, Aussteller,
 * Leistungszeitraum, Datum, Fälligkeit, Betrag, Status und den Zustand der
 * E-Rechnung. Wer nichts sucht, findet trotzdem alles Wichtige beim
 * Überfliegen.
 */

import { useMemo, useState } from "react";
import {
  INVOICE_STATUS_COLOR,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUSES,
  formatDeDate,
  formatEUR,
  type InvoiceStatus,
} from "@/lib/billing/uiModel";
import type { InvoiceSummary, IssuerInfo, ProjectOption } from "./shared";

interface Filters {
  q: string;
  status: InvoiceStatus | "all";
  issuerId: string | "all";
  projectId: string | "all";
}

export default function BillingList({
  invoices,
  loading,
  hasMore,
  onLoadMore,
  onOpen,
  projects,
  issuers,
}: {
  invoices: InvoiceSummary[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onOpen: (id: string) => void;
  projects: ProjectOption[];
  issuers: IssuerInfo[];
}) {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    status: "all",
    issuerId: "all",
    projectId: "all",
  });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filters.status !== "all" && inv.status !== filters.status) return false;
      if (filters.issuerId !== "all" && inv.issuer.id !== filters.issuerId) return false;
      if (filters.projectId !== "all" && inv.project.id !== filters.projectId) return false;
      if (!q) return true;
      return (
        (inv.invoiceNumber ?? "").toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        (inv.project.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [invoices, filters]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 md:flex-row md:items-center">
        <input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Suchen (Nummer, Kunde, Projekt)…"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Filters["status"] }))}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="all">Alle Status</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>{INVOICE_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <select
          value={filters.issuerId}
          onChange={(e) => setFilters((f) => ({ ...f, issuerId: e.target.value }))}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="all">Alle Aussteller</option>
          {issuers.map((i) => (
            <option key={i.id} value={i.id}>{i.label}</option>
          ))}
        </select>
        <select
          value={filters.projectId}
          onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="all">Alle Projekte</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.05] text-left text-[10px] uppercase tracking-widest text-[#6B7280]">
              <th className="px-4 py-3">Nummer</th>
              <th className="px-4 py-3">Kunde</th>
              <th className="px-4 py-3">Projekt</th>
              <th className="px-4 py-3">Aussteller</th>
              <th className="px-4 py-3">Zeitraum</th>
              <th className="px-4 py-3">Rechnungsdatum</th>
              <th className="px-4 py-3">Fällig</th>
              <th className="px-4 py-3 text-right">Betrag</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">E-Rechnung</th>
            </tr>
          </thead>
          <tbody>
            {loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-xs text-[#6B7280]">Lade…</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-xs text-[#6B7280]">
                  Keine Rechnungen in der Auswahl.
                </td>
              </tr>
            )}
            {filtered.map((inv) => {
              const color = INVOICE_STATUS_COLOR[inv.status];
              return (
                <tr
                  key={inv.id}
                  onClick={() => onOpen(inv.id)}
                  className="cursor-pointer border-b border-white/[0.03] transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{inv.invoiceNumber ?? "Entwurf"}</span>
                      {inv.type !== "invoice" && (
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9CA3AF]">
                          {typeLabel(inv.type)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#E5E7EB]">{inv.customer.name || "—"}</td>
                  <td className="px-4 py-3">
                    {inv.project.name ? (
                      <span className="inline-flex items-center gap-2 text-[#E5E7EB]">
                        <span className="h-2 w-2 rounded-full" style={{ background: inv.project.color ?? "#666" }} />
                        {inv.project.name}
                      </span>
                    ) : (
                      <span className="text-[#6B7280]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#E5E7EB]">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: inv.issuer.accent }} />
                      {inv.issuer.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#9CA3AF]">{inv.servicePeriod.label || "—"}</td>
                  <td className="px-4 py-3 text-xs text-[#E5E7EB] tabular-nums">{formatDeDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 text-xs text-[#E5E7EB] tabular-nums">{formatDeDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                    {formatEUR(inv.totals.grossCents, inv.totals.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <EInvoiceBadge status={inv.eInvoiceStatus} has={inv.hasEInvoice} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="border-t border-white/[0.05] p-3 text-center">
          <button
            onClick={onLoadMore}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-1.5 text-xs text-white hover:bg-white/[0.06]"
          >
            Weitere laden
          </button>
        </div>
      )}
    </div>
  );
}

function typeLabel(type: string): string {
  switch (type) {
    case "correction": return "Korrektur";
    case "credit_note": return "Gutschrift";
    case "advance": return "Abschlag";
    case "final": return "Schluss";
    default: return type;
  }
}

function EInvoiceBadge({
  status,
  has,
}: {
  status: "unchecked" | "valid" | "invalid" | "missing" | "warnings";
  has: boolean;
}) {
  if (!has) return <span className="text-[#6B7280]">—</span>;
  const map = {
    valid: { label: "gültig", color: "#22C55E" },
    warnings: { label: "Warnungen", color: "#F59E0B" },
    invalid: { label: "ungültig", color: "#EF4444" },
    unchecked: { label: "ungeprüft", color: "#94A3B8" },
    missing: { label: "fehlt", color: "#6B7280" },
  } as const;
  const meta = map[status] || map.unchecked;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
      style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
