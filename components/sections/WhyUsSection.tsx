"use client";

/**
 * NEXCEL AI / AGI WORKS · WhyUsSection
 *
 * Section 6 der neuen Startseiten-IA: "Warum wir?"
 * Vier große Vertrauens-Karten statt vieler Zahlen — daneben drei Kern-Stats.
 */

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
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

type Stat = { number?: number; prefix?: string; suffix?: string; display?: string; label: string };

const STATS: Stat[] = [
  { number: 25, suffix: "+", label: "Systeme entwickelt" },
  { number: 100, suffix: "%", label: "Individuell · kein Baukasten" },
  { number: 2, label: "Gründer · direkter Kontakt" },
  { display: "3–12", label: "Wochen Projektlaufzeit" },
  { display: "∞", label: "Langfristige Betreuung" },
];

/** Zählt beim ersten Sichtbarwerden von 0 auf den Zielwert hoch — dezent, performant (nur eine MotionValue). */
function CountUpStat({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (!inView || stat.number === undefined) return;
    const controls = animate(motionValue, stat.number, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, stat.number, motionValue]);

  if (stat.number === undefined) {
    return <span ref={ref}>{stat.display}</span>;
  }

  return (
    <span ref={ref}>
      {stat.prefix}
      <motion.span>{rounded}</motion.span>
      {stat.suffix}
    </span>
  );
}

export default function WhyUsSection() {
  return (
    <section className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-32" style={{ background: "#08060f" }}>
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

        {/* Kern-Stats — hoher Kontrast, Count-Up, hochwertiger Glow-Border */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative mx-auto mt-14 grid max-w-[880px] grid-cols-2 gap-x-4 gap-y-8 overflow-hidden rounded-[26px] p-7 sm:grid-cols-5 sm:gap-4 sm:p-9"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 100%)",
            border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--brand-card-border))",
            boxShadow: "0 30px 70px rgba(0,0,0,0.4), 0 0 60px color-mix(in srgb, var(--accent) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 55%, transparent), transparent)" }}
          />
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`relative text-center ${i < STATS.length - 1 ? "sm:after:absolute sm:after:right-[-8px] sm:after:top-1/2 sm:after:h-10 sm:after:w-px sm:after:-translate-y-1/2 sm:after:bg-white/[0.08] sm:after:content-['']" : ""}`}
            >
              <div
                className="text-[2.1rem] font-light leading-none sm:text-[2.5rem]"
                style={{
                  background: "var(--brand-headline-gradient)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  filter: "drop-shadow(0 0 18px var(--brand-glow-strong))",
                }}
              >
                <CountUpStat stat={s} />
              </div>
              <div className="mt-2 text-[10.5px] font-medium uppercase leading-snug tracking-[0.10em] text-white/50">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
