"use client";

/**
 * Gemeinsame UI-Bausteine für das Vertriebsmodul.
 * Nur passive Anzeige-Elemente, keine Zustandslogik.
 */

import type { ReactNode } from "react";
import {
  CLASSIFICATION_COLOR,
  CLASSIFICATION_LABEL,
  SALES_STATUS_COLOR,
  SALES_STATUS_LABEL,
  BRAND_CONTEXT_LABEL,
  type BrandContext,
  type SalesClassification,
  type SalesStatus,
} from "./shared";

export function Pill({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}12`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}

export function ClassificationBadge({
  value,
}: {
  value: SalesClassification | null;
}) {
  if (!value) return <span className="text-[11px] text-white/40">—</span>;
  const color = CLASSIFICATION_COLOR[value];
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold"
      style={{
        color,
        borderColor: `${color}66`,
        borderWidth: 1,
        background: `${color}18`,
      }}
      title={CLASSIFICATION_LABEL[value]}
    >
      {value}
    </span>
  );
}

export function StatusPill({ value }: { value: SalesStatus }) {
  return <Pill color={SALES_STATUS_COLOR[value]}>{SALES_STATUS_LABEL[value]}</Pill>;
}

export function BrandChip({ value }: { value: BrandContext }) {
  const color = value === "agiworks" ? "#F0FDF4" : value === "both" ? "#A78BFA" : "#0091C2";
  return <Pill color={color}>{BRAND_CONTEXT_LABEL[value]}</Pill>;
}

export function Section({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="text-sm font-medium text-white/70">{title}</div>
      {hint && <div className="max-w-md text-xs text-white/40">{hint}</div>}
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/45">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}

export const inputClasses =
  "w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25 focus:bg-black/60";

export const selectClasses =
  "w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-white/25";

export const textareaClasses =
  "w-full min-h-[100px] rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25 focus:bg-black/60";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40";

export const buttonGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white";

export function DangerButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
