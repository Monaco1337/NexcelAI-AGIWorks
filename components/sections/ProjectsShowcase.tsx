"use client";

/**
 * NEXCEL AI / AGI WORKS · ProjectsShowcase
 * Hochwertige Referenz-/Case-Study-Galerie mit Fullscreen-Modal.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/sections/SystemsGrid";
import { STATIC_REFERENCES, type ReferenceEntry } from "@/lib/references-data";

// ─── Status Badge ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  demo: "Demo",
  intern: "Intern",
  referenz: "Referenz",
};

const STATUS_COLOR: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  demo: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  intern: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  referenz: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const IconExternal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconRequest = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/**
 * 1 Satz Ergebnis/Nutzen — schneller verstehbar als eine ganze Beschreibung.
 */
function benefitSentence(project: ReferenceEntry): string {
  if (project.result && project.result.length > 0) return project.result.join(" · ");
  return project.shortDescription;
}

/**
 * Kompakte Vorher → Nachher-Struktur (2 Zeilen statt 3) — keine reine Galerie,
 * aber auch kein Fließtext. Fällt auf ehrliche Standardwerte zurück, falls
 * eine Referenz (z. B. aus der DB) diese Felder noch nicht gepflegt hat.
 */
function MiniTransition({ project, compact }: { project: ReferenceEntry; compact?: boolean }) {
  const before = project.before ?? "Manuell · verstreut · unübersichtlich";
  const after = project.after && project.after.length > 0 ? project.after.join(" · ") : "System · Automatisierung · Übersicht";

  return (
    <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
      <Row label="Vorher" tone="before" text={before} compact={compact} />
      <Row label="Nachher" tone="after" text={after} compact={compact} />
    </div>
  );
}

