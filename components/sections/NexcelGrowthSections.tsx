import Link from "next/link";
import type { ReactNode } from "react";
import NexcelWhyPremium from "@/components/sections/NexcelWhyPremium";
import NexcelInvestmentCentered from "@/components/sections/NexcelInvestmentCentered";

type Case = {
  index: string;
  category: string;
  title: string;
  description: string;
  steps: string[];
  result: string;
  href: string;
};

const cases: Case[] = [
  {
    index: "01",
    category: "ANFRAGEN & VERTRIEB",
    title: "Anfragen erfassen. Interessenten gezielt weiterführen.",
    description: "Anfragen aus Formularen und E-Mails strukturieren, relevante Informationen zuordnen und die nächsten Schritte für Ihr Team vorbereiten.",
    steps: ["Eingang", "Einordnung", "CRM-Übergabe"],
    result: "Weniger manuelles Sortieren und klarere Zuständigkeiten.",
    href: "/loesungen/lead-automation",
  },
  {
    index: "02",
    category: "KI-AGENTEN",
    title: "Routineaufgaben intelligent unterstützen lassen.",
    description: "KI-Agenten können Informationen aufbereiten, Vorschläge erstellen und wiederkehrende Arbeitsschritte übernehmen – mit definierten Regeln und Freigaben.",
    steps: ["Aufgabe", "KI-Vorschlag", "Freigabe"],
    result: "Ihr Team entscheidet dort, wo es darauf ankommt.",
    href: "/loesungen/ki-agenten",
  },
  {
    index: "03",
    category: "KOMMUNIKATION",
    title: "E-Mails und Rückfragen besser organisieren.",
    description: "Nachrichten vorstrukturieren, Antworten vorbereiten und Vorgänge nachvollziehbar an zuständige Personen übergeben.",
    steps: ["Nachricht", "Zuordnung", "Antwortentwurf"],
    result: "Weniger Suchaufwand und eine transparentere Bearbeitung.",
    href: "/loesungen/email-automation",
  },
  {
    index: "04",
    category: "CRM & PROZESSE",
    title: "Informationen verbinden statt doppelt pflegen.",
    description: "Bestehende Anwendungen und Datenflüsse so verknüpfen, dass Kontakte, Aufgaben und Statuswechsel im Arbeitsalltag zusammenpassen.",
    steps: ["Datenquelle", "Workflow", "Aktueller Status"],
    result: "Weniger Medienbrüche und ein besserer Überblick.",
    href: "/loesungen/crm-automation",
  },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {diagonal ? <path d="M5 19 19 5M8 5h11v11" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}
    </svg>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[.27em] text-[#B69AFF]">{children}</p>;
}

function Heading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-[820px] text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-balance text-[clamp(2rem,4.3vw,3.25rem)] font-[400] leading-[1.11] tracking-[-.04em] text-white">{title}</h2>
      {subtitle && <p className="mx-auto mt-5 max-w-[660px] text-pretty text-[15px] leading-[1.8] text-white/55">{subtitle}</p>}
    </div>
  );
}

