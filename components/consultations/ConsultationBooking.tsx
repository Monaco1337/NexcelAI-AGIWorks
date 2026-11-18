"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ConsultationBrand, ConsultationSlot } from "@/lib/consultations/slots";
import { captureFirstTouch, getAttributionPayload } from "@/lib/leadAttributionClient";

type FormState = {
  name: string; email: string; company: string; projectType: string;
  projectGoal: string; timeframe: string; budgetRange: string; privacyAcknowledged: boolean;
};
const INITIAL: FormState = { name: "", email: "", company: "", projectType: "", projectGoal: "", timeframe: "offen", budgetRange: "offen", privacyAcknowledged: false };
const PROJECT_TYPES = [
  ["ki-agenten", "KI-Agenten"], ["automatisierung", "Prozessautomatisierung"],
  ["eigene-llms", "Eigene LLMs / Private KI"], ["softwareentwicklung", "Softwareentwicklung"],
  ["crm-erp", "CRM / ERP"], ["web-app", "Web-App / SaaS"], ["anderes", "Anderes Projekt"],
] as const;
function dateLabel(startsAt: string, mode: "date" | "time") {
  return new Intl.DateTimeFormat("de-DE", mode === "date"
    ? { dateStyle: "full", timeZone: "Europe/Berlin" }
    : { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(startsAt));
}
function googleCalendarLink(slot: ConsultationSlot, brand: ConsultationBrand) {
  const compact = (value: string) => value.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE", text: `Beratung ${brand === "agiworks" ? "AGI Works" : "NEXCEL AI"}`,
    dates: `${compact(slot.startsAt)}/${compact(slot.endsAt)}`,
    details: "Beratungstermin. Weitere Informationen zur Durchführung werden abgestimmt.",
    ctz: "Europe/Berlin",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
export default function ConsultationBooking({ brand }: { brand: ConsultationBrand }) {
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [selected, setSelected] = useState<ConsultationSlot | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<ConsultationSlot | null>(null);
  const [moreDates, setMoreDates] = useState(false);
  const [website, setWebsite] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetch("/api/consultation/slots", { cache: "no-store" });
      const payload = await result.json();
      if (!result.ok || !Array.isArray(payload.slots)) throw new Error("Verfügbarkeit konnte nicht geladen werden.");
      setSlots(payload.slots);
      setSelected((prev) => prev && payload.slots.some((x: ConsultationSlot) => x.startsAt === prev.startsAt) ? prev : null);
    } catch { setError("Der Terminplaner ist vorübergehend nicht erreichbar. Bitte nutzen Sie das Kontaktformular."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { captureFirstTouch(); void refresh(); }, [refresh]);
  const shownSlots = useMemo(() => moreDates ? slots : slots.slice(0, 20), [slots, moreDates]);
  const accent = brand === "agiworks" ? "#6cb7ff" : "#bd91ff";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !form.privacyAcknowledged || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/consultation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brand, startsAt: selected.startsAt, website, attribution: getAttributionPayload() }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.booked) {
        if (response.status === 409) void refresh();
        throw new Error(typeof payload.error === "string" ? payload.error : "Buchung fehlgeschlagen");
      }
      setBooked(payload.slot);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Buchung fehlgeschlagen"); }
    finally { setSubmitting(false); }
  }

  const field = "w-full min-h-[46px] rounded-xl border border-white/15 bg-[#101726] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/55";
  const label = "block text-sm text-white/75 mb-2";
  return (
    <section className="relative mt-10 rounded-[30px] border border-white/15 bg-[#0e1420] p-5 shadow-[0_24px_80px_rgba(0,0,0,.25)] sm:p-8" aria-label="Terminbuchung" data-brand={brand}>
      {booked ? (
        <div role="status" className="space-y-5 py-5">
          <span className="text-xs uppercase tracking-[.2em]" style={{ color: accent }}>Termin reserviert</span>
          <h2 className="text-3xl font-light text-white">Ihre Beratung ist eingetragen.</h2>
          <p className="text-white/70">{dateLabel(booked.startsAt, "date")}, {dateLabel(booked.startsAt, "time")} Uhr (Europe/Berlin). Dauer: 45 Minuten.</p>
          <p className="text-sm text-white/55">Der Termin ist im gemeinsamen Buchungskalender erfasst. Die organisatorischen Einzelheiten stimmen wir mit Ihnen ab.</p>
          <a href={googleCalendarLink(booked, brand)} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm text-white hover:border-white/50">Zum eigenen Google Kalender hinzufügen ↗</a>
        </div>
      ) : (
        <div className="grid gap-9 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <p className="text-xs uppercase tracking-[.19em]" style={{ color: accent }}>01 / Zeitfenster</p>
            <h2 className="mt-3 text-2xl font-light text-white">Passenden Termin auswählen</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">45 Minuten · Online-Abstimmung · Zeitzone Europe/Berlin. Beide Marken verwenden denselben verfügbaren Terminkalender.</p>
            {loading && <p role="status" className="mt-6 text-white/60">Verfügbarkeiten werden geladen …</p>}
            {!loading && slots.length === 0 && <p className="mt-6 text-sm text-white/60">Derzeit sind keine freien Zeitfenster verfügbar. Bitte schreiben Sie uns über das Kontaktformular.</p>}
            {!loading && slots.length > 0 && (
              <>
                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Verfügbare Zeitfenster">
                  {shownSlots.map((slot) => (
                    <button key={slot.startsAt} type="button" aria-pressed={selected?.startsAt === slot.startsAt} onClick={() => setSelected(slot)} className={`rounded-xl border px-3 py-3 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${selected?.startsAt === slot.startsAt ? "border-white/75 bg-white/15 text-white" : "border-white/10 bg-white/[.03] text-white/70 hover:border-white/40"}`}>
                      <span className="block text-[11px]">{new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(slot.startsAt))}</span>
                      <span className="mt-1 block text-base font-medium">{dateLabel(slot.startsAt, "time")}</span>
                    </button>
                  ))}
                </div>
                {slots.length > 20 && <button type="button" className="mt-4 text-sm underline underline-offset-4" style={{ color: accent }} onClick={() => setMoreDates((v) => !v)}>{moreDates ? "Weniger Termine anzeigen" : "Weitere Termine anzeigen"}</button>}
              </>
            )}
          </div>
          <form onSubmit={submit} className="space-y-4" aria-label="Projektvorbereitung">
            <div>
              <p className="text-xs uppercase tracking-[.19em]" style={{ color: accent }}>02 / Projektbriefing</p>
              <h2 className="mt-3 text-2xl font-light text-white">Damit wir vorbereitet sind</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor={`booking-name-${brand}`} className={label}>Name *</label><input id={`booking-name-${brand}`} autoComplete="name" required minLength={2} maxLength={150} className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label htmlFor={`booking-email-${brand}`} className={label}>Geschäftliche E-Mail *</label><input id={`booking-email-${brand}`} type="email" autoComplete="email" required maxLength={254} className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><label htmlFor={`booking-company-${brand}`} className={label}>Unternehmen (optional)</label><input id={`booking-company-${brand}`} autoComplete="organization" maxLength={150} className={field} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div><label htmlFor={`booking-type-${brand}`} className={label}>Worum geht es? *</label><select id={`booking-type-${brand}`} required className={field} value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}><option value="">Bitte wählen</option>{PROJECT_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
            <div><label htmlFor={`booking-goal-${brand}`} className={label}>Ausgangslage und gewünschtes Ergebnis (mind. 20 Zeichen) *</label><textarea id={`booking-goal-${brand}`} required minLength={20} maxLength={2000} rows={4} className={field} placeholder="Was soll sich konkret verbessern? Welche Systeme oder Prozesse sind beteiligt?" value={form.projectGoal} onChange={(e) => setForm({ ...form, projectGoal: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor={`booking-time-${brand}`} className={label}>Geplanter Start *</label><select id={`booking-time-${brand}`} className={field} value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}><option value="offen">Noch offen</option><option value="sofort">Zeitnah</option><option value="1-3-monate">1–3 Monate</option><option value="3-6-monate">3–6 Monate</option></select></div>
              <div><label htmlFor={`booking-budget-${brand}`} className={label}>Budgetrahmen (optional)</label><select id={`booking-budget-${brand}`} className={field} value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}><option value="offen">Noch offen</option><option value="unter-5000">Unter 5.000 €</option><option value="5000-20000">5.000–20.000 €</option><option value="ueber-20000">Über 20.000 €</option></select></div>
            </div>
            <input type="text" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute left-[-9999px] h-px w-px opacity-0" />
            <label className="flex items-start gap-3 text-xs leading-5 text-white/65"><input type="checkbox" className="mt-1" required checked={form.privacyAcknowledged} onChange={(e) => setForm({ ...form, privacyAcknowledged: e.target.checked })} /><span>Ich habe die <a href="/datenschutz" className="underline underline-offset-4">Datenschutzhinweise</a> zur Verarbeitung meiner Terminanfrage zur Kenntnis genommen.</span></label>
            {error && <p className="rounded-xl border border-red-400/35 bg-red-950/30 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
            <button type="submit" disabled={submitting || !selected || loading} className="w-full rounded-full px-6 py-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40" style={{ border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 24%, #101827)` }}>{submitting ? "Termin wird reserviert …" : selected ? `Termin am ${dateLabel(selected.startsAt, "date")} reservieren` : "Bitte zuerst einen Termin wählen"}</button>
            <p className="text-xs leading-5 text-white/45">Keine automatische Werbung. Die Angaben werden ausschließlich zur Vorbereitung und Bearbeitung Ihres Beratungstermins verwendet.</p>
          </form>
        </div>
      )}
    </section>
  );
}
