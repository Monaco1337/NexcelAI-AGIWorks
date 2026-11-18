"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Booking = {
  id: string; brand: "nexcel" | "agiworks"; starts_at: string; ends_at: string;
  name: string; email: string; company: string; project_type: string;
  project_goal: string; timeframe: string; budget_range: string;
  status: "pending" | "confirmed" | "cancelled"; created_at: string;
  confirmation_sent_at: string | null;
};
type Weekly = {weekday:number;startMinute:number};
type Override = {startsAt:string;action:"open"|"block"};
type Data = { emailConfigured: false | {nexcel:boolean;agiworks:boolean}; bookings:Booking[]; availability:{weekly:Weekly[];overrides:Override[];blockedDates:string[]};slots:{startsAt:string;endsAt:string}[] };
const DAYS = [{v:1,t:"Montag"},{v:2,t:"Dienstag"},{v:3,t:"Mittwoch"},{v:4,t:"Donnerstag"},{v:5,t:"Freitag"},{v:6,t:"Samstag"},{v:0,t:"Sonntag"}];
const box = "rounded-2xl border border-white/10 bg-[#111827] p-5 sm:p-6";
const ctrl = "min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0b1120] px-4 py-2 text-sm text-white outline-none focus:border-white/60";
const btn = "min-h-[40px] rounded-xl border border-white/15 px-4 py-2 text-sm text-white transition hover:border-white/50 disabled:opacity-40";
function hm(n:number) {return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;}
function when(iso:string) { return new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(iso)); }
function localInput(iso:string) {
  const parts = new Intl.DateTimeFormat("en-GB", {timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso));
  const get=(key:string)=>parts.find(x=>x.type===key)?.value||"";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
const brandName = (brand:Booking["brand"])=>brand==="agiworks"?"AGI Works":"NEXCEL AI";

export default function ConsultationsCenter({accent}:{accent:string}) {
  const [data,setData]=useState<Data|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [weekday,setWeekday]=useState(1);
  const [time,setTime]=useState("10:00");
  const [localStart,setLocalStart]=useState("");
  const [blackout,setBlackout]=useState("");
  const [brandFilter,setBrandFilter]=useState<"all"|"nexcel"|"agiworks">("all");
  const [statusFilter,setStatusFilter]=useState<"all"|"pending"|"confirmed"|"cancelled">("all");
  const load=useCallback(async()=>{
    setLoading(true);
    try {
      const res=await fetch("/api/admin/consultations",{cache:"no-store"});
      const d:Data|{error:string}=await res.json();
      if(!res.ok || !("bookings" in d)) throw new Error("error" in d?d.error:"Daten nicht verfügbar");
      setData(d);setError("");
    } catch(cause) {setError(cause instanceof Error?cause.message:"Konnte Termine nicht laden");}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  async function mutate(body:Record<string,unknown>,method:"POST"|"PATCH"="POST") {
    if(busy)return;
    setBusy(true);setError("");setMessage("");
    try {
      const res=await fetch("/api/admin/consultations",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const payload=await res.json();
      if(!res.ok || !payload.ok)throw new Error(payload.error||"Änderung fehlgeschlagen");
      setMessage("Gespeichert. Die Verfügbarkeit wurde aktualisiert.");
      await load();
    }catch(cause){setError(cause instanceof Error?cause.message:"Änderung fehlgeschlagen");}
    finally{setBusy(false);}
  }
  const stats=useMemo(()=>({
    pending:data?.bookings.filter(x=>x.status==="pending").length||0,
    confirmed:data?.bookings.filter(x=>x.status==="confirmed").length||0,
    free:data?.slots.length||0,
  }),[data]);
  const bookings=useMemo(()=>data?.bookings.filter(x=>(brandFilter==="all"||x.brand===brandFilter)&&(statusFilter==="all"||x.status===statusFilter))||[],[data,brandFilter,statusFilter]);
  return <div className="space-y-6 text-white">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[.2em]" style={{color:accent}}>NEXCEL AI + AGI Works</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Terminverwaltung</h2><p className="mt-2 text-sm text-white/55">Ein gemeinsam verwalteter Buchungskalender. Zeiten gelten für beide Websites.</p></div>
      <button type="button" onClick={()=>void load()} disabled={loading||busy} className={btn}>Aktualisieren ↻</button>
    </header>
    <div className="grid gap-3 sm:grid-cols-3">
      {[{label:"Offene Anfragen",n:stats.pending},{label:"Bestätigte Termine",n:stats.confirmed},{label:"Freie Zeitfenster",n:stats.free}].map(x=><div key={x.label} className={box}><p className="text-xs text-white/50">{x.label}</p><p className="mt-1 text-3xl font-semibold">{x.n}</p></div>)}
    </div>
    {loading&&!data&&<div className={box}>Lade Terminverwaltung …</div>}
    {error&&<p className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{error}</p>}
    {message&&<p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100" role="status">{message}</p>}
    {data&&<>
      {(!data.emailConfigured || !data.emailConfigured.nexcel || !data.emailConfigured.agiworks) &&
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[.06] p-5 text-sm leading-7 text-amber-100">
          <strong>E-Mail-Versand nicht vollständig konfiguriert.</strong> Bestätigte Termine werden im System gespeichert, aber die automatische E-Mail an Kunden ist noch nicht für beide Marken eingerichtet. Bitte Kunden manuell benachrichtigen, bis verifizierte Absender und der Versanddienst aktiv sind.
        </div>}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className={box}>
          <h3 className="text-lg font-semibold">Wöchentliche Freigaben</h3>
          <p className="mt-2 text-xs leading-6 text-white/55">Zeitfenster im 15-Minuten-Raster (08:00–19:00 Uhr). Jeder Termin dauert 45 Minuten. Nur explizit freigegebene Zeiten werden angezeigt.</p>
          <form onSubmit={(e)=>{e.preventDefault();const [h,m]=time.split(":").map(Number);void mutate({operation:"weekly:add",weekday,startMinute:h*60+m});}} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-xs text-white/65">Wochentag<select className={`${ctrl} mt-2`} value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>{DAYS.map(d=><option value={d.v} key={d.v}>{d.t}</option>)}</select></label>
            <label className="text-xs text-white/65">Uhrzeit<input type="time" required step={900} min="08:00" max="19:00" className={`${ctrl} mt-2`} value={time} onChange={e=>setTime(e.target.value)}/></label>
            <button type="submit" disabled={busy} className={`${btn} self-end`}>Zeit hinzufügen</button>
          </form>
          <div className="mt-6 space-y-3">
            {DAYS.map(d=><div key={d.v} className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3"><span className="w-28 text-xs text-white/70">{d.t}</span>{data.availability.weekly.filter(r=>r.weekday===d.v).map(r=><button key={r.startMinute} type="button" disabled={busy} onClick={()=>void mutate({operation:"weekly:remove",weekday:r.weekday,startMinute:r.startMinute})} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/85 hover:border-red-400/50" title="Zeit entfernen">{hm(r.startMinute)} ×</button>)}{!data.availability.weekly.some(r=>r.weekday===d.v)&&<span className="text-xs text-white/30">Geschlossen</span>}</div>)}
          </div>
        </section>
        <section className={box}>
          <h3 className="text-lg font-semibold">Einzeltermine &amp; Sperrungen</h3>
          <p className="mt-2 text-xs leading-6 text-white/55">Zusätzliche einzelne Termine öffnen oder Zeiten blockieren. Bestehende Anfragen werden dadurch nicht gelöscht.</p>
          <label className="mt-5 block text-xs text-white/65">Datum und Uhrzeit (Europe/Berlin)<input type="datetime-local" step={900} className={`${ctrl} mt-2`} value={localStart} onChange={e=>setLocalStart(e.target.value)}/></label>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!localStart||busy} onClick={()=>void mutate({operation:"override:open",localStart})} className={btn}>+ Einzeltermin öffnen</button><button type="button" disabled={!localStart||busy} onClick={()=>void mutate({operation:"override:block",localStart})} className={btn}>Zeit sperren</button></div>
          <div className="mt-5 max-h-40 space-y-2 overflow-y-auto">
            {data.availability.overrides.map(o=><div key={o.startsAt} className="flex items-center justify-between gap-2 text-xs"><span className="text-white/70">{when(o.startsAt)} · {o.action==="open"?"Freigegeben":"Gesperrt"}</span><button type="button" disabled={busy} className="text-red-200 underline" onClick={()=>void mutate({operation:"override:remove",localStart:localInput(o.startsAt)})}>Zurücksetzen</button></div>)}
          </div>
          <div className="mt-6 border-t border-white/10 pt-5"><h4 className="font-medium">Ganze Tage schließen (Urlaub, Feiertage)</h4><div className="mt-3 flex flex-wrap gap-2"><input type="date" className={`${ctrl} max-w-56`} value={blackout} onChange={e=>setBlackout(e.target.value)}/><button type="button" disabled={!blackout||busy} className={btn} onClick={()=>void mutate({operation:"date:block",date:blackout})}>Tag sperren</button></div>
            <div className="mt-4 flex flex-wrap gap-2">{data.availability.blockedDates.map(date=><button key={date} type="button" disabled={busy} onClick={()=>void mutate({operation:"date:unblock",date})} className="rounded-full border border-red-400/25 px-3 py-1.5 text-xs text-red-100">{date} ×</button>)}</div>
          </div>
        </section>
      </div>
      <section className={box}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">Terminanfragen</h3><p className="mt-1 text-xs text-white/50">Offene Anfragen belegen einen Slot. Erst nach Freigabe erhalten Kunden eine Terminbestätigung.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Marke filtern" className={`${ctrl} w-auto`} value={brandFilter} onChange={e=>setBrandFilter(e.target.value as typeof brandFilter)}><option value="all">Beide Marken</option><option value="nexcel">NEXCEL AI</option><option value="agiworks">AGI Works</option></select><select aria-label="Status filtern" className={`${ctrl} w-auto`} value={statusFilter} onChange={e=>setStatusFilter(e.target.value as typeof statusFilter)}><option value="all">Alle Status</option><option value="pending">Angefragt</option><option value="confirmed">Bestätigt</option><option value="cancelled">Storniert</option></select></div></div>
        {!bookings.length?<p className="mt-6 rounded-xl border border-white/10 p-6 text-sm text-white/50">Noch keine Anfragen für diesen Filter.</p>:<div className="mt-5 grid gap-4 lg:grid-cols-2">
          {bookings.map(b=><article key={b.id} className="rounded-2xl border border-white/10 bg-[#090f1a] p-5">
            <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wider" style={{color:b.brand==="agiworks"?"#74bbff":"#c59bff"}}>{brandName(b.brand)}</span><span className={`rounded-full px-2.5 py-1 text-[11px] ${b.status==="pending"?"bg-amber-400/10 text-amber-200":b.status==="confirmed"?"bg-emerald-400/10 text-emerald-200":"bg-white/10 text-white/60"}`}>{b.status==="pending"?"Angefragt":b.status==="confirmed"?"Bestätigt":"Storniert"}</span></div>
            <h4 className="mt-3 text-lg font-semibold">{b.company}</h4><p className="mt-1 text-sm text-white/75">{b.name} · <a className="underline underline-offset-4" href={`mailto:${b.email}`}>{b.email}</a></p>
            <p className="mt-3 text-sm font-medium">{when(b.starts_at)} Uhr · 45 Minuten</p>
            <div className="mt-4 space-y-2 text-xs text-white/65"><p><strong className="text-white/90">Projekt:</strong> {b.project_type} · {b.timeframe} · {b.budget_range}</p><p className="whitespace-pre-wrap leading-6"><strong className="text-white/90">Briefing:</strong> {b.project_goal}</p></div>
            <p className="mt-3 text-[11px] text-white/35">Eingegangen: {when(b.created_at)} · {b.confirmation_sent_at?"Bestätigung versendet":"Bestätigung noch nicht versendet"}</p>
            {b.status!=="cancelled"&&<div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">{b.status==="pending"&&<button type="button" className={`${btn} border-emerald-400/35 text-emerald-100`} disabled={busy} onClick={()=>void mutate({id:b.id,status:"confirmed"},"PATCH")}>Termin bestätigen</button>}<button type="button" className={`${btn} border-red-400/30 text-red-100`} disabled={busy} onClick={()=>{if(window.confirm("Diesen Termin wirklich ablehnen bzw. stornieren?"))void mutate({id:b.id,status:"cancelled"},"PATCH")}}>{b.status==="pending"?"Anfrage ablehnen":"Termin stornieren"}</button></div>}
          </article>)}
        </div>}
      </section>
      <p className="text-xs leading-6 text-white/45">Hinweis: Der interne Terminbestand ist keine Synchronisierung mit externen Google-/Outlook-Kalendern. Team-Belegungen müssen hier gesperrt werden, bis eine autorisierte externe Kalenderanbindung eingerichtet wurde.</p>
    </>}
  </div>;
}
