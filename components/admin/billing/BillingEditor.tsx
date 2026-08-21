"use client";

/**
 * Rechnungs-Editor.
 *
 * Aufbau:
 *   1. Prominenter Status-Header (Bezahlt/Überfällig/Offen/Entwurf sofort
 *      erkennbar, mit Fälligkeitshinweis und Aussteller-Akzentfarbe).
 *   2. Aktions-Toolbar: Speichern, Finalisieren, Bezahlt markieren, Share-Link
 *      generieren, PDF/ZUGFeRD/XRechnung-Downloads, Korrektur, Storno.
 *   3. Metadaten (Datum, Fälligkeit, Leistungszeitraum, Projekt, Buyer-Ref).
 *   4. Positionen mit Drag-&-Drop, Duplizieren, Löschen.
 *   5. Live-Preview als PDF-iframe (Server-gerendert).
 *   6. Dokumentenliste, Ereignisverlauf.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatEUR,
  formatQty,
  formatDeDate,
  parseEuroInput,
  parseQtyInput,
  TAX_CATEGORY_LABEL,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_COLOR,
  type TaxCategory,
  type InvoiceStatus,
} from "@/lib/billing/uiModel";
import type {
  InvoiceDetail,
  InvoiceItem,
  IssuerInfo,
  ProjectOption,
} from "./shared";

interface Detail {
  invoice: InvoiceDetail;
  documents: {
    id: string;
    kind: string;
    filename: string;
    validationStatus: string;
    specVersion: string | null;
  }[];
}

interface ShareTokenView {
  token: string;
  invoiceId: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  allowDownloads: boolean;
  lastAccessedAt: string | null;
  accessCount: number;
  recipientHint: string | null;
}

export default function BillingEditor({
  loading,
  detail,
  onClose,
  onChanged,
  projects,
}: {
  loading: boolean;
  detail: Detail | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
  projects: ProjectOption[];
  issuers: IssuerInfo[];
}) {
  const [dirty, setDirty] = useState<Partial<InvoiceDetail>>({});
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [previewNonce, setPreviewNonce] = useState<number>(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTokens, setShareTokens] = useState<ShareTokenView[]>([]);
  const [copyState, setCopyState] = useState<string>("");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDraft = detail?.invoice.status === "draft" || detail?.invoice.status === "ready_for_review";

  useEffect(() => {
    if (detail) {
      setDirty({});
      setItems(detail.invoice.items);
      setError(null);
      setPreviewNonce((n) => n + 1);
    }
  }, [detail]);

  const loadShareTokens = useCallback(async () => {
    if (!detail) return;
    try {
      const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/share`);
      if (!res.ok) return;
      const data = await res.json();
      setShareTokens(data.tokens || []);
    } catch {
      // best-effort
    }
  }, [detail]);

  useEffect(() => {
    if (shareOpen) void loadShareTokens();
  }, [shareOpen, loadShareTokens]);

  const patch = useCallback(<K extends keyof InvoiceDetail>(key: K, value: InvoiceDetail[K]) => {
    setDirty((d) => ({ ...d, [key]: value }));
  }, []);

  const scheduleAutosave = useCallback(() => {
    if (!isDraft || !detail) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void save(true);
    }, 1200);
  }, [isDraft, detail]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(
    async (silent = false) => {
      if (!detail) return;
      setSaving(true);
      setError(null);
      try {
        const body = {
          version: computeVersion(detail),
          customerId: dirty.customer?.id ?? detail.invoice.customer.id,
          projectId: dirty.project?.id ?? detail.invoice.project?.id ?? null,
          invoiceDate: dirty.invoiceDate ?? detail.invoice.invoiceDate,
          dueDate: dirty.dueDate ?? detail.invoice.dueDate,
          servicePeriod: dirty.servicePeriod ?? detail.invoice.servicePeriod,
          currency: dirty.currency ?? detail.invoice.currency,
          paymentTermsDays: dirty.payment?.paymentTermsDays ?? detail.invoice.payment.paymentTermsDays,
          texts: dirty.texts ?? detail.invoice.texts,
          references: dirty.references ?? detail.invoice.references,
          items: items.map((it) => ({
            title: it.title,
            description: it.description,
            quantityMilli: it.quantityMilli,
            unit: it.unit,
            unitPriceCents: it.unitPriceCents,
            discountPercentMilli: it.discountPercentMilli,
            taxCategory: it.taxCategory,
            taxRatePercentMilli: it.taxRatePercentMilli,
          })),
        };
        const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
        setDirty({});
        if (!silent) setStatus("Gespeichert.");
        setPreviewNonce((n) => n + 1);
        await onChanged();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [detail, dirty, items, onChanged]
  );

  const finalize = useCallback(async () => {
    if (!detail) return;
    if (!confirm("Rechnung finalisieren? Es wird eine endgültige Nummer vergeben und die PDF/E-Rechnung erzeugt.")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: computeVersion(detail) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Finalisierung fehlgeschlagen");
      await onChanged();
      setStatus(`Finalisiert als Rechnung Nr. ${data.invoice.invoiceNumber}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [detail, onChanged]);

  const remove = useCallback(async () => {
    if (!detail) return;
    if (!isDraft) return;
    if (!confirm("Entwurf löschen? Das lässt sich nicht rückgängig machen.")) return;
    const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}`, { method: "DELETE" });
    if (res.ok) {
      onClose();
    }
  }, [detail, isDraft, onClose]);

  const markPaid = useCallback(async () => {
    if (!detail) return;
    const reference = prompt("Zahlungsreferenz (optional):", "") ?? "";
    const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Fehler");
    else {
      setStatus("Als bezahlt markiert.");
      await onChanged();
    }
  }, [detail, onChanged]);

  const createCorrection = useCallback(async () => {
    if (!detail) return;
    const reason = prompt("Grund für die Korrektur:", "") ?? "";
    const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/correction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Fehler");
    else if (data.invoice?.id) window.location.hash = `#inv-${data.invoice.id}`;
  }, [detail]);

  const cancel = useCallback(async () => {
    if (!detail) return;
    const reason = prompt("Grund für Stornierung:", "") ?? "";
    const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Fehler");
    else {
      setStatus("Storniert.");
      await onChanged();
    }
  }, [detail, onChanged]);

  const generateShare = useCallback(async () => {
    if (!detail) return;
    const days = Number(prompt("Ablauf in Tagen (leer = unbegrenzt):", "30") || 0);
    const recipient = prompt("Empfängerhinweis (optional):", "") || "";
    const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expiresInDays: days > 0 ? days : null,
        recipientHint: recipient || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Share fehlgeschlagen");
    setShareTokens((t) => [data.share, ...t]);
    setShareOpen(true);
    const url = `${window.location.origin}/rechnung/${data.share.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("Link kopiert.");
      setTimeout(() => setCopyState(""), 2500);
    } catch {
      // Clipboard nicht verfügbar — Nutzer kann Link manuell markieren.
    }
  }, [detail]);

  const revokeShare = useCallback(
    async (token: string) => {
      if (!detail) return;
      if (!confirm("Diesen Link deaktivieren?")) return;
      await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/share/${token}`, { method: "DELETE" });
      await loadShareTokens();
    },
    [detail, loadShareTokens]
  );

  const currentDetail = useMemo(() => {
    if (!detail) return null;
    return {
      ...detail.invoice,
      ...dirty,
      items,
    };
  }, [detail, dirty, items]);

  if (loading || !detail) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-xs text-[#6B7280]">
        Lade Rechnung…
      </div>
    );
  }

  const inv = detail.invoice;
  const dueSoon =
    !isDraft &&
    inv.status !== "paid" &&
    inv.status !== "cancelled" &&
    inv.dueDate < todayIso();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="space-y-5">
        <StatusHero
          invoice={inv}
          overdue={dueSoon}
          onClose={onClose}
        />

        <ActionsToolbar
          isDraft={!!isDraft}
          invoice={inv}
          documents={detail.documents}
          saving={saving}
          onSave={() => save(false)}
          onFinalize={finalize}
          onDelete={remove}
          onMarkPaid={markPaid}
          onCorrection={createCorrection}
          onCancel={cancel}
          onShare={generateShare}
        />

        {status && !error && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3 text-xs text-emerald-200">
            {status}
          </div>
        )}
        {copyState && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/[0.05] p-3 text-xs text-blue-200">
            {copyState}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {shareOpen && (
          <ShareLinks
            invoiceId={inv.id}
            tokens={shareTokens}
            onClose={() => setShareOpen(false)}
            onRevoke={revokeShare}
          />
        )}

        <MetaEditor
          value={currentDetail!}
          isDraft={!!isDraft}
          projects={projects}
          onChangeField={(k, v) => {
            patch(k as keyof InvoiceDetail, v as never);
            scheduleAutosave();
          }}
        />

        <ItemsEditor
          items={items}
          currency={currentDetail!.currency}
          readonly={!isDraft}
          onChange={(next) => {
            setItems(next);
            scheduleAutosave();
          }}
        />

        <TotalsBlock detail={currentDetail!} />

        <TextEditor
          value={currentDetail!.texts}
          readonly={!isDraft}
          onChange={(texts) => {
            patch("texts", texts as InvoiceDetail["texts"]);
            scheduleAutosave();
          }}
        />

        <DocumentsSection invoiceId={inv.id} documents={detail.documents} />
      </div>

      <PreviewPanel
        invoiceId={inv.id}
        nonce={previewNonce}
        onShare={generateShare}
      />
    </div>
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeVersion(detail: Detail): number {
  const v = (detail.invoice as unknown as { version?: number }).version;
  return typeof v === "number" ? v : 0;
}

/* ── Status-Hero ────────────────────────────────────────────────────── */

