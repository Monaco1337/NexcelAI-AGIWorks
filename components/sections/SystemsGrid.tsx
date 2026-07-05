"use client";

/**
 * NEXCEL AI / AGI WORKS · SystemsGrid
 *
 * – Desktop (lg+)  : 4-Spalten-Grid, unverändert
 * – Mobile/Tablet  : Premium Swipe-Slider (CSS scroll-snap + Touch)
 *                    mit Dot-Pagination, Card-Counter & Peek-Effekt
 */

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SYSTEMS, type SystemSlug } from "@/lib/systems-data";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";

type CategoryId = "vertrieb" | "kunden" | "unternehmen" | "ki" | "plattformen";

/**
 * "Nach Ziel" — fünf Kategorien, bevor die konkreten Systeme erscheinen.
 * Ein Geschäftsführer wählt zuerst ein Ziel, dann sieht er die passenden Systeme.
 * Jedes der 8 Systeme ist genau einer Kategorie zugeordnet (keine Überschneidung).
 */
const CATEGORIES: { id: CategoryId; label: string; bullets: string[]; icon: React.ReactNode; slugs: SystemSlug[] }[] = [
  {
    id: "vertrieb",
    label: "Vertrieb",
    bullets: ["Lead & CRM", "Partner", "Angebote"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />
      </svg>
    ),
    slugs: ["lead-funnels-crm", "vertriebsplattform-partnerportal", "angebots-beratungssystem"],
  },
  {
    id: "kunden",
    label: "Kunden",
    bullets: ["Portale", "Buchung", "Support"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
    slugs: ["kundenportal-self-service", "buchungs-beauty-systeme", "mitglieder-clubverwaltung", "service-supportportal", "omnichannel-kommunikation"],
  },
  {
    id: "unternehmen",
    label: "Unternehmen",
    bullets: ["ERP", "HR", "Operations"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="4" y="3" width="16" height="18" rx="1.6" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h6" />
      </svg>
    ),
    slugs: ["erp-systeme", "admin-operations-system", "dokumentenmanagement-freigaben", "projekt-aufgabenmanagement", "mitarbeiter-hr-system", "warenwirtschaft-lagerverwaltung", "termin-schichtplanung", "dashboard-reporting", "recruiting-bewerberplattform"],
  },
  {
    id: "ki",
    label: "KI",
    bullets: ["Agenten", "Voice", "Automatisierung"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
      </svg>
    ),
    slugs: ["ki-automatisierung", "ki-telefonagent-voice"],
  },
  {
    id: "plattformen",
    label: "Plattformen",
    bullets: ["SaaS", "Akademie", "Branchen"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="8" height="8" rx="1.4" /><rect x="13" y="4" width="8" height="5" rx="1.4" /><rect x="13" y="11" width="8" height="9" rx="1.4" /><rect x="3" y="14" width="8" height="6" rx="1.4" />
      </svg>
    ),
    slugs: ["premium-websysteme", "branchen-plattformen", "saas-plattform-multi-tenant", "akademie-lernplattform", "schnittstellen-integrationen"],
  },
];

export default function SystemsGrid() {
  const brand = useBrand();
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);

  const detailHref = (slug: string) =>
    resolveBrandNavHref(`/systeme/${slug}`, brand.id);

  const visibleSystems = useMemo(() => {
    if (!activeCategory) return SYSTEMS;
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat) return SYSTEMS;
    return SYSTEMS.filter((s) => cat.slugs.includes(s.slug));
  }, [activeCategory]);

  return (
    <section
      id="systeme"
      className="relative w-full overflow-hidden scroll-mt-[108px] py-20 sm:py-28 lg:py-36"
      style={{
        background:
          "linear-gradient(to bottom, rgba(5,3,14,0.92) 0%, transparent 15%, transparent 85%, rgba(5,3,14,0.92) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="px-5 sm:px-8">
          <SectionHeading
            eyebrow="Unsere Lösungen"
            title="Wählen Sie Ihr Ziel."
            subtitle="Jedes Ziel führt zu den passenden Systemen — konkret, nicht generisch."
          />
        </div>

        {/* ── Nach Ziel: 5 Kategorien ── */}
        <div className="mt-10 grid grid-cols-2 gap-3 px-5 sm:grid-cols-3 sm:px-8 lg:grid-cols-5 lg:gap-4">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory((p) => (p === cat.id ? null : cat.id))}
                aria-pressed={isActive}
                className="group relative flex flex-col items-start gap-2.5 rounded-2xl p-4 text-left transition-all duration-300 sm:p-5"
                style={{
                  background: isActive
                    ? "color-mix(in srgb, var(--accent) 12%, rgba(255,255,255,0.03))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)",
                  border: `1px solid ${isActive ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--brand-card-border)"}`,
                  boxShadow: isActive ? "0 8px 24px color-mix(in srgb, var(--accent) 16%, transparent)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: isActive ? "var(--accent)" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {cat.icon}
                </span>
                <span className="text-[14.5px] font-medium text-white" style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}>
                  {cat.label}
                </span>
                <span className="text-[11.5px] leading-snug text-white/45">
                  {cat.bullets.join(" · ")}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Mobile / Tablet: Swipe Slider (< lg) ── */}
        <div className="mt-10 block lg:hidden">
          <MobileSlider systems={visibleSystems} detailHref={detailHref} />
        </div>

        {/* ── Desktop: 4-Spalten-Grid (lg+) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory ?? "alle"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-10 hidden px-5 sm:px-8 lg:grid lg:grid-cols-4 lg:gap-5"
          >
            {visibleSystems.map((card, i) => (
              <DesktopCard
                key={card.slug}
                card={card}
                index={i}
                detailHref={detailHref(card.slug)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Mobile Swipe Slider
───────────────────────────────────────────────────────── */
function MobileSlider({
  systems,
  detailHref,
}: {
  systems: typeof SYSTEMS;
  detailHref: (slug: string) => string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const total = systems.length;

  useEffect(() => {
    setActiveIdx(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [systems]);

  /* Track which card is most centered as user scrolls */
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / total;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIdx(Math.min(Math.max(idx, 0), total - 1));
  }, [total]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const scrollTo = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / total;
    el.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
  };

  const prev = () => scrollTo(Math.max(activeIdx - 1, 0));
  const next = () => scrollTo(Math.min(activeIdx + 1, total - 1));

  return (
    <div className="relative select-none">
      {/* ── Scroll Track ── */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-scroll pb-1"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          /* Left padding = page gutter; right padding creates trailing peek space */
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        {systems.map((card, i) => (
          <SliderCard
            key={card.slug}
            card={card}
            index={i}
            isActive={i === activeIdx}
            detailHref={detailHref(card.slug)}
          />
        ))}
      </div>

      {/* ── Faded Edge Mask – hides half of next card to keep it clean ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10"
        style={{
          background:
            "linear-gradient(to left, rgba(5,3,14,0.88) 0%, transparent 100%)",
        }}
      />

      {/* ── Bottom Controls: Counter + Dots + Arrows ── */}
      <div className="mt-6 flex items-center justify-between px-5 sm:px-8">
        {/* Counter */}
        <span
          className="text-[11px] font-medium tabular-nums tracking-[0.18em] text-white/35"
          aria-live="polite"
          aria-label={`Karte ${activeIdx + 1} von ${total}`}
        >
          {String(activeIdx + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(total).padStart(2, "0")}
        </span>

        {/* Dot Pagination */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Systeme Navigation">
          {systems.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`System ${i + 1}`}
              onClick={() => scrollTo(i)}
              className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              style={{
                width: i === activeIdx ? "22px" : "6px",
                background:
                  i === activeIdx
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>

        {/* Arrow Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={activeIdx === 0}
            aria-label="Vorheriges System"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-30"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={next}
            disabled={activeIdx === total - 1}
            aria-label="Nächstes System"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-30"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Einzelne Slider-Karte (Mobile)
───────────────────────────────────────────────────────── */
type CardData = (typeof SYSTEMS)[number];

function SliderCard({
  card,
  index,
  isActive,
  detailHref,
}: {
  card: CardData;
  index: number;
  isActive: boolean;
  detailHref: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
      /* 82vw on mobile → shows ~1 card + peek of next; 44vw on sm → ~2 cards */
      className="relative flex w-[82vw] flex-none snap-start flex-col overflow-hidden rounded-2xl sm:w-[44vw]"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
        border: `1px solid ${isActive ? "rgba(var(--accent-rgb, 168,85,247),0.35)" : "var(--brand-card-border)"}`,
        boxShadow: isActive
          ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(var(--accent-rgb,168,85,247),0.12)"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Image — größer, dominant */}
      <Link
        href={detailHref}
        aria-label={`${card.title} — Details ansehen`}
        className="group/img relative block w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={card.image}
            alt={card.alt}
            fill
            sizes="82vw"
            className="object-cover object-top transition-transform duration-[600ms] ease-out group-hover/img:scale-[1.04]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/img:opacity-100"
            style={{
              background: "linear-gradient(to top, rgba(3,2,10,0.55) 0%, transparent 55%)",
            }}
          />
        </div>
      </Link>

      {/* Text — reduziert auf das Wesentliche */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              border: "1px solid var(--brand-card-border)",
              color: "var(--accent)",
            }}
          >
            {card.icon}
          </span>
          <h3
            className="text-[14.5px] font-medium leading-snug text-white"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            {card.title}
          </h3>
        </div>
        <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-[1.6] text-white/55">
          {card.desc}
        </p>
        <Link
          href={detailHref}
          className="group/cta mt-4 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-semibold transition-all duration-300"
          style={{
            background: "color-mix(in srgb, var(--accent) 14%, rgba(255,255,255,0.03))",
            border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
            color: "#fff",
          }}
        >
          System ansehen
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform duration-300 group-hover/cta:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────────────────
   Desktop Card (unverändert)
───────────────────────────────────────────────────────── */
function DesktopCard({
  card,
  index,
  detailHref,
}: {
  card: CardData;
  index: number;
  detailHref: string;
}) {
  return (
    <motion.article
      key={card.slug}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      whileHover={{
        y: -6,
        boxShadow:
          "0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 36px color-mix(in srgb, var(--accent) 18%, transparent)",
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Bild · größer, dominant · Klick → Detailseite */}
      <Link
        href={detailHref}
        aria-label={`${card.title} — Details ansehen`}
        className="group/img relative block w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={card.image}
            alt={card.alt}
            fill
            sizes="(min-width: 1024px) 300px, 45vw"
            className="object-cover object-top transition-transform duration-[600ms] ease-out group-hover/img:scale-[1.06]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/img:opacity-100"
            style={{
              background: "linear-gradient(to top, rgba(3,2,10,0.55) 0%, transparent 55%)",
            }}
          />
        </div>
      </Link>

      {/* Textbereich — reduziert auf das Wesentliche */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              border: "1px solid var(--brand-card-border)",
              color: "var(--accent)",
            }}
          >
            {card.icon}
          </span>
          <h3
            className="text-[14.5px] font-medium leading-snug text-white"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            {card.title}
          </h3>
        </div>

        <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-[1.6] text-white/55">
          {card.desc}
        </p>

        <Link
          href={detailHref}
          className="group/cta mt-auto flex items-center justify-center gap-1.5 rounded-xl py-2.5 mt-4 text-[12.5px] font-semibold transition-all duration-300"
          style={{
            background: "color-mix(in srgb, var(--accent) 14%, rgba(255,255,255,0.03))",
            border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
            color: "#fff",
          }}
        >
          System ansehen
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform duration-300 group-hover/cta:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────────────────
   SectionHeading (unverändert)
───────────────────────────────────────────────────────── */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-[760px] text-center" : ""}>
      <span
        className="text-[10.5px] font-medium uppercase tracking-[0.30em]"
        style={{ color: "var(--accent)" }}
      >
        {eyebrow}
      </span>
      <h2
        className="mt-3 text-[2rem] leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.5rem]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-[14.5px] leading-[1.6] text-white/55">{subtitle}</p>
      )}
    </div>
  );
}
