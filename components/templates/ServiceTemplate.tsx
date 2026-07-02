"use client";

/** Service page template: features + optional process + Service JSON-LD. */

import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import { serviceSchema } from "@/lib/seo/jsonld";
import type { ServiceTemplateProps } from "@/lib/templates/types";

export default function ServiceTemplate(props: ServiceTemplateProps) {
  const schema = serviceSchema({
    brand: props.brand,
    name: props.serviceName,
    description: props.intro,
    url: props.canonicalUrl,
    serviceType: props.serviceName,
    areaServed: props.areaServed,
  });

  return (
    <TemplateFrame base={props} extraSchema={schema} cta={{ label: "Leistung anfragen", href: "/kontakt" }}>
      <TemplateSection eyebrow="Leistungsumfang" heading="Was enthalten ist">
        <CardGrid>
          {props.features.map((f, i) => (
            <GlassCard key={i}>
              <h3 className="text-base font-medium text-white/95">{f.title}</h3>
              {f.description && (
                <p className="mt-2 text-sm leading-relaxed text-white/65">{f.description}</p>
              )}
            </GlassCard>
          ))}
        </CardGrid>
      </TemplateSection>

      {props.process && props.process.length > 0 && (
        <TemplateSection eyebrow="Ablauf" heading="Wie wir vorgehen">
          <ol className="space-y-4">
            {props.process.map((step, i) => (
              <li key={i}>
                <GlassCard>
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm text-white/40">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-base font-medium text-white/95">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{step.description}</p>
                </GlassCard>
              </li>
            ))}
          </ol>
        </TemplateSection>
      )}
    </TemplateFrame>
  );
}
