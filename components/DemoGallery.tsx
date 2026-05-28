"use client";

import { motion } from "framer-motion";

const projects = [
  { 
    id: 1, 
    title: "Logistik-System", 
    description: "Komplettes Betriebssystem mit KI-gestützter Tourenplanung und Automatisierung. Präzise. Effizient. Skalierbar.",
    category: "KI-System"
  },
  { 
    id: 2, 
    title: "CRM-Lösung", 
    description: "Individuelles Customer-Relationship-Management mit KI-Assistent. Klare Struktur. Intelligente Automatisierung.",
    category: "Systemdesign"
  },
  { 
    id: 3, 
    title: "Workflow-Automation", 
    description: "Intelligente Automatisierung mit KI-gestützter Entscheidungsfindung. Prozesse optimiert. Zeit gespart.",
    category: "KI-Automation"
  },
  { 
    id: 4, 
    title: "Analytics-Dashboard", 
    description: "Echtzeit-Analytics mit KI-gestützten Insights. Klare Visualisierung. Präzise Kontrolle.",
    category: "Control Dashboard"
  },
];

export default function DemoGallery() {
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
          <span className="text-[#00E1FF] neural-text-glow-soft">Projekte</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="relative group"
              initial={{ opacity: 0, y: 50, rotateY: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              {/* Projekt-Card */}
              <div className="neural-glass rounded-neuralLg p-8 transform perspective-1000 hover:neural-glass-hover transition-all duration-500">
                <div className="relative rounded-neural p-8 min-h-[400px] flex flex-col">
                  <div className="mb-6">
                    <span className="px-4 py-2 neural-glass border border-[#00E1FF]/30 text-[#00E1FF] rounded-neuralSm text-xs font-bold tracking-wide">
                      {project.category}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] mb-5 tracking-tight">
                    {project.title}
                  </h3>
                  <p className="text-[#DDE2E8] text-base leading-relaxed flex-grow font-light">
                    {project.description}
                  </p>
                  <div className="mt-8 text-[#A9B8FF] text-sm font-medium tracking-wide">
                    Individuelle Lösung
                  </div>
                </div>
              </div>

              {/* Schwebender Rahmen-Effekt */}
              <motion.div
                className="absolute inset-0 border-2 border-[#00E1FF] rounded-neuralLg opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(0, 225, 255, 0)",
                    "0 0 40px rgba(0, 225, 255, 0.2), 0 0 80px rgba(169, 184, 255, 0.1)",
                    "0 0 0px rgba(0, 225, 255, 0)",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

