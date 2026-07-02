"use client";

/**
 * Knowledge / editorial template (AEO/GEO). Renders long-form sections with a
 * real author byline and Article JSON-LD. Ideal for answer-engine visibility.
 */

import TemplateFrame from "./TemplateFrame";
import { TemplateSection } from "./primitives";
import { articleSchema } from "@/lib/seo/jsonld";
import type { KnowledgeTemplateProps } from "@/lib/templates/types";

export default function KnowledgeTemplate(props: KnowledgeTemplateProps) {
  const schema = articleSchema({
    brand: props.brand,
    headline: props.title,
    description: props.intro,
    url: props.canonicalUrl,
    authorName: props.authorName,
    datePublished: props.datePublished,
    dateModified: props.dateModified,
  });

  return (
    <TemplateFrame
      base={props}
      extraSchema={schema}
      emitAuthorSchema
      cta={{ label: "Frage zum Thema stellen", href: "/kontakt" }}
    >
      {props.sections.map((sec, i) => (
        <TemplateSection key={i} heading={sec.heading}>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-white/70">
            {sec.body.split("\n\n").map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </div>
        </TemplateSection>
      ))}
    </TemplateFrame>
  );
}
