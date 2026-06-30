"use client";

/**
 * NEXCEL AI / AGI WORKS · SystemsGrid
 *
 * Übersicht der 8 Systemkategorien:
 * – Bild immer sichtbar (Klick → Fullscreen-Detailseite /systeme/[slug])
 * – Titel + Kurzbeschreibung (2–3 Zeilen) immer sichtbar
 * – Filigraner Pfeil (ohne Kasten) → klappt ein paar Stichpunkte inline auf
 */

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Systeme"
          title="Systeme, die zu Ihrem Unternehmen passen."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEMS.map((card, i) => {
            const isOpen = expanded === card.slug;
            return (
              <motion.article
                key={card.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col overflow-hidden rounded-2xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
                  border: "1px solid var(--brand-card-border)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* ── Bild · immer sichtbar · Klick → Detailseite ── */}
                <Link
                  href={detailHref(card.slug)}
                  aria-label={`${card.title} — Details ansehen`}
                  className="group/img relative block w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                >
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={card.image}
                      alt={card.alt}
                      fill
                      sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                      className="object-cover object-top transition-transform duration-[600ms] ease-out group-hover/img:scale-[1.04]"
                    />
                    {/* sanftes Top-Glow beim Hover */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/img:opacity-100"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(3,2,10,0.55) 0%, transparent 55%)",
                      }}
                    />
                    {/* Hover-CTA */}
                    <span className="pointer-events-none absolute bottom-3 left-3 flex translate-y-1 items-center gap-1.5 text-[11px] font-medium text-white opacity-0 transition-all duration-300 group-hover/img:translate-y-0 group-hover/img:opacity-100">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M15 3h6v6M10 14L21 3M9 3H3v18h18v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Vollansicht öffnen
                    </span>
                  </div>
                </Link>

                {/* ── Textbereich ── */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background:
                          "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
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

                  {/* Kurzbeschreibung · immer sichtbar (max. 3 Zeilen) */}
                  <p className="mt-2.5 line-clamp-3 text-[12.5px] leading-[1.6] text-white/55">
                    {card.desc}
                  </p>

                  {/* Inline-Aufklapp-Bereich */}
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
                              href={detailHref(card.slug)}
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

                  {/* Filigraner Pfeil · ohne Kasten */}
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => (p === card.slug ? null : card.slug))}
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
          })}
        </div>
      </div>
    </section>
  );
}

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
