"use client";

/**
 * Trust strip (E-E-A-T) — factual trust signals only.
 *
 * Sources everything from the SEO brand config + registered legal address. It
 * NEVER renders ratings, review counts, fake certifications, awards or opening
 * hours. `areaServed` is shown as a service-area statement, not an office claim.
 */

import { useBrand } from "@/contexts/BrandContext";
import { getBrandConfig } from "@/config/seo/brands";
import { getBusinessLocation } from "@/config/businessLocations";

interface Signal {
  label: string;
  value: string;
}

export default function TrustStrip() {
  const brand = useBrand();
  const cfg = getBrandConfig(brand.id);
  const loc = getBusinessLocation(brand.id);

  const signals: Signal[] = [
    { label: "Verantwortlich", value: cfg.primaryOwner },
    { label: "Sitz", value: `${loc.city}, ${loc.region}` },
    { label: "Service-Region", value: cfg.areaServed.slice(0, 3).join(" · ") },
    { label: "Kontakt", value: cfg.email },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {signals.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl px-5 py-4"
          style={{
            border: "1px solid var(--brand-card-border, rgba(255,255,255,0.10))",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{s.label}</div>
          <div className="mt-1 break-words text-sm text-white/85">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
