"use client";

import type { ReactNode } from "react";
import Link from "@/components/BrandAwareLink";
import { track } from "@/lib/track";

/** Brand-aware typographic primitives. No aggressive scroll-reveal motion. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="v6-label">{children}</span>;
}

export function GradientHeading({
  children,
  as = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const Tag = as;
  return <Tag className={`${as === "h1" ? "v6-h1" : as === "h2" ? "v6-h2" : "v6-h3"} ${className}`}>
    {children}
  </Tag>;
}

export function TemplateSection({
  eyebrow,
  heading,
  intro,
  children,
  id,
}: {
  eyebrow?: ReactNode;
  heading?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  id?: string;
  compact?: boolean;
}) {
  return <section id={id} className="v6-template-section">
    <div className="v6-template-container mx-auto px-5 sm:px-8">
      {(eyebrow || heading || intro) && <div className="v6-template-head">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {typeof heading === "string" ? <GradientHeading>{heading}</GradientHeading> : heading}
        {intro && <p className="mt-5 text-base leading-[1.8] text-white/75">{intro}</p>}
      </div>}
      <div className="v6-template-content">{children}</div>
    </div>
  </section>;
}

/** Accessible unboxed content surface; no decorative card chrome. */
export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`v6-open-card ${className}`}>{children}</div>;
}

export function CardGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`v6-card-grid grid grid-cols-1 ${cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
    {children}
  </div>;
}

/** Existing analytics event + internal route preserved. */
export function TemplateCta({
  label,
  href,
  eventName = "template_cta_click",
  meta,
  variant = "primary",
}: {
  label: string;
  href: string;
  eventName?: string;
  meta?: Record<string, unknown>;
  variant?: "primary" | "ghost";
}) {
  return <Link
    href={href}
    onClick={() => track(eventName, { meta: { href, ...meta } })}
    className={`v6-button ${variant === "primary" ? "v6-button-primary" : "v6-button-secondary"}`}
  >{label}</Link>;
}
