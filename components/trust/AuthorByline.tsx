"use client";

/**
 * Author byline (E-E-A-T). Shows the real, legally responsible person behind the
 * content and links to the Impressum. Factual only — sourced from the SEO brand
 * config; no invented credentials.
 */

import Link from "next/link";
import { useBrand } from "@/contexts/BrandContext";
import { getBrandConfig } from "@/config/seo/brands";
import { personSchema } from "@/lib/seo/jsonld";
import SeoJsonLd from "@/components/seo/SeoJsonLd";

export default function AuthorByline({
  role = "Inhaltlich verantwortlich",
  note,
  emitSchema = false,
}: {
  role?: string;
  note?: string;
  /** Emit Person JSON-LD (use once per page at most). */
  emitSchema?: boolean;
}) {
  const brand = useBrand();
  const cfg = getBrandConfig(brand.id);

  return (
    <div
      className="flex flex-col gap-1 rounded-2xl px-5 py-4 text-sm"
      style={{
        border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">{role}</span>
      </div>
      <div className="text-white/85">
        <span className="font-medium text-white/95">{cfg.primaryOwner}</span>
        <span className="text-white/40"> · {cfg.publicName}</span>
      </div>
      {note && <p className="mt-1 text-white/55">{note}</p>}
      <Link
        href="/impressum"
        className="mt-1 w-fit text-xs text-white/45 underline-offset-4 transition-colors hover:text-white/75 hover:underline"
      >
        Anbieterkennzeichnung / Impressum
      </Link>
      {emitSchema && <SeoJsonLd schema={personSchema(brand.id)} />}
    </div>
  );
}
