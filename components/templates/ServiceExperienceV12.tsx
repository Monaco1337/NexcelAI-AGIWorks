import type { MoneyPage } from "@/data/moneyPages";

/** Decorative SVGs, no icon library or client-side JavaScript required. */
export function ServiceGlyph({ index }: { index: number }) {
  const shape = index % 6;
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      {shape === 0 && <><path d="M20 4 34 12v16L20 36 6 28V12Z"/><path d="m6 12 14 8 14-8M20 20v16M13 16l14-8"/></>}
      {shape === 1 && <><ellipse cx="20" cy="10" rx="12" ry="5"/><path d="M8 10v20c0 3 5 5 12 5s12-2 12-5V10M8 17c0 3 5 5 12 5s12-2 12-5M8 24c0 3 5 5 12 5s12-2 12-5"/></>}
      {shape === 2 && <><path d="m14 11-9 9 9 9M26 11l9 9-9 9M23 7l-6 26"/></>}
      {shape === 3 && <><path d="M16 14h8v8h-8zM20 4v10M20 22v14M4 18h12M24 18h12"/><circle cx="20" cy="4" r="2"/><circle cx="20" cy="36" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="36" cy="18" r="2"/></>}
      {shape === 4 && <><path d="M20 4 33 9v10c0 9-6 14-13 17C13 33 7 28 7 19V9zM13 20l5 5 10-11"/></>}
      {shape === 5 && <><rect x="6" y="6" width="28" height="8" rx="2"/><rect x="6" y="17" width="28" height="8" rx="2"/><rect x="6" y="28" width="28" height="8" rx="2"/><path d="M11 10h1M11 21h1M11 32h1M18 10h11M18 21h11M18 32h11"/></>}
    </svg>
  );
}

export default function ServiceExperienceV12({ page }: { page: MoneyPage }) {
  const scope = `v12-${page.brand}-${page.slug}`;
  return (
    <div className="v12-experience" data-v12-brand={page.brand}>
      <section id="umfang" className="v12-modules-section" aria-labelledby={`${scope}-modules`}>
        <div className="v12-shell">
          <p className="v12-kicker">DER FUNKTIONSUMFANG / {page.serviceName}</p>
          <div className="v12-module-intro">
            <h2 id={`${scope}-modules`}>Alles greift <span>ineinander.</span></h2>
            <p>{page.brand === "nexcel" ? page.solutionIntro : "Ein System, klare Schnittstellen: Die konkreten Bausteine richten sich nach Ihrem Vorhaben, nicht nach einem starren Paket."}</p>
          </div>
          <div className="v12-system-stage">
            <div className="v12-core-scene" aria-hidden="true">
              <span className="v12-core-orbit v12-orbit-one"/><span className="v12-core-orbit v12-orbit-two"/>
              <span className="v12-core-beam v12-beam-left"/><span className="v12-core-beam v12-beam-right"/>
              <div className="v12-core-stack"><span/><span/><span/></div>
              <span className="v12-core-floor"/>
            </div>
            <ol className="v12-module-grid">
              {page.modules.map((module, index) => (
                <li key={`${index}-${module.title}`} className="v12-module">
                  <div className="v12-module-symbol"><ServiceGlyph index={index}/></div>
                  <div className="v12-module-copy">
                    <span className="v12-module-index">{String(index + 1).padStart(2, "0")}</span>
                    <h3>{module.title}</h3>
                    {module.description && <p>{module.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <section className="v12-method-section" aria-labelledby={`${scope}-method`}>
        <div className="v12-method-art" aria-hidden="true" />
        <div className="v12-shell v12-method-layout">
          <div className="v12-method-message">
            <p className="v12-kicker">UNSER ANSATZ</p>
            <h2 id={`${scope}-method`}>Für Ihre Realität.<br/><span>Nicht für eine Demo.</span></h2>
            <p>Technisch fundiert, auf Ihre Arbeitsabläufe ausgerichtet und nachvollziehbar umgesetzt.</p>
          </div>
          <ol className="v12-method-list">
            {page.approach.map((item, index) => <li key={`${index}-${item}`}>
              <span className="v12-method-icon"><ServiceGlyph index={index}/></span>
              <span className="v12-method-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="v12-method-text">{item}</span>
            </li>)}
          </ol>
        </div>
      </section>
      <section className="v12-process-section" aria-labelledby={`${scope}-process`}>
        <div className="v12-shell">
          <p className="v12-kicker">VON DER IDEE ZUM BETRIEB</p>
          <h2 id={`${scope}-process`}>So läuft Ihr <span>Projekt.</span></h2>
          <ol className="v12-process-track">
            {page.process.map((step, index) => <li key={`${index}-${step.title}`}>
              <div className="v12-process-node" aria-hidden="true"><ServiceGlyph index={index}/></div>
              <span className="v12-process-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>)}
          </ol>
        </div>
      </section>
    </div>
  );
}
