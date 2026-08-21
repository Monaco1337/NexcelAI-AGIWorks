/**
 * Höhere Rechnungsabläufe.
 *
 * Diese Datei ist die einzige, die die Bausteine (Projekt-Billing-Config,
 * Kunde, Aussteller, Perioden-Fortschreibung, Sequenz, Snapshots und
 * Dokumenterzeugung) zu betriebsfachlichen Aufgaben verknüpft:
 *  - Folgerechnung für ein Projekt erzeugen
 *  - Nächste Folgerechnung aus der Queue erzeugen
 *  - Korrekturrechnung aus einer bestehenden anlegen
 *  - Rechnung finalisieren inklusive Dokumenten
 */

import { getIssuer } from "./issuersStore";
import { getCustomer } from "./customersStore";
import {
  createInvoiceDraft,
  finalizeInvoice,
  getInvoice,
  getInvoiceRefIds,
  InvoiceError,
} from "./invoicesStore";
import {
  getBillingConfig,
  pickNextBillableProject,
} from "./projectBillingStore";
import { generateAndStoreDocuments } from "./documents";
import {
  addDays,
  buildPeriod,
  nextPeriod,
  periodForStrategy,
  todayIso,
} from "./period";
import { defaultTaxTreatment } from "./tax";
import type { InvoiceDomain, InvoiceItemInput } from "./model";
import type { AuditActor } from "@/lib/audit/auditLog";

export interface DraftFromProjectOptions {
  invoiceDate?: string;
  overridePeriod?: { start: string; end: string };
}

/**
 * Legt einen Draft für ein Projekt an. Nutzt die vom Projekt gepflegten
 * Default-Positionen und rechnet den nächsten Leistungszeitraum aus dem
 * `last_billed_period_end` fort — nicht aus einem Text-Manipulationstrick.
 */
