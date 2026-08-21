/**
 * Persistenz für Rechnungsaussteller.
 *
 * Ein Aussteller ist keine Kundendatensammlung, sondern eine buchhalterische
 * Rechtseinheit. Deshalb erlauben wir kein Soft-Delete: eine Umbenennung
 * überschreibt Live-Werte, historische Rechnungen bleiben durch ihre eigenen
 * Snapshots davon unberührt.
 */

import { db } from "@/lib/pg";
import type { Tx } from "@/lib/db/migrationRunner";
import { writeAuditTx, type AuditActor } from "@/lib/audit/auditLog";
import type {
  BankAccount,
  BillingIssuer,
  ContactChannel,
  IssuerSnapshot,
  PostalAddress,
  TaxRegime,
} from "./model";

interface IssuerRow {
  id: string;
  key: string;
  brand_label: string;
  legal_name: string;
  owner: string;
  header_tagline: string;
  address: PostalAddress;
  contact: ContactChannel;
  tax_number: string | null;
  vat_id: string | null;
  tax_regime: string;
  small_business_note: string;
  bank: BankAccount;
  default_currency: string;
  default_payment_terms: number;
  default_intro: string;
  default_outro: string;
  default_footer: string;
  accent_color: string;
  logo_path: string | null;
  template_key: string;
  number_format: string;
  number_prefix: string;
  number_padding: number;
  active: boolean;
  config_warnings: unknown;
  created_at: Date;
  updated_at: Date;
}

