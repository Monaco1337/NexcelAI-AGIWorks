import Link from "@/components/BrandAwareLink";
import { toAbsoluteUrl } from "@/config/seo/domains";
import type { AuthorityPage } from "@/data/authorityPortfolio";
import { getAuthorityPages } from "@/data/authorityPortfolio";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import AuthorityDepthSection from "@/components/authority/AuthorityDepthSection";
import { webPageForUrl } from "@/lib/seo/jsonld";

function Accent({children}: {children: React.ReactNode}) {
  return <span className="text-[11px] font-semibold uppercase tracking-[.21em] text-[var(--brand-primary)]">{children}</span>;
}
function Mark({children}: {children: React.ReactNode}) {
  return <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[.045] text-[12px] font-medium text-white/70">{children}</span>;
}

/** Server-rendered, brand-token-aware editorial system. No extra client JS or fake proof. */
export default function AuthorityDetail({page}: {page: AuthorityPage}) {
  const isAgi = page.brand === "agiworks";
  const brand = isAgi ? "AGI Works" : "NEXCEL AI";
  const siblings = getAuthorityPages(page.brand).filter(p => p.slug !== page.slug && p.category === page.category).slice(0, 3);
  const origin = toAbsoluteUrl(page.brand, page.path);
  const accent = isAgi ? "text-sky-300" : "text-violet-300";
  const glow = isAgi ? "from-sky-500/[.13] via-slate-950/0" : "from-violet-500/[.13] via-slate-950/0";
  return <main className="relative isolate min-h-screen overflow-hidden bg-[#080b12] text-white">
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-gradient-to-b ${glow} to-[#080b12]`} />
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.028] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:88px_88px]" />
    <div className="relative mx-auto max-w-[1240px] px-5 pb-24 pt-8 sm:px-8 lg:px-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[12px] text-white/45">
        <Link href="/" className="transition-colors hover:text-white">Start</Link><span aria-hidden="true">/</span>
        <Link href={isAgi ? "/engineering" : "/anwendungen"} className="transition-colors hover:text-white">{isAgi ? "Engineering" : "Anwendungen"}</Link><span aria-hidden="true">/</span>
        <span className="text-white/75" aria-current="page">{page.category}</span>
      </nav>
      <header className="grid items-center gap-12 pb-20 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:pb-28 lg:pt-28">
        <div>
          <Accent>{brand} / {page.category}</Accent>
          <h1 className="mt-7 max-w-[800px] text-[clamp(2.7rem,4.8vw,5.3rem)] font-medium leading-[1.07] tracking-[-.055em] text-white">{page.headline}<span className={`block ${accent}`}>Mit System.</span></h1>
          <p className="mt-7 max-w-[660px] text-[clamp(1.03rem,1.35vw,1.25rem)] leading-[1.75] text-slate-300">{page.problem}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/kontakt" className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] border border-white/25 bg-white px-6 text-[14px] font-medium text-[#0b0d13] transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Projekt besprechen <span aria-hidden="true" className="ml-3">↗</span></Link>
            <a href="#konzept" className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] border border-white/15 px-6 text-[14px] text-white/85 transition-colors hover:border-white/40 hover:bg-white/[.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Konzept ansehen <span aria-hidden="true" className="ml-3">↓</span></a>
          </div>
          <p className="mt-9 border-t border-white/10 pt-5 text-[12px] tracking-[.03em] text-white/45">Strategie · Umsetzung · Betrieb &nbsp; / &nbsp; klar abgegrenzter Projektrahmen</p>
        </div>
        <div className="relative min-w-0">
          <div className="pointer-events-none absolute -inset-4 rounded-[38px] bg-[var(--brand-primary)] opacity-[.07] blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101925] shadow-[0_40px_100px_rgba(0,0,0,.38)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><Accent>Systemperspektive</Accent><span className="text-[11px] text-white/35">01 / 03</span></div>
            <div className="space-y-0 px-6 py-6 sm:px-8">
              {[{num:"01", label:"Strategische Klärung", value:"Ausgangslage, Ergebnis und verantwortliche Rollen präzisieren."},{num:"02", label:"Systemdesign", value:"Datenflüsse, Integrationen und Entscheidungsgrenzen entwerfen."},{num:"03", label:"Operativer Nachweis", value:"Qualität, Kontrolle und Weiterentwicklung im Betrieb absichern."}].map((item,i)=><div key={item.num} className={`flex gap-4 ${i<2 ? "border-b border-white/10 pb-6 mb-6" : ""}`}><Mark>{item.num}</Mark><div><p className={`mb-2 text-[11px] font-semibold uppercase tracking-[.13em] ${accent}`}>{item.label}</p><p className="text-[13px] leading-[1.7] text-white/75">{item.value}</p></div></div>)}
            </div>
            <div className="border-t border-white/10 px-6 py-4 text-right text-[11px] tracking-[.12em] text-white/40">{isAgi ? "ENGINEERED FOR OPERATION" : "DESIGNED FOR BUSINESS"}</div>
          </div>
        </div>
      </header>
      <section id="konzept" className="scroll-mt-24 border-t border-white/10 py-20 lg:py-28">
        <Accent>{isAgi ? "ARCHITEKTURANSATZ" : "UNTERNEHMENSANSATZ"}</Accent>
        <div className="mt-6 grid gap-12 lg:grid-cols-[.65fr_1.35fr] lg:gap-24">
          <h2 className="max-w-[400px] text-[clamp(2rem,3.1vw,3.6rem)] font-medium leading-[1.12] tracking-[-.045em]">Nicht einfach ein Tool. <span className={accent}>Ein durchdachter Prozess.</span></h2>
          <div className="space-y-7"><p className="text-[clamp(1.1rem,1.6vw,1.38rem)] leading-[1.8] text-white/85">{page.approach}</p><p className="text-[15px] leading-8 text-slate-400">{page.system}</p></div>
        </div>
      </section>
      {/* SEO_INTENT_AUTHORITY_V4_20261120: per-topic decision and verifiable acceptance */}
      <AuthorityDepthSection page={page} />
      <section className="grid gap-4 md:grid-cols-3">
        {[{n:"01",k:"Kontrollpunkt",h:"Sicherheit & Grenzen",p:page.risk},{n:"02",k:"Abnahmekriterium",h:"Messbare Qualität",p:page.metric},{n:"03",k:"Geschäftlicher Nutzen",h:"Wirkung im Betrieb",p:page.benefit}].map((b,i)=><article key={b.n} className={`group relative flex min-h-[285px] flex-col rounded-[24px] border border-white/10 p-7 transition-colors hover:border-white/25 ${i===1?"bg-[#172234]":"bg-[#101821]"}`}><span className={`text-[13px] ${accent}`}>{b.n} / {b.k}</span><h3 className="mt-8 text-[22px] font-medium tracking-[-.03em]">{b.h}</h3><p className="mt-4 text-[14px] leading-[1.8] text-slate-400">{b.p}</p></article>)}
      </section>
      <section className="py-20 lg:py-24"><Accent>PASSENDER KONTEXT</Accent><h2 className="mt-4 max-w-[700px] text-[clamp(2rem,2.8vw,3.25rem)] font-medium tracking-[-.04em]">Die passende Leistung dahinter.</h2><p className="mt-4 max-w-[660px] text-[15px] leading-8 text-slate-400">Dieses Einsatzfeld steht nicht isoliert: Wir verbinden Konzeption, technische Anbindung und eine belastbare Weiterentwicklung mit dem tatsächlichen Bedarf Ihres Unternehmens.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Link className="inline-flex items-center rounded-[14px] border border-white/25 bg-white/[.06] px-6 py-4 text-sm text-white transition-colors hover:bg-white/[.11]" href={page.primaryLink}>Passende Leistung ansehen <span aria-hidden="true" className="ml-4">↗</span></Link><Link className="inline-flex items-center rounded-[14px] border border-white/15 px-6 py-4 text-sm text-white/80 transition-colors hover:border-white/35" href="/systemanalyse">Systemanalyse starten <span aria-hidden="true" className="ml-4">↗</span></Link></div>
      </section>
      {siblings.length>0&&<section className="border-t border-white/10 pt-16"><Accent>WEITERE PERSPEKTIVEN</Accent><div className="mt-7 grid gap-4 md:grid-cols-3">{siblings.map(other=><Link href={other.path} key={other.slug} className="group flex min-h-[170px] flex-col justify-between rounded-[20px] border border-white/10 bg-[#111825] p-6 transition-colors hover:border-white/30"><span className="text-[11px] uppercase tracking-[.15em] text-white/45">{other.category}</span><span className="flex items-end justify-between gap-3 text-[17px] font-medium tracking-[-.02em] text-white">{other.headline}<span aria-hidden="true" className={accent}>↗</span></span></Link>)}</div></section>}
      <section className="mt-24 overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#14243c] to-[#100e1b] px-7 py-14 sm:px-12 lg:px-16"><Accent>NÄCHSTER SCHRITT</Accent><h2 className="mt-5 max-w-[800px] text-[clamp(2rem,3.4vw,3.8rem)] font-medium leading-[1.15] tracking-[-.045em]">Ihr konkreter Anwendungsfall. <span className={accent}>Unsere gemeinsame Systementscheidung.</span></h2><p className="mt-6 max-w-[710px] text-[15px] leading-8 text-white/65">Wir klären Ausgangslage, Systemgrenzen, verantwortliche Rollen und eine realistische Umsetzungsfolge. Keine pauschale Lösung, sondern ein nachvollziehbarer Projektrahmen.</p><Link href="/kontakt" className="mt-9 inline-flex min-h-[50px] items-center justify-center rounded-[12px] bg-white px-6 text-sm font-medium text-[#0c101c] hover:bg-slate-200">Projekt besprechen <span aria-hidden="true" className="ml-4">↗</span></Link></section>
    </div>
    <SeoJsonLd schema={webPageForUrl({brand:page.brand,url:origin,name:page.title,description:page.description})} />
  </main>;
}
