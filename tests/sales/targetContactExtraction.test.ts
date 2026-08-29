/**
 * Zielkunden – Contact-Extractor.
 *
 * Prüft:
 *  - E-Mails aus mailto:, obfuscated „info (at) domain (dot) de"
 *  - Direkte Entscheider-E-Mail vs. Department vs. General
 *  - Telefonnummern aus tel: und Fließtext, De-Duplizierung nach E.164
 *  - LinkedIn/Instagram/Facebook/WhatsApp
 *  - Impressum-Kontext → höhere Confidence
 *
 * Ausführung: `npx tsx tests/sales/targetContactExtraction.test.ts`.
 */

import {
  classifyEmail,
  extractContactsFromHtml,
} from "../../lib/sales/targets/contactExtraction";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

async function main(): Promise<void> {
  // Email-Klassifikation
  assert(classifyEmail("info@mueller.de") === "GENERAL", "info@ → GENERAL");
  assert(classifyEmail("marketing@mueller.de") === "DEPARTMENT", "marketing@ → DEPARTMENT");
  assert(
    classifyEmail("max.mueller@mueller.de") === "DIRECT_DECISION_MAKER",
    "max.mueller@ → DIRECT_DECISION_MAKER"
  );

  const html = `
    <html>
      <head><title>Impressum – Kanzlei Müller</title></head>
      <body>
        <h1>Impressum</h1>
        <footer>
          Tel: <a href="tel:+492303123456">02303 123456</a><br>
          Mobil: 0175 1234567<br>
          Kontakt: info (at) mueller (dot) de<br>
          Persönlich: <a href="mailto:max.mueller@mueller.de">max.mueller@mueller.de</a>
          <a href="https://www.linkedin.com/company/kanzlei-mueller">LinkedIn</a>
          <a href="/kontakt">Kontaktformular</a>
        </footer>
        <a href="https://www.instagram.com/kanzleimueller">IG</a>
      </body>
    </html>`;

  const extracted = extractContactsFromHtml(html, "https://mueller.de", "DE");

  assert(extracted.emails.length >= 2, `E-Mails gefunden (${extracted.emails.length})`);
  const direct = extracted.emails.find((e) => e.value === "max.mueller@mueller.de");
  assert(direct?.classification === "DIRECT_DECISION_MAKER", "Direkte E-Mail klassifiziert");
  const info = extracted.emails.find((e) => e.value === "info@mueller.de");
  assert(info?.classification === "GENERAL", "Obfuscated info@ dekodiert");

  assert(extracted.phones.length >= 2, `Telefone gefunden (${extracted.phones.length})`);
  const landline = extracted.phones.find((p) => p.normalizedValue === "+492303123456");
  assert(landline, "Festnetz gefunden");
  const mobile = extracted.phones.find((p) => p.classification === "BUSINESS_MOBILE");
  assert(mobile, "Mobil gefunden");

  const linkedin = extracted.socials.find((s) => s.kind === "linkedin");
  assert(linkedin?.value.includes("kanzlei-mueller"), "LinkedIn gefunden");
  const insta = extracted.socials.find((s) => s.kind === "instagram");
  assert(insta, "Instagram gefunden");

  assert(
    extracted.contactForms.some((u) => u.endsWith("/kontakt")),
    "Kontaktformular-Link erkannt"
  );

  // Confidence: Impressum-Kontext > 0.9
  assert(direct && direct.confidence >= 0.9, `Impressum boostet Confidence: ${direct?.confidence}`);

  console.log("OK · Zielkunden-ContactExtraction");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
