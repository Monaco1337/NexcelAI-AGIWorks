"use client";

import { motion } from "framer-motion";

const modules = [
  {
    title: "KI-Automation",
    icon: "⚡",
    description: "Intelligente Automatisierungssysteme",
  },
  {
    title: "AI Agents",
    icon: "🔷",
    description: "Autonome KI-Agenten",
  },
  {
    title: "Control Dashboards",
    icon: "📊",
    description: "Echtzeit-Analytics & Kontrolle",
  },
  {
    title: "Systemdesign",
    icon: "🌐",
    description: "Intelligente Systemarchitektur",
  },
  {
    title: "Custom Web-Apps",
    icon: "💻",
    description: "Individuelle Web-Anwendungen",
  },
  {
    title: "Integrationen",
    icon: "🔗",
    description: "Systemverbindungen & APIs",
  },
  {
    title: "Neural Interfaces",
    icon: "🧠",
    description: "Intelligente Benutzeroberflächen",
  },
  {
    title: "Data Intelligence",
    icon: "📈",
    description: "Datenanalyse & Insights",
  },
];

export default function SystemModules() {
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
          <span className="text-[#DDE2E8]">Verfügbare</span>
          <br />
          <span className="text-[#00E1FF] neural-text-glow-soft">Module & Tools</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {modules.map((module, index) => (
            <motion.div
              key={index}
              className="neural-glass rounded-neural p-8 hover:neural-glass-hover transition-all duration-500 group cursor-pointer"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <motion.div
                className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500 filter drop-shadow-[0_0_8px_rgba(0,225,255,0.25)]"
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                {module.icon}
              </motion.div>
              <h3 className="text-xl md:text-2xl font-bold text-[#FFFFFF] mb-3 tracking-tight">
                {module.title}
              </h3>
              <p className="text-[#DDE2E8] text-sm md:text-base leading-relaxed font-light">
                {module.description}
              </p>
              <motion.div
                className="mt-5 h-px w-0 bg-gradient-to-r from-[#00E1FF] to-transparent group-hover:w-full transition-all duration-500"
                initial={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

