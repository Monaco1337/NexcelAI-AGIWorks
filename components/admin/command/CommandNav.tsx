"use client";
import { useEffect, useState } from "react";

type LinkItem = { id: string; label: string };
type Group = { key: string; label: string; glyph: string; links: LinkItem[] };
const GROUPS: Group[] = [
  { key: "dashboard", label: "Dashboard", glyph: "01", links: [{ id: "overview", label: "Arbeits\u00fcbersicht" }] },
  { key: "sales", label: "Kunden & Sales", glyph: "02", links: [
    { id: "vertrieb", label: "Sales Workspace" }, { id: "contacts", label: "Leads & Kontakte" },
    { id: "unternehmen", label: "Unternehmen" }, { id: "pipeline", label: "Pipeline-Details" },
    { id: "demo", label: "Demo-Anfragen" },
  ] },
  { key: "projects", label: "Projekte & Termine", glyph: "03", links: [
    { id: "projekte", label: "Projekt\u00fcbersicht" }, { id: "termine", label: "Termine & Buchungen" },
  ] },
  { key: "team", label: "Tickets & Team", glyph: "04", links: [{ id: "tickets", label: "Ticket Control Center" }] },
  { key: "finance", label: "Finanzen", glyph: "05", links: [
    { id: "rechnungen", label: "Rechnungen" }, { id: "kalkulation", label: "Interne Kalkulation" },
  ] },
  { key: "website", label: "Website bearbeiten", glyph: "06", links: [
    { id: "referenzen", label: "Referenzen" }, { id: "systeme", label: "Systemkarten" },
    { id: "logos", label: "Logos & Slider" },
  ] },
  { key: "automation", label: "Automationen", glyph: "07", links: [{ id: "automationen", label: "Workflows (Ausbau)" }] },
  { key: "settings", label: "Einstellungen & Berichte", glyph: "08", links: [
    { id: "settings", label: "Einstellungen" }, { id: "analysen", label: "Analysen" },
    { id: "analytics", label: "Web Analytics" },
  ] },
];

export default function CommandNav({ activeTab, onNavigate, accent, badges = {} }: {
  activeTab: string;
  onNavigate: (id: string) => void;
  accent: string;
  badges?: Record<string, number>;
}) {
  const groupFor = (tab: string) => GROUPS.find(g => g.links.some(l => l.id === tab))?.key ?? "dashboard";
  const [open, setOpen] = useState(groupFor(activeTab));
  useEffect(() => { setOpen(groupFor(activeTab)); }, [activeTab]);
  return (
    <nav aria-label="Command Center Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {GROUPS.map(group => {
        const opened = open === group.key;
        const current = group.links.some(link => link.id === activeTab);
        const direct = group.links.length === 1;
        return (
          <div key={group.key} className="mb-1">
            <button
              type="button"
              aria-expanded={direct ? undefined : opened}
              aria-controls={direct ? undefined : `cc-nav-${group.key}`}
              onClick={() => direct ? onNavigate(group.links[0].id) : setOpen(opened ? "" : group.key)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-white/[0.055]"
              style={{ background: current ? `${accent}18` : "transparent",
                color: current ? "#F7F4FF" : "#B4AEC5",
                border: `1px solid ${current ? `${accent}55` : "transparent"}` }}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px]"
                style={{ color: current ? accent : "#8F8A9D", background: "rgba(255,255,255,.045)" }}>
                {group.glyph}
              </span>
              <span className="flex-1 min-w-0">{group.label}</span>
              {!direct && <span className="text-xs opacity-60" aria-hidden="true">{opened ? "\u2212" : "+"}</span>}
            </button>
            {!direct && opened && (
              <div id={`cc-nav-${group.key}`} className="ml-4 pl-3 py-1 border-l space-y-0.5"
                style={{ borderColor: `${accent}33` }}>
                {group.links.map(link => (
                  <button key={link.id} type="button" onClick={() => onNavigate(link.id)}
                    aria-current={activeTab === link.id ? "page" : undefined}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors hover:bg-white/[0.05]"
                    style={{ background: activeTab === link.id ? `${accent}20` : "transparent",
                      color: activeTab === link.id ? "#FFFFFF" : "#9F9BAD" }}>
                    <span className="flex-1">{link.label}</span>
                    {(badges[link.id] ?? 0) > 0 && <span className="text-[10px] rounded-full px-1.5 py-0.5"
                      style={{ background: `${accent}20`, color: accent }}>{badges[link.id]}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
