/**
 * 0006 — Rechnungswesen (Billing / Invoicing).
 *
 * Das Modul führt sein eigenes Schema, weil die betrieblichen Anforderungen
 * an eine Rechnung sich stark von denen an ein Ticket unterscheiden:
 *  - Rechnungsnummern werden atomar vergeben und dürfen keine Lücken haben.
 *  - Finalisierte Belege sind unveränderlich; die tatsächlich gestellten
 *    Werte werden als Snapshot mitgeschrieben, damit spätere Änderungen an
 *    Kunde, Projekt oder Aussteller die historische Rechnung nicht kippen.
 *  - Doppelte Abrechnung derselben Leistungsperiode wird per Datenbank
 *    verhindert, nicht nur durch UI-Prüfungen.
 *
 * Die Migration ist idempotent (`IF NOT EXISTS`) und respektiert bestehende
 * Kunden/Projekte — Fremdschlüssel deuten auf `crm_projects` und
 * `crm_organizations` mit `ON DELETE SET NULL`, sodass eine gelöschte
 * Projektzeile keine Rechnung mitreißt.
 */

import type { Migration } from "../migrationRunner";

/**
 * Ausgangsdaten für AGI Works. Bewusst NICHT die inkonsistenten Angaben aus
 * der bestehenden Rechnung Nr. 16 blind übernommen — die enthält im Header
 * PLZ 59425 und im Footer 59525, was der Referenz explizit als
 * Datenqualitätsproblem markiert. Wir bevorzugen die Kopfzeile (59425) und
 * hinterlegen den Konflikt als Konfigurationswarnung, damit ein Admin ihn
 * bewusst auflöst.
 */
const AGI_WORKS_ISSUER = {
  id: "issuer_agiworks",
  key: "agiworks",
  brand_label: "AGI Works",
  legal_name: "AGI Works",
  owner: "Kevin Blazevic",
  header_tagline: "Dienstleister im Bereich Marketing und Werbung",
  address: {
    line1: "Hansastraße 34",
    line2: null,
    postalCode: "59425",
    city: "Unna",
    country: "DE",
    countryLabel: "Deutschland",
  },
  contact: {
    email: "info@agiworks.de",
    phone: "+49 2303 3349877",
    mobile: "+49 176 23250935",
    website: "https://www.agiworks.de",
  },
  tax_number: "316/5024/3564",
  vat_id: null,
  tax_regime: "kleinunternehmer",
  small_business_note:
    "Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).",
  bank: {
    bankName: "Sparkasse UnnaKamen",
    iban: "DE26 4435 0060 1000 7538 79",
    bic: "WELADE1UNN",
  },
  default_currency: "EUR",
  default_payment_terms: 14,
  default_intro:
    "die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und Tools.",
  default_outro:
    "Wir bedanken uns für die Zusammenarbeit und stehen Ihnen bei weiteren Anliegen gerne zur Verfügung.",
  default_footer: "Mit freundlichen Grüßen",
  accent_color: "#1F6DD8",
  template_key: "agiworks_classic",
  number_format: "numeric",
  number_prefix: "",
  number_padding: 0,
  config_warnings: [
    "In der historischen Rechnung Nr. 16 stehen zwei unterschiedliche Postleitzahlen (59425/59525). Bitte einmalig prüfen und die Stammdaten hier verbindlich festlegen.",
  ] as string[],
};

