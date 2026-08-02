"use client";

/**
 * Ticket-Detailansicht als seitliches Panel.
 *
 * Die Ansicht lädt Ticket, Kommentare, Beziehungen, Anhänge und Verlauf über
 * einen einzigen Aufruf — die API stellt sie serverseitig parallel zusammen.
 *
 * Änderungen werden über die Versionsnummer abgesichert: hat jemand anderes
 * das Ticket zwischenzeitlich bearbeitet, antwortet der Server mit einem
 * Konflikt statt die fremde Änderung zu überschreiben.
 */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  RELATION_LABEL,
  SEVERITY_LABEL,
  SOURCE_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TYPE_COLOR,
  TYPE_LABEL,
  allowedTransitions,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
} from "@/lib/tickets/model";
import type {
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketRelationEntry,
} from "@/lib/tickets/ticketsStore";

interface AssignableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProjectOption {
  id: string;
  name: string;
  color: string;
}

interface HistoryEntry {
  id: string;
  actorEmail: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  context: Record<string, unknown>;
  createdAt: string;
}

interface Payload {
  ticket: Ticket;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  relations: TicketRelationEntry[];
  history: HistoryEntry[];
}

/** Verlaufseinträge in einen lesbaren Satz übersetzen. */
const ACTION_TEXT: Record<string, string> = {
  "ticket.created": "hat das Ticket angelegt",
  "ticket.updated": "hat das Ticket bearbeitet",
  "ticket.assigned": "hat die Zuweisung geändert",
  "ticket.status_changed": "hat den Status geändert",
  "ticket.comment_added": "hat kommentiert",
  "ticket.internal_note_added": "hat eine interne Notiz hinterlegt",
  "ticket.comment_deleted": "hat einen Kommentar gelöscht",
  "ticket.attachment_added": "hat einen Anhang hinzugefügt",
  "ticket.attachment_deleted": "hat einen Anhang gelöscht",
  "ticket.relation_added": "hat eine Verknüpfung angelegt",
  "ticket.relation_removed": "hat eine Verknüpfung entfernt",
  "ticket.archived": "hat das Ticket archiviert",
  "ticket.unarchived": "hat das Ticket aus dem Archiv geholt",
  "ticket.deleted": "hat das Ticket gelöscht",
  "ticket.restored": "hat das Ticket wiederhergestellt",
  "ticket.bulk_operation": "hat einen Massenvorgang ausgeführt",
};

const FIELD_LABEL: Record<string, string> = {
  title: "Titel",
  description: "Beschreibung",
  type: "Art",
  priority: "Priorität",
  severity: "Schweregrad",
  assigneeId: "Bearbeiter",
  orgId: "Organisation",
  projectId: "Projekt",
  labels: "Schlagworte",
  visibility: "Sichtbarkeit",
  dueAt: "Fälligkeit",
  status: "Status",
};

function fullTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function relTime(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "gerade eben";
  if (sec < 3600) return `vor ${Math.floor(sec / 60)} Min`;
  if (sec < 86400) return `vor ${Math.floor(sec / 3600)} Std`;
  if (sec < 604800) return `vor ${Math.floor(sec / 86400)} T`;
  return fullTime(iso);
}

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function TicketDetail({
  ticketId,
  accent,
  users,
  projects,
  onClose,
  onChanged,
}: {
  ticketId: string;
  accent: string;
  users: AssignableUser[];
  projects: ProjectOption[];
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(true);
  const [tab, setTab] = useState<"verlauf" | "protokoll">("verlauf");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(null);
    } catch {
      setError("Ticket konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { void load(); }, [load]);

  /* Escape schließt das Panel — erwartetes Verhalten bei Overlays. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ticket = data?.ticket;

  /** Jede Änderung schickt die Version mit und übernimmt die Antwort. */
  const patch = async (body: Record<string, unknown>) => {
    if (!ticket) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, version: ticket.version }),
      });
      if (res.status === 409) {
        setError("Das Ticket wurde zwischenzeitlich geändert. Ansicht wird aktualisiert.");
        await load();
        return;
      }
      if (!res.ok) {
        setError("Änderung fehlgeschlagen.");
        return;
      }
      await load();
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const transition = async (status: TicketStatus) => {
    if (!ticket) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, version: ticket.version }),
      });
      if (res.status === 409) {
        setError("Das Ticket wurde zwischenzeitlich geändert. Ansicht wird aktualisiert.");
        await load();
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(typeof d.error === "string" ? d.error : "Statuswechsel fehlgeschlagen.");
        return;
      }
      await load();
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const submitComment = async () => {
    if (!ticket || !comment.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment, isInternal: internal }),
      });
      if (res.ok) {
        setComment("");
        await load();
        await onChanged();
      } else {
        setError("Kommentar konnte nicht gespeichert werden.");
      }
    } finally {
      setBusy(false);
    }
  };

  const lifecycle = async (action: "archive" | "unarchive" | "restore") => {
    if (!ticket) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await load();
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!ticket) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, { method: "DELETE" });
      if (res.ok) {
        await onChanged();
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#0B0B12]"
      >
        {loading && !ticket ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs text-white/40">Lädt…</span>
          </div>
        ) : !ticket ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <span className="text-sm text-white/50">{error ?? "Ticket nicht gefunden."}</span>
            <button onClick={onClose} className="text-xs text-white/40 hover:text-white">Schließen</button>
          </div>
        ) : (
          <>
            {/* Kopf */}
            <header className="shrink-0 border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]"
                  style={{ background: `${TYPE_COLOR[ticket.type]}1A`, color: TYPE_COLOR[ticket.type] }}
                >
                  {ticket.key}
                </span>

                <div className="min-w-0 flex-1">
                  {editingTitle ? (
                    <input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => {
                        setEditingTitle(false);
                        if (titleDraft.trim() && titleDraft !== ticket.title) void patch({ title: titleDraft });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditingTitle(false);
                      }}
                      autoFocus
                      className="w-full rounded border border-white/20 bg-white/[0.05] px-2 py-1 text-[15px] font-semibold text-white outline-none"
                    />
                  ) : (
                    <h2
                      onClick={() => { setTitleDraft(ticket.title); setEditingTitle(true); }}
                      className="cursor-text text-[15px] font-semibold leading-snug text-white hover:text-white/80"
                      title="Zum Bearbeiten klicken"
                    >
                      {ticket.title}
                    </h2>
                  )}
                  <p className="mt-1 text-[11px] text-white/35">
                    {TYPE_LABEL[ticket.type]} · angelegt {relTime(ticket.createdAt)}
                    {ticket.requester ? ` von ${ticket.requester.name || ticket.requester.email}` : ""}
                    {ticket.source !== "manual" ? ` · ${SOURCE_LABEL[ticket.source]}` : ""}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="shrink-0 rounded p-1 text-white/30 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Statuswechsel — nur zulässige Folgezustände */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: `${STATUS_COLOR[ticket.status]}1F`, color: STATUS_COLOR[ticket.status] }}
                >
                  {STATUS_LABEL[ticket.status]}
                </span>
                <span className="text-white/20">→</span>
                {allowedTransitions(ticket.status).map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => void transition(s)}
                    className="rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40"
                    style={{ borderColor: `${STATUS_COLOR[s]}44`, color: STATUS_COLOR[s] }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              {(ticket.archivedAt || ticket.deletedAt) && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-2.5 py-1.5">
                  <span className="text-[11px] text-amber-300">
                    {ticket.deletedAt ? "Im Papierkorb" : "Archiviert"}
                  </span>
                  <button
                    onClick={() => void lifecycle(ticket.deletedAt ? "restore" : "unarchive")}
                    className="text-[11px] font-medium text-amber-200 underline-offset-2 hover:underline"
                  >
                    Wiederherstellen
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-2.5 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-2.5 py-1.5 text-[11px] text-red-300">
                  {error}
                </p>
              )}
            </header>

            {/* Inhalt */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {/* Eigenschaften */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2">
                <Row label="Projekt">
                  <div className="flex items-center gap-2">
                    {ticket.projectColor && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: ticket.projectColor }}
                      />
                    )}
                    <select
                      value={ticket.projectId ?? ""}
                      disabled={busy}
                      onChange={(e) => void patch({ projectId: e.target.value || null })}
                      className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-white outline-none transition hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <option value="" className="bg-[#0B0B12]">Ohne Projekt</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0B0B12]">{p.name}</option>
                      ))}
                    </select>
                  </div>
                </Row>

                <Row label="Bearbeiter">
                  <select
                    value={ticket.assignee?.id ?? ""}
                    disabled={busy}
                    onChange={(e) => void patch({ assigneeId: e.target.value || null })}
                    className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-white outline-none transition hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <option value="" className="bg-[#0B0B12]">Nicht zugewiesen</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[#0B0B12]">{u.name || u.email}</option>
                    ))}
                  </select>
                </Row>

                <Row label="Priorität">
                  <select
                    value={ticket.priority}
                    disabled={busy}
                    onChange={(e) => void patch({ priority: e.target.value as TicketPriority })}
                    className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs outline-none transition hover:border-white/10 hover:bg-white/[0.04]"
                    style={{ color: PRIORITY_COLOR[ticket.priority] }}
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p} className="bg-[#0B0B12] text-white">{PRIORITY_LABEL[p]}</option>
                    ))}
                  </select>
                </Row>

                {ticket.severity && (
                  <Row label="Schweregrad">
                    <span className="px-1.5 text-xs text-white/70">
                      {SEVERITY_LABEL[ticket.severity as TicketSeverity]}
                    </span>
                  </Row>
                )}

                <Row label="Fällig">
                  <input
                    type="date"
                    disabled={busy}
                    value={ticket.dueAt ? ticket.dueAt.slice(0, 10) : ""}
                    onChange={(e) => void patch({ dueAt: e.target.value || null })}
                    className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-white outline-none transition hover:border-white/10 hover:bg-white/[0.04]"
                  />
                </Row>

                {ticket.orgName && (
                  <Row label="Organisation">
                    <span className="px-1.5 text-xs text-white/70">{ticket.orgName}</span>
                  </Row>
                )}

                {ticket.labels.length > 0 && (
                  <Row label="Schlagworte">
                    <div className="flex flex-wrap gap-1 px-1.5">
                      {ticket.labels.map((l) => (
                        <span key={l} className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                          {l}
                        </span>
                      ))}
                    </div>
                  </Row>
                )}
              </div>

              {/* Beschreibung */}
              <div className="mt-4">
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Beschreibung
                </h3>
                <DescriptionEditor
                  value={ticket.description}
                  busy={busy}
                  accent={accent}
                  onSave={(v) => patch({ description: v })}
                />
              </div>

              {/* Verknüpfungen */}
              {data.relations.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Verknüpfungen
                  </h3>
                  <div className="space-y-1">
                    {data.relations.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-xs"
                      >
                        <span className="text-white/35">
                          {r.outgoing ? RELATION_LABEL[r.relation] : `${RELATION_LABEL[r.relation]} (umgekehrt)`}
                        </span>
                        <span className="font-mono text-[10px] text-white/40">{r.ticket.key}</span>
                        <span className="min-w-0 flex-1 truncate text-white/70">{r.ticket.title}</span>
                        <span
                          className="shrink-0 text-[10px]"
                          style={{ color: STATUS_COLOR[r.ticket.status] }}
                        >
                          {STATUS_LABEL[r.ticket.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anhänge */}
              {data.attachments.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Anhänge
                  </h3>
                  <div className="space-y-1">
                    {data.attachments.map((a) => (
                      <a
                        key={a.id}
                        href={`/api/admin/tickets/attachments/${a.id}`}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-xs transition-colors hover:bg-white/[0.03]"
                      >
                        <span className="min-w-0 flex-1 truncate text-white/70">{a.filename}</span>
                        <span className="shrink-0 text-[10px] text-white/30">{bytes(a.byteSize)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Verlauf / Protokoll */}
              <div className="mt-5">
                <div className="mb-2 flex gap-3 border-b border-white/[0.07]">
                  {([
                    ["verlauf", `Verlauf (${data.comments.length})`],
                    ["protokoll", `Protokoll (${data.history.length})`],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className="-mb-px border-b-2 pb-1.5 text-[11px] font-medium transition-colors"
                      style={{
                        borderColor: tab === id ? accent : "transparent",
                        color: tab === id ? "#fff" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tab === "verlauf" ? (
                  data.comments.length === 0 ? (
                    <p className="py-4 text-center text-xs text-white/30">Noch keine Beiträge.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border px-3 py-2"
                          style={{
                            borderColor: c.isInternal ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.07)",
                            background: c.isInternal ? "rgba(251,191,36,0.04)" : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-white/75">
                              {c.author?.name || c.author?.email || "Unbekannt"}
                            </span>
                            {c.isInternal && (
                              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                                intern
                              </span>
                            )}
                            <span className="ml-auto text-[10px] text-white/25" title={fullTime(c.createdAt)}>
                              {relTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/70">{c.body}</p>
                        </div>
                      ))}
                    </div>
                  )
                ) : data.history.length === 0 ? (
                  <p className="py-4 text-center text-xs text-white/30">Keine Einträge.</p>
                ) : (
                  <div className="space-y-1">
                    {data.history.map((h) => (
                      <div key={h.id} className="flex gap-2.5 py-1 text-[11px]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                        <div className="min-w-0 flex-1">
                          <span className="text-white/60">{h.actorEmail}</span>{" "}
                          <span className="text-white/40">
                            {ACTION_TEXT[h.action] ?? h.action}
                          </span>
                          {h.after && Object.keys(h.after).length > 0 && (
                            <span className="text-white/30">
                              {" · "}
                              {Object.keys(h.after)
                                .map((f) => FIELD_LABEL[f] ?? f)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-white/20" title={fullTime(h.createdAt)}>
                          {relTime(h.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Beitrag verfassen */}
            <footer className="shrink-0 border-t border-white/[0.07] px-5 py-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  // Strg/Cmd + Enter sendet — Enter bleibt für Absätze frei.
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submitComment();
                }}
                rows={2}
                placeholder={internal ? "Interne Notiz…" : "Antwort an den Melder…"}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-white/25"
              />
              <div className="mt-2 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-white/45">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(e) => setInternal(e.target.checked)}
                    className="h-3 w-3"
                    style={{ accentColor: "#FBBF24" }}
                  />
                  Interne Notiz
                </label>

                <div className="ml-auto flex items-center gap-2">
                  {!ticket.deletedAt && (
                    <>
                      <button
                        onClick={() => void lifecycle(ticket.archivedAt ? "unarchive" : "archive")}
                        disabled={busy}
                        className="text-[11px] text-white/35 hover:text-white/70"
                      >
                        {ticket.archivedAt ? "Aus Archiv" : "Archivieren"}
                      </button>
                      <button
                        onClick={() => void remove()}
                        disabled={busy}
                        className="text-[11px] text-red-400/60 hover:text-red-400"
                      >
                        Löschen
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => void submitComment()}
                    disabled={busy || !comment.trim()}
                    className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
                    style={{ background: accent }}
                  >
                    Senden
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
      </motion.aside>
    </motion.div>
  );
}

/**
 * Beschreibung wird erst beim Klick zum Eingabefeld. Ein dauerhaft
 * geöffnetes Textfeld sieht nach unfertigem Formular aus.
 */
function DescriptionEditor({
  value,
  busy,
  accent,
  onSave,
}: {
  value: string;
  busy: boolean;
  accent: string;
  onSave: (v: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="cursor-text rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-xs leading-relaxed transition-colors hover:border-white/15"
      >
        {value ? (
          <p className="whitespace-pre-wrap text-white/70">{value}</p>
        ) : (
          <p className="text-white/25">Keine Beschreibung. Zum Hinzufügen klicken.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        autoFocus
        className="w-full resize-none rounded-lg border border-white/20 bg-white/[0.04] px-3 py-2.5 text-xs leading-relaxed text-white outline-none"
      />
      <div className="mt-1.5 flex justify-end gap-2">
        <button
          onClick={() => { setDraft(value); setEditing(false); }}
          className="text-[11px] text-white/40 hover:text-white/70"
        >
          Abbrechen
        </button>
        <button
          disabled={busy}
          onClick={async () => { await onSave(draft); setEditing(false); }}
          className="rounded px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
          style={{ background: accent }}
        >
          Speichern
        </button>
      </div>
    </div>
  );
}
