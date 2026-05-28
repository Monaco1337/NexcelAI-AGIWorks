"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired");
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setErrors({ submit: "Bitte fülle alle Felder aus." });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/demo");
        router.refresh();
      } else {
        setErrors({ submit: data.error || "Login fehlgeschlagen." });
      }
    } catch (error) {
      setErrors({ submit: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navigation />
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(164, 92, 255, 0.3) 0%, transparent 70%)",
              filter: "blur(70px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-md mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#FFFFFF] tracking-tight mb-4">
              Chronex AI <span className="text-[#A45CFF]" style={{ textShadow: "0 0 30px rgba(164, 92, 255, 0.5)" }}>Login</span>
            </h1>
            <p className="text-lg text-[#E5E7EB] font-light">
              Melde dich mit deinen Demo-Zugangsdaten an.
            </p>
          </motion.div>

          <motion.div
            className="neural-glass rounded-neuralLg p-8 md:p-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(164, 92, 255, 0.2)",
            }}
          >
            {expired && (
              <div className="mb-6 p-4 rounded-neural" style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}>
                <p className="text-sm text-[#EF4444]">
                  Dein Demo-Zugang ist abgelaufen. Bitte kontaktiere uns für einen Vollzugang.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-[#E5E7EB] text-sm font-medium mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-neural bg-[#0C0F1A]/50 border border-[#A45CFF]/20 text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#A45CFF] focus:ring-1 focus:ring-[#A45CFF] transition-all duration-300"
                  placeholder="deine@email.de"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[#E5E7EB] text-sm font-medium mb-2">
                  Passwort
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-neural bg-[#0C0F1A]/50 border border-[#A45CFF]/20 text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#A45CFF] focus:ring-1 focus:ring-[#A45CFF] transition-all duration-300"
                  placeholder="Dein Passwort"
                />
              </div>

              {errors.submit && <p className="text-[#EF4444] text-sm">{errors.submit}</p>}

              <motion.button
                type="submit"
                disabled={isLoading}
                className="neural-button-primary px-10 py-5 rounded-neural font-semibold text-base w-full disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? "Wird angemeldet..." : "Anmelden"}
              </motion.button>

              <div className="text-center">
                <Link
                  href="/demo-anfordern"
                  className="text-[#A45CFF] hover:text-[#CBA6FF] transition-colors duration-300 text-sm"
                >
                  Noch keinen Demo-Zugang? Jetzt anfordern
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen overflow-hidden">
        <Navigation />
        <section className="relative py-24 md:py-32 px-6 overflow-hidden">
          <div className="relative z-10 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-[#E5E7EB]">Lädt...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}

