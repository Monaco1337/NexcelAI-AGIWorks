"use client";

import { motion } from "framer-motion";

export default function WhyMe() {
  return (
    <section className="relative py-40 px-6 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="neural-glass rounded-neuralLg p-12 md:p-16 lg:p-20"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-16 text-[#FFFFFF] tracking-tight"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-[#00E1FF] neural-text-glow-soft">Über mich</span>
          </motion.h2>

          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl text-[#FFFFFF] font-light leading-relaxed text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Ich bin Celina – KI-Architektin, Full-Stack-Entwicklerin und Systemdesignerin.
          </motion.p>
          
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-[#DDE2E8] font-light leading-relaxed text-center mb-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Ich entwickle intelligente Systeme, die Unternehmen transformieren – präzise, klar und kompromisslos individuell.
          </motion.p>
          
          <motion.div
            className="flex flex-wrap justify-center gap-4 mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {[
              "AI Architecture",
              "Full-Stack Engineering",
              "Automation Systems",
              "Neural UI Design",
            ].map((skill, index) => (
              <motion.span
                key={index}
                className="px-5 py-3 neural-glass border border-[#00E1FF]/30 text-[#00E1FF] rounded-neural text-sm font-bold tracking-wide"
                whileHover={{ scale: 1.05, borderColor: "rgba(0, 225, 255, 0.5)" }}
                transition={{ duration: 0.2 }}
              >
                {skill}
              </motion.span>
            ))}
          </motion.div>

          {/* Futuristic Orb Avatar */}
          <motion.div
            className="flex justify-center mt-16"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="relative w-40 h-40 rounded-full neural-glass border-2 border-[#00E1FF]/40 flex items-center justify-center">
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-radial from-[#00E1FF]/20 to-transparent"
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
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-[#A9B8FF]/10 to-transparent" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
