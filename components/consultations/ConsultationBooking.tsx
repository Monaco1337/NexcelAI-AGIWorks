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
// Group by the user's booking timezone, not the browser's timezone or a display string.
// YYYY-MM-DD avoids cross-year collisions and daylight-saving boundary errors.
function berlinDayKey(start: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(start));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
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
  // Day and time are separate user choices: no time is shown until a day is picked.
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [monthPage, setMonthPage] = useState(0);
  const [website, setWebsite] = useState("");
  const root = useRef<HTMLElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/consultation/slots", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !Array.isArray(json.slots)) throw new Error("Verfügbarkeit derzeit nicht abrufbar.");
      setSlots(json.slots);
      setSelected((prev) => prev && json.slots.some((s: ConsultationSlot) => s.startsAt === prev.startsAt) ? prev : null);
      setSelectedDay((prev) => prev && json.slots.some((s: ConsultationSlot) => berlinDayKey(s.startsAt) === prev) ? prev : null);
      setError("");
    } catch { setSlots([]); setError("Der Terminplaner ist derzeit nicht erreichbar. Bitte nutzen Sie das Kontaktformular."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { captureFirstTouch(); void refresh(); }, [refresh]);
  useEffect(() => {
    if (step === 2 || requested) root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, requested]);
  const groups = useMemo(() => {
    const byDate = new Map<string, ConsultationSlot[]>();
    // Preserve chronological order even if the availability endpoint returns unsorted slots.
    for (const slot of [...slots].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))) {
      const key = berlinDayKey(slot.startsAt);
      const daySlots = byDate.get(key);
      if (daySlots) daySlots.push(slot);
      else byDate.set(key, [slot]);
    }
    return Array.from(byDate.entries());
  }, [slots]);
  // Render the entire month (not two days at a time). The API remains the only
  // authority for bookable dates; all other calendar days are disabled.
  const months = useMemo(() => [...new Set(groups.map(([key]) => key.slice(0, 7)))], [groups]);
  const currentMonthPage = Math.min(monthPage, Math.max(0, months.length - 1));
  const currentMonth = months[currentMonthPage] ?? "";
  const slotsByDay = useMemo(() => new Map(groups), [groups]);
  const calendarCells = useMemo<(string | null)[]>(() => {
    if (!currentMonth) return [];
    const [year, month] = currentMonth.split("-").map(Number);
    const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: cellCount }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day < 1 || day > daysInMonth ? null : `${currentMonth}-${String(day).padStart(2, "0")}`;
    });
  }, [currentMonth]);
  const monthLabel = currentMonth ? new Intl.DateTimeFormat("de-DE", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${currentMonth}-01T12:00:00Z`)) : "";
  const selectedDaySlots = selectedDay ? (slotsByDay.get(selectedDay) ?? []) : [];
  const activeDay = selectedDaySlots.length > 0 ? selectedDay : null;
  const activeDayLabel = selectedDaySlots.length ? formatDate(selectedDaySlots[0].startsAt) : "";
  function chooseDay(key: string) {
    if (!slotsByDay.has(key)) return;
    if (key !== selectedDay) setSelected(null);
    setSelectedDay(key);
  }
  function navigateMonths(page: number) {
    if (page < 0 || page >= months.length) return;
    setMonthPage(page);
    setSelectedDay(null);
    setSelected(null);
  }
  // Scroll after React has committed the newly revealed time choices.
  // Respect reduced-motion and the fixed header's scroll-margin-top.
  useEffect(() => {
    if (step !== 1 || !activeDay || loading) return;
    const frame = window.requestAnimationFrame(() => {
      const target = timesRef.current;
      if (!target) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeDay, loading, step]);
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
  return <section ref={root} className="consultation-v8-booking relative mx-auto mt-10 w-full scroll-mt-40 p-5 sm:p-8 lg:p-12" data-brand={brand} aria-label="Beratungstermin anfragen">
    <div className="consultation-v8-stepper mb-10 flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-semibold uppercase tracking-[.10em] sm:gap-3 sm:text-xs" aria-label="Buchungsablauf">
      <span className="consultation-v8-step rounded-full px-4 py-2" aria-current={!requested && step === 1 ? "step" : undefined} data-active={!requested && step === 1} style={{ color: !requested && step === 1 ? accent : undefined }}>01 · Termin wählen</span>
      <span className="consultation-v8-step-divider text-white/25" aria-hidden="true">—</span>
      <span className="consultation-v8-step rounded-full px-4 py-2" aria-current={!requested && step === 2 ? "step" : undefined} data-active={!requested && step === 2} style={{ color: !requested && step === 2 ? accent : undefined }}>02 · Projektbriefing</span>
      <span className="consultation-v8-step-divider text-white/25" aria-hidden="true">—</span>
      <span className="consultation-v8-step rounded-full px-4 py-2" data-active={Boolean(requested)} style={{ color: requested ? accent : undefined }}>03 · Rückmeldung</span>
    </div>
    {requested ? <div className="consultation-v8-stage mx-auto max-w-3xl space-y-4 py-6 text-center" role="status">
      <p className="text-sm uppercase tracking-[.2em]" style={{ color: accent }}>Anfrage eingegangen</p>
      <h2 className="text-3xl font-medium text-white sm:text-4xl">Vielen Dank. Wir prüfen Ihren Termin.</h2>
      <p className="text-base text-white/70">Angefragt: {formatDate(requested.startsAt)}, {formatTime(requested.startsAt)} Uhr · 45 Minuten (Europe/Berlin).</p>
      <p className="text-sm leading-7 text-white/60">Wir haben Ihre Projektangaben übernommen. Der Termin ist für Ihre Anfrage vorgemerkt, aber erst nach unserer Bestätigung verbindlich. Weitere organisatorische Informationen erhalten Sie anschließend.</p>
      <a href="/kontakt" className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm text-white hover:border-white/45">Zum Kontaktformular</a>
    </div> : step === 1 ? <div className="consultation-v8-stage mx-auto max-w-4xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[.17em]" style={{ color: accent }}>Schritt 1 von 2</p>
      <h2 className="mt-3 text-2xl font-medium text-white sm:text-3xl">Wann passt es Ihnen?</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70">Wählen Sie einen verfügbaren Beratungstermin. 45 Minuten · Online · Zeitzone Europe/Berlin. Die freien Zeiten gelten für beide Marken gemeinsam.</p>
      {loading && <div className="mt-7 space-y-3" role="status"><div className="h-12 animate-pulse rounded-xl bg-white/5"/><div className="h-12 animate-pulse rounded-xl bg-white/5"/></div>}
      {!loading && !slots.length && !error && <div className="consultation-v8-empty mx-auto mt-8 max-w-2xl px-5 py-7 text-center text-base leading-8 text-white/75" role="status">Derzeit sind keine Termine freigeschaltet. Bitte schreiben Sie uns über das <a href="/kontakt" className="consultation-v8-link font-semibold underline underline-offset-4">Kontaktformular</a>.</div>}
      {!loading && groups.length > 0 && <div className="consultation-v9-picker consultation-v10-picker mx-auto mt-9 w-full max-w-4xl">
        <div className="consultation-v9-picker-heading">
          <p className="consultation-v9-eyebrow" style={{ color: accent }}>01 / VERF&Uuml;GBARE TAGE</p>
          <h3 className="consultation-v9-section-title">W&auml;hlen Sie Ihren Wunschtermin</h3>
          <p className="consultation-v9-hint">W&auml;hlen Sie einen verf&uuml;gbaren Kalendertag. Die passenden Uhrzeiten &ouml;ffnen sich automatisch.</p>
        </div>
        <div className="consultation-v10-calendar" role="group" aria-label="Kalender zur Tagesauswahl">
          <div className="consultation-v10-month-bar">
            <button type="button" className="consultation-v10-month-button" onClick={() => navigateMonths(currentMonthPage - 1)} disabled={currentMonthPage === 0} aria-label={"Vorheriger Monat"}>&larr;</button>
            <div className="consultation-v10-month-title" aria-live="polite">{monthLabel}</div>
            <button type="button" className="consultation-v10-month-button" onClick={() => navigateMonths(currentMonthPage + 1)} disabled={currentMonthPage >= months.length - 1} aria-label={"Nächster Monat"}>&rarr;</button>
          </div>
          <div className="consultation-v10-weekdays" aria-hidden="true">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="consultation-v10-days" role="group" aria-label={"Verfügbare Termine im " + monthLabel}>
            {calendarCells.map((key, index) => {
              if (!key) return <span key={`blank-${index}`} className="consultation-v10-blank" aria-hidden="true" />;
              const daySlots = slotsByDay.get(key) ?? [];
              const hasSlots = daySlots.length > 0;
              const label = hasSlots ? formatDate(daySlots[0].startsAt) : key;
              return <button key={key} type="button"
                className="consultation-v10-date"
                data-available={hasSlots}
                aria-pressed={activeDay === key}
                aria-controls={`consultation-v9-times-${brand}`}
                aria-label={hasSlots ? `${label}, ${daySlots.length} freie Uhrzeiten` : `${label}, nicht verfügbar`}
                disabled={!hasSlots}
                onClick={() => chooseDay(key)}
              >
                <span className="consultation-v10-date-number">{Number(key.slice(8, 10))}</span>
                <span className="consultation-v10-date-state" aria-hidden="true">{hasSlots ? `${daySlots.length} frei` : "-"}</span>
              </button>;
            })}
          </div>
          <div className="consultation-v10-calendar-legend"><span aria-hidden="true" /> Farbige Tage sind buchbar</div>
        </div>
        <div ref={timesRef} tabIndex={-1} id={`consultation-v9-times-${brand}`} className="consultation-v9-time-area consultation-v10-times" aria-live="polite">
          {activeDay && <>
            <p className="consultation-v9-eyebrow" style={{ color: accent }}>02 / VERF&Uuml;GBARE UHRZEITEN</p>
            <h3 className="consultation-v9-section-title">{activeDayLabel}</h3>
            <p className="consultation-v9-hint">W&auml;hlen Sie jetzt die passende Uhrzeit.</p>
            <div className="consultation-v9-time-grid" role="group" aria-label={`Uhrzeiten am ${activeDayLabel}`}>
              {selectedDaySlots.map((slot) => <button
                key={slot.startsAt}
                type="button"
                aria-pressed={selected?.startsAt === slot.startsAt}
                onClick={() => setSelected(slot)}
                className="consultation-v9-time"
              >{formatTime(slot.startsAt)} Uhr</button>)}
            </div>
          </>}
        </div>
      </div>}
      {error && <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-400/35 bg-red-950/25 p-4 text-center text-sm text-red-200" role="alert">{error}</p>}
      {(loading || slots.length > 0) && <div className="consultation-v8-actions mx-auto mt-10 flex max-w-2xl flex-col items-center justify-center gap-3 pt-7 sm:flex-row sm:gap-5">
        <button type="button" disabled={!selected || loading} onClick={() => {setError("");setStep(2);}} className={`${action} text-[#0b1020]`} style={{backgroundColor:accent}}>Weiter zum Projektbriefing →</button>
        <span className="text-sm text-white/60">{selected ? `${formatDate(selected.startsAt)}, ${formatTime(selected.startsAt)} Uhr` : activeDay ? "Bitte eine Uhrzeit auswählen" : "Bitte zuerst einen Tag auswählen"}</span>
      </div>}
    </div> : <div className="consultation-v8-stage mx-auto max-w-4xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[.17em]" style={{color:accent}}>Schritt 2 von 2</p>
      <h2 className="mt-3 text-2xl font-medium text-white sm:text-3xl">Damit wir vorbereitet sind</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70">Bitte schildern Sie kurz Ihr Unternehmen und Ihr Vorhaben. Wir prüfen die Anfrage persönlich und bestätigen den Termin.</p>
      {selected && <div className="consultation-v8-selected mx-auto mt-7 flex flex-wrap items-center justify-center gap-4 rounded-2xl p-4"><p className="text-sm text-white">{formatDate(selected.startsAt)} · {formatTime(selected.startsAt)} Uhr · 45 Min.</p><button type="button" onClick={()=>{setStep(1);setError("");}} className="text-sm underline underline-offset-4" style={{color:accent}}>Termin ändern</button></div>}
      <form onSubmit={submit} className="consultation-v8-form mx-auto mt-9 max-w-3xl space-y-5 text-left" aria-label="Projektvorbereitung">
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
        <div className="consultation-v8-actions mt-8 flex flex-wrap items-center justify-center gap-3 pt-6">
          <button type="button" onClick={()=>{setStep(1);setError("");}} className={`${action} border border-white/20 text-white`}>← Zurück</button>
          <button type="submit" disabled={!selected || submitting} className={`${action} text-[#0b1020]`} style={{backgroundColor:accent}}>{submitting ? "Anfrage wird übermittelt …" : "Verbindliche Anfrage senden →"}</button>
        </div>
        <p className="text-xs leading-6 text-white/40">Der gewählte Slot wird nach dem Absenden bis zur persönlichen Freigabe für andere Anfragen blockiert. Eine Buchung ist erst nach unserer Bestätigung verbindlich. Keine automatische Werbung.</p>
      </form>
    </div>}
  </section>;
}
