"use client";

import { motion } from "framer-motion";

const skills = [
  {
    name: "AI System Architecture",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-1.024.324-2.046.78-3.032 1.362a1.5 1.5 0 000 2.638c.986.582 2.008 1.038 3.032 1.362M9.75 3.104l2.25 2.252M9.75 3.104l-2.25 2.252M5 14.5l2.25-2.252M5 14.5l-2.25-2.252M5 14.5h14.5M5 14.5v5.714a2.25 2.25 0 00.659 1.591L9.75 21.896M19.5 14.5v5.714a2.25 2.25 0 01-.659 1.591L15.25 21.896M9.75 21.896v-5.714a2.25 2.25 0 00-.659-1.591L5 14.5m14.5 0v-5.714a2.25 2.25 0 00-.659-1.591L15.25 3.104M9.75 21.896l2.25-2.252M9.75 21.896l-2.25-2.252M15.25 3.104l2.25 2.252M15.25 3.104l-2.25 2.252" />
      </svg>
    ),
  },
  {
    name: "Full-Stack Engineering",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    name: "Workflow Automation",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    name: "Neural UX Design",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    name: "Operational Intelligence",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    name: "Custom Software Development",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
];

export default function FounderSection() {
  return (
    <section className="relative py-40 px-6 overflow-hidden">
      {/* Subtle Neural Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#A9B8FF]/10 to-transparent"
          animate={{
            opacity: [0.1, 0.2, 0.1],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#00E1FF]/10 to-transparent"
          animate={{
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#A9B8FF]/10 to-transparent"
          animate={{
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Avatar Placeholder */}
          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              {/* Outer Glow Ring */}
              <motion.div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{
                  background: "radial-gradient(circle, rgba(0, 225, 255, 0.2), rgba(169, 184, 255, 0.1), transparent)",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Glass Avatar Container */}
              <div className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-full neural-glass border-2 border-[#00E1FF]/30 overflow-hidden">
                {/* Inner Glow */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "radial-gradient(circle, rgba(0, 225, 255, 0.1), transparent)",
                  }}
                />
                
                {/* Avatar Placeholder Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full flex items-center justify-center">
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{
                        background: "radial-gradient(circle, rgba(0, 225, 255, 0.2), rgba(169, 184, 255, 0.1), transparent)",
                      }}
                    >
                      <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-[#DDE2E8]/20 to-[#00E1FF]/10 flex items-center justify-center">
                        <span className="text-6xl lg:text-7xl font-bold text-[#00E1FF]/30">C</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Holographic Edge */}
                <div className="absolute inset-0 rounded-full border border-[#00E1FF]/20" />
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Headline */}
            <motion.h2
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] tracking-tight leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Die Architektin
              <br />
              <span className="text-[#00E1FF] neural-text-glow-soft">hinter NEXCEL AI.</span>
            </motion.h2>

            {/* Subheadline */}
            <motion.p
              className="text-xl md:text-2xl text-[#DDE2E8] font-light tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Präzision. Intelligenz. Systemdenken.
            </motion.p>

            {/* Bio Text */}
            <motion.div
              className="space-y-6 text-lg md:text-xl text-[#DDE2E8] font-light leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <p>
                Ich bin Celina – KI-Architektin, Systemingenieurin und Full-Stack-Developerin. Ich entwickle digitale Intelligenz für Unternehmen: Systeme, die verstehen, lernen, strukturieren und Prozesse automatisieren.
              </p>
              <p>
                Meine Arbeit basiert auf Klarheit, Geschwindigkeit und kompromissloser Qualität.
              </p>
              <p className="text-[#A9B8FF]">
                Ich baue nicht einfach Software – ich erschaffe funktionale Intelligenz, die Unternehmen voranbringt.
              </p>
            </motion.div>

            {/* Skill Badges */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              {skills.map((skill, index) => (
                <motion.div
                  key={index}
                  className="neural-glass rounded-neural p-4 hover:neural-glass-hover transition-all duration-500 group cursor-pointer"
                  whileHover={{ y: -4, scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: 1 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="text-[#00E1FF] group-hover:text-[#00E1FF] transition-colors duration-300">
                      {skill.icon}
                    </div>
                    <span className="text-sm font-medium text-[#FFFFFF] tracking-wide leading-tight">
                      {skill.name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

