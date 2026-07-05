"use client";

/**
 * NEXCEL AI / AGI WORKS · Systems Manager (Admin)
 * Vollständige Systemkarten-Verwaltung: Anlegen, Bearbeiten, Löschen,
 * Drag & Drop Sortierung, Bild-Upload, aktiv/inaktiv Toggle.
 * Identisches Pattern wie ReferenceManager.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import type { SystemCardEntry } from "@/lib/systems-store";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "vertrieb", label: "Vertrieb" },
  { id: "kunden", label: "Kunden" },
  { id: "unternehmen", label: "Unternehmen" },
  { id: "ki", label: "KI" },
  { id: "plattformen", label: "Plattformen" },
] as const;

const BULLET_PRESETS = [
  "CRM-Pipeline", "Lead-Funnel", "Automatisierung", "KI-Integration",
  "Reporting & KPIs", "Rollenbasierte Rechte", "Drag & Drop", "Mobile App",
  "API-Anbindung", "Multi-Tenant", "Echtzeit-Dashboard", "Benachrichtigungen",
];

const empty = (): Partial<SystemCardEntry> => ({
  title: "", tagline: "", desc: "", longDesc: "",
  category: "unternehmen", slug: "",
  bullets: [], details: [], image: "", alt: "", isPublished: true, sortOrder: 0,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</label>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/25 focus:bg-white/[0.07] ${className}`}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/25 focus:bg-white/[0.07] resize-none ${className}`}
    />
  );
}

function ListInput({
  value,
  onChange,
  presets,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  presets?: string[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = (item: string) => {
    const t = item.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };
  const remove = (item: string) => onChange(value.filter((v) => v !== item));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/80">
            {t}
            <button onClick={() => remove(t)} className="text-white/40 hover:text-white/80 transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } }}
          placeholder={placeholder || "Eintrag hinzufügen…"}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
        />
        <button onClick={() => add(input)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white transition-colors">+</button>
      </div>
      {presets && (
        <div className="flex flex-wrap gap-1">
          {presets.filter((p) => !value.includes(p)).map((p) => (
            <button key={p} onClick={() => onChange([...value, p])}
              className="rounded-full border border-white/8 bg-transparent px-2 py-0.5 text-[10px] text-white/35 hover:border-white/20 hover:text-white/60 transition-colors">
              + {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageUploadZone({
  label,
  currentSrc,
  onFile,
  uploading,
}: {
  label: string;
  currentSrc?: string;
  onFile: (f: File) => void;
  uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border transition-all ${drag ? "border-[var(--accent)] bg-white/[0.07]" : "border-dashed border-white/15 hover:border-white/30 bg-white/[0.02]"}`}
      >
        {currentSrc ? (
          <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
            <Image src={currentSrc} alt={label} fill className="object-cover rounded-xl" sizes="400px" unoptimized={currentSrc.startsWith("/api/")} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <span className="text-xs text-white font-medium">Bild ändern</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-6 text-center">
            <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-white/30">{uploading ? "Wird hochgeladen…" : "Klicken oder reinziehen"}</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

function EditDrawer({
  item,
  onSave,
  onClose,
  onCreate,
}: {
  item: Partial<SystemCardEntry> | null;
  onSave: (data: Partial<SystemCardEntry>) => Promise<void>;
  onClose: () => void;
  onCreate?: boolean;
}) {
  const [form, setForm] = useState<Partial<SystemCardEntry>>(item ?? empty());
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof SystemCardEntry, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const uploadCover = async (file: File) => {
    if (!form.id) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/systems/${form.id}/cover`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) set("image", data.url);
    } catch {
      setError("Cover-Upload fehlgeschlagen");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch {
      setError("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 flex h-full w-full max-w-[560px] flex-col overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgba(12,8,30,0.98) 0%, rgba(8,5,20,0.99) 100%)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-white">{onCreate ? "Neues System" : "System bearbeiten"}</h3>
            {form.title && <p className="text-xs text-white/40 mt-0.5">{form.title}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Bild */}
          <ImageUploadZone
            label="Systembild"
            currentSrc={form.image}
            onFile={uploadCover}
            uploading={coverUploading}
          />
          {form.id && (
            <p className="text-[11px] text-white/25">
              Bild-URL: <span className="text-white/40">{form.image || "—"}</span>
            </p>
          )}

          {/* Kategorie */}
          <Field label="Kategorie">
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set("category", cat.id)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${form.category === cat.id ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Titel"><Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="z.B. KI-Telefonagent" /></Field>
          <Field label="Tagline (1 Satz)"><Input value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="z.B. Anrufe, die sich selbst bearbeiten." /></Field>
          <Field label="Kurzbeschreibung (max. 2 Zeilen)"><Textarea value={form.desc ?? ""} onChange={(e) => set("desc", e.target.value)} placeholder="Kompakte Benefit-Beschreibung für die Karte…" /></Field>
          <Field label="Lange Beschreibung (Detailseite)"><Textarea rows={5} value={form.longDesc ?? ""} onChange={(e) => set("longDesc", e.target.value)} placeholder="Ausführliche Beschreibung für die Detailseite…" /></Field>
          <Field label="Slug (URL)">
            <Input
              value={form.slug ?? ""}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="z.B. ki-telefonagent-voice"
            />
            <p className="text-[10px] text-white/25">Wird automatisch aus dem Titel generiert. Nur Kleinbuchstaben und Bindestriche.</p>
          </Field>

          <Field label="Bullets (3 kurze Stichpunkte für Karte)">
            <ListInput
              value={form.bullets ?? []}
              onChange={(v) => set("bullets", v)}
              presets={BULLET_PRESETS}
              placeholder="Bullet hinzufügen…"
            />
          </Field>

          <Field label="Details (Vollständige Feature-Liste für Detailseite)">
            <ListInput
              value={form.details ?? []}
              onChange={(v) => set("details", v)}
              placeholder="Detail hinzufügen…"
            />
          </Field>

          <Field label="Alt-Text (Bild-Beschreibung für SEO)"><Input value={form.alt ?? ""} onChange={(e) => set("alt", e.target.value)} placeholder="z.B. KI-Telefonagent — Live-Transkript und Dashboard" /></Field>

          {/* Toggle: Published */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Sichtbar</p>
              <p className="text-xs text-white/40">Systemkarte auf der Website anzeigen</p>
            </div>
            <button
              type="button"
              onClick={() => set("isPublished", !form.isPublished)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.isPublished ? "bg-[var(--accent)]" : "bg-white/15"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${form.isPublished ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-6 py-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || coverUploading}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "Wird gespeichert…" : onCreate ? "Anlegen" : "Speichern"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Card ─────────────────────────────────────────────────────────────────

function SystemRow({
  system,
  onEdit,
  onDelete,
  onToggle,
  dragHandleProps,
}: {
  system: SystemCardEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const CAT_LABELS: Record<string, string> = { vertrieb: "Vertrieb", kunden: "Kunden", unternehmen: "Unternehmen", ki: "KI", plattformen: "Plattformen" };

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${system.isPublished ? "border-white/[0.07] bg-white/[0.03]" : "border-white/[0.04] bg-white/[0.015] opacity-60"}`}
    >
      {/* Drag handle */}
      <div {...dragHandleProps} className="cursor-grab text-white/20 hover:text-white/50 transition-colors select-none shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="5" width="16" height="2" rx="1" /><rect x="4" y="11" width="16" height="2" rx="1" /><rect x="4" y="17" width="16" height="2" rx="1" />
        </svg>
      </div>

      {/* Thumbnail */}
      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg">
        {system.image ? (
          <Image
            src={system.image}
            alt={system.alt || system.title}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={system.image.startsWith("/api/")}
          />
        ) : (
          <div className="h-full w-full bg-white/[0.06] flex items-center justify-center">
            <svg className="h-4 w-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
            {CAT_LABELS[system.category] ?? system.category}
          </span>
          <p className="truncate text-sm font-medium text-white">{system.title}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-white/35">{system.tagline}</p>
        <p className="text-[10px] text-white/20 mt-0.5">/systeme/{system.slug}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle published */}
        <button
          onClick={onToggle}
          title={system.isPublished ? "Verstecken" : "Veröffentlichen"}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${system.isPublished ? "text-green-400/70 hover:text-green-400" : "text-white/20 hover:text-white/50"}`}
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d={system.isPublished ? "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" : "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            {system.isPublished && <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />}
          </svg>
        </button>

        <button
          onClick={onEdit}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.04)" }}
          title="Bearbeiten"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button onClick={onDelete} className="rounded-lg bg-red-500/20 border border-red-500/30 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/30 transition-colors">
              Löschen
            </button>
            <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/40 hover:text-white/60 transition-colors">
              Nein
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
            title="Löschen"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemsManager() {
  const [systems, setSystems] = useState<SystemCardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<SystemCardEntry> | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("alle");
  const [saving, setSaving] = useState(false);

  const CAT_LABELS: Record<string, string> = { vertrieb: "Vertrieb", kunden: "Kunden", unternehmen: "Unternehmen", ki: "KI", plattformen: "Plattformen" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/systems");
      const data = await res.json();
      if (Array.isArray(data.systems)) setSystems(data.systems);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filterCat === "alle" ? systems : systems.filter((s) => s.category === filterCat);

  // ── CRUD actions ──────────────────────────────────────────────────────────

  const handleCreate = async (data: Partial<SystemCardEntry>) => {
    const res = await fetch("/api/admin/systems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    // If image was staged but not uploaded yet (no id), re-fetch to get new id
    setCreating(false);
    await load();
  };

  const handleSave = async (data: Partial<SystemCardEntry>) => {
    if (!data.id) return;
    const res = await fetch(`/api/admin/systems/${data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Speichern fehlgeschlagen");
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/systems/${id}`, { method: "DELETE" });
    setSystems((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggle = async (sys: SystemCardEntry) => {
    setSaving(true);
    await fetch(`/api/admin/systems/${sys.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sys, isPublished: !sys.isPublished }),
    });
    setSystems((prev) => prev.map((s) => s.id === sys.id ? { ...s, isPublished: !s.isPublished } : s));
    setSaving(false);
  };

  // ── Drag & Drop reorder ───────────────────────────────────────────────────

  const dragIdx = useRef<number | null>(null);

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    setSystems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  };
  const handleDragEnd = async () => {
    dragIdx.current = null;
    const order = systems.map((s, i) => ({ id: s.id, sortOrder: i }));
    await fetch("/api/admin/systems", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Systemkarten</h2>
          <p className="text-xs text-white/40 mt-0.5">{systems.length} Systeme · {systems.filter((s) => s.isPublished).length} sichtbar</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Neues System
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {["alle", "vertrieb", "kunden", "unternehmen", "ki", "plattformen"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${filterCat === cat ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-white" : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"}`}
          >
            {cat === "alle" ? `Alle (${systems.length})` : `${CAT_LABELS[cat] ?? cat} (${systems.filter((s) => s.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-white/30">
          Keine Systeme in dieser Kategorie
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sys, idx) => (
            <div
              key={sys.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <SystemRow
                system={sys}
                onEdit={() => setEditing(sys)}
                onDelete={() => handleDelete(sys.id)}
                onToggle={() => handleToggle(sys)}
              />
            </div>
          ))}
        </div>
      )}

      {saving && (
        <p className="text-center text-xs text-white/30 animate-pulse">Wird gespeichert…</p>
      )}

      {/* Drawers */}
      {creating && (
        <EditDrawer
          item={empty()}
          onCreate
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <EditDrawer
          item={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
