"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useState, FormEvent } from "react";
import { submitContactForm } from "@/app/actions/contact";
import { useBrand } from "@/contexts/BrandContext";
import Link from "next/link";

function glassPanelStyle(): React.CSSProperties {
  return {
    background: "rgba(12, 15, 26, 0.72)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid var(--brand-card-border)",
    boxShadow:
      "0 20px 60px rgba(0, 0, 0, 0.45), inset 0 0 40px var(--brand-glow-soft)",
  };
}

function PremiumInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  textarea = false,
  rows = 6,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? "rgba(239, 68, 68, 0.35)"
    : isFocused
      ? "var(--brand-line-mid)"
      : "rgba(255, 255, 255, 0.08)";

  return (
    <div className="relative group">
      <label
        htmlFor={id}
        className="block text-[11px] uppercase tracking-[0.22em] mb-3 transition-colors duration-300"
        style={{
          color: error
            ? "rgba(239, 68, 68, 1)"
            : isFocused
              ? "var(--brand-primary)"
              : "rgba(255,255,255,0.55)",
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 500,
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--brand-primary)" }} className="ml-1">
            *
          </span>
        )}
      </label>

      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${borderColor}`,
          boxShadow: isFocused
            ? "0 0 28px var(--brand-glow-mid), inset 0 0 20px var(--brand-glow-soft)"
            : "none",
        }}
      >
        {textarea ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={rows}
            className="w-full px-5 py-4 bg-transparent text-white placeholder-white/25 focus:outline-none resize-none text-[15px] font-light leading-relaxed"
            placeholder={placeholder}
            style={{ minHeight: `${rows * 1.5}rem` }}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full px-5 py-4 bg-transparent text-white placeholder-white/25 focus:outline-none text-[15px] font-light"
            placeholder={placeholder}
          />
        )}

        {isFocused && (
          <motion.div
            className="absolute bottom-0 left-0 h-px"
            style={{ background: "var(--brand-wash)" }}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[#EF4444] text-sm mt-2 font-light"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function PremiumCheckbox({
  id,
  checked,
  onChange,
  error,
  privacyHref,
}: {
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  privacyHref: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start cursor-pointer group gap-3">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <motion.div
          className="mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all duration-300"
          animate={{
            borderColor: error
              ? "rgba(239, 68, 68, 0.5)"
              : checked
                ? "var(--brand-line-mid)"
                : "rgba(255, 255, 255, 0.2)",
            backgroundColor: checked ? "var(--brand-glow-soft)" : "transparent",
            boxShadow: checked ? "0 0 16px var(--brand-glow-mid)" : "none",
          }}
          whileHover={{ borderColor: "var(--brand-line-mid)" }}
        >
          <AnimatePresence>
            {checked && (
              <motion.svg
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="var(--brand-primary)"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
        <span className="text-white/60 text-sm font-light leading-relaxed">
          Ich stimme der{" "}
          <Link
            href={privacyHref}
            className="underline underline-offset-2 transition-colors duration-300 hover:text-white/90"
            style={{ color: "var(--brand-primary)" }}
          >
            Datenschutzverarbeitung
          </Link>{" "}
          zu
          <span style={{ color: "var(--brand-primary)" }} className="ml-0.5">
            *
          </span>
        </span>
      </label>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[#EF4444] text-sm mt-2 ml-8 font-light"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function GhostSubmitButton({
  isLoading,
  label,
}: {
  isLoading: boolean;
  label: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      className="group relative w-full inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-[12px] uppercase transition-all duration-500 hover:gap-4 disabled:opacity-45 disabled:cursor-not-allowed sm:text-[12.5px]"
      style={{
        color: "rgba(255,255,255,0.92)",
        background: "transparent",
        border: "1px solid var(--brand-card-border)",
        fontFamily: "var(--font-headline), system-ui, sans-serif",
        letterSpacing: "0.22em",
        fontWeight: 500,
      }}
      whileHover={!isLoading ? { y: -1 } : {}}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          border: "1px solid var(--brand-line-mid)",
          boxShadow: "0 0 32px var(--brand-glow-mid)",
        }}
      />
      <span className="relative flex items-center gap-3">
        {isLoading ? (
          <>
            <motion.div
              className="w-4 h-4 border border-white/60 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Wird gesendet…
          </>
        ) : (
          <>
            {label}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </span>
    </motion.button>
  );
}

function SuccessState({
  title,
  message,
  onReset,
  homeHref,
}: {
  title: string;
  message: string;
  onReset: () => void;
  homeHref: string;
}) {
  return (
    <motion.div
      className="text-center py-14 px-4"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="relative w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
        style={{
          border: "1px solid var(--brand-line-mid)",
          boxShadow: "0 0 40px var(--brand-glow-mid)",
          background: "var(--brand-glow-soft)",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 16 }}
      >
        <svg
          className="w-9 h-9"
          fill="none"
          viewBox="0 0 24 24"
          stroke="var(--brand-primary)"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <h3
        className="text-2xl md:text-3xl font-light text-white mb-4 tracking-tight"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-white/55 text-base md:text-lg font-light max-w-md mx-auto mb-10 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onClick={onReset}
          className="group relative inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-[12px] uppercase transition-all duration-500 hover:gap-4"
          style={{
            color: "rgba(255,255,255,0.92)",
            background: "transparent",
            border: "1px solid var(--brand-card-border)",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: "0.22em",
            fontWeight: 500,
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              border: "1px solid var(--brand-line-mid)",
              boxShadow: "0 0 28px var(--brand-glow-mid)",
            }}
          />
          <span className="relative">Neue Anfrage</span>
        </button>

        <Link
          href={homeHref}
          className="group relative inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-[12px] uppercase transition-all duration-500 hover:gap-4"
          style={{
            color: "rgba(255,255,255,0.55)",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: "0.22em",
            fontWeight: 500,
          }}
        >
          <span className="relative">Zur Startseite</span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            aria-hidden
            className="transition-transform duration-500 group-hover:translate-x-0.5"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

function DirectContactRow({
  index,
  label,
  value,
  href,
  isLast,
}: {
  index: string;
  label: string;
  value: string;
  href?: string;
  isLast?: boolean;
}) {
  const content = href ? (
    <a
      href={href}
      className="group/link inline-flex items-center gap-2 text-white/90 text-[15px] font-light transition-colors duration-300 hover:text-white"
    >
      <span>{value}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        aria-hidden
        className="opacity-0 transition-all duration-300 group-hover/link:opacity-100 group-hover/link:translate-x-0.5"
        style={{ color: "var(--brand-primary)" }}
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  ) : (
    <p className="text-white/90 text-[15px] font-light">{value}</p>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="py-6">
        <div className="flex items-baseline gap-4 mb-2">
          <span
            className="text-[11px] tabular-nums tracking-[0.18em]"
            style={{ color: "var(--brand-primary)", opacity: 0.7 }}
          >
            {index}
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.22em] text-white/40"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            {label}
          </span>
        </div>
        {content}
      </div>
      {!isLast && (
        <div
          className="h-px w-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      )}
    </motion.div>
  );
}

export default function ContactPageContent() {
  const brand = useBrand();
  const { contactPage } = brand;
  const homeHref = brand.navigation.baseHref || "/";

  const [formData, setFormData] = useState({
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    unternehmen: "",
    betreff: "",
    nachricht: "",
    datenschutz: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const newErrors: Record<string, string> = {};

    if (!formData.vorname.trim()) newErrors.vorname = "Vorname ist erforderlich";
    if (!formData.nachname.trim()) newErrors.nachname = "Nachname ist erforderlich";
    if (!formData.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Ungültige E-Mail-Adresse";
    }
    if (!formData.betreff.trim()) newErrors.betreff = "Betreff ist erforderlich";
    if (!formData.nachricht.trim()) {
      newErrors.nachricht = "Nachricht ist erforderlich";
    } else if (formData.nachricht.trim().length < 20) {
      newErrors.nachricht = "Nachricht muss mindestens 20 Zeichen lang sein";
    }
    if (!formData.datenschutz) {
      newErrors.datenschutz = "Sie müssen der Datenschutzverarbeitung zustimmen";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const currentHost =
        typeof window !== "undefined" ? window.location.hostname : undefined;
      const formBrand: "agiworks" | "nexcel" =
        brand.id === "agiworks" ? "agiworks" : "nexcel";
      await submitContactForm({
        firstName: formData.vorname,
        lastName: formData.nachname,
        email: formData.email,
        phone: formData.telefon,
        company: formData.unternehmen,
        subject: formData.betreff,
        message: formData.nachricht,
        brand: formBrand,
        sourceHost: currentHost,
      });
      try {
        const { track } = await import("@/lib/track");
        track("contact_submit", {
          meta: {
            betreff: formData.betreff,
            hasPhone: !!formData.telefon,
            hasCompany: !!formData.unternehmen,
          },
        });
      } catch {
        /* swallow */
      }
    } catch {
      /* Post wird im Fallback gespeichert */
    }

    setSuccess(true);
    setErrors({});
    setIsLoading(false);

    setTimeout(() => {
      setFormData({
        vorname: "",
        nachname: "",
        email: "",
        telefon: "",
        unternehmen: "",
        betreff: "",
        nachricht: "",
        datenschutz: false,
      });
      setSuccess(false);
    }, 8000);
  };

  const resetForm = () => {
    setSuccess(false);
    setFormData({
      vorname: "",
      nachname: "",
      email: "",
      telefon: "",
      unternehmen: "",
      betreff: "",
      nachricht: "",
      datenschutz: false,
    });
  };

  return (
    <main className="relative overflow-hidden min-h-screen">
      <Navigation />

      <section className="relative pt-[120px] md:pt-[150px] pb-24 md:pb-32 px-6">
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-16 md:mb-20 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.28em] mb-6"
              style={{ color: "var(--brand-primary)", opacity: 0.75 }}
            >
              {brand.name}
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight mb-6"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              Kontakt{" "}
              <span
                style={{
                  background: "var(--brand-headline-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {contactPage.headlineAccent}
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/50 font-light leading-relaxed">
              {contactPage.subline}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Formular */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative rounded-3xl overflow-hidden p-8 md:p-12" style={glassPanelStyle()}>
                <AnimatePresence mode="wait">
                  {success ? (
                    <SuccessState
                      key="success"
                      title={contactPage.successTitle}
                      message={contactPage.successMessage}
                      onReset={resetForm}
                      homeHref={homeHref}
                    />
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      className="space-y-6 relative z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PremiumInput
                          id="vorname"
                          label="Vorname"
                          value={formData.vorname}
                          onChange={(e) =>
                            setFormData({ ...formData, vorname: e.target.value })
                          }
                          error={errors.vorname}
                          placeholder="Ihr Vorname"
                          required
                        />
                        <PremiumInput
                          id="nachname"
                          label="Nachname"
                          value={formData.nachname}
                          onChange={(e) =>
                            setFormData({ ...formData, nachname: e.target.value })
                          }
                          error={errors.nachname}
                          placeholder="Ihr Nachname"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PremiumInput
                          id="email"
                          label="E-Mail"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          error={errors.email}
                          placeholder="ihre.email@beispiel.com"
                          required
                        />
                        <PremiumInput
                          id="telefon"
                          label="Telefon"
                          type="tel"
                          value={formData.telefon}
                          onChange={(e) =>
                            setFormData({ ...formData, telefon: e.target.value })
                          }
                          error={errors.telefon}
                          placeholder={contactPage.direct.phone}
                        />
                      </div>

                      <PremiumInput
                        id="unternehmen"
                        label="Unternehmen"
                        value={formData.unternehmen}
                        onChange={(e) =>
                          setFormData({ ...formData, unternehmen: e.target.value })
                        }
                        error={errors.unternehmen}
                        placeholder="Ihr Unternehmen"
                      />

                      <PremiumInput
                        id="betreff"
                        label="Betreff"
                        value={formData.betreff}
                        onChange={(e) =>
                          setFormData({ ...formData, betreff: e.target.value })
                        }
                        error={errors.betreff}
                        placeholder="Worum geht es?"
                        required
                      />

                      <div>
                        <PremiumInput
                          id="nachricht"
                          label="Ihre Nachricht"
                          value={formData.nachricht}
                          onChange={(e) =>
                            setFormData({ ...formData, nachricht: e.target.value })
                          }
                          error={errors.nachricht}
                          placeholder="Teilen Sie uns mit, wie wir Ihnen helfen können…"
                          required
                          textarea
                          rows={6}
                        />
                        <div className="mt-2 flex justify-end">
                          <span
                            className={`text-xs font-light tracking-wide ${
                              formData.nachricht.length < 20
                                ? "text-white/30"
                                : ""
                            }`}
                            style={
                              formData.nachricht.length >= 20
                                ? { color: "var(--brand-primary)" }
                                : undefined
                            }
                          >
                            {formData.nachricht.length} / min. 20 Zeichen
                          </span>
                        </div>
                      </div>

                      <PremiumCheckbox
                        id="datenschutz"
                        checked={formData.datenschutz}
                        onChange={(e) =>
                          setFormData({ ...formData, datenschutz: e.target.checked })
                        }
                        error={errors.datenschutz}
                        privacyHref="/datenschutz"
                      />

                      <GhostSubmitButton
                        isLoading={isLoading}
                        label={contactPage.submitLabel}
                      />
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Direkter Kontakt */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="relative rounded-3xl overflow-hidden p-8 md:p-10 h-full"
                style={glassPanelStyle()}
              >
                <p
                  className="text-[11px] uppercase tracking-[0.28em] mb-4"
                  style={{ color: "var(--brand-primary)", opacity: 0.75 }}
                >
                  Direkter Kontakt
                </p>
                <h2
                  className="text-2xl md:text-3xl font-light text-white mb-4 tracking-tight"
                  style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                >
                  Persönlich erreichbar
                </h2>
                <p className="text-white/45 text-sm font-light leading-relaxed mb-2">
                  {contactPage.directIntro}
                </p>

                <div className="mt-4">
                  <DirectContactRow
                    index="01"
                    label="E-Mail"
                    value={contactPage.direct.email}
                    href={`mailto:${contactPage.direct.email}`}
                  />
                  <DirectContactRow
                    index="02"
                    label="Telefon"
                    value={contactPage.direct.phone}
                    href={contactPage.direct.phoneHref}
                  />
                  <DirectContactRow
                    index="03"
                    label="Standort"
                    value={contactPage.direct.location}
                    isLast
                  />
                </div>

                <div
                  className="mt-8 pt-8"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Link
                    href={homeHref}
                    className="group relative inline-flex items-center gap-3 rounded-full px-6 py-3 text-[11px] uppercase transition-all duration-500 hover:gap-4"
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontFamily: "var(--font-headline), system-ui, sans-serif",
                      letterSpacing: "0.22em",
                      fontWeight: 500,
                    }}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        border: "1px solid var(--brand-line-mid)",
                        boxShadow: "0 0 24px var(--brand-glow-soft)",
                      }}
                    />
                    <span className="relative">Zurück</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="rotate-180 transition-transform duration-500 group-hover:-translate-x-0.5"
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
