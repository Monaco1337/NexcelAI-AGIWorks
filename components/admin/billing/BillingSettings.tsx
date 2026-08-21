"use client";

/**
 * Aussteller-Einstellungen.
 *
 * Zeigt für jeden konfigurierten Rechnungsaussteller die zentralen
 * Stammdaten. Konfigurationswarnungen werden prominent oben angezeigt —
 * z. B. die widersprüchliche PLZ zwischen Header und Footer der historischen
 * Rechnung Nr. 16, die als Datenqualitätsproblem hinterlegt ist.
 */

import { useEffect, useState } from "react";
import type { IssuerInfo } from "./shared";

interface IssuerFull extends IssuerInfo {
  brandLabel: string;
  legalName: string;
  owner: string;
  headerTagline: string;
  address: { line1: string; postalCode: string; city: string; country: string };
  contact: { email: string; phone?: string | null; mobile?: string | null; website?: string | null };
  taxNumber: string | null;
  vatId: string | null;
  taxRegime: string;
  smallBusinessNote: string;
  bank: { bankName: string; iban: string; bic: string };
  defaultCurrency: string;
  defaultPaymentTerms: number;
  defaultIntro: string;
  defaultOutro: string;
  accentColor: string;
}

export default function BillingSettings({
  issuers,
  onReload,
}: {
  issuers: IssuerInfo[];
  onReload: () => Promise<void>;
}) {
  const [fullList, setFullList] = useState<IssuerFull[]>([]);

  useEffect(() => {
    let alive = true;
    void fetch("/api/admin/billing/issuers")
      .then((r) => r.json())
      .then((data) => {
        if (alive) setFullList(data.issuers ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const list = fullList.length > 0 ? fullList : (issuers as unknown as IssuerFull[]);

  return (
    <div className="space-y-4">
      {list.map((iss) => (
        <IssuerCard key={iss.id} issuer={iss} onReload={onReload} />
      ))}
    </div>
  );
}

function IssuerCard({ issuer, onReload }: { issuer: IssuerFull; onReload: () => Promise<void> }) {
  const [values, setValues] = useState({
    brandLabel: issuer.brandLabel,
    legalName: issuer.legalName,
    owner: issuer.owner,
    headerTagline: issuer.headerTagline,
    line1: issuer.address.line1,
    postalCode: issuer.address.postalCode,
    city: issuer.address.city,
    email: issuer.contact.email,
    phone: issuer.contact.phone ?? "",
    mobile: issuer.contact.mobile ?? "",
    website: issuer.contact.website ?? "",
    taxNumber: issuer.taxNumber ?? "",
    vatId: issuer.vatId ?? "",
    taxRegime: issuer.taxRegime,
    smallBusinessNote: issuer.smallBusinessNote,
    bankName: issuer.bank.bankName,
    iban: issuer.bank.iban,
    bic: issuer.bank.bic,
    defaultCurrency: issuer.defaultCurrency,
    defaultPaymentTerms: issuer.defaultPaymentTerms,
    defaultIntro: issuer.defaultIntro,
    defaultOutro: issuer.defaultOutro,
    accentColor: issuer.accentColor,
    sequenceBaseline: issuer.lastNumber ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/billing/issuers/${issuer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandLabel: values.brandLabel,
          legalName: values.legalName,
          owner: values.owner,
          headerTagline: values.headerTagline,
          address: { line1: values.line1, postalCode: values.postalCode, city: values.city, country: "DE" },
          contact: {
            email: values.email,
            phone: values.phone || null,
            mobile: values.mobile || null,
            website: values.website || null,
          },
          taxNumber: values.taxNumber || null,
          vatId: values.vatId || null,
          taxRegime: values.taxRegime,
          smallBusinessNote: values.smallBusinessNote,
          bank: { bankName: values.bankName, iban: values.iban, bic: values.bic },
          defaultCurrency: values.defaultCurrency,
          defaultPaymentTerms: values.defaultPaymentTerms,
          defaultIntro: values.defaultIntro,
          defaultOutro: values.defaultOutro,
          accentColor: values.accentColor,
          sequenceBaseline: values.sequenceBaseline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setMessage("Einstellungen gespeichert.");
      await onReload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">{issuer.brandLabel}</div>
          <div className="text-[11px] text-[#6B7280]">Aussteller-ID {issuer.id} · nächste Nummer: {issuer.nextNumber}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 disabled:opacity-50">
            {saving ? "Speichere…" : "Speichern"}
          </button>
        </div>
      </div>

      {issuer.configWarnings?.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.05] p-3 text-xs text-amber-200">
          {issuer.configWarnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
      {error && <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/[0.05] p-3 text-xs text-red-200">{error}</div>}
      {message && <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] p-3 text-xs text-emerald-200">{message}</div>}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {field("Anzeigename", values.brandLabel, (v) => setValues({ ...values, brandLabel: v }))}
        {field("Rechtlicher Name", values.legalName, (v) => setValues({ ...values, legalName: v }))}
        {field("Inhaber", values.owner, (v) => setValues({ ...values, owner: v }))}
        {field("Kopfzeile", values.headerTagline, (v) => setValues({ ...values, headerTagline: v }))}
        {field("Straße", values.line1, (v) => setValues({ ...values, line1: v }))}
        {field("PLZ", values.postalCode, (v) => setValues({ ...values, postalCode: v }))}
        {field("Ort", values.city, (v) => setValues({ ...values, city: v }))}
        {field("E-Mail", values.email, (v) => setValues({ ...values, email: v }))}
        {field("Telefon", values.phone, (v) => setValues({ ...values, phone: v }))}
        {field("Mobil", values.mobile, (v) => setValues({ ...values, mobile: v }))}
        {field("Website", values.website, (v) => setValues({ ...values, website: v }))}
        {field("Steuernummer", values.taxNumber, (v) => setValues({ ...values, taxNumber: v }))}
        {field("USt-IdNr.", values.vatId, (v) => setValues({ ...values, vatId: v }))}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">Steuerregime</label>
          <select
            value={values.taxRegime}
            onChange={(e) => setValues({ ...values, taxRegime: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="kleinunternehmer">Kleinunternehmer (§ 19 UStG)</option>
            <option value="regelbesteuerung">Regelbesteuerung</option>
            <option value="reverse_charge">Reverse Charge</option>
            <option value="tax_free">Steuerfrei</option>
          </select>
        </div>
        {field("Bank", values.bankName, (v) => setValues({ ...values, bankName: v }))}
        {field("IBAN", values.iban, (v) => setValues({ ...values, iban: v }))}
        {field("BIC", values.bic, (v) => setValues({ ...values, bic: v }))}
        {field("Zahlungsziel (Tage)", String(values.defaultPaymentTerms), (v) => setValues({ ...values, defaultPaymentTerms: Number(v) || 14 }))}
        {field("Basiszahl Rechnungsnummer (letzte vergebene)", String(values.sequenceBaseline), (v) => setValues({ ...values, sequenceBaseline: Number(v) || 0 }))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {textarea("Standard-Einleitung", values.defaultIntro, (v) => setValues({ ...values, defaultIntro: v }))}
        {textarea("Standard-Schlusstext", values.defaultOutro, (v) => setValues({ ...values, defaultOutro: v }))}
        {textarea("Hinweis Kleinunternehmer", values.smallBusinessNote, (v) => setValues({ ...values, smallBusinessNote: v }))}
      </div>
    </div>
  );
}

function field(label: string, value: string, onChange: (v: string) => void) {
  return (
    <div key={label}>
      <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
      />
    </div>
  );
}

function textarea(label: string, value: string, onChange: (v: string) => void) {
  return (
    <div key={label}>
      <label className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</label>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
      />
    </div>
  );
}
