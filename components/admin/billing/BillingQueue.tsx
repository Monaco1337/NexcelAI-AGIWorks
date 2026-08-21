"use client";

/**
 * Billing Queue – Abrechnungsreihenfolge der Projekte.
 *
 * Wir setzen bewusst kein externes DnD-Framework ein, um den Bundle klein
 * zu halten: die kleine Pfeil-basierte Reihenfolge reicht für die
 * überschaubare Zahl aktiver Projekte, ist tastaturbedienbar und robust
 * gegen Rendering-Kanten. Bei Bedarf lässt sich der Handler `move` gegen
 * eine Drag-Bibliothek austauschen, ohne die Datenschnittstelle zu ändern.
 */

import { useCallback, useEffect, useState } from "react";
import { formatDeDate } from "@/lib/billing/uiModel";
import type { IssuerInfo, ProjectOption, QueueEntry } from "./shared";
import {
  BILLING_FREQUENCY_LABEL,
  type BillingFrequency,
} from "@/lib/billing/uiModel";

export default function BillingQueue({
  queue,
  projects,
  issuers,
  onCreate,
  onReload,
  busy,
}: {
  queue: QueueEntry[];
  projects: ProjectOption[];
  issuers: IssuerInfo[];
  onCreate: (projectId: string) => Promise<void>;
  onReload: () => Promise<void>;
  busy: string | null;
}) {
  const [order, setOrder] = useState<QueueEntry[]>(queue);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    setOrder(queue);
    setDirty(false);
  }, [queue]);

  const move = (id: string, direction: -1 | 1) => {
    const idx = order.findIndex((q) => q.projectId === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    const [row] = next.splice(idx, 1);
    next.splice(target, 0, row);
    setOrder(next);
    setDirty(true);
  };

  const persistOrder = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/billing/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: order.map((o) => o.projectId) }),
      });
      if (!res.ok) throw new Error("Reihenfolge konnte nicht gespeichert werden");
      await onReload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [order, onReload]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div>
          <div className="text-sm font-semibold text-white">Folgerechnungen</div>
          <div className="text-xs text-[#9CA3AF]">
            Reihenfolge und Konfiguration je Projekt. Der Klick auf &bdquo;Rechnung erstellen&ldquo; legt
            einen Entwurf für den nächsten Leistungszeitraum an.
          </div>
        </div>
        {dirty && (
          <button
            onClick={persistOrder}
            disabled={saving}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
          >
            {saving ? "Speichere…" : "Reihenfolge speichern"}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="grid grid-cols-[40px_minmax(0,1fr)_180px_160px_160px_170px_120px] border-b border-white/[0.06] px-4 py-2 text-[10px] uppercase tracking-widest text-[#6B7280]">
          <div>#</div>
          <div>Projekt</div>
          <div>Kunde</div>
          <div>Aussteller</div>
          <div>Turnus</div>
          <div>Letzte Rechnung</div>
          <div className="text-right">Aktion</div>
        </div>
        <div>
          {order.length === 0 && (
            <div className="p-6 text-center text-xs text-[#6B7280]">
              Noch keine Projekte konfiguriert.
            </div>
          )}
          {order.map((row, idx) => {
            const canBill = row.billingEnabled && row.issuerId && row.customerId;
            return (
              <div
                key={row.projectId}
                className="grid grid-cols-[40px_minmax(0,1fr)_180px_160px_160px_170px_120px] items-center border-b border-white/[0.03] px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(row.projectId, -1)} className="rounded border border-white/10 px-1 text-[10px] text-[#9CA3AF] hover:text-white">↑</button>
                  <button onClick={() => move(row.projectId, 1)} className="rounded border border-white/10 px-1 text-[10px] text-[#9CA3AF] hover:text-white">↓</button>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-white">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.projectColor ?? "#666" }} />
                    <span className="truncate">{row.projectName}</span>
                    {!row.billingEnabled && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9CA3AF]">deaktiviert</span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-[#6B7280]">Reihenfolge {idx + 1} · {row.projectSlug}</div>
                </div>
                <div className="truncate text-[#E5E7EB]">{row.customerName ?? "—"}</div>
                <div className="truncate text-[#E5E7EB]">{row.issuerLabel ?? "—"}</div>
                <div className="text-[#E5E7EB]">
                  {BILLING_FREQUENCY_LABEL[row.billingFrequency as BillingFrequency] ?? row.billingFrequency}
                </div>
                <div className="text-xs text-[#9CA3AF]">
                  {row.lastInvoiceNumber ? (
                    <>
                      Nr. {row.lastInvoiceNumber} · {row.lastInvoicePeriodLabel ?? ""}
                    </>
                  ) : (
                    "noch keine"
                  )}
                  {row.lastBilledPeriodEnd && (
                    <div className="text-[#6B7280]">bis {formatDeDate(row.lastBilledPeriodEnd)}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => onCreate(row.projectId)}
                    disabled={!canBill || busy === `project-${row.projectId}`}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] text-white hover:bg-white/[0.06] disabled:opacity-40"
                  >
                    {busy === `project-${row.projectId}` ? "…" : "Rechnung erstellen"}
                  </button>
                  <button
                    onClick={() => setEditing((v) => (v === row.projectId ? null : row.projectId))}
                    className="text-[10px] text-[#9CA3AF] hover:text-white"
                  >
                    {editing === row.projectId ? "Details schließen" : "Konfiguration"}
                  </button>
                </div>

                {editing === row.projectId && (
                  <div className="col-span-7 mt-3">
                    <ProjectBillingForm
                      row={row}
                      issuers={issuers}
                      projects={projects}
                      onSaved={async () => {
                        setEditing(null);
                        await onReload();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProjectBillingForm({
  row,
  issuers,
  onSaved,
}: {
  row: QueueEntry;
  issuers: IssuerInfo[];
  projects: ProjectOption[];
  onSaved: () => Promise<void>;
}) {
  const [issuerId, setIssuerId] = useState(row.issuerId ?? "");
  const [customerName, setCustomerName] = useState(row.customerName ?? "");
  const [frequency, setFrequency] = useState<BillingFrequency>(row.billingFrequency as BillingFrequency);
  const [terms, setTerms] = useState(row.billingTerms);
  const [enabled, setEnabled] = useState(row.billingEnabled);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState(row.customerId ?? "");

  useEffect(() => {
    void fetch("/api/admin/billing/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data.customers ?? []))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/billing/queue/${row.projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issuerId,
          customerId,
          billingFrequency: frequency,
          billingTerms: terms,
          billingEnabled: enabled,
        }),
      });
      if (!res.ok) throw new Error("Konnte nicht gespeichert werden");
      await onSaved();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/30 p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">Aussteller</label>
          <select
            value={issuerId}
            onChange={(e) => setIssuerId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">— wählen —</option>
            {issuers.map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">Kunde</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">— wählen —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {customerName && !customerId && <div className="mt-1 text-[10px] text-[#6B7280]">Bisher: {customerName}</div>}
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">Turnus</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="once">Einmalig</option>
            <option value="monthly">Monatlich</option>
            <option value="quarterly">Quartalsweise</option>
            <option value="yearly">Jährlich</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">Zahlungsziel (Tage)</label>
          <input
            type="number"
            value={terms}
            onChange={(e) => setTerms(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-[#E5E7EB]">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Aktiv
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={save} disabled={saving} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 disabled:opacity-50">
            {saving ? "Speichere…" : "Konfiguration speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
