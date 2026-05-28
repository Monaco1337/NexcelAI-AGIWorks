"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CTASection() {
  return (
    <section id="contact" className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle Purple Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(107, 45, 184, 0.3) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#FFFFFF] tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Bereit für dein <span className="text-[#6B2DB8]" style={{ textShadow: "0 0 20px rgba(107, 45, 184, 0.4)" }}>System</span>?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/kontakt">
              <motion.button
                className="neural-button-primary px-12 py-6 rounded-neural font-semibold text-lg"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Projekt starten
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

