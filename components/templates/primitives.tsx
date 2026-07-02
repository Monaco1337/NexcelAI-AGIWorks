"use client";

/**
 * Shared, brand-aware primitives for the Phase 4 template components.
 * Keep templates DRY: section shells, headings, glass cards and the conversion
 * CTA all live here and inherit the active brand's CSS variables.
 */

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/track";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[11px] uppercase tracking-[0.22em] text-white/45 mb-3">
      {children}
    </span>
  );
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
  const size =
    as === "h1"
      ? "text-4xl md:text-5xl lg:text-6xl"
      : as === "h2"
      ? "text-3xl md:text-4xl"
      : "text-xl md:text-2xl";
  return (
    <Tag
      className={`font-light tracking-tight text-white/95 ${size} ${className}`}
      style={{
        backgroundImage:
          "var(--brand-headline-gradient, linear-gradient(to right, #F1E9FF, #C6A8FF, #8A5CFF))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </Tag>
  );
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
}) {
  return (
    <section id={id} className="relative px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-5xl">
        {(eyebrow || heading || intro) && (
          <motion.div className="mb-10 max-w-3xl" {...reveal}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {heading && typeof heading === "string" ? (
              <GradientHeading>{heading}</GradientHeading>
            ) : (
              heading
            )}
            {intro && <p className="mt-4 text-base leading-relaxed text-white/70">{intro}</p>}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-6 transition-colors ${className}`}
      style={{
        border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {children}
    </div>
  );
}

export function CardGrid({
  children,
  cols = 3,
}: {
  children: ReactNode;
  cols?: 2 | 3;
}) {
  const grid = cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid grid-cols-1 gap-4 ${grid}`}>{children}</div>;
}

/**
 * Brand-aware conversion CTA. Fires a tracked event (respecting the existing
 * analytics pipeline) and links to an internal route.
 */
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
  const base =
    "inline-flex items-center justify-center rounded-xl px-8 py-4 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]";
  const style =
    variant === "primary"
      ? {
          background: "var(--brand-wash, rgba(138,92,255,0.16))",
          border: "1px solid var(--brand-line-mid, rgba(180,140,255,0.45))",
          color: "rgba(255,255,255,0.95)",
        }
      : {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
          color: "rgba(255,255,255,0.85)",
        };
  return (
    <Link
      href={href}
      onClick={() => track(eventName, { meta: { href, ...meta } })}
      className={base}
      style={style}
    >
      {label}
    </Link>
  );
}
