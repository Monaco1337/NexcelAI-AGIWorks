"use client";

import Link from "next/link";
import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { DURATION_HINT, STEP_LABELS } from "@/lib/systemanalyse/config";
import { initialSystemanalyseState, systemanalyseReducer } from "@/lib/systemanalyse/reducer";
import type { AnalysisSummary } from "@/lib/systemanalyse/summary-types";
import { STEP_ORDER } from "@/lib/systemanalyse/types";
import { canProceed, getCurrentStepKey } from "@/lib/systemanalyse/validate";
import { WizardShell } from "./WizardShell";
import { WizardStepBody } from "./WizardStepBody";

function buildPayload(state: typeof initialSystemanalyseState, brandId: string) {
  const {
    stepIndex: _s,
    submitStatus: _st,
    submitError: _se,
    ...rest
  } = state;
  return {
    brandId,
    submittedAt: new Date().toISOString(),
    ...rest,
  };
}

function isAnalysisSummary(x: unknown): x is AnalysisSummary {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const bulletsOk =
    Array.isArray(o.systemProposalBullets) &&
    o.systemProposalBullets.length > 0 &&
    o.systemProposalBullets.every((b) => typeof b === "string");
  return (
    typeof o.situation === "string" &&
    typeof o.problems === "string" &&
    typeof o.potential === "string" &&
    typeof o.score === "number" &&
    bulletsOk
  );
}

export default function SystemanalyseWizard() {
  const brand = useBrand();
  const [state, dispatch] = useReducer(systemanalyseReducer, initialSystemanalyseState);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [analysisSummaryLoading, setAnalysisSummaryLoading] = useState(false);
  const summaryFetchedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const stepKey = getCurrentStepKey(state);
  const meta = STEP_LABELS[stepKey] ?? STEP_LABELS.intro;
  const accentRgb = brand.theme.accentRgb;

  const substantiveTotal = STEP_ORDER.length - 2;
  const showStepCounter = state.stepIndex > 0 && state.stepIndex < STEP_ORDER.length - 1;

  const next = useCallback(async () => {
    if (stepKey === "contact" && canProceed(state, stepKey)) {
      dispatch({ type: "SET_SUBMIT_STATUS", status: "submitting" });
      try {
        const res = await fetch("/api/systemanalyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId: brand.id,
            payload: buildPayload(state, brand.id),
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          dispatch({
            type: "SET_SUBMIT_STATUS",
            status: "error",
            error: data.error ?? "Übermittlung fehlgeschlagen.",
          });
          return;
        }
        dispatch({ type: "SET_SUBMIT_STATUS", status: "success" });
        dispatch({ type: "NEXT" });
      } catch {
        dispatch({
          type: "SET_SUBMIT_STATUS",
          status: "error",
          error: "Netzwerkfehler. Bitte später erneut versuchen.",
        });
      }
      return;
    }
    dispatch({ type: "NEXT" });
  }, [state, stepKey, brand.id]);

  const prev = useCallback(() => {
    if (state.stepIndex <= 0) return;
    dispatch({ type: "PREV" });
  }, [state.stepIndex]);

  const allowNext = canProceed(state, stepKey);
  const isIntro = stepKey === "intro";
  const isComplete = stepKey === "complete";
  const isContact = stepKey === "contact";
  const showProgress = !isIntro && !isComplete;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [state.stepIndex]);

  useEffect(() => {
    if (stepKey !== "complete" || state.submitStatus !== "success") return;
    if (summaryFetchedRef.current) return;
    summaryFetchedRef.current = true;
    let cancelled = false;
    setAnalysisSummaryLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/systemanalyse/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId: brand.id,
            brandName: brand.name,
            payload: buildPayload(stateRef.current, brand.id),
          }),
        });
        const data: unknown = await res.json();
        if (!cancelled && isAnalysisSummary(data)) setAnalysisSummary(data);
      } catch {
        summaryFetchedRef.current = false;
      } finally {
        if (!cancelled) setAnalysisSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      summaryFetchedRef.current = false;
    };
  }, [stepKey, state.submitStatus, brand.id, brand.name]);

  const footer = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex justify-center sm:justify-start">
        {!isIntro && !isComplete ? (
          <button
            type="button"
            onClick={prev}
            className="rounded-xl px-5 py-3 text-sm font-medium text-white/55 transition-colors hover:text-white/85"
          >
            Zurück
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {isComplete ? (
          <Link
            href={brand.navigation.baseHref}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, rgba(${accentRgb},0.35), rgba(${accentRgb},0.55))`,
              border: `1px solid rgba(${accentRgb},0.4)`,
              boxShadow: `0 8px 32px rgba(${accentRgb},0.2)`,
            }}
          >
            Zur Startseite
          </Link>
        ) : isIntro ? null : (
          <button
            type="button"
            onClick={next}
            disabled={
              isIntro
                ? false
                : isContact && state.submitStatus === "submitting"
                  ? true
                  : !allowNext
            }
            className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-35"
            style={{
              background:
                isIntro || (allowNext && (!isContact || state.submitStatus !== "submitting"))
                  ? `linear-gradient(135deg, rgba(${accentRgb},0.4), rgba(${accentRgb},0.65))`
                  : "rgba(255,255,255,0.08)",
              border: `1px solid rgba(${accentRgb},0.35)`,
              boxShadow:
                isIntro || allowNext
                  ? `0 8px 28px rgba(${accentRgb},0.22)`
                  : "none",
            }}
          >
            {isContact
              ? state.submitStatus === "submitting"
                ? "Wird gesendet …"
                : "Analyse einreichen"
              : "Weiter"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${accentRgb},0.08) 0%, transparent 55%), linear-gradient(180deg, #06060c 0%, #050508 45%, #040406 100%)`,
      }}
    >
      <WizardShell
        accentRgb={accentRgb}
        brandName={brand.name}
        signatureProduct={brand.wizardSignatureProduct}
        stepIndex={state.stepIndex}
        totalSteps={STEP_ORDER.length}
        substantiveStep={showProgress ? state.stepIndex : undefined}
        substantiveTotal={showProgress ? substantiveTotal : undefined}
        stepLabel={meta.title}
        stepSubtitle={meta.subtitle}
        durationHint={isIntro ? DURATION_HINT : undefined}
        showProgress={showProgress}
        centerIntroHeader={isIntro}
        footer={isIntro ? undefined : footer}
      >
        <div
          className={
            showStepCounter
              ? "rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 shadow-[0_26px_72px_rgba(0,0,0,0.38)] backdrop-blur-[2px] sm:p-6"
              : ""
          }
        >
          {showStepCounter ? (
            <p
              className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/33"
              aria-live="polite"
            >
              Schritt {state.stepIndex} von {substantiveTotal}
            </p>
          ) : null}
          <WizardStepBody
            stepKey={stepKey}
            state={state}
            dispatch={dispatch}
            accentRgb={accentRgb}
            brandName={brand.name}
            signatureProduct={brand.wizardSignatureProduct}
            onStartIntro={isIntro ? next : undefined}
            analysisSummary={analysisSummary}
            analysisSummaryLoading={analysisSummaryLoading}
          />
        </div>
      </WizardShell>
    </div>
  );
}
