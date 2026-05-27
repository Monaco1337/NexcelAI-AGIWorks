"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useBrand } from "@/contexts/BrandContext";

// ═══════════════════════════════════════════════════════════════
// TECH VISION LAB – Grid, Suchfeld, Filter/Tags, Projektkarten
// Content comes from BrandContext – see data/brands/*.ts
// ═══════════════════════════════════════════════════════════════

export default function TechVisionLabTeaser() {
  const brand = useBrand();
  const { headline, subtext, filterTags, projects } = brand.portfolio;
  const accentRgb = brand.theme.accentRgb;

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("Alle");

  const filtered = useMemo(() => {
    let list = projects;
    if (activeTag !== "Alle") {
      list = list.filter((p) => p.tags.includes(activeTag));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeTag, projects]);

  return (
    <section
      className="relative py-16 sm:py-20 lg:py-24 overflow-visible"
      aria-labelledby="techvision-heading"
      style={{
        background: `radial-gradient(ellipse 100% 70% at 50% 0%, rgba(${accentRgb},0.06) 0%, transparent 55%), linear-gradient(180deg, #0a0a0f 0%, #07070b 40%, #07070b 100%)`,
        isolation: "isolate",
      }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Headline */}
        <header className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2
            id="techvision-heading"
            className="text-xl sm:text-2xl lg:text-[1.75rem] font-medium text-white mb-3"
            style={{
              fontFamily: "var(--font-body), system-ui, sans-serif",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {headline}
          </h2>
          <p
            className="text-sm sm:text-[0.9375rem] text-white/55 leading-relaxed"
            style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
          >
            {subtext}
          </p>
        </header>

        {/* Suchfeld */}
        <div className="mb-6">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Projekte durchsuchen…"
            aria-label="Projekte durchsuchen"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/40 bg-white/[0.04] border border-white/[0.08] focus:outline-none"
            style={{
              fontFamily: "var(--font-body), system-ui, sans-serif",
              "--tw-ring-color": `rgba(${accentRgb},0.3)`,
            } as React.CSSProperties}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = `rgba(${accentRgb},0.5)`;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "";
            }}
          />
        </div>

        {/* Filter/Tags */}
        <div className="flex flex-wrap gap-2 mb-8 sm:mb-10">
          {filterTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200"
              style={{
                fontFamily: "var(--font-body), system-ui, sans-serif",
                background: activeTag === tag ? `rgba(${accentRgb},0.25)` : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeTag === tag ? `rgba(${accentRgb},0.5)` : "rgba(255,255,255,0.08)"}`,
                color: activeTag === tag ? "#fff" : "rgba(255,255,255,0.7)",
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid: Projektkarten */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-[#0d0d12] to-[#0a0a0c] transition-all duration-300 hover:-translate-y-0.5"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `rgba(${accentRgb},0.4)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
            >
              <div className="aspect-[16/10] relative">
                <Image
                  src={p.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
                {/* Badge for collaboration/product cards */}
                {p.badge && (
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white/90 backdrop-blur-sm"
                    style={{
                      background: p.category === "collaboration"
                        ? `rgba(${accentRgb},0.35)`
                        : `rgba(${accentRgb},0.45)`,
                      border: `1px solid rgba(${accentRgb},0.4)`,
                    }}
                  >
                    {p.badge}
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3
                  className="text-[15px] sm:text-base font-medium text-white/95 mb-1.5"
                  style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-[13px] sm:text-[13.5px] text-white/55 leading-snug mb-4"
                  style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
                >
                  {p.description}
                </p>
                <Link
                  href={p.href}
                  className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors"
                  style={{
                    fontFamily: "var(--font-body), system-ui, sans-serif",
                    color: `rgba(${accentRgb},0.95)`,
                  }}
                >
                  {p.cta}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p
            className="text-center text-white/40 text-sm py-8"
            style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
          >
            Keine Projekte zu dieser Suche oder diesem Filter.
          </p>
        )}
      </div>
    </section>
  );
}
