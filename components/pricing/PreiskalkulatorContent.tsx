"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useBrand } from "@/contexts/BrandContext";
import PremiumProductsShowcase from "@/components/pricing/PremiumProductsShowcase";
import {
  type WizardState,
  type ProjectType,
  type Scope,
  type Timeframe,
  type Quality,
  type ApiTier,
  calcQuote,
  type Quote,
  PROJECT_TYPE_LABELS,
  SCOPE_LABELS,
  TIMEFRAME_LABELS,
  QUALITY_LABELS,
  FEATURE_PRICES,
  TIMEFRAME_INFO,
  QUALITY_INFO,
} from "@/lib/pricing-config";

const STEPS = [
  { id: 0, label: "Projektart", key: "projectType" },
  { id: 1, label: "Umfang", key: "scope" },
  { id: 2, label: "Features", key: "features" },
  { id: 3, label: "Zeitrahmen", key: "timeframe" },
  { id: 4, label: "Qualität", key: "quality" },
  { id: 5, label: "Ergebnis", key: "result" },
];

const PROJECT_TYPES: { value: ProjectType; label: string }[] = (
  Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]
).map(([value, label]) => ({ value, label }));

const SCOPES: { value: Scope; label: string }[] = (
  Object.entries(SCOPE_LABELS) as [Scope, string][]
).map(([value, label]) => ({ value, label }));

const TIMEFRAMES: { value: Timeframe; label: string }[] = (
  Object.entries(TIMEFRAME_LABELS) as [Timeframe, string][]
).map(([value, label]) => ({ value, label }));

const QUALITIES: { value: Quality; label: string }[] = (
  Object.entries(QUALITY_LABELS) as [Quality, string][]
).map(([value, label]) => ({ value, label }));

const API_TIERS: { value: ApiTier; label: string }[] = [
  { value: "1-2", label: "1–2 APIs" },
  { value: "3-5", label: "3–5 APIs" },
  { value: "6+", label: "6+ APIs" },
];

const FEATURE_OPTIONS: { id: string; label: string; needsApiTier?: boolean }[] = [
  { id: "api", label: "API-Integrationen", needsApiTier: true },
  { id: "dashboard", label: "Dashboard" },
  { id: "auth", label: "Auth / Rollen (RBAC)" },
  { id: "payments", label: "Payments" },
  { id: "admin_panel", label: "Admin Panel" },
  { id: "reporting", label: "Reporting / Analytics" },
  { id: "ki_module", label: "KI-Modul (RAG / Agent / Fine-tuning)" },
  { id: "workflow", label: "Workflow-Automatisierung" },
  { id: "migration", label: "Data Migration (optional)" },
];

const defaultState: WizardState = {
  projectTypes: [],
  scope: null,
  features: [],
  apiTier: null,
  timeframe: null,
  quality: null,
  wantMaintenance: false,
  hasMigration: false,
  hasKi: false,
};

function encodeState(s: WizardState): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(s)));
  } catch {
    return "";
  }
}