function Row({
  label,
  tone,
  text,
  compact,
}: {
  label: string;
  tone: "before" | "after";
  text: string;
  compact?: boolean;
}) {
  const color = tone === "after" ? "var(--accent)" : "rgba(255,255,255,0.4)";
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-[2px] shrink-0 rounded-full ${compact ? "px-1.5 py-[1px] text-[8px]" : "px-2 py-[2px] text-[9px]"} font-semibold uppercase tracking-[0.08em]`}
        style={{
          color,
          border: `1px solid ${tone === "after" ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "rgba(255,255,255,0.13)"}`,
          background: tone === "after" ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
        }}
      >
        {label}
      </span>
      <span className={`${compact ? "text-[11px]" : "text-[12px]"} leading-[1.45]`} style={{ color: tone === "before" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.78)" }}>
        {text}
      </span>
    </div>
  );
}

// ─── Fullscreen Detail Modal ──────────────────────────────────────────────────
function ReferenceModal({
  project,
  onClose,
}: {
  project: ReferenceEntry;
  onClose: () => void;
}) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose],
  );
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const slug = project.slug;
  const contactHref = `/kontakt?system=${slug}&betreff=Projekt anfragen: ${encodeURIComponent(project.title)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto"
      style={{ background: "rgba(5,5,12,0.97)", backdropFilter: "blur(24px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14"
      >
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white/90"
          >
            <IconArrowLeft />
            <span>Zurück</span>
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-all hover:border-white/30 hover:text-white"
          >
            <IconClose />
          </button>
        </div>

        {/* Hero image */}
        <div className="relative mb-8 w-full overflow-hidden rounded-[20px] border border-white/8"
          style={{ aspectRatio: "16/9" }}
        >
          <Image
            src={project.coverImage}
            alt={`${project.title} – Projektvorschau`}
            fill
            className="object-cover"
            quality={95}
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content grid */}
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Left */}
          <div>
            {/* Status + Type */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLOR[project.status] ?? "bg-white/10 text-white/60 border-white/20"}`}>
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/60">
                {project.type}
              </span>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {project.title}
            </h2>
            <p className="mb-1 text-sm font-medium text-white/40">{project.clientName}</p>

            {/* Description */}
            <p className="mb-6 mt-4 text-base leading-relaxed text-white/65">
              {project.fullDescription}
            </p>

            {/* Vorher → Nachher + Ergebnis */}
            <div className="mb-8 rounded-2xl border border-white/8 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="mb-4 text-[13.5px] font-medium leading-snug text-white/85">{benefitSentence(project)}</p>
              <MiniTransition project={project} />
            </div>

            {/* Tags */}
            {project.tags.length > 0 && (
              <div className="mb-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">Technologien & Kategorien</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modules */}
            {project.modules.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">Leistungen & Module</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {project.modules.map((m) => (
                    <li key={m} className="flex items-start gap-2.5 text-sm text-white/65">
                      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: CTAs */}
          <div className="flex flex-col gap-4 lg:pt-16">
            <div className="rounded-[18px] border border-white/8 p-6"
              style={{ background: "rgba(255,255,255,0.035)" }}
            >
              <p className="mb-4 text-sm font-semibold text-white/80">Ähnliches System anfragen?</p>
              <p className="mb-5 text-sm leading-relaxed text-white/50">
                Wir entwickeln individuelle digitale Systeme – maßgeschneidert für dein Unternehmen.
              </p>
              <a
                href={contactHref}
                className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px"
                style={{
                  background: "color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.03))",
                  border: "1px solid color-mix(in srgb, var(--accent) 48%, transparent)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 20%, transparent)",
                }}
              >
                <IconRequest />
                Projekt anfragen
              </a>
              {project.websiteUrl && (
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/35 hover:text-white"
                >
                  <IconExternal />
                  Webseite ansehen
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reference Card ───────────────────────────────────────────────────────────
function ReferenceCard({
  project,
  index,
  onClick,
}: {
  project: ReferenceEntry;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      whileHover={{
        y: -5,
        boxShadow:
          "0 12px 56px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent)",
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-white/[0.07]"
      style={{ background: "rgba(255,255,255,0.03)" }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <Image
          src={project.coverImage}
          alt={`${project.title} – ${project.shortDescription}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          quality={85}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-70 transition-opacity group-hover:opacity-50" />

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full border border-white/30 bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
            Vollansicht öffnen
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute right-3 top-3">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${STATUS_COLOR[project.status] ?? "bg-white/10 text-white/60 border-white/20"}`}>
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
        </div>
      </div>

      {/* Content — Kategorie, Titel, 1-Satz-Nutzen, kompakte Vorher/Nachher, CTA */}
      <div className="flex flex-1 flex-col p-5">
        <span className="mb-1.5 text-[11px] font-medium text-white/35">{project.type}</span>
        <h3 className="text-base font-semibold text-white">{project.title}</h3>
        <p className="mt-2 text-[12.5px] leading-[1.5] text-white/70">
          {benefitSentence(project)}
        </p>
        <div className="mt-3.5">
          <MiniTransition project={project} />
        </div>
        <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: "var(--accent)" }}>
          Details ansehen
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </motion.article>
  );
}

