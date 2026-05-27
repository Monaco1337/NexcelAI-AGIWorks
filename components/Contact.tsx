"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name ist erforderlich";
    }
    if (!formData.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ungültige E-Mail-Adresse";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Nachricht ist erforderlich";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log("Formular gesendet:", formData);
      alert("Nachricht gesendet! (Demo-Modus)");
      setFormData({ name: "", email: "", message: "" });
    }
  };

  return (
    <section className="relative py-40 px-6 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h2
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-12 text-[#FFFFFF] tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#00E1FF] neural-text-glow-soft">Kontakt</span>
        </motion.h2>
        
        <motion.p
          className="text-xl md:text-2xl text-[#DDE2E8] font-light text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Bereit für dein nächstes Projekt? Lass uns sprechen.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="neural-glass rounded-neuralLg p-10 md:p-16"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-8">
            <div>
              <label
                htmlFor="name"
                className="block text-[#FFFFFF] text-lg mb-3 font-semibold tracking-wide"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-6 py-4 rounded-neural neural-glass border transition-all duration-300 focus:outline-none focus:border-[#00E1FF] focus:shadow-neuralGlow text-[#FFFFFF] placeholder-[#DDE2E8]/50 ${
                  errors.name ? "border-red-400" : "border-[#DDE2E8]/20"
                }`}
                placeholder="Ihr Name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-2">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-[#FFFFFF] text-lg mb-3 font-semibold tracking-wide"
              >
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full px-6 py-4 rounded-neural neural-glass border transition-all duration-300 focus:outline-none focus:border-[#00E1FF] focus:shadow-neuralGlow text-[#FFFFFF] placeholder-[#DDE2E8]/50 ${
                  errors.email ? "border-red-400" : "border-[#DDE2E8]/20"
                }`}
                placeholder="ihre@email.de"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-2">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-[#FFFFFF] text-lg mb-3 font-semibold tracking-wide"
              >
                Nachricht
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={6}
                className={`w-full px-6 py-4 rounded-neural neural-glass border transition-all duration-300 focus:outline-none focus:border-[#00E1FF] focus:shadow-neuralGlow resize-none text-[#FFFFFF] placeholder-[#DDE2E8]/50 ${
                  errors.message ? "border-red-400" : "border-[#DDE2E8]/20"
                }`}
                placeholder="Ihre Nachricht..."
              />
              {errors.message && (
                <p className="text-red-400 text-sm mt-2">{errors.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              className="w-full px-8 py-5 neural-button-primary rounded-neural font-semibold text-lg"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Nachricht senden
            </motion.button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
