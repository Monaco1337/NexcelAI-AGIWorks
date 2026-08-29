"use client";

/**
 * Vertriebs-Kontrollzentrum.
 *
 * Rahmen für alle Vertriebs-Sichten. Segmented Control oben schaltet
 * zwischen:
 *   - Übersicht (Dashboard: Heute / Überfällig / Pipeline / Commercial)
 *   - Pipeline (Tabelle + Kanban)
 *   - Zielkunden (Companies-Liste mit A/B/C/D-Filter)
 *   - Playbooks (ICP, Skript, Discovery, Story)
 *   - Prompts & Runs (AI-Governance)
 *
 * Ein Klick auf eine Firma öffnet ihre Detailansicht mit Kontakten,
 * Aktivitäten, Opportunities, Solution, Angeboten und AI-Panels.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import SalesDashboard from "./SalesDashboard";
import SalesPipeline from "./SalesPipeline";
import CompanyList from "./CompanyList";
import CompanyDetail from "./CompanyDetail";
import PlaybookRegistry from "./PlaybookRegistry";
import PromptRegistry from "./PromptRegistry";
import NewCompanyModal from "./NewCompanyModal";
import TargetsCenter from "./targets/TargetsCenter";
import type { DashboardResponse } from "./shared";
import { buttonPrimary, buttonSecondary } from "./HelperUI";

type View = "dashboard" | "pipeline" | "targets" | "companies" | "playbooks" | "prompts";

const VIEWS: { id: View; label: string }[] = [
  { id: "dashboard", label: "Übersicht" },
  { id: "pipeline", label: "Pipeline" },
  { id: "targets", label: "Zielkunden" },
  { id: "companies", label: "Firmen (CRM)" },
  { id: "playbooks", label: "Playbooks" },
  { id: "prompts", label: "Prompts & Runs" },
];

export default function SalesCenter({ accent }: { accent: string }) {
  const [view, setView] = useState<View>("dashboard");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sales/dashboard", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as DashboardResponse;
        setDashboard(data);
      }
    } catch {
      /* still leise, wird erneut geladen */
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const t = window.setInterval(() => void loadDashboard(), 60_000);
    return () => window.clearInterval(t);
  }, [loadDashboard, refreshKey]);

  const bumpRefresh = useCallback(() => setRefreshKey((n) => n + 1), []);

  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-2">
        {selectedCompanyId && (
          <button
            type="button"
            onClick={() => {
              setSelectedCompanyId(null);
              setSelectedOpportunityId(null);
            }}
            className={buttonSecondary}
          >
            ← Zurück
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowNewCompany(true)}
          className={buttonPrimary}
          style={{ backgroundColor: accent }}
        >
          + Neue Firma
        </button>
      </div>
    ),
    [accent, selectedCompanyId]
  );

  const openCompany = useCallback((companyId: string, opportunityId?: string) => {
    setSelectedCompanyId(companyId);
    setSelectedOpportunityId(opportunityId ?? null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setView(v.id);
                setSelectedCompanyId(null);
                setSelectedOpportunityId(null);
              }}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                view === v.id && !selectedCompanyId
                  ? "bg-white/[0.08] text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {headerRight}
      </div>

      {selectedCompanyId ? (
        <CompanyDetail
          key={`${selectedCompanyId}::${refreshKey}`}
          companyId={selectedCompanyId}
          initialOpportunityId={selectedOpportunityId}
          accent={accent}
          onClose={() => {
            setSelectedCompanyId(null);
            setSelectedOpportunityId(null);
            bumpRefresh();
          }}
          onChanged={bumpRefresh}
        />
      ) : view === "dashboard" ? (
        <SalesDashboard
          dashboard={dashboard}
          accent={accent}
          onOpenCompany={(id) => openCompany(id)}
          onViewPipeline={() => setView("pipeline")}
        />
      ) : view === "pipeline" ? (
        <SalesPipeline
          accent={accent}
          onOpenCompany={openCompany}
          refreshKey={refreshKey}
        />
      ) : view === "targets" ? (
        <TargetsCenter accent={accent} />
      ) : view === "companies" ? (
        <CompanyList accent={accent} onOpenCompany={openCompany} refreshKey={refreshKey} />
      ) : view === "playbooks" ? (
        <PlaybookRegistry accent={accent} />
      ) : (
        <PromptRegistry accent={accent} />
      )}

      {showNewCompany && (
        <NewCompanyModal
          accent={accent}
          onCancel={() => setShowNewCompany(false)}
          onCreated={(companyId) => {
            setShowNewCompany(false);
            openCompany(companyId);
            bumpRefresh();
          }}
        />
      )}
    </div>
  );
}
