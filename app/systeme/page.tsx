"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import dynamic from "next/dynamic";

const ChronexDashboard = dynamic(() => import("@/components/ChronexDashboard"), {
  ssr: false,
  loading: () => <div className="h-64 bg-white/[0.02] rounded-xl animate-pulse" />
});

export default function SystemePage() {
  const { theme } = useTheme();

  const systems = [
    {
      id: "chronex",
      title: "ChronexAI",
      subtitle: "KI-basierte Prozessautomatisierung",
      description: "Autonome Tourenoptimierung für Speditionen. Reduziert Verwaltungsaufwand um 70%.",
      features: [
        "Automatische Disposition",
        "Echtzeit-Tracking",
        "Routenoptimierung",
        "24/7 Automation"
      ],
      dashboard: ChronexDashboard,
    },
    {
      id: "immostripe",
      title: "ImmoStripeAI",
      subtitle: "Digitale Immobilienplattform",
      description: "Digitale Plattform zur Automatisierung von Immobilien- und Verwaltungsprozessen.",
      features: [
        "Automatisierte Verwaltung",
        "Dokumentenmanagement",
        "KI-gestützte Prozesse",
        "Echtzeit-Übersicht"
      ],
      dashboard: null,
    },
    {
      id: "canaflow",
      title: "CannaFlowAI",
      subtitle: "Produktions- und Betriebslösung",
      description: "Prozess- und Systemlösung für strukturierte Produktions- und Betriebsabläufe.",
      features: [
        "Produktionssteuerung",
        "Qualitätsmanagement",
        "Automatisierte Abläufe",
        "Echtzeit-Monitoring"
      ],
      dashboard: null,
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
            Unsere Systeme
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
            Unsere Lösungen entstehen aus realen Anforderungen und werden kontinuierlich weiterentwickelt.
          </motion.p>
        </div>
      </section>

      {/* SYSTEMS GRID */}
      <section className="relative px-4 sm:px-6 pb-24">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            {systems.map((system, index) => (
              <motion.div
                key={system.id}
                className="relative rounded-[28px] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
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
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight" style={{
                    color: theme === "dark" ? "#FFFFFF" : "#000000",
                  }}>
                    {system.title}
                  </h3>
                  <p className="text-sm md:text-base font-semibold mb-4" style={{
                    color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                  }}>
                    {system.subtitle}
                  </p>
                  <p className="text-sm md:text-base leading-relaxed mb-6" style={{
                    color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                  }}>
                    {system.description}
                  </p>
                  
                  {system.dashboard && (
                    <div className="mb-6 rounded-xl overflow-hidden">
                      <system.dashboard />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {system.features.map((feature, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          theme === "dark"
                            ? "bg-white/[0.05] text-white/70 border border-white/[0.1]"
                            : "bg-[#0C0F1A]/5 text-[#1B2030]/70 border border-[#0C0F1A]/10"
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
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
              Sie möchten mehr über unsere Systeme erfahren?
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
