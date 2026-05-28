"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const projects = [
  {
    id: 1,
    title: "NEXCEL OS",
    description: "Ein eigenes KI-Betriebssystem – modulares, intelligentes System für Workflows, Daten und Automationen.",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-1.024.324-2.046.78-3.032 1.362a1.5 1.5 0 000 2.638c.986.582 2.008 1.038 3.032 1.362M9.75 3.104l2.25 2.252M9.75 3.104l-2.25 2.252M5 14.5l2.25-2.252M5 14.5l-2.25-2.252M5 14.5h14.5M5 14.5v5.714a2.25 2.25 0 00.659 1.591L9.75 21.896M19.5 14.5v5.714a2.25 2.25 0 01-.659 1.591L15.25 21.896M9.75 21.896v-5.714a2.25 2.25 0 00-.659-1.591L5 14.5m14.5 0v-5.714a2.25 2.25 0 00-.659-1.591L15.25 3.104M9.75 21.896l2.25-2.252M9.75 21.896l-2.25-2.252M15.25 3.104l2.25 2.252M15.25 3.104l-2.25 2.252" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "AI-Automation Engine",
    description: "Intelligente KI-Automationen – automatisiert Aufgaben, Workflows und Entscheidungen in Unternehmen.",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "CRM-System",
    description: "Individuelles CRM – Leads, Kunden, Teams, Aufgaben, Automationen, Rollen & Rechte, Live-Pipelines.",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Projektmanagement-System",
    description: "Planung & Struktur neu gedacht – Aufgabenbereiche, Status & Prioritäten, Kalender & Deadlines, KI-Insights.",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 5,
    title: "Speditionssystem",
    description: "KI-Transportzentrale – Fahrerübersicht, Kalender, Touren, Zeittracking für die Logistikbranche.",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9m3 15.75h6m-9 0H21m-3.75 0H18m-9.75 0H3.375c-.621 0-1.125.504-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125V18.75m-18 0v-3.375a1.125 1.125 0 011.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v3.375" />
      </svg>
    ),
  },
  {
    id: 6,
    title: "Website-Development",
    description: "Ästhetische & technische Webseiten – Webseiten, die Identität transportieren und Zukunft ausstrahlen.",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
];

const ProjectCard = ({ project, index }: { project: typeof projects[0]; index: number }) => {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6, scale: 1.02 }}
    >
      <Link href="/projekte" className="block h-full">
        <div
          className="relative h-full rounded-neuralLg p-8 transition-all duration-500 cursor-pointer overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            border: "1px solid rgba(164, 92, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Hover Glow Effect - Neon Lila */}
          <motion.div
            className="absolute inset-0 rounded-neuralLg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.15) 0%, transparent 70%)",
              boxShadow: "0 0 60px rgba(164, 92, 255, 0.3), inset 0 0 40px rgba(164, 92, 255, 0.08)",
            }}
          />

          {/* Neon Lila Edge Light on Hover */}
          <motion.div
            className="absolute inset-0 rounded-neuralLg pointer-events-none"
            style={{
              border: "1px solid rgba(164, 92, 255, 0)",
              transition: "border-color 0.5s ease",
            }}
            whileHover={{
              borderColor: "rgba(164, 92, 255, 0.6)",
              boxShadow: "0 0 30px rgba(164, 92, 255, 0.4), inset 0 0 20px rgba(164, 92, 255, 0.15)",
            }}
          />

          {/* 3D Depth Effect */}
          <motion.div
            className="absolute inset-0 rounded-neuralLg pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(164, 92, 255, 0.05) 0%, transparent 50%)",
              opacity: 0,
            }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col space-y-6">
            {/* Icon with Neon Lila Glow */}
            <motion.div
              className="text-[#A45CFF]"
              style={{ filter: "drop-shadow(0 0 10px rgba(164, 92, 255, 0.6))" }}
              animate={{
                scale: [1, 1.01, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {project.icon}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold text-[#FFFFFF] tracking-tight leading-tight">
              {project.title}
            </h3>

            {/* Description */}
            <p className="text-[#E5E7EB] text-sm md:text-base font-light leading-relaxed">
              {project.description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function ProjectsSection() {
  return (
    <section id="projects" className="relative py-20 md:py-24 px-6 overflow-hidden">
      {/* Subtle Neon Lila Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(164, 92, 255, 0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#FFFFFF] tracking-tight mb-4">
            Meine <span className="text-[#A45CFF]" style={{ textShadow: "0 0 30px rgba(164, 92, 255, 0.5)" }}>Projekte</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#E5E7EB] font-light max-w-3xl mx-auto">
            Systeme, die Zukunft bauen.
          </p>
        </motion.div>

        {/* Projects Grid - Responsive: 1 (Mobile) / 2 (Tablet) / 3 (Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

