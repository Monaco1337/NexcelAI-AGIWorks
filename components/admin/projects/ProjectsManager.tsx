"use client";

/**
 * Projektübersicht.
 *
 * Das Zeilenlayout folgt der Vercel-Projektliste, weil das Team diese Ansicht
 * täglich vor Augen hat: Farbkachel, Name mit Domain darunter, in der Mitte
 * die jüngste Bewegung, rechts ein Statuszeichen.
 *
 * Der inhaltliche Unterschied: wo bei Vercel der letzte Commit steht, steht
 * hier das zuletzt bewegte Ticket. Die Liste beantwortet damit nicht "was
 * wurde deployed", sondern "wo liegt gerade Arbeit an" — und genau darum geht
 * es beim Sprung von hier ins Ticketsystem.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUSES,
  type Project,
  type ProjectStatus,
} from "@/lib/projects/model";
import { STATUS_COLOR, STATUS_LABEL, type TicketStatus } from "@/lib/tickets/model";

/** Vorschlagsfarben für neue Projekte — bewusst gut unterscheidbar. */
const PALETTE = [
  "#A45CFF", "#5BB8FF", "#22C55E", "#FBBF24", "#F472B6",
  "#FB923C", "#14B8A6", "#EF4444", "#8B7CFF", "#84CC16",
];

