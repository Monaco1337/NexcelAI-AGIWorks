"use client";

import { motion } from "framer-motion";

const projects = [
  {
    id: 1,
    title: "Operational AI OS",
    description: "Eine intelligente Control-Plattform für Abläufe, Planung und Automationen.",
    features: [
      "Prozessanalyse",
      "AI-gestützte Entscheidungen",
      "Echtzeit-Dashboard",
    ],
    tech: ["Next.js", "Node.js", "AI-Modules"],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-1.024.324-2.046.78-3.032 1.362a1.5 1.5 0 000 2.638c.986.582 2.008 1.038 3.032 1.362M9.75 3.104l2.25 2.252M9.75 3.104l-2.25 2.252M5 14.5l2.25-2.252M5 14.5l-2.25-2.252M5 14.5h14.5M5 14.5v5.714a2.25 2.25 0 00.659 1.591L9.75 21.896M19.5 14.5v5.714a2.25 2.25 0 01-.659 1.591L15.25 21.896M9.75 21.896v-5.714a2.25 2.25 0 00-.659-1.591L5 14.5m14.5 0v-5.714a2.25 2.25 0 00-.659-1.591L15.25 3.104M9.75 21.896l2.25-2.252M9.75 21.896l-2.25-2.252M15.25 3.104l2.25 2.252M15.25 3.104l-2.25 2.252" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Scheduling Intelligence",
    description: "Ein kognitives Planungs-System mit Präzisionslogik.",
    features: [
      "Tages-, Wochen-, Monats-OS",
      "Intelligente Zeitblöcke",
      "Live-Konflikterkennung",
    ],
    tech: ["React", "Zustand", "Tailwind", "Canvas"],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "AI Call Agent",
    description: "Ein autonomer digitaler Mitarbeiter, der Gespräche führt, Daten erfasst und Abläufe steuert.",
    features: [
      "Realtime Speech",
      "Intent Erkennung",
      "Systemintegration",
    ],
    tech: ["Whisper", "GPT", "Node", "API Engine"],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15.75h-4.5A10.5 10.5 0 018.25 12c0-1.72-.328-3.354-.922-4.848M17.25 6.75c0 8.284-6.716 15-15 15.75h4.5A10.5 10.5 0 0015.75 12c0-1.72-.328-3.354-.922-4.848M17.25 6.75h3.375c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-3.375m-6.75 0H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h3.375m0 0H21m-9.75 0v-3.375c0-.621.504-1.125 1.125-1.125h3.375c.621 0 1.125.504 1.125 1.125v3.375" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Logistics Automation Hub",
    description: "Ein KI-System für Routen, Fahrer, Lieferketten und Echtzeit-Optimierung.",
    features: [
      "Fahrerverwaltung",
      "Live-Tracking",
      "KI-Tourlogik",
    ],
    tech: ["Next.js", "Maps", "Node", "AI Logic"],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9m3 15.75h6m-9 0H21m-3.75 0H18m-9.75 0H3.375c-.621 0-1.125.504-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125V18.75m-18 0v-3.375a1.125 1.125 0 011.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v3.375" />
      </svg>
    ),
  },
];

export default function Projects() {
  return (
    <section id="projects" className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle Purple Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(107, 45, 184, 0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] tracking-tight mb-6">
            <span className="text-[#6B2DB8]" style={{ textShadow: "0 0 30px rgba(107, 45, 184, 0.4)" }}>Projekte</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#E5E7EB] font-light max-w-3xl mx-auto">
            Intelligente Systeme, die Unternehmen transformieren.
          </p>
        </motion.div>

        {/* Projects Grid - Responsive: 1 (Mobile) / 2 (Tablet) / 3 (Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="group relative"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -8 }}
            >
              {/* Vision Pro Glass Panel */}
              <div className="relative neural-glass rounded-neuralLg p-8 hover:neural-glass-hover transition-all duration-500 h-full flex flex-col overflow-hidden">
                {/* Holographic Edge Glow - Purple */}
                <motion.div
                  className="absolute inset-0 rounded-neuralLg border border-[#6B2DB8]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    boxShadow: [
                      "0 0 0px rgba(107, 45, 184, 0)",
                      "0 0 30px rgba(107, 45, 184, 0.2), inset 0 0 15px rgba(139, 109, 184, 0.1)",
                      "0 0 0px rgba(107, 45, 184, 0)",
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Subtle Depth Shadow - Purple */}
                <div
                  className="absolute inset-0 rounded-neuralLg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(135deg, rgba(107, 45, 184, 0.05) 0%, transparent 50%)",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon - Purple */}
                  <div className="mb-6 text-[#6B2DB8] group-hover:scale-110 transition-transform duration-500" style={{ filter: "drop-shadow(0 0 8px rgba(107, 45, 184, 0.5))" }}>
                    {project.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] mb-4 tracking-tight">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[#E5E7EB] text-base font-light leading-relaxed mb-6 flex-grow">
                    {project.description}
                  </p>

                  {/* Features */}
                  <div className="mb-6 space-y-2">
                    {project.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <span className="text-[#6B2DB8] mr-3 text-sm font-bold mt-0.5">•</span>
                        <span className="text-[#E5E7EB] text-sm font-light">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech Stack Chips */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-3 py-1.5 neural-glass border border-[#6B2DB8]/20 text-[#E5E7EB] rounded-neuralSm text-xs font-medium tracking-wide"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Button */}
                  <motion.button
                    className="w-full py-3 px-6 neural-button-hologram rounded-neural font-semibold text-sm mt-auto"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Mehr erfahren
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
