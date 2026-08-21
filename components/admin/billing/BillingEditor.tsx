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
  const [customerDirty, setCustomerDirty] = useState<Partial<InvoiceDetail["customer"]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [previewNonce, setPreviewNonce] = useState<number>(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTokens, setShareTokens] = useState<ShareTokenView[]>([]);
  const [copyState, setCopyState] = useState<string>("");
  const [askPay, setAskPay] = useState(false);
  const [askCancel, setAskCancel] = useState(false);
  const [askCorrection, setAskCorrection] = useState(false);
  const [askShare, setAskShare] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDraft = detail?.invoice.status === "draft" || detail?.invoice.status === "ready_for_review";

  useEffect(() => {
    if (detail) {
      setDirty({});
      setCustomerDirty({});
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
        // 1) Falls Kundendaten geändert wurden UND ein persistenter Kunde
        //    verknüpft ist, spiegeln wir diese Änderungen zurück ins
        //    Stammdaten-CRUD, damit sie beim nächsten Snapshot vorliegen.
        const customerId = dirty.customer?.id ?? detail.invoice.customer.id;
        if (customerId && Object.keys(customerDirty).length > 0) {
          const cust = { ...detail.invoice.customer, ...customerDirty };
          const patch = {
            name: cust.name,
            contactPerson: cust.contactPerson ?? null,
            address: cust.address,
            email: cust.email ?? null,
            buyerReference: cust.buyerReference ?? null,
          };
          const rc = await fetch(`/api/admin/billing/customers/${customerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          if (!rc.ok) {
            const err = await rc.json().catch(() => ({}));
            throw new Error(err.error || "Kundendaten konnten nicht gespeichert werden");
          }
        }

        // 2) Rechnungs-Draft mit allen Feldern speichern.
        const body = {
          version: computeVersion(detail),
          customerId,
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
        setCustomerDirty({});
        if (!silent) setStatus("Gespeichert.");
        setPreviewNonce((n) => n + 1);
        await onChanged();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [detail, dirty, customerDirty, items, onChanged]
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

  const markPaidWith = useCallback(
    async (reference: string) => {
      if (!detail) return;
      const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Fehler");
      else {
        setStatus("Als bezahlt markiert.");
        setAskPay(false);
        await onChanged();
      }
    },
    [detail, onChanged]
  );

  const createCorrectionWith = useCallback(
    async (reason: string) => {
      if (!detail) return;
      const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/correction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Fehler");
      else if (data.invoice?.id) {
        setAskCorrection(false);
        window.location.hash = `#inv-${data.invoice.id}`;
      }
    },
    [detail]
  );

  const cancelWith = useCallback(
    async (reason: string) => {
      if (!detail) return;
      const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Fehler");
      else {
        setStatus("Storniert.");
        setAskCancel(false);
        await onChanged();
      }
    },
    [detail, onChanged]
  );

  const generateShareWith = useCallback(
    async (days: number | null, recipient: string | null) => {
      if (!detail) return;
      const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresInDays: days && days > 0 ? days : null,
          recipientHint: recipient || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Share fehlgeschlagen");
      setShareTokens((t) => [data.share, ...t]);
      setShareOpen(true);
      setAskShare(false);
      const url = `${window.location.origin}/rechnung/${data.share.token}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopyState("Link kopiert.");
        setTimeout(() => setCopyState(""), 2500);
      } catch {
        // Clipboard nicht verfügbar — Nutzer kann Link manuell markieren.
      }
    },
    [detail]
  );

  const markPaid = useCallback(() => setAskPay(true), []);
  const createCorrection = useCallback(() => setAskCorrection(true), []);
  const cancel = useCallback(() => setAskCancel(true), []);
  const generateShare = useCallback(() => setAskShare(true), []);

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
    const mergedCustomer = {
      ...detail.invoice.customer,
      ...customerDirty,
      address: {
        ...detail.invoice.customer.address,
        ...(customerDirty.address ?? {}),
      },
    };
    return {
      ...detail.invoice,
      ...dirty,
      customer: mergedCustomer,
      items,
    };
  }, [detail, dirty, customerDirty, items]);

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_min(46vw,520px)]">
      <div className="min-w-0 space-y-5">
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

        {askPay && (
          <ActionPrompt
            title="Als bezahlt markieren"
            description="Erfassen Sie optional die Zahlungsreferenz (z. B. Ihre Kontoauszug-Buchungs-ID)."
            confirmLabel="Bezahlt markieren"
            fields={[{ key: "reference", label: "Zahlungsreferenz (optional)", placeholder: "z. B. Umsatz-Nr." }]}
            onCancel={() => setAskPay(false)}
            onConfirm={(v) => markPaidWith(v.reference || "")}
          />
        )}
        {askCancel && (
          <ActionPrompt
            title="Rechnung stornieren"
            description="Eine Stornierung erzeugt ein Storno-Dokument. Das ist endgültig – der Betrag wird als 0 verbucht."
            confirmLabel="Endgültig stornieren"
            confirmDanger
            fields={[{ key: "reason", label: "Grund für die Stornierung", placeholder: "z. B. Adress­änderung, Fehlbuchung", required: true, textarea: true }]}
            onCancel={() => setAskCancel(false)}
            onConfirm={(v) => cancelWith(v.reason || "")}
          />
        )}
        {askCorrection && (
          <ActionPrompt
            title="Korrekturrechnung erstellen"
            description="Erzeugt einen neuen Draft, der auf diese Rechnung verweist. Bitte begründen Sie die Korrektur klar (z. B. „Position 2 wurde doppelt berechnet)."
            confirmLabel="Korrektur anlegen"
            fields={[{ key: "reason", label: "Grund der Korrektur", placeholder: "Kurzer Sachtext", required: true, textarea: true }]}
            onCancel={() => setAskCorrection(false)}
            onConfirm={(v) => createCorrectionWith(v.reason || "")}
          />
        )}
        {askShare && (
          <ActionPrompt
            title="Öffentlichen Link generieren"
            description="Der Kunde erhält einen sicheren, tokenbasierten Link – ohne Login – zum Ansehen und Download der PDF/E-Rechnung. Zugriff wird protokolliert."
            confirmLabel="Link erstellen und kopieren"
            fields={[
              { key: "days", label: "Ablauf in Tagen (leer = unbegrenzt)", placeholder: "z. B. 30", inputType: "number" },
              { key: "recipient", label: "Empfänger-Hinweis (optional)", placeholder: "z. B. buchhaltung@kunde.de" },
            ]}
            onCancel={() => setAskShare(false)}
            onConfirm={(v) => generateShareWith(Number(v.days) || null, v.recipient || null)}
          />
        )}

        <CustomerBlock
          value={currentDetail!.customer}
          isDraft={!!isDraft}
          onChange={(patch) => {
            setCustomerDirty((c) => {
              if (patch.address) {
                return {
                  ...c,
                  ...patch,
                  address: { ...(c.address ?? {}), ...patch.address } as InvoiceDetail["customer"]["address"],
                };
              }
              return { ...c, ...patch };
            });
            scheduleAutosave();
          }}
        />

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

        <ComplianceGate detail={currentDetail!} />

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
              <div className="grid grid-cols-[24px_1fr] gap-3 lg:grid-cols-[24px_28px_minmax(0,1fr)_110px_130px_130px] lg:items-start">
                {!readonly ? (
                  <div
                    className="mt-2 flex cursor-grab select-none items-center justify-center text-[#4B5563] hover:text-white"
                    title="Ziehen zum Sortieren"
                  >
                    ⋮⋮
                  </div>
                ) : (
                  <div />
                )}
                <div className="hidden text-xs font-semibold text-white lg:block">{it.position}</div>

                {/* Titel + Beschreibung (auf mobil ganze Breite) */}
                <div className="space-y-1 lg:col-auto">
                  <div className="flex items-center gap-2 lg:hidden">
                    <span className="text-[10px] uppercase tracking-widest text-[#6B7280]">Pos {it.position}</span>
                    <span className="ml-auto text-sm font-semibold text-white tabular-nums">
                      {formatEUR(it.lineGrossCents, currency)}
                    </span>
                  </div>
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

                {/* Menge + Einheit + Rabatt */}
                <div className="col-span-2 grid grid-cols-2 gap-2 lg:col-auto lg:block lg:space-y-1">
                  <MobileLabeled label="Menge">
                    <input
                      value={formatQty(it.quantityMilli)}
                      disabled={readonly}
                      onChange={(e) => {
                        try {
                          patchItem(idx, { quantityMilli: parseQtyInput(e.target.value) });
                        } catch {
                          // temporäre Eingabe
                        }
                      }}
                      placeholder="Menge"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
                    />
                  </MobileLabeled>
                  <MobileLabeled label="Einheit">
                    <input
                      value={it.unit}
                      disabled={readonly}
                      onChange={(e) => patchItem(idx, { unit: e.target.value })}
                      placeholder="z. B. Stk., Std., Monat"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-[#E5E7EB] focus:outline-none disabled:opacity-60"
                    />
                  </MobileLabeled>
                </div>

                {/* Preis + Steuersatz + Rabatt */}
                <div className="col-span-2 grid grid-cols-2 gap-2 lg:col-auto lg:block lg:space-y-1">
                  <MobileLabeled label="Einzelpreis">
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
                  </MobileLabeled>
                  <MobileLabeled label="Rabatt %">
                    <input
                      value={(it.discountPercentMilli / 1000).toFixed(2).replace(".", ",")}
                      disabled={readonly}
                      onChange={(e) => {
                        const raw = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                        const n = Number(raw);
                        if (!Number.isNaN(n)) {
                          patchItem(idx, { discountPercentMilli: Math.max(0, Math.min(100_000, Math.round(n * 1000))) });
                        }
                      }}
                      placeholder="0"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-60"
                    />
                  </MobileLabeled>
                  <div className="col-span-2 lg:col-span-1">
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
                </div>

                {/* Total + Actions */}
                <div className="col-span-2 flex items-center justify-between gap-2 lg:col-auto lg:flex-col lg:items-end lg:justify-between">
                  <div className="hidden text-right text-sm font-semibold text-white tabular-nums lg:block">
                    {formatEUR(it.lineGrossCents, currency)}
                  </div>
                  {!readonly && (
                    <div className="flex gap-1 text-[10px]">
                      <button onClick={() => duplicate(idx)} className="rounded border border-white/10 px-2 py-1 text-[#9CA3AF] hover:text-white">
                        Duplizieren
                      </button>
                      <button onClick={() => removeItem(idx)} className="rounded border border-red-500/30 px-2 py-1 text-red-200 hover:bg-red-500/10">
                        Entfernen
                      </button>
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

/**
 * Kleines Label, das auf Mobile über dem Input erscheint und auf Desktop
 * verborgen bleibt. Sorgt dafür, dass die Positions-Tabelle auf Handys
 * lesbar wird, ohne den kompakten Desktop-Grid zu stören.
 */
function MobileLabeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#6B7280] lg:hidden">
        {label}
      </label>
      {children}
    </div>
  );
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

/* ── Action-Prompt (Modal für Aktionen) ───────────────────────────── */

interface PromptField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  inputType?: string;
}

function ActionPrompt({
  title,
  description,
  confirmLabel,
  confirmDanger,
  fields,
  onCancel,
  onConfirm,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  confirmDanger?: boolean;
  fields: PromptField[];
  onCancel: () => void;
  onConfirm: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = fields.every((f) => !f.required || (values[f.key] ?? "").trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0E14] p-5 shadow-2xl">
        <div className="text-base font-semibold text-white">{title}</div>
        {description && (
          <div className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">{description}</div>
        )}
        <div className="mt-4 space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">
                {f.label}
                {f.required && <span className="ml-1 text-red-400">*</span>}
              </label>
              {f.textarea ? (
                <textarea
                  rows={3}
                  value={values[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
                />
              ) : (
                <input
                  type={f.inputType || "text"}
                  value={values[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white hover:bg-white/[0.06]"
          >
            Abbrechen
          </button>
          <button
            onClick={async () => {
              if (!canSubmit) return;
              setSubmitting(true);
              try {
                await onConfirm(values);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!canSubmit || submitting}
            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
              confirmDanger
                ? "bg-red-500 hover:bg-red-400"
                : "bg-blue-500 hover:bg-blue-400"
            }`}
          >
            {submitting ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Kunden-Block (Empfänger) ─────────────────────────────────────── */

function CustomerBlock({
  value,
  isDraft,
  onChange,
}: {
  value: InvoiceDetail["customer"];
  isDraft: boolean;
  onChange: (patch: Partial<InvoiceDetail["customer"]>) => void;
}) {
  const addr = value.address || { line1: "", line2: "", postalCode: "", city: "", country: "DE" };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Empfänger</div>
        {!isDraft && (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9CA3AF]">
            historischer Snapshot · read-only
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LabeledInput
          label="Firmen-/Empfängername *"
          value={value.name ?? ""}
          disabled={!isDraft}
          onChange={(v) => onChange({ name: v })}
        />
        <LabeledInput
          label="Ansprechpartner (optional)"
          value={value.contactPerson ?? ""}
          disabled={!isDraft}
          onChange={(v) => onChange({ contactPerson: v || null })}
        />
        <LabeledInput
          label="Straße + Hausnummer *"
          value={addr.line1 ?? ""}
          disabled={!isDraft}
          onChange={(v) => onChange({ address: { ...addr, line1: v } })}
        />
        <LabeledInput
          label="Zusatz (z. B. Etage, Postfach)"
          value={addr.line2 ?? ""}
          disabled={!isDraft}
          onChange={(v) => onChange({ address: { ...addr, line2: v || null } })}
        />
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
          <LabeledInput
            label="PLZ *"
            value={addr.postalCode ?? ""}
            disabled={!isDraft}
            onChange={(v) => onChange({ address: { ...addr, postalCode: v } })}
          />
          <LabeledInput
            label="Ort *"
            value={addr.city ?? ""}
            disabled={!isDraft}
            onChange={(v) => onChange({ address: { ...addr, city: v } })}
          />
        </div>
        <LabeledInput
          label="Land (ISO, z. B. DE)"
          value={addr.country ?? "DE"}
          disabled={!isDraft}
          onChange={(v) => onChange({ address: { ...addr, country: v.toUpperCase() } })}
        />
        <LabeledInput
          label="E-Mail (für E-Rechnungs-Versand)"
          type="email"
          value={value.email ?? ""}
          disabled={!isDraft}
          onChange={(v) => onChange({ email: v || null })}
        />
        <LabeledInput
          label="Bestellnummer / Buyer-Reference"
          value={value.buyerReference ?? ""}
          disabled={!isDraft}
          onChange={(v) => onChange({ buyerReference: v || null })}
        />
      </div>
    </div>
  );
}

/* ── Compliance-Gate (E-Rechnung/§14 UStG) ────────────────────────── */

function ComplianceGate({ detail }: { detail: InvoiceDetail & { items: InvoiceItem[] } }) {
  const checks = useMemo(() => {
    const c: { key: string; label: string; ok: boolean; severity: "error" | "warn" }[] = [];
    const iss = detail.issuer;
    const cust = detail.customer;
    const addr = cust.address || { line1: "", postalCode: "", city: "", country: "" };

    c.push({ key: "issuer_name", label: "Vollständiger Name & Anschrift des Ausstellers", ok: !!iss.legalName && !!iss.address.line1 && !!iss.address.postalCode, severity: "error" });
    c.push({ key: "customer_name", label: "Name des Leistungsempfängers", ok: !!cust.name?.trim(), severity: "error" });
    c.push({ key: "customer_addr", label: "Anschrift des Leistungsempfängers (Straße, PLZ, Ort)", ok: !!addr.line1 && !!addr.postalCode && !!addr.city, severity: "error" });
    c.push({ key: "invoice_date", label: "Ausstellungsdatum", ok: !!detail.invoiceDate, severity: "error" });
    c.push({ key: "period", label: "Leistungszeitraum (§ 14 Abs. 4 UStG)", ok: !!detail.servicePeriod?.start && !!detail.servicePeriod?.end, severity: "error" });
    c.push({ key: "items", label: "Mindestens eine Position mit Menge, Preis und Beschreibung", ok: detail.items.length > 0 && detail.items.every((it) => it.title.trim() && it.quantityMilli > 0 && it.unitPriceCents > 0), severity: "error" });
    c.push({ key: "tax_id", label: "Steuernummer oder USt-ID des Ausstellers", ok: !!iss.taxNumber || !!iss.vatId, severity: "error" });

    const hasBank = !!iss.bank?.iban && !!iss.bank?.bic;
    c.push({ key: "bank", label: "Bankverbindung (IBAN/BIC) für Zahlungsverkehr", ok: hasBank, severity: "warn" });

    if (iss.taxRegime === "kleinunternehmer") {
      c.push({
        key: "kus_note",
        label: "Kleinunternehmer-Hinweis nach § 19 UStG",
        ok: !!(detail.texts.smallBusinessNote?.trim() || iss.smallBusinessNote?.trim()),
        severity: "error",
      });
    } else {
      c.push({
        key: "tax_breakdown",
        label: "Steueraufschlüsselung pro Steuersatz",
        ok: (detail.totals.taxBreakdown?.length ?? 0) > 0 && detail.totals.taxCents >= 0,
        severity: "error",
      });
    }

    return c;
  }, [detail]);

  const errors = checks.filter((c) => !c.ok && c.severity === "error");
  const warnings = checks.filter((c) => !c.ok && c.severity === "warn");
  const ok = errors.length === 0;
  const color = ok ? "#22C55E" : errors.length > 0 ? "#EF4444" : "#F59E0B";
  const label = ok
    ? warnings.length === 0
      ? "E-Rechnungs-tauglich · Alle Pflichtangaben erfüllt"
      : `E-Rechnungs-tauglich · ${warnings.length} Hinweis(e)`
    : `Nicht finalisierbar · ${errors.length} Pflichtfeld(er) fehlen`;

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: `${color}55`, background: `${color}0F` }}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `${color}22`, color }}>
          {ok ? "✓" : "!"}
        </span>
        <div>
          <div className="text-sm font-semibold" style={{ color }}>{label}</div>
          <div className="text-[11px] text-[#9CA3AF]">EN 16931 · § 14 UStG · XRechnung/ZUGFeRD-ready</div>
        </div>
      </div>
      {(errors.length > 0 || warnings.length > 0) && (
        <ul className="mt-3 space-y-1 text-xs">
          {errors.map((e) => (
            <li key={e.key} className="flex items-start gap-2 text-red-200">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>{e.label}</span>
            </li>
          ))}
          {warnings.map((w) => (
            <li key={w.key} className="flex items-start gap-2 text-amber-200">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>{w.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
