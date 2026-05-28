"use client";

import { useEffect, useRef, useCallback, useId, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const PROJEKTART_OPTIONS = [
  { id: "ki", label: "KI-Integration" },
  { id: "app", label: "App" },
  { id: "web", label: "Web" },
  { id: "automatisierung", label: "Automatisierung" },
  { id: "sonstiges", label: "Sonstiges" },
];

const FEATURES_OPTIONS = [
  { id: "api", label: "API-Integration" },
  { id: "dashboard", label: "Dashboard" },
  { id: "mobile", label: "Mobile App" },
  { id: "ki-modul", label: "KI-Modul" },
  { id: "reporting", label: "Reporting" },
  { id: "workflow", label: "Workflow-Automatisierung" },
];

const ZEITRAHMEN_OPTIONS = [
  { id: "asap", label: "ASAP" },
  { id: "standard", label: "Standard" },
  { id: "relaxed", label: "Relaxed" },
];

const QUALITAET_OPTIONS = [
  { id: "startup", label: "Startup" },
  { id: "professional", label: "Professional" },
  { id: "elite", label: "Elite" },
];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface PricingWizardState {
  step: 1 | 2 | 3 | 4;
  projektart: string;
  features: string[];
  zeitrahmen: string;
  qualitaet: string;
}

// ═══════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════

interface PricingWizardModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PricingWizardModal({ open, onClose }: PricingWizardModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const dialogId = useId();
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PricingWizardState>({
    step: 1,
    projektart: "",
    features: [],
    zeitrahmen: "",
    qualitaet: "",
  });

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Focus: move into dialog on open
  useEffect(() => {
    if (!open) return;
    const el = contentRef.current?.querySelector<HTMLElement>("button, [href]");
    el?.focus();
  }, [open]);

  // ESC + focus trap (Tab / Shift+Tab)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = contentRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])")
      ).filter((el) => el.offsetParent != null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  // Click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const goNext = () => {
    if (state.step < 4) setState((s) => ({ ...s, step: (s.step + 1) as 1 | 2 | 3 | 4 }));
  };

  const goBack = () => {
    if (state.step > 1) setState((s) => ({ ...s, step: (s.step - 1) as 1 | 2 | 3 | 4 }));
  };

  const resetAndClose = () => {
    setState({ step: 1, projektart: "", features: [], zeitrahmen: "", qualitaet: "" });
    onClose();
  };

  const toggleFeature = (id: string) => {
    setState((s) => ({
      ...s,
      features: s.features.includes(id) ? s.features.filter((f) => f !== id) : [...s.features, id],
    }));
  };

  // Placeholder-Preis
  const priceLabel = "ab 0 €";

  if (!open) return null;

  const base = isDark
    ? "bg-[#0c0c10]/95 backdrop-blur-xl border border-white/[0.06]"
    : "bg-white/95 backdrop-blur-xl border border-black/[0.06]";
  const btnPrimary =
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30";
  const btnPrimaryStyle = isDark
    ? "bg-[#5B21B6] text-white hover:bg-[#6D28D9]"
    : "bg-[#6D28D9] text-white hover:bg-[#7C3AED]";
  const btnSecondary =
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 " +
    (isDark ? "text-white/60 hover:text-white/80" : "text-gray-500 hover:text-gray-700");

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
        }}
        aria-hidden
      />

      {/* Dialog */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        id={dialogId}
        tabIndex={-1}
        className={`relative w-full max-w-md rounded-2xl shadow-2xl ${base}`}
        style={{
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)"
            : "0 25px 50px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.03)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 ${
            isDark ? "text-white/40 hover:text-white/70 hover:bg-white/[0.06]" : "text-gray-400 hover:text-gray-600 hover:bg-black/[0.04]"
          }`}
          aria-label="Schließen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 pt-14 pb-8">
          <h2 id={titleId} className={`text-lg font-medium mb-6 ${isDark ? "text-white/90" : "text-gray-900"}`}>
            Preiskalkulator
          </h2>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  s <= state.step ? (isDark ? "bg-white/30" : "bg-gray-400") : isDark ? "bg-white/10" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Projektart */}
          {state.step === 1 && (
            <div className="space-y-4">
              <label className={`block text-sm font-medium ${isDark ? "text-white/70" : "text-gray-600"}`}>
                Projektart
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROJEKTART_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, projektart: o.id }))}
                    className={`px-4 py-2.5 rounded-lg text-left text-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 ${
                      state.projektart === o.id
                        ? isDark
                          ? "border-purple-500/50 bg-purple-500/10 text-white"
                          : "border-purple-500/50 bg-purple-500/5 text-gray-900"
                        : isDark
                          ? "border-white/[0.08] bg-white/[0.02] text-white/80 hover:bg-white/[0.04]"
                          : "border-black/[0.06] bg-black/[0.01] text-gray-700 hover:bg-black/[0.02]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Features (optional) */}
          {state.step === 2 && (
            <div className="space-y-4">
              <label className={`block text-sm font-medium ${isDark ? "text-white/70" : "text-gray-600"}`}>
                Projektdetails / Features{" "}
                <span className={`font-normal ${isDark ? "text-white/40" : "text-gray-400"}`}>(optional)</span>
              </label>
              <div className="space-y-2">
                {FEATURES_OPTIONS.map((o) => (
                  <label
                    key={o.id}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      state.features.includes(o.id)
                        ? isDark
                          ? "border-purple-500/40 bg-purple-500/08"
                          : "border-purple-500/40 bg-purple-500/5"
                        : isDark
                          ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                          : "border-black/[0.06] bg-black/[0.01] hover:bg-black/[0.02]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state.features.includes(o.id)}
                      onChange={() => toggleFeature(o.id)}
                      className="rounded border-white/20 text-purple-500 focus:ring-purple-500/30"
                    />
                    <span className={`text-sm ${isDark ? "text-white/85" : "text-gray-800"}`}>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Zeitrahmen + Qualität */}
          {state.step === 3 && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white/70" : "text-gray-600"}`}>
                  Zeitrahmen
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ZEITRAHMEN_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, zeitrahmen: o.id }))}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 ${
                        state.zeitrahmen === o.id
                          ? isDark ? "border-purple-500/50 bg-purple-500/10" : "border-purple-500/50 bg-purple-500/5"
                          : isDark ? "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]" : "border-black/[0.06] bg-black/[0.01] hover:bg-black/[0.02]"
                      } ${isDark ? "text-white/90" : "text-gray-800"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white/70" : "text-gray-600"}`}>
                  Qualitätsstufe
                </label>
                <div className="flex gap-2 flex-wrap">
                  {QUALITAET_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, qualitaet: o.id }))}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 ${
                        state.qualitaet === o.id
                          ? isDark ? "border-purple-500/50 bg-purple-500/10" : "border-purple-500/50 bg-purple-500/5"
                          : isDark ? "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]" : "border-black/[0.06] bg-black/[0.01] hover:bg-black/[0.02]"
                      } ${isDark ? "text-white/90" : "text-gray-800"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Zusammenfassung + CTA */}
          {state.step === 4 && (
            <div className="space-y-6">
              <div className={`rounded-xl p-4 ${isDark ? "bg-white/[0.04] border border-white/[0.06]" : "bg-black/[0.02] border border-black/[0.05]"}`}>
                <div className={`text-2xl font-medium mb-4 ${isDark ? "text-white/90" : "text-gray-900"}`}>
                  {priceLabel}
                </div>
                <dl className="space-y-2 text-sm">
                  <SummaryRow isDark={isDark} label="Projektart" value={PROJEKTART_OPTIONS.find((o) => o.id === state.projektart)?.label ?? "—"} />
                  <SummaryRow isDark={isDark} label="Features" value={state.features.length ? state.features.map((f) => FEATURES_OPTIONS.find((o) => o.id === f)?.label).filter(Boolean).join(", ") : "—"} />
                  <SummaryRow isDark={isDark} label="Zeitrahmen" value={ZEITRAHMEN_OPTIONS.find((o) => o.id === state.zeitrahmen)?.label ?? "—"} />
                  <SummaryRow isDark={isDark} label="Qualität" value={QUALITAET_OPTIONS.find((o) => o.id === state.qualitaet)?.label ?? "—"} />
                </dl>
              </div>
              <a
                href="/kontakt"
                onClick={resetAndClose}
                className={`inline-flex items-center justify-center w-full py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 ${btnPrimaryStyle}`}
              >
                Unverbindliches Angebot anfordern
              </a>
            </div>
          )}

          {/* Footer: Prev / Next */}
          {state.step < 4 && (
            <div className={`flex justify-between mt-8 pt-6 border-t ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <button type="button" onClick={state.step === 1 ? onClose : goBack} className={btnSecondary}>
                {state.step === 1 ? "Abbrechen" : "Zurück"}
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={state.step === 1 && !state.projektart}
                className={`${btnPrimary} ${btnPrimaryStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Weiter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={isDark ? "text-white/45" : "text-gray-500"}>{label}</dt>
      <dd className={isDark ? "text-white/80" : "text-gray-800"}>{value}</dd>
    </div>
  );
}
