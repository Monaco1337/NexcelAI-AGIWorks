import type { EntityFingerprintInput } from "../../lib/sales/targets/entityResolution";

export interface GoldenIdentityRecord {
  id: string;
  entity: string;
  scenario: string;
  input: EntityFingerprintInput;
  expectedNormalizedName?: string;
}

/**
 * Human-reviewed synthetic identity cases. These are regression evidence, not
 * claims about real businesses. The release-size gate remains open until
 * 500–1,000 externally reviewed records exist.
 */
export const SALES_TARGET_GOLDEN: GoldenIdentityRecord[] = [
  {
    id: "mueller-1", entity: "mueller-sanitaer", scenario: "Müller / Mueller",
    input: { name: "Müller Sanitär GmbH", domain: "mueller-sanitaer.de", city: "Unna", postalCode: "59423", addressLine: "Bahnhofstraße 4" },
    expectedNormalizedName: "muller sanitar",
  },
  {
    id: "mueller-2", entity: "mueller-sanitaer", scenario: "Müller / Mueller",
    input: { name: "Mueller Sanitär", domain: "www.mueller-sanitaer.de", city: "Unna", postalCode: "59423", addressLine: "Bahnhofstr. 4" },
    expectedNormalizedName: "mueller sanitar",
  },
  {
    id: "cokg-1", entity: "westfalen-elektro", scenario: "GmbH & Co. KG",
    input: { name: "Westfalen Elektro GmbH & Co. KG", domain: "westfalen-elektro.de", city: "Bochum", postalCode: "44787", addressLine: "Ringstraße 8" },
    expectedNormalizedName: "westfalen elektro",
  },
  {
    id: "cokg-2", entity: "westfalen-elektro", scenario: "GmbH & Co. KG",
    input: { name: "Westfalen Elektro GmbH und Co KG", domain: "westfalen-elektro.de", city: "Bochum", postalCode: "44787", addressLine: "Ringstr. 8" },
  },
  {
    id: "ug-1", entity: "rhein-digital", scenario: "UG",
    input: { name: "Rhein Digital UG (haftungsbeschränkt)", domain: "rhein-digital.de", city: "Köln", postalCode: "50667", addressLine: "Domstraße 1" },
    expectedNormalizedName: "rhein digital",
  },
  {
    id: "ug-2", entity: "rhein-digital", scenario: "UG",
    input: { name: "Rhein Digital UG", domain: "rhein-digital.de", city: "Köln", postalCode: "50667", addressLine: "Domstr. 1" },
  },
  {
    id: "ek-1", entity: "schulte-technik", scenario: "e.K.",
    input: { name: "Schulte Technik e.K.", phone: "+49 231 555010", city: "Dortmund", postalCode: "44135", addressLine: "Markt 10" },
    expectedNormalizedName: "schulte technik",
  },
  {
    id: "ek-2", entity: "schulte-technik", scenario: "e.K.",
    input: { name: "Schulte Technik EK", phone: "0231 555010", city: "Dortmund", postalCode: "44135", addressLine: "Markt 10" },
  },
  {
    id: "rename-1", entity: "nova-logistik", scenario: "renamed business",
    input: { name: "Altstadt Logistik GmbH", domain: "nova-logistik.de", city: "Essen", postalCode: "45127", addressLine: "Hafenweg 2" },
  },
  {
    id: "rename-2", entity: "nova-logistik", scenario: "renamed business",
    input: { name: "Nova Logistik GmbH", domain: "nova-logistik.de", city: "Essen", postalCode: "45127", addressLine: "Hafenweg 2" },
  },
  {
    id: "relocate-1", entity: "berg-consult", scenario: "relocated business",
    input: { name: "Berg Consulting GmbH", domain: "berg-consult.de", city: "Bonn", postalCode: "53111", addressLine: "Rheingasse 3" },
  },
  {
    id: "relocate-2", entity: "berg-consult", scenario: "relocated business",
    input: { name: "Berg Consulting GmbH", domain: "berg-consult.de", city: "Siegburg", postalCode: "53721", addressLine: "Neue Straße 9" },
  },
  {
    id: "no-web-1", entity: "krause-dach", scenario: "no website",
    input: { name: "Krause Dach GmbH", phone: "+49 201 88001", city: "Essen", postalCode: "45128", addressLine: "Huyssenallee 5" },
  },
  {
    id: "no-web-2", entity: "krause-dach", scenario: "no website",
    input: { name: "Krause Dach", phone: "0201 88001", city: "Essen", postalCode: "45128", addressLine: "Huyssenallee 5" },
  },
  {
    id: "stale-1", entity: "lippe-metall", scenario: "stale provider data",
    input: { name: "Lippe Metall GmbH", domain: "lippe-metall.de", city: "Detmold", postalCode: "32756", addressLine: "Industrieweg 7" },
  },
  {
    id: "stale-2", entity: "lippe-metall", scenario: "stale provider data",
    input: { name: "Lippe Metall", domain: "lippe-metall.de", city: "Detmold", postalCode: "32756", addressLine: "Industrieweg 7" },
  },
  {
    id: "conflict-1", entity: "sauerland-bau", scenario: "conflicting source data",
    input: { name: "Sauerland Bau GmbH", domain: "sauerland-bau.de", phone: "+49 291 1001", city: "Meschede", postalCode: "59872", addressLine: "Bergweg 11" },
  },
  {
    id: "conflict-2", entity: "sauerland-bau", scenario: "conflicting source data",
    input: { name: "Sauerland Bau", domain: "sauerland-bau.de", phone: "+49 291 9999", city: "Meschede", postalCode: "59872", addressLine: "Bergweg 11" },
  },
  {
    id: "same-name-city-a", entity: "alpha-a", scenario: "same name, different city",
    input: { name: "Alpha Service GmbH", city: "Düsseldorf", postalCode: "40210", addressLine: "Königsallee 1" },
  },
  {
    id: "same-name-city-b", entity: "alpha-b", scenario: "same name, different city",
    input: { name: "Alpha Service GmbH", city: "Münster", postalCode: "48143", addressLine: "Prinzipalmarkt 1" },
  },
  {
    id: "same-city-address-a", entity: "beta-a", scenario: "same name and city, distinct address",
    input: { name: "Beta Handel GmbH", city: "Köln", postalCode: "50667", addressLine: "Hohe Straße 1" },
  },
  {
    id: "same-city-address-b", entity: "beta-b", scenario: "same name and city, distinct address",
    input: { name: "Beta Handel GmbH", city: "Köln", postalCode: "50667", addressLine: "Hohe Straße 99" },
  },
  {
    id: "chain-a", entity: "markt-branch-a", scenario: "chain branches",
    input: { name: "MarktPlus Dortmund", domain: "marktplus.de", city: "Dortmund", postalCode: "44135", addressLine: "Ostenhellweg 1" },
  },
  {
    id: "chain-b", entity: "markt-branch-b", scenario: "chain branches",
    input: { name: "MarktPlus Bochum", domain: "marktplus.de", city: "Bochum", postalCode: "44787", addressLine: "Kortumstraße 2" },
  },
  {
    id: "franchise-a", entity: "franchise-a", scenario: "franchise",
    input: { name: "Coffee Partner Anna", domain: "coffee-partner.de", city: "Bonn", postalCode: "53111", addressLine: "Markt 4" },
  },
  {
    id: "franchise-b", entity: "franchise-b", scenario: "franchise",
    input: { name: "Coffee Partner Ben", domain: "coffee-partner.de", city: "Aachen", postalCode: "52062", addressLine: "Markt 4" },
  },
  {
    id: "shared-domain-a", entity: "portal-tenant-a", scenario: "shared domain",
    input: { name: "Praxis Adler", domain: "branchenportal.example", city: "Hagen", postalCode: "58095", addressLine: "Elberfelder Straße 1" },
  },
  {
    id: "shared-domain-b", entity: "portal-tenant-b", scenario: "shared domain",
    input: { name: "Praxis Bär", domain: "branchenportal.example", city: "Wuppertal", postalCode: "42103", addressLine: "Wall 2" },
  },
  {
    id: "shared-phone-a", entity: "office-tenant-a", scenario: "shared phone",
    input: { name: "Studio Nord", phone: "+49 211 7777", city: "Düsseldorf", postalCode: "40213", addressLine: "Rathausufer 1" },
  },
  {
    id: "shared-phone-b", entity: "office-tenant-b", scenario: "shared phone",
    input: { name: "Kanzlei Süd", phone: "+49 211 7777", city: "Düsseldorf", postalCode: "40213", addressLine: "Rathausufer 2" },
  },
  {
    id: "gmbh-a", entity: "gamma-a", scenario: "GmbH variants distinct",
    input: { name: "Gamma GmbH", city: "Bielefeld", postalCode: "33602", addressLine: "Niederwall 1" },
  },
  {
    id: "gmbh-b", entity: "gamma-b", scenario: "GmbH variants distinct",
    input: { name: "Gamma Gesellschaft mbH", city: "Bielefeld", postalCode: "33602", addressLine: "Niederwall 2" },
  },
];