/** Problem->Outcome: no fabricated savings percentages or live-product claims. */
export function NexcelProblemSection() {
  return (
    <section id="warum-automatisieren" className="relative scroll-mt-32 overflow-hidden bg-[#080712] px-5 py-20 sm:px-8 sm:py-24 lg:py-28" data-homeflow-surface="true">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid items-start gap-12 lg:grid-cols-[.91fr_1.09fr] lg:gap-20">
          <div>
            <Eyebrow>WENN ROUTINE IHRE ZEIT KOSTET</Eyebrow>
            <h2 className="mt-5 text-balance text-[clamp(2.1rem,4vw,3.4rem)] leading-[1.13] tracking-[-.045em] text-white">
              Weniger manuelle Arbeit. <span className="text-[#BDA8F4]">Mehr Zeit für Ihr Unternehmen.</span>
            </h2>
            <p className="mt-6 max-w-[520px] text-[15px] leading-[1.8] text-white/60">
              Kundenanfragen, Datentransfers und Abstimmungen kosten täglich wertvolle Zeit. Wir verbinden Ihre bestehenden Systeme und automatisieren wiederkehrende Abläufe – nachvollziehbar und mit klaren Zuständigkeiten.
            </p>
            <Link href="/kontakt?betreff=KI-Automatisierung%20besprechen" className="group mt-8 inline-flex items-center gap-2 rounded-xl border border-[#9F80E2]/50 bg-[#9B70E8]/15 px-5 py-3.5 text-[13px] font-semibold text-white transition-colors hover:border-[#CAB7FF] hover:bg-[#9B70E8]/25">
              Ablauf unverbindlich besprechen <span className="text-[#C4A6FF] transition-transform group-hover:translate-x-1"><Arrow /></span>
            </Link>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(76,50,125,.17),rgba(15,13,24,.96))] p-5 shadow-[0_35px_95px_rgba(0,0,0,.24)] sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-5">
              <span className="text-xs font-semibold text-white/75">Ein typischer Prozess</span>
              <span className="rounded-full border border-[#AD91F3]/25 bg-[#AD91F3]/10 px-3 py-1 text-[10px] font-medium text-[#D0BBFF]">Beispielablauf</span>
            </div>
            <div className="space-y-3">
              {[
                ["01", "Eine Anfrage trifft ein", "Formular oder E-Mail"],
                ["02", "Informationen werden geordnet", "Regelbasiert, optional KI-unterstützt"],
                ["03", "Ihr Team erhält den nächsten Schritt", "Mit Kontext und klarer Zuständigkeit"],
              ].map(([num, title, detail], index) => (
                <div key={num} className="relative flex items-center gap-4 rounded-[18px] border border-white/[.08] bg-white/[.035] p-4 sm:gap-5 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B69AFF]/25 bg-[#B69AFF]/10 text-[12px] font-semibold text-[#C8B0FF]">{num}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-white/90">{title}</p>
                    <p className="mt-1 text-[12px] text-white/45">{detail}</p>
                  </div>
                  {index === 2 && <span aria-label="Mit Verantwortlichem" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">✓</span>}
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11.5px] leading-relaxed text-white/40">Jeder Ablauf wird an Ihre Prozesse, Systeme und Freigaberegeln angepasst.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CaseCard({ item }: { item: Case }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-white/[.10] bg-[linear-gradient(155deg,rgba(255,255,255,.048),rgba(255,255,255,.016))] p-6 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 hover:border-[#AF8CF3]/40 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#885FDC]/[.085] blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#BBA4F1]">{item.category}</span>
        <span className="font-mono text-[12px] text-white/25">{item.index} / 04</span>
      </div>
      <h3 className="relative mt-7 max-w-[500px] text-balance text-[clamp(1.35rem,2vw,1.75rem)] leading-[1.25] tracking-[-.03em] text-white">{item.title}</h3>
      <p className="relative mt-4 max-w-[510px] text-[13.5px] leading-[1.8] text-white/53">{item.description}</p>
      <div className="relative mt-7 flex flex-wrap items-center gap-2 rounded-[14px] border border-white/[.07] bg-[#0B0A15]/70 px-3 py-4 sm:gap-3 sm:px-4">
        {item.steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-2 sm:gap-3">
            {idx > 0 && <span className="text-[#A789DF]/65">→</span>}
            <span className="whitespace-nowrap text-[10px] font-medium text-white/60 sm:text-[11px]">{step}</span>
          </div>
        ))}
      </div>
      <p className="relative mt-5 text-[12.5px] leading-[1.7] text-[#D2C1F8]">{item.result}</p>
      <div className="mt-auto pt-7">
        <Link href={item.href} className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/85 transition-colors hover:text-[#D2BFFF]">
          Lösung ansehen <Arrow />
        </Link>
      </div>
    </article>
  );
}

