"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState, FormEvent } from "react";
import Link from "next/link";

export default function DemoAnfordernPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    unternehmen: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name ist erforderlich";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Ungültige E-Mail-Adresse";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          unternehmen: formData.unternehmen || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: "",
          email: "",
          unternehmen: "",
        });
      } else {
        setErrors({ submit: data.error || "Fehler beim Erstellen des Demo-Zugangs." });
      }
    } catch (error) {
      setErrors({ submit: "Fehler beim Senden. Bitte versuche es erneut." });
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

        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#FFFFFF] tracking-tight mb-4">
              Chronex AI <span className="text-[#A45CFF]" style={{ textShadow: "0 0 30px rgba(164, 92, 255, 0.5)" }}>Demo anfordern</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#E5E7EB] font-light max-w-2xl mx-auto leading-relaxed">
              Erhalte einen 7-tägigen Testzugang zum Chronex AI Speditionssystem.
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
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#A45CFF]/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-2xl text-[#FFFFFF] font-bold mb-2">Demo-Zugang erstellt!</p>
                <p className="text-[#E5E7EB] mb-6">
                  Bitte prüfe dein E-Mail-Postfach. Du erhältst in Kürze deine Zugangsdaten.
                </p>
                <Link href="/login" prefetch={true}>
                  <motion.button
                    className="neural-button-primary px-8 py-4 rounded-neural font-semibold text-base"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Zum Login
                  </motion.button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-[#E5E7EB] text-sm font-medium mb-2">
                    Name <span className="text-[#A45CFF]">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-neural bg-[#0C0F1A]/50 border border-[#A45CFF]/20 text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#A45CFF] focus:ring-1 focus:ring-[#A45CFF] transition-all duration-300"
                    placeholder="Dein Name"
                  />
                  {errors.name && <p className="text-[#EF4444] text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-[#E5E7EB] text-sm font-medium mb-2">
                    E-Mail <span className="text-[#A45CFF]">*</span>
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
                  {errors.email && <p className="text-[#EF4444] text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="unternehmen" className="block text-[#E5E7EB] text-sm font-medium mb-2">
                    Unternehmen
                  </label>
                  <input
                    type="text"
                    id="unternehmen"
                    value={formData.unternehmen}
                    onChange={(e) => setFormData({ ...formData, unternehmen: e.target.value })}
                    className="w-full px-4 py-3 rounded-neural bg-[#0C0F1A]/50 border border-[#A45CFF]/20 text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#A45CFF] focus:ring-1 focus:ring-[#A45CFF] transition-all duration-300"
                    placeholder="Dein Unternehmen (optional)"
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
                  {isLoading ? "Wird erstellt..." : "Demo-Zugang erstellen"}
                </motion.button>

                <p className="text-xs text-[#9CA3AF] text-center">
                  Mit dem Absenden stimmst du zu, dass deine Daten zur Erstellung des Demo-Zugangs verarbeitet werden.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

