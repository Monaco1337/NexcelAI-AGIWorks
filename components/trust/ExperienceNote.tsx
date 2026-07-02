"use client";

/**
 * Experience / methodology note (E-E-A-T "Experience" + "Expertise").
 * Purely prop-driven and factual — the caller supplies real, verifiable
 * statements about how the work is done. No superlatives are added here.
 */

import { GlassCard } from "@/components/templates/primitives";

export default function ExperienceNote({
  title = "Arbeitsweise",
  paragraphs,
  points,
}: {
  title?: string;
  paragraphs?: string[];
  points?: string[];
}) {
  return (
    <GlassCard>
      <h3 className="text-lg font-light text-white/95">{title}</h3>
      {paragraphs?.map((p, i) => (
        <p key={i} className="mt-3 text-sm leading-relaxed text-white/70">
          {p}
        </p>
      ))}
      {points && points.length > 0 && (
        <ul className="mt-4 space-y-2">
          {points.map((pt, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/75">
              <span aria-hidden className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--brand-line-mid, rgba(180,140,255,0.6))" }}
              />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
