"use client";

/**
 * Rechnungs-Kontrollzentrum.
 *
 * Vereint die vier operativen Ansichten unter einem Chrome: Übersicht mit
 * KPIs und Liste, Detail/Editor mit Live-Preview, Billing Queue der
 * Folgerechnungen und Einstellungen für Aussteller inkl. Nummernkreis.
 *
 * Statt eines Tab-Reifens wechseln die Sichten oben in einer Segmented
 * Control — das passt zum bestehenden Dark-Admin und kostet keine Route.
 * Das Öffnen einer einzelnen Rechnung schaltet die interne Sicht auf
 * „detail"; ein Zurück-Button und ein URL-Fragment (##inv-…) halten die
 * Navigation intuitiv.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import BillingList from "./BillingList";
import BillingEditor from "./BillingEditor";
import BillingQueue from "./BillingQueue";
import BillingSettings from "./BillingSettings";
import NewInvoiceModal from "./NewInvoiceModal";
import type {
  InvoiceDetail,
  InvoiceSummary,
  IssuerInfo,
  ProjectOption,
  QueueEntry,
  StatsResponse,
} from "./shared";
import { formatEUR } from "@/lib/billing/uiModel";

type View = "list" | "queue" | "settings" | "detail";

export default function BillingCenter({ accent }: { accent: string }) {
  const [view, setView] = useState<View>("list");
  const [issuers, setIssuers] = useState<IssuerInfo[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [stats, setStats] = useState<StatsResponse["stats"] | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    invoice: InvoiceDetail;
    documents: { id: string; kind: string; filename: string; validationStatus: string; specVersion: string | null }[];
    relations?: {
      original: {
        id: string;
        invoiceNumber: string | null;
        status: InvoiceDetail["status"];
        type: string;
        invoiceDate: string;
        grossCents: number;
        currency: string;
      } | null;
      corrections: {
        id: string;
        invoiceNumber: string | null;
        status: InvoiceDetail["status"];
        type: string;
        invoiceDate: string;
        grossCents: number;
        currency: string;
      }[];
    };
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/billing/stats", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as StatsResponse;
    setStats(data.stats);
    setIssuers(data.issuers);
    setProjects(data.projects);
  }, []);

  const loadList = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/admin/billing/invoices?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { entries: InvoiceSummary[]; nextCursor: string | null };
    setInvoices((prev) => (cursor ? [...prev, ...data.entries] : data.entries));
    setNextCursor(data.nextCursor);
  }, []);

  const loadQueue = useCallback(async () => {
    const res = await fetch("/api/admin/billing/queue", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { queue: QueueEntry[] };
    setQueue(data.queue);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadStats(), loadList(), loadQueue()]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadStats, loadList, loadQueue]);

  const loadDetail = useCallback(async (id: string, silent = false) => {
    // Beim initialen Öffnen zeigen wir den Ladehinweis; bei Silent-
    // Reloads (nach Autosave) bleiben Editor + Inputs unverändert
    // sichtbar. Sonst würde jeder Autosave-Reload alle Formularfelder
    // aus dem DOM räumen und der User "springt raus".
    if (!silent) setDetailLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/billing/invoices/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Rechnung konnte nicht geladen werden.");
      const data = (await res.json()) as {
        invoice: InvoiceDetail;
        documents: { id: string; kind: string; filename: string; validationStatus: string; specVersion: string | null }[];
        relations?: {
          original: {
            id: string;
            invoiceNumber: string | null;
            status: InvoiceDetail["status"];
            type: string;
            invoiceDate: string;
            grossCents: number;
            currency: string;
          } | null;
          corrections: {
            id: string;
            invoiceNumber: string | null;
            status: InvoiceDetail["status"];
            type: string;
            invoiceDate: string;
            grossCents: number;
            currency: string;
          }[];
        };
      };
      setDetail({ invoice: data.invoice, documents: data.documents, relations: data.relations });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (!silent) setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "detail" && selectedInvoiceId) {
      void loadDetail(selectedInvoiceId);
    } else {
      setDetail(null);
    }
  }, [view, selectedInvoiceId, loadDetail]);

  const openInvoice = useCallback((id: string) => {
    setSelectedInvoiceId(id);
    setView("detail");
  }, []);

  const createFromQueue = useCallback(async () => {
    setBusy("queue");
    setError(null);
    try {
      const res = await fetch("/api/admin/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "queue" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erstellung fehlgeschlagen");
      openInvoice(data.invoice.id);
      await Promise.all([loadStats(), loadList()]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [loadList, loadStats, openInvoice]);

  const createFromProject = useCallback(
    async (projectId: string) => {
      setBusy(`project-${projectId}`);
      setError(null);
      try {
        const res = await fetch("/api/admin/billing/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "project", projectId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erstellung fehlgeschlagen");
        openInvoice(data.invoice.id);
        await Promise.all([loadStats(), loadList()]);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [loadList, loadStats, openInvoice]
  );

  const agiWorks = issuers.find((i) => i.key === "agiworks");
  const nexcel = issuers.find((i) => i.key === "nexcel");

  return (
    <div className="space-y-6">
      {/* Kopfleiste mit Segment-Nav und schnellem Zugriff auf die nächste Nummer */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Rechnungen</h2>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Rechnungsstellung, Folgerechnungen, E-Rechnung und Archiv – vollständig integriert.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#9CA3AF]">
            {agiWorks && (
              <NextNumberChip label={agiWorks.label} accent={agiWorks.accent} next={agiWorks.nextNumber} />
            )}
            {nexcel && (
              <NextNumberChip label={nexcel.label} accent={nexcel.accent} next={nexcel.nextNumber} />
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentBar
            value={view === "detail" ? "list" : view}
            onChange={(v) => {
              setView(v);
              if (v === "list") setSelectedInvoiceId(null);
            }}
          />
          <button
            onClick={createFromQueue}
            disabled={busy === "queue"}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-[#D1D5DB] hover:bg-white/[0.06] disabled:opacity-50"
            title="Nächste geplante Folgerechnung aus der Queue erstellen"
          >
            {busy === "queue" ? "…" : "Nächste Folgerechnung"}
          </button>
          <button
            onClick={() => setShowNewInvoice(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{ background: accent, boxShadow: `0 0 16px ${accent}66` }}
          >
            + Neue Rechnung
          </button>
        </div>
      </div>

      {/* Warnungen aus der Aussteller-Konfiguration sichtbar machen */}
      {issuers.some((i) => i.configWarnings.length > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 text-xs text-amber-200">
          {issuers
            .filter((i) => i.configWarnings.length > 0)
            .map((i) => (
              <div key={i.id} className="flex flex-col gap-1 py-1">
                <span className="font-semibold text-amber-100">{i.label}</span>
                {i.configWarnings.map((w, idx) => (
                  <span key={idx}>{w}</span>
                ))}
              </div>
            ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {view === "list" && (
        <>
          <KpiRow stats={stats} loading={loading} />
          <BillingList
            invoices={invoices}
            loading={loading}
            hasMore={!!nextCursor}
            onLoadMore={() => nextCursor && loadList(nextCursor)}
            onOpen={openInvoice}
            projects={projects}
            issuers={issuers}
          />
        </>
      )}

      {view === "queue" && (
        <BillingQueue
          queue={queue}
          projects={projects}
          issuers={issuers}
          onCreate={createFromProject}
          onReload={loadQueue}
          busy={busy}
        />
      )}

      {view === "settings" && (
        <BillingSettings issuers={issuers} onReload={loadStats} />
      )}

      {view === "detail" && selectedInvoiceId && (
        <BillingEditor
          loading={detailLoading}
          detail={detail}
          onClose={() => {
            setSelectedInvoiceId(null);
            setView("list");
          }}
          onChanged={async () => {
            // silent=true → detailLoading bleibt false, Editor bleibt
            // gerendert, User verliert weder Fokus noch Zwischenstand.
            await Promise.all([
              loadDetail(selectedInvoiceId, true),
              loadStats(),
              loadList(),
            ]);
          }}
          onOpen={openInvoice}
          projects={projects}
          issuers={issuers}
        />
      )}

      {showNewInvoice && (
        <NewInvoiceModal
          issuers={issuers}
          accent={accent}
          onCancel={() => setShowNewInvoice(false)}
          onCreated={async (id) => {
            setShowNewInvoice(false);
            openInvoice(id);
            await Promise.all([loadStats(), loadList()]);
          }}
        />
      )}
    </div>
  );
}

function SegmentBar({
  value,
  onChange,
}: {
  value: "list" | "queue" | "settings";
  onChange: (v: "list" | "queue" | "settings") => void;
}) {
  const items: [string, "list" | "queue" | "settings"][] = [
    ["Übersicht", "list"],
    ["Folgerechnungen", "queue"],
    ["Einstellungen", "settings"],
  ];
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
      {items.map(([label, id]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === id ? "bg-white/10 text-white" : "text-[#9CA3AF] hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function NextNumberChip({ label, accent, next }: { label: string; accent: string; next: number }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
      style={{ borderColor: `${accent}55`, background: `${accent}18` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      <span className="text-[#9CA3AF]">Nächste {label}-Rechnung:</span>
      <span className="font-semibold text-white">Nr. {next}</span>
    </span>
  );
}

function KpiRow({ stats, loading }: { stats: StatsResponse["stats"] | null; loading: boolean }) {
  const rows: { label: string; value: string; hint?: string; accent: string }[] = [
    {
      label: "Offen",
      value: loading || !stats ? "–" : String(stats.open),
      hint: "Finalisiert bis überfällig",
      accent: "#5BB8FF",
    },
    {
      label: "Überfällig",
      value: loading || !stats ? "–" : String(stats.overdue),
      hint: "Fälligkeit überschritten",
      accent: "#EF4444",
    },
    {
      label: "Bezahlt",
      value: loading || !stats ? "–" : String(stats.paid),
      hint: "Ausgeglichen",
      accent: "#22C55E",
    },
    {
      label: "Entwürfe",
      value: loading || !stats ? "–" : String(stats.drafts),
      hint: "Noch nicht finalisiert",
      accent: "#94A3B8",
    },
    {
      label: "Umsatz laufender Monat",
      value: loading || !stats ? "–" : formatEUR(stats.currentMonthRevenueCents),
      hint: "Basis: Finalisierungsdatum",
      accent: "#A45CFF",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {rows.map((r) => (
        <div
          key={r.label}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div className="text-[10px] font-medium uppercase tracking-widest text-[#6B7280]">
            {r.label}
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums text-white">
            {r.value}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.accent }} />
            <span>{r.hint}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
