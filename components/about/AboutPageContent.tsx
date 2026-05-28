"use client";

import Image from "next/image";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";

const workPrinciples = [
  {
    title: "Klare Systeme",
    description:
      "Statt komplizierter Lösungen entwickeln wir intuitive, durchdachte Architekturen, die sofort verständlich sind.",
  },
  {
    title: "Schnelle Umsetzung",
    description:
      "Saubere Implementierung ohne Umwege. Wir liefern funktionierende Systeme, nicht Versprechungen.",
  },
  {
    title: "Skalierbare Architektur",
    description:
      "Jedes System wächst mit Ihrem Unternehmen. Nachhaltige Lösungen für langfristigen Erfolg.",
  },
  {
    title: "Direkte Zusammenarbeit",
    description:
      "Transparente Kommunikation ohne Agenturfilter. Sie arbeiten direkt mit den Entwicklern.",
  },
];

function glassCardStyle(): React.CSSProperties {
  return {
    background: "rgba(12, 15, 26, 0.7)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow:
      "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 20px var(--brand-glow-soft)",
  };
}

function FounderPortrait({
  name,
  role,
  image,
  imageAlt,
  imagePosition = "center top",
}: {
  name: string;
  role: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--brand-glow-strong) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div
        className="relative w-full h-full rounded-full overflow-hidden border-2"
        style={{
          borderColor: "var(--brand-line-mid)",
          boxShadow:
            "0 0 40px var(--brand-glow-mid), inset 0 0 20px var(--brand-glow-soft)",
          background: "rgba(12, 15, 26, 0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        {!imageError ? (
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
            quality={95}
            style={{
              objectFit: "cover",
              objectPosition: imagePosition,
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, var(--brand-glow-soft) 100%)",
            }}
          >
            <span
              className="text-5xl font-light tracking-tight md:text-6xl"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {initials}
            </span>
            <span className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/45">
              {role.split(" ")[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutPageContent() {
  const brand = useBrand();
  const { about } = brand;

  return (
    <main className="relative min-h-screen overflow-x-clip">
      <Navigation />

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center px-6 py-20 md:py-32">
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              className="flex justify-center lg:justify-start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <FounderPortrait
                name={about.founder.name}
                role={about.founder.role}
                image={about.founder.image}
                imageAlt={about.founder.imageAlt}
                imagePosition={about.founder.imagePosition}
              />
            </motion.div>

            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.h1
                className="typography-h1 typography-h1-gradient mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                Über <span className="typography-h1-gradient">uns</span>
              </motion.h1>
              <p className="typography-body mx-auto mb-6 max-w-2xl text-lg leading-relaxed md:text-xl lg:mx-0">
                {about.heroLead}
              </p>
              <p className="typography-body-secondary mx-auto max-w-2xl text-base leading-relaxed md:text-lg lg:mx-0">
                {about.heroSecondary}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            className="relative overflow-hidden rounded-3xl p-10 md:p-16"
            style={{
              ...glassCardStyle(),
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px var(--brand-glow-soft)",
            }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h2
              className="typography-h1 typography-h1-gradient mb-6 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Unsere <span className="typography-h1-gradient">Vision</span>
            </motion.h2>
            <p className="typography-body mb-6 text-lg leading-relaxed md:text-xl">
              {about.visionParagraphs[0]}
            </p>
            <p className="typography-body-secondary text-base leading-relaxed md:text-lg">
              {about.visionParagraphs[1]}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Wie wir arbeiten — editorial, ohne Icons */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.h2
            className="mb-14 text-center text-[clamp(1.75rem,4vw,2.75rem)] font-light leading-[1.08] tracking-[-0.035em] text-white md:mb-16"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            Wie wir{" "}
            <span
              style={{
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 400,
              }}
            >
              arbeiten
            </span>
          </motion.h2>

          {/* Top hairline */}
          <div
            aria-hidden
            className="mx-auto mb-10 h-px max-w-4xl"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
              opacity: 0.55,
            }}
          />

          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {workPrinciples.map((principle, index) => (
              <motion.div
                key={principle.title}
                className="group relative px-0 py-8 sm:px-6 sm:py-10 lg:px-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.75,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Vertikaler Trenner — Desktop */}
                {index > 0 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-8 hidden h-[calc(100%-4rem)] w-px lg:block"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent, var(--brand-line-dim), transparent)",
                    }}
                  />
                )}

                <span
                  className="mb-4 block text-[10px] uppercase tracking-[0.32em]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    color: "rgba(255,255,255,0.32)",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3
                  className="mb-3 text-[1.05rem] leading-[1.25] tracking-[-0.02em] text-white/92 sm:text-[1.1rem]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 400,
                  }}
                >
                  {principle.title}
                </h3>

                <p
                  className="text-[13.5px] leading-[1.7] text-white/48 sm:text-[14px]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {principle.description}
                </p>

                {/* Horizontaler Trenner — Mobile / Tablet */}
                {index < workPrinciples.length - 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 block h-px lg:hidden"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--brand-line-dim), transparent)",
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Bottom hairline */}
          <div
            aria-hidden
            className="mx-auto mt-10 h-px max-w-4xl"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
              opacity: 0.55,
            }}
          />
        </div>
      </section>

      {/* Werte — editorial, ohne Glass-Boxen */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.h2
            className="mb-14 text-center text-[clamp(1.75rem,4vw,2.75rem)] font-light leading-[1.08] tracking-[-0.035em] text-white md:mb-16"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            Unsere{" "}
            <span
              style={{
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 400,
              }}
            >
              Werte
            </span>
          </motion.h2>

          <div
            aria-hidden
            className="mx-auto mb-10 h-px max-w-3xl"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
              opacity: 0.55,
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {about.values.map((value, index) => (
              <motion.div
                key={value.title}
                className="group relative px-0 py-9 sm:px-8 sm:py-11"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.75,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {index % 2 === 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-9 hidden h-[calc(100%-4.5rem)] w-px sm:block"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent, var(--brand-line-dim), transparent)",
                    }}
                  />
                )}

                {index >= 2 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 hidden h-px sm:block"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--brand-line-dim), transparent)",
                    }}
                  />
                )}

                {index > 0 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 block h-px sm:hidden"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--brand-line-dim), transparent)",
                    }}
                  />
                )}

                <h3
                  className="mb-3 text-[1.15rem] leading-[1.2] tracking-[-0.02em] sm:text-[1.25rem]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 400,
                    background: "var(--brand-headline-gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {value.title}
                </h3>

                <p
                  className="max-w-[34ch] text-[13.5px] leading-[1.72] text-white/50 sm:text-[14.5px]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div
            aria-hidden
            className="mx-auto mt-10 h-px max-w-3xl"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
              opacity: 0.55,
            }}
          />
        </div>
      </section>

      {/* Geschichte */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.h2
            className="typography-h1 typography-h1-gradient mb-12 text-center text-3xl font-bold tracking-tight md:mb-16 md:text-4xl lg:text-5xl"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Unsere <span className="typography-h1-gradient">Geschichte</span>
          </motion.h2>
          <div className="space-y-8">
            {about.milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year + milestone.title}
                className="relative overflow-hidden rounded-2xl p-8 md:p-10"
                style={glassCardStyle()}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                  <div className="shrink-0">
                    <span className="typography-h1-gradient text-4xl font-bold md:text-5xl">
                      {milestone.year}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-3 text-xl font-bold text-white md:text-2xl">
                      {milestone.title}
                    </h3>
                    <p className="typography-body text-base leading-relaxed md:text-lg">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wofür die Marke steht — editorial, ohne Glass-Box */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div
            aria-hidden
            className="mx-auto mb-12 h-px max-w-2xl"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
              opacity: 0.55,
            }}
          />

          <motion.h2
            className="mb-7 text-[clamp(1.75rem,4vw,2.75rem)] font-light leading-[1.12] tracking-[-0.035em] text-white"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            Wofür{" "}
            <span
              style={{
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 400,
              }}
            >
              {brand.name}
            </span>{" "}
            steht
          </motion.h2>

          <motion.p
            className="mx-auto mb-12 max-w-[52ch] text-[15px] leading-[1.75] text-white/52 sm:text-[16px]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
            }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {about.standForText}
          </motion.p>

          {/* Skills — reine Typografie, keine Pill-Boxen */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            {about.skills.map((skill, index) => (
              <span key={skill} className="inline-flex items-center gap-5 sm:gap-8">
                {index > 0 && (
                  <span
                    aria-hidden
                    className="hidden h-3 w-px sm:inline-block"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent, var(--brand-line-dim), transparent)",
                    }}
                  />
                )}
                <span
                  className="text-[10px] uppercase tracking-[0.24em] text-white/42 sm:text-[10.5px]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              </span>
            ))}
          </motion.div>

          <div
            aria-hidden
            className="mx-auto mt-12 h-px max-w-2xl"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
              opacity: 0.55,
            }}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
