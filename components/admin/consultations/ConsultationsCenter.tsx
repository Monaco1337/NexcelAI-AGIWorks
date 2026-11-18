"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  brand: "nexcel" | "agiworks";
  starts_at: string;
  ends_at: string;
  name: string;
  email: string;
  company: string;
  project_type: string;
  project_goal: string;
  timeframe: string;
  budget_range: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  confirmation_sent_at: string | null;
};
type Weekly = { weekday: number; startMinute: number };
type Override = { startsAt: string; action: "open" | "block" };
type Slot = { startsAt: string; endsAt: string };
type Data = {
  emailConfigured: false | { nexcel: boolean; agiworks: boolean };
  bookings: Booking[];
  availability: { weekly: Weekly[]; overrides: Override[]; blockedDates: string[] };
  slots: Slot[];
};

const DAYS = [
  { v: 1, t: "Montag", short: "Mo" }, { v: 2, t: "Dienstag", short: "Di" },
  { v: 3, t: "Mittwoch", short: "Mi" }, { v: 4, t: "Donnerstag", short: "Do" },
  { v: 5, t: "Freitag", short: "Fr" }, { v: 6, t: "Samstag", short: "Sa" },
  { v: 0, t: "Sonntag", short: "So" },
] as const;
const DAY_MS = 86_400_000;
const box = "rounded-[22px] border border-white/10 bg-[#111827] p-5 sm:p-6";
const ctrl = "min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0b1120] px-3 py-2.5 text-sm text-white outline-none focus:border-white/50 focus:ring-2 focus:ring-white/10";
const btn = "inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40";
const softBtn = "border-white/10 bg-white/[.03]";
const formatMinute = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const dateParts = (iso: string | Date) => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const get = (name: string) => parts.find((p) => p.type === name)?.value || "";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
};
const addCivilDays = (day: string, delta: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  return new Date(d.getTime() + delta * DAY_MS).toISOString().slice(0, 10);
};
const mondayOf = (day: string) => {
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay();
  return addCivilDays(day, -((dow + 6) % 7));
};
const dayLabel = (day: string) => new Intl.DateTimeFormat("de-DE", {
  day: "2-digit", month: "short", timeZone: "UTC",
}).format(new Date(`${day}T12:00:00Z`));
const fullDayLabel = (day: string) => new Intl.DateTimeFormat("de-DE", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${day}T12:00:00Z`));
const when = (iso: string) => new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin",
}).format(new Date(iso));
const localInput = (iso: string) => {
  const p = dateParts(iso);
  return `${p.day}T${p.time}`;
};
const brandName = (brand: Booking["brand"]) => brand === "agiworks" ? "AGI Works" : "NEXCEL AI";
const statusText = (status: Booking["status"]) => status === "pending" ? "Angefragt" : status === "confirmed" ? "Bestätigt" : "Storniert";
const inHorizon = (day: string, today: string) => day >= today && day < addCivilDays(today, 28);

export default function ConsultationsCenter({ accent }: { accent: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [today, setToday] = useState(() => dateParts(new Date()).day);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => dateParts(new Date()).day);
  const [weekday, setWeekday] = useState(1);
  const [rangeStart, setRangeStart] = useState("09:00");
  const [rangeEnd, setRangeEnd] = useState("12:00");
  const [extraTime, setExtraTime] = useState("10:00");
  const [brandFilter, setBrandFilter] = useState<"all" | "nexcel" | "agiworks">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/consultations", { cache: "no-store", credentials: "same-origin" });
      const payload: Data | { error: string } = await res.json();
      if (!res.ok || !("bookings" in payload)) throw new Error("error" in payload ? payload.error : "Terminverwaltung nicht verfügbar");
      setData(payload);
      setToday(dateParts(new Date()).day);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terminverwaltung nicht verfügbar");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function mutate(body: Record<string, unknown>, method: "POST" | "PATCH" = "POST", successMessage = "Gespeichert. Beide Buchungsseiten sind aktualisiert.") {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/admin/consultations", {
        method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const payload: { ok?: boolean; error?: string } = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "Änderung konnte nicht gespeichert werden");
      await load();
      setMessage(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Änderung fehlgeschlagen");
    } finally { setBusy(false); }
  }

  const monday = useMemo(() => addCivilDays(mondayOf(today), weekOffset * 7), [today, weekOffset]);
  const weekDays = useMemo(() => DAYS.map((d, i) => ({ ...d, day: addCivilDays(monday, i) })), [monday]);
  const selectedFree = useMemo(() => (data?.slots || []).filter((slot) => dateParts(slot.startsAt).day === selectedDay), [data, selectedDay]);
  const selectedBookings = useMemo(() => (data?.bookings || []).filter((b) => b.status !== "cancelled" && dateParts(b.starts_at).day === selectedDay), [data, selectedDay]);
  const selectedOverrides = useMemo(() => (data?.availability.overrides || []).filter((rule) => dateParts(rule.startsAt).day === selectedDay), [data, selectedDay]);
  const selectedIsBlocked = Boolean(data?.availability.blockedDates.includes(selectedDay));
  const stats = useMemo(() => ({
    pending: data?.bookings.filter((b) => b.status === "pending").length || 0,
    confirmed: data?.bookings.filter((b) => b.status === "confirmed").length || 0,
    free: data?.slots.length || 0,
  }), [data]);
  const bookings = useMemo(() => data?.bookings.filter((b) =>
    (brandFilter === "all" || b.brand === brandFilter) && (statusFilter === "all" || b.status === statusFilter)
  ) || [], [data, brandFilter, statusFilter]);
  const weekRange = `${dayLabel(weekDays[0].day)} – ${dayLabel(weekDays[6].day)}`;
  const weekdayName = DAYS.find((d) => d.v === weekday)?.t || "Wochentag";
  const selectedWritable = inHorizon(selectedDay, today);

  return <div className="space-y-6 text-white">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.23em]" style={{ color: accent }}>NEXCEL AI + AGI WORKS</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Terminplaner</h2>
        <p className="mt-2 text-sm text-white/55">Ein Kalender. Zwei Marken. Verfügbarkeit und Anfragen zentral steuern.</p>
      </div>
      <button type="button" onClick={() => void load()} disabled={loading || busy} className={btn}>Aktualisieren ↻</button>
    </header>

    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { label: "Offene Anfragen", count: stats.pending, hint: "Warten auf Ihre Freigabe" },
        { label: "Bestätigte Termine", count: stats.confirmed, hint: "Gemeinsam für beide Marken" },
        { label: "Freie Zeitfenster", count: stats.free, hint: "In den nächsten 28 Tagen" },
      ].map((item) => <div key={item.label} className={box}>
        <p className="text-xs text-white/50">{item.label}</p>
        <div className="mt-1 text-3xl font-semibold tabular-nums">{item.count}</div>
        <p className="mt-1 text-xs text-white/35">{item.hint}</p>
      </div>)}
    </div>

    {loading && !data && <div className={box} role="status">Terminverwaltung wird geladen …</div>}
    {error && <p role="alert" className="rounded-xl border border-red-400/35 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</p>}

    {data && <>
      {(!data.emailConfigured || !data.emailConfigured.nexcel || !data.emailConfigured.agiworks) &&
        <p className="rounded-2xl border border-amber-400/30 bg-amber-400/[.06] px-5 py-4 text-sm leading-6 text-amber-100">
          <strong>E-Mail-Versand noch nicht vollständig eingerichtet.</strong> Buchungen werden gespeichert, aber bis zur Einrichtung verifizierter Absender müssen Kunden manuell benachrichtigt werden.
        </p>}

      <section className={box} aria-labelledby="calendar-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-white/40">WOCHENANSICHT · EUROPE/BERLIN</p>
            <h3 id="calendar-heading" className="mt-2 text-xl font-semibold">Kalender <span className="ml-2 text-base font-normal text-white/50">{weekRange}</span></h3>
            <p className="mt-1 text-xs leading-5 text-white/45">Tag wählen, freie Zeiten prüfen und bei Bedarf direkt sperren oder ergänzen.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={weekOffset === 0} className={btn} aria-label="Vorherige Woche" onClick={() => { const next = Math.max(0, weekOffset - 1); setWeekOffset(next); const nextMonday = addCivilDays(mondayOf(today), next * 7); setSelectedDay(nextMonday < today ? today : nextMonday); }}>←</button>
            <button type="button" className={btn} onClick={() => { setWeekOffset(0); setSelectedDay(today); }}>Heute</button>
            <button type="button" disabled={weekOffset === 4} className={btn} aria-label="Nächste Woche" onClick={() => { const next = Math.min(4, weekOffset + 1); setWeekOffset(next); const nextMonday = addCivilDays(mondayOf(today), next * 7); setSelectedDay(nextMonday < today ? today : nextMonday); }}>→</button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60" aria-label="Kalender-Legende">
          <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />Frei</span>
          <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" />Angefragt</span>
          <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-400" />Bestätigt</span>
          <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-white/25" />Geschlossen</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((item) => {
            const valid = inHorizon(item.day, today);
            const closed = data.availability.blockedDates.includes(item.day);
            const free = data.slots.filter((slot) => dateParts(slot.startsAt).day === item.day);
            const occupied = data.bookings.filter((b) => b.status !== "cancelled" && dateParts(b.starts_at).day === item.day);
            const selected = item.day === selectedDay;
            return <button key={item.day} type="button" disabled={!valid} aria-pressed={selected} onClick={() => setSelectedDay(item.day)}
              className={`min-h-[142px] rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-30 ${selected ? "border-sky-400/60 bg-sky-400/[.10]" : "border-white/10 bg-[#0b1120] hover:border-white/30"}`}>
              <span className="flex items-start justify-between gap-2"><span className="text-xs text-white/55">{item.short}</span><span className="text-xs font-medium tabular-nums">{dayLabel(item.day)}</span></span>
              <span className="mt-5 block text-2xl font-semibold tabular-nums">{valid ? free.length : "–"}<span className="ml-1 text-xs font-normal text-white/45">frei</span></span>
              {occupied.length > 0 && <span className="mt-2 block text-xs text-amber-200">{occupied.length} belegt</span>}
              {closed && <span className="mt-2 block text-xs text-rose-200">Tag gesperrt</span>}
              {!closed && !free.length && !occupied.length && <span className="mt-2 block text-xs text-white/35">Keine Freigabe</span>}
              {selected && <span className="mt-2 block text-[11px] text-sky-200">Ausgewählt</span>}
            </button>;
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(250px,.6fr)]">
          <div className="rounded-2xl border border-white/10 bg-[#0b1120] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs uppercase tracking-[.17em] text-white/40">AUSGEWÄHLTER TAG</p><h4 className="mt-1 text-lg font-medium">{fullDayLabel(selectedDay)}</h4></div>
              <button type="button" disabled={!selectedWritable || busy}
                onClick={() => void mutate({ operation: selectedIsBlocked ? "date:unblock" : "date:block", date: selectedDay }, "POST", selectedIsBlocked ? "Tag wieder freigegeben." : "Tag für beide Marken gesperrt.")}
                className={`${btn} ${selectedIsBlocked ? "border-emerald-400/35 text-emerald-100" : "border-rose-400/35 text-rose-100"}`}>
                {selectedIsBlocked ? "Sperre aufheben" : "Ganzen Tag sperren"}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {[...selectedFree.map((slot) => ({ key: slot.startsAt, start: slot.startsAt, type: "free" as const })),
                ...selectedBookings.map((b) => ({ key: b.id, start: b.starts_at, type: b.status as "pending" | "confirmed" }))]
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((entry) => <div key={entry.key} className="flex min-h-[45px] flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2">
                  <span className="flex items-center gap-3 text-sm">
                    <span className={`h-2 w-2 rounded-full ${entry.type === "free" ? "bg-emerald-400" : entry.type === "pending" ? "bg-amber-400" : "bg-sky-400"}`} />
                    <strong className="tabular-nums">{dateParts(entry.start).time}</strong>
                    <span className="text-xs text-white/50">{entry.type === "free" ? "Frei für beide Marken" : entry.type === "pending" ? "Anfrage reserviert" : "Bestätigter Termin"}</span>
                  </span>
                  {entry.type === "free" ? <button type="button" disabled={busy || !selectedWritable} className="text-xs text-rose-200 underline underline-offset-4 disabled:opacity-40" onClick={() => void mutate({ operation: "override:block", localStart: localInput(entry.start) }, "POST", "Zeitfenster gesperrt.")}>Sperren</button> : <span className="text-[11px] text-white/35">Belegt</span>}
                </div>)}
              {!selectedFree.length && !selectedBookings.length && <p className="py-5 text-sm text-white/40">Keine offenen oder belegten Zeitfenster für diesen Tag.</p>}
            </div>
            {selectedOverrides.length > 0 && <div className="mt-5 border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Individuelle Ausnahmen</p>
              <div className="flex flex-wrap gap-2">{selectedOverrides.map((o) => <button type="button" key={o.startsAt} disabled={busy || !selectedWritable} onClick={() => void mutate({ operation: "override:remove", localStart: localInput(o.startsAt) }, "POST", "Ausnahme zurückgesetzt.")}
                className="rounded-full border border-white/15 px-3 py-2 text-xs text-white/75 transition hover:border-white/40 disabled:opacity-40" title="Ausnahme zurücksetzen">
                {dateParts(o.startsAt).time} · {o.action === "open" ? "Zusatztermin" : "Sperre"} ×
              </button>)}</div>
            </div>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1120] p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[.17em] text-white/40">SCHNELLFREIGABE</p>
            <h4 className="mt-2 text-lg font-medium">Einzeltermin hinzufügen</h4>
            <p className="mt-2 text-xs leading-6 text-white/50">Ein zusätzlicher Termin nur für den ausgewählten Tag. Startzeiten im 15-Minuten-Raster; Dauer 45 Minuten.</p>
            <label className="mt-4 block text-xs text-white/65">Uhrzeit
              <input type="time" min="08:00" max="19:00" step={900} value={extraTime} onChange={(e) => setExtraTime(e.target.value)} className={`${ctrl} mt-2`} />
            </label>
            <button type="button" disabled={!selectedWritable || busy || selectedIsBlocked} onClick={() => void mutate({ operation: "override:open", localStart: `${selectedDay}T${extraTime}` }, "POST", "Zusatztermin für beide Marken freigegeben.")}
              className={`${btn} mt-3 w-full border-sky-400/35 bg-sky-400/10 text-sky-100`}>+ Termin freigeben</button>
            {selectedIsBlocked && <p className="mt-3 text-xs text-amber-200">Zuerst die Tagessperre aufheben.</p>}
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-white/45">Termine gelten auf beiden Websites. Vorhandene Anfragen bleiben auch bei späteren Sperren im System sichtbar.</p>
          </div>
        </div>
      </section>

      <section className={box} aria-labelledby="weekly-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.17em] text-white/40">WIEDERKEHRENDE VERFÜGBARKEIT</p>
            <h3 id="weekly-heading" className="mt-2 text-xl font-semibold">Wöchentliche Freigaben</h3>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-white/55">Einen Zeitraum pro Wochentag festlegen. Das System erzeugt automatisch passende 45-Minuten-Termine ohne Überschneidungen.</p>
          </div>
          <button type="button" className={`${btn} ${softBtn}`} disabled={busy} onClick={() => {
            if (window.confirm("Beispielzeiten Montag bis Freitag (09–12 und 14–17 Uhr) hinzufügen? Bestehende Zeiten bleiben erhalten, sofern sie sich nicht überschneiden."))
              void mutate({ operation: "weekly:preset:add" }, "POST", "Arbeitswoche hinzugefügt.");
          }}>+ Arbeitswoche als Vorlage</button>
        </div>

        <form className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-[#0b1120] p-4 sm:grid-cols-[1.1fr_1fr_1fr_auto] sm:items-end" onSubmit={(e) => {
          e.preventDefault();
          const [sh, sm] = rangeStart.split(":").map(Number);
          const [eh, em] = rangeEnd.split(":").map(Number);
          void mutate({ operation: "weekly:range:add", weekday, startMinute: sh * 60 + sm, endMinute: eh * 60 + em }, "POST", `Zeitblock für ${weekdayName} hinzugefügt.`);
        }}>
          <label className="text-xs text-white/65">Wochentag
            <select className={`${ctrl} mt-2`} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>{DAYS.map((d) => <option key={d.v} value={d.v}>{d.t}</option>)}</select>
          </label>
          <label className="text-xs text-white/65">Von
            <input className={`${ctrl} mt-2`} type="time" required min="08:00" max="19:00" step={900} value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
          </label>
          <label className="text-xs text-white/65">Bis
            <input className={`${ctrl} mt-2`} type="time" required min="08:45" max="19:45" step={900} value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
          </label>
          <button className={`${btn} border-sky-400/35 bg-sky-400/10 text-sky-100`} disabled={busy} type="submit">+ Zeitraum freigeben</button>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {DAYS.map((d) => {
            const rules = data.availability.weekly.filter((r) => r.weekday === d.v).sort((a, b) => a.startMinute - b.startMinute);
            return <div key={d.v} className="rounded-2xl border border-white/10 bg-[#0b1120] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">{d.t}</h4>
                <span className="text-[11px] tabular-nums text-white/45">{rules.length} Slots</span>
              </div>
              <div className="mt-4 flex min-h-[58px] flex-wrap content-start gap-2">
                {rules.map((r) => <button type="button" key={r.startMinute} disabled={busy} title={`${formatMinute(r.startMinute)} Uhr wiederkehrend entfernen`} aria-label={`${d.t} ${formatMinute(r.startMinute)} entfernen`}
                  onClick={() => void mutate({ operation: "weekly:remove", weekday: d.v, startMinute: r.startMinute }, "POST", "Wiederkehrende Zeit entfernt.")}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-400/[.08] px-2.5 py-2 text-xs tabular-nums text-emerald-100 transition hover:border-rose-400/50 hover:text-rose-100 disabled:opacity-40">
                  {formatMinute(r.startMinute)} <span className="ml-1 opacity-60" aria-hidden="true">×</span>
                </button>)}
                {!rules.length && <span className="text-xs text-white/35">Geschlossen</span>}
              </div>
              {rules.length > 0 && <button type="button" disabled={busy} className="mt-4 w-full border-t border-white/10 pt-3 text-left text-xs text-rose-200/80 transition hover:text-rose-100 disabled:opacity-40" onClick={() => {
                if (window.confirm(`Alle regelmäßigen Termine am ${d.t} entfernen? Bereits gebuchte Termine bleiben gespeichert.`))
                  void mutate({ operation: "weekly:clear", weekday: d.v }, "POST", `${d.t}: Wiederkehrende Zeiten entfernt.`);
              }}>Alle Zeiten entfernen</button>}
            </div>;
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-white/45">Änderungen gelten unmittelbar für NEXCEL AI und AGI Works. Beispiel: 09:00–12:00 erzeugt Termine um 09:00, 09:45, 10:30 und 11:15 Uhr.</p>
      </section>

      <section className={box} aria-labelledby="requests-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-[.17em] text-white/40">ANFRAGEN &amp; FREIGABEN</p><h3 id="requests-heading" className="mt-2 text-xl font-semibold">Terminanfragen</h3><p className="mt-2 text-xs leading-6 text-white/50">Offene Anfragen blockieren den Slot. Nach Bestätigung wird der Termin verbindlich.</p></div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Marke filtern" className={`${ctrl} w-auto`} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value as typeof brandFilter)}>
              <option value="all">Beide Marken</option><option value="nexcel">NEXCEL AI</option><option value="agiworks">AGI Works</option>
            </select>
            <select aria-label="Status filtern" className={`${ctrl} w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">Alle Status</option><option value="pending">Angefragt</option><option value="confirmed">Bestätigt</option><option value="cancelled">Storniert</option>
            </select>
          </div>
        </div>
        {!bookings.length ? <p className="mt-5 rounded-xl border border-white/10 p-6 text-sm text-white/45">Keine Anfragen für die gewählten Filter.</p> :
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {bookings.map((b) => <article key={b.id} className="rounded-2xl border border-white/10 bg-[#0b1120] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: b.brand === "agiworks" ? "#74bbff" : "#c59bff" }}>{brandName(b.brand)}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${b.status === "pending" ? "bg-amber-400/10 text-amber-200" : b.status === "confirmed" ? "bg-emerald-400/10 text-emerald-200" : "bg-white/10 text-white/60"}`}>{statusText(b.status)}</span>
              </div>
              <h4 className="mt-3 text-lg font-semibold">{b.company}</h4>
              <p className="mt-1 text-sm text-white/75">{b.name} · <a className="underline underline-offset-4" href={`mailto:${b.email}`}>{b.email}</a></p>
              <p className="mt-3 text-sm font-medium">{when(b.starts_at)} Uhr · 45 Minuten</p>
              <div className="mt-4 space-y-2 text-xs text-white/65"><p><strong className="text-white/90">Projekt:</strong> {b.project_type} · {b.timeframe} · {b.budget_range}</p><p className="whitespace-pre-wrap leading-6"><strong className="text-white/90">Briefing:</strong> {b.project_goal}</p></div>
              <p className="mt-3 text-[11px] text-white/40">Eingegangen: {when(b.created_at)} · {b.confirmation_sent_at ? "Bestätigung versendet" : "Bestätigung noch nicht versendet"}</p>
              {b.status !== "cancelled" && <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {b.status === "pending" && <button type="button" className={`${btn} border-emerald-400/35 text-emerald-100`} disabled={busy} onClick={() => void mutate({ id: b.id, status: "confirmed" }, "PATCH", "Termin bestätigt. Kundenbenachrichtigung prüfen.")}>Termin bestätigen</button>}
                <button type="button" className={`${btn} border-rose-400/30 text-rose-100`} disabled={busy} onClick={() => {
                  if (window.confirm("Diesen Termin wirklich ablehnen oder stornieren?")) void mutate({ id: b.id, status: "cancelled" }, "PATCH", "Termin aufgehoben. Kundenbenachrichtigung prüfen.");
                }}>{b.status === "pending" ? "Anfrage ablehnen" : "Termin stornieren"}</button>
              </div>}
            </article>)}
          </div>}
      </section>
      <p className="text-xs leading-6 text-white/45">Der gemeinsame Kalender verwaltet ausschließlich interne Verfügbarkeiten. Er ist nicht mit Google Calendar oder Outlook synchronisiert. Externe Belegungen bitte manuell sperren.</p>
    </>}
  </div>;
}
