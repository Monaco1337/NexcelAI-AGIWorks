"use client";

/**
 * NEXCEL AI / AGI WORKS · HowItWorksSection
 *
 * Section 2 der neuen Startseiten-IA: "So arbeitet Ihr Unternehmen in Zukunft."
 * Eine einzige, klar lesbare Prozesskette — keine Fachbegriffe, keine langen Texte.
 * Beantwortet genau eine Frage: "Wie funktioniert das?"
 */

import { motion } from "framer-motion";
import { SectionHeading } from "./SystemsGrid";

type Step = {
  label: string;
  icon: React.ReactNode;
};

function StepIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const STEPS: Step[] = [
  {
    label: "Website",
    icon: <StepIcon><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" /></StepIcon>,
  },
  {
    label: "Lead",
    icon: <StepIcon><path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" /></StepIcon>,
  },
  {
    label: "CRM",
    icon: <StepIcon><circle cx="9" cy="8" r="3" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M16 5a3 3 0 010 6M21 19c0-2.2-1.4-3.9-3.4-4.6" /></StepIcon>,
  },
  {
    label: "Automatisierung",
    icon: <StepIcon><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" /></StepIcon>,
  },
  {
    label: "Aufgabe",
    icon: <StepIcon><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></StepIcon>,
  },
  {
    label: "Dashboard",
    icon: <StepIcon><path d="M3 21h18" /><rect x="5" y="11" width="3" height="7" rx="0.6" /><rect x="10.5" y="6" width="3" height="12" rx="0.6" /><rect x="16" y="14" width="3" height="4" rx="0.6" /></StepIcon>,
  },
  {
    label: "Rechnung",
    icon: <StepIcon><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></StepIcon>,
  },
  {
    label: "Kunde",
    icon: <StepIcon><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></StepIcon>,
  },
];

function Node({ step, index }: { step: Step; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-shrink-0 flex-col items-center gap-2.5"
    >
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "var(--accent)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {step.icon}
      </div>
      <span className="text-[12.5px] font-medium text-white/75 sm:text-[13px]">{step.label}</span>
    </motion.div>
  );
}

/** Horizontale Verbindungslinie mit dezent fließendem Akzent (Desktop). */
function HConnector({ index }: { index: number }) {
  return (
    <div className="relative h-[1px] flex-1 min-w-[16px] self-start mt-6 sm:mt-7" aria-hidden>
      <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.12)" }} />
      <motion.div
        className="absolute inset-y-0 left-0 w-6 rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
        animate={{ left: ["-10%", "100%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: index * 0.3 }}
      />
    </div>
  );
}

/** Vertikale Verbindungslinie mit fließendem Akzent (Mobile). */
function VConnector({ index }: { index: number }) {
  return (
    <div className="relative mx-auto h-8 w-[1px]" aria-hidden>
      <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.12)" }} />
      <motion.div
        className="absolute inset-x-0 top-0 h-4 rounded-full"
        style={{ background: "linear-gradient(180deg, transparent, var(--accent), transparent)" }}
        animate={{ top: ["-10%", "100%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: index * 0.25 }}
      />
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      id="wie-funktioniert-das"
      className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{ background: "#08060f" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 0%, var(--brand-glow-mid) 0%, transparent 70%)",
          opacity: 0.35,
        }}
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Wie funktioniert das?"
          title="So arbeitet Ihr Unternehmen in Zukunft."
        />

        {/* Desktop / Tablet: horizontale Kette */}
        <div className="mt-14 hidden items-start justify-between gap-1 md:flex">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-start">
              <Node step={step} index={i} />
              {i < STEPS.length - 1 && <HConnector index={i} />}
            </div>
          ))}
        </div>

        {/* Mobile: vertikale Kette */}
        <div className="mt-12 flex flex-col items-center md:hidden">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center">
              <Node step={step} index={i} />
              {i < STEPS.length - 1 && <VConnector index={i} />}
            </div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-14 max-w-[480px] text-center text-[14px] font-medium text-white/50 sm:mt-16"
        >
          Alle Bereiche arbeiten automatisch zusammen.
        </motion.p>
      </div>
    </section>
  );
}
