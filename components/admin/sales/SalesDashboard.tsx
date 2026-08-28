"use client";

/**
 * Vertriebs-Dashboard.
 *
 * Vier zentrale Frage-Blöcke:
 *  1. Was ist heute zu tun?
 *  2. Was ist überfällig?
 *  3. Wie sieht die Pipeline aus?
 *  4. Wo stehen wir kommerziell?
 */

import { NEXT_ACTION_LABEL, formatDateTimeDe, formatEuroFromCents, SALES_STATUS_LABEL, SALES_STATUS_COLOR, BRAND_CONTEXT_LABEL } from "./shared";
import type { DashboardResponse } from "./shared";
import { EmptyState, Section, Pill } from "./HelperUI";

export default function SalesDashboard({
  dashboard,
  accent,
  onOpenCompany,
  onViewPipeline,
}: {
  dashboard: DashboardResponse | null;
  accent: string;
  onOpenCompany: (id: string) => void;
  onViewPipeline: () => void;
}) {
  if (!dashboard) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-white/50">
        Vertriebs-Übersicht wird geladen…
      </div>
    );
  }
  const totalPipeline = dashboard.pipelineByStatus.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Firmen" value={dashboard.counts.companies} accent={accent} />
        <Kpi label="Heute fällig" value={dashboard.counts.dueToday} accent="#F59E0B" />
        <Kpi label="Überfällig" value={dashboard.counts.overdue} accent="#EF4444" />
        <Kpi label="AI-Freigaben offen" value={dashboard.counts.aiReviewRequired} accent="#A78BFA" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Heute zu tun">
          {dashboard.today.length === 0 ? (
            <EmptyState title="Nichts fällig." hint="Perfekt — jetzt Zeit für Akquise oder Bedarfsgespräche." />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {dashboard.today.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => onOpenCompany(it.id)}
                    className="truncate text-left text-sm font-medium text-white/90 hover:text-white"
                  >
                    {it.name}
                  </button>
                  <div className="flex items-center gap-3 text-[11px] text-white/50">
                    <span>{it.nextAction ? NEXT_ACTION_LABEL[it.nextAction] : "Aktion offen"}</span>
                    <span>{formatDateTimeDe(it.dueAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Überfällig">
          {dashboard.overdueList.length === 0 ? (
            <EmptyState title="Nichts überfällig." hint="Sauber. Weiter so." />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {dashboard.overdueList.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => onOpenCompany(it.id)}
                    className="truncate text-left text-sm font-medium text-white/90 hover:text-white"
                  >
                    {it.name}
                  </button>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-white/50">
                      {it.nextAction ? NEXT_ACTION_LABEL[it.nextAction] : "Aktion offen"}
                    </span>
                    <Pill color="#EF4444">{formatDateTimeDe(it.dueAt)}</Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section
        title={`Pipeline (${totalPipeline})`}
        actions={
          <button
            type="button"
            onClick={onViewPipeline}
            className="text-xs text-white/60 hover:text-white"
          >
            Zur Pipeline →
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {dashboard.pipelineByStatus.length === 0 ? (
            <div className="col-span-full text-sm text-white/50">Noch keine Opportunities.</div>
          ) : (
            dashboard.pipelineByStatus.map((r) => (
              <div key={r.status} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="text-[11px] uppercase tracking-wider text-white/45" style={{ color: SALES_STATUS_COLOR[r.status] }}>
                  {SALES_STATUS_LABEL[r.status]}
                </div>
                <div className="mt-1 text-lg font-semibold text-white">{r.count}</div>
              </div>
            ))
          )}
        </div>
        {dashboard.pipelineByBrand.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {dashboard.pipelineByBrand.map((b) => (
              <Pill key={b.brand} color={b.brand === "agiworks" ? "#F0FDF4" : b.brand === "both" ? "#A78BFA" : "#0091C2"}>
                {BRAND_CONTEXT_LABEL[b.brand]}: {b.count}
              </Pill>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Kommerziell">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Erwarteter Wert (offen)" value={formatEuroFromCents(dashboard.commercial.expectedCents)} />
            <Metric label="Angebotswert (offen)" value={formatEuroFromCents(dashboard.commercial.proposalCents)} />
            <Metric label="Gewonnen" value={String(dashboard.commercial.won)} />
            <Metric label="Verloren" value={String(dashboard.commercial.lost)} />
            <Metric label="Zurückgestellt" value={String(dashboard.commercial.deferred)} />
          </div>
        </Section>

        <Section title="Aging (offene Opportunities)">
          <div className="grid grid-cols-4 gap-2 text-sm">
            {[
              { key: "week", label: "≤ 7 Tage" },
              { key: "month", label: "≤ 30 Tage" },
              { key: "quarter", label: "≤ 90 Tage" },
              { key: "older", label: "> 90 Tage" },
            ].map((b) => {
              const val = dashboard.aging.find((a) => a.bucket === b.key)?.count ?? 0;
              return (
                <div key={b.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center">
                  <div className="text-[11px] text-white/45">{b.label}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{val}</div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <Section title="Angebots-Follow-ups">
        {dashboard.followups.length === 0 ? (
          <EmptyState title="Kein offenes Follow-up." />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {dashboard.followups.map((fu) => (
              <li key={fu.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="truncate text-white/80">
                  Angebot {fu.proposalId.slice(-6).toUpperCase()} · {fu.stage.toUpperCase()}
                </div>
                <div className="text-[11px] text-white/50">{formatDateTimeDe(fu.dueAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: accent }}>
        {value.toLocaleString("de-DE")}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="text-[11px] text-white/45">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}