function StatusHero({
  invoice,
  overdue,
  onClose,
}: {
  invoice: InvoiceDetail;
  overdue: boolean;
  onClose: () => void;
}) {
  const status = invoice.status as InvoiceStatus;
  const color = overdue ? "#EF4444" : INVOICE_STATUS_COLOR[status] || "#94A3B8";
  const label = overdue ? "Überfällig" : INVOICE_STATUS_LABEL[status] || status;
  const accent = invoice.issuer.accentColor || "#1F6DD8";

  const dueInDays = daysBetween(todayIso(), invoice.dueDate);
  let dueHint = "";
  if (invoice.status === "paid") {
    dueHint = "Vollständig bezahlt.";
  } else if (invoice.status === "cancelled") {
    dueHint = "Beleg wurde storniert.";
  } else if (overdue) {
    dueHint = `Überfällig seit ${Math.abs(dueInDays)} Tag${Math.abs(dueInDays) === 1 ? "" : "en"}.`;
  } else {
    dueHint = `Fällig in ${dueInDays} Tag${dueInDays === 1 ? "" : "en"}.`;
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        borderColor: `${color}55`,
        background: `linear-gradient(135deg, ${color}18 0%, rgba(15,17,22,0.85) 55%)`,
      }}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
           style={{ background: color }} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={onClose} className="text-[11px] text-[#9CA3AF] hover:text-white">
            ← Zurück zur Liste
          </button>
          <div className="mt-2 flex items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium"
              style={{ borderColor: `${color}66`, background: `${color}22`, color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {label}
            </span>
            {invoice.type === "credit_note" && (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9CA3AF]">
                Korrektur/Gutschrift
              </span>
            )}
            {invoice.references?.originalInvoiceNumber && (
              <span className="text-[11px] text-[#9CA3AF]">
                bezogen auf Nr. {invoice.references.originalInvoiceNumber}
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {invoice.invoiceNumber ? `Rechnung Nr. ${invoice.invoiceNumber}` : "Neuer Entwurf"}
          </div>
          <div className="mt-1 text-xs text-[#9CA3AF]">
            {invoice.issuer.brandLabel} · {invoice.customer.name || "Kein Kunde"}
            {invoice.project?.name && ` · ${invoice.project.name}`}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-right">
          <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">Gesamtbetrag</div>
          <div className="text-2xl font-semibold" style={{ color: accent }}>
            {formatEUR(invoice.totals.grossCents, invoice.totals.currency)}
          </div>
          <div className="mt-1 text-[10px] text-[#9CA3AF]">{dueHint}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <MicroStat label="Rechnungsdatum" value={formatDeDate(invoice.invoiceDate)} />
        <MicroStat label="Fälligkeit" value={formatDeDate(invoice.dueDate)} highlight={overdue} />
        <MicroStat
          label="Bezahlt am"
          value={invoice.status === "paid" ? "erledigt" : "—"}
          highlight={invoice.status === "paid"}
          color={invoice.status === "paid" ? "#22C55E" : undefined}
        />
        <MicroStat
          label="E-Rechnung"
          value={
            invoice.status === "draft" ? "—" : "verfügbar"
          }
        />
      </div>
    </div>
  );
}

function MicroStat({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</div>
      <div className="text-sm font-medium" style={{ color: color || (highlight ? "#EF4444" : "#E5E7EB") }}>
        {value}
      </div>
    </div>
  );
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z").getTime();
  const b = new Date(to + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

/* ── Aktionen ──────────────────────────────────────────────────────── */

function ActionsToolbar({
  isDraft,
  invoice,
  documents,
  saving,
  onSave,
  onFinalize,
  onDelete,
  onMarkPaid,
  onCorrection,
  onCancel,
  onShare,
}: {
  isDraft: boolean;
  invoice: InvoiceDetail;
  documents: Detail["documents"];
  saving: boolean;
  onSave: () => void;
  onFinalize: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  onCorrection: () => void;
  onCancel: () => void;
  onShare: () => void;
}) {
  const pdf = documents.find((d) => d.kind === "pdf");
  const zug = documents.find((d) => d.kind === "zugferd");
  const xml = documents.find((d) => d.kind === "xrechnung");
  const previewUrl = `/api/admin/billing/invoices/${invoice.id}/preview`;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      {isDraft && (
        <>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06] disabled:opacity-50"
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
          <button
            onClick={onFinalize}
            disabled={saving}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
            style={{ boxShadow: "0 0 12px rgba(59,130,246,0.6)" }}
          >
            Finalisieren
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
          >
            Entwurf löschen
          </button>
        </>
      )}
      {!isDraft && (
        <>
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button
              onClick={onMarkPaid}
              className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs text-green-200 hover:bg-green-500/20"
            >
              Als bezahlt markieren
            </button>
          )}
          <button
            onClick={onCorrection}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
          >
            Korrektur erstellen
          </button>
          {invoice.status !== "cancelled" && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-red-500/30 bg-red-500/[0.05] px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
            >
              Stornieren
            </button>
          )}
        </>
      )}

      <div className="mx-1 h-6 w-px bg-white/10" />

      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
      >
        Vorschau öffnen
      </a>
      {pdf ? (
        <a
          href={`/api/admin/billing/invoices/${invoice.id}/documents/${pdf.id}`}
          className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
        >
          ↓ PDF
        </a>
      ) : null}
      {zug ? (
        <a
          href={`/api/admin/billing/invoices/${invoice.id}/documents/${zug.id}`}
          className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
        >
          ↓ ZUGFeRD
        </a>
      ) : null}
      {xml ? (
        <a
          href={`/api/admin/billing/invoices/${invoice.id}/documents/${xml.id}`}
          className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
        >
          ↓ XRechnung
        </a>
      ) : null}

      {!isDraft && (
        <button
          onClick={onShare}
          className="ml-auto rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
          title="Öffentlichen Link kopieren"
        >
          Link teilen
        </button>
      )}
    </div>
  );
}

