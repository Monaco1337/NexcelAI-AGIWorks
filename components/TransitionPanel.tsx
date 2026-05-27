"use client";

import { motion } from "framer-motion";

export default function TransitionPanel() {
  const features = [
    "Maßgeschneiderte KI-Entwicklung",
    "Intelligente Automationen",
    "Individuelle Systeme & Plattformen",
  ];

  return (
    <section className="relative py-16 md:py-20 px-6 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          className="neural-glass rounded-[20px] p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(122, 63, 199, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(155, 123, 199, 0.1), 0 0 40px rgba(122, 63, 199, 0.1)",
          }}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-[#FFFFFF] mb-8 text-center tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Warum <span className="text-[#7A3FC7]" style={{ textShadow: "0 0 20px rgba(122, 63, 199, 0.4)" }}>NEXCEL AI</span>?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <div className="w-2 h-2 rounded-full bg-[#7A3FC7] mx-auto mb-4 opacity-60" 
                     style={{ boxShadow: "0 0 10px rgba(122, 63, 199, 0.5)" }} />
                <p className="text-[#E5E7EB] font-light text-base md:text-lg">
                  {feature}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

