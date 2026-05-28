"use client";

import type { Dispatch } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BUDGET_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  CONTACT_PREF_OPTIONS,
  DIGITAL_MATURITY_OPTIONS,
  DURATION_HINT,
  GOAL_OPTIONS,
  INDUSTRY_FOLLOWUPS,
  INDUSTRY_OPTIONS,
  PAIN_BLOCKS,
  PROJECT_DIRECTION_OPTIONS,
  PROJECT_PHASE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIME_HORIZON_OPTIONS,
  TOOL_OPTIONS,
  URGENCY_OPTIONS,
} from "@/lib/systemanalyse/config";
import type { SystemanalyseAction, SystemanalyseState } from "@/lib/systemanalyse/types";
import type { StepKey } from "@/lib/systemanalyse/types";
import { LuxuryField, LuxuryTextarea } from "./ui/LuxuryField";
import { SelectableTile } from "./ui/SelectableTile";
import { ContextConversation } from "./ContextConversation";
import type { AnalysisSummary } from "@/lib/systemanalyse/summary-types";
import { WizardSignature } from "./WizardSignature";

type Props = {
  stepKey: StepKey;
  state: SystemanalyseState;
  dispatch: Dispatch<SystemanalyseAction>;
  accentRgb: string;
  brandName: string;
  signatureProduct: string;
  onStartIntro?: () => void;
  analysisSummary?: AnalysisSummary | null;
  analysisSummaryLoading?: boolean;
};

type PainProps = {
  state: SystemanalyseState;
  dispatch: Dispatch<SystemanalyseAction>;
  accentRgb: string;
};

function PainProgressiveForm({ state, dispatch, accentRgb }: PainProps) {
  const blockRefs = useRef<(HTMLElement | null)[]>([]);
  const freeTextRef = useRef<HTMLDivElement | null>(null);
  const prevUnlocked = useRef(0);
  const prevShowFree = useRef(false);

  const unlockedBlockCount = useMemo(() => {
    for (let i = 1; i < PAIN_BLOCKS.length; i++) {
      const prevId = PAIN_BLOCKS[i - 1].id;
      if ((state.painByBlock[prevId] ?? []).length === 0) return i;
    }
    return PAIN_BLOCKS.length;
  }, [state.painByBlock]);

  const lastBlockId = PAIN_BLOCKS[PAIN_BLOCKS.length - 1].id;
  const showFreeText = (state.painByBlock[lastBlockId] ?? []).length > 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (unlockedBlockCount > prevUnlocked.current && unlockedBlockCount > 1) {
      const idx = unlockedBlockCount - 1;
      const el = blockRefs.current[idx];
      requestAnimationFrame(() => {
        el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start", inline: "nearest" });
      });
    }
    prevUnlocked.current = unlockedBlockCount;
  }, [unlockedBlockCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!showFreeText || prevShowFree.current) return;
    prevShowFree.current = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      freeTextRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }, [showFreeText]);

  return (
    <div className="space-y-6">
      {PAIN_BLOCKS.map((block, idx) => {
        if (idx >= unlockedBlockCount) return null;
        return (
          <section
            key={block.id}
            ref={(el) => {
              blockRefs.current[idx] = el;
            }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Teil {idx + 1} von {PAIN_BLOCKS.length}
            </p>
            <h3 className="text-base font-medium text-white/92">{block.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/48">{block.subtitle}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {block.items.map((item) => (
                <SelectableTile
                  key={item.id}
                  selected={(state.painByBlock[block.id] ?? []).includes(item.id)}
                  onClick={() => dispatch({ type: "TOGGLE_PAIN", blockId: block.id, itemId: item.id })}
                  accentRgb={accentRgb}
                  hint={item.hint}
                >
                  {item.label}
                </SelectableTile>
              ))}
            </div>
          </section>
        );
      })}
      {showFreeText ? (
        <div ref={freeTextRef} className="space-y-6">
          <LuxuryTextarea
            id="painConcrete"
            label="Konkrete Probleme"
            value={state.painConcrete}
            onChange={(v) => dispatch({ type: "PATCH", patch: { painConcrete: v } })}
            placeholder="Was fällt Ihnen spontan ein — auch abseits der Liste?"
            rows={4}
            accentRgb={accentRgb}
          />
          <LuxuryTextarea
            id="painCost"
            label="Kostenfokus"
            value={state.painCost}
            onChange={(v) => dispatch({ type: "PATCH", patch: { painCost: v } })}
            placeholder="Was kostet Sie aktuell am meisten Zeit, Geld oder Nerven?"
            rows={4}
            accentRgb={accentRgb}
          />
        </div>
      ) : null}
    </div>
  );
}

