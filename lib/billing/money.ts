/**
 * Geldarithmetik in Minor Units (Cent).
 *
 * Rechnungen dürfen niemals über Fließkomma gerechnet werden — `0.1 + 0.2`
 * ergibt in JavaScript `0.30000000000000004`, und dieselbe Ungenauigkeit
 * würde sich zwischen PDF, Datenbank und XML unterschiedlich fortpflanzen.
 *
 * Wir speichern alle Beträge als ganzzahlige Cent-Werte und formatieren sie
 * erst an der Oberfläche. Mengen dürfen dezimal sein, werden aber intern in
 * milli-Einheiten (×1000) geführt, damit ein Rabatt von 33,3 % nicht rundet,
 * bevor er auf den Cent-Betrag angewandt wird.
 */

/** Cent — Betrag * 100. Ein Euro entspricht 100. */
export type Cents = number;

/** Menge in milli-Einheiten (×1000). 1,5 kg = 1500. */
export type MilliQty = number;

const CENT_FACTOR = BigInt(100);
const QTY_FACTOR = BigInt(1000);
const ZERO = BigInt(0);
const TWO = BigInt(2);
const HUNDRED_THOUSAND = BigInt(100_000);

/* ── Konvertierung ──────────────────────────────────────────────────── */

/** Wandelt eine dezimale Eingabe (z. B. "29,00" oder 29.0) in Cent. */
export function toCents(input: number | string): Cents {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) throw new RangeError("Betrag ist keine Zahl");
    // Über String, um den letzten Rest Float-Ungenauigkeit auszuschließen.
    return toCents(input.toFixed(2));
  }
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new RangeError(`"${input}" ist kein gültiger Betrag`);
  }
  const [whole, frac = ""] = normalized.split(".");
  const paddedFrac = (frac + "00").slice(0, 2);
  const sign = whole.startsWith("-") ? BigInt(-1) : BigInt(1);
  const wholeAbs = whole.replace("-", "");
  const cents = BigInt(wholeAbs) * CENT_FACTOR + BigInt(paddedFrac);
  return Number(cents * sign);
}

/** Wandelt Cent zurück in Dezimalstring, immer mit zwei Nachkommastellen. */
export function centsToDecimal(cents: Cents): string {
  const sign = cents < 0 ? "-" : "";
  const abs = BigInt(Math.abs(cents));
  const whole = abs / CENT_FACTOR;
  const frac = abs % CENT_FACTOR;
  return `${sign}${whole}.${frac.toString().padStart(2, "0")}`;
}

/** Deutsche Anzeige: 29,00 € */
export function formatEUR(cents: Cents): string {
  const parts = centsToDecimal(cents).split(".");
  return `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]} €`;
}

/** Menge in milli-Einheiten. */
export function toMilliQty(input: number | string): MilliQty {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) throw new RangeError("Menge ist keine Zahl");
    return toMilliQty(input.toString());
  }
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new RangeError(`"${input}" ist keine gültige Menge`);
  }
  const [whole, frac = ""] = normalized.split(".");
  const paddedFrac = (frac + "000").slice(0, 3);
  const sign = whole.startsWith("-") ? BigInt(-1) : BigInt(1);
  const wholeAbs = whole.replace("-", "");
  return Number((BigInt(wholeAbs) * QTY_FACTOR + BigInt(paddedFrac)) * sign);
}

/** Menge dezimal anzeigen, ohne überflüssige Nullen. */
export function formatQty(qty: MilliQty): string {
  const sign = qty < 0 ? "-" : "";
  const abs = BigInt(Math.abs(qty));
  const whole = abs / QTY_FACTOR;
  const frac = abs % QTY_FACTOR;
  const fracStr = frac.toString().padStart(3, "0").replace(/0+$/, "");
  return fracStr.length === 0
    ? `${sign}${whole}`
    : `${sign}${whole},${fracStr}`;
}

/* ── Arithmetik ─────────────────────────────────────────────────────── */

/**
 * Positionssumme: Menge × Einzelpreis, kaufmännisch auf ganze Cent gerundet.
 * Rechnung erfolgt in BigInt, damit auch 100 Positionen mit sechsstelligen
 * Beträgen keine Genauigkeit verlieren.
 */
export function lineTotalCents(qtyMilli: MilliQty, unitCents: Cents): Cents {
  const product = BigInt(qtyMilli) * BigInt(unitCents);
  // Divisor 1000, mit kaufmännischer Rundung.
  return Number(halfUpDivide(product, QTY_FACTOR));
}

/**
 * Wendet einen prozentualen Rabatt auf eine Zwischensumme an.
 * `percentMilli` ist die Prozentangabe × 1000 (z. B. 12,5 % = 12500).
 */
export function applyPercentDiscount(cents: Cents, percentMilli: number): Cents {
  if (percentMilli === 0) return cents;
  const discount = halfUpDivide(
    BigInt(cents) * BigInt(percentMilli),
    HUNDRED_THOUSAND
  );
  return cents - Number(discount);
}

/** Umsatzsteuerbetrag zu einem Netto und einem Prozentsatz. */
export function taxAmountCents(netCents: Cents, ratePercentMilli: number): Cents {
  if (ratePercentMilli === 0) return 0;
  return Number(
    halfUpDivide(BigInt(netCents) * BigInt(ratePercentMilli), HUNDRED_THOUSAND)
  );
}

/** Summenbildung ohne Zwischenrundung. */
export function sumCents(values: Cents[]): Cents {
  let total = ZERO;
  for (const v of values) total += BigInt(v);
  return Number(total);
}

/**
 * Kaufmännische Rundung auf ganze Cent — der Divisor ist immer eine
 * Zehnerpotenz. BigInt schneidet standardmäßig gegen Null; wir addieren die
 * halbe Distanz und teilen dann, damit 0.5 auf 1 gerundet wird (nicht auf 0).
 */
function halfUpDivide(numerator: bigint, divisor: bigint): bigint {
  const sign = (numerator < ZERO) !== (divisor < ZERO) ? BigInt(-1) : BigInt(1);
  const absN = numerator < ZERO ? -numerator : numerator;
  const absD = divisor < ZERO ? -divisor : divisor;
  return sign * ((absN + absD / TWO) / absD);
}
