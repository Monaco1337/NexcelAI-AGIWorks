"use client";

import { motion } from "framer-motion";

const audiences = [
  {
    title: "Kurierdienste",
    icon: "📦",
  },
  {
    title: "Speditionen",
    icon: "🚚",
  },
  {
    title: "Lieferunternehmen",
    icon: "🚛",
  },
  {
    title: "Firmen mit Fahrern",
    icon: "👥",
  },
];

export default function TargetAudience() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.h2
          className="text-5xl md:text-6xl lg:text-7xl font-semibold text-center mb-20 text-[#0C0F0E]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Für wen die
          <br />
          <span className="text-[#1B8F6A]">Software ist</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              className="ai-surface rounded-aiLg p-10 text-center hover:ai-surface-hover transition-all duration-200 group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{ y: -10, scale: 1.05 }}
            >
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {audience.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold text-[#0C0F0E]">
                {audience.title}
              </h3>
              <div className="mt-6 h-0.5 w-0 bg-[#1B8F6A] group-hover:w-full transition-all duration-300 rounded-full mx-auto" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

