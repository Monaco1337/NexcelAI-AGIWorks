/**
 * Leistungszeiträume und Fortschreibung.
 *
 * Bewusst datumsbasiert (nicht string-basiert). Wer aus „Juli 2026" einen
 * neuen Text „August 2026" bastelt, hat spätestens im Dezember ein Problem.
 * Wir arbeiten mit ISO-Datumsgrenzen und leiten die Beschriftung erst am
 * Ende ab.
 */

import type {
  BillingFrequency,
  ServicePeriod,
  ServicePeriodStrategy,
} from "./model";

const DE_MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/** Datum ohne Zeitanteil in UTC — vermeidet Zeitzonen-Verrutscher. */
function toUtcDate(input: string | Date): Date {
  if (input instanceof Date) return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const [y, m, d] = input.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex + 1, 0));
}

function firstOfMonth(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function endOfQuarter(year: number, quarterIndex: number): Date {
  const startMonth = quarterIndex * 3;
  return endOfMonth(year, startMonth + 2);
}

function firstOfQuarter(year: number, quarterIndex: number): Date {
  return firstOfMonth(year, quarterIndex * 3);
}

export function monthLabel(date: Date): string {
  return `${DE_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function periodLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();
  if (sameMonth) {
    // Ganzer Monat, wenn Start am 1. und Ende am Monatsletzten liegt.
    const first = firstOfMonth(start.getUTCFullYear(), start.getUTCMonth());
    const last = endOfMonth(start.getUTCFullYear(), start.getUTCMonth());
    if (
      start.getUTCDate() === first.getUTCDate() &&
      end.getUTCDate() === last.getUTCDate()
    ) {
      return monthLabel(start);
    }
  }
  const fmt = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function buildPeriod(startIso: string, endIso: string): ServicePeriod {
  const start = toUtcDate(startIso);
  const end = toUtcDate(endIso);
  return { start: toIsoDate(start), end: toIsoDate(end), label: periodLabel(start, end) };
}

/** Standardstrategien: leiten den passenden Zeitraum aus dem Rechnungsdatum ab. */
export function periodForStrategy(
  strategy: ServicePeriodStrategy,
  invoiceDateIso: string
): ServicePeriod {
  const anchor = toUtcDate(invoiceDateIso);
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();

  switch (strategy) {
    case "previous_month": {
      const start = firstOfMonth(y, m - 1);
      const end = endOfMonth(y, m - 1);
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
    case "current_month": {
      const start = firstOfMonth(y, m);
      const end = endOfMonth(y, m);
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
    case "previous_quarter": {
      const q = Math.floor(m / 3);
      const prevQ = q === 0 ? 3 : q - 1;
      const yearForQ = q === 0 ? y - 1 : y;
      const start = firstOfQuarter(yearForQ, prevQ);
      const end = endOfQuarter(yearForQ, prevQ);
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
    case "previous_year": {
      const start = new Date(Date.UTC(y - 1, 0, 1));
      const end = new Date(Date.UTC(y - 1, 11, 31));
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
    case "manual":
    default: {
      const start = firstOfMonth(y, m);
      const end = endOfMonth(y, m);
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
  }
}

/**
 * Nächster Leistungszeitraum zu einem gegebenen. Nutzt die Frequenz statt
 * String-Manipulation — „Juli 2026" wird über das Datum zu „August 2026".
 */
export function nextPeriod(
  previous: ServicePeriod,
  frequency: BillingFrequency
): ServicePeriod {
  const prevStart = toUtcDate(previous.start);
  const y = prevStart.getUTCFullYear();
  const m = prevStart.getUTCMonth();

  switch (frequency) {
    case "monthly": {
      const start = firstOfMonth(y, m + 1);
      const end = endOfMonth(start.getUTCFullYear(), start.getUTCMonth());
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
    case "quarterly": {
      const q = Math.floor(m / 3);
      const nextQIndex = q + 1;
      const nextY = y + Math.floor(nextQIndex / 4);
      const nextQ = nextQIndex % 4;
      const start = firstOfQuarter(nextY, nextQ);
      const end = endOfQuarter(nextY, nextQ);
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
    case "yearly": {
      const start = new Date(Date.UTC(y + 1, 0, 1));
      const end = new Date(Date.UTC(y + 1, 11, 31));
      return buildPeriod(toIsoDate(start), toIsoDate(end));
    }
    case "once":
    default:
      return previous;
  }
}

/** Nächstes Rechnungsdatum bei periodischer Abrechnung. */
export function nextInvoiceDate(
  currentIso: string,
  frequency: BillingFrequency
): string {
  const d = toUtcDate(currentIso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  switch (frequency) {
    case "monthly":
      return toIsoDate(new Date(Date.UTC(y, m + 1, day)));
    case "quarterly":
      return toIsoDate(new Date(Date.UTC(y, m + 3, day)));
    case "yearly":
      return toIsoDate(new Date(Date.UTC(y + 1, m, day)));
    case "once":
    default:
      return currentIso;
  }
}

export function addDays(iso: string, days: number): string {
  const d = toUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Deutsche Anzeige eines Datums. */
export function formatDeDate(iso: string): string {
  const d = toUtcDate(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}
