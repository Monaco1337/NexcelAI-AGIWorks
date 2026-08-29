/**
 * Zielkunden – Telefon-Normalisierung.
 *
 * Prüft:
 *  - DE-Nummern mit führender 0 werden nach E.164 (+49…) normalisiert.
 *  - Internationale Nummern (+49, +43, +41) werden korrekt erkannt.
 *  - Mobil vs. Festnetz wird korrekt klassifiziert.
 *  - `phonesEqual` erkennt Formatvarianten derselben Nummer.
 *  - Ungültige/leere Inputs geben deterministisch `null` zurück.
 *
 * Ausführung: `npx tsx tests/sales/targetPhone.test.ts`.
 */

import { normalizePhone, phonesEqual } from "../../lib/sales/targets/phone";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

async function main(): Promise<void> {
  const a = normalizePhone("02303 123456");
  assert(a?.normalized === "+492303123456", `DE-Festnetz normalisiert: ${a?.normalized}`);
  assert(a?.classification === "BUSINESS_LANDLINE", `Klassifikation: ${a?.classification}`);

  const mobile = normalizePhone("0175 1234567");
  assert(mobile?.classification === "BUSINESS_MOBILE", `Mobil erkannt: ${mobile?.classification}`);

  const intl = normalizePhone("+43 1 5555999");
  assert(intl?.country === "AT", `Auslandsnummer erkannt: ${intl?.country}`);

  const swiss = normalizePhone("+41 79 1234567");
  assert(swiss?.classification === "BUSINESS_MOBILE", `CH-Mobil erkannt: ${swiss?.classification}`);

  const invalid = normalizePhone("abc");
  assert(invalid === null, "unbrauchbarer Input → null");

  const empty = normalizePhone("");
  assert(empty === null, "leer → null");

  assert(phonesEqual("02303 123456", "+492303123456"), "Formatvarianten erkannt");
  assert(!phonesEqual("02303 123456", "02303 999999"), "verschiedene Nummern nicht gleich");

  console.log("OK · Zielkunden-Phone");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
