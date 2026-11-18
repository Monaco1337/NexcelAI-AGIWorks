"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConsultationBrand, ConsultationSlot } from "@/lib/consultations/slots";
import { captureFirstTouch, getAttributionPayload } from "@/lib/leadAttributionClient";

type FormState = {
  name: string; email: string; company: string; projectType: string;
  projectGoal: string; timeframe: string; budgetRange: string; privacyAcknowledged: boolean;
};
const EMPTY: FormState = {
  name: "", email: "", company: "", projectType: "", projectGoal: "",
  timeframe: "offen", budgetRange: "offen", privacyAcknowledged: false,
};
const TYPES = [
  ["ki-agenten", "KI-Agenten"], ["automatisierung", "Prozessautomatisierung"],
  ["eigene-llms", "Eigene LLMs / Private KI"], ["softwareentwicklung", "Softwareentwicklung"],
  ["crm-erp", "CRM / ERP"], ["web-app", "Web-App / SaaS"], ["anderes", "Sonstiges Projekt"],
] as const;
function formatDate(start: string) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", timeZone: "Europe/Berlin" }).format(new Date(start));
}
function formatTime(start: string) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(start));
}
export default function ConsultationBooking({ brand }: { brand: ConsultationBrand }) {
  const isAgi = brand === "agiworks";
  const accent = isAgi ? "#6ab9ff" : "#b68aff";
  const [step, setStep] = useState<1 | 2>(1);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [selected, setSelected] = useState<ConsultationSlot | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState<ConsultationSlot | null>(null);
  const [allDates, setAllDates] = useState(false);
  const [website, setWebsite] = useState("");
  const root = useRef<HTMLElement>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/consultation/slots", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !Array.isArray(json.slots)) throw new Error("Verfügbarkeit derzeit nicht abrufbar.");
      setSlots(json.slots);
      setSelected((prev) => prev && json.slots.some((s: ConsultationSlot) => s.startsAt === prev.startsAt) ? prev : null);
      setError("");
    } catch { setSlots([]); setError("Der Terminplaner ist derzeit nicht erreichbar. Bitte nutzen Sie das Kontaktformular."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { captureFirstTouch(); void refresh(); }, [refresh]);
  useEffect(() => {
    if (step === 2 || requested) root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, requested]);
  const shown = useMemo(() => allDates ? slots : slots.slice(0, 16), [slots, allDates]);
  const groups = useMemo(() => {
    const map = new Map<string, ConsultationSlot[]>();
    for (const slot of shown) {
      const key = formatDate(slot.startsAt);
      map.set(key, [...(map.get(key) || []), slot]);
    }
    return [...map.entries()];
  }, [shown]);
  const input = "w-full min-h-[48px] rounded-xl border border-white/15 bg-[#101726] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/60";
  const label = "mb-2 block text-sm text-white/80";
  const action = "inline-flex min-h-[48px] items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || submitting || !form.privacyAcknowledged || form.company.trim().length < 2) return;
    setSubmitting(true); setError("");
    try {
      const result = await fetch("/api/consultation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brand, startsAt: selected.startsAt, website, attribution: getAttributionPayload() }),
      });
      const json = await result.json();
      if (!result.ok || !json.requested) {
        if (result.status === 409) { setStep(1); void refresh(); }
        throw new Error(typeof json.error === "string" ? json.error : "Anfrage fehlgeschlagen");
      }
      setRequested(json.slot);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Anfrage fehlgeschlagen"); }
    finally { setSubmitting(false); }
  }
  return <section ref={root} className="relative mt-10 scroll-mt-24 rounded-[30px] border border-white/15 bg-[#0e1420] p-5 shadow-[0_24px_80px_rgba(0,0,0,.24)] sm:p-8" data-brand={brand} aria-label="Beratungstermin anfragen">
    <div className="mb-8 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[.14em]">
      <span className="rounded-full border px-4 py-2" style={{ borderColor: accent, color: accent }}>01 · Termin wählen</span>
      <span className="text-white/25">—</span>
      <span className="rounded-full border px-4 py-2" style={{ borderColor: step === 2 ? accent : "rgba(255,255,255,.12)", color: step === 2 ? accent : "rgba(255,255,255,.4)" }}>02 · Projektbriefing</span>
      <span className="text-white/25">—</span>
      <span className="text-white/40">03 · Rückmeldung</span>
    </div>
    {requested ? <div className="max-w-3xl space-y-4 py-6" role="status">
      <p className="text-sm uppercase tracking-[.2em]" style={{ color: accent }}>Anfrage eingegangen</p>
      <h2 className="text-3xl font-medium text-white sm:text-4xl">Vielen Dank. Wir prüfen Ihren Termin.</h2>
      <p className="text-base text-white/70">Angefragt: {formatDate(requested.startsAt)}, {formatTime(requested.startsAt)} Uhr · 45 Minuten (Europe/Berlin).</p>
      <p className="text-sm leading-7 text-white/60">Wir haben Ihre Projektangaben übernommen. Der Termin ist für Ihre Anfrage vorgemerkt, aber erst nach unserer Bestätigung verbindlich. Weitere organisatorische Informationen erhalten Sie anschließend.</p>
      <a href="/kontakt" className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm text-white hover:border-white/45">Zum Kontaktformular</a>
    </div> : step === 1 ? <div className="max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[.17em]" style={{ color: accent }}>Schritt 1 von 2</p>
      <h2 className="mt-3 text-2xl font-medium text-white sm:text-3xl">Wann passt es Ihnen?</h2>
      <p className="mt-3 text-sm leading-7 text-white/60">Wählen Sie einen verfügbaren Beratungstermin. 45 Minuten · Online · Zeitzone Europe/Berlin. Die freien Zeiten gelten für beide Marken gemeinsam.</p>
      {loading && <div className="mt-7 space-y-3" role="status"><div className="h-12 animate-pulse rounded-xl bg-white/5"/><div className="h-12 animate-pulse rounded-xl bg-white/5"/></div>}
      {!loading && !slots.length && !error && <div className="mt-7 rounded-xl border border-white/10 p-6 text-sm leading-6 text-white/65">Derzeit sind keine Termine freigeschaltet. Bitte schreiben Sie uns über das <a href="/kontakt" className="underline">Kontaktformular</a>.</div>}
      {!loading && groups.length > 0 && <div className="mt-6 space-y-6">
        {groups.map(([date, daySlots]) => <div key={date}>
          <h3 className="mb-3 text-sm font-semibold capitalize text-white/80">{date}</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label={date}>
            {daySlots.map((slot) => <button key={slot.startsAt} type="button" aria-pressed={selected?.startsAt === slot.startsAt} onClick={() => setSelected(slot)} className={`min-w-24 rounded-xl border px-5 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${selected?.startsAt === slot.startsAt ? "border-white/70 bg-white/15 text-white" : "border-white/15 bg-white/[.035] text-white/70 hover:border-white/45"}`} style={selected?.startsAt === slot.startsAt ? {borderColor:accent,backgroundColor:`${accent}20`} : undefined}>{formatTime(slot.startsAt)} Uhr</button>)}
          </div>
        </div>)}
        {slots.length > 16 && <button type="button" className="text-sm underline underline-offset-4" style={{color:accent}} onClick={()=>setAllDates((v)=>!v)}>{allDates ? "Weniger Termine anzeigen" : "Weitere Termine anzeigen"}</button>}
      </div>}
      {error && <p className="mt-6 rounded-xl border border-red-400/35 bg-red-950/25 p-4 text-sm text-red-200" role="alert">{error}</p>}
      <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/10 pt-7">
        <button type="button" disabled={!selected || loading} onClick={() => {setError("");setStep(2);}} className={`${action} text-[#0b1020]`} style={{backgroundColor:accent}}>Weiter zum Projektbriefing →</button>
        <span className="text-sm text-white/50">{selected ? `${formatDate(selected.startsAt)}, ${formatTime(selected.startsAt)} Uhr` : "Bitte zuerst einen Termin wählen"}</span>
      </div>
    </div> : <div className="max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[.17em]" style={{color:accent}}>Schritt 2 von 2</p>
      <h2 className="mt-3 text-2xl font-medium text-white sm:text-3xl">Damit wir vorbereitet sind</h2>
      <p className="mt-3 text-sm leading-7 text-white/60">Bitte schildern Sie kurz Ihr Unternehmen und Ihr Vorhaben. Wir prüfen die Anfrage persönlich und bestätigen den Termin.</p>
      {selected && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[.035] p-4"><p className="text-sm text-white">{formatDate(selected.startsAt)} · {formatTime(selected.startsAt)} Uhr · 45 Min.</p><button type="button" onClick={()=>{setStep(1);setError("");}} className="text-sm underline underline-offset-4" style={{color:accent}}>Termin ändern</button></div>}
      <form onSubmit={submit} className="mt-7 space-y-5" aria-label="Projektvorbereitung">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor={`booking-name-${brand}`} className={label}>Ihr Name *</label><input id={`booking-name-${brand}`} required minLength={2} maxLength={150} autoComplete="name" className={input} value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></div>
          <div><label htmlFor={`booking-email-${brand}`} className={label}>Geschäftliche E-Mail *</label><input id={`booking-email-${brand}`} type="email" required maxLength={254} autoComplete="email" className={input} value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></div>
        </div>
        <div><label htmlFor={`booking-company-${brand}`} className={label}>Unternehmen / Organisation *</label><input id={`booking-company-${brand}`} required minLength={2} maxLength={150} autoComplete="organization" placeholder="Name Ihres Unternehmens" className={input} value={form.company} onChange={(e)=>setForm({...form,company:e.target.value})}/></div>
        <div><label htmlFor={`booking-type-${brand}`} className={label}>Worum geht es? *</label><select id={`booking-type-${brand}`} required className={input} value={form.projectType} onChange={(e)=>setForm({...form,projectType:e.target.value})}><option value="">Bitte auswählen</option>{TYPES.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></div>
        <div><label htmlFor={`booking-goal-${brand}`} className={label}>Ausgangslage und gewünschtes Ergebnis *</label><textarea id={`booking-goal-${brand}`} rows={5} required minLength={20} maxLength={2000} className={input} placeholder="Was möchten Sie umsetzen? Welche Systeme gibt es bereits? Was soll verbessert werden?" value={form.projectGoal} onChange={(e)=>setForm({...form,projectGoal:e.target.value})}/><p className="mt-1 text-xs text-white/40">Mindestens 20 Zeichen. Bitte keine Zugangsdaten oder sensiblen Informationen eingeben.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor={`booking-time-${brand}`} className={label}>Geplanter Projektstart *</label><select id={`booking-time-${brand}`} className={input} value={form.timeframe} onChange={(e)=>setForm({...form,timeframe:e.target.value})}><option value="offen">Noch offen</option><option value="sofort">Zeitnah</option><option value="1-3-monate">In 1–3 Monaten</option><option value="3-6-monate">In 3–6 Monaten</option></select></div>
          <div><label htmlFor={`booking-budget-${brand}`} className={label}>Budgetrahmen (optional)</label><select id={`booking-budget-${brand}`} className={input} value={form.budgetRange} onChange={(e)=>setForm({...form,budgetRange:e.target.value})}><option value="offen">Noch offen</option><option value="unter-5000">Unter 5.000 €</option><option value="5000-20000">5.000–20.000 €</option><option value="ueber-20000">Über 20.000 €</option></select></div>
        </div>
        <input type="text" tabIndex={-1} name="website" autoComplete="off" aria-hidden="true" value={website} onChange={(e)=>setWebsite(e.target.value)} className="absolute left-[-9999px] h-px w-px opacity-0"/>
        <label className="flex items-start gap-3 text-xs leading-6 text-white/65"><input type="checkbox" required className="mt-1" checked={form.privacyAcknowledged} onChange={(e)=>setForm({...form,privacyAcknowledged:e.target.checked})}/><span>Ich habe die <a href="/datenschutz" className="underline underline-offset-4">Datenschutzhinweise</a> zur Bearbeitung meiner Terminanfrage zur Kenntnis genommen.</span></label>
        {error && <p className="rounded-xl border border-red-400/35 bg-red-950/25 p-4 text-sm text-red-200" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
          <button type="button" onClick={()=>{setStep(1);setError("");}} className={`${action} border border-white/20 text-white`}>← Zurück</button>
          <button type="submit" disabled={!selected || submitting} className={`${action} text-[#0b1020]`} style={{backgroundColor:accent}}>{submitting ? "Anfrage wird übermittelt …" : "Verbindliche Anfrage senden →"}</button>
        </div>
        <p className="text-xs leading-6 text-white/40">Der gewählte Slot wird nach dem Absenden bis zur persönlichen Freigabe für andere Anfragen blockiert. Eine Buchung ist erst nach unserer Bestätigung verbindlich. Keine automatische Werbung.</p>
      </form>
    </div>}
  </section>;
}