function rowToIssuer(row: IssuerRow): BillingIssuer {
  const warnings = Array.isArray(row.config_warnings)
    ? (row.config_warnings as string[])
    : [];
  return {
    id: row.id,
    key: row.key,
    brandLabel: row.brand_label,
    legalName: row.legal_name,
    owner: row.owner,
    headerTagline: row.header_tagline,
    address: row.address,
    contact: row.contact,
    taxNumber: row.tax_number,
    vatId: row.vat_id,
    taxRegime: row.tax_regime as TaxRegime,
    smallBusinessNote: row.small_business_note,
    bank: row.bank,
    defaultCurrency: row.default_currency,
    defaultPaymentTerms: row.default_payment_terms,
    defaultIntro: row.default_intro,
    defaultOutro: row.default_outro,
    defaultFooter: row.default_footer,
    accentColor: row.accent_color,
    logoPath: row.logo_path,
    templateKey: row.template_key,
    numberFormat: row.number_format,
    numberPrefix: row.number_prefix,
    numberPadding: row.number_padding,
    active: row.active,
    configWarnings: warnings,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const ISSUER_SELECT = `
  SELECT
    id, key, brand_label, legal_name, owner, header_tagline,
    address, contact, tax_number, vat_id, tax_regime,
    small_business_note, bank, default_currency, default_payment_terms,
    default_intro, default_outro, default_footer, accent_color, logo_path,
    template_key, number_format, number_prefix, number_padding,
    active, config_warnings, created_at, updated_at
  FROM billing_issuers
`;

export async function listIssuers(): Promise<BillingIssuer[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<IssuerRow[]>`
    ${sql.unsafe(ISSUER_SELECT)}
    ORDER BY key ASC
  `;
  return rows.map(rowToIssuer);
}

export async function getIssuer(id: string): Promise<BillingIssuer | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<IssuerRow[]>`
    ${sql.unsafe(ISSUER_SELECT)}
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToIssuer(rows[0]) : null;
}

export async function getIssuerByKey(key: string): Promise<BillingIssuer | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<IssuerRow[]>`
    ${sql.unsafe(ISSUER_SELECT)}
    WHERE key = ${key}
    LIMIT 1
  `;
  return rows[0] ? rowToIssuer(rows[0]) : null;
}

/** Loka lädt einen Aussteller innerhalb einer bestehenden Transaktion. */
export async function getIssuerTx(tx: Tx, id: string): Promise<BillingIssuer | null> {
  const rows = await tx<IssuerRow[]>`
    ${tx.unsafe(ISSUER_SELECT)}
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToIssuer(rows[0]) : null;
}

/** Für Snapshots — enthält alles außer Verwaltungsfelder. */
export function toIssuerSnapshot(issuer: BillingIssuer): IssuerSnapshot {
  const { id: _id, active: _a, createdAt: _c, updatedAt: _u, configWarnings: _w, ...rest } = issuer;
  return rest;
}

export interface UpdateIssuerInput {
  brandLabel?: string;
  legalName?: string;
  owner?: string;
  headerTagline?: string;
  address?: PostalAddress;
  contact?: ContactChannel;
  taxNumber?: string | null;
  vatId?: string | null;
  taxRegime?: TaxRegime;
  smallBusinessNote?: string;
  bank?: BankAccount;
  defaultCurrency?: string;
  defaultPaymentTerms?: number;
  defaultIntro?: string;
  defaultOutro?: string;
  defaultFooter?: string;
  accentColor?: string;
  templateKey?: string;
  numberPrefix?: string;
  numberPadding?: number;
  active?: boolean;
}

export async function updateIssuer(
  id: string,
  input: UpdateIssuerInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<BillingIssuer | null> {
  const sql = await db();
  if (!sql) return null;

  await sql.begin(async (tx) => {
    const current = await getIssuerTx(tx, id);
    if (!current) throw new Error("Aussteller nicht gefunden");

    await tx`
      UPDATE billing_issuers SET
        brand_label           = COALESCE(${input.brandLabel ?? null}, brand_label),
        legal_name            = COALESCE(${input.legalName ?? null}, legal_name),
        owner                 = COALESCE(${input.owner ?? null}, owner),
        header_tagline        = COALESCE(${input.headerTagline ?? null}, header_tagline),
        address               = COALESCE(${input.address ? JSON.stringify(input.address) : null}::jsonb, address),
        contact               = COALESCE(${input.contact ? JSON.stringify(input.contact) : null}::jsonb, contact),
        tax_number            = ${input.taxNumber === undefined ? sql`tax_number` : input.taxNumber},
        vat_id                = ${input.vatId === undefined ? sql`vat_id` : input.vatId},
        tax_regime            = COALESCE(${input.taxRegime ?? null}, tax_regime),
        small_business_note   = COALESCE(${input.smallBusinessNote ?? null}, small_business_note),
        bank                  = COALESCE(${input.bank ? JSON.stringify(input.bank) : null}::jsonb, bank),
        default_currency      = COALESCE(${input.defaultCurrency ?? null}, default_currency),
        default_payment_terms = COALESCE(${input.defaultPaymentTerms ?? null}, default_payment_terms),
        default_intro         = COALESCE(${input.defaultIntro ?? null}, default_intro),
        default_outro         = COALESCE(${input.defaultOutro ?? null}, default_outro),
        default_footer        = COALESCE(${input.defaultFooter ?? null}, default_footer),
        accent_color          = COALESCE(${input.accentColor ?? null}, accent_color),
        template_key          = COALESCE(${input.templateKey ?? null}, template_key),
        number_prefix         = COALESCE(${input.numberPrefix ?? null}, number_prefix),
        number_padding        = COALESCE(${input.numberPadding ?? null}, number_padding),
        active                = COALESCE(${input.active ?? null}, active),
        updated_at            = NOW()
      WHERE id = ${id}
    `;

    await writeAuditTx(tx, {
      actor,
      action: "billing.issuer.updated",
      entityType: "billing_issuer",
      entityId: id,
      before: current as unknown as Record<string, unknown>,
      after: input as Record<string, unknown>,
      ...meta,
    });
  });

  return getIssuer(id);
}

/** Vorschau der nächsten Nummer, ohne sie zu verbrauchen. */
export async function peekNextInvoiceNumber(
  issuerId: string
): Promise<{ next: number; last: number }> {
  const sql = await db();
  if (!sql) return { next: 1, last: 0 };
  const rows = await sql<{ last_number: number }[]>`
    SELECT last_number FROM invoice_sequences
    WHERE issuer_id = ${issuerId} AND year = 0
  `;
  const last = rows[0]?.last_number ?? 0;
  return { next: last + 1, last };
}

/**
 * Setzt die Basiszahl der Sequenz — nur zulässig, wenn noch keine höhere
 * Nummer verwendet wurde. Verhindert nachträgliche Manipulationen, die
 * bereits vergebene Nummern kollidieren lassen würden.
 */
export async function setSequenceBaseline(
  issuerId: string,
  lastNumber: number,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<void> {
  const sql = await db();
  if (!sql) return;

  await sql.begin(async (tx) => {
    const [existing] = await tx<{ last_number: number }[]>`
      SELECT last_number FROM invoice_sequences
      WHERE issuer_id = ${issuerId} AND year = 0
      FOR UPDATE
    `;
    const current = existing?.last_number ?? 0;

    const [inUse] = await tx<{ max: number | null }[]>`
      SELECT MAX(numeric_number) AS max FROM invoices
      WHERE issuer_id = ${issuerId} AND numeric_number IS NOT NULL
    `;
    const highest = inUse?.max ?? 0;

    if (lastNumber < highest) {
      throw new Error(
        `Basiszahl ${lastNumber} liegt unter der bereits vergebenen Höchstnummer ${highest}.`
      );
    }

    if (existing) {
      await tx`
        UPDATE invoice_sequences SET last_number = ${lastNumber}
        WHERE issuer_id = ${issuerId} AND year = 0
      `;
    } else {
      await tx`
        INSERT INTO invoice_sequences (issuer_id, year, last_number)
        VALUES (${issuerId}, 0, ${lastNumber})
      `;
    }

    await writeAuditTx(tx, {
      actor,
      action: "billing.sequence.baseline_set",
      entityType: "invoice_sequence",
      entityId: issuerId,
      before: { lastNumber: current },
      after: { lastNumber },
      ...meta,
    });
  });
}
