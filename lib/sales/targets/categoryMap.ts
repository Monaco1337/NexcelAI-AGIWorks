/**
 * Kategorie-Normalisierung.
 *
 * OpenStreetMap liefert Business-Klassifizierungen als rohes Tag
 * (`shop=gift`, `craft=electrician`, `amenity=restaurant`, …). Die
 * VIRCLE-Zielkundenansicht braucht saubere deutsche Kategorien
 * (Handwerk, Industrie, Ärzte / Praxen, …). Diese Funktion mappt das
 * strukturiert und deterministisch — kein LLM nötig.
 *
 * Rückgabe:
 *  { category: "Handwerk", subCategory: "Elektro" }
 *
 * Bei unbekannten Tags: category = "Sonstige", subCategory = raw tag
 * (damit wir später Reports fahren und die Kategorie-Tabelle
 * anschließend gezielt erweitern können).
 */

export interface NormalizedCategory {
  category: string;
  subCategory: string | null;
}

/** Rohes Overpass-Tag → deutsche Hauptkategorie. */
const SHOP_MAP: Record<string, [string, string?]> = {
  // Handwerk-nahe Shops
  hardware: ["Handwerk", "Baumarkt"],
  paint: ["Handwerk", "Farbe / Lack"],
  doityourself: ["Handwerk", "DIY"],
  building_materials: ["Handwerk", "Baumaterial"],
  electrical: ["Elektro", "Elektro-Fachhandel"],
  appliance: ["Elektro", "Haushaltsgeräte"],
  electronics: ["IT / Software", "Elektronik"],
  hifi: ["IT / Software", "HiFi"],
  computer: ["IT / Software", "Computer"],
  tiles: ["Handwerk", "Fliesen"],
  flooring: ["Handwerk", "Bodenbelag"],
  carpet: ["Handwerk", "Teppich"],
  trade: ["Handwerk", "Trade"],
  // Auto-nahe Shops
  car: ["Automotive", "Autohaus"],
  car_repair: ["Automotive", "Werkstatt"],
  car_parts: ["Automotive", "Ersatzteile"],
  motorcycle: ["Automotive", "Motorrad"],
  motorcycle_repair: ["Automotive", "Motorrad-Werkstatt"],
  tyres: ["Automotive", "Reifen"],
  bicycle: ["Automotive", "Fahrrad"],
  caravan: ["Automotive", "Caravan"],
  // Beauty / Fitness
  beauty: ["Fitness / Beauty", "Kosmetik"],
  hairdresser: ["Fitness / Beauty", "Friseur"],
  cosmetics: ["Fitness / Beauty", "Kosmetik"],
  massage: ["Fitness / Beauty", "Massage"],
  tattoo: ["Fitness / Beauty", "Tattoo"],
  piercing: ["Fitness / Beauty", "Piercing"],
  nails: ["Fitness / Beauty", "Nagelstudio"],
  // OSM kennt beide Schreibweisen; ohne die zweite landen Nagelstudios
  // im Einzelhandel und fehlen im Beauty-Filter.
  nail_salon: ["Fitness / Beauty", "Nagelstudio"],
  hairdresser_supply: ["Fitness / Beauty", "Friseurbedarf"],
  herbalist: ["Fitness / Beauty", "Naturheilmittel"],
  perfumery: ["Fitness / Beauty", "Parfümerie"],
  // Alltag
  supermarket: ["Einzelhandel", "Supermarkt"],
  convenience: ["Einzelhandel", "Convenience"],
  bakery: ["Einzelhandel", "Bäckerei"],
  butcher: ["Einzelhandel", "Metzgerei"],
  greengrocer: ["Einzelhandel", "Obst & Gemüse"],
  kiosk: ["Einzelhandel", "Kiosk"],
  variety_store: ["Einzelhandel", "Discounter"],
  tobacco: ["Einzelhandel", "Tabakwaren"],
  beverages: ["Einzelhandel", "Getränke"],
  clothes: ["Einzelhandel", "Bekleidung"],
  shoes: ["Einzelhandel", "Schuhe"],
  furniture: ["Einzelhandel", "Möbel"],
  gift: ["Einzelhandel", "Geschenke"],
  books: ["Einzelhandel", "Buchhandel"],
  florist: ["Einzelhandel", "Blumen"],
  jewelry: ["Einzelhandel", "Schmuck"],
  optician: ["Einzelhandel", "Optiker"],
  // Makler werden in OSM mal als office, mal als shop erfasst. Fehlte die
  // shop-Variante, tauchten sie nicht im Immobilien-Filter auf.
  estate_agent: ["Immobilien", "Makler"],
  copyshop: ["Dienstleistungen", "Copyshop"],
  travel_agency: ["Dienstleistungen", "Reisebüro"],
  laundry: ["Dienstleistungen", "Wäscherei"],
  dry_cleaning: ["Dienstleistungen", "Reinigung"],
  logistics: ["Logistik", "Versand"],
  pharmacy: ["Ärzte / Praxen", "Apotheke"],
  vacant: ["Sonstige", "Leerstand"],
};

