"use client";

/**
 * NEXCEL AI / AGI WORKS · Fullscreen-Detailseite eines Systems
 *
 * Zeigt das Systemvisual in voller Schärfe (quality 100), den vollständigen
 * Leistungsumfang sowie einen CTA, der mit vorausgewähltem System zum
 * Kontaktformular führt (/kontakt?system=<slug>).
 */

import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import { getSystemBySlug, SYSTEMS } from "@/lib/systems-data";
import { SYSTEM_CATEGORY } from "@/data/systemPages";

/**
 * Neighbouring systems for the "Weitere Systeme" grid.
 *
 * Prefers same-category siblings (topically relevant links) and rotates the
 * starting offset by the current system's position, so inbound links spread
 * across the whole catalogue instead of always pointing at the first entries.
 */
function relatedSystems(slug: string, count: number) {
  const category = SYSTEM_CATEGORY[slug as keyof typeof SYSTEM_CATEGORY];
  const others = SYSTEMS.filter((s) => s.slug !== slug);
  const sameCategory = others.filter((s) => SYSTEM_CATEGORY[s.slug] === category);
  const rest = others.filter((s) => SYSTEM_CATEGORY[s.slug] !== category);
  const offset = SYSTEMS.findIndex((s) => s.slug === slug);
  const rotated = rest.map((_, i) => rest[(offset + i) % rest.length]);
  return [...sameCategory, ...rotated].slice(0, count);
}

export default function SystemDetailView({
  slug,
  children,
}: {
  slug: string;
  /** Rendered directly above the footer (SEO/AEO block from the route). */
  children?: ReactNode;
}) {
  const brand = useBrand();
  const system = getSystemBySlug(slug);

  const systemeHref = resolveBrandNavHref("/#systeme", brand.id);

  if (!system) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-light text-white">System nicht gefunden</h1>
          <Link
            href={systemeHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-[12px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white"
            style={{ borderColor: "var(--brand-card-border)" }}
          >
            Zurück zu den Systemen
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  const contactHref = `${resolveBrandNavHref("/kontakt", brand.id)}?system=${system.slug}`;
  const otherSystems = relatedSystems(system.slug, 4);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative px-5 pt-[110px] sm:px-8 md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1240px]">
          {/* Breadcrumb / Zurück */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={systemeHref}
              className="group inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white/80"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="rotate-180 transition-transform duration-300 group-hover:-translate-x-0.5"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Alle Systeme
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid var(--brand-card-border)",
                  color: "var(--accent)",
                }}
              >
                {system.icon}
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: "var(--accent)" }}
              >
                Systemkategorie
              </span>
            </div>
            <h1
              className="mt-5 text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-white sm:text-[3rem]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
            >
              {system.title}
            </h1>
            <p
              className="mt-3 text-[1.05rem] font-medium sm:text-[1.25rem]"
              style={{ color: "var(--accent)" }}
            >
              {system.tagline}
            </p>
          </motion.div>

          {/* Vollbild · scharfes Systemvisual */}
          <motion.div
            className="relative mt-10 overflow-hidden rounded-3xl"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              border: "1px solid var(--brand-card-border)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              background: "rgba(8,6,18,0.5)",
            }}
          >
            <Image
              src={system.image}
              alt={system.alt}
              width={2400}
              height={1500}
              quality={100}
              priority
              sizes="(min-width: 1280px) 1240px, 100vw"
              className="h-auto w-full object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* Inhalt · Beschreibung + Leistungsumfang */}
      <section className="relative px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* Beschreibung + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              className="text-[1.5rem] leading-tight text-white sm:text-[1.85rem]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
            >
              Was dieses System leistet
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-white/60">
              {system.longDesc}
            </p>
            <p className="mt-4 text-[15px] leading-[1.75] text-white/60">
              {system.desc}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href={contactHref}
                className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[13px] font-semibold text-white transition-all hover:gap-3.5"
                style={{
                  background: "color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.03))",
                  border: "1px solid color-mix(in srgb, var(--accent) 48%, transparent)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 20px color-mix(in srgb, var(--accent) 20%, transparent)",
                }}
              >
                Anfrage stellen
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href={systemeHref}
                className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-[13px] font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white"
                style={{ borderColor: "var(--brand-card-border)" }}
              >
                Andere Systeme ansehen
              </Link>
            </div>
          </motion.div>

          {/* Leistungsumfang */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl p-7 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--brand-card-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--accent)" }}
            >
              Leistungsumfang
            </p>
            <ul className="mt-5 space-y-3.5">
              {system.details.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-3 text-[13.5px] leading-[1.5] text-white/75"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--accent)" }}
                  >
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {d}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Weitere Systeme */}
      <section className="relative px-5 pb-24 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <h2
            className="text-[1.25rem] text-white sm:text-[1.5rem]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
          >
            Weitere Systeme
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherSystems.map((s) => (
              <Link
                key={s.slug}
                href={resolveBrandNavHref(`/systeme/${s.slug}`, brand.id)}
                className="group relative flex flex-col overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.015]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
                  border: "1px solid var(--brand-card-border)",
                }}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1024px) 290px, 45vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex items-center gap-2 p-4">
                  <span style={{ color: "var(--accent)" }}>{s.icon}</span>
                  <span className="text-[13px] font-medium text-white">{s.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {children}

      <Footer />
    </main>
  );
}
