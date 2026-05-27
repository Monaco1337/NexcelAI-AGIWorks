"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Login failed:", data);
        setError(data.error || "Anmeldung fehlgeschlagen");
        setLoading(false);
        return;
      }

      // Check if user is admin directly from login response
      if (!data.user || data.user.role !== "admin") {
        console.error("User is not admin:", data.user);
        setError("Zugriff verweigert. Nur Administratoren können sich anmelden.");
        setLoading(false);
        return;
      }

      console.log("Login successful, redirecting...");
      
      // Small delay to ensure cookie is set before redirect
      await new Promise(resolve => setTimeout(resolve, 200));

      router.push("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError(`Ein Fehler ist aufgetreten: ${err instanceof Error ? err.message : "Unbekannter Fehler"}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{
      background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: "24px",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 0 60px rgba(164, 92, 255, 0.15)
          `,
          padding: "48px",
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-[#E5E7EB]/80 text-sm">NEXCEL AI CMS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#E5E7EB] mb-2">
              E-Mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#A45CFF] focus:ring-2 focus:ring-[#A45CFF]/20 transition-all"
              placeholder="admin@nexcel-ai.de"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Passwort
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#A45CFF] focus:ring-2 focus:ring-[#A45CFF]/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300"
            style={{
              background: loading
                ? "rgba(164, 92, 255, 0.5)"
                : "linear-gradient(135deg, #A45CFF 0%, #C084FC 50%, #E879F9 100%)",
              boxShadow: "0 4px 20px rgba(164, 92, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
            }}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

