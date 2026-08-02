"use client";

/**
 * Ticket Control Center — Liste, Filter, Massenvorgänge, Detailansicht.
 *
 * Aufbau folgt dem bestehenden Admin-Design (Glaskarten, 1,6px-Linienicons,
 * Markenakzent als Inline-Farbe). Bewusst KEINE neue Designrichtung.
 *
 * Zum Laufzeitverhalten:
 *  - Es wird immer nur eine Seite geladen; weitere Seiten kommen über den
 *    Cursor nach. Bei 5.000 Tickets werden also nicht 5.000 Zeilen gerendert.
 *  - Filter greifen serverseitig. Clientseitiges Filtern würde bedeuten, dass
 *    die Seitengröße die Ergebnisse verfälscht.
 *  - Die Suche wird entprellt, sonst löst jeder Tastendruck eine Abfrage aus.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  TYPE_COLOR,
  TYPE_HINT,
  TYPE_LABEL,
  severityRequired,
  type TicketPriority,
  type TicketStatus,
  type TicketType,
} from "@/lib/tickets/model";
import type { Ticket } from "@/lib/tickets/ticketsStore";
import TicketDetail from "./TicketDetail";

interface AssignableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  open: number;
  unassigned: number;
  overdue: number;
  critical: number;
  resolvedLast7Days: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

const PAGE_SIZE = 50;

/* ── Bausteine ──────────────────────────────────────────────────────── */

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
      style={{
        borderColor: active ? (color ?? "rgba(255,255,255,0.35)") : "rgba(255,255,255,0.1)",
        background: active ? `${color ?? "#ffffff"}1A` : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.5)",
      }}
    >
      {children}
    </button>
  );
}

