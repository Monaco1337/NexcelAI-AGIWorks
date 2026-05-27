"use client";

import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ClearSystemsIcon, FastImplementationIcon, ScalableArchitectureIcon, DirectCollaborationIcon } from "@/components/WorkPrincipleIcons";

const workPrinciples = [
  {
    title: "Klare Systeme",
    description: "Statt komplizierter Lösungen entwickeln wir intuitive, durchdachte Architekturen, die sofort verständlich sind.",
    icon: ClearSystemsIcon
  },
  {
    title: "Schnelle Umsetzung",
    description: "Saubere Implementierung ohne Umwege. Wir liefern funktionierende Systeme, nicht Versprechungen.",
    icon: FastImplementationIcon
  },
  {
    title: "Skalierbare Architektur",
    description: "Jedes System wächst mit Ihrem Unternehmen. Nachhaltige Lösungen für langfristigen Erfolg.",
    icon: ScalableArchitectureIcon
  },
  {
    title: "Direkte Zusammenarbeit",
    description: "Transparente Kommunikation ohne Agenturfilter. Sie arbeiten direkt mit den Entwicklern.",
    icon: DirectCollaborationIcon
  },
];

const values = [
  {
    title: "Autonomie",
    description: "Systeme, die eigenständig arbeiten und Entscheidungen treffen – ohne ständige menschliche Intervention.",
  },
  {
    title: "Präzision",
    description: "Jede Zeile Code, jedes Feature ist durchdacht und auf Ihren spezifischen Use Case optimiert.",
  },
  {
    title: "Innovation",
    description: "Wir nutzen die neuesten KI-Technologien, um Lösungen zu schaffen, die vorher nicht möglich waren.",
  },
  {
    title: "Partnerschaft",
    description: "Langfristige Zusammenarbeit statt einmaliger Projekte. Wir wachsen gemeinsam mit Ihnen.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "Gründung",
    description: "NEXCEL AI wird gegründet mit dem Ziel, Unternehmen durch autonome KI-Systeme zu transformieren.",
  },
  {
    year: "Heute",
    title: "Aktive Projekte",
    description: "Wir entwickeln und betreuen Systeme für Unternehmen aus verschiedenen Branchen – von Logistik bis Pflege.",
  },
];