function CompleteReportFlow({
  state,
  accentRgb,
  brandName,
  analysisSummary,
  analysisSummaryLoading,
}: {
  state: SystemanalyseState;
  accentRgb: string;
  brandName: string;
  analysisSummary?: AnalysisSummary | null;
  analysisSummaryLoading?: boolean;
}) {
  const [visibleSections, setVisibleSections] = useState(1);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const totalSections = analysisSummary ? 5 : 1;
  const canRevealMore = visibleSections < totalSections;

  useEffect(() => {
    setVisibleSections(1);
  }, [analysisSummary?.score]);

  const revealNext = () => {
    if (!canRevealMore) return;
    setVisibleSections((v) => Math.min(totalSections, v + 1));
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      flowRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  };

  return (
    <div ref={flowRef} className="space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: `rgba(${accentRgb},0.14)`,
              border: `1px solid rgba(${accentRgb},0.38)`,
              boxShadow: `0 12px 40px rgba(${accentRgb},0.15)`,
            }}
          >
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/38">Analyse eingegangen</p>
            <h2
              className="mt-1 text-2xl font-medium text-white"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              Vielen Dank{state.contactName.trim() ? `, ${state.contactName.trim().split(/\s+/)[0]}` : ""}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
              Ihre Antworten sind bei uns eingetroffen. Die Auswertung wird bewusst schrittweise gezeigt, damit alles klar
              und fokussiert bleibt.
            </p>
          </div>
        </div>
        {analysisSummaryLoading ? (
          <div className="rounded-2xl border border-white/[0.08] px-5 py-4 text-sm text-white/45" style={{ background: "rgba(255,255,255,0.03)" }}>
            Auswertung wird vorbereitet …
          </div>
        ) : analysisSummary?.score != null ? (
          <div
            className="min-w-[200px] rounded-2xl border px-5 py-4 text-center"
            style={{
              borderColor: `rgba(${accentRgb},0.35)`,
              background: `linear-gradient(160deg, rgba(${accentRgb},0.12), rgba(255,255,255,0.02))`,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">System-Reifegrad</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{analysisSummary.score}%</p>
            {analysisSummary.potentialLevel ? <p className="mt-1 text-xs text-white/55">{analysisSummary.potentialLevel}</p> : null}
          </div>
        ) : null}
      </div>

      {analysisSummaryLoading ? (
        <div className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      ) : analysisSummary ? (
        <div className="space-y-4">
          {visibleSections >= 1 ? (
            <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-6" style={{ background: "linear-gradient(165deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)" }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">1 · Kurz-Zusammenfassung</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/58">{analysisSummary.situation}</p>
            </div>
          ) : null}
          {visibleSections >= 2 ? (
            <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-6" style={{ background: "linear-gradient(165deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)" }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">2 · Hauptprobleme</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/58">{analysisSummary.problems}</p>
            </div>
          ) : null}
          {visibleSections >= 3 ? (
            <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-6" style={{ background: "linear-gradient(165deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)" }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">3 · Automatisierungs-Potenzial</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/58">{analysisSummary.potential}</p>
            </div>
          ) : null}
          {visibleSections >= 4 ? (
            <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-6" style={{ background: "linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 55%, transparent 100%)", boxShadow: `0 0 0 1px rgba(${accentRgb},0.1) inset` }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">4 · High-End Systemvorschlag</h3>
              {analysisSummary.recommendation.trim() ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/62">{analysisSummary.recommendation}</p> : null}
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/58">
                {(analysisSummary.systemProposalBullets ?? []).map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: `rgba(${accentRgb},0.95)`, boxShadow: `0 0 10px rgba(${accentRgb},0.45)` }} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {visibleSections >= 5 ? (
            <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-6" style={{ background: "rgba(255,255,255,0.02)", boxShadow: `0 0 0 1px rgba(${accentRgb},0.08) inset` }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">5 · Nächste Schritte</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/58">{analysisSummary.nextSteps}</p>
            </div>
          ) : null}

          {canRevealMore ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={revealNext}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.015]"
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.42), rgba(${accentRgb},0.66))`,
                  border: `1px solid rgba(${accentRgb},0.38)`,
                  boxShadow: `0 10px 30px rgba(${accentRgb},0.2)`,
                }}
              >
                Weiter zur nächsten Auswertung
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-white/50">
          Die automatische Auswertung konnte nicht geladen werden — Ihre Daten sind dennoch sicher übermittelt. Wir melden uns
          bei Ihnen.
        </p>
      )}

      {state.submitStatus === "error" && state.submitError ? (
        <p className="text-sm text-red-400/90">{state.submitError}</p>
      ) : null}
    </div>
  );
}

export function WizardStepBody({
  stepKey,
  state,
  dispatch,
  accentRgb,
  brandName,
  signatureProduct,
  onStartIntro,
  analysisSummary,
  analysisSummaryLoading,
}: Props) {
  const profileStage1Ready =
    state.companyName.trim().length > 1 &&
    state.contactName.trim().length > 1 &&
    state.email.trim().length > 3;
  const profileStage2Ready = profileStage1Ready && Boolean(state.companySize);
  const profileStage3Ready = profileStage2Ready && Boolean(state.teamSize);
  const profileStage4Ready =
    profileStage3Ready &&
    Boolean(state.industry) &&
    (state.industry !== "sonstige" || state.industryOther.trim().length > 2);

  switch (stepKey) {
    case "intro":
      return (
        <div className="mx-auto max-w-3xl space-y-8">
          <div
            className="rounded-2xl border border-white/[0.08] p-6 text-center sm:p-8"
            style={{
              background: "linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)",
              boxShadow: `0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(${accentRgb},0.08) inset`,
            }}
          >
            <p className="text-sm leading-relaxed text-white/62 sm:text-[15px]">
              Dieser Assistent erfasst Ihre <strong className="text-white/80">Prozesse, Systemlandschaft, Schmerzpunkte und Ziele</strong>{" "}
              strukturiert — als Grundlage für eine fundierte Architektur- und Umsetzungsempfehlung. Kein Standard-Formular: eine{" "}
              <strong className="text-white/80">strategische Intake-Session</strong> in geführten Schritten.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/52">
              {[
                "Branchen- und kontextspezifische Vertiefung",
                "Gruppierte Diagnose statt Checkbox-Wüsten",
                "Klare Priorisierung von Dringlichkeit und Zielbild",
                "Vertrauliche Übergabe an unser Architektur-Team",
              ].map((line) => (
                <li key={line} className="flex items-start justify-center gap-3 text-center">
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                    style={{ background: `rgba(${accentRgb},0.9)`, boxShadow: `0 0 8px rgba(${accentRgb},0.5)` }}
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 text-xs uppercase tracking-[0.15em] text-white/38">{DURATION_HINT}</p>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={onStartIntro}
                className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.015]"
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.42), rgba(${accentRgb},0.66))`,
                  border: `1px solid rgba(${accentRgb},0.4)`,
                  boxShadow: `0 12px 34px rgba(${accentRgb},0.24)`,
                }}
              >
                Analyse starten
              </button>
            </div>
            <div
              className="mt-6 flex justify-center border-t border-white/[0.06] pt-6"
              aria-label="Signatur"
            >
              <WizardSignature
                accentRgb={accentRgb}
                serviceLabel={signatureProduct}
                brandName={brandName}
                variant="embed"
              />
            </div>
          </div>
        </div>
      );

    case "profile":
      return (
        <div className="space-y-8">
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">1. Basisdaten</p>
            <div className="grid gap-6 sm:grid-cols-2">
              <LuxuryField
                id="companyName"
                label="Unternehmen"
                value={state.companyName}
                onChange={(v) => dispatch({ type: "PATCH", patch: { companyName: v } })}
                placeholder="Firma / Marke"
                required
                accentRgb={accentRgb}
              />
              <LuxuryField
                id="contactName"
                label="Ansprechpartner"
                value={state.contactName}
                onChange={(v) => dispatch({ type: "PATCH", patch: { contactName: v } })}
                placeholder="Vor- und Nachname"
                required
                accentRgb={accentRgb}
              />
              <LuxuryField
                id="role"
                label="Position / Rolle"
                value={state.role}
                onChange={(v) => dispatch({ type: "PATCH", patch: { role: v } })}
                placeholder="z. B. Geschäftsführung, CIO, Operations"
                accentRgb={accentRgb}
              />
              <LuxuryField
                id="email"
                label="Geschäftliche E-Mail"
                type="email"
                value={state.email}
                onChange={(v) => dispatch({ type: "PATCH", patch: { email: v } })}
                placeholder="name@unternehmen.de"
                required
                accentRgb={accentRgb}
              />
              <LuxuryField
                id="phone"
                label="Telefon (optional)"
                type="tel"
                value={state.phone}
                onChange={(v) => dispatch({ type: "PATCH", patch: { phone: v } })}
                placeholder="+49 …"
                accentRgb={accentRgb}
              />
              <LuxuryField
                id="region"
                label="Region (optional)"
                value={state.region}
                onChange={(v) => dispatch({ type: "PATCH", patch: { region: v } })}
                placeholder="z. B. DACH, Standort"
                accentRgb={accentRgb}
              />
            </div>
          </section>

          {profileStage1Ready ? (
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">2. Unternehmensgröße</p>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Unternehmensgröße</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {COMPANY_SIZE_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.companySize === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { companySize: o.id } })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          ) : null}

          {profileStage2Ready ? (
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">3. Teamgröße</p>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Teamgröße (ungefähr)</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {TEAM_SIZE_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.teamSize === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { teamSize: o.id } })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          ) : null}

          {profileStage3Ready ? (
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">4. Branche</p>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Branche</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRY_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.industry === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { industry: o.id } })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
            {state.industry === "sonstige" ? (
              <div className="mt-4">
                <LuxuryTextarea
                  id="industryOther"
                  label="Ihr Geschäftsfeld"
                  value={state.industryOther}
                  onChange={(v) => dispatch({ type: "PATCH", patch: { industryOther: v } })}
                  placeholder="Kurz beschreiben, was Ihr Unternehmen leistet."
                  rows={3}
                  required
                  accentRgb={accentRgb}
                />
              </div>
            ) : null}
          </section>
          ) : null}

          {profileStage4Ready ? (
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">5. Digitalisierungsgrad</p>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Digitalisierungsgrad</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {DIGITAL_MATURITY_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.digitalMaturity === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { digitalMaturity: o.id } })}
                  hint={o.hint}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          ) : null}
        </div>
      );

    case "context":
      return <ContextConversation state={state} dispatch={dispatch} accentRgb={accentRgb} />;

    case "industry": {
      const followups = state.industry ? INDUSTRY_FOLLOWUPS[state.industry] : undefined;
      if (state.industry === "sonstige") {
        return (
          <p className="text-sm text-white/50">
            Sie haben „Sonstige“ gewählt — Ihr Feld haben wir bereits erfasst. Im nächsten Schritt vertiefen wir die Diagnose
            branchenübergreifend.
          </p>
        );
      }
      if (!followups?.length) {
        return (
          <p className="text-sm text-white/50">
            Für diese Branche sind keine zusätzlichen Kurzmodule hinterlegt — die allgemeine Diagnose im nächsten Schritt fängt Ihre
            Spezifika zusätzlich auf.
          </p>
        );
      }
      return (
        <div className="space-y-10">
          {followups.map((q) => (
            <section key={q.id}>
              <h3 className="mb-1 text-base font-medium text-white/90">{q.title}</h3>
              <p className="mb-4 text-xs text-white/40">Mehrfachauswahl möglich</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt) => (
                  <SelectableTile
                    key={opt.id}
                    selected={(state.industryFollowUp[q.id] ?? []).includes(opt.id)}
                    onClick={() =>
                      dispatch({ type: "TOGGLE_INDUSTRY_FOLLOWUP", questionId: q.id, optionId: opt.id })
                    }
                    accentRgb={accentRgb}
                  >
                    {opt.label}
                  </SelectableTile>
                ))}
              </div>
            </section>
          ))}
        </div>
      );
    }

    case "pain":
      return <PainProgressiveForm state={state} dispatch={dispatch} accentRgb={accentRgb} />;

    case "tools":
      return (
        <div className="space-y-8">
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Aktive Werkzeuge & Systeme</h3>
            <p className="mb-4 text-sm text-white/45">Alles zutreffende auswählen.</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TOOL_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.toolsUsed.includes(o.id)}
                  onClick={() => dispatch({ type: "TOGGLE_TOOL", id: o.id })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          <LuxuryField
            id="toolsOther"
            label="Weitere Tools (Freitext)"
            value={state.toolsOther}
            onChange={(v) => dispatch({ type: "PATCH", patch: { toolsOther: v } })}
            placeholder="z. B. spezielle Branchen- oder Legacy-Systeme"
            accentRgb={accentRgb}
          />
          <LuxuryTextarea
            id="toolsWorkingWell"
            label="Was funktioniert gut?"
            value={state.toolsWorkingWell}
            onChange={(v) => dispatch({ type: "PATCH", patch: { toolsWorkingWell: v } })}
            placeholder="Systeme oder Abläufe, auf die Sie nicht verzichten möchten."
            rows={3}
            accentRgb={accentRgb}
          />
          <LuxuryTextarea
            id="toolsFriction"
            label="Wo entsteht Reibung?"
            value={state.toolsFriction}
            onChange={(v) => dispatch({ type: "PATCH", patch: { toolsFriction: v } })}
            placeholder="Doppelpflege, fehlende Schnittstellen, langsame Prozesse …"
            rows={3}
            accentRgb={accentRgb}
          />
        </div>
      );

    case "goals":
      return (
        <div className="space-y-8">
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Gewünschte Ergebnisse</h3>
            <p className="mb-4 text-sm text-white/45">Priorisieren Sie durch Auswahl — mehrere Ziele möglich.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.goals.includes(o.id)}
                  onClick={() => dispatch({ type: "TOGGLE_GOAL", id: o.id })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          <LuxuryTextarea
            id="goal6m"
            label="Ideales Bild in 6 Monaten"
            value={state.goalIdealSixMonths}
            onChange={(v) => dispatch({ type: "PATCH", patch: { goalIdealSixMonths: v } })}
            placeholder="Wenn das Projekt gut läuft — was ist dann anders?"
            rows={4}
            required
            accentRgb={accentRgb}
          />
          <LuxuryTextarea
            id="goalShort"
            label="Kurzfristig kritisch"
            value={state.goalShortTermMust}
            onChange={(v) => dispatch({ type: "PATCH", patch: { goalShortTermMust: v } })}
            placeholder="Was muss sich zuerst verbessern?"
            rows={3}
            required
            accentRgb={accentRgb}
          />
        </div>
      );

    case "priority":
      return (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Handlungsdruck</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {URGENCY_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.urgency === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { urgency: o.id } })}
                  hint={o.hint}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          <LuxuryTextarea
            id="bottleneck"
            label="Größter Engpass"
            value={state.bottleneck}
            onChange={(v) => dispatch({ type: "PATCH", patch: { bottleneck: v } })}
            rows={3}
            required
            accentRgb={accentRgb}
          />
          <LuxuryTextarea
            id="businessRelevance"
            label="Höchste Business-Relevanz (optional)"
            value={state.businessRelevance}
            onChange={(v) => dispatch({ type: "PATCH", patch: { businessRelevance: v } })}
            rows={3}
            accentRgb={accentRgb}
          />
          <LuxuryTextarea
            id="mustNotContinue"
            label="Darf so nicht bleiben"
            value={state.mustNotContinue}
            onChange={(v) => dispatch({ type: "PATCH", patch: { mustNotContinue: v } })}
            placeholder="Was wäre untragbar, wenn sich nichts ändert?"
            rows={3}
            required
            accentRgb={accentRgb}
          />
        </div>
      );

    case "project":
      return (
        <div className="space-y-6">
          <p className="text-sm text-white/45">Welche Richtung(en) kommen für Sie infrage — auch parallel?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROJECT_DIRECTION_OPTIONS.map((o) => (
              <SelectableTile
                key={o.id}
                selected={state.projectDirections.includes(o.id)}
                onClick={() => dispatch({ type: "TOGGLE_PROJECT_DIRECTION", id: o.id })}
                accentRgb={accentRgb}
              >
                {o.label}
              </SelectableTile>
            ))}
          </div>
        </div>
      );

    case "investment":
      return (
        <div className="space-y-8">
          <p className="text-sm text-white/45">
            Optional — hilft uns, Realismus und Phasen einzuplanen. Keine Verpflichtung.
          </p>
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Budget-Rahmen (ungefähr)</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {BUDGET_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.budgetRange === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { budgetRange: o.id } })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Projektphase</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROJECT_PHASE_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.projectPhase === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { projectPhase: o.id } })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Zeithorizont</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {TIME_HORIZON_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.timeHorizon === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { timeHorizon: o.id } })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-8">
          <p className="text-sm text-white/50">
            Finaler Schritt: Wir spiegeln Ihre Kerndaten — bitte prüfen Sie die E-Mail. Mit Absenden stimmen Sie der vertraulichen
            Verarbeitung zu.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <LuxuryField
              id="c_name"
              label="Name"
              value={state.contactName}
              onChange={(v) => dispatch({ type: "PATCH", patch: { contactName: v } })}
              required
              accentRgb={accentRgb}
            />
            <LuxuryField
              id="c_company"
              label="Unternehmen"
              value={state.companyName}
              onChange={(v) => dispatch({ type: "PATCH", patch: { companyName: v } })}
              required
              accentRgb={accentRgb}
            />
            <LuxuryField
              id="c_email"
              label="E-Mail"
              type="email"
              value={state.email}
              onChange={(v) => dispatch({ type: "PATCH", patch: { email: v } })}
              required
              accentRgb={accentRgb}
            />
            <LuxuryField
              id="c_phone"
              label="Telefon (optional)"
              type="tel"
              value={state.phone}
              onChange={(v) => dispatch({ type: "PATCH", patch: { phone: v } })}
              accentRgb={accentRgb}
            />
          </div>
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Bevorzugte Kontaktaufnahme</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONTACT_PREF_OPTIONS.map((o) => (
                <SelectableTile
                  key={o.id}
                  selected={state.contactPreference === o.id}
                  onClick={() => dispatch({ type: "PATCH", patch: { contactPreference: o.id } })}
                  accentRgb={accentRgb}
                >
                  {o.label}
                </SelectableTile>
              ))}
            </div>
          </section>
          <LuxuryTextarea
            id="appointment"
            label="Terminpräferenz (optional)"
            value={state.appointmentPreference}
            onChange={(v) => dispatch({ type: "PATCH", patch: { appointmentPreference: v } })}
            placeholder="z. B. Vormittage, feste Uhrzeiten, Zeitzone"
            rows={2}
            accentRgb={accentRgb}
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <input
              type="checkbox"
              checked={state.consentDsgvo}
              onChange={(e) => dispatch({ type: "PATCH", patch: { consentDsgvo: e.target.checked } })}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
              style={{ accentColor: `rgb(${accentRgb.split(",").map((s) => s.trim()).join(",")})` }}
            />
            <span className="text-sm text-white/55">
              Ich willige ein, dass meine Angaben zur Bearbeitung der Systemanalyse durch {brandName} gespeichert werden und ich
              zwecks Rückfragen kontaktiert werde. Hinweise zur Datenverarbeitung finden Sie in der{" "}
              <Link href="/datenschutz" className="underline decoration-white/30 underline-offset-2 hover:text-white/80">
                Datenschutzerklärung
              </Link>
              .
            </span>
          </label>
        </div>
      );

    case "complete":
      return (
        <CompleteReportFlow
          state={state}
          accentRgb={accentRgb}
          brandName={brandName}
          analysisSummary={analysisSummary}
          analysisSummaryLoading={analysisSummaryLoading}
        />
      );

    default:
      return null;
  }
}