function relTime(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "gerade eben";
  if (sec < 3600) return `vor ${Math.floor(sec / 60)} Min`;
  if (sec < 86400) return `vor ${Math.floor(sec / 3600)} Std`;
  if (sec < 2592000) return `vor ${Math.floor(sec / 86400)} T`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

/** Kürzt die Domain auf das Wesentliche, wie in der Vorlage. */
function hostOf(url: string | null): string {
  if (!url) return "Keine Produktions-URL";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function initials(name: string): string {
  const parts = name.split(/[\s-_&]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ProjectsManager({
  accent,
  onOpenTickets,
}: {
  accent: string;
  /** Sprung ins Ticket Control Center, vorgefiltert auf dieses Projekt. */
  onOpenTickets: (projectId: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/projects?archived=${showArchived ? "1" : "0"}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data.projects ?? []);
      setError(null);
    } catch {
      setError("Projekte konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => { void load(); }, [load]);

  // Die Suche läuft im Browser: bei vierzehn Projekten wäre eine Abfrage je
  // Tastendruck reine Verschwendung.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        (p.productionUrl ?? "").toLowerCase().includes(term) ||
        (p.repo ?? "").toLowerCase().includes(term)
    );
  }, [projects, search]);

  const totals = useMemo(
    () => ({
      projects: projects.length,
      open: projects.reduce((s, p) => s + p.openTickets, 0),
      overdue: projects.reduce((s, p) => s + p.overdueTickets, 0),
    }),
    [projects]
  );

  return (
    <div className="space-y-4">
      {/* Kopfzeile */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-baseline gap-4 text-[11px] text-white/40">
          <span>
            <strong className="text-sm font-semibold text-white">{totals.projects}</strong> Projekte
          </span>
          <span>
            <strong className="text-sm font-semibold" style={{ color: accent }}>{totals.open}</strong> offene Tickets
          </span>
          {totals.overdue > 0 && (
            <span>
              <strong className="text-sm font-semibold text-red-400">{totals.overdue}</strong> überfällig
            </span>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Projekt suchen…"
            className="w-52 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder-white/25 outline-none transition focus:border-white/25"
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-white/40">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-3 w-3"
              style={{ accentColor: accent }}
            />
            Archivierte
          </label>
          <button
            onClick={() => setCreating(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: accent }}
          >
            Projekt hinzufügen
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Liste im Layout der Vercel-Übersicht */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07]">
        {loading && projects.length === 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[64px] animate-pulse bg-white/[0.015]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm text-white/50">
              {search ? "Kein Projekt passt zur Suche." : "Noch keine Projekte angelegt."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {visible.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                accent={accent}
                onEdit={() => setEditing(p)}
                onOpenTickets={() => onOpenTickets(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {(creating || editing) && (
          <ProjectEditor
            accent={accent}
            project={editing}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={async () => { setCreating(false); setEditing(null); await load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Zeile ──────────────────────────────────────────────────────────── */

function ProjectRow({
  project,
  accent,
  onEdit,
  onOpenTickets,
}: {
  project: Project;
  accent: string;
  onEdit: () => void;
  onOpenTickets: () => void;
}) {
  const p = project;

  return (
    <div className="group flex items-center gap-3.5 px-3.5 py-3 transition-colors hover:bg-white/[0.025]">
      {/* Farbkachel mit Initialen */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
        style={{
          background: `${p.color}22`,
          border: `1px solid ${p.color}44`,
          color: p.color,
        }}
      >
        {initials(p.name)}
      </div>

      {/* Name und Domain */}
      <div className="w-52 shrink-0">
        <button
          onClick={onOpenTickets}
          className="block max-w-full truncate text-left text-[13px] font-semibold text-white/90 hover:text-white"
          title={`Tickets von ${p.name} anzeigen`}
        >
          {p.name}
        </button>
        {p.productionUrl ? (
          <a
            href={p.productionUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block max-w-full truncate text-[11px] text-white/35 hover:text-white/60"
          >
            {hostOf(p.productionUrl)}
          </a>
        ) : (
          <span className="block text-[11px] text-white/25">Keine Produktions-URL</span>
        )}
      </div>

      {/* Jüngste Bewegung — an der Stelle des Commits in der Vorlage */}
      <button
        onClick={onOpenTickets}
        className="hidden min-w-0 flex-1 text-left md:block"
      >
        {p.lastActivity ? (
          <>
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: STATUS_COLOR[p.lastActivity.status as TicketStatus] ?? "#6B7280" }}
              />
              <span className="truncate text-[12px] text-white/70 group-hover:text-white/90">
                {p.lastActivity.title}
              </span>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-white/30">
              {p.lastActivity.key} ·{" "}
              {STATUS_LABEL[p.lastActivity.status as TicketStatus] ?? p.lastActivity.status}
              {p.lastActivity.actorName ? ` · ${p.lastActivity.actorName}` : ""} ·{" "}
              {relTime(p.lastActivity.at)}
            </div>
          </>
        ) : (
          <>
            <div className="truncate text-[12px] text-white/30">Noch keine Tickets</div>
            <div className="mt-0.5 truncate text-[11px] text-white/20">
              {p.repo ?? "Kein Repository hinterlegt"}
            </div>
          </>
        )}
      </button>

      {/* Zähler */}
      <div className="flex shrink-0 items-center gap-1.5">
        {p.overdueTickets > 0 && (
          <span
            className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300"
            title={`${p.overdueTickets} überfällig`}
          >
            {p.overdueTickets} überfällig
          </span>
        )}
        <button
          onClick={onOpenTickets}
          className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors"
          style={
            p.openTickets > 0
              ? { borderColor: `${accent}55`, background: `${accent}14`, color: "#fff" }
              : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }
          }
          title="Tickets dieses Projekts"
        >
          {p.openTickets} offen
        </button>
      </div>

      {/* Status und Bearbeiten */}
      <div className="flex w-24 shrink-0 items-center justify-end gap-2">
        <span
          className="flex items-center gap-1.5 text-[10px]"
          style={{ color: PROJECT_STATUS_COLOR[p.status] }}
          title={PROJECT_STATUS_LABEL[p.status]}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: PROJECT_STATUS_COLOR[p.status] }}
          />
          <span className="hidden lg:inline">{PROJECT_STATUS_LABEL[p.status]}</span>
        </span>
        <button
          onClick={onEdit}
          className="rounded p-1 text-white/25 opacity-0 transition hover:bg-white/5 hover:text-white group-hover:opacity-100"
          title="Projekt bearbeiten"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Anlegen und Bearbeiten ─────────────────────────────────────────── */

function ProjectEditor({
  accent,
  project,
  onClose,
  onSaved,
}: {
  accent: string;
  project: Project | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [productionUrl, setProductionUrl] = useState(project?.productionUrl ?? "");
  const [repo, setRepo] = useState(project?.repo ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? PALETTE[0]);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setError("Bitte einen Namen angeben.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name, productionUrl, repo, description, color, status };
      const res = await fetch(
        project ? `/api/admin/projects/${project.id}` : "/api/admin/projects",
        {
          method: project ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(typeof d.error === "string" ? d.error : "Speichern fehlgeschlagen.");
        return;
      }
      await onSaved();
    } catch {
      setError("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) await onSaved();
      else setError("Löschen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0B0B12] p-5 shadow-2xl"
      >
        <h3 className="text-sm font-semibold text-white">
          {project ? "Projekt bearbeiten" : "Neues Projekt"}
        </h3>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="z. B. Beauty Bar Unna"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Produktions-URL
            </label>
            <input
              value={productionUrl}
              onChange={(e) => setProductionUrl(e.target.value)}
              placeholder="https://www.beispiel.de"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Repository
            </label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="Monaco1337/Projektname"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Notiz
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Worum geht es bei diesem Projekt?"
              className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Farbe</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-md transition-transform hover:scale-110"
                    style={{
                      background: `${c}33`,
                      border: `1.5px solid ${color === c ? c : "transparent"}`,
                      boxShadow: color === c ? `0 0 0 1px ${c}66` : undefined,
                    }}
                    title={c}
                  >
                    <span className="block h-full w-full rounded-[3px]" style={{ background: c, opacity: 0.55 }} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[#0B0B12]">
                    {PROJECT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {project && confirmDelete && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5">
              <p className="text-[11px] leading-relaxed text-red-200">
                Projekt wirklich löschen? Die zugehörigen Tickets bleiben erhalten und
                verlieren nur ihre Projektzuordnung.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => void remove()}
                  disabled={saving}
                  className="rounded border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-200"
                >
                  Ja, löschen
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-white/40 hover:text-white/70"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {project && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="mr-auto text-[11px] text-red-400/60 hover:text-red-400"
            >
              Löschen
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3.5 py-2 text-xs text-white/60 hover:text-white"
          >
            Abbrechen
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: accent }}
          >
            {saving ? "Speichert…" : project ? "Speichern" : "Projekt anlegen"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
