"use client";

/**
 * NEXCEL AI / AGI WORKS · ProjectsShowcase (Abschnitt „Projekte")
 *
 * 4 reale Projekte als Karten mit hochwertigem, austauschbarem Screenshot-
 * Platzhalter (keine Fake-Bilder). Anker: #projekte.
 */

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/sections/SystemsGrid";

type Project = {
  title: string;
  desc: string;
  tags: string[];
};

const PROJECTS: Project[] = [
  {
    title: "Lulu’s Beauty",
    desc: "Buchungssystem, Kundenportal und Automatisierungen.",
    tags: ["Buchung", "Kundenportal", "Automatisierung"],
  },
  {
    title: "Lokführerzentrum",
    desc: "Lead-Funnel, CRM und automatisierte Kontaktstrecken.",
    tags: ["Lead-Funnel", "CRM", "Automatisierung"],
  },
  {
    title: "Immobilien Weissleder",
    desc: "CRM, Objektverwaltung und Kundenkommunikation.",
    tags: ["CRM", "Objektverwaltung", "Kommunikation"],
  },
  {
    title: "Regulierte Mitgliederorganisation",
    desc: "Sichere Mitgliederplattform mit Rollen, Rechten und Abstimmungen.",
    tags: ["Mitglieder", "Rollen & Rechte", "Abstimmungen"],
  },
];

export default function ProjectsShowcase() {
  return (
    <section id="projekte" className="relative w-full scroll-mt-[108px] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <SectionHeading eyebrow="Projekte" title="Reale Systeme. Reale Ergebnisse." />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col overflow-hidden rounded-[22px] p-5 sm:p-6"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
                border: "1px solid var(--brand-card-border)",
                boxShadow:
                  "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Screenshot-Platzhalter */}
              <div
                className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.008))",
                  border: "1px dashed rgba(255,255,255,0.12)",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                    backgroundSize: "26px 26px",
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(70% 80% at 50% 0%, var(--brand-card-glow-hover), transparent 70%)",
                  }}
                />
                <span className="relative text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
                  Platzhalter · Projekt-Screenshot
                </span>
              </div>

              <h3
                className="mt-5 text-[18px] font-medium text-white"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
              >
                {p.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-white/55">{p.desc}</p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full px-3 py-1 text-[11px] font-medium text-white/70"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
