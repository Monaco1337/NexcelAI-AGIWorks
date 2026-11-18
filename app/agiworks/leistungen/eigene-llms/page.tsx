import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { serviceSchema, webPageForUrl } from "@/lib/seo/jsonld";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSeoMetadata({
  brand: "agiworks",
  path: "/leistungen/eigene-llms",
  title: "Individuelle LLM-Entwicklung & Private KI | AGI Works",
  description: "LLM-Engineering für Unternehmen: Fine-Tuning, Evaluierung, RAG, Datenpipelines, private Inferenz und Integration in produktive Software.",
});

const steps = [
  { title: "Modell- & Datenstrategie", text: "Anwendungsfall, Lizenzbedingungen, Datenrechte, Modellbasis und Qualitätsziele klären." },
  { title: "Training & Evaluation", text: "Fine-Tuning, Retrieval-Anbindung, Tests und überprüfbare Qualitätskriterien entwickeln." },
  { title: "Sicherer Betrieb", text: "API-Integration, Zugriffsrechte, Monitoring und private Inferenz in eine tragfähige Architektur überführen." },
];

export default function AgiLlmPage() {
  return (
    <main className="min-h-screen bg-[#080d17] text-white">
      <SeoJsonLd schema={[
        webPageForUrl({
          brand: "agiworks",
          url: "https://www.agiworks.de/leistungen/eigene-llms",
          name: "Individuelle LLM-Entwicklung & Private KI | AGI Works",
          description: "LLM-Engineering für Unternehmen: Fine-Tuning, Evaluierung, RAG, Datenpipelines, private Inferenz und Integration in produktive Software.",
        }),
        serviceSchema({
          brand: "agiworks",
          name: "LLM-Engineering, RAG und private KI-Integration",
          description: "Fine-Tuning, Retrieval-Anbindung, Evaluierung, Datenpipelines, API-Integration und private Inferenz.",
          serviceType: "LLM-Integration",
          url: "https://www.agiworks.de/leistungen/eigene-llms",
        }),
      ]} />
      <section className="mx-auto max-w-[1150px] px-5 pb-16 pt-36 sm:px-8 sm:pt-44">
        <Link href="/leistungen" className="text-sm text-sky-300 hover:text-sky-100">← Alle Leistungen</Link>
        <p className="mt-10 text-[11px] font-medium uppercase tracking-[.24em] text-sky-300">AGI WORKS / PRIVATE LANGUAGE MODELS</p>
        <h1 className="mt-5 max-w-[19ch] text-balance text-[clamp(2.25rem,5vw,4.5rem)] font-normal leading-[1.12] tracking-[-.05em]">Individuelle LLMs. <span className="text-sky-300">Produktionsreif integriert.</span></h1>
        <p className="mt-7 max-w-[740px] text-[16px] leading-[1.8] text-slate-300">Wir entwickeln und integrieren unternehmensspezifische Sprachmodelle – von Modellwahl, Datenpipelines und Fine-Tuning bis zu Evaluation, Private Inference und sicherem Betrieb. Vollständiges Vortraining wird gesondert nach Machbarkeit kalkuliert.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/kontakt?betreff=LLM-Engineering" className="inline-flex min-h-12 items-center rounded-xl border border-sky-300/30 bg-sky-400/15 px-6 text-sm font-medium text-sky-100 hover:bg-sky-400/25">LLM-Projekt besprechen →</Link>
          <Link href="/preise" className="inline-flex min-h-12 items-center rounded-xl border border-white/15 px-6 text-sm text-white/75 hover:border-white/30">Preise ansehen ↗</Link>
        </div>
      </section>
      <section className="mx-auto max-w-[1150px] px-5 py-14 sm:px-8" aria-labelledby="agi-llm-umfang">
        <h2 id="agi-llm-umfang" className="text-2xl font-normal tracking-tight sm:text-3xl">Vom Modellkonzept zur kontrollierbaren Anwendung.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map(step => <article key={step.title} className="rounded-2xl border border-sky-200/15 bg-white/[.02] p-6"><h3 className="text-lg font-medium">{step.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{step.text}</p></article>)}
        </div>
      </section>
      <section className="mx-auto max-w-[1150px] px-5 pb-20 pt-8 sm:px-8" aria-labelledby="agi-llm-invest">
        <div className="rounded-[25px] border border-sky-200/20 bg-sky-500/[.055] p-7 sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-sky-300">PROJEKTORIENTIERUNG</p>
          <h2 id="agi-llm-invest" className="mt-3 text-3xl font-normal tracking-tight">25.000–90.000 €</h2>
          <p className="mt-3 max-w-[76ch] text-sm leading-7 text-slate-300">Richtwert für Modellanpassung und Integration auf Basis bestehender Basismodelle. Eigenständiges Vortraining, Hardware und laufende Infrastruktur sind gesondert zu kalkulieren. Ein individuelles Angebot folgt aus Daten-, Evaluations- und Sicherheitsanforderungen.</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