export default function UeberUnsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navigation />
      
      {/* Section 1 – Hero */}
      <section className="relative min-h-screen flex items-center justify-center py-20 md:py-32 px-6">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Links: Profilbild */}
            <motion.div
              className="flex justify-center lg:justify-start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                {/* Neon-Lila-Ring mit Glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(164, 92, 255, 0.4) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div 
                  className="relative w-full h-full rounded-full overflow-hidden border-2"
                  style={{
                    borderColor: "rgba(164, 92, 255, 0.5)",
                    boxShadow: "0 0 40px rgba(164, 92, 255, 0.3), inset 0 0 20px rgba(164, 92, 255, 0.1)",
                    background: "rgba(12, 15, 26, 0.8)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <Image
                    src="/EBCD81F6-6A50-4ADA-BFFB-3625476A94B5.PNG"
                    alt="Celina Siebeneicher - Gründerin & KI-Architektin"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
                    quality={95}
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center top',
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Rechts: Text-Block */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight typography-h1 typography-h1-gradient"
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                Über <span className="typography-h1-gradient">uns</span>
              </motion.h1>
              <p className="text-lg md:text-xl typography-body leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-6">
                NEXCEL AI wird von Celina Siebeneicher geleitet – KI-Architektin und Gründerin. Wir bauen keine Software von der Stange, sondern autonome Systeme, die Prozesse ersetzen statt sie nur zu optimieren.
              </p>
              <p className="text-base md:text-lg typography-body-secondary leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Unser Ziel ist es, Unternehmen vollständig von manuellen Abhängigkeiten zu befreien. Wir entwickeln intelligente Infrastrukturen, die wie ein eigenes Betriebssystem für Ihr Unternehmen funktionieren.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2 – Unsere Vision */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            className="relative rounded-3xl overflow-hidden p-10 md:p-16"
            style={{
              background: "rgba(12, 15, 26, 0.7)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(164, 92, 255, 0.05)",
            }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight typography-h1 typography-h1-gradient"
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Unsere <span className="typography-h1-gradient">Vision</span>
            </motion.h2>
            <p className="text-lg md:text-xl typography-body leading-relaxed mb-6">
              Wir denken in Systemen. Unsere Arbeit beginnt dort, wo klassische Software an ihre Grenzen stößt. Wir verbinden Prozessanalyse, KI-Architektur und individuelle Systementwicklung zu Lösungen, die sich wie ein eigenes Betriebssystem für Ihr Unternehmen anfühlen.
            </p>
            <p className="text-base md:text-lg typography-body-secondary leading-relaxed">
              Wir arbeiten nicht mit Baukästen. Jedes System entsteht exakt für Ihre Struktur, Ihre Abläufe und Ihr Wachstum. Unser Ziel ist es, Unternehmen vollständig von manuellen Abhängigkeiten zu befreien und autonome Infrastrukturen zu schaffen, die 24/7 arbeiten.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 3 – Wie wir arbeiten */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 md:mb-16 text-center tracking-tight typography-h1 typography-h1-gradient"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Wie wir <span className="typography-h1-gradient">arbeiten</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {workPrinciples.map((principle, index) => {
              const IconComponent = principle.icon;
              return (
                <motion.div
                  key={index}
                  className="relative rounded-2xl overflow-hidden p-8 md:p-10 group"
                  style={{
                    background: "rgba(12, 15, 26, 0.7)",
                    backdropFilter: "blur(30px)",
                    WebkitBackdropFilter: "blur(30px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(164, 92, 255, 0.02)",
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.03,
                    boxShadow: "0 12px 40px rgba(164, 92, 255, 0.3), inset 0 0 30px rgba(164, 92, 255, 0.08)",
                    borderColor: "rgba(164, 92, 255, 0.4)",
                  }}
                >
                  {/* Hover Glow Overlay */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.15), transparent 70%)",
                    }}
                  />
                  
                  {/* Icon Container */}
                  <div className="relative z-10 flex justify-center mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <IconComponent className="w-24 h-24" />
                    </motion.div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-lg md:text-xl font-bold mb-4 text-[#FFFFFF] text-center tracking-tight">
                      {principle.title}
                    </h3>
                    <p className="text-sm md:text-base font-light text-[#E5E7EB] leading-relaxed text-center">
                      {principle.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4 – Unsere Werte */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 md:mb-16 text-center tracking-tight typography-h1 typography-h1-gradient"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Unsere <span className="typography-h1-gradient">Werte</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="relative rounded-2xl overflow-hidden p-8 md:p-10 group"
                style={{
                  background: "rgba(12, 15, 26, 0.7)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -4,
                  boxShadow: "0 8px 30px rgba(164, 92, 255, 0.2), inset 0 0 20px rgba(164, 92, 255, 0.05)",
                  borderColor: "rgba(164, 92, 255, 0.3)",
                }}
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-4 typography-h2-gradient">
                  {value.title}
                </h3>
                <p className="text-base md:text-lg typography-body leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 – Unsere Geschichte */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 md:mb-16 text-center tracking-tight typography-h1 typography-h1-gradient"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Unsere <span className="typography-h1-gradient">Geschichte</span>
          </motion.h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                className="relative rounded-2xl overflow-hidden p-8 md:p-10"
                style={{
                  background: "rgba(12, 15, 26, 0.6)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex-shrink-0">
                    <span className="text-4xl md:text-5xl font-bold typography-h1-gradient">
                      {milestone.year}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">
                      {milestone.title}
                    </h3>
                    <p className="text-base md:text-lg typography-body leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7 – Wofür NEXCEL AI steht */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            className="relative rounded-3xl overflow-hidden p-10 md:p-16"
            style={{
              background: "rgba(12, 15, 26, 0.7)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(164, 92, 255, 0.05)",
            }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight typography-h1 typography-h1-gradient"
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Wofür <span className="typography-h1-gradient">NEXCEL AI</span> steht
            </motion.h2>
            <p className="text-lg md:text-xl typography-body leading-relaxed mb-8">
              NEXCEL AI ist kein Tool und kein Baukastensystem. Jedes System entsteht individuell für Ihr Unternehmen. Wir begleiten Sie von der ersten Analyse über die Entwicklung bis zur laufenden Optimierung. Unser Fokus liegt auf Automatisierung, Systemstabilität und echter unternehmerischer Entlastung.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {["KI-Architektur", "Individuelle Systementwicklung", "Workflow-Automation", "Unternehmensprozesse", "Digitale Steuerzentralen"].map((skill, index) => (
                <motion.span
                  key={index}
                  className="px-4 py-3 rounded-xl text-center text-sm md:text-base font-medium"
                  style={{
                    background: "rgba(164, 92, 255, 0.1)",
                    border: "1px solid rgba(164, 92, 255, 0.3)",
                    color: "#C6A8FF",
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05, 
                    borderColor: "rgba(164, 92, 255, 0.5)",
                    background: "rgba(164, 92, 255, 0.15)",
                  }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
