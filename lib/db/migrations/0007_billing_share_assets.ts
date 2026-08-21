/**
 * 0007 — Share-Links, Asset-Storage und Snapshot-Bereinigung.
 *
 *  * `billing_assets` speichert Logo-Uploads binär in der Datenbank. Für
 *    unser Volumen (2 Marken × 1 Logo) ist das die einfachste Lösung mit
 *    stabilen Backups und ohne Storage-Provider-Abhängigkeit.
 *  * `invoice_share_tokens` gibt Kunden einen tokenbasierten, öffentlichen
 *    Zugriff auf ihre Rechnung. Der Server prüft nur den Token — kein
 *    Login nötig. Tokens sind einzeln widerrufbar.
 *  * Der historische Snapshot der Rechnung Nr. 16 wurde initial mit
 *    `to_jsonb(billing_issuers_row)` gefüllt und lag deshalb im Snake-Case
 *    vor. Für ältere Datensätze normalisieren wir das hier idempotent, damit
 *    die Live-Vorschau nicht mehr an fehlenden Feldern scheitert.
 */

import type { Migration } from "../migrationRunner";

export const migration0007: Migration = {
  id: "0007",
  name: "billing_share_assets",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS billing_assets (
        id          TEXT PRIMARY KEY,
        mime_type   TEXT NOT NULL,
        byte_size   INTEGER NOT NULL,
        sha256      TEXT NOT NULL,
        content     BYTEA NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS invoice_share_tokens (
        token           TEXT PRIMARY KEY,
        invoice_id      TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        created_by      TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at      TIMESTAMPTZ,
        revoked_at      TIMESTAMPTZ,
        allow_downloads BOOLEAN NOT NULL DEFAULT TRUE,
        last_accessed_at TIMESTAMPTZ,
        access_count    INTEGER NOT NULL DEFAULT 0,
        recipient_hint  TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoice_share_tokens_invoice ON invoice_share_tokens (invoice_id)`;

    /* Historischen Snapshot normalisieren (idempotent). Wir bauen den
       Snapshot aus den aktuellen Aussteller-Stammdaten neu — sicherer als
       ein Best-Effort-Umschreiben pro Feld. */
    await sql`
      UPDATE invoices
      SET issuer_snapshot = jsonb_build_object(
            'key', iss.key,
            'brandLabel', iss.brand_label,
            'legalName', iss.legal_name,
            'owner', iss.owner,
            'headerTagline', iss.header_tagline,
            'address', iss.address,
            'contact', iss.contact,
            'taxNumber', iss.tax_number,
            'vatId', iss.vat_id,
            'taxRegime', iss.tax_regime,
            'smallBusinessNote', iss.small_business_note,
            'bank', iss.bank,
            'defaultCurrency', iss.default_currency,
            'defaultPaymentTerms', iss.default_payment_terms,
            'defaultIntro', iss.default_intro,
            'defaultOutro', iss.default_outro,
            'defaultFooter', iss.default_footer,
            'accentColor', iss.accent_color,
            'logoPath', iss.logo_path,
            'templateKey', iss.template_key,
            'numberFormat', iss.number_format,
            'numberPrefix', iss.number_prefix,
            'numberPadding', iss.number_padding
          )
      FROM billing_issuers iss
      WHERE iss.id = invoices.issuer_id
        AND invoices.issuer_snapshot IS NOT NULL
        AND (invoices.issuer_snapshot ->> 'brandLabel') IS NULL
    `;

    await sql`
      UPDATE invoices
      SET customer_snapshot = jsonb_build_object(
            'id', cust.id,
            'name', cust.name,
            'contactPerson', cust.contact_person,
            'address', cust.address,
            'email', cust.email,
            'buyerReference', cust.buyer_reference,
            'leitwegId', cust.leitweg_id,
            'vatId', cust.vat_id,
            'customerNumber', cust.customer_number
          )
      FROM billing_customers cust
      WHERE cust.id = invoices.customer_id
        AND invoices.customer_snapshot IS NOT NULL
        AND (invoices.customer_snapshot ->> 'name') IS NULL
    `;
  },
};
