"use client";

/**
 * NEXCEL AI / AGI WORKS · WhyUsSection
 *
 * Section 6 der neuen Startseiten-IA: "Warum wir?"
 * Vier große Vertrauens-Karten statt vieler Zahlen — daneben drei Kern-Stats.
 */

import { motion } from "framer-motion";
import { SectionHeading } from "./SystemsGrid";

type Card = {
  title: string;
  text: string;
  icon: React.ReactNode;
};

function Ico({ children }: { children: React.ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const CARDS: Card[] = [
  {
    title: "Keine Baukastensysteme",
    text: "Jedes System wird für Ihr Unternehmen entwickelt — kein Template, kein Standard-Plugin.",
    icon: <Ico><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M17.5 14v7M14 17.5h7" /></Ico>,
  },
  {
    title: "Persönlicher Gründerkontakt",
    text: "Sie sprechen direkt mit den Gründern — kein Callcenter, kein Ticketsystem.",
    icon: <Ico><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></Ico>,
  },
  {
    title: "Langfristige Partnerschaft",
    text: "Wir betreuen Ihr System auch nach dem Launch — Weiterentwicklung statt Projektende.",
    icon: <Ico><path d="M9 11a4 4 0 108 0 4 4 0 00-8 0Z" /><path d="M3 21c1-3.5 4-5 6-5M21 21c-1-3.5-4-5-6-5" /></Ico>,
  },
  {
    title: "Individuelle Entwicklung",
    text: "Von der Architektur bis zum letzten Detail auf Ihre Prozesse zugeschnitten.",
    icon: <Ico><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" /></Ico>,
  },
];

const STATS = [
  { value: "25+", label: "Systeme" },
  { value: "100%", label: "Individuell" },
  { value: "3–12", label: "Wochen" },
];

export default function WhyUsSection() {
  return (
    <section className="relative w-full overflow-hidden py-20 sm:py-28" style={{ background: "#08060f" }}>
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <SectionHeading eyebrow="Warum wir?" title="Kein Anbieter. Ein Partner." />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 rounded-2xl p-6 sm:p-7"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
                border: "1px solid var(--brand-card-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  background: "color-mix(in srgb, var(--accent) 14%, rgba(255,255,255,0.03))",
                  color: "var(--accent)",
                }}
              >
                {card.icon}
              </span>
              <h3
                className="text-[16.5px] font-medium leading-snug text-white"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
              >
                {card.title}
              </h3>
              <p className="text-[13px] leading-[1.6] text-white/55">{card.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Kern-Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-14 grid max-w-[640px] grid-cols-3 gap-4 rounded-2xl p-6 sm:p-8"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid var(--brand-card-border)",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-[2rem] font-light leading-none sm:text-[2.4rem]"
                style={{
                  background: "var(--brand-headline-gradient)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                }}
              >
                {s.value}
              </div>
              <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
