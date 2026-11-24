"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Note = { id: string; title: string; detail: string; targetTab: string;
  brand: string; createdAt: string; read: boolean };

export default function CommandNotifications({ onNavigate, accent }: {
  onNavigate: (id: string) => void; accent: string;
}) {
  const [items, setItems] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Note | null>(null);
  const known = useRef<Set<string> | null>(null);
  const refresh = useCallback(async () => {
    try {
      const result = await fetch("/api/admin/command-center/notifications", { cache: "no-store" });
      if (!result.ok) return;
      const data = await result.json() as { notifications?: Note[] };
      const notes = data.notifications ?? [];
      if (known.current) {
        const fresh = notes.find(n => !n.read && !known.current?.has(n.id));
        if (fresh) setToast(fresh);
      }
      known.current = new Set(notes.map(n => n.id));
      setItems(notes);
    } catch { /* A failed background refresh must not disrupt the active editor. */ }
  }, []);
  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 18000);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [refresh]);
  async function openNote(note: Note) {
    if (!note.read) {
      const response = await fetch("/api/admin/command-center/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id }),
      });
      if (response.ok) setItems(prev => prev.map(n => n.id === note.id ? { ...n, read: true } : n));
    }
    setToast(null); setOpen(false); onNavigate(note.targetTab);
  }
  const unread = items.filter(n => !n.read).length;
  return (
    <div className="relative">
      <button type="button" aria-label={`Benachrichtigungen, ${unread} ungelesen`}
        aria-expanded={open} onClick={() => setOpen(v => !v)}
        className="relative rounded-xl border border-white/10 px-3 py-2 text-xs text-white/80 hover:text-white">
        <span aria-hidden="true">{ "\u25ce" }</span>
        {unread > 0 && <span className="ml-1.5 font-semibold" style={{ color: accent }}>{unread}</span>}
      </button>
      {open && <div role="region" aria-label="Benachrichtigungen" className="absolute z-[90] right-0 top-12 w-[min(360px,92vw)] rounded-2xl border border-white/10 bg-[#13121E] shadow-2xl p-3 max-h-[70vh] overflow-y-auto">
        <div className="text-sm font-semibold px-2 py-1.5">Benachrichtigungen</div>
        {items.length === 0 ? <p className="text-xs text-white/50 p-3">Keine neuen Meldungen.</p> :
          items.map(n => <button key={n.id} onClick={() => void openNote(n)}
            className="block text-left w-full rounded-xl p-3 my-1 hover:bg-white/[.055]"
            style={{ background: n.read ? "transparent" : `${accent}16` }}>
            <div className="text-sm font-medium">{n.title}</div>
            <div className="text-xs text-white/60 mt-1 break-words">{n.detail}</div>
            <div className="text-[10px] text-white/40 mt-2">{n.brand === "agiworks" ? "AGI Works" : "NEXCEL AI"}</div>
          </button>)}
      </div>}
      {toast && <div role="status" className="fixed z-[95] right-4 bottom-4 max-w-sm rounded-2xl border border-white/15 bg-[#1E1A30] p-4 shadow-2xl">
        <div className="text-sm font-semibold">{toast.title}</div>
        <p className="text-xs mt-1 text-white/70">{toast.detail}</p>
        <div className="mt-3 flex gap-3 text-xs">
          <button onClick={() => void openNote(toast)} style={{ color: accent }}>Ansehen</button>
          <button onClick={() => setToast(null)} className="text-white/60">Schlie\u00dfen</button>
        </div>
      </div>}
    </div>
  );
}
