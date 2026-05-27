"use client";

import { motion } from "framer-motion";

const skills = [
  "KI-Architektur",
  "Full-Stack Engineering",
  "Systemlogik",
  "Automationen",
  "UX für komplexe Prozesse",
];

export default function FounderSectionOptimized() {
  return (
    <section id="founder" className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle Purple Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(107, 45, 184, 0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          className="neural-glass rounded-neuralLg p-12 md:p-16"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-8">
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#FFFFFF] tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Celina Siebeneicher –{" "}
              <span className="text-[#6B2DB8]" style={{ textShadow: "0 0 20px rgba(107, 45, 184, 0.4)" }}>
                KI-Architektin & Systemdesignerin.
              </span>
            </motion.h2>

            <motion.p
              className="text-xl md:text-2xl text-[#E5E7EB] font-light leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Ich baue maßgeschneiderte KI-Systeme und digitale Werkzeuge, die Unternehmen skalierbar machen. Klar. Schnell. Präzise. Ohne Kompromisse.
            </motion.p>

            <motion.p
              className="text-lg md:text-xl text-[#E5E7EB] font-medium italic leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              „Software sollte wie Intelligenz funktionieren – nicht wie Arbeit.&quot;
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3 pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {skills.map((skill, index) => (
                <motion.span
                  key={index}
                  className="px-4 py-2 neural-glass border border-[#6B2DB8]/30 text-[#6B2DB8] rounded-neural text-sm font-medium tracking-wide"
                  whileHover={{ scale: 1.05, borderColor: "rgba(107, 45, 184, 0.5)" }}
                  transition={{ duration: 0.2 }}
                >
                  {skill}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

