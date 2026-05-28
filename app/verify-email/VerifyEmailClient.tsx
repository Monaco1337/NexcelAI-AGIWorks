"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorType, setErrorType] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const emailParam = searchParams.get("email");

    if (success === "true") {
      setStatus("success");
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }
    } else if (error) {
      setStatus("error");
      setErrorType(error);
    } else {
      // Check if token is in URL (from API redirect)
      const token = searchParams.get("token");
      if (token) {
        // Token will be handled by API route redirect
        setStatus("loading");
      } else {
        setStatus("error");
        setErrorType("missing_token");
      }
    }
  }, [searchParams]);

  return (
    <main className="relative overflow-hidden min-h-screen">
      <Navigation />
      
      <section className="relative py-24 md:py-32 px-6 overflow-hidden min-h-[80vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(164, 92, 255, 0.3) 0%, transparent 70%)",
              filter: "blur(70px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto w-full">
          <motion.div
            className="relative rounded-3xl overflow-hidden p-8 md:p-12"
            style={{
              background: "rgba(12, 15, 26, 0.7)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(164, 92, 255, 0.05)",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {status === "loading" && (
                <motion.div
                  key="loading"
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(198, 168, 255, 0.3))",
                      border: "2px solid rgba(164, 92, 255, 0.5)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <svg
                      className="w-10 h-10 text-[#A45CFF]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    E-Mail wird verifiziert...
                  </h2>
                  <p className="text-[#E5E7EB] text-lg">
                    Bitte warten Sie einen Moment.
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  key="success"
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(198, 168, 255, 0.3))",
                      border: "2px solid rgba(164, 92, 255, 0.5)",
                      boxShadow: "0 0 40px rgba(164, 92, 255, 0.4)",
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  >
                    <motion.svg
                      className="w-10 h-10 text-[#A45CFF]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    E-Mail erfolgreich bestätigt!
                  </h2>
                  {email && (
                    <p className="text-[#E5E7EB] text-lg mb-6">
                      Ihre E-Mail-Adresse <span className="text-[#A45CFF] font-semibold">{email}</span> wurde erfolgreich verifiziert.
                    </p>
                  )}
                  <p className="text-[#E5E7EB] text-base mb-8">
                    Vielen Dank! Wir werden uns in Kürze bei Ihnen melden.
                  </p>
                  <motion.a
                    href="/"
                    className="inline-block px-8 py-4 rounded-xl text-white font-semibold text-lg"
                    style={{
                      background: "linear-gradient(135deg, #A45CFF 0%, #C6A8FF 100%)",
                      boxShadow: "0 8px 24px rgba(164, 92, 255, 0.4)",
                    }}
                    whileHover={{ scale: 1.05, boxShadow: "0 12px 32px rgba(164, 92, 255, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Zur Startseite
                  </motion.a>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "2px solid rgba(239, 68, 68, 0.3)",
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <svg
                      className="w-10 h-10 text-[#EF4444]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Verifizierung fehlgeschlagen
                  </h2>
                  <p className="text-[#E5E7EB] text-lg mb-6">
                    {errorType === "invalid_token" && (
                      <>Der Verifizierungslink ist ungültig oder abgelaufen. Bitte fordern Sie eine neue Bestätigungs-E-Mail an.</>
                    )}
                    {errorType === "missing_token" && (
                      <>Es wurde kein Verifizierungstoken gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.</>
                    )}
                    {errorType === "server_error" && (
                      <>Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.</>
                    )}
                    {!errorType && (
                      <>Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.</>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.a
                      href="/kontakt"
                      className="inline-block px-8 py-4 rounded-xl text-white font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #A45CFF 0%, #C6A8FF 100%)",
                        boxShadow: "0 8px 24px rgba(164, 92, 255, 0.4)",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Erneut kontaktieren
                    </motion.a>
                    <motion.a
                      href="/"
                      className="inline-block px-8 py-4 rounded-xl text-white font-semibold border-2 border-[#A45CFF]"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Zur Startseite
                    </motion.a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

