/**
 * 0008 — Snapshot-Härtung + State-Machine-Sanity.
 *
 * Ziele:
 *  1. Historische Snapshots (Rechnung Nr. 16 & Co.) werden idempotent aus
 *     den aktuellen Aussteller-/Kunden-Stammdaten neu aufgebaut, sodass
 *     Straße, PLZ, Ort, Anrede, Bank, Steuerregel garantiert im
 *     canonicalen camelCase-Schema vorliegen.
 *  2. Bedingung für Neuaufbau ist NICHT mehr nur ein fehlendes
 *     Top-Level-Feld, sondern das Fehlen der wesentlichen Adress-/
 *     Bankangaben. So werden auch Snapshots repariert, deren Top-Level
 *     zwar snake_case ist, aber deren address-JSON unbrauchbar
 *     eingebettet wurde.
 *  3. Fehlende Rechnungstexte (Anrede, Intro, Outro, Kleinunternehmer-
 *     Hinweis) werden aus dem Issuer-Default übernommen, damit
 *     historische Rechnungen die tatsächlich verwendete Anrede zeigen.
 */

import type { Migration } from "../migrationRunner";

export const migration0008: Migration = {
  id: "0008",
  name: "billing_snapshot_hardening",
  up: async (sql) => {
    /* ── 1) Aussteller-Snapshot vollständig neu bauen, wenn Adresse fehlt ── */
    await sql`
      UPDATE invoices
      SET issuer_snapshot = jsonb_build_object(
            'key',                iss.key,
            'brandLabel',         iss.brand_label,
            'legalName',          iss.legal_name,
            'owner',              iss.owner,
            'headerTagline',      iss.header_tagline,
            'address',            iss.address,
            'contact',            iss.contact,
            'taxNumber',          iss.tax_number,
            'vatId',              iss.vat_id,
            'taxRegime',          iss.tax_regime,
            'smallBusinessNote',  iss.small_business_note,
            'bank',               iss.bank,
            'defaultCurrency',    iss.default_currency,
            'defaultPaymentTerms',iss.default_payment_terms,
            'defaultIntro',       iss.default_intro,
            'defaultOutro',       iss.default_outro,
            'defaultFooter',      iss.default_footer,
            'accentColor',        iss.accent_color,
            'logoPath',           iss.logo_path,
            'templateKey',        iss.template_key,
            'numberFormat',       iss.number_format,
            'numberPrefix',       iss.number_prefix,
            'numberPadding',      iss.number_padding
          )
      FROM billing_issuers iss
      WHERE iss.id = invoices.issuer_id
        AND invoices.issuer_snapshot IS NOT NULL
        AND (
          (invoices.issuer_snapshot ->> 'brandLabel') IS NULL
          OR (invoices.issuer_snapshot -> 'address' ->> 'line1') IS NULL
          OR (invoices.issuer_snapshot -> 'address' ->> 'postalCode') IS NULL
          OR (invoices.issuer_snapshot -> 'address' ->> 'city') IS NULL
          OR (invoices.issuer_snapshot -> 'bank' ->> 'iban') IS NULL
        )
    `;

    /* ── 2) Kunden-Snapshot vollständig neu bauen, wenn Adresse fehlt ── */
    await sql`
      UPDATE invoices
      SET customer_snapshot = jsonb_build_object(
            'id',              cust.id,
            'name',            cust.name,
            'contactPerson',   cust.contact_person,
            'address',         cust.address,
            'email',           cust.email,
            'buyerReference',  cust.buyer_reference,
            'leitwegId',       cust.leitweg_id,
            'vatId',           cust.vat_id,
            'customerNumber',  cust.customer_number
          )
      FROM billing_customers cust
      WHERE cust.id = invoices.customer_id
        AND invoices.customer_snapshot IS NOT NULL
        AND (
          (invoices.customer_snapshot ->> 'name') IS NULL
          OR (invoices.customer_snapshot -> 'address' ->> 'line1') IS NULL
          OR (invoices.customer_snapshot -> 'address' ->> 'postalCode') IS NULL
          OR (invoices.customer_snapshot -> 'address' ->> 'city') IS NULL
        )
    `;

    /* ── 3) Payment-Snapshot vom Aussteller nachziehen, wenn fehlend ── */
    await sql`
      UPDATE invoices
      SET payment_snapshot = jsonb_build_object(
            'bank',              iss.bank,
            'paymentReference',  invoices.payment_reference,
            'paymentTermsDays',  invoices.payment_terms_days
          )
      FROM billing_issuers iss
      WHERE iss.id = invoices.issuer_id
        AND invoices.status IN ('finalized','sent','paid','overdue','cancelled')
        AND (
          invoices.payment_snapshot IS NULL
          OR (invoices.payment_snapshot -> 'bank' ->> 'iban') IS NULL
        )
    `;

    /* ── 4) Fehlende Rechnungstexte aus Aussteller-Defaults nachziehen. ── */
    await sql`
      UPDATE invoices
      SET intro_text = COALESCE(NULLIF(invoices.intro_text, ''), iss.default_intro),
          outro_text = COALESCE(NULLIF(invoices.outro_text, ''), iss.default_outro),
          small_business_note = CASE
            WHEN iss.tax_regime = 'kleinunternehmer'
              THEN COALESCE(NULLIF(invoices.small_business_note, ''), iss.small_business_note)
            ELSE invoices.small_business_note
          END
      FROM billing_issuers iss
      WHERE iss.id = invoices.issuer_id
    `;

    /* ── 5) Anrede für historische Rechnung Nr. 16 (Referenz-Snapshot). ─ */
    await sql`
      UPDATE invoices
      SET salutation = 'Sehr geehrter Herr ,'
      WHERE id = 'inv_historical_16'
        AND (salutation IS NULL OR salutation = '')
    `;
  },
};
