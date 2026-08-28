"use client";

/**
 * Sales-Intelligence-Summary.
 *
 * Kompakte Zusammenfassung „Was wissen wir?" pro Firmenakte.
 * Aggregiert aus:
 *   - Firmenstammdaten
 *   - primärer Opportunity (falls vorhanden)
 *   - Discovery-Snapshot (falls vorhanden)
 *   - Solution (falls vorhanden)
 *
 * Zeigt keine ungeprüften AI-Aussagen als Fakten. Fehlende Punkte werden
 * bewusst als „offen" markiert, statt zu erfinden.
 */

import type {
  SalesCompany,
  SalesContact,
  SalesOpportunity,
  SalesSolution,
} from "./shared";
import {
  coerceDiscovery,
  analyzeDiscovery,
  DISCOVERY_BLOCKS,
  type DiscoveryData,
} from "@/lib/sales/discoveryModel";

interface Props {
  company: SalesCompany;
  contacts: SalesContact[];
  opportunity: SalesOpportunity | null;
  discovery: DiscoveryData | null;
  solution: SalesSolution | null;
}

function firstMeaningful(...values: (string | undefined | null)[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

export default function IntelligenceSummary({
  company,
  contacts,
  opportunity,
  discovery,
  solution,
}: Props) {
  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;
  const primaryName = primaryContact
    ? [primaryContact.firstName, primaryContact.lastName].filter(Boolean).join(" ")
    : null;

  const analysis = discovery ? analyzeDiscovery(discovery) : null;
  const b = discovery?.blocks;

  const ziel = firstMeaningful(
    b?.A_ziel?.note,
    b?.A_ziel?.fields?.ziel,
    b?.L_zielzustand?.note,
    b?.L_zielzustand?.fields?.zielzustand
  );
  const pain = firstMeaningful(b?.E_pain?.note, b?.E_pain?.fields?.pain);
  const auswirkung = firstMeaningful(
    b?.G_auswirkung?.note,
    b?.G_auswirkung?.fields?.zeit,
    b?.G_auswirkung?.fields?.kosten
  );
  const upside = firstMeaningful(
    b?.J_potenzial?.note,
    b?.J_potenzial?.fields?.potenzial,
    b?.K_business_value?.note
  );
  const timing = firstMeaningful(
    b?.O_timing?.note,
    b?.O_timing?.fields?.wann
  );
  const budget = firstMeaningful(
    b?.T_budget?.note,
    b?.T_budget?.fields?.rahmen
  );
  const entscheider = firstMeaningful(
    b?.Q_stakeholder?.note,
    b?.Q_stakeholder?.fields?.entscheider
  );
  const bestaetigt = firstMeaningful(
    discovery?.bestaetigterBedarf,
    b?.X_bedarf?.note,
    b?.X_bedarf?.fields?.zusammenfassung
  );
  const naechster = firstMeaningful(
    discovery?.naechsterSchritt,
    b?.Y_naechster_schritt?.note,
    b?.Y_naechster_schritt?.fields?.schritt
  );

  const openCritical = analysis?.criticalOpen ?? [];
  const openCriticalLabels = openCritical
    .map((k) => DISCOVERY_BLOCKS.find((d) => d.key === k)?.title)
    .filter(Boolean) as string[];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">
          Sales-Intelligenz
        </h3>
        {solution?.approvedAt ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            Lösung freigegeben
          </span>
        ) : analysis?.readyForSolution ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
            Lösungsbereit
          </span>
        ) : (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/55">
            {analysis ? "Bedarf in Arbeit" : "Bedarf offen"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SummaryLine
          label="Unternehmen"
          value={firstMeaningful(
            company.industry ? `${company.industry}${company.city ? ", " + company.city : ""}` : company.city
          )}
          hint="Was wir bereits sicher wissen."
        />
        <SummaryLine
          label="Ansprechpartner"
          value={
            primaryContact
              ? `${primaryName || "Kontakt"}${primaryContact.position ? " · " + primaryContact.position : ""}`
              : null
          }
          hint="Wer ist unser Hauptkontakt?"
        />
        <SummaryLine label="Ziel" value={ziel} evidence={b?.A_ziel?.evidence} />
        <SummaryLine label="Pain" value={pain} evidence={b?.E_pain?.evidence} />
        <SummaryLine label="Auswirkung" value={auswirkung} evidence={b?.G_auswirkung?.evidence} />
        <SummaryLine label="Upside" value={upside} evidence={b?.J_potenzial?.evidence} />
        <SummaryLine label="Entscheider" value={entscheider} evidence={b?.Q_stakeholder?.evidence} />
        <SummaryLine label="Timing" value={timing} evidence={b?.O_timing?.evidence} />
        <SummaryLine label="Investitionsrahmen" value={budget} evidence={b?.T_budget?.evidence} />
      </div>

      {bestaetigt && (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Bestätigter Bedarf</div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">{bestaetigt}</div>
        </div>
      )}

      {naechster && (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Vereinbarter nächster Schritt</div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">{naechster}</div>
        </div>
      )}

      {openCriticalLabels.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-amber-300/80">Was noch fehlt</div>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {openCriticalLabels.map((t) => (
              <li
                key={t}
                className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryLine({
  label,
  value,
  hint,
  evidence,
}: {
  label: string;
  value: string | null;
  hint?: string;
  evidence?: string;
}) {
  const present = value && value.trim().length > 0;
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/[0.15] px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-white/40">{label}</span>
        {evidence && present && (
          <span
            className="text-[10px] uppercase tracking-wider text-white/35"
            title="Evidenzklasse"
          >
            {evidence === "customer_statement"
              ? "Kundenaussage"
              : evidence === "verified"
                ? "Verifiziert"
                : evidence === "indication"
                  ? "Indiz"
                  : evidence === "hypothesis"
                    ? "Hypothese"
                    : evidence === "contradiction"
                      ? "Widerspruch"
                      : "Offen"}
          </span>
        )}
      </div>
      <div className={`mt-1 text-sm ${present ? "text-white/90" : "text-white/35"}`}>
        {present ? value : hint || "Noch offen"}
      </div>
    </div>
  );
}