const NEXCEL_AI_ISSUER = {
  id: "issuer_nexcel",
  key: "nexcel",
  brand_label: "NEXCEL AI",
  legal_name: "NEXCEL AI",
  owner: "Kevin Blazevic",
  header_tagline: "AI Systems & Software Engineering",
  address: {
    line1: "Hansastraße 34",
    line2: null,
    postalCode: "59425",
    city: "Unna",
    country: "DE",
    countryLabel: "Deutschland",
  },
  contact: {
    email: "info@nexcelai.de",
    phone: "+49 2303 3349877",
    mobile: "+49 176 23250935",
    website: "https://www.nexcelai.de",
  },
  tax_number: "316/5024/3564",
  vat_id: null,
  tax_regime: "kleinunternehmer",
  small_business_note:
    "Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).",
  bank: {
    bankName: "Sparkasse UnnaKamen",
    iban: "DE26 4435 0060 1000 7538 79",
    bic: "WELADE1UNN",
  },
  default_currency: "EUR",
  default_payment_terms: 14,
  default_intro:
    "vielen Dank für Ihr Vertrauen. Die folgenden Leistungen stellen wir Ihnen wie besprochen in Rechnung.",
  default_outro:
    "Wir freuen uns auf die weitere Zusammenarbeit und stehen für Rückfragen jederzeit zur Verfügung.",
  default_footer: "Mit freundlichen Grüßen",
  accent_color: "#8248FF",
  template_key: "agiworks_classic",
  number_format: "numeric",
  number_prefix: "",
  number_padding: 0,
  config_warnings: [
    "Für NEXCEL AI existiert noch keine dokumentierte Rechnungsnummernhistorie. Bitte gewünschte Startnummer bewusst konfigurieren.",
  ] as string[],
};

/**
 * Kundenstammdaten der historischen Rechnung 16. Wird nur angelegt, wenn er
 * nicht bereits in `crm_organizations` liegt — damit spielt die spätere
 * Verknüpfung dieses vorhandenen Kunden dennoch problemlos zusammen.
 */
const WEISSLEDER_CUSTOMER = {
  id: "cust_weissleder_immobilien",
  name: "Weissleder Immobilien",
  contact_person: null,
  address: {
    line1: "Schützenhof 1",
    line2: null,
    postalCode: "59423",
    city: "Unna",
    country: "DE",
    countryLabel: "Deutschland",
  },
  email: null,
  buyer_reference: null,
  vat_id: null,
  customer_number: null,
};