// ─── Mobile / Tablet Swipe Slider ────────────────────────────────────────────
function MobileReferenceSlider({
  references,
  onSelect,
}: {
  references: ReferenceEntry[];
  onSelect: (p: ReferenceEntry) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const total = references.length;

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
      {/* Scroll Track */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-scroll pb-1"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        {references.map((project, i) => (
          <motion.article
            key={project.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
            /* 82vw on mobile → ~1 card + peek; 44vw on sm → ~2 cards */
            className="group relative flex w-[82vw] flex-none cursor-pointer snap-start flex-col overflow-hidden rounded-[20px] sm:w-[44vw]"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${i === activeIdx ? "rgba(var(--accent-rgb,168,85,247),0.32)" : "rgba(255,255,255,0.07)"}`,
              boxShadow: i === activeIdx
                ? "0 0 0 1px rgba(var(--accent-rgb,168,85,247),0.10)"
                : "none",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
            onClick={() => onSelect(project)}
          >
            {/* Image */}
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <Image
                src={project.coverImage}
                alt={`${project.title} – ${project.shortDescription}`}
                fill
                className="object-cover transition-transform duration-500 group-active:scale-[1.02]"
                quality={85}
                sizes="82vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-70" />

              {/* Tap hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-active:opacity-100">
                <span className="rounded-full border border-white/30 bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  Vollansicht öffnen
                </span>
              </div>

              {/* Status badge */}
              <div className="absolute right-3 top-3">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${STATUS_COLOR[project.status] ?? "bg-white/10 text-white/60 border-white/20"}`}>
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              </div>
            </div>

            {/* Content — nur das Nötigste: Name, 1 Nutzen-Satz, Tags, CTA */}
            <div className="flex flex-1 flex-col p-4">
              <span className="mb-1 text-[10.5px] font-medium text-white/35">{project.type}</span>
              <h3 className="text-[15px] font-semibold text-white">{project.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-white/62">
                {benefitSentence(project)}
              </p>
              {project.tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9.5px] font-medium text-white/55">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="mt-3 inline-flex w-fit items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: "var(--accent)" }}>
                Details ansehen
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Right fade mask */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10"
        style={{ background: "linear-gradient(to left, rgba(5,3,14,0.88) 0%, transparent 100%)" }}
      />

      {/* Controls: Counter + Dots + Arrows */}
      <div className="mt-6 flex items-center justify-between px-5 sm:px-8">
        {/* Counter */}
        <span
          className="text-[11px] font-medium tabular-nums tracking-[0.18em] text-white/35"
          aria-live="polite"
          aria-label={`Projekt ${activeIdx + 1} von ${total}`}
        >
          {String(activeIdx + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(total).padStart(2, "0")}
        </span>

        {/* Dot Pagination */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Referenzen Navigation">
          {references.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Projekt ${i + 1}`}
              onClick={() => scrollTo(i)}
              className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              style={{
                width: i === activeIdx ? "22px" : "6px",
                background: i === activeIdx ? "var(--accent)" : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={activeIdx === 0}
            aria-label="Vorheriges Projekt"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={next}
            disabled={activeIdx === total - 1}
            aria-label="Nächstes Projekt"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectsShowcase() {
  const [references, setReferences] = useState<ReferenceEntry[]>(STATIC_REFERENCES.filter((r) => r.isPublished));
  const [activeRef, setActiveRef] = useState<ReferenceEntry | null>(null);

  useEffect(() => {
    fetch("/api/references")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.references) && data.references.length > 0) {
          setReferences(data.references);
        }
      })
      .catch(() => {/* use static fallback */});
  }, []);

  return (
    <>
      <section id="projekte" className="relative w-full scroll-mt-[108px] py-20 sm:py-28 lg:py-36">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="px-5 sm:px-8">
            <SectionHeading
              eyebrow="Referenzen"
              title="Reale Projekte. Reale Ergebnisse."
              subtitle="Von der Idee bis zum fertigen System — maßgeschneiderte digitale Lösungen für Unternehmen aus verschiedenen Branchen."
            />
          </div>

          {/* Mobile / Tablet: Swipe Slider (< lg) */}
          <div className="mt-12 block lg:hidden">
            <MobileReferenceSlider references={references} onSelect={setActiveRef} />
          </div>

          {/* Desktop: einheitliches 3-Spalten-Grid — alle Karten gleich groß */}
          <div className="mt-12 hidden px-5 sm:px-8 lg:grid lg:grid-cols-3 lg:gap-5">
            {references.map((project, i) => (
              <ReferenceCard
                key={project.id}
                project={project}
                index={i}
                onClick={() => setActiveRef(project)}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14 flex flex-col items-center gap-4 px-5 text-center sm:px-8"
          >
            <p className="text-sm text-white/45">Kein passendes Projekt dabei?</p>
            <a
              href="/kontakt?betreff=Eigenes Projekt anfragen"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-white/35 hover:text-white"
            >
              Eigenes Projekt besprechen
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {activeRef && (
          <ReferenceModal project={activeRef} onClose={() => setActiveRef(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
