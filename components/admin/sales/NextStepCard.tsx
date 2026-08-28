"use client";

/**
 * Prominente „Nächster empfohlener Schritt"-Karte.
 *
 * Fragt die Empfehlung aus der Guided-Next-Step-Engine ab und zeigt
 * genau einen konkreten CTA. Alles andere ist bewusst reduziert, damit
 * die Karte im Firmenkopf visuell dominant bleibt.
 */

import { useCallback, useEffect, useState } from "react";
import type { NextStepRecommendation } from "@/lib/sales/nextStep";
import { buttonPrimary } from "./HelperUI";

interface Props {
  companyId: string;
  accent: string;
  onNavigate?: (tab: string, opportunityId?: string) => void;
  onStartCall?: (opportunityId: string) => void;
  onStartDiscovery?: (opportunityId: string) => void;
}

export default function NextStepCard({
  companyId,
  accent,
  onNavigate,
  onStartCall,
  onStartDiscovery,
}: Props) {
  const [state, setState] = useState<{
    recommendation: NextStepRecommendation;
    primaryOpportunityId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/companies/${companyId}/next-step`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          recommendation: NextStepRecommendation;
          primaryOpportunityId: string | null;
        };
        setState(data);
      }
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !state) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="h-3 w-28 animate-pulse rounded-md bg-white/[0.05]" />
        <div className="mt-3 h-4 w-52 animate-pulse rounded-md bg-white/[0.05]" />
      </div>
    );
  }

  const rec = state.recommendation;
  const trigger = () => {
    if (rec.focus === "call" && state.primaryOpportunityId) {
      onStartCall?.(state.primaryOpportunityId);
      return;
    }
    if (rec.focus === "discovery" && state.primaryOpportunityId) {
      onStartDiscovery?.(state.primaryOpportunityId);
      return;
    }
    if (rec.targetTab) {
      onNavigate?.(rec.targetTab, state.primaryOpportunityId ?? undefined);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5"
      style={{
        boxShadow: `inset 0 0 0 1px ${accent}22`,
      }}
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        Nächster empfohlener Schritt
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-white/60">{rec.reason}</p>
        </div>
        <button
          type="button"
          onClick={trigger}
          className={buttonPrimary}
          style={{ backgroundColor: accent, boxShadow: `0 8px 32px ${accent}33` }}
        >
          {rec.cta} →
        </button>
      </div>
    </div>
  );
}