function relTime(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "gerade eben";
  if (sec < 3600) return `vor ${Math.floor(sec / 60)} Min`;
  if (sec < 86400) return `vor ${Math.floor(sec / 3600)} Std`;
  if (sec < 604800) return `vor ${Math.floor(sec / 86400)} T`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function initials(name: string, email: string): string {
  const src = name.trim() || email;
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/* ── Hauptkomponente ────────────────────────────────────────────────── */

export default function TicketControlCenter({ accent }: { accent: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AssignableUser[]>([]);

  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<TicketType[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [view, setView] = useState<"open" | "all" | "archived" | "trash">("open");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState(false);

  /* Suche entprellen — ohne das feuert jeder Tastendruck eine Abfrage. */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    statusFilter.forEach((s) => p.append("status", s));
    typeFilter.forEach((t) => p.append("type", t));
    priorityFilter.forEach((pr) => p.append("priority", pr));
    if (assigneeFilter) p.set("assignee", assigneeFilter);
    if (search) p.set("q", search);
    if (view === "open") p.set("open", "1");
    if (view === "archived") p.set("archived", "1");
    if (view === "trash") p.set("deleted", "1");
    p.set("limit", String(PAGE_SIZE));
    return p.toString();
  }, [statusFilter, typeFilter, priorityFilter, assigneeFilter, search, view]);

  /* Läuft eine neue Abfrage an, während eine alte noch unterwegs ist, darf
     die verspätete Antwort die neuere nicht überschreiben. */
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const token = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets?${query}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (token !== requestRef.current) return;
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
      setCursor(data.nextCursor ?? null);
      setSelected(new Set());
    } catch {
      if (token === requestRef.current) setError("Tickets konnten nicht geladen werden.");
    } finally {
      if (token === requestRef.current) setLoading(false);
    }
  }, [query]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tickets/stats");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats ?? null);
      setUsers(data.users ?? []);
    } catch {
      /* Kennzahlen sind nachrangig — die Liste funktioniert auch ohne. */
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadStats(); }, [loadStats]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/admin/tickets?${query}&cursor=${encodeURIComponent(cursor)}`);
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) => [...prev, ...(data.tickets ?? [])]);
        setCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadStats()]);
  }, [load, loadStats]);

  /* ── Massenvorgänge ───────────────────────────────────────────────── */

  const runBulk = async (payload: Record<string, unknown>) => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tickets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], ...payload }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.failed?.length) {
          setError(`${result.failed.length} von ${selected.size} Tickets konnten nicht geändert werden.`);
        }
        await refresh();
      } else {
        setError("Massenvorgang fehlgeschlagen.");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = tickets.length > 0 && selected.size === tickets.length;

  const toggleFilter = <T,>(list: T[], set: (v: T[]) => void, value: T) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const activeFilterCount =
    statusFilter.length + typeFilter.length + priorityFilter.length + (assigneeFilter ? 1 : 0);

  /* ── Darstellung ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        {[
          { label: "Offen", value: stats?.open ?? 0, color: accent },
          { label: "Nicht zugewiesen", value: stats?.unassigned ?? 0, color: "#FBBF24" },
          { label: "Überfällig", value: stats?.overdue ?? 0, color: "#EF4444" },
          { label: "Kritisch", value: stats?.critical ?? 0, color: "#EF4444" },
          { label: "Gelöst · 7 Tage", value: stats?.resolvedLast7Days ?? 0, color: "#22C55E" },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
              {k.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: k.value > 0 ? k.color : "rgba(255,255,255,0.35)" }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Ansicht, Suche, Anlegen */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-white/10 p-0.5">
          {([
            ["open", "Offen"],
            ["all", "Alle"],
            ["archived", "Archiv"],
            ["trash", "Papierkorb"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors"
              style={{
                background: view === id ? `${accent}22` : "transparent",
                color: view === id ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Volltextsuche über Titel, Beschreibung, Nummer…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-white/25 outline-none transition focus:border-white/25"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
            >
              ×
            </button>
          )}
        </div>

        <button
          onClick={() => setComposing(true)}
          className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: accent }}
        >
          Neues Ticket
        </button>
      </div>

      {/* Filter */}
      <div className="space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Art</span>
          {TICKET_TYPES.map((t) => (
            <Chip
              key={t}
              active={typeFilter.includes(t)}
              color={TYPE_COLOR[t]}
              onClick={() => toggleFilter(typeFilter, setTypeFilter, t)}
            >
              <Dot color={TYPE_COLOR[t]} />
              {TYPE_LABEL[t]}
              {stats?.byType[t] ? (
                <span className="tabular-nums text-white/40">{stats.byType[t]}</span>
              ) : null}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Status</span>
          {TICKET_STATUSES.map((s) => (
            <Chip
              key={s}
              active={statusFilter.includes(s)}
              color={STATUS_COLOR[s]}
              onClick={() => toggleFilter(statusFilter, setStatusFilter, s)}
            >
              <Dot color={STATUS_COLOR[s]} />
              {STATUS_LABEL[s]}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Priorität</span>
          {TICKET_PRIORITIES.map((p) => (
            <Chip
              key={p}
              active={priorityFilter.includes(p)}
              color={PRIORITY_COLOR[p]}
              onClick={() => toggleFilter(priorityFilter, setPriorityFilter, p)}
            >
              {PRIORITY_LABEL[p]}
            </Chip>
          ))}

          <span className="ml-2 mr-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Bearbeiter
          </span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white outline-none focus:border-white/25"
          >
            <option value="" className="bg-[#0B0B12]">Alle</option>
            <option value="me" className="bg-[#0B0B12]">Mir zugewiesen</option>
            <option value="unassigned" className="bg-[#0B0B12]">Nicht zugewiesen</option>
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-[#0B0B12]">
                {u.name || u.email}
              </option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter([]);
                setTypeFilter([]);
                setPriorityFilter([]);
                setAssigneeFilter("");
              }}
              className="ml-1 text-[11px] text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Filter zurücksetzen ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Massenaktionsleiste */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center gap-2 rounded-xl border p-3"
            style={{ borderColor: `${accent}44`, background: `${accent}0F` }}
          >
            <span className="text-xs font-semibold text-white">
              {selected.size} ausgewählt
            </span>

            <select
              disabled={busy}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) void runBulk({ operation: "status", status: e.target.value });
                e.target.value = "";
              }}
              className="rounded-lg border border-white/15 bg-white/[0.05] px-2 py-1.5 text-[11px] text-white outline-none"
            >
              <option value="" className="bg-[#0B0B12]">Status setzen…</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#0B0B12]">{STATUS_LABEL[s]}</option>
              ))}
            </select>

            <select
              disabled={busy}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  void runBulk({
                    operation: "assign",
                    assigneeId: e.target.value === "none" ? null : e.target.value,
                  });
                }
                e.target.value = "";
              }}
              className="rounded-lg border border-white/15 bg-white/[0.05] px-2 py-1.5 text-[11px] text-white outline-none"
            >
              <option value="" className="bg-[#0B0B12]">Zuweisen…</option>
              <option value="none" className="bg-[#0B0B12]">Zuweisung entfernen</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0B0B12]">{u.name || u.email}</option>
              ))}
            </select>

            <select
              disabled={busy}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) void runBulk({ operation: "priority", priority: e.target.value });
                e.target.value = "";
              }}
              className="rounded-lg border border-white/15 bg-white/[0.05] px-2 py-1.5 text-[11px] text-white outline-none"
            >
              <option value="" className="bg-[#0B0B12]">Priorität…</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-[#0B0B12]">{PRIORITY_LABEL[p]}</option>
              ))}
            </select>

            <button
              disabled={busy}
              onClick={() => void runBulk({ operation: "archive" })}
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/70 hover:text-white"
            >
              Archivieren
            </button>
            <button
              disabled={busy}
              onClick={() => void runBulk({ operation: "delete" })}
              className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-[11px] text-red-300 hover:bg-red-500/10"
            >
              Löschen
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-[11px] text-white/40 hover:text-white/70"
            >
              Auswahl aufheben
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07]">
        <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-3 py-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() =>
              setSelected(allSelected ? new Set() : new Set(tickets.map((t) => t.id)))
            }
            className="h-3.5 w-3.5 cursor-pointer accent-current"
            style={{ accentColor: accent }}
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            {loading ? "Lädt…" : `${tickets.length} von ${total} Tickets`}
          </span>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="space-y-px">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[58px] animate-pulse bg-white/[0.015]" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-white/50">
              {search || activeFilterCount > 0
                ? "Keine Tickets passen zu den Filtern."
                : view === "trash"
                  ? "Der Papierkorb ist leer."
                  : "Noch keine Tickets vorhanden."}
            </p>
            {!search && activeFilterCount === 0 && view === "open" && (
              <button
                onClick={() => setComposing(true)}
                className="mt-3 text-xs font-medium underline-offset-4 hover:underline"
                style={{ color: accent }}
              >
                Erstes Ticket anlegen
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {tickets.map((t) => (
              <TicketRow
                key={t.id}
                ticket={t}
                accent={accent}
                selected={selected.has(t.id)}
                onToggle={() => toggle(t.id)}
                onOpen={() => setOpenTicketId(t.id)}
              />
            ))}
          </div>
        )}

        {cursor && (
          <button
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="w-full border-t border-white/[0.07] bg-white/[0.015] py-2.5 text-xs text-white/50 transition-colors hover:bg-white/[0.03] hover:text-white/80"
          >
            {loadingMore ? "Lädt…" : `Weitere ${Math.min(PAGE_SIZE, total - tickets.length)} laden`}
          </button>
        )}
      </div>

      <AnimatePresence>
        {openTicketId && (
          <TicketDetail
            ticketId={openTicketId}
            accent={accent}
            users={users}
            onClose={() => setOpenTicketId(null)}
            onChanged={refresh}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {composing && (
          <TicketComposer
            accent={accent}
            users={users}
            onClose={() => setComposing(false)}
            onCreated={async (id) => {
              setComposing(false);
              await refresh();
              setOpenTicketId(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Zeile ──────────────────────────────────────────────────────────── */

function TicketRow({
  ticket,
  accent,
  selected,
  onToggle,
  onOpen,
}: {
  ticket: Ticket;
  accent: string;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const overdue =
    ticket.dueAt &&
    new Date(ticket.dueAt).getTime() < Date.now() &&
    !["resolved", "closed", "cancelled"].includes(ticket.status);

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.025]"
      style={selected ? { background: `${accent}0D` } : undefined}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer"
        style={{ accentColor: accent }}
      />

      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className="shrink-0 font-mono text-[10px] tabular-nums"
          style={{ color: TYPE_COLOR[ticket.type] }}
          title={TYPE_LABEL[ticket.type]}
        >
          {ticket.key}
        </span>

        <span className="min-w-0 flex-1 truncate text-[13px] text-white/85 group-hover:text-white">
          {ticket.title}
        </span>

        {ticket.labels.slice(0, 2).map((l) => (
          <span
            key={l}
            className="hidden shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40 lg:inline"
          >
            {l}
          </span>
        ))}

        {ticket.commentCount > 0 && (
          <span className="hidden shrink-0 items-center gap-1 text-[10px] text-white/30 sm:flex">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {ticket.commentCount}
          </span>
        )}

        {overdue && (
          <span className="shrink-0 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300">
            überfällig
          </span>
        )}

        <span
          className="hidden shrink-0 items-center gap-1.5 text-[11px] sm:flex"
          style={{ color: PRIORITY_COLOR[ticket.priority] }}
        >
          {PRIORITY_LABEL[ticket.priority]}
        </span>

        <span
          className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: `${STATUS_COLOR[ticket.status]}1A`,
            color: STATUS_COLOR[ticket.status],
          }}
        >
          {STATUS_LABEL[ticket.status]}
        </span>

        <span className="hidden w-14 shrink-0 text-right text-[10px] text-white/30 lg:block">
          {relTime(ticket.updatedAt)}
        </span>

        {ticket.assignee ? (
          <span
            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white sm:flex"
            style={{ background: `${accent}33`, border: `1px solid ${accent}55` }}
            title={ticket.assignee.name || ticket.assignee.email}
          >
            {initials(ticket.assignee.name, ticket.assignee.email)}
          </span>
        ) : (
          <span
            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-white/15 text-[9px] text-white/25 sm:flex"
            title="Nicht zugewiesen"
          >
            —
          </span>
        )}
      </button>
    </div>
  );
}

/* ── Anlegen ────────────────────────────────────────────────────────── */

function TicketComposer({
  accent,
  users,
  onClose,
  onCreated,
}: {
  accent: string;
  users: AssignableUser[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [type, setType] = useState<TicketType>("support");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [severity, setSeverity] = useState("sev3");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) {
      setError("Bitte einen Titel angeben.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          priority,
          severity: severityRequired(type) ? severity : null,
          assigneeId: assigneeId || null,
          dueAt: dueAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "title_required" ? "Bitte einen Titel angeben." : "Anlegen fehlgeschlagen.");
        return;
      }
      const data = await res.json();
      onCreated(data.ticket.id);
    } catch {
      setError("Anlegen fehlgeschlagen.");
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
        className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0B0B12] p-5 shadow-2xl"
      >
        <h3 className="text-sm font-semibold text-white">Neues Ticket</h3>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Art</label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {TICKET_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors"
                  style={{
                    borderColor: type === t ? TYPE_COLOR[t] : "rgba(255,255,255,0.1)",
                    background: type === t ? `${TYPE_COLOR[t]}1A` : "transparent",
                    color: type === t ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">{TYPE_HINT[type]}</p>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Kurz und konkret, z. B. „Rechnungslauf bricht bei Sammelrechnungen ab“"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Was ist passiert, was wurde erwartet, wie lässt es sich nachstellen?"
              className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Priorität</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-[#0B0B12]">{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </div>

            {severityRequired(type) ? (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  Schweregrad
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                >
                  <option value="sev1" className="bg-[#0B0B12]">SEV1 · Totalausfall</option>
                  <option value="sev2" className="bg-[#0B0B12]">SEV2 · Stark eingeschränkt</option>
                  <option value="sev3" className="bg-[#0B0B12]">SEV3 · Teilweise betroffen</option>
                  <option value="sev4" className="bg-[#0B0B12]">SEV4 · Geringfügig</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Fällig bis</label>
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Bearbeiter</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            >
              <option value="" className="bg-[#0B0B12]">Noch offen lassen</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0B0B12]">{u.name || u.email}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3.5 py-2 text-xs text-white/60 hover:text-white"
          >
            Abbrechen
          </button>
          <button
            onClick={() => void submit()}
            disabled={saving}
            className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: accent }}
          >
            {saving ? "Wird angelegt…" : "Ticket anlegen"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
