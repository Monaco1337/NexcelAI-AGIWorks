import Link from "@/components/BrandAwareLink";
import styles from "./NexcelSolutionsCatalog.module.css";

type Item = { href: string; title: string; description?: string };
type Props = { items: readonly Item[] };

/*
 * NEXCEL_SOLUTIONS_CATALOG_V11_APPROVAL_PREVIEW
 * Route-only design for /loesungen. All targets come from the money-page registry.
 * Never change /agiworks/leistungen or the shared catalog for other routes.
 */
const EDITORIAL_COPY: Record<string, string> = {
  "/loesungen/ki-systeme":
    "KI-Systeme entlang Ihrer realen Abl\u00e4ufe planen und kontrolliert in bestehende Prozesse integrieren.",
  "/loesungen/ki-agenten":
    "KI-Agenten mit definierten Werkzeugen, klaren Freigaben und nachvollziehbarer Kontrolle.",
  "/loesungen/automatisierung":
    "Wiederkehrende Arbeitsschritte verbinden, absichern und zuverl\u00e4ssig automatisieren.",
  "/loesungen/digitale-betriebssysteme":
    "Prozesse, Daten und Kommunikation zu einem durchg\u00e4ngigen System verbinden.",
  "/loesungen/lead-automation":
    "Leads qualifizieren, priorisieren und systematisch an den Vertrieb \u00fcbergeben.",
  "/loesungen/customer-experience-systeme":
    "Kundenkontakte, Services und Kommunikation konsequent aufeinander abstimmen.",
  "/loesungen/crm-automation":
    "CRM-Prozesse von der Erfassung bis zur Datenpflege sinnvoll automatisieren.",
  "/loesungen/email-automation":
    "Relevante E-Mails zu klar definierten Anl\u00e4ssen automatisiert versenden.",
  "/loesungen/whatsapp-automation":
    "Einwilligungsbasierte WhatsApp-Abl\u00e4ufe f\u00fcr Service und Kommunikation gestalten.",
  "/loesungen/ki-fuer-vertrieb":
    "Vertriebsteams bei Priorisierung, Vorbereitung und Datenpflege unterst\u00fctzen.",
};

function summary(item: Item): string {
  return EDITORIAL_COPY[item.href] ?? item.description ?? "Lernen Sie unsere passende L\u00f6sung kennen.";
}

function Arrow() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
        <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function NexcelSolutionsCatalog({ items }: Props) {
  const featured = items.find((item) => item.href === "/loesungen/ki-systeme") ?? items[0];
  const preferred = ["/loesungen/ki-agenten", "/loesungen/automatisierung"];
  const adjacent = preferred
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is Item => Boolean(item) && item?.href !== featured?.href);
  const secondary = adjacent.concat(
    items.filter((item) => item.href !== featured?.href && !adjacent.some((entry) => entry.href === item.href))
  ).slice(0, 2);
  const selected = new Set([featured?.href, ...secondary.map((item) => item.href)]);
  const more = items.filter((item) => !selected.has(item.href));

  return (
    <section id="nexcel-solutions-catalog" className={styles.section} aria-labelledby="nexcel-solutions-heading">
      <div className={styles.frame}>
        <div className={styles.headingRow}>
          <div>
            <p className={styles.kicker}>NEXCEL AI / L&Ouml;SUNGEN</p>
            <h2 id="nexcel-solutions-heading" className={styles.heading}>
              Alle L&ouml;sungen <span>im &Uuml;berblick.</span>
            </h2>
          </div>
          <p className={styles.headingAside}>
            Von intelligenten KI-Systemen bis zur Automatisierung: die passende L&ouml;sung f&uuml;r Ihre Prozesse.
          </p>
        </div>

        {featured && (
          <div className={styles.focusGrid}>
            <Link href={featured.href} className={styles.featureCard}>
              <span className={styles.featureKicker}>01 / KI-SYSTEME</span>
              <div className={styles.featureBody}>
                <p className={styles.featureEyebrow}>INDIVIDUELLE KI-L&Ouml;SUNGEN</p>
                <h3 className={styles.featureHeading}>KI, die zu Ihren Prozessen passt.</h3>
                <p className={styles.featureCopy}>{summary(featured)}</p>
              </div>
              <span className={styles.featureFoot}><span>{featured.title} entdecken</span><Arrow /></span>
            </Link>

            <div className={styles.featureStack}>
              {secondary.map((item, index) => (
                <Link href={item.href} className={styles.secondaryCard} key={item.href}>
                  <span className={styles.cardIndex}>{String(index + 2).padStart(2, "0")} / SCHWERPUNKT</span>
                  <div>
                    <h3 className={styles.secondaryHeading}>{item.title}</h3>
                    <p className={styles.secondaryCopy}>{summary(item)}</p>
                  </div>
                  <span className={styles.smallFoot}><span>L&ouml;sung ansehen</span><Arrow /></span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {more.length > 0 && (
          <div className={styles.moreSection}>
            <div className={styles.moreHeader}>
              <p className={styles.kicker}>WEITERE L&Ouml;SUNGEN</p>
              <h3>Alles, was Ihre Abl&auml;ufe voranbringt.</h3>
            </div>
            <div className={styles.moreGrid}>
              {more.map((item, index) => (
                <Link href={item.href} className={styles.moreCard} key={item.href}>
                  <div className={styles.moreContent}>
                    <span className={styles.cardIndex}>{String(index + 4).padStart(2, "0")}</span>
                    <h4>{item.title}</h4>
                    <p>{summary(item)}</p>
                  </div>
                  <span className={styles.moreFoot}><span>Mehr erfahren</span><Arrow /></span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
