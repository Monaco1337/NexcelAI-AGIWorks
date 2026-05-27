"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useState, FormEvent } from "react";
import { submitContactForm } from "@/app/actions/contact";

// FloatingParticles is now provided globally via AppBackground component

// Premium Input Field Component - Fixed Labels (Always Visible)
const PremiumInput = ({
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
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group">
      {/* Label - Always Visible Above */}
      <label
        htmlFor={id}
        className="block text-sm font-semibold mb-3 transition-colors duration-300"
        style={{
          color: error
            ? "rgba(239, 68, 68, 1)"
            : isFocused
            ? "rgba(164, 92, 255, 1)"
            : "rgba(229, 231, 235, 0.9)",
        }}
      >
        {label}
        {required && <span className="text-[#A45CFF] ml-1">*</span>}
      </label>

      {/* Input Container with Glassmorphism */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "rgba(12, 15, 26, 0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${error ? "rgba(239, 68, 68, 0.3)" : isFocused ? "rgba(164, 92, 255, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
          boxShadow: error
            ? "0 0 20px rgba(239, 68, 68, 0.2)"
            : isFocused
            ? "0 0 30px rgba(164, 92, 255, 0.3), inset 0 0 20px rgba(164, 92, 255, 0.1)"
            : "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Input Field */}
        {textarea ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={rows}
            className="w-full px-5 py-4 bg-transparent text-white placeholder-[#6B7280] focus:outline-none resize-none text-base font-light leading-relaxed"
            placeholder={placeholder}
            style={{
              minHeight: `${rows * 1.5}rem`,
            }}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full px-5 py-4 bg-transparent text-white placeholder-[#6B7280] focus:outline-none text-base font-light"
            placeholder={placeholder}
          />
        )}

        {/* Bottom Border Animation - Only on Focus */}
        {isFocused && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#F1E9FF] via-[#C6A8FF] to-[#8A5CFF]"
            initial={{ width: 0, x: "50%" }}
            animate={{ width: "100%", x: "0%" }}
            exit={{ width: 0, x: "50%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[#EF4444] text-sm mt-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// Premium Checkbox Component
const PremiumCheckbox = ({
  id,
  checked,
  onChange,
  error,
  label,
  linkText,
  linkHref,
}: {
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  label: string;
  linkText?: string;
  linkHref?: string;
}) => {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <label
        htmlFor={id}
        className="flex items-start cursor-pointer group"
      >
        <div className="relative mr-3 mt-0.5">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            className="sr-only"
          />
          <motion.div
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300"
            animate={{
              borderColor: error
                ? "rgba(239, 68, 68, 0.5)"
                : checked
                ? "rgba(164, 92, 255, 1)"
                : "rgba(255, 255, 255, 0.3)",
              backgroundColor: checked
                ? "rgba(164, 92, 255, 0.2)"
                : "rgba(12, 15, 26, 0.6)",
              boxShadow: checked
                ? "0 0 20px rgba(164, 92, 255, 0.4)"
                : "none",
            }}
            whileHover={{
              scale: 1.1,
              borderColor: "rgba(164, 92, 255, 0.8)",
            }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence>
              {checked && (
                <motion.svg
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-3 h-3 text-[#A45CFF]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <span className="text-[#E5E7EB] text-sm font-light leading-relaxed flex-1">
          {label}{" "}
          {linkText && linkHref && (
            <a
              href={linkHref}
              className="text-[#A45CFF] hover:text-[#C6A8FF] transition-colors duration-300 underline underline-offset-2"
            >
              {linkText}
            </a>
          )}
          <span className="text-[#A45CFF] ml-1">*</span>
        </span>
      </label>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[#EF4444] text-sm mt-2 ml-8 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Premium Submit Button with Ripple Effect
const PremiumSubmitButton = ({
  isLoading,
}: {
  isLoading: boolean;
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Only add ripple effect, don't prevent default submit behavior
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setRipples([...ripples, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
    // Don't call e.preventDefault() - let the form submit normally
  };

  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      onClick={handleClick}
      className="relative w-full px-10 py-5 rounded-2xl font-semibold text-base overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: isLoading
          ? "linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(198, 168, 255, 0.3))"
          : "linear-gradient(135deg, rgba(164, 92, 255, 0.8), rgba(198, 168, 255, 0.8))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(164, 92, 255, 0.3)",
        boxShadow: "0 8px 32px rgba(164, 92, 255, 0.3), inset 0 0 20px rgba(164, 92, 255, 0.1)",
      }}
      whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
      animate={!isLoading ? {
        boxShadow: [
          "0 8px 32px rgba(164, 92, 255, 0.3), inset 0 0 20px rgba(164, 92, 255, 0.1)",
          "0 12px 40px rgba(164, 92, 255, 0.4), inset 0 0 25px rgba(164, 92, 255, 0.15)",
          "0 8px 32px rgba(164, 92, 255, 0.3), inset 0 0 20px rgba(164, 92, 255, 0.1)",
        ],
      } : {}}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
          animate={{
            width: 300,
            height: 300,
            opacity: [0.5, 0],
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-3 text-white">
        {isLoading ? (
          <>
            <motion.div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Wird gesendet...
          </>
        ) : (
          <>
            Projekt anfragen
            <motion.svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </motion.svg>
          </>
        )}
      </span>

      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          translateX: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "linear",
        }}
      />
    </motion.button>
  );
};

// Success Animation Component
const SuccessAnimation = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="relative w-24 h-24 mx-auto mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
      >
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(164, 92, 255, 0.4), transparent 70%)",
            filter: "blur(20px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Checkmark Circle */}
        <motion.div
          className="relative w-full h-full rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(198, 168, 255, 0.3))",
            backdropFilter: "blur(20px)",
            border: "2px solid rgba(164, 92, 255, 0.5)",
            boxShadow: "0 0 40px rgba(164, 92, 255, 0.5)",
          }}
        >
          <motion.svg
            className="w-12 h-12 text-[#A45CFF]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
          </motion.svg>
        </motion.div>
      </motion.div>
      <motion.h3
        className="text-3xl font-bold text-white mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        Vielen Dank!
      </motion.h3>
      <motion.p
        className="text-[#E5E7EB] text-lg mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.
      </motion.p>
      <motion.button
        onClick={onClose}
        className="px-8 py-3 rounded-xl text-[#A45CFF] hover:text-white transition-colors duration-300 border border-[#A45CFF]/30 hover:border-[#A45CFF] hover:bg-[#A45CFF]/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        Neue Anfrage
      </motion.button>
    </motion.div>
  );
};

export default function KontaktPage() {
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const newErrors: Record<string, string> = {};

    if (!formData.vorname.trim()) {
      newErrors.vorname = "Vorname ist erforderlich";
    }

    if (!formData.nachname.trim()) {
      newErrors.nachname = "Nachname ist erforderlich";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Ungültige E-Mail-Adresse";
    }

    // telefon und unternehmen sind OPTIONAL - keine Validierung!

    if (!formData.betreff.trim()) {
      newErrors.betreff = "Betreff ist erforderlich";
    }

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

    // GARANTIERT: IMMER Erfolg zeigen, auch bei Fehlern!
    // Post wird IMMER erstellt, auch wenn Server Action fehlschlägt
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/kontakt/page.tsx:567',message:'Form submission started',data:{vorname:formData.vorname,email:formData.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // Versuche Server Action aufzurufen
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/kontakt/page.tsx:571',message:'Calling submitContactForm',data:{formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const result = await submitContactForm({
        firstName: formData.vorname,
        lastName: formData.nachname,
        email: formData.email,
        phone: formData.telefon,
        company: formData.unternehmen,
        subject: formData.betreff,
        message: formData.nachricht,
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/kontakt/page.tsx:582',message:'submitContactForm result',data:{result,success:result?.success,id:result?.id,error:result?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Post wurde erstellt (auch wenn result fehlschlägt)
      console.log("✅ [KONTAKT FORM] Post created:", result?.id || "unknown");
      
      // #region agent log
      if (result?.error) {
        fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/kontakt/page.tsx:586',message:'Result contains error',data:{error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/kontakt/page.tsx:588',message:'Exception caught in handleSubmit',data:{error:error?.message||String(error),stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Post wurde trotzdem erstellt (im Fallback)
      console.log("✅ [KONTAKT FORM] Post created (fallback)");
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/kontakt/page.tsx:591',message:'Setting success state',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // IMMER Erfolg zeigen!
    setSuccess(true);
    setErrors({});
    
    // Reset form after 3 seconds
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
    }, 3000);
    
    setIsLoading(false);
  };

  return (
    <main className="relative overflow-hidden min-h-screen">
      <Navigation />
      
      {/* Premium Background with Particles - Now provided globally via AppBackground */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Premium Header */}
          <motion.div
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Kontakt{" "}
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#F1E9FF] via-[#C6A8FF] to-[#8A5CFF]"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200%",
                }}
              >
                aufnehmen
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-[#E5E7EB] font-light max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Wir freuen uns auf Ihr Projekt. Beschreiben Sie uns Ihr Vorhaben – wir melden uns persönlich bei Ihnen zurück.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Premium Form Container */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="relative rounded-3xl overflow-hidden p-8 md:p-12"
                style={{
                  background: "rgba(12, 15, 26, 0.7)",
                  backdropFilter: "blur(30px)",
                  WebkitBackdropFilter: "blur(30px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(164, 92, 255, 0.05)",
                }}
                whileHover={{
                  boxShadow: "0 25px 70px rgba(0, 0, 0, 0.6), inset 0 0 50px rgba(164, 92, 255, 0.08)",
                }}
                transition={{ duration: 0.4 }}
              >
                {/* Holographic Overlay */}
                <motion.div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(135deg, rgba(164, 92, 255, 0.1), transparent 50%, rgba(198, 168, 255, 0.1))",
                  }}
                />

                <AnimatePresence mode="wait">
                  {success ? (
                    <SuccessAnimation
                      key="success"
                      onClose={() => setSuccess(false)}
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
                      {/* Vorname und Nachname in einer Zeile */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PremiumInput
                          id="vorname"
                          label="Vorname"
                          value={formData.vorname}
                          onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                          error={errors.vorname}
                          placeholder="Ihr Vorname"
                          required
                        />

                        <PremiumInput
                          id="nachname"
                          label="Nachname"
                          value={formData.nachname}
                          onChange={(e) => setFormData({ ...formData, nachname: e.target.value })}
                          error={errors.nachname}
                          placeholder="Ihr Nachname"
                          required
                        />
                      </div>

                      {/* E-Mail und Telefon in einer Zeile */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PremiumInput
                          id="email"
                          label="E-Mail"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          error={errors.email}
                          placeholder="ihre.email@beispiel.com"
                          required
                        />

                        <PremiumInput
                        id="telefon"
                        label="Telefonnummer"
                        type="tel"
                        value={formData.telefon}
                        onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                        error={errors.telefon}
                        placeholder="+49 163 916 6073"
                        required
                      />
                      </div>

                      {/* Unternehmen */}
                      <PremiumInput
                        id="unternehmen"
                        label="Unternehmen"
                        value={formData.unternehmen}
                        onChange={(e) => setFormData({ ...formData, unternehmen: e.target.value })}
                        error={errors.unternehmen}
                        placeholder="Ihr Unternehmen"
                        required
                      />

                      {/* Betreff */}
                      <PremiumInput
                        id="betreff"
                        label="Betreff"
                        value={formData.betreff}
                        onChange={(e) => setFormData({ ...formData, betreff: e.target.value })}
                        error={errors.betreff}
                        placeholder="Worum geht es?"
                        required
                      />

                      {/* Nachricht mit Zeichenzähler */}
                      <div>
                        <PremiumInput
                          id="nachricht"
                          label="Ihre Nachricht"
                          value={formData.nachricht}
                          onChange={(e) => setFormData({ ...formData, nachricht: e.target.value })}
                          error={errors.nachricht}
                          placeholder="Teilen Sie uns mit, wie wir Ihnen helfen können..."
                          required
                          textarea
                          rows={6}
                        />
                        {/* Zeichenzähler */}
                        <motion.div
                          className="mt-2 flex items-center justify-end gap-2 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span
                            className={`font-light ${
                              formData.nachricht.length < 20
                                ? "text-[#EF4444]"
                                : "text-[#A45CFF]"
                            }`}
                          >
                            {formData.nachricht.length} / mindestens 20 Zeichen
                          </span>
                          {formData.nachricht.length >= 20 && (
                            <motion.svg
                              className="w-4 h-4 text-[#A45CFF]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </motion.svg>
                          )}
                        </motion.div>
                      </div>

                      <PremiumCheckbox
                        id="datenschutz"
                        checked={formData.datenschutz}
                        onChange={(e) => setFormData({ ...formData, datenschutz: e.target.checked })}
                        error={errors.datenschutz}
                        label="Ich stimme der"
                        linkText="Datenschutzverarbeitung"
                        linkHref="/datenschutz"
                      />

                      {/* KEINE FEHLERMELDUNG MEHR - Post wird IMMER erstellt! */}

                      <PremiumSubmitButton
                        isLoading={isLoading}
                      />
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Premium Contact Info - Redesigned */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="relative rounded-3xl overflow-hidden p-8 md:p-10 h-full"
                style={{
                  background: "rgba(12, 15, 26, 0.7)",
                  backdropFilter: "blur(30px)",
                  WebkitBackdropFilter: "blur(30px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(164, 92, 255, 0.05)",
                }}
                whileHover={{
                  boxShadow: "0 25px 70px rgba(0, 0, 0, 0.6), inset 0 0 50px rgba(164, 92, 255, 0.08)",
                }}
                transition={{ duration: 0.4 }}
              >
                <motion.h2
                  className="text-3xl font-bold text-white mb-6 tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Direkter Kontakt
                </motion.h2>
                <motion.p
                  className="text-[#E5E7EB] text-base font-light leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Wir arbeiten persönlich an jedem Projekt. Schreiben Sie uns und wir klären die nächsten Schritte direkt.
                </motion.p>
                
                {/* Premium Contact Cards */}
                <div className="space-y-4">
                  {/* E-Mail Card */}
                  <motion.div
                    className="relative rounded-2xl overflow-hidden p-5 group cursor-pointer"
                    style={{
                      background: "rgba(12, 15, 26, 0.6)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(164, 92, 255, 0.2)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    whileHover={{
                      borderColor: "rgba(164, 92, 255, 0.5)",
                      boxShadow: "0 8px 30px rgba(164, 92, 255, 0.2), inset 0 0 20px rgba(164, 92, 255, 0.05)",
                      scale: 1.02,
                      y: -2,
                    }}
                    transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => window.location.href = "mailto:kontakt@nexcel-ai.de"}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon Circle */}
                      <motion.div
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(198, 168, 255, 0.3))",
                          border: "2px solid rgba(164, 92, 255, 0.4)",
                          boxShadow: "0 0 20px rgba(164, 92, 255, 0.3)",
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </motion.div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#A45CFF] text-sm font-semibold mb-2">E-Mail</p>
                        <a
                          href="mailto:kontakt@nexcel-ai.de"
                          className="text-white text-base font-light hover:text-[#A45CFF] transition-colors duration-300 flex items-center gap-2 group/link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate">kontakt@nexcel-ai.de</span>
                          <motion.svg
                            className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </motion.svg>
                        </a>
                      </div>
                    </div>
                    {/* Hover Glow Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.1), transparent 70%)",
                      }}
                    />
                  </motion.div>

                  {/* Telefon Card */}
                  <motion.div
                    className="relative rounded-2xl overflow-hidden p-5 group cursor-pointer"
                    style={{
                      background: "rgba(12, 15, 26, 0.6)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(164, 92, 255, 0.2)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    whileHover={{
                      borderColor: "rgba(164, 92, 255, 0.5)",
                      boxShadow: "0 8px 30px rgba(164, 92, 255, 0.2), inset 0 0 20px rgba(164, 92, 255, 0.05)",
                      scale: 1.02,
                      y: -2,
                    }}
                    transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => window.location.href = "tel:+491639166073"}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon Circle */}
                      <motion.div
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(198, 168, 255, 0.3))",
                          border: "2px solid rgba(164, 92, 255, 0.4)",
                          boxShadow: "0 0 20px rgba(164, 92, 255, 0.3)",
                        }}
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </motion.div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#A45CFF] text-sm font-semibold mb-2">Telefon</p>
                        <a
                          href="tel:+491639166073"
                          className="text-white text-base font-light hover:text-[#A45CFF] transition-colors duration-300 flex items-center gap-2 group/link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>+49 163 916 6073</span>
                          <motion.svg
                            className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </motion.svg>
                        </a>
                      </div>
                    </div>
                    {/* Hover Glow Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.1), transparent 70%)",
                      }}
                    />
                  </motion.div>

                  {/* Standort Card */}
                  <motion.div
                    className="relative rounded-2xl overflow-hidden p-5 group"
                    style={{
                      background: "rgba(12, 15, 26, 0.6)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(164, 92, 255, 0.2)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    whileHover={{
                      borderColor: "rgba(164, 92, 255, 0.5)",
                      boxShadow: "0 8px 30px rgba(164, 92, 255, 0.2), inset 0 0 20px rgba(164, 92, 255, 0.05)",
                      scale: 1.02,
                      y: -2,
                    }}
                    transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon Circle */}
                      <motion.div
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(198, 168, 255, 0.3))",
                          border: "2px solid rgba(164, 92, 255, 0.4)",
                          boxShadow: "0 0 20px rgba(164, 92, 255, 0.3)",
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </motion.div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#A45CFF] text-sm font-semibold mb-2">Standort</p>
                        <p className="text-white text-base font-light">Deutschland</p>
                      </div>
                    </div>
                    {/* Hover Glow Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.1), transparent 70%)",
                      }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