function decodeState(q: string | null): Partial<WizardState> | null {
  if (!q) return null;
  try {
    const o = JSON.parse(decodeURIComponent(atob(q))) as Record<string, unknown>;
    if (o.apiCount != null && o.apiTier == null) {
      const n = Number(o.apiCount);
      if (n <= 2) o.apiTier = "1-2";
      else if (n <= 5) o.apiTier = "3-5";
      else o.apiTier = "6+";
    }
    if (o.projectType != null && !Array.isArray(o.projectTypes)) {
      o.projectTypes = [o.projectType];
    }
    return o as Partial<WizardState>;
  } catch {
    return null;
  }
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const AUTO_ADVANCE_MS = 500;

function glassPanelStyle(): React.CSSProperties {
  return {
    background: "rgba(12, 15, 26, 0.72)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid var(--brand-card-border)",
    boxShadow:
      "0 20px 60px rgba(0, 0, 0, 0.45), inset 0 0 40px var(--brand-glow-soft)",
  };
}

function tileStyle(selected: boolean): React.CSSProperties {
  return {
    borderColor: selected ? "var(--brand-line-mid)" : "rgba(255,255,255,0.08)",
    background: selected ? "var(--brand-glow-soft)" : "rgba(255,255,255,0.03)",
    boxShadow: selected ? "0 0 28px var(--brand-glow-mid)" : "none",
  };
}

function GhostButton({
  children,
  type = "button",
  disabled,
  onClick,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-[12px] uppercase transition-all duration-500 hover:gap-4 disabled:opacity-40 disabled:cursor-not-allowed sm:text-[12.5px] ${className}`}
      style={{
        color: isPrimary ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
        background: "transparent",
        border: isPrimary
          ? "1px solid var(--brand-card-border)"
          : "1px solid rgba(255,255,255,0.08)",
        fontFamily: "var(--font-headline), system-ui, sans-serif",
        letterSpacing: "0.22em",
        fontWeight: 500,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          border: "1px solid var(--brand-line-mid)",
          boxShadow: isPrimary
            ? "0 0 28px var(--brand-glow-mid)"
            : "0 0 20px var(--brand-glow-soft)",
        }}
      />
      <span className="relative flex items-center gap-3">{children}</span>
    </button>
  );
}

export default function PreiskalkulatorContent() {
  const brand = useBrand();
  const { pricingPage } = brand;
  const homeHref = brand.navigation.baseHref || "/";
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(defaultState);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showWhyTooltip, setShowWhyTooltip] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToWizardTop = useCallback(() => {
    requestAnimationFrame(() => {
      const el = wizardRef.current;
      if (!el) return;
      const navClearance = 120;
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top =
        el.getBoundingClientRect().top + window.scrollY - navClearance;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }, []);

  const quote: Quote | null =
    state.projectTypes?.length && state.scope && state.timeframe && state.quality
      ? calcQuote(state)
      : null;

  const canProceed = useCallback(() => {
    if (step === 0) return state.projectTypes?.length >= 1;
    if (step === 1) return state.scope != null;
    if (step === 2) return true;
    if (step === 3) return state.timeframe != null;
    if (step === 4) return state.quality != null;
    if (step === 5) return true;
    return false;
  }, [step, state]);

  useEffect(() => {
    const q = searchParams.get("q");
    const decoded = decodeState(q);
    if (decoded) {
      setState((prev) => ({
        ...prev,
        ...decoded,
        projectTypes: Array.isArray(decoded.projectTypes) ? decoded.projectTypes : prev.projectTypes,
        scope: decoded.scope ?? prev.scope,
        timeframe: decoded.timeframe ?? prev.timeframe,
        quality: decoded.quality ?? prev.quality,
        features: Array.isArray(decoded.features) ? decoded.features : prev.features,
        apiTier: decoded.apiTier ?? prev.apiTier,
        wantMaintenance: decoded.wantMaintenance ?? prev.wantMaintenance,
        hasMigration: decoded.hasMigration ?? prev.hasMigration,
        hasKi: decoded.hasKi ?? prev.hasKi,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", encodeState(state));
    window.history.replaceState({}, "", url.pathname + "?" + url.searchParams.toString());
  }, [state]);

  useEffect(() => {
    scrollToWizardTop();
  }, [step, scrollToWizardTop]);

  const nextStep = useCallback(() => {
    if (step < 5) setStep((s) => s + 1);
  }, [step]);

  const prevStep = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const updateState = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "features") {
        const f = value as string[];
        next.hasMigration = f.includes("migration");
        next.hasKi = f.includes("ki_module");
      }
      return next;
    });
  }, []);

  const handleSingleChoice = useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      updateState(key, value);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = setTimeout(() => {
        if (step <= 4 && canProceed()) nextStep();
        autoAdvanceRef.current = null;
      }, AUTO_ADVANCE_MS);
    },
    [updateState, step, canProceed, nextStep]
  );

  const toggleProjectType = (value: ProjectType) => {
    setState((prev) => {
      const has = prev.projectTypes.includes(value);
      const projectTypes = has
        ? prev.projectTypes.filter((p) => p !== value)
        : [...prev.projectTypes, value];
      return { ...prev, projectTypes };
    });
  };

  const toggleFeature = (id: string) => {
    setState((prev) => {
      const features = prev.features.includes(id)
        ? prev.features.filter((f) => f !== id)
        : [...prev.features, id];
      return {
        ...prev,
        features,
        hasMigration: features.includes("migration"),
        hasKi: features.includes("ki_module"),
      };
    });
  };

  const handleSubmitOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const company = (formData.get("company") as string) || undefined;
    const message = (formData.get("message") as string) || undefined;
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          message,
          state,
          quote: quote
            ? { min: quote.min, max: quote.max, weeksMin: quote.weeksMin, weeksMax: quote.weeksMax, scopeSummary: quote.scopeSummary }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Senden.");
      setFormSuccess(true);
      form.reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const prefillMessage = quote
    ? quote.scopeSummary.join("\n• ") || ""
    : "";

  const tileClass = (selected: boolean) =>
    `relative rounded-2xl p-5 sm:p-6 border transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] text-left hover:border-[color-mix(in_srgb,var(--brand-line-mid)_55%,transparent)] hover:bg-white/[0.05]`;

  return (
    <>
    <Navigation />
    <main
      id="preiskalkulator"
      className="ds-app min-h-screen px-4 text-white sm:px-6 scroll-mt-[120px]"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + clamp(7rem, 14vh, 10rem))",
        paddingBottom: "clamp(3rem, 8vh, 5rem)",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center">

      {/* ═══════════════════════════════════════════════════════════════
          PREMIUM PRODUCTS SHOWCASE — Festpreis-Katalog
          (Hauptinhalt: 4 Tiers · 3 Support · Why · Benefits)
          ═══════════════════════════════════════════════════════════ */}
      <PremiumProductsShowcase />

      {/* ─── Transition Divider: Showcase → Wizard ─────────────────── */}
      <div className="mt-[clamp(56px,8vh,96px)] mb-[clamp(36px,5vh,56px)] flex w-full max-w-5xl flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-px w-[44px] sm:w-[64px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--brand-line-mid) 100%)",
            }}
          />
          <span
            aria-hidden
            className="inline-block h-[5px] w-[5px] rounded-full"
            style={{
              background: "var(--brand-line-bright)",
              boxShadow: "0 0 8px var(--brand-glow-strong)",
            }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.36em] sm:text-[10.5px]"
            style={{
              color: "var(--brand-line-bright)",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              filter: "drop-shadow(0 0 6px var(--brand-glow-strong))",
            }}
          >
            Individuell kalkulieren
          </span>
          <span
            aria-hidden
            className="inline-block h-[5px] w-[5px] rounded-full"
            style={{
              background: "var(--brand-line-bright)",
              boxShadow: "0 0 8px var(--brand-glow-strong)",
            }}
          />
          <span
            aria-hidden
            className="h-px w-[44px] sm:w-[64px]"
            style={{
              background:
                "linear-gradient(90deg, var(--brand-line-mid) 0%, transparent 100%)",
            }}
          />
        </div>

        <h2
          className="mt-6 max-w-[640px] text-[1.6rem] leading-[1.1] text-white sm:text-[2rem] md:text-[2.3rem]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 300,
            letterSpacing: "-0.025em",
          }}
        >
          Etwas{" "}
          <span
            style={{
              background: "var(--brand-headline-gradient)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              fontWeight: 400,
              filter: "drop-shadow(0 0 18px var(--brand-glow-strong))",
            }}
          >
            Eigenes
          </span>{" "}
          im Kopf?
        </h2>
        <p className="mt-3 max-w-[500px] text-[13px] leading-[1.6] text-white/55 sm:text-[14px]">
          {pricingPage.subline}
        </p>
      </div>

      {/* Wizard-Panel */}
      <div
        ref={wizardRef}
        className="w-full max-w-5xl rounded-3xl overflow-hidden scroll-mt-[120px]"
        style={glassPanelStyle()}
      >
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-start justify-end gap-4 mb-8">
            <Link
              href={homeHref}
              aria-label="Schließen und zur Startseite"
              className="group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase transition-all duration-500"
              style={{
                color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                letterSpacing: "0.18em",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  border: "1px solid var(--brand-line-mid)",
                  boxShadow: "0 0 20px var(--brand-glow-soft)",
                }}
              />
              <span className="relative">Schließen</span>
              <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>

          <nav
            aria-label="Fortschritt Preiskalkulator"
            className="flex flex-wrap gap-2 sm:gap-3 mb-10 pb-6"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                aria-current={step === s.id ? "step" : undefined}
                aria-label={`Schritt ${s.id + 1}: ${s.label}`}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                  step === s.id
                    ? "text-white"
                    : "text-white/45 hover:text-white/80"
                }`}
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  letterSpacing: "0.16em",
                  border: step === s.id
                    ? "1px solid var(--brand-line-mid)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: step === s.id ? "var(--brand-glow-soft)" : "transparent",
                  boxShadow: step === s.id ? "0 0 20px var(--brand-glow-soft)" : "none",
                }}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium tabular-nums"
                  style={{
                    border: step === s.id
                      ? "1px solid var(--brand-line-mid)"
                      : "1px solid rgba(255,255,255,0.12)",
                    color: step === s.id ? "var(--brand-primary)" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {String(s.id + 1).padStart(2, "0")}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            {step === 0 && (
                <div key="0" className="space-y-6">
                  <h2 className="text-lg font-medium text-white/95">Projektart</h2>
                  <p className="text-sm text-white/55">Mehrfachauswahl möglich – z. B. Web + App + KI-Integration.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PROJECT_TYPES.map((opt) => {
                      const selected = state.projectTypes.includes(opt.value);
                      const icon = opt.value === "web" ? (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                      ) : opt.value === "app" ? (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      ) : opt.value === "automatisierung" ? (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      ) : opt.value === "ki" ? (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                      ) : (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                      );
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleProjectType(opt.value)}
                          className={tileClass(selected) + " flex items-center gap-4 text-left"}
                          style={tileStyle(selected)}
                        >
                          <span className={selected ? "text-[var(--brand-primary)]" : "text-white/70"}>{icon}</span>
                          <span className="text-[15px] font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {step === 1 && (
                <div key="1" className="space-y-6">
                  <h2 className="text-lg font-medium text-white/95">Umfang</h2>
                  <p className="text-sm text-white/55">Der wichtigste Hebel für Ihre Kosteneinschätzung.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {SCOPES.map((opt) => {
                      const icon = opt.value === "mvp" ? (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.75a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.75-9.09v4.8m0 0v4.8m0-4.8a6 6 0 016.16 6.16" /></svg>
                      ) : opt.value === "growth" ? (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                      ) : (
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                      );
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSingleChoice("scope", opt.value)}
                          className={tileClass(state.scope === opt.value) + " flex items-center gap-4 text-left"}
                          style={tileStyle(state.scope === opt.value)}
                        >
                          <span className={state.scope === opt.value ? "text-[var(--brand-primary)]" : "text-white/70"}>{icon}</span>
                          <span className="text-[15px] font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {step === 2 && (
                <div key="2" className="space-y-6">
                  <h2 className="text-lg font-medium text-white/95">Features</h2>
                  <p className="text-sm text-white/55">Optionale Bausteine – jede Karte zeigt den individuellen Preisbeitrag.</p>
                  {state.features.includes("api") && (
                    <div className="space-y-2">
                      <span className="text-sm text-white/70">API-Integrationen: Anzahl</span>
                      <div className="flex gap-3 flex-wrap">
                        {API_TIERS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateState("apiTier", opt.value)}
                            className={tileClass(state.apiTier === opt.value)}
                            style={tileStyle(state.apiTier === opt.value)}
                          >
                            <span className="text-[15px] font-medium">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FEATURE_OPTIONS.map((opt) => {
                      const price = FEATURE_PRICES[opt.id];
                      const selected = state.features.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleFeature(opt.id)}
                          className={`${tileClass(selected)} text-left flex flex-col gap-2`}
                          style={tileStyle(selected)}
                        >
                          <span className="text-[15px] font-medium">{opt.label}</span>
                          {price && (
                            <span className={`text-sm font-semibold ${selected ? "text-[var(--brand-primary)]" : "text-white/45"}`}>
                              {formatPrice(price.min)} – {formatPrice(price.max)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {step === 3 && (
                <div key="3" className="space-y-6">
                  <h2 className="text-lg font-medium text-white/95">Zeitrahmen</h2>
                  <p className="text-sm text-white/55">Beeinflusst Aufwand und Planungssicherheit.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {TIMEFRAMES.map((opt) => {
                      const info = TIMEFRAME_INFO[opt.value];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSingleChoice("timeframe", opt.value)}
                          className={`${tileClass(state.timeframe === opt.value)} text-left flex flex-col gap-2`}
                          style={tileStyle(state.timeframe === opt.value)}
                        >
                          <span className="text-[15px] font-medium">{opt.label}</span>
                          {info && (
                            <>
                              <span className="text-xs text-white/50">{info.weeksNote}</span>
                              <span className="text-xs text-white/40 leading-snug">{info.description}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {step === 4 && (
                <div key="4" className="space-y-6">
                  <h2 className="text-lg font-medium text-white/95">Qualitätsstufe</h2>
                  <p className="text-sm text-white/55">Bestimmt Umfang von QA, Dokumentation und Support.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {QUALITIES.map((opt) => {
                      const info = QUALITY_INFO[opt.value];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSingleChoice("quality", opt.value)}
                          className={`${tileClass(state.quality === opt.value)} text-left flex flex-col gap-2`}
                          style={tileStyle(state.quality === opt.value)}
                        >
                          <span className="text-[15px] font-medium">{opt.label}</span>
                          {info && (
                            <>
                              <span className="text-xs text-white/50">{info.weeksNote}</span>
                              <span className="text-xs text-white/40 leading-snug">{info.description}</span>
                              {info.includes?.length > 0 && (
                                <ul className="text-xs text-white/35 list-disc list-inside mt-1 space-y-0.5">
                                  {info.includes.slice(0, 3).map((inc, i) => (
                                    <li key={i}>{inc}</li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {step === 5 && quote && (
                <div key="5" className="space-y-8">
                  <h2 className="text-lg font-medium text-white/95">Ihre Einschätzung</h2>

                  {/* Hero Preis-Karte */}
                  <div
                    className="rounded-2xl p-6 sm:p-8"
                    style={{
                      border: "1px solid var(--brand-card-border)",
                      background: "var(--brand-glow-soft)",
                      boxShadow: "0 0 40px var(--brand-glow-soft)",
                    }}
                  >
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.22em] mb-3"
                      style={{ color: "var(--brand-primary)", opacity: 0.75 }}
                    >
                      Individueller Preisbereich (brutto)
                    </p>
                    <p
                      className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight"
                      style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                    >
                      {formatPrice(quote.min)} – {formatPrice(quote.max)}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-white/80"
                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <svg className="w-4 h-4" style={{ color: "var(--brand-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {quote.weeksMin}–{quote.weeksMax} Wochen
                      </span>
                      {state.quality && (
                        <span
                          className="rounded-full px-3 py-1.5 text-white/80"
                          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          {QUALITY_LABELS[state.quality]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scope als Karten */}
                  {quote.scopeSummary.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">Überblick</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quote.scopeSummary.map((b, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white/75"
                          >
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Breakdown als Preiskarten */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">Breakdown nach Positionen</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quote.items.map((item, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 flex justify-between items-center gap-4"
                        >
                          <span className="text-sm text-white/85 font-medium">{item.label}</span>
                          <span className="text-sm font-semibold text-[var(--brand-primary)] whitespace-nowrap">
                            {formatPrice(item.amountMin)} – {formatPrice(item.amountMax)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                    <input
                      type="checkbox"
                      checked={state.wantMaintenance ?? false}
                      onChange={(e) => updateState("wantMaintenance", e.target.checked)}
                      className="rounded border-white/30 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span className="text-sm text-white/75">Wartung / SLA optional einrechnen</span>
                  </label>

                  {!showOfferForm && !formSuccess && (
                    <GhostButton onClick={() => setShowOfferForm(true)}>
                      {pricingPage.offerCtaLabel}
                      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </GhostButton>
                  )}

                  {showOfferForm && !formSuccess && (
                    <form
                      onSubmit={handleSubmitOffer}
                      className="space-y-4 rounded-2xl p-6"
                      style={{
                        border: "1px solid var(--brand-card-border)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <h3
                        className="font-light text-white/95 text-lg"
                        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                      >
                        Kontakt für Angebot
                      </h3>
                      <div>
                        <label htmlFor="lead-name" className="block text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">Name *</label>
                        <input id="lead-name" name="name" required className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[var(--brand-line-mid)]" placeholder="Ihr Name" />
                      </div>
                      <div>
                        <label htmlFor="lead-email" className="block text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">E-Mail *</label>
                        <input id="lead-email" name="email" type="email" required className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[var(--brand-line-mid)]" placeholder="ihre@email.de" />
                      </div>
                      <div>
                        <label htmlFor="lead-company" className="block text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">Unternehmen (optional)</label>
                        <input id="lead-company" name="company" className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[var(--brand-line-mid)]" placeholder="Firma" />
                      </div>
                      <div>
                        <label htmlFor="lead-message" className="block text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">Nachricht (optional)</label>
                        <textarea id="lead-message" name="message" rows={4} defaultValue={prefillMessage} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[var(--brand-line-mid)] resize-none" placeholder="Ihre Auswahl wird hier vorausgefüllt…" />
                      </div>
                      {formError && <p className="text-sm text-red-400">{formError}</p>}
                      <div className="flex flex-wrap gap-3">
                        <GhostButton type="submit" disabled={formSubmitting}>
                          {formSubmitting ? "Wird gesendet…" : pricingPage.offerSubmitLabel}
                        </GhostButton>
                        <GhostButton
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setShowOfferForm(false);
                            setFormError(null);
                          }}
                        >
                          Abbrechen
                        </GhostButton>
                      </div>
                    </form>
                  )}

                  {formSuccess && (
                    <div
                      className="rounded-2xl p-6 text-center"
                      style={{
                        border: "1px solid var(--brand-card-border)",
                        background: "var(--brand-glow-soft)",
                      }}
                    >
                      <p className="font-light" style={{ color: "var(--brand-primary)" }}>
                        {pricingPage.successMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}

            {step === 5 && !quote && (
                <p key="5-empty" className="text-white/55">
                  Bitte füllen Sie zuerst alle vorherigen Schritte aus.
                </p>
              )}

            {step < 5 && (
              <div className="mt-10 flex items-center justify-between gap-4">
                <GhostButton
                  type="button"
                  variant="secondary"
                  disabled={step === 0}
                  onClick={prevStep}
                >
                  Zurück
                </GhostButton>
                <GhostButton
                  type="button"
                  disabled={step === 5 || !canProceed()}
                  onClick={nextStep}
                >
                  {step === 4 ? "Zum Ergebnis" : "Weiter"}
                  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </GhostButton>
              </div>
            )}
          </div>

          <aside
            className="lg:col-span-1 lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)+7.5rem)] lg:self-start rounded-2xl p-5 sm:p-6"
            style={{
              minHeight: "200px",
              border: "1px solid var(--brand-card-border)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-medium text-white/70">Zusammenfassung</h3>
              <span
                className="relative text-white/50 hover:text-white/80 cursor-help text-xs font-medium"
                title="Basis nach Projektart, Umfang und Zeitrahmen; Features als feste Modul-Positionen; Risikopuffer für Integrationen und Unklarheiten."
                onMouseEnter={() => setShowWhyTooltip(true)}
                onMouseLeave={() => setShowWhyTooltip(false)}
              >
                Warum diese Kosten?
              </span>
            </div>
            {showWhyTooltip && (
              <p className="text-xs text-white/50 mb-3 p-2 rounded-lg bg-white/5">
                Basis nach Projektart, Umfang und Zeitrahmen; Features als Modul-Positionen; Risikopuffer für APIs, KI, Migration.
              </p>
            )}
            {quote ? (
              <>
                <p className="text-xl font-semibold text-white mb-1">
                  {formatPrice(quote.min)} – {formatPrice(quote.max)}
                </p>
                <p className="text-sm text-white/55 mb-4">
                  {quote.weeksMin}–{quote.weeksMax} Wochen
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {state.projectTypes?.map((pt) => (
                    <span key={pt} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80">
                      {PROJECT_TYPE_LABELS[pt]}
                    </span>
                  ))}
                  {state.scope && (
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80">
                      {SCOPE_LABELS[state.scope]}
                    </span>
                  )}
                  {state.timeframe && (
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80">
                      {TIMEFRAME_LABELS[state.timeframe]}
                    </span>
                  )}
                  {state.quality && (
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80">
                      {QUALITY_LABELS[state.quality]}
                    </span>
                  )}
                </div>
                <details className="text-sm text-white/65">
                  <summary className="cursor-pointer hover:text-white/80">Breakdown</summary>
                  <ul className="mt-2 space-y-1 pl-2">
                    {quote.items.map((item, i) => (
                      <li key={i}>
                        {item.label}: {formatPrice(item.amountMin)} – {formatPrice(item.amountMax)}
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="text-sm text-white/45">
                Wählen Sie Projektart, Umfang, Zeitrahmen und Qualität für eine Einschätzung.
              </p>
            )}
          </aside>
          </div>
        </div>
      </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
