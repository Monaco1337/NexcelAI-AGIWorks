import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = (() => {
    /* SEO_LLM_CANONICAL_FIX_20261106 */
    const originalMeta: import("next").Metadata = ({
  title: "Individuelle LLM-Entwicklung & Private KI | NEXCEL AI",
  description: "Eigene Sprachmodelle für Unternehmen: Datenaufbereitung, Modelltraining, Fine-Tuning, Evaluation, sichere Integration und private Inferenz. Individuelle Projektplanung.",
});
    return {
      ...originalMeta,
      alternates: {
        ...(originalMeta.alternates ?? {}),
        canonical: "https://www.nexcelai.de/loesungen/eigene-llms"
      },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true }
      }
    };
  })();

const capabilities = [
  { title: "Modellarchitektur & Daten", body: "Ziele, Modellgröße, Lizenzen, Datenrechte und Trainingsdaten auf Ihren Anwendungsfall abstimmen." },
  { title: "Training & Fine-Tuning", body: "Bestehende Basismodelle gezielt anpassen, Benchmarks definieren und bei entsprechender Machbarkeit eigene Modelle neu trainieren." },
  { title: "Sicherer produktiver Betrieb", body: "Evaluation, Guardrails, Monitoring und optional private oder lokale Inferenz mit nachvollziehbarem Betriebskonzept." },
];

export default function EigeneLLMsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0915] text-white">
      <section className="relative mx-auto max-w-[1160px] px-5 pb-16 pt-40 sm:px-8 sm:pb-24 sm:pt-48">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_65%_50%_at_70%_23%,rgba(111,65,175,.16),transparent)]" />
        <div className="relative z-10">
          <Link href="/loesungen" className="text-sm text-violet-300 hover:text-violet-200">← Alle Lösungen</Link>
          <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-300">NEXCEL AI · PRIVATE LANGUAGE MODELS</p>
          <h1 className="mt-5 max-w-[19ch] text-balance text-[clamp(2.3rem,5vw,4.5rem)] font-normal leading-[1.1] tracking-[-.05em]">Eigene LLMs. <span className="text-violet-300">Für Ihre Anforderungen entwickelt.</span></h1>
          <p className="mt-6 max-w-[770px] text-[clamp(1rem,1.5vw,1.15rem)] leading-[1.8] text-white/70">Wir konzipieren, entwickeln und betreiben individuelle KI-Sprachmodelle für unternehmensspezifische Aufgaben. Dazu gehören Modellarchitektur, Datenaufbereitung, Fine-Tuning, Qualitätstests sowie bei Bedarf private Inferenz auf eigener Infrastruktur.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/kontakt?betreff=Individuelle%20LLM-Entwicklung" className="inline-flex min-h-12 items-center rounded-xl border border-violet-300/45 bg-violet-500/30 px-6 text-sm font-medium hover:bg-violet-500/40">LLM-Projekt besprechen →</Link>
            <Link href="/preise" className="inline-flex min-h-12 items-center rounded-xl border border-white/15 px-5 text-sm text-white/80 hover:border-white/30">Preise ansehen ↗</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1160px] px-5 py-8 sm:px-8" aria-labelledby="llm-leistungen">
        <h2 id="llm-leistungen" className="mb-8 text-2xl font-normal tracking-tight sm:text-3xl">Von der Modellstrategie bis zum produktiven Einsatz.</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map(item => <article key={item.title} className="rounded-2xl border border-violet-300/15 bg-white/[.02] p-6"><h3 className="text-lg font-medium">{item.title}</h3><p className="mt-3 text-sm leading-7 text-white/60">{item.body}</p></article>)}
        </div>
      </section>
      <section className="mx-auto max-w-[1160px] px-5 py-16 sm:px-8" aria-labelledby="llm-preise">
        <div className="grid gap-7 rounded-[26px] border border-violet-300/20 bg-violet-500/[.055] p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-violet-300">INVESTITION & PLANUNG</p><h2 id="llm-preise" className="mt-3 text-2xl font-normal tracking-tight sm:text-3xl">Transparenter Projektkorridor.</h2><p className="mt-3 max-w-[65ch] text-sm leading-7 text-white/65">25.000–90.000 € als erste Orientierung für die Anpassung bestehender Modelle einschließlich geplanter Daten- und Evaluationsarbeiten. Ein vollständig von Grund auf trainiertes Modell wird aufgrund von Daten-, Rechen- und Entwicklungsaufwand separat kalkuliert. Hardware und laufender Betrieb sind nicht pauschal enthalten.</p></div>
          <div className="md:text-right"><p className="text-sm text-white/45">Modellanpassung & Integration</p><strong className="mt-2 block whitespace-nowrap text-[clamp(1.5rem,2.5vw,2.25rem)] font-medium tracking-tight text-violet-300">25.000–90.000 €</strong><Link href="/kontakt?betreff=LLM-Projektkorridor" className="mt-4 inline-flex items-center gap-3 text-sm text-violet-200 hover:text-white">Individuelles Angebot anfragen →</Link></div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
