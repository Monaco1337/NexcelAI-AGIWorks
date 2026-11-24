import Link from "@/components/BrandAwareLink";
import styles from "./NexcelTaskClusters.module.css";

type Cluster = {
  heading: string;
  summary: string;
  links: { href: string; label: string }[];
};

type Props = { clusters: readonly Cluster[] };

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.arrowIcon}
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

/**
 * NEXCEL-only curated service map for /loesungen.
 * Link targets, cluster headings and descriptions remain from the V11 SEO registry.
 */
export default function NexcelTaskClusters({ clusters }: Props) {
  return (
    <section
      data-nexcel-premium-tasks="v11"
      className={styles.root}
      aria-labelledby="nexcel-task-clusters-title"
    >
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div className={styles.eyebrow}><span className={styles.pin} aria-hidden="true" />NEXCEL AI / THEMENCLUSTER</div>
          <h2 id="nexcel-task-clusters-title" className={styles.heading}>
            {"KI-L\u00f6sungen"} <span>{"nach Gesch\u00e4ftsaufgabe."}</span>
          </h2>
          <p className={styles.intro}>
            Entscheidend sind der Prozess, der Datenzugriff und die erforderliche menschliche Kontrolle.
          </p>
        </header>

        <div className={styles.grid}>
          {clusters.map((cluster, index) => (
            <article
              key={cluster.heading}
              className={`${styles.card} ${index === 0 ? styles.featured : ""}`}
            >
              <div aria-hidden="true" className={styles.topLight} />
              <div className={styles.cardHeader}>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.overline}>LEISTUNGSFELD</span>
              </div>
              <h3 className={styles.cardTitle}>{cluster.heading}</h3>
              <p className={styles.description}>{cluster.summary}</p>
              <nav className={styles.linkList} aria-label={`Themen in ${cluster.heading}`}>
                {cluster.links.map((link) => (
                  <Link className={styles.link} href={link.href} key={link.href}>
                    <span>{link.label}</span>
                    <ArrowIcon />
                  </Link>
                ))}
              </nav>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
