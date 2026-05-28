"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

// Chronex AI - Logistik Dashboard Visualisierung
// Premium Apple/Tesla Design Level - Kompakt wie PflegeDashboard mit klaren Trennungen

export default function ChronexDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const stats = [
    { label: "Aktive Touren", value: "47", change: "+12% vs. gestern", trend: "up" },
    { label: "Optimierte Route", value: "94%", change: "Durchschnittliche Effizienz", trend: "neutral" },
    { label: "Kostenersparnis", value: "€2.4K", change: "Heute gespart", trend: "up" },
    { label: "Fahrzeuge", value: "28", change: "Alle verfügbar", trend: "neutral" },
  ];

  const chartData = [65, 75, 85, 95, 88, 82, 78];
  const maxValue = Math.max(...chartData);

  const tours = [
    { id: "#1247", destination: "München", eta: "14:30" },
    { id: "#1248", destination: "Berlin", eta: "16:45" },
    { id: "#1249", destination: "Hamburg", eta: "18:20" },
    { id: "#1250", destination: "Köln", eta: "20:15" },
  ];

  const actions = [
    "Automatische Disposition",
    "Echtzeit-Tracking",
    "Routenoptimierung",
    "24/7 Automation",
  ];

  return (
    <div className="w-full p-3 sm:p-4" style={{ minHeight: "450px" }}>
      <motion.div
        className="relative w-full rounded-[24px]"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(0, 245, 255, 0.08) 0%, rgba(0, 245, 255, 0.04) 50%, rgba(0, 245, 255, 0.02) 100%)"
            : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          border: isDark
            ? "1px solid rgba(0, 245, 255, 0.2)"
            : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDark
            ? "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 245, 255, 0.1) inset, 0 1px 3px rgba(0, 0, 0, 0.3) inset"
            : "0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05) inset",
        }}
      >
        {/* Premium Background Glow */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(0, 245, 255, 0.15) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Header - DEUTLICHE TRENNUNG */}
        <div 
          className="relative z-10 px-4 sm:px-5 pt-3 sm:pt-4 pb-3 sm:pb-4"
          style={{ 
            borderBottom: isDark ? "2px solid rgba(0, 245, 255, 0.3)" : "2px solid rgba(0, 245, 255, 0.25)",
            background: isDark ? "rgba(0, 245, 255, 0.05)" : "rgba(0, 245, 255, 0.03)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-base sm:text-lg font-bold tracking-tight"
              style={{
                color: isDark ? "#00F5FF" : "#000000",
                textShadow: isDark ? "0 0 40px rgba(0, 245, 255, 0.4)" : "none",
              }}
            >
              Chronex AI Dashboard
            </h3>
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-full"
              style={{
                background: isDark ? "rgba(0, 245, 255, 0.1)" : "rgba(0, 245, 255, 0.08)",
                border: isDark ? "1px solid rgba(0, 245, 255, 0.2)" : "1px solid rgba(0, 245, 255, 0.15)",
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#00F5FF" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: isDark ? "#00F5FF" : "#0066CC" }}
              >
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid - DEUTLICHE TRENNUNG */}
        <div className="relative z-10 px-4 sm:px-5 py-4 sm:py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="group relative rounded-[16px] p-3 sm:p-4 overflow-hidden cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ y: -2, scale: 1.01 }}
                style={{
                  background: isDark
                    ? "linear-gradient(180deg, rgba(0, 245, 255, 0.15) 0%, rgba(0, 245, 255, 0.08) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: isDark
                    ? "2px solid rgba(0, 245, 255, 0.3)"
                    : "2px solid rgba(0, 245, 255, 0.25)",
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 245, 255, 0.1) inset"
                    : "0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(0, 0, 0, 0.04) inset",
                }}
              >
                <div className="relative z-10">
                  <p
                    className="text-[10px] sm:text-xs font-medium mb-1.5 tracking-wide uppercase"
                    style={{ color: isDark ? "rgba(0, 245, 255, 0.7)" : "rgba(0, 0, 0, 0.6)" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-2xl sm:text-3xl font-bold mb-1"
                    style={{
                      color: isDark ? "#00F5FF" : "#0066CC",
                      textShadow: isDark ? "0 0 20px rgba(0, 245, 255, 0.3)" : "none",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-[10px] sm:text-xs font-medium"
                    style={{ color: isDark ? "rgba(0, 245, 255, 0.6)" : "rgba(0, 0, 0, 0.5)" }}
                  >
                    {stat.change}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content Area - DEUTLICHE TRENNUNG */}
        <div className="relative z-10 px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Chart Section */}
            <div
              className="rounded-[20px] p-3 sm:p-4 overflow-hidden"
              style={{
                background: isDark
                  ? "linear-gradient(180deg, rgba(0, 245, 255, 0.12) 0%, rgba(0, 245, 255, 0.06) 100%)"
                  : "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: isDark
                  ? "2px solid rgba(0, 245, 255, 0.3)"
                  : "2px solid rgba(0, 245, 255, 0.25)",
                boxShadow: isDark
                  ? "0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 245, 255, 0.1) inset"
                  : "0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(0, 0, 0, 0.04) inset",
              }}
            >
              <h4
                className="text-sm sm:text-base font-bold mb-3 sm:mb-4"
                style={{ color: isDark ? "#00F5FF" : "#0066CC" }}
              >
                Tourenverlauf (7 Tage)
              </h4>
              <div className="relative h-32 sm:h-36 lg:h-40 flex items-end justify-between gap-1.5 sm:gap-2">
                {chartData.map((value, index) => {
                  const height = (value / maxValue) * 100;
                  return (
                    <motion.div
                      key={index}
                      className="flex-1 rounded-t-lg relative group/bar"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                      whileHover={{ scale: 1.08, y: -2 }}
                      style={{
                        background: "linear-gradient(180deg, rgba(0, 245, 255, 0.9) 0%, rgba(0, 245, 255, 0.5) 100%)",
                        boxShadow: "0 2px 8px rgba(0, 245, 255, 0.3), 0 0 0 1px rgba(0, 245, 255, 0.2) inset",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Tours List Section */}
            <div
              className="rounded-[20px] p-3 sm:p-4 overflow-hidden"
              style={{
                background: isDark
                  ? "linear-gradient(180deg, rgba(0, 245, 255, 0.12) 0%, rgba(0, 245, 255, 0.06) 100%)"
                  : "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: isDark
                  ? "2px solid rgba(0, 245, 255, 0.3)"
                  : "2px solid rgba(0, 245, 255, 0.25)",
                boxShadow: isDark
                  ? "0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 245, 255, 0.1) inset"
                  : "0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(0, 0, 0, 0.04) inset",
              }}
            >
              <h4
                className="text-sm sm:text-base font-bold mb-3 sm:mb-4"
                style={{ color: isDark ? "#00F5FF" : "#0066CC" }}
              >
                Aktive Touren
              </h4>
              <div className="space-y-2.5">
                {tours.map((tour, index) => (
                  <motion.div
                    key={tour.id}
                    className="group relative rounded-[12px] p-2.5 sm:p-3 overflow-hidden cursor-pointer"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ x: 2, scale: 1.01 }}
                    style={{
                      background: isDark
                        ? "linear-gradient(90deg, rgba(0, 245, 255, 0.15) 0%, rgba(0, 245, 255, 0.08) 100%)"
                        : "linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
                      border: isDark
                        ? "1px solid rgba(0, 245, 255, 0.25)"
                        : "1px solid rgba(0, 245, 255, 0.2)",
                      boxShadow: isDark
                        ? "0 2px 6px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 245, 255, 0.1) inset"
                        : "0 2px 6px rgba(0, 0, 0, 0.05), 0 0 0 0.5px rgba(0, 0, 0, 0.03) inset",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#00F5FF" }}
                        animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs sm:text-sm font-semibold truncate"
                          style={{ color: isDark ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.9)" }}
                        >
                          Tour {tour.id} → {tour.destination}
                        </p>
                        <p
                          className="text-[10px] sm:text-xs font-medium mt-0.5"
                          style={{ color: isDark ? "rgba(0, 245, 255, 0.6)" : "rgba(0, 0, 0, 0.5)" }}
                        >
                          ETA: {tour.eta}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - DEUTLICHE TRENNUNG */}
        <div 
          className="relative z-10 px-4 sm:px-5 pb-3 sm:pb-4 pt-3 sm:pt-4"
          style={{ 
            borderTop: isDark ? "2px solid rgba(0, 245, 255, 0.3)" : "2px solid rgba(0, 245, 255, 0.25)",
            background: isDark ? "rgba(0, 245, 255, 0.03)" : "rgba(0, 245, 255, 0.02)",
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {actions.map((action, index) => (
              <motion.button
                key={action}
                className="group relative rounded-[12px] px-3 py-2.5 overflow-hidden"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  background: isDark
                    ? "linear-gradient(180deg, rgba(0, 245, 255, 0.18) 0%, rgba(0, 245, 255, 0.1) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: isDark
                    ? "2px solid rgba(0, 245, 255, 0.3)"
                    : "2px solid rgba(0, 245, 255, 0.25)",
                  boxShadow: isDark
                    ? "0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 245, 255, 0.1) inset"
                    : "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 0 0.5px rgba(0, 0, 0, 0.03) inset",
                }}
              >
                <span
                  className="relative z-10 text-[10px] sm:text-xs font-semibold tracking-wide block text-center"
                  style={{ color: isDark ? "#00F5FF" : "#0066CC" }}
                >
                  {action}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
