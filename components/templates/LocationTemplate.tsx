"use client";

/**
 * Location page template. Presents a real service area with genuine local
 * context. It does NOT claim a public office — the address stays a legal
 * address (see LOCAL_SEO_POLICY). `area` is a service-area statement.
 */

import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import { serviceSchema } from "@/lib/seo/jsonld";
import type { LocationTemplateProps } from "@/lib/templates/types";

export default function LocationTemplate(props: LocationTemplateProps) {
  const schema = serviceSchema({
    brand: props.brand,
    name: `Digitale Systeme in ${props.area}`,
    description: props.intro,
    url: props.canonicalUrl,
    areaServed: [props.area],
  });

  return (
    <TemplateFrame base={props} extraSchema={schema} cta={{ label: "Anfrage aus der Region", href: "/kontakt" }}>
      <TemplateSection eyebrow={`Region · ${props.area}`} heading="Warum die Region zählt">
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/70">{props.localContext}</p>
        </GlassCard>
      </TemplateSection>

      <TemplateSection eyebrow="Leistungen" heading={`Was wir für ${props.area} umsetzen`}>
        <CardGrid>
          {props.services.map((s, i) => (
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
