/**
 * Zielkunden-CategoryMap
 * Deterministische Kategorie-Normalisierung: Overpass-Rohtags
 * müssen zuverlässig auf saubere deutsche UI-Kategorien mappen.
 */
import { strict as assert } from "node:assert";
import {
  detectChain,
  OVERPASS_TAG_AXES,
} from "../../lib/sales/targets/providers/overpassProvider";
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

  /* ── Makler und Nagelstudios landen in ihrer Fachkategorie ───────── */
  // OSM erfasst beide Betriebsarten mal als office, mal als shop. Fehlte
  // die shop-Variante, tauchten sie im Einzelhandel auf und damit weder
  // im Immobilien- noch im Beauty-Filter.
  for (const tags of [{ office: "estate_agent" }, { shop: "estate_agent" }]) {
    assert.equal(
      normalizeCategoryFromTags(tags).category,
      "Immobilien",
      `Makler falsch einsortiert: ${JSON.stringify(tags)}`
    );
  }
  for (const tags of [{ shop: "nails" }, { shop: "nail_salon" }, { shop: "beauty" }]) {
    assert.equal(
      normalizeCategoryFromTags(tags).category,
      "Fitness / Beauty",
      `Beauty falsch einsortiert: ${JSON.stringify(tags)}`
    );
  }

  /* ── Kettenfilialen sind als solche erkennbar ────────────────────── */
  // Zielgruppe ist der Mittelstand; eine Filiale entscheidet vor Ort
  // weder ueber Budget noch ueber Software.
  assert.equal(detectChain({ name: "Lidl", brand: "Lidl", "brand:wikidata": "Q151954" }), true);
  assert.equal(detectChain({ name: "KiK", brand: "KiK" }), true);
  // Ein Inhaberbetrieb traegt zwar oft einen operator, aber keine Marke.
  assert.equal(detectChain({ name: "Korte Immobilien", operator: "Korte GmbH" }), false);
  assert.equal(detectChain({ name: "Friseur Schmidt" }), false);

  // Der Markenname darf die Fachkategorie nicht verdraengen: bei einer
  // Lidl-Filiale ist "Supermarkt" die brauchbare Angabe, nicht "Lidl".
  assert.equal(normalizeCategoryFromTags({ shop: "supermarket", brand: "Lidl" }).subCategory, "Supermarkt");

  /* ── Schwerpunktbranchen ─────────────────────────────────────────── */
  // Immobilien, Beauty, Fitness und Bildung haben eigene Suchachsen,
  // weil sie in den breiten Achsen am Ergebnislimit verloren gingen.
  // Die Achsen laufen zuerst, damit diese Betriebe zuerst im Katalog
  // stehen.
  const fokus = ["immobilien", "beauty", "fitness", "bildung"];
  assert.deepEqual(
    OVERPASS_TAG_AXES.slice(0, 4),
    fokus,
    "Fokusachsen muessen vor den Massenachsen liegen"
  );

  // Jede Fokusachse muss auch in der passenden Anzeigekategorie landen —
  // sonst findet der Branchenfilter die Betriebe trotz Discovery nicht.
  const erwartet: Array<[Record<string, string>, string]> = [
    [{ office: "estate_agent" }, "Immobilien"],
    [{ office: "property_management" }, "Immobilien"],
    [{ shop: "estate_agent" }, "Immobilien"],
    [{ shop: "hairdresser" }, "Fitness / Beauty"],
    [{ shop: "nail_salon" }, "Fitness / Beauty"],
    [{ craft: "beautician" }, "Fitness / Beauty"],
    [{ leisure: "spa" }, "Fitness / Beauty"],
    [{ amenity: "gym" }, "Fitness / Beauty"],
    [{ leisure: "fitness_centre" }, "Fitness / Beauty"],
    [{ leisure: "horse_riding" }, "Fitness / Beauty"],
    [{ amenity: "school" }, "Bildung"],
    [{ amenity: "language_school" }, "Bildung"],
    [{ amenity: "driving_school" }, "Bildung"],
    [{ amenity: "training" }, "Bildung"],
    [{ office: "tutoring" }, "Bildung"],
    [{ office: "educational_institution" }, "Bildung"],
  ];
  for (const [tags, kategorie] of erwartet) {
    const ist = normalizeCategoryFromTags(tags).category;
    assert.equal(
      ist,
      kategorie,
      `${JSON.stringify(tags)} -> erwartet ${kategorie}, ist ${ist}`
    );
    // Ohne lesbare Unterkategorie bleibt die Karte in der Liste nichtssagend.
    assert.ok(
      normalizeCategoryFromTags(tags).subCategory,
      `${JSON.stringify(tags)} ohne Unterkategorie`
    );
  }

  console.log("OK · Zielkunden-CategoryMap");
}

main();
