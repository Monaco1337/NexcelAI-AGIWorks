"use client";

/**
 * NEXCEL AI / AGI WORKS · TrustKpis
 * Fünf Vertrauens-Kennzahlen als ruhige, hochwertige Leiste.
 */

import { motion } from "framer-motion";

type Kpi = { value: string; label: string };

const KPIS: Kpi[] = [
  { value: "25+", label: "Systeme entwickelt" },
  { value: "100 %", label: "individuell & kein Baukasten" },
  { value: "2", label: "Gründer · direkter Kontakt" },
  { value: "3–12", label: "Wochen typische Projektlaufzeit" },
  { value: "∞", label: "Langfristige Betreuung & Partnerschaft" },
];

export default function TrustKpis() {
  return (
    <section className="relative w-full py-14 sm:py-16">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] sm:grid-cols-3 lg:grid-cols-5"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--brand-card-border)",
          }}
        >
          {KPIS.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col items-center justify-center px-4 py-7 text-center ${
                i === 4 ? "col-span-2 sm:col-span-3 lg:col-span-1" : ""
              }`}
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,8,22,0.6) 0%, rgba(5,4,16,0.6) 100%)",
              }}
            >
              <span
                className="text-[1.9rem] font-semibold leading-none sm:text-[2.1rem]"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  background: "var(--brand-headline-gradient)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {kpi.value}
              </span>
              <span className="mt-2.5 max-w-[180px] text-[12px] leading-[1.45] text-white/55">
                {kpi.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
