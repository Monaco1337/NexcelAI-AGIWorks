/**
 * Zielkunden-CategoryMap
 * Deterministische Kategorie-Normalisierung: Overpass-Rohtags
 * müssen zuverlässig auf saubere deutsche UI-Kategorien mappen.
 */
import { strict as assert } from "node:assert";
import {
  normalizeCategoryFromTags,
  normalizeCategoryFromRawIndustry,
  ALL_CATEGORIES,
} from "../../lib/sales/targets/categoryMap";

function main() {
  // Handwerk
  const el = normalizeCategoryFromTags({ craft: "electrician" });
  assert.equal(el.category, "Elektro");
  assert.equal(el.subCategory, "Elektriker");

  const rf = normalizeCategoryFromTags({ craft: "roofer" });
  assert.equal(rf.category, "Handwerk");
  assert.equal(rf.subCategory, "Dachdecker");

  // Sanitär
  const sn = normalizeCategoryFromTags({ craft: "plumber" });
  assert.equal(sn.category, "Sanitär / Heizung");

  // Ärzte
  const dc = normalizeCategoryFromTags({ healthcare: "doctor" });
  assert.equal(dc.category, "Ärzte / Praxen");

  // Kanzleien
  const lw = normalizeCategoryFromTags({ office: "lawyer" });
  assert.equal(lw.category, "Kanzleien");

  const tx = normalizeCategoryFromTags({ office: "tax_advisor" });
  assert.equal(tx.category, "Steuerberatung");

  // Immobilien
  const rl = normalizeCategoryFromTags({ office: "estate_agent" });
  assert.equal(rl.category, "Immobilien");

  // IT / Software
  const it = normalizeCategoryFromTags({ office: "it" });
  assert.equal(it.category, "IT / Software");

  // Gastronomie
  const rest = normalizeCategoryFromTags({ amenity: "restaurant" });
  assert.equal(rest.category, "Gastronomie");

  // Automotive
  const car = normalizeCategoryFromTags({ shop: "car" });
  assert.equal(car.category, "Automotive");

  // Fallback für unbekannten Shop-Tag: Kategorie = Einzelhandel
  const unk = normalizeCategoryFromTags({ shop: "sausage_maker_2000" });
  assert.equal(unk.category, "Einzelhandel");
  assert.equal(unk.subCategory, "sausage_maker_2000");

  // Kein Tag: Sonstige
  const none = normalizeCategoryFromTags({});
  assert.equal(none.category, "Sonstige");

  // Roher Industrie-String (Legacy-Rows in DB)
  const legacy = normalizeCategoryFromRawIndustry("gift");
  assert.equal(legacy.category, "Einzelhandel");
  assert.equal(legacy.subCategory, "Geschenke");

  // Kanonische UI-Liste vollständig
  assert.ok(ALL_CATEGORIES.includes("Handwerk"));
  assert.ok(ALL_CATEGORIES.includes("Sonstige"));
  assert.ok(ALL_CATEGORIES.length >= 15);

  console.log("OK · Zielkunden-CategoryMap");
}

main();
