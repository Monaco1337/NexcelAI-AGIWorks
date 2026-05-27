"use client";

import type { ReactNode } from "react";
import { WizardSignature } from "./WizardSignature";

type Props = {
  accentRgb: string;
  brandName: string;
  signatureProduct: string;
  stepIndex: number;
  totalSteps: number;
  /** Einheitlich mit „Schritt x von y“ im Formular (ohne Intro/Complete) */
  substantiveStep?: number;
  substantiveTotal?: number;
  stepLabel: string;
  stepSubtitle?: string;
  durationHint?: string;
  showProgress: boolean;
  centerIntroHeader?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export function WizardShell({
  accentRgb,
  brandName,
  signatureProduct,
  stepIndex,
  totalSteps,
  substantiveStep,
  substantiveTotal,
  stepLabel,
  stepSubtitle,
  durationHint,
  showProgress,
  centerIntroHeader = false,
  children,
  footer,
}: Props) {
  return (
    <div className="ds-app min-h-screen flex flex-col pt-[104px] text-white/95 sm:pt-[118px] lg:pt-[124px]">
      {/* Top bar — extra Oberabstand zur fixen Navbar */}
      <header
        className={
          centerIntroHeader
            ? "shrink-0 border-b border-white/[0.08] px-4 pb-3 pt-7 sm:px-6 sm:pb-3.5 sm:pt-9"
            : "shrink-0 border-b border-white/[0.08] px-4 pb-4 pt-7 sm:px-6 sm:pb-5 sm:pt-9"
        }
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,14,0.9) 0%, rgba(8,8,14,0.72) 58%, rgba(8,8,14,0.4) 100%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:max-w-4xl lg:max-w-5xl">
          {!centerIntroHeader ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-white/35">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: `rgb(${accentRgb.split(",").map((s) => s.trim()).join(",")})`,
                    boxShadow: `0 0 12px rgba(${accentRgb},0.7)`,
                  }}
                />
                <WizardSignature
                  accentRgb={accentRgb}
                  serviceLabel={signatureProduct}
                  brandName={brandName}
                  variant="header"
                />
              </div>
              {durationHint ? (
                <span className="text-xs text-white/40 tabular-nums">{durationHint}</span>
              ) : null}
            </div>
          ) : null}
          {showProgress ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Schritt</span>
                <span
                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/85"
                  style={{
                    borderColor: `rgba(${accentRgb},0.4)`,
                    background: `linear-gradient(145deg, rgba(${accentRgb},0.22), rgba(${accentRgb},0.1))`,
                    boxShadow: `0 0 18px rgba(${accentRgb},0.18)`,
                  }}
                >
                  {substantiveStep != null && substantiveTotal != null
                    ? `${substantiveStep}/${substantiveTotal}`
                    : `${stepIndex}/${totalSteps - 1}`}
                </span>
              </div>
            </div>
          ) : null}
          <div className={centerIntroHeader ? "text-center" : undefined}>
            <h1 className="font-medium text-xl tracking-tight text-white sm:text-2xl">
              {stepLabel}
            </h1>
            {stepSubtitle ? (
              <p
                className={`mt-1.5 text-sm leading-relaxed text-white/64 sm:text-[15px] ${centerIntroHeader ? "mx-auto max-w-3xl" : "max-w-2xl"}`}
              >
                {stepSubtitle}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <main
        className={
          centerIntroHeader
            ? "flex-1 px-4 pb-[var(--section-content-y)] pt-4 sm:px-6 sm:pt-5"
            : "ds-content-section flex-1 px-4 sm:px-6"
        }
      >
        <div className="mx-auto max-w-3xl sm:max-w-4xl lg:max-w-5xl">{children}</div>
      </main>

      {footer ? (
        <footer className="shrink-0 border-t border-white/[0.06] bg-[#050508] px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-3xl sm:max-w-4xl lg:max-w-5xl">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
