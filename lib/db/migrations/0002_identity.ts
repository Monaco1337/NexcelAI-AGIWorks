/**
 * 0002 — Identität: Organisationen und Nutzer in Postgres.
 *
 * Bisher existierten Nutzer ausschließlich in `data/demo-users.json` und in der
 * Env-Variable `ADMIN_USERS`. Für Tickets reicht das nicht: Zuweisungen,
 * Genehmiger, Beobachter und Kommentarautoren brauchen referenzierbare
 * Datensätze mit Fremdschlüsseln.
 *
 * Die Authentifizierung bleibt bewusst unverändert. `crm_users` ist ein
 * Spiegel, der bei jedem Login aktualisiert wird (siehe lib/identity/userSync.ts).
 * Damit entsteht kein Risiko für den laufenden Produktions-Login.
 *
 * `crm_organizations` wird jetzt angelegt, obwohl das Ticketsystem zunächst
 * rein intern läuft. Nachträglich Mandantenfähigkeit einzuziehen würde
 * bedeuten, jede Ticket-Zeile neu zuzuordnen — die leere Spalte kostet heute
 * nichts und erspart später eine Datenmigration.
 */

import type { Migration } from "../migrationRunner";

export const migration0002: Migration = {
  id: "0002",
  name: "identity_orgs_and_users",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS crm_organizations (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        brand       TEXT NOT NULL DEFAULT 'nexcel',
        /* E-Mail-Domain zur automatischen Zuordnung neuer Nutzer, z. B. "kunde.de". */
        email_domain TEXT,
        /* Die beiden eigenen Einzelunternehmen sind interne Organisationen;
           Kundenorganisationen sind es nicht. Steuert später die Sichtbarkeit
           im Kundenportal. */
        is_internal BOOLEAN NOT NULL DEFAULT FALSE,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        notes       TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_org_email_domain
      ON crm_organizations (lower(email_domain))
      WHERE email_domain IS NOT NULL
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS crm_users (
        id            TEXT PRIMARY KEY,
        email         TEXT NOT NULL,
        name          TEXT NOT NULL DEFAULT '',
        /* owner | admin | agent | requester | viewer — siehe lib/auth/roles.ts */
        role          TEXT NOT NULL DEFAULT 'viewer',
        brand         TEXT,
        org_id        TEXT REFERENCES crm_organizations(id) ON DELETE SET NULL,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        /* Herkunft der Identität: "env" (ADMIN_USERS), "file" (demo-users.json)
           oder "db" (später im Admin angelegt). Macht nachvollziehbar, welche
           Quelle einen Datensatz zuletzt geschrieben hat. */
        source        TEXT NOT NULL DEFAULT 'file',
        last_login_at TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    /* E-Mails werden immer kleingeschrieben verglichen — sonst entstehen beim
       Login-Spiegeln Dubletten wie "Info@" und "info@". */
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_users_email
      ON crm_users (lower(email))
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_crm_users_org
      ON crm_users (org_id) WHERE org_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_crm_users_active_role
      ON crm_users (role) WHERE is_active
    `;
  },
};
