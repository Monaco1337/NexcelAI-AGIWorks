"use client";

/**
 * Cost / pricing-orientation template. `priceHint` values are honest
 * orientations ("ab X €"), never guaranteed prices. Includes a factors note so
 * expectations stay realistic.
 */

import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import type { CostTemplateProps } from "@/lib/templates/types";

export default function CostTemplate(props: CostTemplateProps) {
  return (
    <TemplateFrame base={props} cta={{ label: "Preis kalkulieren", href: "/preiskalkulator" }}>
      <TemplateSection eyebrow="Orientierung" heading="Kostenrahmen">
        <CardGrid>
          {props.tiers.map((tier, i) => (
            <GlassCard key={i}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{tier.name}</div>
              <div className="mt-2 text-2xl font-light text-white/95">{tier.priceHint}</div>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{tier.summary}</p>
              <ul className="mt-4 space-y-2">
                {tier.includes.map((inc, j) => (
                  <li key={j} className="flex gap-2 text-sm text-white/75">
                    <span
                      aria-hidden
                      className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--brand-line-mid, rgba(180,140,255,0.6))" }}
                    />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </CardGrid>
      </TemplateSection>

      <TemplateSection eyebrow="Transparenz" heading="Was den Preis bestimmt">
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/70">{props.factorsNote}</p>
        </GlassCard>
      </TemplateSection>
    </TemplateFrame>
  );
}