function ShareLinks({
  tokens,
  onClose,
  onRevoke,
}: {
  invoiceId: string;
  tokens: ShareTokenView[];
  onClose: () => void;
  onRevoke: (token: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
          Öffentliche Links
        </div>
        <button onClick={onClose} className="text-[11px] text-[#9CA3AF] hover:text-white">
          Schließen
        </button>
      </div>
      {tokens.length === 0 && (
        <div className="text-xs text-[#6B7280]">Noch keine Links vorhanden.</div>
      )}
      <div className="space-y-2">
        {tokens.map((t) => {
          const url = `${window.location.origin}/rechnung/${t.token}`;
          const revoked = !!t.revokedAt;
          const expired = !!t.expiresAt && new Date(t.expiresAt).getTime() < Date.now();
          return (
            <div
              key={t.token}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2 text-xs"
            >
              <span
                className="rounded-full border px-2 py-0.5 text-[10px]"
                style={
                  revoked
                    ? { borderColor: "#71717A55", color: "#A1A1AA" }
                    : expired
                      ? { borderColor: "#F59E0B55", color: "#FBBF24" }
                      : { borderColor: "#22C55E55", color: "#4ADE80" }
                }
              >
                {revoked ? "Widerrufen" : expired ? "Abgelaufen" : "Aktiv"}
              </span>
              <input
                readOnly
                value={url}
                className="flex-1 rounded border border-white/10 bg-black/50 px-2 py-1 font-mono text-[11px] text-white outline-none"
              />
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(url);
                }}
                className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-white hover:bg-white/[0.08]"
              >
                Kopieren
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-white hover:bg-white/[0.08]"
              >
                Öffnen
              </a>
              {!revoked && (
                <button
                  onClick={() => onRevoke(t.token)}
                  className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-red-200 hover:bg-red-500/20"
                >
                  Widerrufen
                </button>
              )}
              <span className="ml-1 text-[10px] text-[#6B7280]">
                {t.accessCount}× aufgerufen
                {t.expiresAt && ` · gültig bis ${formatDeDate(t.expiresAt.slice(0, 10))}`}
                {t.recipientHint && ` · ${t.recipientHint}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Metadaten ─────────────────────────────────────────────────────── */

function MetaEditor({
  value,
  isDraft,
  projects,
  onChangeField,
}: {
  value: InvoiceDetail & { items: InvoiceItem[] };
  isDraft: boolean;
  projects: ProjectOption[];
  onChangeField: (key: string, value: unknown) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Rechnungsdaten</div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <LabeledInput label="Rechnungsdatum" type="date" value={value.invoiceDate} disabled={!isDraft}
          onChange={(v) => onChangeField("invoiceDate", v)} />
        <LabeledInput label="Fälligkeit" type="date" value={value.dueDate} disabled={!isDraft}
          onChange={(v) => onChangeField("dueDate", v)} />
        <LabeledInput label="Leistungszeitraum von" type="date" value={value.servicePeriod.start} disabled={!isDraft}
          onChange={(v) => onChangeField("servicePeriod", { ...value.servicePeriod, start: v })} />
        <LabeledInput label="Leistungszeitraum bis" type="date" value={value.servicePeriod.end} disabled={!isDraft}
          onChange={(v) => onChangeField("servicePeriod", { ...value.servicePeriod, end: v })} />
        <LabeledInput label="Währung" type="text" value={value.currency} disabled={!isDraft}
          onChange={(v) => onChangeField("currency", v.toUpperCase())} />
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">Projekt</label>
          <select
            disabled={!isDraft}
            value={value.project?.id ?? ""}
            onChange={(e) => {
              const proj = projects.find((p) => p.id === e.target.value) ?? null;
              onChangeField("project", proj ? { id: proj.id, name: proj.name, color: proj.color, slug: proj.slug } : null);
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
          >
            <option value="">Kein Projekt</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <LabeledInput label="Buyer-Reference" type="text" value={value.references?.buyerReference ?? ""} disabled={!isDraft}
          onChange={(v) => onChangeField("references", { ...value.references, buyerReference: v })} />
      </div>
      <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/30 p-3 text-xs text-[#9CA3AF]">
        <div className="mb-1 uppercase tracking-widest text-[10px] text-[#6B7280]">Aussteller · unveränderlich für diese Rechnung</div>
        <div className="text-white">{value.issuer.brandLabel}</div>
        <div>
          {value.issuer.address.line1}
          {value.issuer.address.line1 && ", "}
          {value.issuer.address.postalCode} {value.issuer.address.city}
        </div>
        <div>USt-Regelung: {value.issuer.taxRegime}</div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}

/* ── Positionen (Drag & Drop) ─────────────────────────────────────── */

function ItemsEditor({
  items,
  currency,
  readonly,
  onChange,
}: {
  items: InvoiceItem[];
  currency: string;
  readonly: boolean;
  onChange: (items: InvoiceItem[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const patchItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const next = items.slice();
    const current = { ...next[idx], ...patch };
    current.lineNetCents = Math.round((current.quantityMilli * current.unitPriceCents) / 1000);
    const gross = current.lineNetCents;
    const discount = Math.round((gross * current.discountPercentMilli) / 100_000);
    current.lineNetCents = gross - discount;
    current.lineTaxCents = Math.round((current.lineNetCents * current.taxRatePercentMilli) / 100_000);
    current.lineGrossCents = current.lineNetCents + current.lineTaxCents;
    next[idx] = current;
    onChange(next);
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        id: `new-${Date.now()}`,
        position: items.length + 1,
        title: "",
        description: "",
        quantityMilli: 1000,
        unit: "Stk.",
        unitPriceCents: 0,
        discountPercentMilli: 0,
        taxCategory: (items[0]?.taxCategory ?? "S") as TaxCategory,
        taxRatePercentMilli: items[0]?.taxRatePercentMilli ?? 19_000,
        lineNetCents: 0,
        lineTaxCents: 0,
        lineGrossCents: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, position: i + 1 })));
  };

  const duplicate = (idx: number) => {
    const clone = { ...items[idx], id: `new-${Date.now()}` };
    const next = items.slice();
    next.splice(idx + 1, 0, clone);
    onChange(next.map((it, i) => ({ ...it, position: i + 1 })));
  };

  const commitDrag = (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx) return;
    const next = items.slice();
    const [row] = next.splice(dragIndex, 1);
    next.splice(targetIdx, 0, row);
    onChange(next.map((it, i) => ({ ...it, position: i + 1 })));
    setDragIndex(null);
    setDragOver(null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
          Positionen {!readonly && <span className="ml-2 text-[10px] normal-case text-[#4B5563]">· Drag & Drop zum Sortieren</span>}
        </div>
        {!readonly && (
          <button onClick={addItem} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]">
            + Position
          </button>
        )}
      </div>
      <div className="space-y-3">
        {items.map((it, idx) => {
          const isDragging = dragIndex === idx;
          const isOver = dragOver === idx && !isDragging;
          return (
            <div
              key={it.id}
              draggable={!readonly}
              onDragStart={(e) => {
                setDragIndex(idx);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOver(null);
              }}
              onDragOver={(e) => {
                if (readonly) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOver(idx);
              }}
              onDrop={(e) => {
                e.preventDefault();
                commitDrag(idx);
              }}
              className={`rounded-xl border p-3 transition-all ${
                isDragging
                  ? "border-blue-500/60 bg-blue-500/[0.06] opacity-70"
                  : isOver
                    ? "border-blue-500/40 bg-blue-500/[0.03]"
                    : "border-white/[0.05] bg-black/30"
              }`}
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[24px_28px_minmax(0,1fr)_100px_120px_120px] md:items-start">
                {!readonly && (
                  <div
                    className="mt-2 flex cursor-grab select-none items-center justify-center text-[#4B5563] hover:text-white"
                    title="Ziehen zum Sortieren"
                  >
                    ⋮⋮
                  </div>
                )}
                {readonly && <div />}
                <div className="text-xs font-semibold text-white">{it.position}</div>
                <div className="space-y-1">
                  <input
                    value={it.title}
                    disabled={readonly}
                    onChange={(e) => patchItem(idx, { title: e.target.value })}
                    placeholder="Titel"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
                  />
                  <textarea
                    value={it.description}
                    disabled={readonly}
                    rows={2}
                    onChange={(e) => patchItem(idx, { description: e.target.value })}
                    placeholder="Ausführliche Beschreibung"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-[#E5E7EB] focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    value={formatQty(it.quantityMilli)}
                    disabled={readonly}
                    onChange={(e) => {
                      try {
                        patchItem(idx, { quantityMilli: parseQtyInput(e.target.value) });
                      } catch {
                        // ignoriere temporäre Zwischenzustände
                      }
                    }}
                    placeholder="Menge"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
                  />
                  <input
                    value={it.unit}
                    disabled={readonly}
                    onChange={(e) => patchItem(idx, { unit: e.target.value })}
                    placeholder="Einheit"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-[#E5E7EB] focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    value={formatEuro(it.unitPriceCents)}
                    disabled={readonly}
                    onChange={(e) => {
                      try {
                        patchItem(idx, { unitPriceCents: parseEuroInput(e.target.value) });
                      } catch {}
                    }}
                    placeholder="Preis"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
                  />
                  <select
                    value={`${it.taxCategory}:${it.taxRatePercentMilli}`}
                    disabled={readonly}
                    onChange={(e) => {
                      const [cat, rate] = e.target.value.split(":");
                      patchItem(idx, {
                        taxCategory: cat as TaxCategory,
                        taxRatePercentMilli: Number(rate),
                      });
                    }}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-[#E5E7EB] focus:outline-none disabled:opacity-60"
                  >
                    <option value="S:19000">USt 19 %</option>
                    <option value="AA:7000">USt 7 %</option>
                    <option value="Z:0">Nullsatz</option>
                    <option value="E:0">§ 19 UStG (Kleinunternehmer)</option>
                    <option value="K:0">Reverse Charge</option>
                  </select>
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <div className="text-right text-sm font-semibold text-white tabular-nums">
                    {formatEUR(it.lineGrossCents, currency)}
                  </div>
                  {!readonly && (
                    <div className="flex gap-1 text-[10px]">
                      <button onClick={() => duplicate(idx)} className="rounded border border-white/10 px-1.5 py-0.5 text-[#9CA3AF] hover:text-white">Dupl.</button>
                      <button onClick={() => removeItem(idx)} className="rounded border border-red-500/30 px-1.5 py-0.5 text-red-200 hover:bg-red-500/10">×</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatEuro(cents: number): string {
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${cents < 0 ? "-" : ""}${whole},${String(frac).padStart(2, "0")}`;
}

/* ── Summen ────────────────────────────────────────────────────────── */

function TotalsBlock({ detail }: { detail: InvoiceDetail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Summen</div>
      <div className="mt-3 flex flex-col gap-1 text-sm text-[#E5E7EB]">
        <div className="flex items-center justify-between"><span>Netto</span><span className="tabular-nums">{formatEUR(detail.totals.netCents, detail.totals.currency)}</span></div>
        {detail.totals.taxBreakdown.map((b, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>USt {(b.ratePercentMilli / 1000).toFixed(2)} % ({TAX_CATEGORY_LABEL[b.category]})</span>
            <span className="tabular-nums">{formatEUR(b.taxCents, detail.totals.currency)}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2 text-base font-semibold text-white">
          <span>Gesamt</span>
          <span className="tabular-nums" style={{ color: detail.issuer.accentColor }}>
            {formatEUR(detail.totals.grossCents, detail.totals.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Texte ─────────────────────────────────────────────────────────── */

function TextEditor({
  value,
  readonly,
  onChange,
}: {
  value: InvoiceDetail["texts"];
  readonly: boolean;
  onChange: (v: InvoiceDetail["texts"]) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Texte</div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Textarea label="Anrede" value={value.salutation ?? ""} readonly={readonly}
          onChange={(v) => onChange({ ...value, salutation: v })} />
        <Textarea label="Einleitung" value={value.intro ?? ""} readonly={readonly}
          onChange={(v) => onChange({ ...value, intro: v })} />
        <Textarea label="Schlusstext" value={value.outro ?? ""} readonly={readonly}
          onChange={(v) => onChange({ ...value, outro: v })} />
        <Textarea label="Kundenhinweis" value={value.customerNote ?? ""} readonly={readonly}
          onChange={(v) => onChange({ ...value, customerNote: v })} />
        <Textarea label="Interne Notiz (nicht auf Rechnung)" value={value.internalNote ?? ""} readonly={readonly}
          onChange={(v) => onChange({ ...value, internalNote: v })} full />
        <Textarea label="Kleinunternehmer-Hinweis (aus Aussteller)" value={value.smallBusinessNote ?? ""} readonly full />
      </div>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  readonly,
  full,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readonly?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</label>
      <textarea
        value={value}
        disabled={readonly || !onChange}
        rows={3}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}

/* ── Dokumente ────────────────────────────────────────────────────── */

function DocumentsSection({
  invoiceId,
  documents,
}: {
  invoiceId: string;
  documents: Detail["documents"];
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Dokumente</div>
        <div className="mt-2 text-xs text-[#6B7280]">
          Dokumente werden bei der Finalisierung erzeugt (PDF, ZUGFeRD, XRechnung).
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Dokumente</div>
      <div className="mt-3 space-y-2">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={`/api/admin/billing/invoices/${invoiceId}/documents/${doc.id}`}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-2">
              <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase text-[#9CA3AF]">
                {doc.kind}
              </span>
              <span>{doc.filename}</span>
              {doc.specVersion && <span className="text-[#6B7280]">· {doc.specVersion}</span>}
            </span>
            <ValidationDot status={doc.validationStatus} />
          </a>
        ))}
      </div>
    </div>
  );
}

function ValidationDot({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    valid: { label: "gültig", color: "#22C55E" },
    warnings: { label: "Warnungen", color: "#F59E0B" },
    invalid: { label: "ungültig", color: "#EF4444" },
    unchecked: { label: "ungeprüft", color: "#94A3B8" },
  };
  const m = map[status] || map.unchecked;
  return (
    <span className="inline-flex items-center gap-2 text-[#9CA3AF]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

/* ── Vorschau ──────────────────────────────────────────────────────── */

function PreviewPanel({
  invoiceId,
  nonce,
  onShare,
}: {
  invoiceId: string;
  nonce: number;
  onShare: () => void;
}) {
  const src = `/api/admin/billing/invoices/${invoiceId}/preview?v=${nonce}`;
  return (
    <div className="sticky top-4 rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-[#9CA3AF]">
        <span>Live-Vorschau</span>
        <div className="flex items-center gap-2">
          <button onClick={onShare} className="text-white hover:underline">
            Teilen
          </button>
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
            Öffnen
          </a>
        </div>
      </div>
      <div className="aspect-[210/297] w-full overflow-hidden rounded-xl bg-white">
        <iframe title="Rechnungs-Vorschau" src={src} className="h-full w-full border-0" />
      </div>
    </div>
  );
}
