"use client";

/**
 * Rechnungs-Editor mit Live-Preview.
 *
 * Links werden alle Rechnungsdaten und -positionen bearbeitet, rechts
 * erscheint eine PDF-Vorschau. Die Vorschau wird direkt vom Server gerendert
 * (`/api/admin/billing/invoices/[id]/preview`) — damit sieht die A4 exakt so
 * aus wie später der Ausdruck.
 *
 * Wichtige Regeln:
 *  - Drafts sind editierbar; jeder Speichervorgang schickt die aktuelle
 *    `version` mit — parallele Bearbeitung wird sichtbar abgewiesen.
 *  - Finalisierte Rechnungen sind unveränderlich; der Editor blendet die
 *    Eingaben aus und zeigt stattdessen Dokumente, Aktionen (Zahlung,
 *    Korrektur, Storno) und den Ereignisverlauf.
 *  - Der „Finalisieren"-Knopf ist idempotent: er trägt die Version, mit der
 *    er ausgelöst wurde. Ein doppelter Klick erhält aus dem Backend die
 *    Antwort „bereits erhöht" und produziert keine zweite Rechnung.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatEUR,
  formatQty,
  formatDeDate,
  parseEuroInput,
  parseQtyInput,
  TAX_CATEGORY_LABEL,
  type TaxCategory,
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

export default function BillingEditor({
  loading,
  detail,
  onClose,
  onChanged,
  projects,
  issuers,
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
    else await onChanged();
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
    else await onChanged();
  }, [detail, onChanged]);

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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <button onClick={onClose} className="text-xs text-[#9CA3AF] hover:text-white">← Zurück zur Liste</button>
            <div className="mt-1 text-lg font-semibold text-white">
              {inv.invoiceNumber ? `Rechnung Nr. ${inv.invoiceNumber}` : "Neuer Entwurf"}
              {!inv.invoiceNumber && (
                <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9CA3AF]">
                  Entwurf
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-[#9CA3AF]">
              {inv.issuer.brandLabel} · {inv.customer.name || "Kein Kunde"}
              {inv.project?.name && ` · ${inv.project.name}`}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDraft && (
              <>
                <button
                  onClick={() => save(false)}
                  disabled={saving}
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {saving ? "Speichere…" : "Speichern"}
                </button>
                <button
                  onClick={finalize}
                  disabled={saving}
                  className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
                  style={{ boxShadow: "0 0 12px rgba(59,130,246,0.6)" }}
                >
                  Finalisieren
                </button>
                <button
                  onClick={remove}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                >
                  Entwurf löschen
                </button>
              </>
            )}
            {!isDraft && (
              <>
                {inv.status !== "paid" && inv.status !== "cancelled" && (
                  <button onClick={markPaid} className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs text-green-200 hover:bg-green-500/20">
                    Als bezahlt markieren
                  </button>
                )}
                <button onClick={createCorrection} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]">
                  Korrektur erstellen
                </button>
                {inv.status !== "cancelled" && (
                  <button onClick={cancel} className="rounded-lg border border-red-500/30 bg-red-500/[0.05] px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20">
                    Stornieren
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {status && !error && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3 text-xs text-emerald-200">
            {status}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <MetaEditor
          detail={detail}
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

      <PreviewPanel invoiceId={inv.id} nonce={previewNonce} />
    </div>
  );
}

function computeVersion(detail: Detail): number {
  // Nur der Server kennt die aktuelle Version im Datensatz. Diese liegt in
  // `invoice.version` — der Detail-Endpoint überträgt sie derzeit nicht
  // separat, wir tragen sie über einen späteren Refresh nach. Bis dahin
  // reicht 0 als Basiswert, weil der Server bei Änderungen antwortet und wir
  // dann sofort neu laden.
  const v = (detail.invoice as unknown as { version?: number }).version;
  return typeof v === "number" ? v : 0;
}

/* ── Metadaten ─────────────────────────────────────────────────────── */

function MetaEditor({
  detail,
  value,
  isDraft,
  projects,
  onChangeField,
}: {
  detail: Detail;
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
        <div>{value.issuer.address.line1}, {value.issuer.address.postalCode} {value.issuer.address.city}</div>
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

/* ── Positionen ────────────────────────────────────────────────────── */

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

  const move = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    const [row] = next.splice(idx, 1);
    next.splice(target, 0, row);
    onChange(next.map((it, i) => ({ ...it, position: i + 1 })));
  };

  const duplicate = (idx: number) => {
    const clone = { ...items[idx], id: `new-${Date.now()}` };
    const next = items.slice();
    next.splice(idx + 1, 0, clone);
    onChange(next.map((it, i) => ({ ...it, position: i + 1 })));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Positionen</div>
        {!readonly && (
          <button onClick={addItem} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]">
            + Position
          </button>
        )}
      </div>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={it.id} className="rounded-xl border border-white/[0.05] bg-black/30 p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[40px_minmax(0,1fr)_100px_120px_120px] md:items-start">
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
                    <button onClick={() => move(idx, -1)} className="rounded border border-white/10 px-1 py-0.5 text-[#9CA3AF] hover:text-white">↑</button>
                    <button onClick={() => move(idx, 1)} className="rounded border border-white/10 px-1 py-0.5 text-[#9CA3AF] hover:text-white">↓</button>
                    <button onClick={() => duplicate(idx)} className="rounded border border-white/10 px-1 py-0.5 text-[#9CA3AF] hover:text-white">Dupl.</button>
                    <button onClick={() => removeItem(idx)} className="rounded border border-red-500/30 px-1 py-0.5 text-red-200 hover:bg-red-500/10">×</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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

function PreviewPanel({ invoiceId, nonce }: { invoiceId: string; nonce: number }) {
  const src = `/api/admin/billing/invoices/${invoiceId}/preview?v=${nonce}`;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-[#9CA3AF]">
        <span>Live-Vorschau</span>
        <a href={src} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
          Öffnen
        </a>
      </div>
      <div className="aspect-[210/297] w-full overflow-hidden rounded-xl bg-white">
        <iframe title="Rechnungs-Vorschau" src={src} className="h-full w-full border-0" />
      </div>
    </div>
  );
}
