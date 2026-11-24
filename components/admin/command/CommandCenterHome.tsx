"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type Brand = "all" | "nexcel" | "agiworks";
type MetricName = "leads" | "offers" | "projects" | "tasks" | "tickets" | "invoices" | "bookings";
type WorkItem = { id: string; title: string; description: string;
  brand: "nexcel" | "agiworks"; tab: string; kind: "task" | "ticket" | "lead" | "meeting";
  dueAt: string | null; priority: string; version?: number };
type Snapshot = {
  brand: Brand; generatedAt: string;
  metrics: Record<MetricName, number | null>;
  work: WorkItem[];
  warnings: string[];
};
const METRICS: { key: MetricName; label: string; tab: string; color: string; note: string }[] = [
  { key: "leads", label: "Neue Anfragen", tab: "contacts", color: "#B38BFF", note: "In Bearbeitung" },
  { key: "offers", label: "Offene Angebote", tab: "vertrieb", color: "#6BBEFF", note: "Im Sales-Prozess" },
  { key: "projects", label: "Aktive Projekte", tab: "projekte", color: "#72D9BE", note: "In Betreuung" },
  { key: "tasks", label: "Offene Aufgaben", tab: "overview", color: "#E3B36B", note: "Team & Vorg\u00e4nge" },
  { key: "tickets", label: "Offene Tickets", tab: "tickets", color: "#F39BC0", note: "In Kl\u00e4rung" },
  { key: "invoices", label: "Offene Rechnungen", tab: "rechnungen", color: "#B4A5FF", note: "Zahlung ausstehend" },
  { key: "bookings", label: "Termine geplant", tab: "termine", color: "#78BCEB", note: "Kommende Beratungen" },
];
const ACTIONS = [
  { label: "Kunden & Sales", detail: "Anfragen, Angebote und Pipeline", tab: "vertrieb", glyph: "01" },
  { label: "Projekte", detail: "Aufgaben, Termine und Systeme", tab: "projekte", glyph: "02" },
  { label: "Tickets & Team", detail: "Interne Zusammenarbeit", tab: "tickets", glyph: "03" },
  { label: "Finanzen", detail: "Rechnungen und Kalkulation", tab: "rechnungen", glyph: "04" },
  { label: "Website bearbeiten", detail: "Referenzen, Logos und Systeme", tab: "referenzen", glyph: "05" },
  { label: "Automationen", detail: "Workflows & Protokolle", tab: "automationen", glyph: "06" },
];
function berlinGreetings(date: Date): { salutation: string; dateLabel: string } {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", hour: "2-digit", hourCycle: "h23",
  }).format(date));
  return {
    salutation: hour >= 5 && hour < 11 ? "Guten Morgen" : hour >= 11 && hour < 18 ? "Guten Tag" : "Guten Abend",
    dateLabel: new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(date),
  };
}
export default function CommandCenterHome({ name, brand, onNavigate, createTaskNonce }: {
  name: string; brand: Brand; onNavigate: (tab: string) => void; createTaskNonce: number;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState({ salutation: "Guten Tag", dateLabel: "" });
  const [editor, setEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const taskRequestId = useRef<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "normal", dueAt: "" });
  const accent = brand === "agiworks" ? "#65B7FF" : "#B17CFF";
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/command-center?brand=${brand}`, { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 503 ? "Datenbank noch nicht verbunden." : `Laden fehlgeschlagen (${response.status}).`);
      const payload = await response.json() as Snapshot;
      setSnapshot(payload); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Keine Verbindung."); }
    finally { setLoading(false); }
  }, [brand]);
  useEffect(() => {
    setClock(berlinGreetings(new Date()));
    const tick = window.setInterval(() => setClock(berlinGreetings(new Date())), 60000);
    return () => window.clearInterval(tick);
  }, []);
  useEffect(() => {
    setLoading(true); setSnapshot(null);
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30000);
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [load]);
  useEffect(() => { if (createTaskNonce > 0) setEditor(true); }, [createTaskNonce]);
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || saving) return;
    if (brand === "all") { setError("Bitte zuerst NEXCEL AI oder AGI Works ausw\u00e4hlen."); return; }
    setSaving(true);
    if (!taskRequestId.current) taskRequestId.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/admin/command-center/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description,
          priority: form.priority, brand, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
          clientRequestId: taskRequestId.current, }),
      });
      if (!response.ok) throw new Error(`Aufgabe konnte nicht gespeichert werden (${response.status}).`);
      setForm({ title: "", description: "", priority: "normal", dueAt: "" });
      taskRequestId.current = null;
      setEditor(false); setError(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen."); }
    finally { setSaving(false); }
  }
  async function completeTask(task: WorkItem) {
    if (typeof task.version !== "number") return;
    try {
      const response = await fetch(`/api/admin/command-center/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done", version: task.version }),
      });
      if (!response.ok) throw new Error(response.status === 409 ? "Die Aufgabe wurde bereits ge\u00e4ndert. Aktualisieren." : "Status konnte nicht gespeichert werden.");
      setError(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Aktion fehlgeschlagen."); }
  }
  const tasks = snapshot?.work ?? [];
  const firstName = name.trim().split(/\s+/)[0] || "Team";
  const brandLabel = brand === "all" ? "Gemeinsame Organisation" : brand === "agiworks" ? "AGI Works" : "NEXCEL AI";
  return (
    <section className="space-y-6" aria-label={"Command Center Arbeits\u00fcbersicht"}>
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#201B31] via-[#10131D] to-[#101A25] p-6 sm:p-8">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-20" style={{ background: accent }}/>
        <div className="relative flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[.24em] font-semibold mb-3" style={{ color: accent }}>{brandLabel} / Command Center</div>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white">{clock.salutation}, {firstName}.</h2>
            <p className="mt-3 text-sm text-white/55">{clock.dateLabel || "Deine Arbeits\u00fcbersicht"} &middot; Dein Team. Deine Aufgaben. Ein System.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setError(null); setEditor(true); }}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0C0A13]"
              style={{ background: accent }}>+ Aufgabe erstellen</button>
            <button onClick={() => onNavigate("vertrieb")} className="rounded-xl px-4 py-3 text-sm border border-white/15 bg-white/[.05] hover:bg-white/[.09]">Kunden & Sales</button>
          </div>
        </div>
      </div>
      {error && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error} <button className="underline ml-3" onClick={() => void load()}>Erneut versuchen</button></div>}
      {snapshot?.warnings?.length ? <div className="text-xs text-amber-200/80 border border-amber-400/20 rounded-xl p-3">
        Einzelne Datenquellen sind nicht verf&uuml;gbar: {snapshot.warnings.join(", ")}. Unbekannte Werte werden nicht als 0 angezeigt.
      </div> : null}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {METRICS.map(m => (
          <button key={m.key} onClick={() => onNavigate(m.tab)}
            className="group text-left relative overflow-hidden rounded-2xl border border-white/[.09] bg-[#11131B] p-4 sm:p-5 min-h-[132px] hover:border-white/25 transition-colors">
            <span className="absolute left-0 top-0 h-[2px] w-full opacity-65" style={{ background: `linear-gradient(90deg,${m.color},transparent)` }}/>
            <div className="text-[11px] tracking-wide text-white/60">{m.label}</div>
            <div className="text-3xl font-semibold tabular-nums text-white mt-3">
              {loading ? "..." : snapshot?.metrics?.[m.key] ?? "\u2014"}
            </div>
            <div className="text-[11px] text-white/40 mt-1">{m.note}</div>
            <span className="absolute right-4 top-4 text-white/30 group-hover:text-white" aria-hidden="true">&nearr;</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <section className="rounded-[22px] border border-white/[.09] bg-[#11131A] p-5 sm:p-6" aria-label="Heute erledigen">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div><h3 className="font-semibold text-white text-lg">Heute erledigen</h3><p className="text-xs text-white/45 mt-1">Aufgaben, Anfragen und Tickets nach Priorit&auml;t</p></div>
            <button className="text-xs font-medium hover:underline" style={{ color: accent }} onClick={() => onNavigate("tickets")}>Ticket&uuml;bersicht &nearr;</button>
          </div>
          {loading ? <p className="text-sm text-white/50 py-8">Vorg&auml;nge werden geladen ...</p> :
            tasks.length === 0 ? <p className="text-sm text-white/50 py-9">Keine offenen Vorg&auml;nge in der aktuellen Auswahl.</p> :
            <div className="space-y-2">
              {tasks.map(task => <div key={`${task.kind}:${task.id}`} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-white/[.035] border border-white/[.055] px-4 py-3">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: task.priority === "high" ? "#F2AD67" : accent }}/>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate" title={task.title}>{task.title}</div>
                  <div className="text-[11px] text-white/45 mt-1">{task.brand === "agiworks" ? "AGI Works" : "NEXCEL AI"} &middot; {task.kind === "task" ? "Aufgabe" : task.kind === "lead" ? "Anfrage" : "Ticket"}{task.dueAt ? ` \u00b7 ${new Date(task.dueAt).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}` : ""}</div></div>
                <div className="flex gap-2 items-center">
                  {task.kind === "task" && <button onClick={() => void completeTask(task)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:text-white">Erledigt</button>}
                  <button onClick={() => onNavigate(task.tab)} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: `${accent}1E`, color: accent }}>Öffnen &nearr;</button>
                </div>
              </div>)}
            </div>}
        </section>
        <section className="rounded-[22px] border border-white/[.09] bg-[#11131A] p-5 sm:p-6" aria-label="Schnellzugriffe">
          <h3 className="font-semibold text-lg">Direkt arbeiten</h3>
          <p className="text-xs text-white/45 mt-1 mb-4">Alle Module mit einem Klick erreichen</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            {ACTIONS.map(action => <button key={action.tab} onClick={() => onNavigate(action.tab)}
              className="group flex items-center gap-3 text-left border border-white/[.08] hover:border-white/20 rounded-xl px-4 py-3 bg-white/[.02]">
              <span className="rounded-lg border border-white/10 w-9 h-9 flex items-center justify-center text-xs font-mono" style={{ color: accent }}>{action.glyph}</span>
              <span className="flex-1 min-w-0"><span className="text-sm block text-white">{action.label}</span>
                <span className="text-[11px] text-white/45 line-clamp-1">{action.detail}</span></span>
              <span className="text-white/35 group-hover:text-white">&nearr;</span>
            </button>)}
          </div>
        </section>
      </div>
      {editor && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditor(false); }}>
        <form onSubmit={event => void createTask(event)} role="dialog" aria-modal="true" aria-label="Aufgabe erstellen" className="w-full max-w-lg rounded-[24px] border border-white/20 bg-[#171423] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-xl font-semibold">Neue Aufgabe</h3>
            <button type="button" onClick={() => setEditor(false)} aria-label={"Schlie\u00dfen"} className="px-3 py-1 rounded-lg border border-white/10">×</button></div>
          {brand === "all" && <p className="text-amber-300 text-xs" >W&auml;hle zuerst oben eine Marke aus.</p>}
          <label className="block text-xs text-white/60">Titel<input required maxLength={200} value={form.title} onChange={e => setForm({...form,title:e.target.value})}
            className="block mt-2 w-full rounded-xl bg-[#10101B] border border-white/15 px-4 py-3 text-sm text-white" placeholder="Was ist zu erledigen?" /></label>
          <label className="block text-xs text-white/60">Beschreibung (optional)<textarea maxLength={2000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
            className="block mt-2 w-full rounded-xl bg-[#10101B] border border-white/15 px-4 py-3 text-sm text-white min-h-[80px]" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-white/60">Priorit&auml;t<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}
              className="block mt-2 w-full rounded-xl bg-[#10101B] border border-white/15 px-3 py-2.5 text-sm text-white">
              <option value="normal">Normal</option><option value="high">Hoch</option><option value="low">Niedrig</option>
            </select></label>
            <label className="text-xs text-white/60">F&auml;llig (optional)<input type="datetime-local" value={form.dueAt}
              onChange={e=>setForm({...form,dueAt:e.target.value})} className="block mt-2 w-full rounded-xl bg-[#10101B] border border-white/15 px-3 py-2.5 text-sm text-white" /></label>
          </div>
          <button type="submit" disabled={saving || brand === "all"} className="w-full py-3 rounded-xl font-semibold text-[#0B0911] disabled:opacity-50" style={{ background: accent }}>
            {saving ? "Speichert ..." : "Aufgabe speichern"}
          </button>
        </form>
      </div>}
    </section>
  );
}
