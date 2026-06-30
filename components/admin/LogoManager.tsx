"use client";

/**
 * NEXCEL AI / AGI WORKS · Logo-Manager (Admin)
 *
 * Drag-and-Drop Upload für Kunden-Logos des Slider-Bereichs.
 * Logos werden persistent in Postgres gespeichert und erscheinen sofort
 * im öffentlichen Slider (CustomerLogoMarquee).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_LOGOS } from "@/lib/default-logos";

type AdminLogo = {
  id: string;
  name: string;
  brand: "all" | "nexcel" | "agiworks";
  className: string;
  filterStyle: string;
  sortOrder: number;
  active: boolean;
};

const BRAND_LABEL: Record<AdminLogo["brand"], string> = {
  all: "Beide Marken",
  nexcel: "NEXCEL AI",
  agiworks: "AGI Works",
};

export default function LogoManager({ accent = "#A45CFF" }: { accent?: string }) {
  const [logos, setLogos] = useState<AdminLogo[]>([]);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/logos", { cache: "no-store" });
      const data = await res.json();
      setDbConnected(!!data.dbConnected);
      setLogos(Array.isArray(data.logos) ? data.logos : []);
    } catch {
      setError("Logos konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) {
        setError("Bitte nur Bilddateien (PNG, JPG, WEBP, SVG, GIF).");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        for (const file of list) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("name", file.name.replace(/\.[^.]+$/, ""));
          const res = await fetch("/api/admin/logos", { method: "POST", body: fd });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setError(j.error || `Upload fehlgeschlagen: ${file.name}`);
          }
        }
        await load();
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles],
  );

  const patchLogo = async (id: string, updates: Partial<AdminLogo>) => {
    setBusyId(id);
    setLogos((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    try {
      await fetch(`/api/admin/logos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } finally {
      setBusyId(null);
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    setError(null);
    try {
      for (const def of DEFAULT_LOGOS) {
        try {
          const res = await fetch(def.src, { cache: "no-store" });
          if (!res.ok) continue;
          const blob = await res.blob();
          const ext = blob.type.includes("svg") ? "svg" : blob.type.split("/")[1] || "png";
          const file = new File([blob], `${def.name}.${ext}`, {
            type: blob.type || "image/png",
          });
          const fd = new FormData();
          fd.append("file", file);
          fd.append("name", def.name);
          fd.append("className", def.className);
          fd.append("filterStyle", def.filterStyle);
          await fetch("/api/admin/logos", { method: "POST", body: fd });
        } catch {
          /* einzelnes Logo überspringen */
        }
      }
      await load();
    } finally {
      setSeeding(false);
    }
  };

  const removeLogo = async (id: string) => {
    if (!confirm("Dieses Logo wirklich löschen?")) return;
    setBusyId(id);
    setLogos((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/admin/logos/${id}`, { method: "DELETE" });
    } finally {
      setBusyId(null);
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = logos.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= logos.length) return;
    const next = [...logos];
    [next[idx], next[target]] = [next[target], next[idx]];
    setLogos(next);
    await fetch("/api/admin/logos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((l) => l.id) }),
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Status / Hinweis ─────────────────────────────────────── */}
      {dbConnected === false && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
          }}
        >
          <h3 className="text-sm font-semibold text-amber-300 mb-1">
            Datenbank noch nicht verbunden
          </h3>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Sobald Vercel Postgres mit dem Projekt verbunden ist, kannst du hier
            Logos per Drag-and-Drop hochladen. Bis dahin zeigt der Slider die fest
            hinterlegten Standard-Logos. Anleitung steht im Chat.
          </p>
        </div>
      )}

      {/* ── Dropzone ─────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative cursor-pointer rounded-2xl p-10 text-center transition-all"
        style={{
          background: dragActive ? `${accent}14` : "rgba(255,255,255,0.02)",
          border: `1.5px dashed ${dragActive ? accent : "rgba(255,255,255,0.14)"}`,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: `${accent}1f`, border: `1px solid ${accent}40` }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white">
          {uploading ? "Lädt hoch …" : "Logos hierher ziehen oder klicken"}
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          PNG, JPG, WEBP, SVG · max. 3 MB · mehrere gleichzeitig möglich
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
        >
          {error}
        </div>
      )}

      {/* ── Liste ────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Logos im Slider {logos.length > 0 && <span className="text-[#6B7280]">· {logos.length}</span>}
          </h3>
          <button
            onClick={load}
            className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
          >
            Aktualisieren
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#6B7280]">Lädt …</div>
        ) : logos.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-[#6B7280]">Noch keine Logos hochgeladen.</p>
            {dbConnected && (
              <button
                onClick={seedDefaults}
                disabled={seeding}
                className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: accent, boxShadow: `0 6px 22px ${accent}40` }}
              >
                {seeding ? "Importiere …" : "Aktuelle Website-Logos importieren"}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {logos.map((logo, i) => (
              <div
                key={logo.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  opacity: logo.active ? 1 : 0.55,
                }}
              >
                {/* Preview */}
                <div
                  className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/logos/${logo.id}/image`}
                    alt={logo.name}
                    className="max-h-10 max-w-[80px] object-contain"
                    style={{ filter: logo.filterStyle }}
                  />
                </div>

                {/* Name + Brand */}
                <div className="min-w-[160px] flex-1">
                  <input
                    defaultValue={logo.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== logo.name) patchLogo(logo.id, { name: v });
                    }}
                    className="w-full bg-transparent text-sm font-medium text-white outline-none focus:border-b focus:border-white/20"
                  />
                  <select
                    value={logo.brand}
                    onChange={(e) => patchLogo(logo.id, { brand: e.target.value as AdminLogo["brand"] })}
                    className="mt-1 rounded bg-white/[0.04] px-2 py-1 text-xs text-[#9CA3AF] outline-none"
                  >
                    {(["all", "nexcel", "agiworks"] as const).map((b) => (
                      <option key={b} value={b} className="bg-[#12121a]">
                        {BRAND_LABEL[b]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aktionen */}
                <div className="flex items-center gap-1.5">
                  <button
                    title="Nach oben"
                    onClick={() => move(logo.id, -1)}
                    disabled={i === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    title="Nach unten"
                    onClick={() => move(logo.id, 1)}
                    disabled={i === logos.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    title={logo.active ? "Ausblenden" : "Einblenden"}
                    onClick={() => patchLogo(logo.id, { active: !logo.active })}
                    disabled={busyId === logo.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: logo.active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                      color: logo.active ? "#86efac" : "#9CA3AF",
                    }}
                  >
                    {logo.active ? "Sichtbar" : "Verborgen"}
                  </button>
                  <button
                    title="Löschen"
                    onClick={() => removeLogo(logo.id)}
                    disabled={busyId === logo.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-red-500/15 hover:text-red-400"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
