"use client";

import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, FormEvent } from "react";
import Link from "next/link";

export default function BlazeKontaktPage() {
  const { theme } = useTheme();
  const brand = useBrand();
  const accentRgb = brand.theme.accentRgb;
  const accentColor = brand.theme.accentPrimary;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // TODO_BLAZE_REVIEW: Kontaktformular-Backend-Integration für AGI Works einrichten
    setSubmitted(true);
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: "transparent",
        color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <section className="relative pt-[120px] md:pt-[150px] pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
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
            {brand.name}
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            style={{
              background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Systemarchitektur anfragen
          </motion.h1>

          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Beschreiben Sie Ihre Anforderungen. Wir analysieren gemeinsam, welche Systemarchitektur und KI-Plattform den maximalen Mehrwert für Ihr Unternehmen schafft.
          </motion.p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="relative px-4 sm:px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <motion.div
              className="rounded-2xl p-10 text-center"
              style={{
                background: `rgba(${accentRgb},0.08)`,
                border: `1px solid rgba(${accentRgb},0.25)`,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: `rgba(${accentRgb},0.15)`, border: `1px solid rgba(${accentRgb},0.3)` }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: accentColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Anfrage erhalten</h2>
              <p className="text-white/60 mb-8">
                Vielen Dank für Ihre Anfrage. Das Team von {brand.name} meldet sich innerhalb von 24 Stunden bei Ihnen.
              </p>
              <Link
                href="/blaze"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: `rgba(${accentRgb},0.2)`, border: `1px solid rgba(${accentRgb},0.35)` }}
              >
                Zurück zur Startseite
              </Link>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 sm:p-8 space-y-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid rgba(${accentRgb},0.15)`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  label="Name"
                  id="name"
                  value={name}
                  onChange={(v) => setName(v)}
                  placeholder="Max Mustermann"
                  required
                  accentRgb={accentRgb}
                  accentColor={accentColor}
                />
                <FormField
                  label="E-Mail"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(v) => setEmail(v)}
                  placeholder="max@unternehmen.de"
                  required
                  accentRgb={accentRgb}
                  accentColor={accentColor}
                />
              </div>
              <FormField
                label="Unternehmen"
                id="company"
                value={company}
                onChange={(v) => setCompany(v)}
                placeholder="Ihr Unternehmen"
                accentRgb={accentRgb}
                accentColor={accentColor}
              />
              <FormField
                label="Projektbeschreibung"
                id="message"
                value={message}
                onChange={(v) => setMessage(v)}
                placeholder="Beschreiben Sie Ihre Anforderungen, den Anwendungsfall und die gewünschten Systemfähigkeiten …"
                textarea
                rows={6}
                required
                accentRgb={accentRgb}
                accentColor={accentColor}
              />

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{
                  background: `rgba(${accentRgb},0.25)`,
                  border: `1px solid rgba(${accentRgb},0.4)`,
                  boxShadow: `0 4px 24px rgba(${accentRgb},0.2)`,
                }}
              >
                Anfrage absenden →
              </button>

              <p className="text-center text-xs text-white/30">
                Durch die Übermittlung stimmen Sie unserer{" "}
                <Link href="/datenschutz" className="underline hover:text-white/60 transition-colors">
                  Datenschutzerklärung
                </Link>{" "}
                zu.
              </p>
            </motion.form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  textarea,
  rows = 4,
  accentRgb,
  accentColor,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  accentRgb: string;
  accentColor: string;
}) {
  const [focused, setFocused] = useState(false);

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${focused ? `rgba(${accentRgb},0.5)` : "rgba(255,255,255,0.1)"}`,
    boxShadow: focused ? `0 0 20px rgba(${accentRgb},0.15)` : "none",
    color: "#fff",
    outline: "none",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    transition: "all 0.2s",
    resize: "none" as const,
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold mb-2"
        style={{ color: focused ? accentColor : "rgba(229,231,235,0.85)" }}
      >
        {label}
        {required && <span style={{ color: accentColor }} className="ml-1">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          style={inputStyle}
          className="placeholder-white/30"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          style={inputStyle}
          className="placeholder-white/30"
        />
      )}
    </div>
  );
}
