"use client";

/** Industry page template: challenges vs. solutions for a given industry. */

import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import { serviceSchema } from "@/lib/seo/jsonld";
import type { IndustryTemplateProps } from "@/lib/templates/types";

export default function IndustryTemplate(props: IndustryTemplateProps) {
  const schema = serviceSchema({
    brand: props.brand,
    name: `Digitale Systeme für ${props.industry}`,
    description: props.intro,
    url: props.canonicalUrl,
  });

  return (
    <TemplateFrame base={props} extraSchema={schema} cta={{ label: "Situation besprechen", href: "/kontakt" }}>
      <TemplateSection eyebrow="Ausgangslage" heading="Typische Herausforderungen">
        <CardGrid cols={2}>
          {props.challenges.map((c, i) => (
            <GlassCard key={i}>
              <h3 className="text-base font-medium text-white/95">{c.title}</h3>
              {c.description && (
                <p className="mt-2 text-sm leading-relaxed text-white/65">{c.description}</p>
              )}
            </GlassCard>
          ))}
        </CardGrid>
      </TemplateSection>

      <TemplateSection eyebrow="Ansatz" heading="Wie sich das lösen lässt">
        <CardGrid cols={2}>
          {props.solutions.map((s, i) => (
            <GlassCard key={i}>
              <h3 className="text-base font-medium text-white/95">{s.title}</h3>
              {s.description && (
                <p className="mt-2 text-sm leading-relaxed text-white/65">{s.description}</p>
              )}
            </GlassCard>
          ))}
        </CardGrid>
      </TemplateSection>
    </TemplateFrame>
  );
}
