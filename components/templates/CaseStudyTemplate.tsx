"use client";

/**
 * Case study template. Challenge → approach → factual outcomes. Outcomes must be
 * real; the type has no field for invented metrics or ratings.
 */

import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import type { CaseStudyTemplateProps } from "@/lib/templates/types";

export default function CaseStudyTemplate(props: CaseStudyTemplateProps) {
  return (
    <TemplateFrame base={props} cta={{ label: "Ähnliches Projekt starten", href: "/kontakt" }}>
      {props.client && (
        <TemplateSection eyebrow="Kontext">
          <p className="text-sm text-white/60">Kunde / Kontext: {props.client}</p>
        </TemplateSection>
      )}

      <TemplateSection eyebrow="Herausforderung" heading="Ausgangslage">
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/70">{props.challenge}</p>
        </GlassCard>
      </TemplateSection>

      <TemplateSection eyebrow="Umsetzung" heading="Vorgehen">
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/70">{props.approach}</p>
        </GlassCard>
      </TemplateSection>

      {props.outcomes.length > 0 && (
        <TemplateSection eyebrow="Ergebnis" heading="Was dabei entstanden ist">
          <CardGrid>
            {props.outcomes.map((o, i) => (
              <GlassCard key={i}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{o.label}</div>
                <div className="mt-1 text-lg text-white/90">{o.value}</div>
              </GlassCard>
            ))}
          </CardGrid>
        </TemplateSection>
      )}
    </TemplateFrame>
  );
}
