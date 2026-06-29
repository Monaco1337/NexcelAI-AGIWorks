"use client";

/**
 * NEXCEL AI / AGI WORKS · ReferenceBar
 *
 * Referenzleiste mit hochwertigen Platzhalter-Containern für spätere echte
 * Kundenlogos. Bewusst neutral gehalten — gutes Spacing, klare Flächen,
 * dezente Brand-Anmutung. Keine Fake-Logos.
 */

import { motion } from "framer-motion";

const PLACEHOLDER_COUNT = 6;

export default function ReferenceBar() {
  return (
    <section
      className="relative w-full py-16 sm:py-20"
      style={{ background: "transparent" }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <div className="flex items-center justify-center gap-4">
          <span
            aria-hidden
            className="h-px w-10 sm:w-12"
            style={{
              background: "linear-gradient(90deg, transparent, var(--brand-line-dim))",
            }}
          />
          <h2
            className="text-center text-[10.5px] font-medium uppercase tracking-[0.30em] text-white/55"
          >
            Vertraut von Unternehmen, die wachsen wollen
          </h2>
          <span
            aria-hidden
            className="h-px w-10 sm:w-12"
            style={{
              background: "linear-gradient(90deg, var(--brand-line-dim), transparent)",
            }}
          />
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex h-16 items-center justify-center overflow-hidden rounded-xl sm:h-[72px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(80% 100% at 50% 0%, var(--brand-card-glow), transparent 70%)",
                }}
              />
              {/* Neutrales Logo-Skelett (Platzhalter) */}
              <div className="flex items-center gap-2 opacity-40 transition-opacity duration-500 group-hover:opacity-60">
                <span
                  className="h-5 w-5 rounded-md"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                />
                <span
                  className="h-2.5 w-12 rounded-full sm:w-16"
                  style={{ background: "rgba(255,255,255,0.14)" }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11.5px] text-white/30">
          Logoflächen vorbereitet — echte Kundenlogos folgen.
        </p>
      </div>
    </section>
  );
}
