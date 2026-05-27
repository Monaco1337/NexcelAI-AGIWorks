"use client";

import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";

const CATEGORY_LABELS: Record<string, string> = {
  own: "Eigenes System",
  product: "Produkt",
  collaboration: "Strategische Zusammenarbeit",
};

export default function BlazeSystemePage() {
  const { theme } = useTheme();
  const brand = useBrand();
  const accentRgb = brand.theme.accentRgb;
  const accentColor = brand.theme.accentPrimary;

  const ownSystems = brand.systems.filter((s) => s.category === "own");
  const products = brand.systems.filter((s) => s.category === "product");
  const collabs = brand.systems.filter((s) => s.category === "collaboration");

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
      {/* HERO */}
      <section className="relative pt-[120px] md:pt-[150px] pb-16 md:pb-20 px-4 sm:px-6">
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
            transition={{ duration: 0.4 }}
          >
            {brand.name}
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            style={{
              background: `linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            System Portfolio
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Eigene Systeme, Produkte und strategische Kollaborationen – entwickelt für die nächste Generation digitaler Unternehmen.
          </motion.p>
        </div>
      </section>

      <div className="relative px-4 sm:px-6 pb-24 max-w-7xl mx-auto">
        {/* Eigene Systeme */}
        <SystemSection
          title="Eigene Systeme"
          systems={ownSystems}
          accentRgb={accentRgb}
          accentColor={accentColor}
          theme={theme}
          delay={0}
        />

        {/* Produkte */}
        {products.length > 0 && (
          <SystemSection
            title="Produkte"
            subtitle="Eigenentwickelte Plattformen unter AGI Works"
            systems={products}
            accentRgb={accentRgb}
            accentColor={accentColor}
            theme={theme}
            delay={0.1}
            badge="Produkt"
          />
        )}

        {/* Strategische Zusammenarbeit */}
        {collabs.length > 0 && (
          <SystemSection
            title="Strategische Zusammenarbeit"
            subtitle="Gemeinsame Systeme mit strategischen Partnern"
            systems={collabs}
            accentRgb={accentRgb}
            accentColor={accentColor}
            theme={theme}
            delay={0.2}
            badge="Strategische Zusammenarbeit"
            muted
          />
        )}
      </div>

      <Footer />
    </main>
  );
}

function SystemSection({
  title,
  subtitle,
  systems,
  accentRgb,
  accentColor,
  theme,
  delay = 0,
  badge,
  muted = false,
}: {
  title: string;
  subtitle?: string;
  systems: { id: string; title: string; subtitle: string; description: string; features: string[]; category: string; collaborationBrand?: string }[];
  accentRgb: string;
  accentColor: string;
  theme: string;
  delay?: number;
  badge?: string;
  muted?: boolean;
}) {
  return (
    <motion.div
      className="mb-16 md:mb-20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h2
            className="text-xl sm:text-2xl font-semibold text-white"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-white/50 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="flex-1 h-px"
          style={{ background: `linear-gradient(to right, rgba(${accentRgb},0.3), transparent)` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {systems.map((system, index) => (
          <motion.div
            key={system.id}
            className="relative rounded-[24px] overflow-hidden"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              background: muted
                ? "rgba(255,255,255,0.03)"
                : theme === "dark"
                ? "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)"
                : "rgba(255,255,255,0.9)",
              border: `1px solid ${muted ? `rgba(${accentRgb},0.12)` : `rgba(${accentRgb},0.2)`}`,
              boxShadow: muted
                ? "none"
                : `0 12px 40px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(${accentRgb},0.1) inset`,
            }}
          >
            <div className="p-6 md:p-7">
              {/* Badge */}
              {badge && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold mb-4"
                  style={{
                    background: `rgba(${accentRgb},0.15)`,
                    border: `1px solid rgba(${accentRgb},0.3)`,
                    color: accentColor,
                  }}
                >
                  {badge}
                  {system.collaborationBrand && ` · ${system.collaborationBrand}`}
                </span>
              )}

              <h3
                className="text-xl md:text-2xl font-bold mb-1.5"
                style={{ color: theme === "dark" ? "#FFFFFF" : "#000000" }}
              >
                {system.title}
              </h3>
              <p
                className="text-sm font-semibold mb-3"
                style={{ color: accentColor }}
              >
                {system.subtitle}
              </p>
              <p
                className="text-sm md:text-base leading-relaxed mb-5"
                style={{ color: theme === "dark" ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)" }}
              >
                {system.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {system.features.map((feature, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: `rgba(${accentRgb},0.08)`,
                      border: `1px solid rgba(${accentRgb},0.15)`,
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
