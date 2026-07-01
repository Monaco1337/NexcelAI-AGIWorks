"use client";

/**
 * NEXCEL AI / AGI WORKS · Systemanalyse (vereinfacht, Apple-Niveau)
 *
 * Ziel: In unter einer Minute, maximal benutzerfreundlich.
 * – Eine Frage pro Screen, große Tap-Flächen, Auto-Advance
 * – Minimales Tippen (nur Kontaktdaten)
 * – Verständlich für jede Altersgruppe
 * – Ergebnis wird über submitContactForm persistent in Postgres
 *   gespeichert und erscheint im Admin-Panel unter „Leads / Kontakte".
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import { submitContactForm } from "@/app/actions/contact";

type Option = { id: string; label: string; hint?: string; icon: React.ReactNode };
type Question = { key: string; title: string; subtitle: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    key: "branche",
    title: "Was beschreibt Ihr Geschäft am besten?",
    subtitle: "Tippen Sie einfach auf das Passende.",
    options: [
      { id: "Dienstleistung & Beratung", label: "Dienstleistung & Beratung", icon: <IconBriefcase /> },
      { id: "Handel & Onlineshop", label: "Handel & Onlineshop", icon: <IconCart /> },
      { id: "Gastronomie, Beauty & Wellness", label: "Gastronomie, Beauty & Wellness", icon: <IconSpark /> },
      { id: "Handwerk & Bau", label: "Handwerk & Bau", icon: <IconTools /> },
      { id: "Gesundheit & Praxis", label: "Gesundheit & Praxis", icon: <IconHeart /> },
      { id: "Etwas anderes", label: "Etwas anderes", icon: <IconDots /> },
    ],
  },
  {
    key: "ziel",
    title: "Was möchten Sie erreichen?",
    subtitle: "Wählen Sie, was Ihnen am wichtigsten ist.",
    options: [
      { id: "Mehr Kunden & Anfragen", label: "Mehr Kunden & Anfragen", icon: <IconTrend /> },
      { id: "Zeit sparen & automatisieren", label: "Zeit sparen & automatisieren", icon: <IconBolt /> },
      { id: "Alles digital organisieren", label: "Alles digital organisieren", icon: <IconGrid /> },
      { id: "Professioneller online auftreten", label: "Professioneller auftreten", icon: <IconGlobe /> },
      { id: "Ich bin mir noch nicht sicher", label: "Ich bin mir noch nicht sicher", hint: "Völlig in Ordnung — wir beraten Sie.", icon: <IconQuestion /> },
    ],
  },
  {
    key: "stand",
    title: "Wie organisieren Sie das heute?",
    subtitle: "Ganz ehrlich — es gibt keine falsche Antwort.",
    options: [
      { id: "Größtenteils per Papier, Telefon & E-Mail", label: "Papier, Telefon & E-Mail", icon: <IconPhone /> },
      { id: "Mit einzelnen Tools (z. B. Excel, WhatsApp)", label: "Einzelne Tools (Excel, WhatsApp)", icon: <IconPuzzle /> },
      { id: "Wir nutzen bereits Software / Systeme", label: "Wir haben schon Software", icon: <IconCheck /> },
      { id: "Das weiß ich nicht genau", label: "Das weiß ich nicht genau", icon: <IconQuestion /> },
    ],
  },
];

const TOTAL_STEPS = QUESTIONS.length; // Fragen (Intro & Kontakt separat)

function recommend(answers: Record<string, string>): { title: string; text: string } {
  const ziel = answers.ziel ?? "";
  const branche = answers.branche ?? "";

  if (/Gastronomie|Beauty|Gesundheit|Praxis/.test(branche)) {
    return {
      title: "Buchungs- & Kundensystem",
      text: "Ein System, mit dem Ihre Kunden rund um die Uhr Termine buchen und Sie alle Abläufe an einem Ort verwalten.",
    };
  }
  if (/Mehr Kunden/.test(ziel)) {
    return {
      title: "Premium-Webseite mit Lead-System",
      text: "Eine hochwertige Webseite, die gezielt neue Anfragen bringt — inklusive einfacher Verwaltung Ihrer Kontakte.",
    };
  }
  if (/Zeit sparen|automatisieren/.test(ziel)) {
    return {
      title: "Automatisierung & KI",
      text: "Wir übernehmen wiederkehrende Aufgaben automatisch, damit Sie sich auf das Wesentliche konzentrieren können.",
    };
  }
  if (/digital organisieren/.test(ziel)) {
    return {
      title: "Individuelles Unternehmenssystem",
      text: "Kunden, Aufträge, Termine und Dokumente laufen zentral in einem übersichtlichen System zusammen.",
    };
  }
  return {
    title: "Individuelle Systemlösung",
    text: "Auf Basis Ihrer Angaben schlagen wir Ihnen die passende, maßgeschneiderte Lösung vor.",
  };
}

type Phase = "intro" | "question" | "contact" | "done";

export default function SimpleSystemanalyse() {
  const brand = useBrand();
  const accentRgb = brand.theme.accentRgb;
  const homeHref = resolveBrandNavHref("/", brand.id);

  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const recommendation = useMemo(() => recommend(answers), [answers]);
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const chooseOption = (qKey: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [qKey]: optionId }));
    // sanfte Auto-Weiterleitung nach kurzer Bestätigung
    window.setTimeout(() => {
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex((i) => i + 1);
      } else {
        setPhase("contact");
      }
    }, 240);
  };

  const goBack = () => {
    setFormError(null);
    if (phase === "contact") {
      setPhase("question");
      setQIndex(QUESTIONS.length - 1);
      return;
    }
    if (phase === "question") {
      if (qIndex === 0) setPhase("intro");
      else setQIndex((i) => i - 1);
    }
  };

  const submit = async () => {
    setFormError(null);
    if (!name.trim()) return setFormError("Bitte geben Sie Ihren Namen ein.");
    if (!validEmail(email)) return setFormError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
    if (!consent) return setFormError("Bitte bestätigen Sie kurz den Datenschutz.");

    setSending(true);
    const [firstName, ...restName] = name.trim().split(" ");
    const lastName = restName.join(" ") || "—";

      const summaryLines = [
      "── Systemanalyse (Schnell-Check) ──",
      `Geschäft: ${answers.branche ?? "—"}`,
      `Ziel: ${answers.ziel ?? "—"}`,
      `Heutiger Stand: ${answers.stand ?? "—"}`,
      "",
      `Empfehlung: ${recommendation.title}`,
      recommendation.text,
      ...(message.trim() ? ["", "── Persönliche Nachricht ──", message.trim()] : []),
    ];

    try {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : undefined;
      await submitContactForm({
        firstName,
        lastName,
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: `Systemanalyse: ${answers.ziel ?? "Allgemein"}`,
        message: summaryLines.join("\n"),
        brand: brand.id === "agiworks" ? "agiworks" : "nexcel",
        sourceHost: currentHost,
      });
      try {
        const { track } = await import("@/lib/track");
        track("lead_submit", { meta: { source: "systemanalyse", ziel: answers.ziel } });
      } catch {
        /* ignore */
      }
    } catch {
      /* Fallback in submitContactForm */
    } finally {
      setSending(false);
      setPhase("done");
    }
  };

  const bgStyle: React.CSSProperties = {
    background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${accentRgb},0.10) 0%, transparent 55%), linear-gradient(180deg, #06060c 0%, #050508 45%, #040406 100%)`,
  };

  return (
    <div className="flex min-h-screen flex-col" style={bgStyle}>
      {/* Top-Bar */}
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="text-[13px] font-semibold tracking-tight text-white/80">
          {brand.name}
        </span>
        <Link
          href={homeHref}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Schließen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-14 sm:px-8">
        <div className="w-full max-w-[680px]">
          <AnimatePresence mode="wait">
            {phase === "intro" && (
              <Fade key="intro">
                <div className="text-center">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.3em]"
                    style={{ color: `rgb(${accentRgb})` }}
                  >
                    Kostenlose Systemanalyse
                  </span>
                  <h1
                    className="mx-auto mt-5 max-w-[560px] text-[2.1rem] font-light leading-[1.1] tracking-tight text-white sm:text-[2.8rem]"
                    style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                  >
                    Finden Sie in unter einer Minute heraus, was Ihr Unternehmen wirklich braucht.
                  </h1>
                  <p className="mx-auto mt-5 max-w-[440px] text-[15px] leading-relaxed text-white/55">
                    Nur 3 einfache Fragen. Keine Vorkenntnisse nötig. Sie tippen
                    nur an, was zutrifft — den Rest übernehmen wir.
                  </p>

                  <div className="mt-9 flex flex-col items-center gap-3">
                    <BigButton accentRgb={accentRgb} onClick={() => setPhase("question")}>
                      Jetzt starten
                    </BigButton>
                    <span className="text-[12.5px] text-white/40">
                      100 % kostenlos & unverbindlich
                    </span>
                  </div>
                </div>
              </Fade>
            )}

            {phase === "question" && (
              <Fade key={`q-${qIndex}`}>
                <QuestionView
                  question={QUESTIONS[qIndex]}
                  index={qIndex}
                  total={TOTAL_STEPS}
                  selected={answers[QUESTIONS[qIndex].key]}
                  accentRgb={accentRgb}
                  onSelect={(id) => chooseOption(QUESTIONS[qIndex].key, id)}
                  onBack={goBack}
                />
              </Fade>
            )}

            {phase === "contact" && (
              <Fade key="contact">
                <ContactView
                  accentRgb={accentRgb}
                  name={name}
                  email={email}
                  phone={phone}
                  message={message}
                  consent={consent}
                  sending={sending}
                  error={formError}
                  onName={setName}
                  onEmail={setEmail}
                  onPhone={setPhone}
                  onMessage={setMessage}
                  onConsent={setConsent}
                  onBack={goBack}
                  onSubmit={submit}
                  privacyHref={brand.id === "agiworks" ? "/agiworks/datenschutz" : "/datenschutz"}
                />
              </Fade>
            )}

            {phase === "done" && (
              <Fade key="done">
                <DoneView
                  accentRgb={accentRgb}
                  recommendation={recommendation}
                  homeHref={homeHref}
                  name={name}
                />
              </Fade>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────  Views  ───────────────────────────── */

function QuestionView({
  question,
  index,
  total,
  selected,
  accentRgb,
  onSelect,
  onBack,
}: {
  question: Question;
  index: number;
  total: number;
  selected?: string;
  accentRgb: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div>
      {/* Fortschritt */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 26 : 8,
              background: i <= index ? `rgb(${accentRgb})` : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      <div className="text-center">
        <h2
          className="mx-auto max-w-[520px] text-[1.6rem] font-light leading-tight tracking-tight text-white sm:text-[2rem]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          {question.title}
        </h2>
        <p className="mt-3 text-[14px] text-white/50">{question.subtitle}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id)}
              className="group flex items-center gap-4 rounded-2xl p-4 text-left outline-none transition-all duration-200 hover:scale-[1.015] focus-visible:ring-2 sm:p-5"
              style={{
                background: active
                  ? `linear-gradient(160deg, rgba(${accentRgb},0.22), rgba(${accentRgb},0.10))`
                  : "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                border: active
                  ? `1px solid rgba(${accentRgb},0.6)`
                  : "1px solid rgba(255,255,255,0.10)",
                boxShadow: active
                  ? `0 12px 36px rgba(${accentRgb},0.22)`
                  : "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors"
                style={{
                  background: active ? `rgb(${accentRgb})` : "rgba(255,255,255,0.06)",
                  color: active ? "#fff" : `rgb(${accentRgb})`,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {o.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-medium text-white">{o.label}</span>
                {o.hint && (
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-white/45">
                    {o.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full px-5 py-2.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white/85"
        >
          Zurück
        </button>
      </div>
    </div>
  );
}

function ContactView({
  accentRgb,
  name,
  email,
  phone,
  message,
  consent,
  sending,
  error,
  onName,
  onEmail,
  onPhone,
  onMessage,
  onConsent,
  onBack,
  onSubmit,
  privacyHref,
}: {
  accentRgb: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  sending: boolean;
  error: string | null;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onPhone: (v: string) => void;
  onMessage: (v: string) => void;
  onConsent: (v: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  privacyHref: string;
}) {
  return (
    <div>
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: `rgba(${accentRgb},0.14)`,
            border: `1px solid rgba(${accentRgb},0.35)`,
            color: `rgb(${accentRgb})`,
          }}
        >
          <IconMail />
        </div>
        <h2
          className="text-[1.6rem] font-light leading-tight tracking-tight text-white sm:text-[2rem]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Fast geschafft!
        </h2>
        <p className="mx-auto mt-3 max-w-[420px] text-[14.5px] leading-relaxed text-white/55">
          Wohin dürfen wir Ihre persönliche Auswertung senden? Wir melden uns
          zeitnah mit einer klaren Empfehlung.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-[440px] flex-col gap-4">
        <SimpleField label="Ihr Name" value={name} onChange={onName} placeholder="Vor- und Nachname" accentRgb={accentRgb} />
        <SimpleField label="E-Mail" value={email} onChange={onEmail} placeholder="name@beispiel.de" type="email" accentRgb={accentRgb} />
        <SimpleField label="Telefon (optional)" value={phone} onChange={onPhone} placeholder="Für einen kurzen Rückruf" type="tel" accentRgb={accentRgb} />

        {/* Optionales Nachrichtenfeld */}
        <SimpleTextarea
          label="Ihre Nachricht (optional)"
          value={message}
          onChange={onMessage}
          placeholder="Beschreiben Sie kurz Ihr Unternehmen oder was Sie sich vorstellen — damit wir uns optimal vorbereiten können."
          accentRgb={accentRgb}
        />

        <label className="mt-1 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsent(e.target.checked)}
            className="sr-only"
          />
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all"
            style={{
              background: consent ? `rgb(${accentRgb})` : "transparent",
              border: consent ? `1px solid rgb(${accentRgb})` : "1px solid rgba(255,255,255,0.25)",
            }}
          >
            {consent && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-[13px] leading-relaxed text-white/55">
            Ich bin mit der{" "}
            <Link href={privacyHref} className="underline underline-offset-2 hover:text-white/90" style={{ color: `rgb(${accentRgb})` }}>
              Datenschutzverarbeitung
            </Link>{" "}
            einverstanden.
          </span>
        </label>

        {error && (
          <p className="text-center text-[13px] text-red-400">{error}</p>
        )}

        <BigButton accentRgb={accentRgb} onClick={onSubmit} disabled={sending} full>
          {sending ? "Wird gesendet …" : "Kostenlose Analyse erhalten"}
        </BigButton>

        <button
          type="button"
          onClick={onBack}
          className="mx-auto rounded-full px-5 py-2 text-[13px] font-medium text-white/45 transition-colors hover:text-white/80"
        >
          Zurück
        </button>
      </div>
    </div>
  );
}

function DoneView({
  accentRgb,
  recommendation,
  homeHref,
  name,
}: {
  accentRgb: string;
  recommendation: { title: string; text: string };
  homeHref: string;
  name: string;
}) {
  const firstName = name.trim().split(" ")[0];
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: `rgba(${accentRgb},0.16)`,
          border: `1px solid rgba(${accentRgb},0.45)`,
          boxShadow: `0 0 40px rgba(${accentRgb},0.3)`,
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 13l4 4L19 7" stroke={`rgb(${accentRgb})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <h2
        className="text-[1.7rem] font-light leading-tight tracking-tight text-white sm:text-[2.1rem]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        Vielen Dank{firstName ? `, ${firstName}` : ""}!
      </h2>
      <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-relaxed text-white/55">
        Ihre Analyse ist bei uns eingegangen. Wir melden uns zeitnah persönlich
        bei Ihnen.
      </p>

      <div
        className="mx-auto mt-8 max-w-[460px] rounded-2xl p-6 text-left"
        style={{
          background: `linear-gradient(160deg, rgba(${accentRgb},0.12), rgba(255,255,255,0.02))`,
          border: `1px solid rgba(${accentRgb},0.3)`,
        }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: `rgb(${accentRgb})` }}>
          Unsere erste Empfehlung für Sie
        </span>
        <h3 className="mt-2 text-[1.15rem] font-medium text-white">{recommendation.title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{recommendation.text}</p>
      </div>

      <div className="mt-8">
        <Link
          href={homeHref}
          className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, rgba(${accentRgb},0.4), rgba(${accentRgb},0.65))`,
            border: `1px solid rgba(${accentRgb},0.4)`,
            boxShadow: `0 10px 32px rgba(${accentRgb},0.25)`,
          }}
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────  UI-Bausteine  ───────────────────────────── */

function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function BigButton({
  children,
  onClick,
  accentRgb,
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick: () => void;
  accentRgb: string;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${full ? "w-full" : ""}`}
      style={{
        background: `linear-gradient(135deg, rgba(${accentRgb},0.5), rgba(${accentRgb},0.72))`,
        border: `1px solid rgba(${accentRgb},0.5)`,
        boxShadow: `0 12px 36px rgba(${accentRgb},0.28), inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
    >
      {children}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function SimpleField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  accentRgb,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  accentRgb: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-[12px] font-medium text-white/55">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder-white/30 outline-none transition-all"
        style={{
          border: focus ? `1px solid rgb(${accentRgb})` : "1px solid rgba(255,255,255,0.10)",
          boxShadow: focus ? `0 0 0 3px rgba(${accentRgb},0.15)` : "none",
        }}
      />
    </div>
  );
}

function SimpleTextarea({
  label,
  value,
  onChange,
  placeholder,
  accentRgb,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accentRgb: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-[12px] font-medium text-white/55">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder-white/30 outline-none transition-all"
        style={{
          border: focus ? `1px solid rgb(${accentRgb})` : "1px solid rgba(255,255,255,0.10)",
          boxShadow: focus ? `0 0 0 3px rgba(${accentRgb},0.15)` : "none",
        }}
      />
      <p className="mt-1.5 text-right text-[11.5px] text-white/30">
        {value.length > 0 ? `${value.length} Zeichen` : "Nicht verpflichtend"}
      </p>
    </div>
  );
}

/* ─────────────────────────────  Icons  ───────────────────────────── */
function I({ children }: { children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}
function IconBriefcase() { return <I><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></I>; }
function IconCart() { return <I><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.4 12.4a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.8L20 8H6" /></I>; }
function IconSpark() { return <I><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></I>; }
function IconTools() { return <I><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" /></I>; }
function IconHeart() { return <I><path d="M12 20s-7-4.4-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.6 12 20 12 20Z" /></I>; }
function IconDots() { return <I><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></I>; }
function IconTrend() { return <I><path d="M3 17l6-6 4 4 7-7M14 8h5v5" /></I>; }
function IconBolt() { return <I><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" /></I>; }
function IconGrid() { return <I><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></I>; }
function IconGlobe() { return <I><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" /></I>; }
function IconQuestion() { return <I><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3M12 17h.01" /></I>; }
function IconPhone() { return <I><path d="M5 4h4l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></I>; }
function IconPuzzle() { return <I><path d="M10 4a2 2 0 1 1 4 0v2h3a1 1 0 0 1 1 1v3h2a2 2 0 1 1 0 4h-2v3a1 1 0 0 1-1 1h-3v-2a2 2 0 1 0-4 0v2H7a1 1 0 0 1-1-1v-3H4a2 2 0 1 1 0-4h2V7a1 1 0 0 1 1-1h3V4Z" /></I>; }
function IconCheck() { return <I><path d="M5 13l4 4L19 7" /></I>; }
function IconMail() { return <I><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></I>; }