export function NexcelSolutionsSection() {
  return (
    <section id="systeme" className="scroll-mt-32 bg-[#07060F] px-5 py-20 sm:px-8 sm:py-24 lg:py-28" data-nxl-premium-usecases="true" data-homeflow-surface="true">
      <div className="mx-auto max-w-[1200px]">
        <Heading eyebrow="KONKRETE ABLÄUFE STATT LEERER VERSPRECHEN" title="Wo kann KI Ihrem Team Arbeit abnehmen?" subtitle="Vier typische Aufgabenfelder. Wir prüfen gemeinsam, was sich in Ihrem Unternehmen tatsächlich automatisieren lässt und was besser beim Team bleibt." />
        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-5" data-nxl-premium-grid="true">
          {cases.map((item) => <CaseCard key={item.index} item={item} />)}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[20px] border border-white/[.09] bg-white/[.025] px-6 py-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[14px] font-medium text-white">Ihr Anwendungsfall ist nicht dabei?</p>
            <p className="mt-1 text-[12px] text-white/50">Weitere Lösungen für KI, Kommunikation und Geschäftsprozesse.</p>
          </div>
          <Link href="/loesungen" className="group inline-flex items-center gap-2 text-[13px] font-semibold text-[#C5A9FF] hover:text-white">Alle Lösungen entdecken <span className="transition-transform group-hover:translate-x-1"><Arrow /></span></Link>
        </div>
      </div>
    </section>
  );
}

const steps = [
  { no: "01", title: "Ablauf verstehen", detail: "Wir klären, wo Zeit verloren geht, welche Systeme beteiligt sind und wer Entscheidungen trifft." },
  { no: "02", title: "Lösung und Grenzen definieren", detail: "Wir legen Anforderungen, Schnittstellen, Zugriffsrechte und notwendige Freigaben nachvollziehbar fest." },
  { no: "03", title: "Umsetzen und verbessern", detail: "Der neue Prozess wird integriert, im realistischen Ablauf getestet und bei Bedarf weiterentwickelt." },
];

