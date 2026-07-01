"use client";

/**
 * NEXCEL AI / AGI WORKS · ProjectsShowcase
 * Hochwertige Referenz-/Case-Study-Galerie mit Fullscreen-Modal.
 */

import { useState, useEffect, useCallback } from "react";
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
            <p className="mb-8 mt-4 text-base leading-relaxed text-white/65">
              {project.fullDescription}
            </p>

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
                className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}
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
      transition={{ duration: 0.55, delay: (index % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-white/[0.07] transition-all duration-300 hover:border-white/15 hover:shadow-[0_8px_48px_rgba(0,0,0,0.5)]"
      style={{ background: "rgba(255,255,255,0.03)" }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <Image
          src={project.coverImage}
          alt={`${project.title} – ${project.shortDescription}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[11px] font-medium text-white/35">{project.type}</span>
        </div>
        <h3 className="mb-1.5 text-base font-semibold text-white">{project.title}</h3>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/55">{project.shortDescription}</p>

        {/* Tags */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/55">
              {tag}
            </span>
          ))}
          {project.tags.length > 4 && (
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/35">
              +{project.tags.length - 4}
            </span>
          )}
        </div>
      </div>
    </motion.article>
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
      <section id="projekte" className="relative w-full scroll-mt-[108px] py-20 sm:py-28">
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
          <SectionHeading
            eyebrow="Referenzen"
            title="Reale Projekte. Reale Ergebnisse."
            subtitle="Von der Idee bis zum fertigen System — maßgeschneiderte digitale Lösungen für Unternehmen aus verschiedenen Branchen."
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            className="mt-14 flex flex-col items-center gap-4 text-center"
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
