import Link from "@/components/BrandAwareLink";

type Brand = "nexcel" | "agiworks";
type Topic = { href: string; title: string; description: string };
type Content = { eyebrow: string; heading: string; intro: string; topics: Topic[] };

const CONTENT: Record<Brand, Content> = {
  nexcel: {
    eyebrow: "KI-BERATUNG · ORIENTIERUNG",
    heading: "Welches KI-Vorhaben möchten Sie besprechen?",
    intro: "Ein gutes Erstgespräch beginnt mit dem konkreten Prozess: Ziel, vorhandene Systeme, Datenzugriff und die Entscheidungen, die beim Menschen bleiben müssen. Diese Themen helfen bei der Vorbereitung.",
    topics: [
      { href: "/loesungen/ki-systeme", title: "KI-Systeme für Unternehmen", description: "Anwendungsfall, Datenquellen, Integrationen, Betrieb und überprüfbare Qualitätskriterien klären." },
      { href: "/loesungen/ki-agenten", title: "KI-Agenten", description: "Aufgaben, Werkzeugzugriffe, Rechte, Freigabeschritte und Grenzen eines Agenten festlegen." },
      { href: "/loesungen/automatisierung", title: "Prozessautomatisierung", description: "Wiederkehrende Arbeitsschritte, Ausnahmen und Übergaben zwischen bestehenden Systemen analysieren." },
      { href: "/loesungen/ki-fuer-vertrieb", title: "KI im Vertrieb", description: "Anfrageeingang, CRM-Daten, Qualifizierung, Datenschutz und menschliche Entscheidungen strukturieren." },
    ],
  },
  agiworks: {
    eyebrow: "SOFTWAREBERATUNG · ORIENTIERUNG",
    heading: "Welche Software soll Ihr Unternehmen weiterbringen?",
    intro: "Wir besprechen fachliche Anforderungen, bestehende Software, Schnittstellen und realistische Umsetzungsschritte. Eine klare Abgrenzung des Leistungsumfangs ist die Grundlage für eine belastbare Planung.",
    topics: [
      { href: "/leistungen/softwareentwicklung", title: "Individuelle Software", description: "Geschäftsabläufe, Nutzerrollen, Datenmodell, Wartbarkeit und Abnahmekriterien definieren." },
      { href: "/leistungen/erp-system-entwicklung", title: "ERP-Entwicklung", description: "Aufträge, Stammdaten, Berechtigungen, Migration und die Anbindung vorhandener Systeme erfassen." },
      { href: "/leistungen/crm-system-entwicklung", title: "CRM-Entwicklung", description: "Lead-Strecken, Kontaktakten, Freigaben und Schnittstellen entlang des Vertriebsprozesses prüfen." },
      { href: "/leistungen/api-entwicklung", title: "API & Systemintegration", description: "Datenverträge, Authentifizierung, Fehlerbehandlung und Monitoring für Schnittstellen planen." },
    ],
  },
};

/** Readable purchase-intent links, rendered by the server on an already indexed page. */
export default function ConsultationIntentLinks({ brand }: { brand: Brand }) {
  const content = CONTENT[brand];
  const accent = brand === "nexcel" ? "text-violet-300" : "text-sky-300";
  const id = `consultation-topics-${brand}`;
  return (
    <section aria-labelledby={id} className="mx-auto max-w-6xl px-1 pb-4 pt-16 sm:pt-20">
      <div className="max-w-3xl">
        <p className={`text-[11px] font-semibold uppercase tracking-[.2em] ${accent}`}>{content.eyebrow}</p>
        <h2 id={id} className="mt-4 text-2xl font-medium tracking-tight text-white sm:text-3xl">{content.heading}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">{content.intro}</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {content.topics.map((topic) => (
          <Link
            key={topic.href}
            href={topic.href}
            className="group flex min-h-[195px] flex-col rounded-[22px] border border-white/10 bg-white/[.035] p-6 transition-colors hover:border-white/30 hover:bg-white/[.065] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <h3 className="text-base font-medium leading-snug text-white">{topic.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-white/60">{topic.description}</p>
            <span aria-hidden="true" className={`mt-5 text-sm font-medium ${accent}`}>Leistungsbereich ansehen →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