const CRAFT_MAP: Record<string, [string, string?]> = {
  plumber: ["Sanitär / Heizung", "Klempner"],
  hvac: ["Sanitär / Heizung", "Klima / Lüftung"],
  heating_engineer: ["Sanitär / Heizung", "Heizungsbau"],
  sanitary: ["Sanitär / Heizung", "Sanitär"],
  electrician: ["Elektro", "Elektriker"],
  electronics_repair: ["Elektro", "Elektronik-Reparatur"],
  carpenter: ["Handwerk", "Zimmerer"],
  cabinet_maker: ["Handwerk", "Schreiner"],
  joiner: ["Handwerk", "Tischler"],
  painter: ["Handwerk", "Maler"],
  tiler: ["Handwerk", "Fliesenleger"],
  roofer: ["Handwerk", "Dachdecker"],
  plasterer: ["Handwerk", "Stuckateur"],
  bricklayer: ["Handwerk", "Maurer"],
  metal_construction: ["Handwerk", "Metallbau"],
  blacksmith: ["Handwerk", "Schmied"],
  locksmith: ["Handwerk", "Schlosser"],
  glaziery: ["Handwerk", "Glaser"],
  window_construction: ["Handwerk", "Fensterbau"],
  gardener: ["Handwerk", "Garten- & Landschaftsbau"],
  agricultural_engines: ["Handwerk", "Landtechnik"],
  scaffolder: ["Handwerk", "Gerüstbauer"],
  stonemason: ["Handwerk", "Steinmetz"],
  jeweller: ["Handwerk", "Goldschmied"],
  watchmaker: ["Handwerk", "Uhrmacher"],
  photographer: ["Handwerk", "Fotograf"],
  upholsterer: ["Handwerk", "Polsterer"],
  saddler: ["Handwerk", "Sattler"],
  shoemaker: ["Handwerk", "Schuster"],
  baker: ["Einzelhandel", "Bäcker"],
  confectionery: ["Einzelhandel", "Konditor"],
  brewery: ["Produktion", "Brauerei"],
  distillery: ["Produktion", "Brennerei"],
};

const OFFICE_MAP: Record<string, [string, string?]> = {
  lawyer: ["Kanzleien", "Rechtsanwalt"],
  notary: ["Kanzleien", "Notar"],
  advocate: ["Kanzleien", "Advokat"],
  tax_advisor: ["Steuerberatung", "Steuerberater"],
  accountant: ["Steuerberatung", "Wirtschaftsprüfer"],
  financial: ["Finanzen", "Finanzberatung"],
  financial_advisor: ["Finanzen", "Finanzberatung"],
  insurance: ["Finanzen", "Versicherung"],
  bank: ["Finanzen", "Bank"],
  estate_agent: ["Immobilien", "Makler"],
  property_management: ["Immobilien", "Hausverwaltung"],
  real_estate: ["Immobilien", "Immobilien"],
  it: ["IT / Software", "IT-Dienstleister"],
  engineering: ["Industrie", "Ingenieurbüro"],
  architect: ["Dienstleistungen", "Architekt"],
  consulting: ["Dienstleistungen", "Beratung"],
  coworking: ["Dienstleistungen", "Coworking"],
  advertising_agency: ["Dienstleistungen", "Werbeagentur"],
  marketing: ["Dienstleistungen", "Marketing"],
  marketing_agency: ["Dienstleistungen", "Marketingagentur"],
  graphic_design: ["Dienstleistungen", "Design"],
  publisher: ["Dienstleistungen", "Verlag"],
  newspaper: ["Dienstleistungen", "Presse"],
  logistics: ["Logistik", "Logistik"],
  forwarding: ["Logistik", "Spedition"],
  company: ["Industrie", "Unternehmen"],
  research: ["Bildung", "Forschung"],
  educational_institution: ["Bildung", "Bildungseinrichtung"],
  travel_agent: ["Dienstleistungen", "Reisebüro"],
  employment_agency: ["Dienstleistungen", "Personalvermittlung"],
  government: ["Sonstige", "Öffentliche Verwaltung"],
  ngo: ["Sonstige", "NGO"],
  association: ["Sonstige", "Verband"],
  foundation: ["Sonstige", "Stiftung"],
};

