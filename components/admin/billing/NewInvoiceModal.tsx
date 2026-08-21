"use client";

/**
 * Quick-Create-Modal für neue Rechnungen.
 *
 * Absichtlich minimalistisch:
 * 1) Aussteller wählen (auto-preselected, wenn nur einer aktiv ist).
 * 2) Kunde per Suche wählen oder inline neu anlegen.
 * 3) Klick "Rechnung erstellen" → Editor öffnet sich sofort mit
 *    vorbelegtem Aussteller, Kunde, nächster Rechnungsnummer, heutigem
 *    Datum + Standardpayment-Terms + einer leeren Default-Position.
 *
 * Kein Turnus, keine Frequenz, keine „Folgerechnung"-Modalität — das
 * lebt in der Queue-Ansicht. Dieser Flow ist der Standard-Fall.
 */

import { useEffect, useState } from "react";
import type { IssuerInfo } from "./shared";

interface Customer {
  id: string;
  name: string;
  contactPerson?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
}

interface NewInvoiceModalProps {
  issuers: IssuerInfo[];
  accent: string;
  onCancel: () => void;
  onCreated: (invoiceId: string) => void;
}

export default function NewInvoiceModal({ issuers, accent, onCancel, onCreated }: NewInvoiceModalProps) {
  const [issuerId, setIssuerId] = useState<string>(issuers[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [newName, setNewName] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newLine1, setNewLine1] = useState("");
  const [newPostal, setNewPostal] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("DE");
  const [newEmail, setNewEmail] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const url = query.trim().length > 0
      ? `/api/admin/billing/customers?q=${encodeURIComponent(query.trim())}`
      : "/api/admin/billing/customers";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setCustomers(data.customers ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setCustomers([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query]);

  const create = async () => {
    if (!issuerId) {
      setError("Bitte Firma wählen.");
      return;
    }
    if (!customerId) {
      setError("Bitte Kunde wählen oder neu anlegen.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "manual",
          issuerId,
          customerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erstellung fehlgeschlagen");
      onCreated(data.invoice.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const createNewCustomer = async () => {
    if (!newName.trim()) {
      setError("Firmenname darf nicht leer sein.");
      return;
    }
    if (!newLine1.trim() || !newPostal.trim() || !newCity.trim()) {
      setError("Straße, PLZ und Ort sind Pflicht.");
      return;
    }
    setCreatingCustomer(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/billing/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          contactPerson: newContactPerson.trim() || null,
          email: newEmail.trim() || null,
          address: {
            line1: newLine1.trim(),
            postalCode: newPostal.trim(),
            city: newCity.trim(),
            country: newCountry.trim() || "DE",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde konnte nicht angelegt werden");
      const cust = data.customer as Customer;
      setCustomers((prev) => [cust, ...prev]);
      setCustomerId(cust.id);
      setShowNewCustomer(false);
      setNewName("");
      setNewContactPerson("");
      setNewLine1("");
      setNewPostal("");
      setNewCity("");
      setNewEmail("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreatingCustomer(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E14] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
          <div>
            <div className="text-base font-semibold text-white">Neue Rechnung</div>
            <div className="mt-0.5 text-xs text-[#9CA3AF]">
              Firma wählen, Kunde wählen, fertig – Editor öffnet sich sofort.
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white"
          >
            Schließen
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Aussteller / Firma */}
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-[#6B7280]">
              1 · Firma (Aussteller)
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {issuers.map((iss) => {
                const selected = iss.id === issuerId;
                return (
                  <button
                    key={iss.id}
                    type="button"
                    onClick={() => setIssuerId(iss.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                    style={selected ? { boxShadow: `0 0 0 1px ${iss.accent}66 inset` } : undefined}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: iss.accent }}
                        />
                        <span className="truncate">{iss.label}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#9CA3AF]">
                        Nächste Rechnungsnummer: <span className="font-semibold text-white">Nr. {iss.nextNumber}</span>
                      </div>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border ${
                        selected ? "border-white bg-white" : "border-white/30"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kunde */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#6B7280]">
                2 · Kunde (Empfänger)
              </div>
              <button
                type="button"
                onClick={() => setShowNewCustomer((v) => !v)}
                className="text-[11px] text-white hover:underline"
              >
                {showNewCustomer ? "Zurück zur Auswahl" : "+ Neuer Kunde"}
              </button>
            </div>

            {!showNewCustomer && (
              <>
                <input
                  type="text"
                  placeholder="Kunde suchen …"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-[#4B5563] focus:border-white/30 focus:outline-none"
                />

                <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-white/[0.05] bg-black/30">
                  {loading && (
                    <div className="p-4 text-center text-xs text-[#6B7280]">Lade Kunden …</div>
                  )}
                  {!loading && customers.length === 0 && (
                    <div className="p-4 text-center text-xs text-[#6B7280]">
                      Keine Treffer. Neu anlegen mit &quot;+ Neuer Kunde&quot;.
                    </div>
                  )}
                  {!loading &&
                    customers.map((c) => {
                      const selected = customerId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCustomerId(c.id)}
                          className={`flex w-full items-center justify-between border-b border-white/[0.03] px-3 py-2 text-left text-sm transition-colors last:border-b-0 ${
                            selected ? "bg-white/[0.06] text-white" : "text-[#E5E7EB] hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">{c.name}</div>
                            {c.address?.line1 && (
                              <div className="mt-0.5 truncate text-[11px] text-[#6B7280]">
                                {c.address.line1}
                                {c.address.postalCode ? `, ${c.address.postalCode} ${c.address.city ?? ""}` : ""}
                              </div>
                            )}
                          </div>
                          <div
                            className={`h-4 w-4 shrink-0 rounded-full border ${
                              selected ? "border-white bg-white" : "border-white/30"
                            }`}
                          />
                        </button>
                      );
                    })}
                </div>
              </>
            )}

            {showNewCustomer && (
              <div className="space-y-2 rounded-lg border border-white/[0.05] bg-black/30 p-3">
                <input
                  placeholder="Firmenname *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                />
                <input
                  placeholder="Ansprechpartner (optional)"
                  value={newContactPerson}
                  onChange={(e) => setNewContactPerson(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                />
                <input
                  placeholder="Straße & Nr. *"
                  value={newLine1}
                  onChange={(e) => setNewLine1(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                />
                <div className="grid grid-cols-[100px_minmax(0,1fr)_90px] gap-2">
                  <input
                    placeholder="PLZ *"
                    value={newPostal}
                    onChange={(e) => setNewPostal(e.target.value)}
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  />
                  <input
                    placeholder="Ort *"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  />
                  <input
                    placeholder="Land"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
                <input
                  placeholder="E-Mail (optional)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                />
                <button
                  onClick={createNewCustomer}
                  disabled={creatingCustomer}
                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                >
                  {creatingCustomer ? "Speichere …" : "Kunde anlegen und übernehmen"}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/[0.05] p-2 text-[11px] text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] bg-black/30 px-5 py-3">
          <div className="text-[11px] text-[#6B7280]">
            {customerId && issuerId
              ? "Alles bereit. Editor öffnet sich sofort nach dem Klick."
              : "Wähle Firma und Kunde – dann kannst du erstellen."}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white"
            >
              Abbrechen
            </button>
            <button
              onClick={create}
              disabled={!issuerId || !customerId || creating}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: accent, boxShadow: `0 0 12px ${accent}55` }}
            >
              {creating ? "Erstelle …" : "Rechnung erstellen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
