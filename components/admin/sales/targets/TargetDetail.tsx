"use client";

/**
 * Zielkunden-Detailansicht (Overlay).
 * Tabs: Übersicht · Kontakte · Entscheider · Website · Software · Finanzen · Quellen · Aktivitäten
 */

import { useCallback, useEffect, useState } from "react";
import { EmptyState, Section, buttonPrimary, buttonSecondary } from "../HelperUI";
import type {
  FinancialSignal,
  LeadScore,
  SalesBrief,
  TargetActivity,
  TargetCompany,
  TargetContact,
  TargetDecisionMaker,
  TargetOpportunity,
  TargetSource,
  WebsiteAudit,
} from "@/lib/sales/targets/model";
import {
  CONTACT_KIND_LABEL,
  FINANCIAL_CAPACITY_COLOR,
  FINANCIAL_CAPACITY_LABEL,
  FINANCIAL_SIGNAL_LABEL,
  PRIORITY_CLASS_COLOR,
  PRIORITY_CLASS_LABEL,
  VERIFICATION_COLOR,
  VERIFICATION_LABEL,
  classifyConfidence,
  opportunityKindLabel,
  PHONE_TYPE_LABEL,
  EMAIL_TYPE_LABEL,
} from "@/lib/sales/targets/model";

interface DetailResponse {
  target: TargetCompany;
  contacts: TargetContact[];
  decisionMakers: TargetDecisionMaker[];
  opportunities: TargetOpportunity[];
  sources: TargetSource[];
  latestAudit: WebsiteAudit | null;
  financialSignals: FinancialSignal[];
  leadScore: LeadScore | null;
  salesBrief: SalesBrief | null;
  activities: TargetActivity[];
}