const AMENITY_MAP: Record<string, [string, string?]> = {
  restaurant: ["Gastronomie", "Restaurant"],
  cafe: ["Gastronomie", "Café"],
  bar: ["Gastronomie", "Bar"],
  pub: ["Gastronomie", "Kneipe"],
  fast_food: ["Gastronomie", "Fast Food"],
  biergarten: ["Gastronomie", "Biergarten"],
  food_court: ["Gastronomie", "Food Court"],
  ice_cream: ["Gastronomie", "Eisdiele"],
  bank: ["Finanzen", "Bank"],
  bureau_de_change: ["Finanzen", "Wechselstube"],
  atm: ["Finanzen", "Bankautomat"],
  car_rental: ["Automotive", "Autovermietung"],
  car_wash: ["Automotive", "Waschanlage"],
  fuel: ["Automotive", "Tankstelle"],
  charging_station: ["Automotive", "Ladestation"],
  driving_school: ["Automotive", "Fahrschule"],
  doctors: ["Ärzte / Praxen", "Arztpraxis"],
  dentist: ["Ärzte / Praxen", "Zahnarzt"],
  clinic: ["Ärzte / Praxen", "Klinik"],
  pharmacy: ["Ärzte / Praxen", "Apotheke"],
  school: ["Bildung", "Schule"],
  kindergarten: ["Bildung", "Kindergarten"],
  college: ["Bildung", "College"],
  university: ["Bildung", "Universität"],
  language_school: ["Bildung", "Sprachschule"],
  music_school: ["Bildung", "Musikschule"],
};

const HEALTHCARE_MAP: Record<string, [string, string?]> = {
  doctor: ["Ärzte / Praxen", "Arzt"],
  clinic: ["Ärzte / Praxen", "Klinik"],
  centre: ["Ärzte / Praxen", "Gesundheitszentrum"],
  dentist: ["Ärzte / Praxen", "Zahnarzt"],
  psychotherapist: ["Ärzte / Praxen", "Psychotherapeut"],
  physiotherapist: ["Ärzte / Praxen", "Physiotherapie"],
  alternative: ["Ärzte / Praxen", "Alternativmedizin"],
  pharmacy: ["Ärzte / Praxen", "Apotheke"],
};

const TOURISM_MAP: Record<string, [string, string?]> = {
  hotel: ["Hotellerie", "Hotel"],
  guest_house: ["Hotellerie", "Pension"],
  hostel: ["Hotellerie", "Hostel"],
  motel: ["Hotellerie", "Motel"],
  apartment: ["Hotellerie", "Apartment"],
  chalet: ["Hotellerie", "Ferienhaus"],
  resort: ["Hotellerie", "Resort"],
};

const LEISURE_MAP: Record<string, [string, string?]> = {
  fitness_centre: ["Fitness / Beauty", "Fitnessstudio"],
  sports_centre: ["Fitness / Beauty", "Sportzentrum"],
  dance: ["Fitness / Beauty", "Tanzstudio"],
};

const INDUSTRIAL_MAP: Record<string, [string, string?]> = {
  factory: ["Produktion", "Fabrik"],
  warehouse: ["Logistik", "Lager"],
};

