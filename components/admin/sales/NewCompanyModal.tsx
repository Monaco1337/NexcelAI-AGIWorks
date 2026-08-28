"use client";

/**
 * Modal zum Anlegen einer neuen Firma (Zielkunde).
 * Bewusst minimal — Details werden im Firmen-Detail ergänzt.
 */

import { useState } from "react";
import { CLASSIFICATION_LABEL, type SalesClassification } from "./shared";
import { Field, buttonPrimary, buttonSecondary, inputClasses, selectClasses } from "./HelperUI";

export default function NewCompanyModal({
  accent,
  onCancel,
  onCreated,
}: {
  accent: string;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [classification, setClassification] = useState<SalesClassification | "">("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Bitte einen Firmennamen angeben.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sales/companies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website: website.trim() || undefined,
          industry: industry.trim() || undefined,
          city: city.trim() || undefined,
          classification: classification || undefined,
          source: source.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Anlegen fehlgeschlagen.");
        return;
      }
      const data = (await res.json()) as { company: { id: string } };
      onCreated(data.company.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Neue Firma</h2>
          <button onClick={onCancel} className="text-white/50 hover:text-white" type="button">✕</button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Firmenname *">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} placeholder="AGI Works GmbH" autoFocus />
            </Field>
          </div>
          <Field label="Website">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClasses} placeholder="https://…" />
          </Field>
          <Field label="Ort">
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClasses} placeholder="Mainz" />
          </Field>
          <Field label="Branche">
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClasses} placeholder="Beratung, Handwerk…" />
          </Field>
          <Field label="Klassifizierung">
            <select value={classification} onChange={(e) => setClassification(e.target.value as SalesClassification | "")} className={selectClasses}>
              <option value="">Noch offen</option>
              {(["A", "B", "C", "D"] as SalesClassification[]).map((c) => (
                <option key={c} value={c}>{CLASSIFICATION_LABEL[c]}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Quelle / Kontext" hint="z. B. Empfehlung, Google-Suche, Messe.">
              <input value={source} onChange={(e) => setSource(e.target.value)} className={inputClasses} placeholder="Empfehlung von …" />
            </Field>
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className={buttonSecondary} type="button">Abbrechen</button>
          <button onClick={submit} disabled={busy} className={buttonPrimary} style={{ backgroundColor: accent }} type="button">
            {busy ? "Wird angelegt…" : "Anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
