"use client";

/**
 * NEXCEL AI / AGI WORKS · Reference Manager (Admin)
 * Vollständige Referenz-Verwaltung: Anlegen, Bearbeiten, Löschen,
 * Drag & Drop Sortierung, Bild-Upload, aktiv/inaktiv Toggle.
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
import { STATIC_REFERENCES, type ReferenceEntry } from "@/lib/references-data";

// ─── Types ────────────────────────────────────────────────────────────────────
type RefImage = { id: string; url: string; alt: string; sortOrder: number };

type AdminRef = ReferenceEntry & { extraImages?: RefImage[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["live", "demo", "intern", "referenz"] as const;
const TAG_PRESETS = [
  "Website", "Web-App", "Mobile App", "SaaS", "CRM", "ERP", "Admin Panel",
  "Buchungssystem", "Lead Funnel", "Kundenportal", "KI-System", "Automatisierung",
  "App", "E-Commerce",
];
const MODULE_PRESETS = [
  "Online-Buchung", "Terminkalender", "Kundenverwaltung", "Admin-Dashboard",
  "Lead-Funnel", "CRM & Pipeline", "Rollen & Rechte", "Reporting",
  "Automatisierungen", "Galerie-CMS", "Dokumentenverwaltung",
  "Live-Tracking", "Schichtplanung", "Patientenaufnahme",
];

const empty = (): Partial<AdminRef> => ({
  title: "", clientName: "", shortDescription: "", fullDescription: "",
  type: "", tags: [], modules: [], websiteUrl: "", status: "live",
  coverImage: "", isPublished: true, sortOrder: 0,
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

function TagInput({
  value,
  onChange,
  presets,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  presets: string[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = (tag: string) => {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };
  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));
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
          placeholder={placeholder || "Tag hinzufügen…"}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
        />
        <button onClick={() => add(input)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white transition-colors">+</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.filter((p) => !value.includes(p)).map((p) => (
          <button key={p} onClick={() => onChange([...value, p])}
            className="rounded-full border border-white/8 bg-transparent px-2 py-0.5 text-[10px] text-white/35 hover:border-white/20 hover:text-white/60 transition-colors">
            + {p}
          </button>
        ))}
      </div>
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
            <Image src={currentSrc} alt={label} fill className="object-cover rounded-xl" sizes="400px" />
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
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
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
  item: Partial<AdminRef> | null;
  onSave: (data: Partial<AdminRef>) => Promise<void>;
  onClose: () => void;
  onCreate?: boolean;
}) {
  const [form, setForm] = useState<Partial<AdminRef>>(item ?? empty());
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [extraImages, setExtraImages] = useState<RefImage[]>(item?.extraImages ?? []);
  const [imgUploading, setImgUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof AdminRef, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const uploadCover = async (file: File) => {
    if (!form.id) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/references/${form.id}/cover`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) set("coverImage", data.url);
    } catch {
      setError("Cover-Upload fehlgeschlagen");
    } finally {
      setCoverUploading(false);
    }
  };

  const uploadExtra = async (file: File) => {
    if (!form.id) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alt", form.title ?? "");
      fd.append("sortOrder", String(extraImages.length));
      const res = await fetch(`/api/admin/references/${form.id}/images`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.id) {
        setExtraImages((prev) => [...prev, { id: data.id, url: data.url, alt: data.alt, sortOrder: data.sortOrder }]);
      }
    } catch {
      setError("Bild-Upload fehlgeschlagen");
    } finally {
      setImgUploading(false);
    }
  };

  const deleteExtra = async (imgId: string) => {
    if (!form.id) return;
    await fetch(`/api/admin/references/${form.id}/images/${imgId}`, { method: "DELETE" });
    setExtraImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, extraImages });
    } catch {
      setError("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />
      {/* Panel */}
      <div className="flex w-full max-w-[540px] flex-col overflow-y-auto border-l border-white/10"
        style={{ background: "rgba(10,10,20,0.98)", backdropFilter: "blur(20px)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 px-6 py-4"
          style={{ background: "rgba(10,10,20,0.95)" }}
        >
          <h3 className="text-base font-semibold text-white">
            {onCreate ? "Neue Referenz" : "Referenz bearbeiten"}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <Field label="Titel *">
            <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="z. B. BeautyBar Akademie" />
          </Field>

          <Field label="Kundenname">
            <Input value={form.clientName ?? ""} onChange={(e) => set("clientName", e.target.value)} placeholder="z. B. BeautyBar Akademie GmbH" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Projekttyp">
              <Input value={form.type ?? ""} onChange={(e) => set("type", e.target.value)} placeholder="z. B. Buchungssystem" />
            </Field>
            <Field label="Status">
              <select
                value={form.status ?? "live"}
                onChange={(e) => set("status", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#0a0a14]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Kurzbeschreibung">
            <Textarea value={form.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} placeholder="1–2 Sätze über das Projekt…" rows={2} />
          </Field>

          <Field label="Vollständige Beschreibung">
            <Textarea value={form.fullDescription ?? ""} onChange={(e) => set("fullDescription", e.target.value)} placeholder="Detaillierte Beschreibung des Projekts, Herausforderungen, Lösungen…" rows={5} />
          </Field>

          <Field label="Tags">
            <TagInput value={form.tags ?? []} onChange={(v) => set("tags", v)} presets={TAG_PRESETS} placeholder="Tag hinzufügen…" />
          </Field>

          <Field label="Module / Leistungen">
            <TagInput value={form.modules ?? []} onChange={(v) => set("modules", v)} presets={MODULE_PRESETS} placeholder="Modul hinzufügen…" />
          </Field>

          <Field label="Webseiten-URL (optional)">
            <Input type="url" value={form.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://beispiel.de" />
          </Field>

          {/* Cover image */}
          <ImageUploadZone
            label="Hauptbild (Cover)"
            currentSrc={form.coverImage || undefined}
            onFile={uploadCover}
            uploading={coverUploading}
          />

          {/* Extra images */}
          {form.id && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Weitere Screenshots</p>
              <div className="grid grid-cols-3 gap-2">
                {extraImages.map((img) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg" style={{ aspectRatio: "16/9" }}>
                    <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="160px" />
                    <button
                      onClick={() => deleteExtra(img.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ))}
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 transition-colors hover:border-white/30"
                  style={{ aspectRatio: "16/9" }}
                >
                  <span className="text-xl text-white/20">+</span>
                  <span className="text-[10px] text-white/25">Hinzufügen</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadExtra(f); }} />
                </label>
              </div>
              {imgUploading && <p className="text-xs text-white/40">Bild wird hochgeladen…</p>}
            </div>
          )}

          {/* Published toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Veröffentlicht</p>
              <p className="text-xs text-white/40">Referenz auf der Website anzeigen</p>
            </div>
            <button
              onClick={() => set("isPublished", !form.isPublished)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isPublished ? "bg-[var(--accent)]" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 border-t border-white/8 px-6 py-4"
          style={{ background: "rgba(10,10,20,0.95)" }}
        >
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-white/60 hover:text-white transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "Wird gespeichert…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReferenceManager({ accent = "#A45CFF" }: { accent?: string }) {
  const [refs, setRefs] = useState<AdminRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<AdminRef> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/references", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.references)) setRefs(data.references);
      else setRefs(STATIC_REFERENCES);
    } catch {
      setRefs(STATIC_REFERENCES);
      setError("Referenzen konnten nicht aus der Datenbank geladen werden. Statische Daten werden angezeigt.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = () => {
    const newRef = { ...empty(), id: `ref_new_${Date.now()}`, sortOrder: refs.length + 1 };
    setIsCreating(true);
    setEditItem(newRef);
  };

  const handleSave = async (data: Partial<AdminRef>) => {
    if (!data.id) return;
    setError(null);
    try {
      if (isCreating) {
        const res = await fetch("/api/admin/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Erstellen fehlgeschlagen");
      } else {
        const res = await fetch(`/api/admin/references/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      }
      setEditItem(null);
      setIsCreating(false);
      await load();
      showSuccess(isCreating ? "Referenz erstellt" : "Änderungen gespeichert");
    } catch {
      setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Referenz wirklich löschen?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/references/${id}`, { method: "DELETE" });
      await load();
      showSuccess("Referenz gelöscht");
    } catch {
      setError("Löschen fehlgeschlagen.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (ref: AdminRef) => {
    await fetch(`/api/admin/references/${ref.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !ref.isPublished }),
    });
    await load();
  };

  // Drag & Drop reorder
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    const fromIdx = refs.findIndex((r) => r.id === draggingId);
    const toIdx = refs.findIndex((r) => r.id === targetId);
    const newRefs = [...refs];
    const [moved] = newRefs.splice(fromIdx, 1);
    newRefs.splice(toIdx, 0, moved);
    const reordered = newRefs.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    setRefs(reordered);
    setDraggingId(null);
    setDragOverId(null);
    await fetch("/api/admin/references", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((r) => ({ id: r.id, sortOrder: r.sortOrder })) }),
    });
  };

  const STATUS_COLOR: Record<string, string> = {
    live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    demo: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    intern: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    referenz: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Referenzen</h2>
          <p className="text-sm text-white/45">{refs.length} Projekte · Drag &amp; Drop zum Sortieren</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: accent }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Neue Referenz
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && refs.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <svg className="h-12 w-12 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div>
            <p className="text-base font-medium text-white/50">Noch keine Referenzen</p>
            <p className="mt-1 text-sm text-white/30">Erstelle deine erste Referenz mit dem Button oben.</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {/* Reference list */}
      {!loading && refs.length > 0 && (
        <div className="space-y-2">
          {refs.map((ref) => (
            <div
              key={ref.id}
              draggable
              onDragStart={() => handleDragStart(ref.id)}
              onDragOver={(e) => handleDragOver(e as unknown as DragEvent<HTMLDivElement>, ref.id)}
              onDrop={(e) => handleDrop(e as unknown as DragEvent<HTMLDivElement>, ref.id)}
              onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
              className={`group flex items-center gap-4 rounded-xl border p-3 transition-all ${dragOverId === ref.id ? "border-[var(--accent)]/50 bg-white/[0.06]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/12 hover:bg-white/[0.04]"} ${!ref.isPublished ? "opacity-50" : ""}`}
            >
              {/* Drag handle */}
              <div className="cursor-grab text-white/20 hover:text-white/50 transition-colors active:cursor-grabbing">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="9" y1="6" x2="15" y2="6" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="18" x2="15" y2="18" />
                </svg>
              </div>

              {/* Thumbnail */}
              <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg">
                {ref.coverImage ? (
                  <Image src={ref.coverImage} alt={ref.title} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="h-full w-full bg-white/5" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-white">{ref.title}</p>
                  <span className={`hidden shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium sm:flex ${STATUS_COLOR[ref.status] ?? "bg-white/10 text-white/50 border-white/15"}`}>
                    {ref.status}
                  </span>
                </div>
                <p className="truncate text-xs text-white/40">{ref.type} · {ref.tags.slice(0, 3).join(", ")}</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                {/* Toggle published */}
                <button
                  onClick={() => handleTogglePublish(ref)}
                  title={ref.isPublished ? "Deaktivieren" : "Aktivieren"}
                  className={`h-5 w-9 rounded-full transition-colors ${ref.isPublished ? "bg-[var(--accent)]" : "bg-white/10"}`}
                >
                  <span className={`mx-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform ${ref.isPublished ? "translate-x-4" : "translate-x-0"}`} />
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setIsCreating(false); setEditItem(ref); }}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-white/25 hover:text-white transition-all"
                >
                  Bearbeiten
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(ref.id)}
                  disabled={deletingId === ref.id}
                  className="rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400/70 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50"
                >
                  {deletingId === ref.id ? "…" : "×"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Drawer */}
      {editItem && (
        <EditDrawer
          item={editItem}
          onSave={handleSave}
          onClose={() => { setEditItem(null); setIsCreating(false); }}
          onCreate={isCreating}
        />
      )}
    </div>
  );
}
