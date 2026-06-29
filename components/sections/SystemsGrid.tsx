"use client";

/**
 * NEXCEL AI / AGI WORKS · SystemsGrid (Abschnitt „Systeme")
 *
 * 8 Systemtypen als hochwertige Karten mit Icon, Titel, Beschreibung und
 * elegantem, austauschbarem Platzhalter für spätere Screenshots.
 * Anker: #systeme (Header-/Hero-CTA „Lösungen ansehen").
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type SystemCard = {
  title: string;
  desc: string;
  icon: ReactNode;
};

const CARDS: SystemCard[] = [
  {
    title: "Premium-Websysteme",
    desc: "Maßgeschneiderte Webseiten und Portale mit Fokus auf Performance, Design und Conversion.",
    icon: <GlobeIcon />,
  },
  {
    title: "Buchungs- & Beauty-Systeme",
    desc: "Intelligente Buchungssysteme für Dienstleister, Studios und Salons.",
    icon: <CalendarIcon />,
  },
  {
    title: "Lead-Funnels & CRM",
    desc: "Leadgenerierung, Funnels und CRM für messbares Wachstum und starke Kundenbeziehungen.",
    icon: <FunnelIcon />,
  },
  {
    title: "Mitglieder- & Clubverwaltung",
    desc: "Mitgliederbereiche, Abläufe, Rollen und Community-Management auf hohem Niveau.",
    icon: <UsersIcon />,
  },
  {
    title: "Branchen-Plattformen",
    desc: "Digitale Plattformen und Marktplätze für Ihre Branche und Zielgruppen.",
    icon: <PlatformIcon />,
  },
  {
    title: "Individuelle ERP-Systeme",
    desc: "Warenwirtschaft, Finanzen, Projekte und Ressourcen in einem System.",
    icon: <ErpIcon />,
  },
  {
    title: "KI & Automatisierung",
    desc: "Intelligente Automatisierungen und KI-gestützte Prozesse, die Zeit und Kosten sparen.",
    icon: <SparkIcon />,
  },
  {
    title: "Schnittstellen & Integrationen",
    desc: "Nahtlose Anbindungen an Zahlungsanbieter, CRM, Tools und APIs.",
    icon: <PlugIcon />,
  },
];

export default function SystemsGrid() {
  return (
    <section id="systeme" className="relative w-full scroll-mt-[108px] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Systeme"
          title="Systeme, die zu Ihrem Unternehmen passen."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col overflow-hidden rounded-2xl p-5"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
                border: "1px solid var(--brand-card-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(90% 60% at 50% 0%, var(--brand-card-glow-hover), transparent 70%)",
                }}
              />

              <div
                className="relative flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid var(--brand-card-border)",
                  color: "var(--accent)",
                  boxShadow: "0 8px 22px rgba(0,0,0,0.3), 0 0 20px var(--brand-card-glow)",
                }}
              >
                {card.icon}
              </div>

              <h3
                className="relative mt-4 text-[15.5px] font-medium text-white"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
              >
                {card.title}
              </h3>
              <p className="relative mt-2 text-[13px] leading-[1.6] text-white/55">
                {card.desc}
              </p>

              {/* Elegant austauschbarer Screenshot-Platzhalter */}
              <ScreenshotPlaceholder />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenshotPlaceholder() {
  return (
    <div
      className="relative mt-5 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
        border: "1px dashed rgba(255,255,255,0.12)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
        }}
      />
      <span className="relative text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
        Platzhalter · Screenshot
      </span>
    </div>
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

/* ── Icons ── */
function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16M8 3v4M16 3v4M9 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function FunnelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.5M16.5 19a5.5 5.5 0 0 0-2-4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function PlatformIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="11" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ErpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7l8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 7v10l8 4 8-4V7M12 11v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function PlugIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 2v5M15 2v5M7 7h10v3a5 5 0 0 1-10 0V7ZM12 15v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
