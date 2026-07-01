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
import { useState, useRef, useEffect, useCallback } from "react";
import { SYSTEMS } from "@/lib/systems-data";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";

export default function SystemsGrid() {
  const brand = useBrand();
  const [expanded, setExpanded] = useState<string | null>(null);

  const detailHref = (slug: string) =>
    resolveBrandNavHref(`/systeme/${slug}`, brand.id);

  return (
    <section
      id="systeme"
      className="relative w-full overflow-hidden scroll-mt-[108px] py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(to bottom, rgba(5,3,14,0.92) 0%, transparent 15%, transparent 85%, rgba(5,3,14,0.92) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="px-5 sm:px-8">
          <SectionHeading
            eyebrow="Systeme"
            title="Systeme, die zu Ihrem Unternehmen passen."
          />
        </div>

        {/* ── Mobile / Tablet: Swipe Slider (< lg) ── */}
        <div className="mt-12 block lg:hidden">
          <MobileSlider detailHref={detailHref} />
        </div>

        {/* ── Desktop: 4-Spalten-Grid (lg+) ── */}
        <div className="mt-12 hidden px-5 sm:px-8 lg:grid lg:grid-cols-4 lg:gap-5">
          {SYSTEMS.map((card, i) => {
            const isOpen = expanded === card.slug;
            return (
              <DesktopCard
                key={card.slug}
                card={card}
                index={i}
                isOpen={isOpen}
                onToggle={() => setExpanded((p) => (p === card.slug ? null : card.slug))}
                detailHref={detailHref(card.slug)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Mobile Swipe Slider
───────────────────────────────────────────────────────── */
function MobileSlider({ detailHref }: { detailHref: (slug: string) => string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const total = SYSTEMS.length;

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
        {SYSTEMS.map((card, i) => (
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
          {SYSTEMS.map((_, i) => (
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
      {/* Image */}
      <Link
        href={detailHref}
        aria-label={`${card.title} — Details ansehen`}
        className="group/img relative block w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      >
        <div className="relative aspect-[16/10] w-full">
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
          <span className="pointer-events-none absolute bottom-3 left-3 flex translate-y-1 items-center gap-1.5 text-[11px] font-medium text-white opacity-0 transition-all duration-300 group-hover/img:translate-y-0 group-hover/img:opacity-100">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 3h6v6M10 14L21 3M9 3H3v18h18v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Vollansicht öffnen
          </span>
        </div>
      </Link>

      {/* Text */}
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
        <p className="mt-2.5 line-clamp-3 text-[12.5px] leading-[1.6] text-white/55">
          {card.desc}
        </p>
        <Link
          href={detailHref}
          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[11.5px] font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          Details ansehen
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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
  isOpen,
  onToggle,
  detailHref,
}: {
  card: CardData;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  detailHref: string;
}) {
  return (
    <motion.article
      key={card.slug}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Bild · immer sichtbar · Klick → Detailseite */}
      <Link
        href={detailHref}
        aria-label={`${card.title} — Details ansehen`}
        className="group/img relative block w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      >
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={card.image}
            alt={card.alt}
            fill
            sizes="(min-width: 1024px) 300px, 45vw"
            className="object-cover object-top transition-transform duration-[600ms] ease-out group-hover/img:scale-[1.04]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/img:opacity-100"
            style={{
              background: "linear-gradient(to top, rgba(3,2,10,0.55) 0%, transparent 55%)",
            }}
          />
          <span className="pointer-events-none absolute bottom-3 left-3 flex translate-y-1 items-center gap-1.5 text-[11px] font-medium text-white opacity-0 transition-all duration-300 group-hover/img:translate-y-0 group-hover/img:opacity-100">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 3h6v6M10 14L21 3M9 3H3v18h18v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Vollansicht öffnen
          </span>
        </div>
      </Link>

      {/* Textbereich */}
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

        <p className="mt-2.5 line-clamp-3 text-[12.5px] leading-[1.6] text-white/55">
          {card.desc}
        </p>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.ul
              key="bullets"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                {card.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-[12px] leading-[1.5] text-white/70"
                  >
                    <span
                      className="mt-[6px] h-1 w-1 shrink-0 rounded-full"
                      style={{ background: "var(--accent)" }}
                      aria-hidden
                    />
                    {b}
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href={detailHref}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium transition-opacity hover:opacity-80"
                    style={{ color: "var(--accent)" }}
                  >
                    Mehr erfahren
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              </div>
            </motion.ul>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Weniger anzeigen" : "Mehr Infos anzeigen"}
          className="group/btn mt-auto flex items-center gap-1.5 pt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40 outline-none transition-colors hover:text-white/75 focus-visible:text-white/75"
        >
          {isOpen ? "Weniger" : "Mehr Infos"}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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
