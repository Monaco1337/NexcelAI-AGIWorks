/**
 * 0005 — Projekte und ihre Verbindung zu Tickets.
 *
 * Jedes Ticket gehört zu einem Projekt. Ohne diesen Bezug wäre die Liste bei
 * vierzehn parallel laufenden Kundenprojekten nicht mehr sortierbar: "Formular
 * kaputt" ist erst dann eine verwertbare Meldung, wenn dabeisteht, auf welcher
 * Website.
 *
 * Der Bezug ist optional (ON DELETE SET NULL). Interne Aufgaben ohne
 * Projektbezug müssen möglich bleiben, und ein gelöschtes Projekt darf nicht
 * seine gesamte Ticketgeschichte mitreißen.
 *
 * Der Bestand wird hier eingespielt, weil es sich um real existierende
 * Projekte handelt, nicht um Beispieldaten. ON CONFLICT DO NOTHING macht den
 * Schritt wiederholbar und überschreibt keine späteren Änderungen.
 */

import type { Migration } from "../migrationRunner";

/**
 * Stand der tatsächlich betriebenen Projekte.
 *
 * `slug` entspricht dem Vercel-Projektnamen und ist der Abgleichsschlüssel.
 * `name` ist die lesbare Fassung — bei "lokf-hrerzentrum" hat Vercel die
 * Umlaute verschluckt, der Betreiber heißt Lokführerzentrum.
 *
 * Wo kein Repository bekannt ist, bleibt das Feld leer statt geraten.
 */
const SEED: {
  slug: string;
  name: string;
  url: string | null;
  repo: string | null;
  brand: string | null;
  color: string;
}[] = [
  { slug: "nexcel-ai", name: "NEXCEL AI & AGI Works", url: "https://www.nexcelai.de", repo: "Monaco1337/NexcelAI-AGIWorks", brand: "nexcel", color: "#A45CFF" },
  { slug: "beauty-bar", name: "Beauty Bar Unna", url: "https://www.beautybar-unna.de", repo: "1Miooo/BeautyBar", brand: null, color: "#F472B6" },
  { slug: "impuls-pflege", name: "Impuls Pflege Unna", url: "https://www.impuls-unna.de", repo: "Monaco1337/Impuls-Pflege", brand: null, color: "#22C55E" },
  { slug: "agienergy", name: "AGI Energy", url: "https://www.agienergy.de", repo: "Monaco1337/AGI-Energy", brand: null, color: "#5BB8FF" },
  { slug: "lokf-hrerzentrum", name: "Lokführerzentrum", url: "https://lokf-hrerzentrum.vercel.app", repo: "Monaco1337/Lokf-hrerzentrum", brand: null, color: "#FB923C" },
  { slug: "lulusbeauty", name: "Lulus Beauty", url: "https://www.lulusbeauty.de", repo: "1Miooo/Lulusbeauty", brand: null, color: "#FBBF24" },
  { slug: "borne-run", name: "Borne Run", url: "https://www.borne-run.de", repo: "Monaco1337/borne-run", brand: null, color: "#EF4444" },
  { slug: "cannabbros-csc", name: "CannaBBros CSC", url: "https://cannabbros-csc.vercel.app", repo: "Monaco1337/CannaBBros", brand: null, color: "#84CC16" },
  { slug: "canna-b-bros", name: "CannaBBros", url: "https://www.cannabbros-csc.de", repo: "Monaco1337/CannaBBros", brand: null, color: "#65A30D" },
  { slug: "pflegenest-bochum", name: "Pflegenest Bochum", url: "https://www.pflegenest-bochum.de", repo: null, brand: null, color: "#14B8A6" },
  { slug: "agi-energy-web", name: "AGI Energy Web", url: "https://agi-energy-web.vercel.app", repo: null, brand: null, color: "#38BDF8" },
  { slug: "anatoly-mook", name: "Anatoly Mook", url: "https://www.anatoly-mook.de", repo: "Monaco1337/AnatolyMook", brand: null, color: "#8B7CFF" },
  { slug: "immobilien-weissleder", name: "Immobilien Weissleder", url: "https://www.weissleder-immobilien.de", repo: "Monaco1337/ImmobilienWeissleder", brand: null, color: "#D97706" },
  { slug: "immocloud-dashboard", name: "ImmoCloud Dashboard", url: "https://immostripe-ai.de", repo: "1Miooo/immocloud-dashboard", brand: null, color: "#6366F1" },
];

export const migration0005: Migration = {
  id: "0005",
  name: "projects",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS crm_projects (
        id             TEXT PRIMARY KEY,
        /* Entspricht dem Vercel-Projektnamen. */
        slug           TEXT NOT NULL,
        name           TEXT NOT NULL,
        description    TEXT NOT NULL DEFAULT '',
        production_url TEXT,
        repo           TEXT,
        /* nexcel | agiworks | NULL für Kundenprojekte. */
        brand          TEXT,
        /* Akzentfarbe der Kachel in der Übersicht. */
        color          TEXT NOT NULL DEFAULT '#A45CFF',
        /* active | paused | archived */
        status         TEXT NOT NULL DEFAULT 'active',
        org_id         TEXT REFERENCES crm_organizations(id) ON DELETE SET NULL,
        sort_order     INTEGER NOT NULL DEFAULT 0,

        deleted_at     TIMESTAMPTZ,
        created_by     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by     TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_projects_slug ON crm_projects (slug)`;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_crm_projects_order
      ON crm_projects (sort_order ASC, name ASC) WHERE deleted_at IS NULL
    `;

    /* Ticketbezug. Ohne Index würde jede Projektansicht die gesamte
       Tickettabelle durchsuchen. */
    await sql`
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES crm_projects(id) ON DELETE SET NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_project
      ON tickets (project_id, created_at DESC)
      WHERE deleted_at IS NULL AND project_id IS NOT NULL
    `;
    /* Deckt die Zählung offener Tickets je Projekt ab. */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tickets_project_open
      ON tickets (project_id, status)
      WHERE deleted_at IS NULL AND archived_at IS NULL
    `;

    /* Bestand einspielen. */
    let order = 0;
    for (const p of SEED) {
      order += 10;
      await sql`
        INSERT INTO crm_projects (id, slug, name, production_url, repo, brand, color, sort_order)
        VALUES (
          ${`prj_${p.slug}`}, ${p.slug}, ${p.name}, ${p.url}, ${p.repo},
          ${p.brand}, ${p.color}, ${order}
        )
        ON CONFLICT (slug) DO NOTHING
      `;
    }
  },
};
