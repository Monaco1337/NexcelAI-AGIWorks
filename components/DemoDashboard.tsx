"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DashboardPreview from "./DashboardPreview";

interface DemoUser {
  id: string;
  email: string;
  name: string;
  unternehmen?: string;
  role: string;
  expiresAt: string;
}

export default function DemoDashboard({ user }: { user: DemoUser }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const expiresDate = new Date(user.expiresAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="relative min-h-screen py-24 px-6">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(164, 92, 255, 0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#FFFFFF] tracking-tight mb-2">
              Chronex AI <span className="text-[#A45CFF]" style={{ textShadow: "0 0 30px rgba(164, 92, 255, 0.5)" }}>Demo</span>
            </h1>
            <p className="text-[#E5E7EB] text-sm md:text-base">
              Willkommen, {user.name}! • Demo-Zugang gültig bis {expiresDate}
            </p>
          </div>
          <motion.button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-6 py-3 rounded-neural font-medium text-sm text-[#FFFFFF] disabled:opacity-50"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(164, 92, 255, 0.2)",
            }}
            whileHover={{ scale: 1.02, borderColor: "rgba(164, 92, 255, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoggingOut ? "Wird abgemeldet..." : "Abmelden"}
          </motion.button>
        </div>

        <div className="mb-6 p-4 rounded-neural" style={{
          background: "rgba(164, 92, 255, 0.1)",
          border: "1px solid rgba(164, 92, 255, 0.2)",
        }}>
          <p className="text-sm text-[#E5E7EB]">
            <strong className="text-[#A45CFF]">Hinweis:</strong> Dies ist eine Demo-Version mit Lesezugriff. 
            Funktionen wie das Erstellen oder Bearbeiten von Touren sind deaktiviert.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </div>
  );
}