export function NexcelDeliverySection() {
  return (
    <section id="ablauf" className="scroll-mt-32 border-y border-white/[.065] bg-[linear-gradient(180deg,#0B0916,#080712)] px-5 py-20 sm:px-8 sm:py-24 lg:py-28" data-nxl-process-premium="true" data-homeflow-surface="true">
      <div className="mx-auto max-w-[1200px]">
        <Heading eyebrow="ZUSAMMENARBEIT" title="Vom ersten Gespräch zum nutzbaren Ablauf." subtitle="Keine KI-Demo ohne Einsatzkonzept. Wir beginnen mit Ihrem Prozess und entwickeln daraus einen belastbaren nächsten Schritt." />
        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5" data-nxl-process-grid="true">
          {steps.map((s) => (
            <div key={s.no} className="rounded-[22px] border border-white/10 bg-white/[.025] p-6 sm:p-7">
              <div className="flex items-center gap-3"><span className="font-mono text-[12px] font-semibold text-[#B69AFF]">{s.no}</span><span className="h-px flex-1 bg-white/10" /></div>
              <h3 className="mt-7 text-[19px] font-semibold tracking-[-.02em] text-white">{s.title}</h3>
              <p className="mt-3 text-[13.5px] leading-[1.75] text-white/55">{s.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center"><Link href="/kontakt?betreff=Erstgespraech%20KI-Automatisierung" className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#B99EF5]/45 bg-[#A279EE]/15 px-6 py-3.5 text-[13px] font-semibold text-white transition hover:bg-[#A279EE]/25" data-nxl-process-cta="true">Strategiegespräch anfragen <span className="transition-transform group-hover:translate-x-1"><Arrow /></span></Link></div>
      </div>
    </section>
  );
}

const principles = [
  ["Direkter Kontakt", "Sie sprechen mit den Verantwortlichen, die Ihr Vorhaben verstehen und umsetzen."],
  ["Klare Zuständigkeiten", "Jeder Prozess braucht definierte Übergaben, Rollen und Freigaben."],
  ["Bestehendes einbeziehen", "Wir prüfen, welche Tools bleiben können und welche Verbindungen wirklich nötig sind."],
  ["Keine KI um jeden Preis", "Wo feste Regeln besser sind als KI, sagen wir das offen."],
];

export function NexcelTrustSection() {
  return (
    <NexcelWhyPremium fallback={<section className="bg-[#080712] px-5 py-20 sm:px-8 sm:py-24 lg:py-28" data-homeflow-surface="true">
      <div className="mx-auto max-w-[1200px]">
        <Heading eyebrow="WARUM NEXCEL AI" title="Klarer Prozess. Klare Verantwortung." subtitle="Vertrauen entsteht nicht durch Superlative, sondern durch nachvollziehbare Entscheidungen, direkte Ansprechpartner und Arbeit, die zum Unternehmen passt." />
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {principles.map(([title, description], i) => (
            <article key={title} className="rounded-[20px] border border-white/[.09] bg-white/[.025] p-6">
              <span className="font-mono text-[11px] font-semibold text-[#B69AFF]">0{i + 1}</span>
              <h3 className="mt-6 text-[15px] font-semibold text-white">{title}</h3>
              <p className="mt-3 text-[12.5px] leading-[1.75] text-white/55">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>} />
  );
}

export function NexcelInvestmentSection() {
  return (
    <NexcelInvestmentCentered fallback={<section id="preise" className="scroll-mt-32 bg-[#080712] px-5 pb-20 pt-8 sm:px-8 sm:pb-24 lg:pb-28" data-homeflow-surface="true">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-[#A78BFA]/25 bg-[radial-gradient(ellipse_at_95%_0%,rgba(127,79,211,.18),transparent_62%),linear-gradient(125deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] px-7 py-9 sm:px-10 sm:py-12 lg:px-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <Eyebrow>INVESTITION & PLANUNG</Eyebrow>
            <h2 className="mt-4 max-w-[720px] text-balance text-[clamp(1.9rem,3.5vw,2.85rem)] leading-tight tracking-[-.035em] text-white">Erst den Nutzen klären. Dann den Projektumfang.</h2>
            <p className="mt-4 max-w-[640px] text-[14px] leading-[1.8] text-white/57">Umfang und Kosten hängen von Prozess, Datenzugriff, Integrationen und Freigaben ab. Wir zeigen die Möglichkeiten und besprechen ehrlich, was sinnvoll ist.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/kontakt?betreff=Projektanfrage%20KI-Automatisierung" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#9E74EB] px-6 py-3.5 text-[13px] font-semibold text-[#0A0714] transition-colors hover:bg-[#BA9BFB]">Projekt besprechen <span className="transition-transform group-hover:translate-x-1"><Arrow /></span></Link>
            <Link href="/preise" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-[13px] font-medium text-white/80 transition-colors hover:border-[#B49BEE]/60 hover:text-white">Preisorientierung ansehen <Arrow /></Link>
          </div>
        </div>
      </div>
    </section>} primaryAction={<Link href="/kontakt?betreff=Projektanfrage%20KI-Automatisierung" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#9E74EB] px-6 py-3.5 text-[13px] font-semibold text-[#0A0714] transition-colors hover:bg-[#BA9BFB]">Projekt besprechen <span className="transition-transform group-hover:translate-x-1"><Arrow /></span></Link>} secondaryAction={<Link href="/preise" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-[13px] font-medium text-white/80 transition-colors hover:border-[#B49BEE]/60 hover:text-white">Preisorientierung ansehen <Arrow /></Link>} anchorId={"preise"} />
  );
}