const TABS = [
  { key: "overview", label: "Übersicht" },
  { key: "contacts", label: "Kontakte" },
  { key: "dm", label: "Entscheider" },
  { key: "website", label: "Website" },
  { key: "software", label: "Software" },
  { key: "finance", label: "Finanzen" },
  { key: "sources", label: "Quellen" },
  { key: "activities", label: "Aktivitäten" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function TargetDetail({
  targetId,
  accent,
  onClose,
  onChanged,
}: {
  targetId: string;
  accent: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");
  const [reanalyzing, setReanalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sales/targets/${targetId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DetailResponse;
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function reanalyze() {
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/admin/sales/targets/${targetId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await load();
        onChanged();
      }
    } finally {
      setReanalyzing(false);
    }
  }

  async function convert() {
    if (!confirm("Diesen Zielkunden in die CRM-Firmenliste übernehmen?")) return;
    setConverting(true);
    try {
      await fetch(`/api/admin/sales/targets/${targetId}/convert`, { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
      await load();
      onChanged();
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/70" onClick={onClose}>
      <div
        className="h-full w-full max-w-5xl overflow-y-auto border-l border-white/[0.06] bg-[#0B0B0F] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !data ? (
          <div className="flex h-full items-center justify-center text-white/60">Lädt…</div>
        ) : (
          <>
            <Header
              data={data}
              accent={accent}
              onClose={onClose}
              onReanalyze={reanalyze}
              onConvert={convert}
              reanalyzing={reanalyzing}
              converting={converting}
            />
            <div className="mt-4 flex flex-wrap items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-1">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs transition ${
                      active ? "bg-white/10 text-white" : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-4">
              {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
              {tab === "overview" && <OverviewTab data={data} accent={accent} />}
              {tab === "contacts" && <ContactsTab contacts={data.contacts} />}
              {tab === "dm" && <DecisionMakersTab items={data.decisionMakers} />}
              {tab === "website" && <WebsiteTab audit={data.latestAudit} target={data.target} />}
              {tab === "software" && <SoftwareTab opportunities={data.opportunities} />}
              {tab === "finance" && <FinanceTab score={data.leadScore} signals={data.financialSignals} />}
              {tab === "sources" && <SourcesTab sources={data.sources} />}
              {tab === "activities" && <ActivitiesTab activities={data.activities} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({
  data,
  accent,
  onClose,
  onReanalyze,
  onConvert,
  reanalyzing,
  converting,
}: {
  data: DetailResponse;
  accent: string;
  onClose: () => void;
  onReanalyze: () => void;
  onConvert: () => void;
  reanalyzing: boolean;
  converting: boolean;
}) {
  const { target, leadScore, salesBrief } = data;
  const priority = leadScore?.priorityClass ?? "D";
  const priorityColor = PRIORITY_CLASS_COLOR[priority];
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold"
            style={{
              color: priorityColor,
              borderColor: `${priorityColor}66`,
              background: `${priorityColor}18`,
            }}
            title={PRIORITY_CLASS_LABEL[priority]}
          >
            {priority}
          </span>
          <h2 className="truncate text-2xl font-semibold text-white">{target.name}</h2>
        </div>
        <div className="mt-1 text-sm text-white/60">
          {[target.industry, target.city, target.distanceKm ? `${target.distanceKm.toFixed(1)} km entfernt` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {salesBrief && (
          <div className="mt-3 max-w-3xl rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Sales Brief</div>
            <div className="mt-1 text-sm font-medium text-white">{salesBrief.headline}</div>
            {salesBrief.recommendedEntry && (
              <div className="mt-2 text-sm text-white/70">{salesBrief.recommendedEntry}</div>
            )}
            {salesBrief.recommendedAction && (
              <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                  Nächster Schritt: {salesBrief.recommendedAction}
                </span>
                {salesBrief.recommendedTime && (
                  <span className="text-white/50">· {salesBrief.recommendedTime}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Lead-Score</div>
          <div className="text-4xl font-semibold" style={{ color: accent }}>
            {leadScore?.totalScore ?? "—"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className={buttonSecondary} onClick={onReanalyze} disabled={reanalyzing}>
            {reanalyzing ? "Analysiert…" : "Analyse erneut ausführen"}
          </button>
          <button
            className={buttonPrimary}
            style={{ backgroundColor: accent, color: "#000" }}
            onClick={onConvert}
            disabled={converting || Boolean(target.linkedSalesCompanyId)}
          >
            {target.linkedSalesCompanyId ? "Im CRM" : converting ? "Übernehme…" : "In CRM übernehmen"}
          </button>
          <button className="text-xs text-white/50 hover:text-white/80" onClick={onClose}>
            Schließen (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Übersicht                                                             */
/* -------------------------------------------------------------------------- */

function OverviewTab({ data, accent }: { data: DetailResponse; accent: string }) {
  const { target, leadScore, salesBrief } = data;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Section title="Kernfakten">
        <dl className="space-y-2 text-sm">
          <Fact label="Firma" value={target.name} />
          <Fact label="Rechtsform" value={target.legalForm} />
          <Fact label="Branche" value={target.industry} />
          <Fact label="Adresse" value={target.addressLine} />
          <Fact label="Stadt" value={[target.postalCode, target.city].filter(Boolean).join(" ")} />
          <Fact label="Website" value={target.website} link />
          <Fact label="Telefon" value={target.phone} />
          <Fact label="E-Mail" value={target.email} />
          <Fact label="Mitarbeiter (max)" value={target.employeeEstimateMax ? String(target.employeeEstimateMax) : null} />
          <Fact label="Google-Rating" value={target.googleRating ? `${target.googleRating.toFixed(1)} (${target.reviewCount ?? 0} Bewertungen)` : null} />
        </dl>
      </Section>
      <Section title="Sales Brief">
        {salesBrief ? (
          <div className="space-y-3 text-sm">
            {salesBrief.businessSummary && (
              <BriefBlock label="Geschäft">{salesBrief.businessSummary}</BriefBlock>
            )}
            {salesBrief.mainOpportunity && (
              <BriefBlock label="Hauptopportunity">{salesBrief.mainOpportunity}</BriefBlock>
            )}
            {salesBrief.opportunityReason && (
              <BriefBlock label="Warum">{salesBrief.opportunityReason}</BriefBlock>
            )}
            {salesBrief.recommendedEntry && (
              <BriefBlock label="Empfohlener Einstieg">{salesBrief.recommendedEntry}</BriefBlock>
            )}
            {salesBrief.salesAngle && <BriefBlock label="Sales Angle">{salesBrief.salesAngle}</BriefBlock>}
            {salesBrief.whyNow && <BriefBlock label="Warum jetzt">{salesBrief.whyNow}</BriefBlock>}
            {salesBrief.projectValueMinCents !== null && salesBrief.projectValueMaxCents !== null && (
              <BriefBlock label="Projektpotenzial">
                {eur(salesBrief.projectValueMinCents)} – {eur(salesBrief.projectValueMaxCents)}
              </BriefBlock>
            )}
            <div className="text-xs text-white/50">
              Confidence {(salesBrief.confidence * 100).toFixed(0)} %
              {salesBrief.capacityClass && (
                <>
                  {" "}· Commercial Capacity{" "}
                  <span style={{ color: FINANCIAL_CAPACITY_COLOR[salesBrief.capacityClass] }}>
                    {FINANCIAL_CAPACITY_LABEL[salesBrief.capacityClass]}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <EmptyState title="Noch kein Sales Brief" hint="Führe eine Analyse aus, um automatisch einen Brief zu erzeugen." />
        )}
      </Section>
      <Section title="Score-Begründung" actions={<span className="text-xs text-white/40">{leadScore ? `Priorität ${leadScore.priorityClass}` : ""}</span>}>
        {leadScore && leadScore.breakdown.length > 0 ? (
          <div className="space-y-2 text-sm">
            {leadScore.breakdown.map((entry) => (
              <div key={entry.key} className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div>
                  <div className="text-sm text-white">{entry.label}</div>
                  {entry.reason && <div className="text-xs text-white/50">{entry.reason}</div>}
                </div>
                <div
                  className="shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold"
                  style={{
                    color: entry.points >= 0 ? accent : "#F87171",
                    borderColor: entry.points >= 0 ? `${accent}55` : "#F8717155",
                    background: entry.points >= 0 ? `${accent}12` : "#F871711A",
                  }}
                >
                  {entry.points >= 0 ? "+" : ""}
                  {Math.round(entry.points)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Noch kein Score" hint="Analyse ausführen, um einen Score zu erzeugen." />
        )}
      </Section>
      <Section title="Sub-Scores">
        {leadScore ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ScoreLine label="Need" value={leadScore.needScore} />
            <ScoreLine label="Website" value={leadScore.websiteScore} />
            <ScoreLine label="Reachability" value={leadScore.reachabilityScore} />
            <ScoreLine label="Entscheider" value={leadScore.decisionMakerScore} />
            <ScoreLine label="Commercial Cap." value={leadScore.commercialCapacityScore} />
            <ScoreLine label="Opportunity" value={leadScore.opportunityScore} />
            <ScoreLine label="Software-Opp." value={leadScore.softwareOpportunityScore} />
            <ScoreLine label="Data Conf." value={leadScore.dataConfidenceScore} />
          </div>
        ) : (
          <EmptyState title="Keine Scores" hint="Analyse ausführen." />
        )}
      </Section>
    </div>
  );
}

function Fact({ label, value, link }: { label: string; value: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[130px_1fr] items-baseline gap-2">
      <dt className="text-[11px] uppercase tracking-wider text-white/45">{label}</dt>
      <dd className="truncate text-sm text-white/85">
        {link ? (
          <a href={value} target="_blank" rel="noreferrer" className="hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function BriefBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className="text-sm text-white/85">{children}</div>
    </div>
  );
}

function ScoreLine({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-sm font-semibold text-white">{value ?? "—"}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Kontakte                                                              */
/* -------------------------------------------------------------------------- */

function ContactsTab({ contacts }: { contacts: TargetContact[] }) {
  if (contacts.length === 0) {
    return <EmptyState title="Keine Kontakte gefunden" hint="Analyse erneut ausführen, sobald eine Website hinterlegt ist." />;
  }
  return (
    <Section title={`Kontakte (${contacts.length})`}>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {contacts.map((c) => {
          const status = c.verificationStatus === "unverified" ? classifyConfidence(c.confidence) : c.verificationStatus;
          return (
            <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider text-white/45">{CONTACT_KIND_LABEL[c.kind]}</span>
                <span
                  className="rounded-md border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    color: VERIFICATION_COLOR[status],
                    borderColor: `${VERIFICATION_COLOR[status]}66`,
                    background: `${VERIFICATION_COLOR[status]}12`,
                  }}
                >
                  {VERIFICATION_LABEL[status]}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-medium text-white">{c.value}</div>
              <div className="text-xs text-white/50">
                Confidence {(c.confidence * 100).toFixed(0)} %
                {c.classification && ` · ${classificationLabel(c.classification)}`}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function classificationLabel(kind: TargetContact["classification"]): string {
  if (!kind) return "";
  if (kind in PHONE_TYPE_LABEL) return PHONE_TYPE_LABEL[kind as keyof typeof PHONE_TYPE_LABEL];
  if (kind in EMAIL_TYPE_LABEL) return EMAIL_TYPE_LABEL[kind as keyof typeof EMAIL_TYPE_LABEL];
  return String(kind);
}

/* -------------------------------------------------------------------------- */
/*  Tab: Entscheider                                                           */
/* -------------------------------------------------------------------------- */

function DecisionMakersTab({ items }: { items: TargetDecisionMaker[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Kein Entscheider ermittelt"
        hint="Für die automatische Entscheidersuche muss ein LinkedIn- oder Registry-Provider konfiguriert sein. Manuell anlegen ist ebenfalls möglich."
      />
    );
  }
  return (
    <Section title={`Entscheider (${items.length})`}>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((dm) => (
          <div key={dm.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="text-sm font-medium text-white">{dm.name}</div>
            <div className="text-xs text-white/60">{dm.role ?? "Rolle unbekannt"}</div>
            <div className="mt-2 space-y-1 text-xs text-white/70">
              {dm.businessEmail && <div>E-Mail: {dm.businessEmail}</div>}
              {dm.businessPhone && <div>Telefon: {dm.businessPhone}</div>}
              {dm.businessMobile && <div>Mobil: {dm.businessMobile}</div>}
              {dm.linkedinUrl && (
                <a href={dm.linkedinUrl} target="_blank" rel="noreferrer" className="underline">
                  LinkedIn
                </a>
              )}
            </div>
            <div className="mt-2 text-[11px] text-white/40">Confidence {(dm.confidence * 100).toFixed(0)} %</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Website                                                               */
/* -------------------------------------------------------------------------- */

function WebsiteTab({ audit, target }: { audit: WebsiteAudit | null; target: TargetCompany }) {
  if (!audit) {
    return (
      <EmptyState
        title="Kein Website-Audit vorhanden"
        hint={target.website ? "Analyse erneut ausführen, um einen Audit zu erzeugen." : "Für einen Audit muss eine Website hinterlegt sein."}
      />
    );
  }
  return (
    <div className="space-y-4">
      <Section title={`Website-Score ${audit.websiteScore ?? "—"}/100`}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <ScoreLine label="Performance" value={audit.performanceScore} />
          <ScoreLine label="Mobile" value={audit.mobileScore} />
          <ScoreLine label="Design" value={audit.designScore} />
          <ScoreLine label="Conversion" value={audit.conversionScore} />
          <ScoreLine label="SEO" value={audit.seoScore} />
          <ScoreLine label="Trust" value={audit.trustScore} />
          <ScoreLine label="Technology" value={audit.technologyScore} />
          <ScoreLine label="Status" value={audit.httpStatus ?? null} />
        </div>
        {audit.error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
            Audit-Fehler: {audit.error}
          </div>
        )}
      </Section>
      <Section title="Beobachtungen">
        <FindingsList label="Fakten (belegt)" items={audit.findings.facts} tone="fact" />
        <FindingsList label="Schlussfolgerungen" items={audit.findings.inferences} tone="inference" />
        <FindingsList label="Empfehlungen" items={audit.findings.recommendations} tone="recommendation" />
      </Section>
      {Object.keys(audit.techStack).length > 0 && (
        <Section title="Tech Stack">
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            {Object.entries(audit.techStack).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="text-[11px] uppercase tracking-wider text-white/45">{k}</div>
                <div className="text-sm text-white/85">
                  {Array.isArray(v) ? v.join(", ") || "—" : String(v ?? "—")}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function FindingsList({ label, items, tone }: { label: string; items: Array<{ text: string; category: string }>; tone: "fact" | "inference" | "recommendation" }) {
  if (items.length === 0) return null;
  const color = tone === "fact" ? "#3B82F6" : tone === "inference" ? "#F59E0B" : "#22C55E";
  return (
    <div className="mt-3">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
            <span className="text-white/80">{it.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Software                                                              */
/* -------------------------------------------------------------------------- */

function SoftwareTab({ opportunities }: { opportunities: TargetOpportunity[] }) {
  const software = opportunities.filter((o) => o.source === "software");
  const website = opportunities.filter((o) => o.source === "website");
  const both = [...software, ...website];
  if (both.length === 0) return <EmptyState title="Keine Opportunities" hint="Analyse ausführen." />;
  return (
    <div className="space-y-4">
      {both.map((o) => (
        <Section
          key={o.id}
          title={opportunityKindLabel(o.kind)}
          actions={
            <span className="text-xs text-white/50">Confidence {(o.confidence * 100).toFixed(0)} %</span>
          }
        >
          {o.problem && <div className="mb-2 text-sm text-white/85"><span className="text-white/45">Problem: </span>{o.problem}</div>}
          {o.proposedSolution && <div className="mb-2 text-sm text-white/85"><span className="text-white/45">Lösung: </span>{o.proposedSolution}</div>}
          {o.businessImpact && <div className="mb-2 text-sm text-white/85"><span className="text-white/45">Business Impact: </span>{o.businessImpact}</div>}
          {o.estimatedRecommendedCents !== null && (
            <div className="mt-2 text-sm">
              <span className="text-white/45">Projektpotenzial: </span>
              <span className="text-white">
                {eur(o.estimatedMinCents ?? 0)} – {eur(o.estimatedMaxCents ?? o.estimatedRecommendedCents ?? 0)}
              </span>
            </div>
          )}
        </Section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Finanzen                                                              */
/* -------------------------------------------------------------------------- */

function FinanceTab({ score, signals }: { score: LeadScore | null; signals: FinancialSignal[] }) {
  return (
    <div className="space-y-4">
      <Section title="Commercial Capacity">
        {score?.capacityClass ? (
          <div className="space-y-1 text-sm">
            <div className="text-white">
              <span className="text-white/45">Klassifizierung: </span>
              <span style={{ color: FINANCIAL_CAPACITY_COLOR[score.capacityClass] }}>
                {FINANCIAL_CAPACITY_LABEL[score.capacityClass]}
              </span>
            </div>
            {score.capacityConfidence != null && (
              <div className="text-white/60">Confidence {(score.capacityConfidence * 100).toFixed(0)} %</div>
            )}
            {score.estimatedBudgetMinCents !== null && score.estimatedBudgetMaxCents !== null && (
              <div className="text-white/70">
                Geschätzter Budgetrahmen: {eur(score.estimatedBudgetMinCents)} – {eur(score.estimatedBudgetMaxCents)}
              </div>
            )}
          </div>
        ) : (
          <EmptyState title="Keine Kapazitätsdaten" hint="Analyse ausführen." />
        )}
      </Section>
      <Section title="Signale">
        {signals.length === 0 ? (
          <EmptyState title="Keine Finanzsignale" hint="Signale ergeben sich aus Rechtsform, Alter, Größe, Bewertungen usw." />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {signals.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/85">{FINANCIAL_SIGNAL_LABEL[s.kind]}</span>
                  <span
                    className="rounded-md border px-2 py-0.5 text-[10px]"
                    style={{
                      color: s.polarity === "positive" ? "#22C55E" : s.polarity === "negative" ? "#EF4444" : "#94A3B8",
                      borderColor: "currentColor",
                    }}
                  >
                    {s.polarity}
                  </span>
                </div>
                {s.evidence && <div className="text-xs text-white/60">{s.evidence}</div>}
                <div className="text-[11px] text-white/45">Confidence {(s.confidence * 100).toFixed(0)} %</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Quellen                                                               */
/* -------------------------------------------------------------------------- */

function SourcesTab({ sources }: { sources: TargetSource[] }) {
  if (sources.length === 0) return <EmptyState title="Keine Quellen" hint="Sobald der erste Enrichment-Lauf lief, erscheinen hier alle Quellen." />;
  return (
    <Section title={`Quellen (${sources.length})`}>
      <div className="space-y-2">
        {sources.map((s) => {
          const status = s.verificationStatus === "unverified" ? classifyConfidence(s.confidence) : s.verificationStatus;
          return (
            <div key={s.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/45">{s.field}</span>
                  <div className="text-white/85">{s.value}</div>
                </div>
                <span
                  className="rounded-md border px-2 py-0.5 text-[10px]"
                  style={{
                    color: VERIFICATION_COLOR[status],
                    borderColor: `${VERIFICATION_COLOR[status]}55`,
                    background: `${VERIFICATION_COLOR[status]}12`,
                  }}
                >
                  {VERIFICATION_LABEL[status]}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/50">
                Provider: {s.provider}
                {s.sourceUrl && (
                  <>
                    {" · "}
                    <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                      Quelle öffnen
                    </a>
                  </>
                )}
                {" · "}Abruf: {new Date(s.retrievedAt).toLocaleString("de-DE")}
                {" · "}Confidence {(s.confidence * 100).toFixed(0)} %
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Aktivitäten                                                           */
/* -------------------------------------------------------------------------- */

function ActivitiesTab({ activities }: { activities: TargetActivity[] }) {
  if (activities.length === 0) return <EmptyState title="Noch keine Aktivitäten" hint="Alle Analysen und manuellen Aktionen erscheinen hier." />;
  return (
    <Section title="Aktivitäten">
      <div className="relative border-l border-white/[0.08] pl-4">
        {activities.map((a) => (
          <div key={a.id} className="mb-4 last:mb-0">
            <div className="text-xs uppercase tracking-wider text-white/45">
              {new Date(a.occurredAt).toLocaleString("de-DE")} · {a.kind}
            </div>
            <div className="text-sm text-white/85">{a.summary}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function eur(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}
