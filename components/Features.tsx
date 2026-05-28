"use client";

import { motion } from "framer-motion";

const solutions = [
  {
    icon: "⚡",
    title: "KI-Automation",
    description: "Intelligente Automatisierungssysteme, die Prozesse optimieren und Entscheidungen treffen. Präzise. Effizient. Individuell.",
  },
  {
    icon: "🔷",
    title: "AI Agents",
    description: "Autonome KI-Agenten für komplexe Aufgaben. Systeme, die lernen, adaptieren und selbstständig handeln.",
  },
  {
    icon: "📊",
    title: "Control Dashboards",
    description: "Maßgeschneiderte Dashboard-Systeme mit Echtzeit-Analytics. Klare Visualisierung. Präzise Kontrolle.",
  },
  {
    icon: "🌐",
    title: "Systemdesign",
    description: "Architektur für intelligente Systeme. Von der Konzeption bis zur Implementierung. Clean. Skalierbar. Zukunftssicher.",
  },
  {
    icon: "💻",
    title: "Custom Web-Apps",
    description: "Individuelle Web-Anwendungen nach Maß. Modern. Funktional. Präzise auf deine Anforderungen zugeschnitten.",
  },
  {
    icon: "🔗",
    title: "Integrationen",
    description: "Nahtlose Verbindung bestehender Systeme. API-Integrationen. Datenfluss-Optimierung. Systemharmonie.",
  },
];

export default function Features() {
  return (
    <section className="relative py-40 px-6 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.h2
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-24 text-[#FFFFFF] tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#00E1FF] neural-text-glow-soft">Lösungen</span>
          <br />
          <span className="text-[#DDE2E8]">für jedes Unternehmen</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              className="neural-glass rounded-neuralLg p-10 hover:neural-glass-hover transition-all duration-500 group cursor-pointer"
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              onHoverStart={() => {}}
              onHoverEnd={() => {}}
            >
              <motion.div
                className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-500 filter drop-shadow-[0_0_10px_rgba(0,225,255,0.3)]"
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                {solution.icon}
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] mb-5 tracking-tight">
                {solution.title}
              </h3>
              <p className="text-[#DDE2E8] text-lg leading-relaxed font-light">
                {solution.description}
              </p>
              <motion.div
                className="mt-8 h-px w-0 bg-gradient-to-r from-[#00E1FF] to-[#A9B8FF] group-hover:w-full transition-all duration-500"
                initial={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

