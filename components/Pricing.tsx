"use client";

import { motion } from "framer-motion";

const plans = [
  {
    name: "Individuelles Projekt",
    price: "Auf Anfrage",
    period: "",
    features: [
      "Maßgeschneiderte Softwarelösung",
      "KI-Integration nach Bedarf",
      "Vollständige Entwicklung",
      "Support & Wartung",
      "Individuelle Anpassungen",
    ],
    highlighted: true,
  },
  {
    name: "KI-Consulting",
    price: "Auf Anfrage",
    period: "",
    features: [
      "Strategieberatung",
      "KI-Konzeption",
      "Technische Analyse",
      "Roadmap-Entwicklung",
      "Best Practices",
    ],
    highlighted: false,
  },
  {
    name: "Langzeit-Partnerschaft",
    price: "Individuell",
    period: "auf Anfrage",
    features: [
      "Kontinuierliche Entwicklung",
      "Dedizierte Betreuung",
      "Sprint-basierte Umsetzung",
      "Agile Methoden",
      "Prioritäts-Support",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section className="relative py-40 px-6 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.h2
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-24 text-[#FFFFFF] tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#00E1FF] neural-text-glow-soft">Preise</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`neural-glass rounded-neuralLg p-10 hover:neural-glass-hover transition-all duration-500 ${
                plan.highlighted
                  ? "border-2 border-[#00E1FF]/50 shadow-neuralGlow"
                  : ""
              }`}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -10, scale: plan.highlighted ? 1.05 : 1.02 }}
            >
              <h3 className="text-3xl md:text-4xl font-bold text-[#FFFFFF] mb-6 tracking-tight">
                {plan.name}
              </h3>
              <div className="mb-10">
                <span className="text-5xl md:text-6xl font-bold text-[#FFFFFF]">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-[#DDE2E8] text-lg ml-2 font-light">
                    {plan.period}
                  </span>
                )}
              </div>
              <ul className="space-y-5 mb-12">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start text-[#DDE2E8]"
                  >
                    <span className="text-[#00E1FF] mr-4 text-xl font-bold">✓</span>
                    <span className="text-lg font-light">{feature}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                className={`w-full py-5 rounded-neural font-semibold text-base transition-all duration-300 ${
                  plan.highlighted
                    ? "neural-button-primary"
                    : "neural-button-hologram"
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Jetzt starten
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
