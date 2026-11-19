'use client';
/** Public pricing has moved to the private sales workbench. This component never renders prices. */
import Link from "@/components/BrandAwareLink";
import {useBrand} from '@/contexts/BrandContext';
import {resolveBrandNavHref} from '@/lib/brandNav';
import {track} from '@/lib/track';
import styles from './PricingSectionExperience.module.css';

const TOPICS=[
 {title:'Bedarf verstehen',description:'Wir sprechen über Ihr Unternehmen, konkrete Ziele und den bisherigen Prozess.'},
 {title:'Lösung eingrenzen',description:'Wir vergleichen einen schlanken Einstieg mit weiteren Integrations- und Ausbauoptionen.'},
 {title:'Verbindlich planen',description:'Nach technischer Klärung erhalten Sie ein individuelles Angebot mit nachvollziehbarem Leistungsumfang.'},
];
export default function PricingSection({compact=false,standalonePage=false}:{compact?:boolean;standalonePage?:boolean}={}){
 const brand=useBrand();
 const isAgi=brand.id==='agiworks';
 const booking=resolveBrandNavHref('/beratung',brand.id);
 const contact=resolveBrandNavHref('/kontakt',brand.id);
 const Headline=standalonePage?'h1':'h2';
 return <section id="preise" aria-labelledby="pricing-experience-title" className={`${styles.root} ${compact?styles.compact:''}`}>
  <div className={styles.shell}>
   <header className={styles.intro}>
    <div><p className={styles.eyebrow}>PROJEKTKLÄRUNG STATT PREISLISTE</p><Headline id="pricing-experience-title" className={styles.title}>{isAgi?'Softwarevorhaben planen.':'KI-Vorhaben konkretisieren.'}<span>Persönlich. Technisch fundiert.</span></Headline></div>
    <p className={styles.lead}>Jedes Unternehmen hat andere Anforderungen. Wir bestimmen zuerst den notwendigen Umfang, den Nutzen und die Integrationen. Danach folgt eine belastbare individuelle Kalkulation.</p>
   </header>
   <div className={styles.experience}>
    <div className={styles.stage}><div className={styles.stageInner}><div className={styles.story}><p className={styles.stageCaption}>SO ENTSTEHT IHR ANGEBOT</p><h3>Ein klarer Einstieg. Keine Scheingenauigkeit.</h3><p>Sie müssen keine technische Lösung vorgeben. Wir übersetzen Ihre Anforderungen in mögliche nächste Schritte.</p><span className={styles.storyTag}>INDIVIDUELLER PROJEKTUMFANG</span></div>
    <div className={styles.offerGrid}>{TOPICS.map(t=><div className={styles.offer} key={t.title}><div><h4>{t.title}</h4><p className={styles.offerDescription}>{t.description}</p></div></div>)}</div></div></div>
    <div className={styles.actionBar}><p>Das Erstgespräch ist für Sie unverbindlich. Das konkrete Projektangebot wird anschließend anhand Ihrer Anforderungen erstellt.</p><div className={styles.actionLinks}>
     <Link href={booking} className={styles.primary} onClick={()=>track('consultation_cta_click',{meta:{source:'pricing_section'}})}>Beratungstermin buchen <span aria-hidden="true">→</span></Link>
     <Link href={contact} className={styles.secondary} onClick={()=>track('contact_cta_click',{meta:{source:'pricing_section'}})}>Projektanfrage senden <span aria-hidden="true">↗</span></Link>
    </div></div>
   </div>
   <p className={styles.disclaimer}>Projektumfang, Leistungsgrenzen, laufende Kosten und ein individuelles Angebot werden im direkten Austausch geklärt.</p>
  </div>
 </section>;
}
