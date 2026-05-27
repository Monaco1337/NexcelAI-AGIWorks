"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export default function ArbeitsweisePage() {
  const { theme } = useTheme();

  const steps = [
    {
      number: "01",
      title: "Analyse",
      description: "Wir analysieren Ihre Prozesse, identifizieren Automatisierungspotenziale und definieren klare Anforderungen.",
    },
    {
      number: "02",
      title: "Konzeption",
      description: "Gemeinsam entwickeln wir ein maßgeschneidertes Konzept, das Ihre Anforderungen exakt abbildet.",
    },
    {
      number: "03",
      title: "Entwicklung",
      description: "Wir entwickeln Ihr System mit modernsten Technologien und hohen Qualitätsstandards.",
    },
    {
      number: "04",
      title: "Integration",
      description: "Nahtlose Integration in bestehende Systeme und Strukturen – ohne Medienbrüche.",
    },
    {
      number: "05",
      title: "Optimierung",
      description: "Kontinuierliche Weiterentwicklung und Optimierung basierend auf realen Anforderungen.",
    },
  ];

  return (
    <main className="relative overflow-hidden min-h-screen" style={{
      background: "transparent",
      color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
      position: "relative",
      zIndex: 1,
      minHeight: "100vh",
    }}>
      <Navigation />
      
      {/* HERO SECTION */}
      <section className="relative pt-[120px] md:pt-[150px] pb-16 md:pb-24 px-4 sm:px-6">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 typography-h1 typography-h1-gradient"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Arbeitsweise
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
            }}
          >
            Wie wir Systeme entwickeln – strukturiert, transparent und zielorientiert.
          </motion.p>
        </div>
      </section>

      {/* STEPS SECTION */}
      <section className="relative px-4 sm:px-6 pb-24">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative rounded-[28px] p-6 md:p-8 lg:p-10"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  background: theme === "dark"
                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.10) 30%, rgba(255, 255, 255, 0.06) 60%, rgba(255, 255, 255, 0.03) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
                  backdropFilter: "blur(40px) saturate(200%)",
                  WebkitBackdropFilter: "blur(40px) saturate(200%)",
                  border: theme === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.25)"
                    : "1px solid rgba(0, 0, 0, 0.12)",
                  boxShadow: theme === "dark"
                    ? "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset"
                    : "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.08) inset",
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-bold text-2xl md:text-3xl"
                      style={{
                        background: theme === "dark"
                          ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.4))"
                          : "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(139, 92, 246, 0.3))",
                        border: theme === "dark"
                          ? "1px solid rgba(255, 255, 255, 0.2)"
                          : "1px solid rgba(0, 0, 0, 0.1)",
                        color: theme === "dark" ? "#FFFFFF" : "#000000",
                      }}
                    >
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{
                      color: theme === "dark" ? "#FFFFFF" : "#000000",
                    }}>
                      {step.title}
                    </h3>
                    <p className="text-base md:text-lg leading-relaxed" style={{
                      color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative px-4 sm:px-6 pb-24">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.p
              className="text-xl md:text-2xl mb-8 leading-relaxed"
              style={{
                color: theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
                fontWeight: 500,
              }}
            >
              Bereit für Ihr eigenes System?
            </motion.p>
            <Link href="/kontakt" prefetch={true}>
              <motion.button
                className="relative px-8 md:px-12 py-4 md:py-5 rounded-[20px] font-semibold text-base md:text-lg tracking-wide overflow-hidden group/cta"
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  background: theme === "dark"
                    ? "linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(139, 92, 246, 0.45) 25%, rgba(99, 102, 241, 0.40) 50%, rgba(139, 92, 246, 0.45) 75%, rgba(168, 85, 247, 0.35) 100%)"
                    : "linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(139, 92, 246, 0.5) 25%, rgba(99, 102, 241, 0.45) 50%, rgba(139, 92, 246, 0.5) 75%, rgba(124, 58, 237, 0.4) 100%)",
                  backdropFilter: "blur(40px) saturate(200%)",
                  WebkitBackdropFilter: "blur(40px) saturate(200%)",
                  border: theme === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.25)"
                    : "1px solid rgba(255, 255, 255, 0.4)",
                  boxShadow: theme === "dark"
                    ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset"
                    : "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 0.3) inset",
                }}
              >
                <span className="relative z-10" style={{ color: "#FFFFFF" }}>
                  Kontakt aufnehmen
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
