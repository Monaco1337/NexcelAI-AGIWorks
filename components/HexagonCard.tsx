"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface HexagonCardProps {
  children: ReactNode;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  metrics?: Array<{ label: string; value: string }>;
  index?: number;
  theme?: "dark" | "light";
}

export default function HexagonCard({ 
  children, 
  icon, 
  title, 
  subtitle = "KI Infrastruktur",
  metrics,
  index = 0,
  theme = "dark"
}: HexagonCardProps) {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      {/* Hexagon Shape with Glow */}
      <div className="relative" style={{ padding: "2px" }}>
        {/* Outer Glow */}
        <div
          className="absolute inset-0"
          style={{
            background: theme === "dark"
              ? "linear-gradient(135deg, rgba(0, 225, 255, 0.4), rgba(164, 92, 255, 0.4))"
              : "linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(124, 58, 237, 0.3))",
            filter: "blur(20px)",
            opacity: 0.6,
            borderRadius: "20px",
            transform: "scale(1.1)",
          }}
        />
        
        {/* Hexagon Container */}
        <div
          className="relative group/hex"
          style={{
            clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
            background: theme === "dark"
              ? "rgba(12, 15, 26, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: theme === "dark"
              ? "2px solid rgba(0, 225, 255, 0.5)"
              : "2px solid rgba(124, 58, 237, 0.5)",
            boxShadow: theme === "dark"
              ? "0 0 40px rgba(0, 225, 255, 0.3), inset 0 0 60px rgba(164, 92, 255, 0.1)"
              : "0 0 40px rgba(124, 58, 237, 0.2), inset 0 0 60px rgba(124, 58, 237, 0.05)",
            transition: "all 0.5s ease",
          }}
        >
          {/* Hover Glow Effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover/hex:opacity-100 transition-opacity duration-500"
            style={{
              background: theme === "dark"
                ? "radial-gradient(circle at center, rgba(0, 225, 255, 0.2) 0%, rgba(164, 92, 255, 0.15) 50%, transparent 100%)"
                : "radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 100%)",
              boxShadow: theme === "dark"
                ? "0 0 80px rgba(0, 225, 255, 0.4), inset 0 0 80px rgba(164, 92, 255, 0.2)"
                : "0 0 80px rgba(124, 58, 237, 0.3), inset 0 0 80px rgba(124, 58, 237, 0.1)",
            }}
          />
          <div className="p-4 sm:p-6 md:p-8 flex flex-col min-h-[400px] sm:min-h-[450px]">
            {/* Icon */}
            {icon && (
              <motion.div
                className="mb-3 sm:mb-4 flex justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                {icon}
              </motion.div>
            )}
            
            {/* Metrics */}
            {metrics && metrics.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-4 sm:mb-6">
                {metrics.map((metric, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    style={{
                      background: theme === "dark"
                        ? "rgba(0, 0, 0, 0.4)"
                        : "rgba(0, 0, 0, 0.05)",
                      borderRadius: "8px",
                      padding: "8px 4px",
                      border: theme === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 + 0.3 + i * 0.05 }}
                  >
                    <div
                      className="text-xs sm:text-sm font-medium mb-1"
                      style={{
                        color: theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {metric.label}
                    </div>
                    <div
                      className="text-base sm:text-lg font-bold"
                      style={{
                        color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
                      }}
                    >
                      {metric.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Visualization */}
            <div className="w-full flex-1 mb-4 sm:mb-6 min-h-[180px] sm:min-h-[200px]">
              {children}
            </div>
            
            {/* Title */}
            <h3
              className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-1 sm:mb-2"
              style={{
                color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
                textShadow: theme === "dark" ? "0 0 20px rgba(0, 225, 255, 0.3)" : "none",
              }}
            >
              {title}
            </h3>
            
            {/* Subtitle */}
            <p
              className="text-xs sm:text-sm text-center"
              style={{
                color: theme === "dark" ? "rgba(0, 225, 255, 0.8)" : "rgba(124, 58, 237, 0.8)",
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