export async function createDraftFromProject(
  projectId: string,
  actor: AuditActor,
  options: DraftFromProjectOptions = {},
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain> {
  const config = await getBillingConfig(projectId);
  if (!config) throw new InvoiceError("Projekt nicht gefunden.", "not_found");
  if (!config.billingEnabled) throw new InvoiceError("Für dieses Projekt ist die Abrechnung deaktiviert.");
  if (!config.issuerId) throw new InvoiceError("Für dieses Projekt ist kein Aussteller hinterlegt.");
  if (!config.customerId) throw new InvoiceError("Für dieses Projekt ist kein Kunde hinterlegt.");
  if (config.defaultItems.length === 0) {
    throw new InvoiceError("Für dieses Projekt sind keine Standard-Positionen konfiguriert.");
  }

  const issuer = await getIssuer(config.issuerId);
  if (!issuer) throw new InvoiceError("Aussteller nicht gefunden.", "not_found");
  const customer = await getCustomer(config.customerId);
  if (!customer) throw new InvoiceError("Kunde nicht gefunden.", "not_found");

  const invoiceDate = options.invoiceDate ?? todayIso();
  const period = options.overridePeriod
    ? buildPeriod(options.overridePeriod.start, options.overridePeriod.end)
    : config.lastBilledPeriodEnd
      ? nextPeriod(
          buildPeriod(
            config.lastBilledPeriodEnd, // Start-Platzhalter, sofort neu berechnet
            config.lastBilledPeriodEnd
          ),
          config.billingFrequency
        )
      : periodForStrategy(config.servicePeriodStrategy, invoiceDate);

  const treatment = defaultTaxTreatment(issuer);
  const items: InvoiceItemInput[] = config.defaultItems.map((raw) => ({
    title: replaceServicePeriodTokens(raw.title, period),
    description: raw.description ? replaceServicePeriodTokens(raw.description, period) : "",
    quantityMilli: raw.quantityMilli ?? 1000,
    unit: raw.unit || "Stk.",
    unitPriceCents: raw.unitPriceCents ?? 0,
    discountPercentMilli: raw.discountPercentMilli ?? 0,
    taxCategory: raw.taxCategory ?? treatment.category,
    taxRatePercentMilli: raw.taxRatePercentMilli ?? treatment.ratePercentMilli,
  }));

  // Für jede Positionsbeschreibung den Leistungszeitraum bei Bedarf ergänzen.
  const enriched = items.map((it) => ({
    ...it,
    title: it.title.includes("Leistungszeitraum")
      ? it.title
      : `${it.title} – Leistungszeitraum ${period.label}`,
  }));

  const draft = await createInvoiceDraft(
    {
      issuerId: issuer.id,
      customerId: customer.id ?? undefined,
      projectId: projectId,
      invoiceDate,
      dueDate: addDays(invoiceDate, config.billingTerms),
      servicePeriod: { start: period.start, end: period.end },
      currency: config.defaultCurrency || issuer.defaultCurrency,
      paymentTermsDays: config.billingTerms,
      texts: {
        intro: config.defaultIntro ?? issuer.defaultIntro,
        outro: config.defaultOutro ?? issuer.defaultOutro,
      },
      items: enriched,
    },
    actor,
    meta
  );

  if (!draft) throw new InvoiceError("Draft konnte nicht angelegt werden.");
  return draft;
}

function replaceServicePeriodTokens(
  input: string,
  period: { label: string; start: string; end: string }
): string {
  return input
    .replace(/\{\{\s*service_period\s*\}\}/gi, period.label)
    .replace(/\{\{\s*period_start\s*\}\}/gi, period.start)
    .replace(/\{\{\s*period_end\s*\}\}/gi, period.end);
}

/** Nächste Folgerechnung der Queue erzeugen. */
export async function createDraftForNextInQueue(
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain> {
  const next = await pickNextBillableProject();
  if (!next) {
    throw new InvoiceError(
      "Kein abrechnungsbereites Projekt gefunden. Prüfen Sie Aussteller, Kunde und Standard-Positionen im Projekt-Billing."
    );
  }
  return createDraftFromProject(next.projectId, actor, {}, meta);
}

/** Korrekturrechnung aus einer bestehenden. */
export async function createCorrectionDraft(
  originalId: string,
  reason: string,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain> {
  const original = await getInvoice(originalId);
  if (!original) throw new InvoiceError("Ursprungsrechnung nicht gefunden.", "not_found");
  if (!original.invoiceNumber) {
    throw new InvoiceError("Nur finalisierte Rechnungen können korrigiert werden.");
  }

  // WICHTIG: Die live Aussteller/Kunden/Projekt-IDs aus der DB holen —
  // der Snapshot enthält historische Daten, nicht zwingend eine 'id'.
  const refIds = await getInvoiceRefIds(originalId);
  if (!refIds) {
    throw new InvoiceError("Ursprungsrechnung konnte nicht referenziert werden.");
  }

  const draft = await createInvoiceDraft(
    {
      issuerId: refIds.issuerId,
      customerId: refIds.customerId ?? undefined,
      projectId: refIds.projectId ?? undefined,
      type: "correction",
      invoiceDate: todayIso(),
      dueDate: addDays(todayIso(), original.payment.paymentTermsDays),
      servicePeriod: {
        start: original.servicePeriod.start,
        end: original.servicePeriod.end,
      },
      currency: original.currency,
      paymentTermsDays: original.payment.paymentTermsDays,
      texts: {
        // Anrede/Intro/Outro voll übernehmen; interne Notiz nicht.
        salutation: original.texts.salutation ?? "",
        intro: original.texts.intro ?? "",
        outro: original.texts.outro ?? "",
        customerNote: original.texts.customerNote ?? "",
        internalNote: `Korrektur zu Rechnung Nr. ${original.invoiceNumber}${reason ? ` — ${reason}` : ""}`,
        smallBusinessNote: original.texts.smallBusinessNote ?? "",
      },
      references: {
        originalInvoiceId: original.id,
        originalInvoiceNumber: original.invoiceNumber,
        correctionReason: reason,
        buyerReference: original.references.buyerReference ?? null,
      },
      items: original.items.map((it) => ({
        title: it.title,
        description: it.description,
        quantityMilli: it.quantityMilli,
        unit: it.unit,
        unitPriceCents: it.unitPriceCents,
        discountPercentMilli: it.discountPercentMilli,
        taxCategory: it.taxCategory,
        taxRatePercentMilli: it.taxRatePercentMilli,
      })),
    },
    actor,
    meta
  );

  if (!draft) throw new InvoiceError("Korrektur konnte nicht angelegt werden.");
  return draft;
}

/**
 * Öffentlich verwendete Finalisierung: reserviert die Nummer, friert die
 * Snapshots ein und erzeugt anschließend PDF/ZUGFeRD/XRechnung.
 */
export async function finalizeAndProduce(
  invoiceId: string,
  expectedVersion: number,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain> {
  const { invoice } = await finalizeInvoice(invoiceId, expectedVersion, actor, meta);
  await generateAndStoreDocuments(invoiceId);
  const refreshed = await getInvoice(invoiceId);
  return refreshed ?? invoice;
}
