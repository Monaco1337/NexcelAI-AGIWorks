"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MonolithCardProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  bullets?: string[];
  metrics?: Array<{ label: string; value: string }>;
  index?: number;
  theme?: "dark" | "light";
}

export default function MonolithCard({ 
  icon, 
  title, 
  subtitle = "KI Infrastruktur",
  description,
  bullets,
  metrics,
  index = 0,
  theme = "dark"
}: MonolithCardProps) {
  return (
    <motion.div
      className="relative group h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.05 }}
      whileHover={{ scale: 1.0 }}
      style={{ willChange: "transform, opacity" }}
    >
      {/* Main Card Container - Ultra High-End Apple Design */}
      <div
        className="relative rounded-[28px] overflow-hidden isolation-isolate h-full flex flex-col"
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
            ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.12) inset, 0 1px 2px rgba(0, 0, 0, 0.2) inset"
            : "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.06) inset",
        }}
      >
        {/* Glowing Edge Accents - Top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-70 transition-opacity duration-300"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.6), rgba(255, 255, 255, 0.8), transparent)",
            boxShadow: "0 0 12px rgba(168, 85, 247, 0.2), 0 0 24px rgba(139, 92, 246, 0.15)",
          }}
        />

        {/* Glowing Edge Accents - Left */}
        <div
          className="absolute top-0 bottom-0 left-0 w-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.8), rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.6), rgba(255, 255, 255, 0.8), transparent)",
            boxShadow: "0 0 12px rgba(168, 85, 247, 0.2), 0 0 24px rgba(139, 92, 246, 0.15)",
          }}
        />

        {/* Glowing Edge Accents - Right */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.8), rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.6), rgba(255, 255, 255, 0.8), transparent)",
            boxShadow: "0 0 12px rgba(168, 85, 247, 0.2), 0 0 24px rgba(139, 92, 246, 0.15)",
          }}
        />

        {/* Glowing Edge Accents - Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.6), rgba(255, 255, 255, 0.8), transparent)",
            boxShadow: "0 0 12px rgba(168, 85, 247, 0.2), 0 0 24px rgba(139, 92, 246, 0.15)",
          }}
        />

        {/* Base Color Layer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: theme === "dark"
              ? "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.08) 25%, transparent 50%, rgba(99, 102, 241, 0.08) 75%, rgba(168, 85, 247, 0.12) 100%)"
              : "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)",
          }}
        />

        {/* Radial Glow Layer */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: theme === "dark"
              ? "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.10) 30%, transparent 70%)"
              : "radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)",
          }}
        />

        {/* Gloss Shine Effect */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          initial={{ x: "-100%", opacity: 0 }}
          whileHover={{ x: "100%", opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
          }}
        />

        {/* Content - CSS Grid für exakte vertikale Ausrichtung */}
        <div 
          className="relative z-10 p-5 md:p-7"
          style={{
            display: "grid",
            gridTemplateRows: icon 
              ? "clamp(80px, 10vw, 120px) clamp(28px, 3.5vw, 56px) clamp(20px, 2.5vw, 28px) 1fr" 
              : "clamp(28px, 3.5vw, 56px) clamp(20px, 2.5vw, 28px) 1fr",
            gap: "0",
            height: "100%",
            alignContent: "start",
          }}
        >
          {/* Row 1: Icon Section - Fixed Height */}
          {icon && (
            <div 
              className="flex justify-center items-center"
              style={{
                height: "clamp(80px, 10vw, 120px)",
                paddingBottom: "clamp(16px, 2vw, 24px)",
                boxSizing: "border-box",
              }}
            >
              <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
                {/* Icon Glow Background */}
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(circle, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2), transparent)",
                    filter: "blur(20px)",
                    transform: "scale(1.2)",
                  }}
                />
                {/* Icon Container */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {icon}
                </div>
                {/* Icon Outer Glow */}
                <div
                  className="absolute inset-0 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent 70%)",
                    filter: "blur(15px)",
                    transform: "scale(1.3)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Metrics Section - nur wenn vorhanden */}
          {metrics && metrics.length > 0 && (
            <div 
              className="grid grid-cols-3 gap-4"
              style={{
                minHeight: "clamp(60px, 8vw, 90px)",
                paddingBottom: icon ? "clamp(16px, 2vw, 24px)" : "0",
              }}
            >
              {metrics.map((metric, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-xs font-medium mb-2 uppercase tracking-wider"
                    style={{
                      color: theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {metric.label}
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{
                      color: theme === "dark" ? "#FFFFFF" : "#000000",
                      textShadow: theme === "dark" ? "0 0 20px rgba(168, 85, 247, 0.4)" : "none",
                    }}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Row 2: Title - Fixed Height, alle Cards identisch - Future-Premium */}
          <h3
            className="text-xl md:text-2xl font-bold tracking-tight text-center flex items-center justify-center"
            style={{
              color: theme === "dark" ? "#FFFFFF" : "#000000",
              textShadow: theme === "dark" ? "0 0 30px rgba(168, 85, 247, 0.3)" : "none",
              lineHeight: "1.05",
              height: "clamp(28px, 3.5vw, 56px)",
              paddingBottom: "clamp(8px, 1vw, 12px)",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {title}
          </h3>

          {/* Row 3: Subtitle - Fixed Height, alle Cards identisch - Future-Premium */}
          <p
            className="text-xs md:text-sm font-medium text-center flex items-center justify-center"
            style={{
              color: theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
              opacity: 0.85,
              lineHeight: "1.55",
              height: "clamp(20px, 2.5vw, 28px)",
              paddingBottom: "clamp(12px, 1.5vw, 16px)",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {subtitle}
          </p>

          {/* Row 4: Bullets/Description - Flexible Bereich */}
          <div className="flex items-center justify-center w-full">
            {bullets && bullets.length > 0 ? (
              <ul className="space-y-2 w-full" style={{ textAlign: "center" }}>
                {bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="text-sm font-light leading-relaxed"
                    style={{
                      color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                      textAlign: "center",
                      listStyle: "none",
                      display: "block",
                    }}
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : description ? (
              <p
                className="text-sm font-light leading-relaxed text-center w-full"
                style={{
                  color: theme === "dark" ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)",
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hover Glow Enhancement - Outer */}
      <div
        className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
        style={{
          background: theme === "dark"
              ? "radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)"
              : "radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%)",
          filter: "blur(50px)",
          transform: "scale(1.15)",
        }}
      />
    </motion.div>
  );
}
