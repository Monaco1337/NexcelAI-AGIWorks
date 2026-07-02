"use client";

/**
 * Comparison template. Neutral, factual comparison across options with a
 * balanced conclusion — no "we are the best" framing (blocked by content rules).
 */

import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard } from "./primitives";
import type { ComparisonTemplateProps } from "@/lib/templates/types";

export default function ComparisonTemplate(props: ComparisonTemplateProps) {
  return (
    <TemplateFrame base={props} cta={{ label: "Einschätzung anfragen", href: "/kontakt" }}>
      <TemplateSection eyebrow="Gegenüberstellung" heading="Optionen im Vergleich">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Kriterium
                </th>
                {props.options.map((o) => (
                  <th
                    key={o.id}
                    className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-white/60"
                  >
                    {o.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderTop: "1px solid var(--brand-card-border, rgba(255,255,255,0.08))" }}
                >
                  <td className="px-4 py-3 text-white/80">{row.criterion}</td>
                  {props.options.map((o) => (
                    <td key={o.id} className="px-4 py-3 text-white/65">
                      {row.values[o.id] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TemplateSection>

      <TemplateSection eyebrow="Fazit" heading="Einordnung">
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/70">{props.conclusion}</p>
        </GlassCard>
      </TemplateSection>
    </TemplateFrame>
  );
}
