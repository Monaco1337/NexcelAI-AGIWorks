"use client";

import type { ReactNode } from "react";

type Props = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  hint?: string;
  className?: string;
  accentRgb: string;
};

export function SelectableTile({
  selected,
  onClick,
  children,
  hint,
  className = "",
  accentRgb,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full text-left rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4
        transition-all duration-200 ease-out hover:-translate-y-[1px]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060c]
        ${className}
      `}
      style={{
        background: selected
          ? `linear-gradient(145deg, rgba(${accentRgb},0.18) 0%, rgba(${accentRgb},0.08) 100%)`
          : "linear-gradient(155deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: `1px solid ${selected ? `rgba(${accentRgb},0.45)` : "rgba(255,255,255,0.08)"}`,
        boxShadow: selected
          ? `0 0 0 1px rgba(${accentRgb},0.16), 0 16px 42px -16px rgba(${accentRgb},0.32)`
          : "0 8px 28px rgba(0,0,0,0.26)",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors"
          style={{
            borderColor: selected ? `rgba(${accentRgb},0.6)` : "rgba(255,255,255,0.15)",
            background: selected ? `rgba(${accentRgb},0.25)` : "transparent",
          }}
          aria-hidden
        >
          {selected && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] sm:text-[15px] font-medium text-white/95 leading-snug">{children}</span>
          {hint ? (
            <span className="mt-1 block text-xs text-white/40 leading-relaxed">{hint}</span>
          ) : null}
        </span>
      </div>
    </button>
  );
}