export const migration0006: Migration = {
  id: "0006",
  name: "billing",
  up: async (sql) => {
    /* ── Aussteller ──────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS billing_issuers (
        id                    TEXT PRIMARY KEY,
        key                   TEXT NOT NULL,
        brand_label           TEXT NOT NULL,
        legal_name            TEXT NOT NULL,
        owner                 TEXT NOT NULL,
        header_tagline        TEXT NOT NULL DEFAULT '',
        address               JSONB NOT NULL,
        contact               JSONB NOT NULL,
        tax_number            TEXT,
        vat_id                TEXT,
        tax_regime            TEXT NOT NULL DEFAULT 'kleinunternehmer',
        small_business_note   TEXT NOT NULL DEFAULT '',
        bank                  JSONB NOT NULL,
        default_currency      TEXT NOT NULL DEFAULT 'EUR',
        default_payment_terms INTEGER NOT NULL DEFAULT 14,
        default_intro         TEXT NOT NULL DEFAULT '',
        default_outro         TEXT NOT NULL DEFAULT '',
        default_footer        TEXT NOT NULL DEFAULT '',
        accent_color          TEXT NOT NULL DEFAULT '#1F6DD8',
        logo_path             TEXT,
        template_key          TEXT NOT NULL DEFAULT 'agiworks_classic',
        number_format         TEXT NOT NULL DEFAULT 'numeric',
        number_prefix         TEXT NOT NULL DEFAULT '',
        number_padding        INTEGER NOT NULL DEFAULT 0,
        active                BOOLEAN NOT NULL DEFAULT TRUE,
        config_warnings       JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_issuers_key ON billing_issuers (key)`;

    /* ── Rechnungsnummern-Sequenzen ─────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_sequences (
        issuer_id           TEXT NOT NULL REFERENCES billing_issuers(id) ON DELETE CASCADE,
        year                INTEGER NOT NULL DEFAULT 0,
        last_number         INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (issuer_id, year)
      )
    `;

    /* ── Kundenstamm ────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS billing_customers (
        id                TEXT PRIMARY KEY,
        org_id            TEXT REFERENCES crm_organizations(id) ON DELETE SET NULL,
        name              TEXT NOT NULL,
        contact_person    TEXT,
        address           JSONB NOT NULL,
        email             TEXT,
        buyer_reference   TEXT,
        leitweg_id        TEXT,
        vat_id            TEXT,
        customer_number   TEXT,
        created_by        TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by        TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_billing_customers_name ON billing_customers (lower(name))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_billing_customers_org ON billing_customers (org_id)`;

    /* ── Projekt-Rechnungsprofil ────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS project_billing_config (
        project_id             TEXT PRIMARY KEY REFERENCES crm_projects(id) ON DELETE CASCADE,
        issuer_id              TEXT REFERENCES billing_issuers(id) ON DELETE SET NULL,
        customer_id            TEXT REFERENCES billing_customers(id) ON DELETE SET NULL,
        billing_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
        billing_frequency      TEXT NOT NULL DEFAULT 'monthly',
        billing_day            INTEGER,
        billing_terms          INTEGER NOT NULL DEFAULT 14,
        default_currency       TEXT NOT NULL DEFAULT 'EUR',
        service_period_strategy TEXT NOT NULL DEFAULT 'previous_month',
        default_items          JSONB NOT NULL DEFAULT '[]'::jsonb,
        default_intro          TEXT,
        default_outro          TEXT,
        billing_order          INTEGER NOT NULL DEFAULT 0,
        last_billed_period_end DATE,
        next_billing_date      DATE,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_project_billing_order
      ON project_billing_config (billing_order ASC)
    `;

    /* ── Rechnungen ─────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id                    TEXT PRIMARY KEY,
        status                TEXT NOT NULL DEFAULT 'draft',
        type                  TEXT NOT NULL DEFAULT 'invoice',

        issuer_id             TEXT NOT NULL REFERENCES billing_issuers(id) ON DELETE RESTRICT,
        customer_id           TEXT REFERENCES billing_customers(id) ON DELETE SET NULL,
        project_id            TEXT REFERENCES crm_projects(id) ON DELETE SET NULL,

        /* Nummer ist bei Draft NULL, wird erst bei der Finalisierung
           atomar vergeben. Das Unique-Index ist partiell — sonst könnten
           mehrere Drafts nebeneinander nicht existieren. */
        invoice_number        TEXT,
        numeric_number        INTEGER,
        sequence_year         INTEGER,

        invoice_date          DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date              DATE NOT NULL DEFAULT CURRENT_DATE,
        service_period_start  DATE NOT NULL DEFAULT CURRENT_DATE,
        service_period_end    DATE NOT NULL DEFAULT CURRENT_DATE,
        service_period_label  TEXT NOT NULL DEFAULT '',

        currency              TEXT NOT NULL DEFAULT 'EUR',
        payment_terms_days    INTEGER NOT NULL DEFAULT 14,

        totals_net_cents      BIGINT NOT NULL DEFAULT 0,
        totals_tax_cents      BIGINT NOT NULL DEFAULT 0,
        totals_gross_cents    BIGINT NOT NULL DEFAULT 0,
        tax_breakdown         JSONB NOT NULL DEFAULT '[]'::jsonb,

        salutation            TEXT NOT NULL DEFAULT '',
        intro_text            TEXT NOT NULL DEFAULT '',
        outro_text            TEXT NOT NULL DEFAULT '',
        customer_note         TEXT NOT NULL DEFAULT '',
        internal_note         TEXT NOT NULL DEFAULT '',
        small_business_note   TEXT NOT NULL DEFAULT '',

        buyer_reference       TEXT,
        leitweg_id            TEXT,
        purchase_order        TEXT,
        original_invoice_id   TEXT REFERENCES invoices(id) ON DELETE SET NULL,
        original_invoice_number TEXT,
        correction_reason     TEXT,

        template_key          TEXT NOT NULL DEFAULT 'agiworks_classic',
        payment_status        TEXT NOT NULL DEFAULT 'open',
        paid_at               TIMESTAMPTZ,
        payment_reference     TEXT,

        sent_at               TIMESTAMPTZ,
        sent_recipient        TEXT,
        sent_message_id       TEXT,

        /* Bearbeitet-Sperre: verhindert zwei parallele Editoren, die sich
           gegenseitig überschreiben. */
        version               INTEGER NOT NULL DEFAULT 0,
        finalized_at          TIMESTAMPTZ,
        cancelled_at          TIMESTAMPTZ,

        /* Immutable Snapshots — beim Finalisieren gesetzt, danach nie
           mehr angefasst. Live-Referenzen dienen nur der Anzeige und
           spielen für den Wertevergleich mit PDF/XML keine Rolle. */
        issuer_snapshot       JSONB,
        customer_snapshot     JSONB,
        project_snapshot      JSONB,
        payment_snapshot      JSONB,

        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_per_issuer
      ON invoices (issuer_id, invoice_number)
      WHERE invoice_number IS NOT NULL
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices (customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices (project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices (invoice_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices (due_date)`;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_service_period
      ON invoices (project_id, service_period_start, service_period_end)
    `;
    /* Duplikatschutz für Folgerechnungen: pro Aussteller, Projekt und
       Leistungszeitraum darf nur ein finalisierter Beleg desselben Typs
       existieren. */
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_period_unique
      ON invoices (issuer_id, project_id, type, service_period_start, service_period_end)
      WHERE project_id IS NOT NULL
        AND status IN ('finalized','sent','paid','partially_paid','overdue')
    `;

    /* ── Positionen ─────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id                    TEXT PRIMARY KEY,
        invoice_id            TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        position              INTEGER NOT NULL,
        title                 TEXT NOT NULL,
        description           TEXT NOT NULL DEFAULT '',
        quantity_milli        BIGINT NOT NULL DEFAULT 1000,
        unit                  TEXT NOT NULL DEFAULT 'Stk.',
        unit_price_cents      BIGINT NOT NULL DEFAULT 0,
        discount_percent_milli INTEGER NOT NULL DEFAULT 0,
        tax_category          TEXT NOT NULL DEFAULT 'S',
        tax_rate_percent_milli INTEGER NOT NULL DEFAULT 19000,
        line_net_cents        BIGINT NOT NULL DEFAULT 0,
        line_tax_cents        BIGINT NOT NULL DEFAULT 0,
        line_gross_cents      BIGINT NOT NULL DEFAULT 0,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_items_position
      ON invoice_items (invoice_id, position)
    `;

    /* ── Dokumente ──────────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_documents (
        id                    TEXT PRIMARY KEY,
        invoice_id            TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        kind                  TEXT NOT NULL,
        mime_type             TEXT NOT NULL,
        filename              TEXT NOT NULL,
        byte_size             INTEGER NOT NULL DEFAULT 0,
        sha256                TEXT NOT NULL,
        generator             TEXT NOT NULL,
        generator_version     TEXT NOT NULL,
        spec_version          TEXT,
        template_version      TEXT,
        validation_status     TEXT NOT NULL DEFAULT 'unchecked',
        validation_report     JSONB NOT NULL DEFAULT '{}'::jsonb,
        content               BYTEA NOT NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoice_documents_invoice ON invoice_documents (invoice_id, kind)`;

    /* ── Ereignisverlauf ────────────────────────────────────────── */
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_events (
        id                    TEXT PRIMARY KEY,
        invoice_id            TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        action                TEXT NOT NULL,
        actor_id              TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        actor_email           TEXT NOT NULL,
        payload               JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice ON invoice_events (invoice_id, created_at DESC)`;

    /* ── Aussteller einspielen ──────────────────────────────────── */
    for (const iss of [AGI_WORKS_ISSUER, NEXCEL_AI_ISSUER]) {
      await sql`
        INSERT INTO billing_issuers (
          id, key, brand_label, legal_name, owner, header_tagline,
          address, contact, tax_number, vat_id, tax_regime,
          small_business_note, bank, default_currency, default_payment_terms,
          default_intro, default_outro, default_footer,
          accent_color, template_key, number_format, number_prefix, number_padding,
          config_warnings
        ) VALUES (
          ${iss.id}, ${iss.key}, ${iss.brand_label}, ${iss.legal_name},
          ${iss.owner}, ${iss.header_tagline},
          ${JSON.stringify(iss.address)}::jsonb,
          ${JSON.stringify(iss.contact)}::jsonb,
          ${iss.tax_number}, ${iss.vat_id}, ${iss.tax_regime},
          ${iss.small_business_note},
          ${JSON.stringify(iss.bank)}::jsonb,
          ${iss.default_currency}, ${iss.default_payment_terms},
          ${iss.default_intro}, ${iss.default_outro}, ${iss.default_footer},
          ${iss.accent_color}, ${iss.template_key}, ${iss.number_format},
          ${iss.number_prefix}, ${iss.number_padding},
          ${JSON.stringify(iss.config_warnings)}::jsonb
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    /* ── Sequenzstand für AGI Works: letzte finalisierte Nummer 16 ─
       Damit ist die nächste vergebene Nummer 17. Für NEXCEL AI wird
       keine Startzahl geraten — die 0 zeigt der Admin und macht die
       Konfiguration nötig. */
    await sql`
      INSERT INTO invoice_sequences (issuer_id, year, last_number)
      VALUES ('issuer_agiworks', 0, 16)
      ON CONFLICT (issuer_id, year) DO NOTHING
    `;
    await sql`
      INSERT INTO invoice_sequences (issuer_id, year, last_number)
      VALUES ('issuer_nexcel', 0, 0)
      ON CONFLICT (issuer_id, year) DO NOTHING
    `;

    /* ── Kunde Weissleder Immobilien ─────────────────────────────── */
    await sql`
      INSERT INTO billing_customers (
        id, name, contact_person, address, email, buyer_reference,
        vat_id, customer_number
      ) VALUES (
        ${WEISSLEDER_CUSTOMER.id}, ${WEISSLEDER_CUSTOMER.name},
        ${WEISSLEDER_CUSTOMER.contact_person},
        ${JSON.stringify(WEISSLEDER_CUSTOMER.address)}::jsonb,
        ${WEISSLEDER_CUSTOMER.email}, ${WEISSLEDER_CUSTOMER.buyer_reference},
        ${WEISSLEDER_CUSTOMER.vat_id}, ${WEISSLEDER_CUSTOMER.customer_number}
      )
      ON CONFLICT (id) DO NOTHING
    `;

    /* ── Projekt-Billing-Konfiguration: einmal für Weissleder ─────
       Das Projekt existiert bereits (Seed aus 0005). Wir verknüpfen es
       mit dem Kunden und definieren die monatliche Betriebs- und
       Sicherungspauschale als Vorlage. */
    await sql`
      INSERT INTO project_billing_config (
        project_id, issuer_id, customer_id, billing_enabled,
        billing_frequency, billing_terms, default_currency,
        service_period_strategy, default_items,
        default_intro, default_outro, billing_order
      )
      SELECT
        p.id, 'issuer_agiworks', 'cust_weissleder_immobilien', TRUE,
        'monthly', 14, 'EUR', 'previous_month',
        ${JSON.stringify([
          {
            title:
              'Monatliche Betriebs- und Sicherungspauschale für „Weissleder Immobilien"',
            description:
              "Serverbetrieb, technische Bereitstellung, regelmäßige Backups, Datensicherung und Systemerhalt für den laufenden Website- und Admin-Panel-Betrieb.",
            quantityMilli: 1000,
            unit: "Monat",
            unitPriceCents: 2900,
            discountPercentMilli: 0,
            taxCategory: "E",
            taxRatePercentMilli: 0,
          },
        ])}::jsonb,
        'die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und Tools.',
        'Wir bedanken uns für die Zusammenarbeit und stehen Ihnen bei weiteren Anliegen gerne zur Verfügung.',
        10
      FROM crm_projects p
      WHERE p.slug = 'immobilien-weissleder'
      ON CONFLICT (project_id) DO NOTHING
    `;

    /* ── Historischer Vorgänger: Rechnung Nr. 16 als importierte Basis ─
       Zeigt in Liste und Verlauf, dass es diese Nummer bereits gibt.
       Belegdaten stammen aus dem Referenz-PDF; die Datei selbst wird
       nicht neu gerendert, sondern als importierter Bestand hinterlegt. */
    await sql`
      INSERT INTO invoices (
        id, status, type, issuer_id, customer_id,
        invoice_number, numeric_number, sequence_year,
        invoice_date, due_date,
        service_period_start, service_period_end, service_period_label,
        currency, payment_terms_days,
        totals_net_cents, totals_tax_cents, totals_gross_cents, tax_breakdown,
        intro_text, outro_text, small_business_note,
        template_key, finalized_at,
        issuer_snapshot, customer_snapshot, project_snapshot, payment_snapshot,
        version
      )
      SELECT
        'inv_historical_16', 'finalized', 'invoice', 'issuer_agiworks',
        'cust_weissleder_immobilien',
        '16', 16, 0,
        DATE '2026-07-27', DATE '2026-08-10',
        DATE '2026-07-01', DATE '2026-07-31', 'Juli 2026',
        'EUR', 14,
        2900, 0, 2900,
        ${JSON.stringify([
          { category: "E", ratePercentMilli: 0, baseCents: 2900, taxCents: 0, exemptionReason: "Steuerbefreit gemäß § 19 Abs. 1 UStG (Kleinunternehmer)." },
        ])}::jsonb,
        'die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und Tools.',
        'Wir bedanken uns für die Zusammenarbeit und stehen Ihnen bei weiteren Anliegen gerne zur Verfügung.',
        'Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.',
        'agiworks_classic', TIMESTAMPTZ '2026-07-27 09:00:00+00',
        (SELECT to_jsonb(i) - 'created_at' - 'updated_at' FROM billing_issuers i WHERE id = 'issuer_agiworks'),
        (SELECT to_jsonb(c) - 'created_at' - 'updated_at' FROM billing_customers c WHERE id = 'cust_weissleder_immobilien'),
        NULL,
        ${JSON.stringify({
          bank: {
            bankName: "Sparkasse UnnaKamen",
            iban: "DE26 4435 0060 1000 7538 79",
            bic: "WELADE1UNN",
          },
          paymentTermsDays: 14,
        })}::jsonb,
        0
      WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE id = 'inv_historical_16')
    `;

    await sql`
      INSERT INTO invoice_items (
        id, invoice_id, position, title, description,
        quantity_milli, unit, unit_price_cents,
        discount_percent_milli, tax_category, tax_rate_percent_milli,
        line_net_cents, line_tax_cents, line_gross_cents
      )
      SELECT
        'itm_historical_16_1', 'inv_historical_16', 1,
        'Monatliche Betriebs- und Sicherungspauschale für „Weissleder Immobilien" – Leistungszeitraum Juli 2026',
        'Serverbetrieb, technische Bereitstellung, regelmäßige Backups, Datensicherung und Systemerhalt für den laufenden Website- und Admin-Panel-Betrieb.',
        1000, 'Monat', 2900,
        0, 'E', 0,
        2900, 0, 2900
      WHERE NOT EXISTS (SELECT 1 FROM invoice_items WHERE id = 'itm_historical_16_1')
    `;

    await sql`
      INSERT INTO invoice_events (id, invoice_id, action, actor_email, payload)
      SELECT
        'evt_historical_16_import', 'inv_historical_16',
        'invoice.imported_historical', 'system',
        ${JSON.stringify({ note: "Historischer Vorgänger aus Rechnung Nr. 16.pdf." })}::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM invoice_events WHERE id = 'evt_historical_16_import')
    `;
  },
};
