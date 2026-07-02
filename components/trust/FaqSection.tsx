"use client";

/**
 * Visible FAQ accordion + FAQPage JSON-LD.
 *
 * Policy: FAQPage structured data is emitted ONLY when the FAQ is actually
 * rendered (items present). The schema is built from the exact items shown, so
 * it can never describe content the user cannot see.
 */

import { useState } from "react";
import { faqSchema } from "@/lib/seo/jsonld";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { GradientHeading } from "@/components/templates/primitives";
import type { FaqItem } from "@/lib/templates/types";

export default function FaqSection({
  items,
  heading = "Häufige Fragen",
}: {
  items?: FaqItem[];
  heading?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items || items.length === 0) return null;

  return (
    <section className="relative px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-3xl">
        <GradientHeading className="mb-8">{heading}</GradientHeading>
        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl"
                style={{
                  border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white/90">{item.question}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-white/50 transition-transform"
                    style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-white/70">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <SeoJsonLd schema={faqSchema(items)} />
      </div>
    </section>
  );
}
