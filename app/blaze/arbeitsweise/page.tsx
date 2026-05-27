"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useBrand } from "@/contexts/BrandContext";

export default function BlazeArbeitsweisePage() {
  const { theme } = useTheme();
  const brand = useBrand();
  const accentRgb = brand.theme.accentRgb;
  const accentColor = brand.theme.accentPrimary;

  const steps = [
    {
      number: "01",
      title: "Discovery & Architektur",
      description:
        "Wir strukturieren Anforderungen, definieren Schnittstellen und legen eine skalierbare Systemarchitektur fest – abgestimmt auf Compliance, Performance und Wachstum.",
    },
    {
      number: "02",
      title: "Plattform-Design",
      description:
        "Konzeption von Datenmodellen, APIs und Automatisierungsketten. Klare Ownership, Observability und Release-Strategien von Anfang an.",
    },
    {
      number: "03",
      title: "Engineering",
      description:
        "Iterative Entwicklung mit Code-Reviews, automatisierten Tests und CI/CD. Fokus auf Robustheit, Sicherheit und wartbare Codebases.",
    },
    {
      number: "04",
      title: "Integration",
      description:
        "Anbindung an ERP, CRM, Datenplattformen und Legacy-Systeme – ohne unnötige Brüche. Migration und Rollout werden gemeinsam geplant.",
    },
    {
      number: "05",
      title: "Betrieb & Evolution",
      description:
        "Monitoring, SLAs und kontinuierliche Optimierung. Ihre Plattform bleibt messbar, erweiterbar und bereit für die nächste Produktgeneration.",
    },
  ];

  return (
    <main
      className="relative overflow-hidden min-h-screen"
      style={{
        background: "transparent",
        color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
      }}
    >
      <section className="relative pt-[120px] md:pt-[150px] pb-16 md:pb-24 px-4 sm:px-6">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{
              background: `rgba(${accentRgb},0.12)`,
              border: `1px solid rgba(${accentRgb},0.3)`,
              color: accentColor,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Vorgehensmodell
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6"
            style={{
              background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.72) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
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
              color: theme === "dark" ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)",
            }}
          >
            Von der Architektur bis zum Betrieb – strukturiert, messbar und auf Enterprise-Niveau.
          </motion.p>
        </div>
      </section>

      <section className="relative px-4 sm:px-6 pb-24">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative rounded-[28px] p-6 md:p-8 lg:p-10"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  background: theme === "dark"
                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.88) 100%)",
                  border: `1px solid rgba(${accentRgb},0.18)`,
                  boxShadow: theme === "dark"
                    ? `0 20px 60px rgba(0, 0, 0, 0.45), 0 0 0 0.5px rgba(${accentRgb},0.08) inset`
                    : "0 20px 60px rgba(0, 0, 0, 0.08)",
                }}
              >
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                  <div
                    className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-lg md:text-xl font-bold"
                    style={{
                      background: `rgba(${accentRgb},0.15)`,
                      border: `1px solid rgba(${accentRgb},0.35)`,
                      color: accentColor,
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-2xl md:text-3xl font-bold mb-3 tracking-tight"
                      style={{ color: theme === "dark" ? "#FFFFFF" : "#000000" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-base md:text-lg leading-relaxed"
                      style={{
                        color: theme === "dark" ? "rgba(255, 255, 255, 0.68)" : "rgba(0, 0, 0, 0.68)",
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 sm:px-6 pb-24">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.p
            className="text-xl md:text-2xl mb-8 leading-relaxed font-medium"
            style={{
              color: theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Bereit für eine Architektur, die mitwächst?
          </motion.p>
          <Link href="/blaze/kontakt" prefetch={true}>
            <motion.span
              className="inline-flex items-center justify-center px-8 md:px-12 py-4 md:py-5 rounded-[20px] font-semibold text-base md:text-lg cursor-pointer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                color: "#fff",
                background: `linear-gradient(135deg, rgba(${accentRgb},0.35) 0%, rgba(${accentRgb},0.55) 100%)`,
                border: `1px solid rgba(${accentRgb},0.45)`,
                boxShadow: `0 12px 40px rgba(${accentRgb},0.2)`,
              }}
            >
              Gespräch vereinbaren
            </motion.span>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
