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

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
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

interface RelatedInvoice {
  id: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  type: string;
  invoiceDate: string;
  grossCents: number;
  currency: string;
}

interface Detail {
  invoice: InvoiceDetail;
  documents: {
    id: string;
    kind: string;
    filename: string;
    validationStatus: string;
    specVersion: string | null;
  }[];
  relations?: {
    original: RelatedInvoice | null;
    corrections: RelatedInvoice[];
  };
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
  onOpen,
  projects,
}: {
  loading: boolean;
  detail: Detail | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onOpen?: (id: string) => void;
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
  const invoiceId = detail?.invoice.id;

  // WICHTIG: dieser useEffect darf NICHT bei jedem Autosave feuern,
  // sonst überschreibt der Server-Response die gerade getippte Eingabe
  // des Users. Reset ausschließlich beim Wechsel der Rechnung.
  useEffect(() => {
    if (detail) {
      setDirty({});
      setCustomerDirty({});
      setItems(detail.invoice.items);
      setError(null);
      setPreviewNonce((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // Guard: verhindert, dass ein Server-Reload nach Autosave den lokalen
  // items-State überschreibt, während der User weitertippt.
  const skipHydrateItems = useRef(false);
  useEffect(() => {
    if (!detail) return;
    if (skipHydrateItems.current) {
      skipHydrateItems.current = false;
      return;
    }
  }, [detail]);

  // Status-Toast fadet nach 2.5 s automatisch weg, damit der Editor
  // nicht dauerhaft "Alle Änderungen gespeichert." anzeigt.
  useEffect(() => {
    if (!status) return;
    if (status.startsWith("Speichere") || status.startsWith("Nicht gespeichert")) return;
    const t = setTimeout(() => setStatus(""), 2500);
    return () => clearTimeout(t);
  }, [status]);

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
    setStatus("Nicht gespeichert…");
    autosaveTimer.current = setTimeout(() => {
      void save(true);
    }, 500);
  }, [isDraft, detail]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(
    async (silent = false) => {
      if (!detail) return;
      setSaving(true);
      setError(null);
      if (silent) setStatus("Speichere…");
      try {
        // 1a) Empfängerverzeichnis: wenn keine customerId verknüpft ist
        //     und der User eine Firma+Adresse getippt hat, legen wir
        //     automatisch einen Kundenstammsatz an. Beim nächsten Mal
        //     ist er dann im Empfänger-Suche wählbar.
        let customerId: string | null = dirty.customer?.id ?? detail.invoice.customer.id ?? null;
        const workingCustomer = {
          ...detail.invoice.customer,
          ...customerDirty,
          address: {
            ...(detail.invoice.customer.address ?? { line1: "", postalCode: "", city: "", country: "DE" }),
            ...(customerDirty.address ?? {}),
          },
        };
        if (!customerId && workingCustomer.name?.trim() && workingCustomer.address?.line1?.trim()) {
          const create = await fetch(`/api/admin/billing/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: workingCustomer.name.trim(),
              contactPerson: workingCustomer.contactPerson ?? null,
              address: {
                line1: workingCustomer.address.line1,
                line2: workingCustomer.address.line2 ?? null,
                postalCode: workingCustomer.address.postalCode ?? "",
                city: workingCustomer.address.city ?? "",
                country: workingCustomer.address.country ?? "DE",
              },
              email: workingCustomer.email ?? null,
              buyerReference: workingCustomer.buyerReference ?? null,
            }),
          });
          if (create.ok) {
            const cdata = await create.json();
            customerId = cdata.customer?.id ?? cdata.id ?? null;
          }
        }

        // 1b) Falls Kundendaten geändert wurden UND ein persistenter Kunde
        //     verknüpft ist, spiegeln wir diese Änderungen zurück ins
        //     Stammdaten-CRUD, damit sie beim nächsten Snapshot vorliegen.
        if (customerId && Object.keys(customerDirty).length > 0) {
          const patch = {
            name: workingCustomer.name,
            contactPerson: workingCustomer.contactPerson ?? null,
            address: workingCustomer.address,
            email: workingCustomer.email ?? null,
            buyerReference: workingCustomer.buyerReference ?? null,
          };
          const rc = await fetch(`/api/admin/billing/customers/${customerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          if (!rc.ok) {
            // Best-effort: den Autosave nicht wegen einer Kunden-PATCH-
            // Kollision brechen; die Rechnungsdaten werden trotzdem
            // gespeichert.
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
        // Wichtig: verhindern, dass der useEffect([detail]) den lokalen
        // items-State beim nächsten reload überschreibt, während der
        // User evtl. gerade weitertippt.
        skipHydrateItems.current = true;
        setStatus(silent ? "Alle Änderungen gespeichert." : "Gespeichert.");
        setPreviewNonce((n) => n + 1);
        await onChanged();
      } catch (e) {
        setError((e as Error).message);
        setStatus("");
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
        if (onOpen) onOpen(data.invoice.id);
        else window.location.hash = `#inv-${data.invoice.id}`;
      }
    },
    [detail, onOpen]
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

  const createFollowup = useCallback(async () => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/billing/invoices/${detail.invoice.id}/followup`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Folgerechnung fehlgeschlagen");
      if (data.invoice?.id) {
        if (onOpen) onOpen(data.invoice.id);
        else window.location.hash = `#inv-${data.invoice.id}`;
        await onChanged();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [detail, onOpen, onChanged]);

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
          autosaveHint={
            isDraft
              ? saving
                ? "Speichere…"
                : status && !error
                  ? status
                  : "Automatisch gespeichert"
              : undefined
          }
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
          onFollowup={createFollowup}
        />

        {detail.relations && (detail.relations.original || detail.relations.corrections.length > 0) && (
          <RelationChain
            original={detail.relations.original}
            corrections={detail.relations.corrections}
            onOpen={(id) => onOpen?.(id)}
          />
        )}

        {status && !error && !isDraft && (
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

        <IssuerBlock
          issuer={currentDetail!.issuer}
          isSnapshot={!isDraft}
          onSaved={async () => {
            setPreviewNonce((n) => n + 1);
            await onChanged();
            setStatus("Aussteller aktualisiert.");
          }}
          onError={(msg) => setError(msg)}
        />

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
          taxRegime={currentDetail!.issuer.taxRegime}
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
  autosaveHint,
}: {
  invoice: InvoiceDetail;
  overdue: boolean;
  onClose: () => void;
  autosaveHint?: string;
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
      className="rounded-2xl border px-4 py-3"
      style={{
        borderColor: `${color}44`,
        background: `linear-gradient(135deg, ${color}10 0%, rgba(15,17,22,0.7) 60%)`,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button onClick={onClose} className="text-[11px] text-[#9CA3AF] hover:text-white">
          ← Rechnungen
        </button>
        {autosaveHint && (
          <span className="text-[10px] text-[#6B7280]">{autosaveHint}</span>
        )}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-lg font-semibold text-white">
              {invoice.invoiceNumber ? `Rechnung Nr. ${invoice.invoiceNumber}` : "Neuer Entwurf"}
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest"
              style={{ borderColor: `${color}55`, background: `${color}20`, color }}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: color }} />
              {label}
            </span>
            {invoice.type === "credit_note" && (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9CA3AF]">
                Gutschrift
              </span>
            )}
          </div>
          <div className="mt-1 truncate text-xs text-[#9CA3AF]">
            {invoice.customer.name || "Kein Kunde"}
            {invoice.project?.name && <> · {invoice.project.name}</>}
            <span className="mx-1.5">·</span>
            <span>{formatDeDate(invoice.invoiceDate)}</span>
            <span className="mx-1.5">·</span>
            <span style={{ color: overdue ? "#EF4444" : undefined }}>fällig {formatDeDate(invoice.dueDate)}</span>
            {invoice.references?.originalInvoiceNumber && (
              <>
                <span className="mx-1.5">·</span>
                <span>Korrektur zu Nr. {invoice.references.originalInvoiceNumber}</span>
              </>
            )}
          </div>
          <div className="mt-0.5 text-[10px] text-[#6B7280]">{dueHint}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums" style={{ color: accent }}>
            {formatEUR(invoice.totals.grossCents, invoice.totals.currency)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">Gesamtbetrag</div>
        </div>
      </div>
    </div>
  );
}

/* ── Referenz-Chain (Original ↔ Korrektur) ────────────────────────── */

function RelationChain({
  original,
  corrections,
  onOpen,
}: {
  original: RelatedInvoice | null;
  corrections: RelatedInvoice[];
  onOpen?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {original && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-amber-300/70">Korrektur zu</span>
            <button
              onClick={() => onOpen?.(original.id)}
              className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 font-medium text-amber-100 hover:bg-amber-500/20"
            >
              Rechnung Nr. {original.invoiceNumber ?? "—"}
            </button>
            <span className="text-[11px] text-amber-200/60">
              {formatDeDate(original.invoiceDate)} · {formatEUR(original.grossCents, original.currency)}
            </span>
          </div>
        )}
        {corrections.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-amber-300/70">Korrigiert durch</span>
            {corrections.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpen?.(c.id)}
                className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 font-medium text-amber-100 hover:bg-amber-500/20"
                title={`${c.status} · ${formatDeDate(c.invoiceDate)}`}
              >
                {c.invoiceNumber ? `Rechnung Nr. ${c.invoiceNumber}` : "Entwurf"}
                <span className="ml-1 text-[10px] text-amber-200/70">
                  {formatEUR(c.grossCents, c.currency)}
                </span>
              </button>
            ))}
          </div>
        )}
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
  onFollowup,
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
  onFollowup?: () => void;
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
            onClick={onFinalize}
            disabled={saving}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
            style={{ boxShadow: "0 0 12px rgba(59,130,246,0.6)" }}
          >
            Finalisieren
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-[#9CA3AF] hover:bg-white/[0.06] disabled:opacity-50"
            title="Änderungen werden automatisch gespeichert — dieser Button erzwingt es sofort."
          >
            {saving ? "Speichere…" : "Jetzt speichern"}
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
          {onFollowup && invoice.status !== "cancelled" && (
            <button
              onClick={onFollowup}
              className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 hover:bg-blue-500/20"
              title="Folgerechnung mit denselben Positionen für die nächste Periode"
            >
              + Folgerechnung
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
  taxRegime,
}: {
  items: InvoiceItem[];
  currency: string;
  readonly: boolean;
  onChange: (items: InvoiceItem[]) => void;
  taxRegime?: string;
}) {
  const hideTaxSelector = taxRegime === "kleinunternehmer";
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
                  {!hideTaxSelector && (
                    <div className="col-span-2 lg:col-span-1">
                      <MobileLabeled label="Steuer">
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
                      </MobileLabeled>
                    </div>
                  )}
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
function MobileLabeled({ label, children }: { label: string; children: ReactNode }) {
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
  const [editing, setEditing] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const compact = !editing;

  const truncate = (s?: string | null, n = 90) => {
    if (!s) return "—";
    const t = s.trim();
    if (t.length <= n) return t;
    return t.slice(0, n).trim() + "…";
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Texte</div>
        {!readonly && (
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] text-white hover:bg-white/[0.06]"
          >
            {editing ? "Fertig" : "Bearbeiten"}
          </button>
        )}
      </div>

      {compact ? (
        <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
          <SummaryText label="Anrede" text={value.salutation} />
          <SummaryText label="Einleitung" text={truncate(value.intro)} />
          <SummaryText label="Schlusstext" text={truncate(value.outro)} />
          {(value.customerNote || value.internalNote) && (
            <div className="md:col-span-3 mt-1 flex flex-wrap gap-4 text-[11px] text-[#9CA3AF]">
              {value.customerNote && (
                <span>
                  <span className="text-[#6B7280]">Kundenhinweis: </span>
                  {truncate(value.customerNote, 60)}
                </span>
              )}
              {value.internalNote && (
                <span className="rounded border border-dashed border-amber-400/40 bg-amber-400/[0.04] px-1.5 py-0.5 text-amber-200">
                  <span className="text-amber-400/70">Interne Notiz (nicht auf Rechnung): </span>
                  {truncate(value.internalNote, 60)}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Textarea
              label="Anrede"
              value={value.salutation ?? ""}
              readonly={readonly}
              onChange={(v) => onChange({ ...value, salutation: v })}
            />
            <Textarea
              label="Einleitung"
              value={value.intro ?? ""}
              readonly={readonly}
              onChange={(v) => onChange({ ...value, intro: v })}
            />
            <Textarea
              label="Schlusstext"
              value={value.outro ?? ""}
              readonly={readonly}
              onChange={(v) => onChange({ ...value, outro: v })}
              full
            />
          </div>

          <button
            onClick={() => setShowMore((v) => !v)}
            className="text-[11px] text-[#9CA3AF] hover:text-white"
          >
            {showMore ? "− Weitere Texte ausblenden" : "+ Weitere Texte (Kundenhinweis, interne Notiz, Kleinunternehmer)"}
          </button>

          {showMore && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Textarea
                label="Kundenhinweis"
                value={value.customerNote ?? ""}
                readonly={readonly}
                onChange={(v) => onChange({ ...value, customerNote: v })}
              />
              <Textarea
                label="Interne Notiz (nicht auf Rechnung)"
                value={value.internalNote ?? ""}
                readonly={readonly}
                onChange={(v) => onChange({ ...value, internalNote: v })}
              />
              <Textarea
                label="Kleinunternehmer-Hinweis (aus Aussteller)"
                value={value.smallBusinessNote ?? ""}
                readonly
                full
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryText({ label, text }: { label: string; text?: string | null }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</div>
      <div className="mt-0.5 truncate text-[#D1D5DB]">{text || "—"}</div>
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

/* ── Aussteller-Block (mit Drag-&-Drop-Logo) ──────────────────────── */

function IssuerBlock({
  issuer,
  isSnapshot,
  onSaved,
  onError,
}: {
  issuer: InvoiceDetail["issuer"];
  isSnapshot: boolean;
  onSaved: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Partial<InvoiceDetail["issuer"]>>({});
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const merged = useMemo(() => {
    const addr = { ...issuer.address, ...(draft.address ?? {}) };
    const contact = { ...issuer.contact, ...(draft.contact ?? {}) };
    const bank = { ...issuer.bank, ...(draft.bank ?? {}) };
    return { ...issuer, ...draft, address: addr, contact, bank };
  }, [issuer, draft]);

  const dirty = Object.keys(draft).length > 0;
  const issuerId = issuer.id;

  const patchIssuer = async (payload: Record<string, unknown>): Promise<boolean> => {
    if (!issuerId) {
      onError("Diese Rechnung nutzt einen historischen Aussteller-Snapshot und kann nicht mehr geändert werden.");
      return false;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/billing/issuers/${issuerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || "Speichern fehlgeschlagen");
        return false;
      }
      setDraft({});
      await onSaved();
      return true;
    } catch (e) {
      onError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = () => patchIssuer(draft as Record<string, unknown>);

  const uploadLogo = async (file: File) => {
    if (!issuerId) {
      onError("Aussteller-ID fehlt – Snapshot kann kein Logo ändern.");
      return;
    }
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      onError("Bitte PNG oder JPG hochladen.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onError("Maximale Dateigröße 2 MB.");
      return;
    }
    setLogoBusy(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      const res = await fetch(`/api/admin/billing/issuers/${issuerId}/logo`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || "Logo konnte nicht hochgeladen werden.");
        return;
      }
      setLogoVersion((v) => v + 1);
      await onSaved();
    } finally {
      setLogoBusy(false);
    }
  };

  const removeLogo = async () => {
    if (!issuerId) return;
    if (!confirm("Logo entfernen? Das Vektor-Fallback (Play-Icon + Wortmarke) wird wieder verwendet.")) return;
    setLogoBusy(true);
    try {
      const res = await fetch(`/api/admin/billing/issuers/${issuerId}/logo`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || "Logo konnte nicht entfernt werden.");
        return;
      }
      setLogoVersion((v) => v + 1);
      await onSaved();
    } finally {
      setLogoBusy(false);
    }
  };

  const onDropFile = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (isSnapshot) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadLogo(file);
  };

  const logoAssetId = merged.logoPath?.startsWith("asset:") ? merged.logoPath.slice(6) : null;
  const logoSrc = logoAssetId ? `/api/admin/billing/assets/${logoAssetId}?v=${logoVersion}` : null;
  const accent = merged.accentColor || "#4CB4EE";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Header — always visible */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xs font-semibold"
          style={{ color: accent }}
        >
          {merged.brandLabel?.slice(0, 2).toUpperCase() || "AW"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
            Aussteller
            {isSnapshot && (
              <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] normal-case text-[#9CA3AF]">
                historischer Snapshot · read-only
              </span>
            )}
          </div>
          <div className="truncate text-sm text-white">
            {merged.brandLabel} · {merged.address?.line1}, {merged.address?.postalCode} {merged.address?.city}
          </div>
        </div>
        <button
          onClick={() => setExpanded((x) => !x)}
          className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
        >
          {expanded ? "Schließen" : isSnapshot ? "Ansehen" : "Bearbeiten"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4">
          {!isSnapshot && (
            <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-2 text-[11px] text-amber-200">
              Achtung: Änderungen am Aussteller wirken sich auf <b>alle zukünftigen Rechnungen</b> dieses Ausstellers aus.
              Bereits finalisierte Rechnungen behalten ihren historischen Snapshot.
            </div>
          )}

          {/* Drag-&-Drop Logo-Zone */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-widest text-[#6B7280]">Logo</div>
              <div
                onDragOver={(e) => {
                  if (isSnapshot) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDropFile}
                onClick={() => !isSnapshot && !logoBusy && fileRef.current?.click()}
                className={`group relative flex h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                  dragActive
                    ? "border-blue-400 bg-blue-500/[0.08]"
                    : "border-white/10 bg-black/30 hover:border-white/20"
                } ${isSnapshot ? "cursor-not-allowed opacity-70" : ""}`}
                style={{ borderColor: dragActive ? accent : undefined }}
              >
                {logoSrc ? (
                  <>
                    { }
                    <img
                      src={logoSrc}
                      alt="Logo"
                      className="max-h-32 max-w-[85%] object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between border-t border-white/10 bg-black/60 px-3 py-1.5 text-[10px] text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100">
                      <span>Klicken oder Datei ziehen zum Ersetzen</span>
                      {!isSnapshot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void removeLogo();
                          }}
                          className="text-red-200 hover:text-red-100"
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-[#6B7280]">
                      <path d="M4 16.5V5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v11" />
                      <path d="M4 16.5 8.5 12l4.5 4 3-3 4 4" />
                      <circle cx="9" cy="8" r="1.5" />
                    </svg>
                    <div className="mt-2 text-xs text-white">
                      Logo hier ablegen
                    </div>
                    <div className="text-[10px] text-[#6B7280]">
                      oder klicken · PNG/JPG · bis 2 MB
                    </div>
                  </>
                )}
                {logoBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">
                    Lade …
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadLogo(f);
                  e.currentTarget.value = "";
                }}
              />
              <div className="mt-2 text-[10px] text-[#6B7280]">
                Kein Logo? Der Renderer zeichnet automatisch das AGI-Vektor-Logo (Play-Icon + Wortmarke) als Platzhalter.
              </div>
            </div>

            {/* Farbe + Brand */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LabeledInput
                label="Brand-Label (im Logo & Header)"
                value={merged.brandLabel ?? ""}
                disabled={isSnapshot}
                onChange={(v) => setDraft((d) => ({ ...d, brandLabel: v }))}
              />
              <LabeledInput
                label="Firmierung (Legal Name)"
                value={merged.legalName ?? ""}
                disabled={isSnapshot}
                onChange={(v) => setDraft((d) => ({ ...d, legalName: v }))}
              />
              <LabeledInput
                label="Inhaber / Owner"
                value={merged.owner ?? ""}
                disabled={isSnapshot}
                onChange={(v) => setDraft((d) => ({ ...d, owner: v }))}
              />
              <LabeledInput
                label="Header-Tagline (Absenderzeile & Footer)"
                value={merged.headerTagline ?? ""}
                disabled={isSnapshot}
                onChange={(v) => setDraft((d) => ({ ...d, headerTagline: v }))}
              />
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">
                  Akzentfarbe (Titel, Gesamtpreis, Tabellenkopf, Footer)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    disabled={isSnapshot}
                    value={merged.accentColor || "#4CB4EE"}
                    onChange={(e) => setDraft((d) => ({ ...d, accentColor: e.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-black/40 disabled:opacity-60"
                  />
                  <input
                    type="text"
                    disabled={isSnapshot}
                    value={merged.accentColor || "#4CB4EE"}
                    onChange={(e) => setDraft((d) => ({ ...d, accentColor: e.target.value }))}
                    className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white focus:outline-none disabled:opacity-60"
                  />
                  <div
                    className="flex h-10 w-24 items-center justify-center rounded-lg text-xs font-semibold text-white"
                    style={{ background: merged.accentColor || "#4CB4EE" }}
                  >
                    Vorschau
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Adresse + Kontakt */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-[#6B7280]">Postanschrift</div>
              <div className="space-y-2">
                <LabeledInput
                  label="Straße + Hausnummer"
                  value={merged.address?.line1 ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, address: { ...merged.address, line1: v } }))}
                />
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <LabeledInput
                    label="PLZ"
                    value={merged.address?.postalCode ?? ""}
                    disabled={isSnapshot}
                    onChange={(v) => setDraft((d) => ({ ...d, address: { ...merged.address, postalCode: v } }))}
                  />
                  <LabeledInput
                    label="Ort"
                    value={merged.address?.city ?? ""}
                    disabled={isSnapshot}
                    onChange={(v) => setDraft((d) => ({ ...d, address: { ...merged.address, city: v } }))}
                  />
                </div>
                <LabeledInput
                  label="Land (ISO, z. B. DE)"
                  value={merged.address?.country ?? "DE"}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, address: { ...merged.address, country: v.toUpperCase() } }))}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-[#6B7280]">Kontakt</div>
              <div className="space-y-2">
                <LabeledInput
                  label="E-Mail"
                  type="email"
                  value={merged.contact?.email ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, contact: { ...merged.contact, email: v } }))}
                />
                <LabeledInput
                  label="Telefon"
                  value={merged.contact?.phone ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, contact: { ...merged.contact, phone: v || null } }))}
                />
                <LabeledInput
                  label="Handy"
                  value={merged.contact?.mobile ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, contact: { ...merged.contact, mobile: v || null } }))}
                />
                <LabeledInput
                  label="Website"
                  value={merged.contact?.website ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, contact: { ...merged.contact, website: v || null } }))}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-[#6B7280]">Steuer</div>
              <div className="space-y-2">
                <LabeledInput
                  label="Steuernummer (Finanzamt)"
                  value={merged.taxNumber ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, taxNumber: v || null }))}
                />
                <LabeledInput
                  label="USt-ID (falls vorhanden)"
                  value={merged.vatId ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, vatId: v || null }))}
                />
                <LabeledInput
                  label="Kleinunternehmer-Hinweis"
                  value={merged.smallBusinessNote ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, smallBusinessNote: v }))}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-[#6B7280]">Bankverbindung</div>
              <div className="space-y-2">
                <LabeledInput
                  label="Bankname"
                  value={merged.bank?.bankName ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, bank: { ...merged.bank, bankName: v } }))}
                />
                <LabeledInput
                  label="IBAN"
                  value={merged.bank?.iban ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, bank: { ...merged.bank, iban: v } }))}
                />
                <LabeledInput
                  label="BIC"
                  value={merged.bank?.bic ?? ""}
                  disabled={isSnapshot}
                  onChange={(v) => setDraft((d) => ({ ...d, bank: { ...merged.bank, bic: v } }))}
                />
              </div>
            </div>
          </div>

          {!isSnapshot && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {dirty && (
                <span className="text-[11px] text-[#9CA3AF]">Ungespeicherte Änderungen</span>
              )}
              <button
                disabled={!dirty || saving}
                onClick={() => setDraft({})}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06] disabled:opacity-40"
              >
                Verwerfen
              </button>
              <button
                disabled={!dirty || saving}
                onClick={() => void save()}
                className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
                style={{ boxShadow: "0 0 12px rgba(59,130,246,0.55)" }}
              >
                {saving ? "Speichere …" : "Aussteller speichern"}
              </button>
            </div>
          )}
        </div>
      )}
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
  const [editing, setEditing] = useState(false);
  const addr = value.address || { line1: "", line2: "", postalCode: "", city: "", country: "DE" };
  const summaryLines = useMemo(() => {
    const out = [
      value.name?.trim(),
      value.contactPerson?.trim() || null,
      addr.line1?.trim(),
      addr.line2?.trim() || null,
      `${addr.postalCode ?? ""} ${addr.city ?? ""}`.trim(),
      addr.country && addr.country !== "DE" ? addr.country : null,
    ].filter((s): s is string => !!s && s.length > 0);
    return out;
  }, [value, addr]);

  const compact = !editing;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Empfänger</div>
          {!isDraft && (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9CA3AF]">
              historisch · unveränderlich
            </span>
          )}
        </div>
        {isDraft && (
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] text-white hover:bg-white/[0.06]"
          >
            {editing ? "Fertig" : "Ändern"}
          </button>
        )}
      </div>

      {compact ? (
        summaryLines.length > 0 ? (
          <div className="space-y-0.5 text-sm text-white">
            {summaryLines.map((line, i) => (
              <div key={i} className={i === 0 ? "font-medium" : "text-[#D1D5DB]"}>
                {line}
              </div>
            ))}
            {(value.email || value.buyerReference) && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#9CA3AF]">
                {value.email && <span>{value.email}</span>}
                {value.buyerReference && <span>Buyer-Ref: {value.buyerReference}</span>}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-3 text-xs text-[#9CA3AF]">
            Noch keine Empfängerdaten. Klicke &quot;Ändern&quot;, um Firma und Anschrift zu erfassen.
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <LabeledInput
            label="Firmenname *"
            value={value.name ?? ""}
            onChange={(v) => onChange({ name: v })}
          />
          <LabeledInput
            label="Ansprechpartner"
            value={value.contactPerson ?? ""}
            onChange={(v) => onChange({ contactPerson: v || null })}
          />
          <LabeledInput
            label="Straße + Hausnummer *"
            value={addr.line1 ?? ""}
            onChange={(v) => onChange({ address: { ...addr, line1: v } })}
          />
          <LabeledInput
            label="Zusatz (Etage, Postfach)"
            value={addr.line2 ?? ""}
            onChange={(v) => onChange({ address: { ...addr, line2: v || null } })}
          />
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
            <LabeledInput
              label="PLZ *"
              value={addr.postalCode ?? ""}
              onChange={(v) => onChange({ address: { ...addr, postalCode: v } })}
            />
            <LabeledInput
              label="Ort *"
              value={addr.city ?? ""}
              onChange={(v) => onChange({ address: { ...addr, city: v } })}
            />
          </div>
          <LabeledInput
            label="Land (ISO)"
            value={addr.country ?? "DE"}
            onChange={(v) => onChange({ address: { ...addr, country: v.toUpperCase() } })}
          />
          <LabeledInput
            label="E-Mail"
            type="email"
            value={value.email ?? ""}
            onChange={(v) => onChange({ email: v || null })}
          />
          <LabeledInput
            label="Buyer-Reference / Bestellnr."
            value={value.buyerReference ?? ""}
            onChange={(v) => onChange({ buyerReference: v || null })}
          />
        </div>
      )}
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

    // Aussteller: legalName ODER brandLabel akzeptieren (viele Kleinunternehmer
    // haben nur eine Marke, keinen abweichenden Handelsnamen).
    const issuerNameOk = !!(iss.legalName?.trim() || iss.brandLabel?.trim());
    const issuerAddrOk = !!iss.address?.line1?.trim() && !!iss.address?.postalCode?.trim() && !!iss.address?.city?.trim();
    c.push({ key: "issuer_name", label: "Aussteller: Name & Anschrift vollständig", ok: issuerNameOk && issuerAddrOk, severity: "error" });
    c.push({ key: "customer_name", label: "Empfänger: Firmenname", ok: !!cust.name?.trim(), severity: "error" });
    c.push({ key: "customer_addr", label: "Empfänger: Straße, PLZ und Ort", ok: !!addr.line1?.trim() && !!addr.postalCode?.trim() && !!addr.city?.trim(), severity: "error" });
    c.push({ key: "invoice_date", label: "Ausstellungsdatum gesetzt", ok: !!detail.invoiceDate, severity: "error" });
    c.push({ key: "period", label: "Leistungszeitraum (§ 14 Abs. 4 UStG)", ok: !!detail.servicePeriod?.start && !!detail.servicePeriod?.end, severity: "error" });

    // Positionen: klar getrennte Checks statt einer irreführenden
    // Sammelmeldung "Position fehlt", die auch bei Preis 0 feuerte.
    const hasAnyItem = detail.items.length > 0;
    const allTitles = hasAnyItem && detail.items.every((it) => it.title.trim().length > 0);
    const allQty = hasAnyItem && detail.items.every((it) => it.quantityMilli > 0);
    const allPrice = hasAnyItem && detail.items.every((it) => it.unitPriceCents > 0);
    c.push({ key: "items_any", label: "Mindestens eine Position", ok: hasAnyItem, severity: "error" });
    if (hasAnyItem) {
      c.push({ key: "items_titles", label: "Alle Positionen haben einen Titel", ok: allTitles, severity: "error" });
      c.push({ key: "items_qty", label: "Alle Positionen haben eine Menge > 0", ok: allQty, severity: "error" });
      c.push({
        key: "items_price",
        label: "Alle Positionen haben einen Einzelpreis > 0",
        ok: allPrice,
        severity: "warn",
      });
    }

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
  const compactLabel = ok
    ? warnings.length === 0
      ? "E-Rechnungs-tauglich"
      : `${warnings.length} Hinweis${warnings.length === 1 ? "" : "e"}`
    : `${errors.length} Angabe${errors.length === 1 ? "" : "n"} fehlt`;

  const [open, setOpen] = useState(false);

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
      style={{ borderColor: `${color}44`, background: `${color}0A` }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: `${color}22`, color }}
        >
          {ok ? "✓" : "!"}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold" style={{ color }}>
            {compactLabel}
          </div>
          <div className="truncate text-[10px] text-[#6B7280]">
            EN 16931 · § 14 UStG · XRechnung / ZUGFeRD
          </div>
        </div>
      </div>
      {(errors.length > 0 || warnings.length > 0) && (
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-medium text-white hover:bg-white/10"
        >
          Prüfen
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0E14] p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Rechnung prüfen</div>
              <button onClick={() => setOpen(false)} className="text-[11px] text-[#9CA3AF] hover:text-white">
                Schließen
              </button>
            </div>
            <ul className="space-y-2 text-xs">
              {errors.map((e) => (
                <li key={e.key} className="flex items-start gap-2 text-red-200">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span>{e.label}</span>
                </li>
              ))}
              {warnings.map((w) => (
                <li key={w.key} className="flex items-start gap-2 text-amber-200">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>{w.label}</span>
            </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