/**
 * Nimmt Overpass-Rohtags in Form eines Objekts (oder einer einfachen
 * `industry`-Signatur) und liefert eine normalisierte Kategorie zurück.
 * Die Funktion ist rein deterministisch — kein Nachladen, kein LLM.
 */
export function normalizeCategoryFromTags(tags: Record<string, string | null | undefined>): NormalizedCategory {
  // Reihenfolge = Priorität; kompaktere/klarere Tags gewinnen zuerst.
  const routes: Array<[string, Record<string, [string, string?]>]> = [
    ["healthcare", HEALTHCARE_MAP],
    ["craft", CRAFT_MAP],
    ["office", OFFICE_MAP],
    ["shop", SHOP_MAP],
    ["amenity", AMENITY_MAP],
    ["tourism", TOURISM_MAP],
    ["leisure", LEISURE_MAP],
    ["industrial", INDUSTRIAL_MAP],
  ];
  for (const [tag, map] of routes) {
    const raw = (tags[tag] ?? "").toString().trim().toLowerCase();
    if (!raw) continue;
    const hit = map[raw];
    if (hit) {
      return { category: hit[0], subCategory: hit[1] ?? raw };
    }
    // Fallback: Tag hat einen Wert, aber Mapping fehlt — Kategorie
    // anhand der Tag-Achse ableiten, Sub-Category = Rohwert.
    return { category: fallbackCategoryForAxis(tag), subCategory: raw };
  }
  return { category: "Sonstige", subCategory: null };
}

function fallbackCategoryForAxis(tag: string): string {
  switch (tag) {
    case "healthcare":
      return "Ärzte / Praxen";
    case "craft":
      return "Handwerk";
    case "office":
      return "Dienstleistungen";
    case "shop":
      return "Einzelhandel";
    case "amenity":
      return "Dienstleistungen";
    case "tourism":
      return "Hotellerie";
    case "leisure":
      return "Fitness / Beauty";
    case "industrial":
      return "Industrie";
    default:
      return "Sonstige";
  }
}

/**
 * Normalisiert ein bereits gemapptes rohes Kategoriewort (z. B. wenn
 * Overpass nur `industry: "gift"` an die Pipeline reicht). Praktisch für
 * bestehende Rows in `sales_target_companies`, deren `industry` bereits
 * mit dem OSM-Rohwert befüllt ist.
 */
export function normalizeCategoryFromRawIndustry(raw: string | null | undefined): NormalizedCategory {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { category: "Sonstige", subCategory: null };
  const value = trimmed.toLowerCase();

  // (1) Ist der Input bereits eine kanonische UI-Kategorie? Dann
  //     einfach zurückgeben — passiert bei neuen Discovery-Datensätzen,
  //     die schon serverseitig normalisiert wurden.
  const canonicalMatch = ALL_CATEGORIES.find((c) => c.toLowerCase() === value);
  if (canonicalMatch) return { category: canonicalMatch, subCategory: null };

  // (2) Rohes Overpass-Tag? In den Lookup-Maps suchen.
  const merged: Record<string, [string, string?]> = {
    ...SHOP_MAP,
    ...CRAFT_MAP,
    ...OFFICE_MAP,
    ...AMENITY_MAP,
    ...HEALTHCARE_MAP,
    ...TOURISM_MAP,
    ...LEISURE_MAP,
    ...INDUSTRIAL_MAP,
  };
  const hit = merged[value];
  if (hit) return { category: hit[0], subCategory: hit[1] ?? value };

  return { category: "Sonstige", subCategory: value };
}

/** Liefert die vollständige Menge aller UI-Kategorien in stabiler Reihenfolge. */
export const ALL_CATEGORIES = [
  "Handwerk",
  "Sanitär / Heizung",
  "Elektro",
  "Ärzte / Praxen",
  "Kanzleien",
  "Steuerberatung",
  "Gastronomie",
  "Immobilien",
  "Fitness / Beauty",
  "Automotive",
  "Einzelhandel",
  "Industrie",
  "Produktion",
  "Logistik",
  "IT / Software",
  "Hotellerie",
  "Bildung",
  "Finanzen",
  "Dienstleistungen",
  "Sonstige",
] as const;
