/**
 * Referenz-Koordinaten der Master-Rechnung „Rechnung Nr. 16".
 *
 * WICHTIG:
 * Alle Werte sind PDF-points (pt) mit Ursprung oben-links (X → rechts,
 * Y → unten). Die Zahlen wurden direkt aus dem Original-PDF extrahiert
 * und dürfen NICHT durch Layout- oder Reflow-Logik verändert werden.
 * Der PDF-Renderer setzt jede Zone absolut an genau diese Positionen.
 *
 * pdf-lib arbeitet mit Y von UNTEN. Die Konvertierung erledigt
 * `topYToBaseline` / `topYToBottom` im Renderer selbst — nicht hier.
 */

export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;

export const COLORS = {
  black: "#000000",
  bodyText: "#000000",
  numericGray: "#606060",
  title: "#0091C2",
  primary: "#00A3DA",
  headerLine: "#000000",
  tableUnderline: "#CBCBCB",
} as const;

export const REFERENCE_INVOICE_16 = {
  page: { width: PAGE_WIDTH, height: PAGE_HEIGHT },

  logo: { x: 458.028, y: 35.407, w: 97.545, h: 24.386 },

  senderLine: {
    x: 70.866,
    y: 80.115,
    text:
      "Dienstleister im Bereich Marketing und Werbung  \u2022  Hansastra\u00dfe 34  \u2022 59425 Unna",
    fontSize: 9,
  },

  headerUnderline: { x1: 70.866, x2: 411.291, y: 90.532, stroke: 0.45 },

  recipient: {
    x: 72.043,
    lines: [
      { y: 114.136, text: "Weissleder Immobilien" },
      { y: 133.136, text: "Sch\u00fctzenhof 1" },
      { y: 152.136, text: "59423 Unna" },
    ],
    fontSize: 11,
  },

  title: { x: 72.043, y: 191.687, text: "Rechnung Nr.16", size: 15, color: COLORS.title },
  date: { x: 408.539, y: 195.687, text: "Unna,27.07.2026", size: 11 },

  greeting: { x: 70.866, y: 234.34, text: "Sehr geehrter Herr ,", size: 10 },
  intro: {
    x: 70.866,
    y: 258.34,
    lines: [
      "die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und",
      "Tools.",
    ],
    size: 10,
    lineHeight: 14,
  },

  table: {
    x: 70.866,
    y: 297.0,
    width: 467.0,
    headerHeight: 22.686,
    color: COLORS.primary,
    headerFontSize: 10,
    headerColor: "#FFFFFF",
    columns: [
      { label: "Pos", x: 70.866, width: 30.635 },
      { label: "Beschreibung", x: 101.501, width: 216.381 },
      { label: "Menge", x: 317.882, width: 42.362 },
      { label: "Preis", x: 360.244, width: 76.587 },
      { label: "Gsamt", x: 436.831, width: 101.035 },
    ],
    /** Feine Trennlinie direkt unter dem blauen Header. */
    underline: { x1: 70.866, x2: 537.866, y: 319.686, stroke: 1.0, color: COLORS.tableUnderline },
  },

  positionRow: {
    posX: 83.284,
    posY: 324.526,
    posSize: 10,
    posColor: COLORS.numericGray,

    qtyX: 350.44,
    qtyY: 324.526,

    priceX: 398.731,
    priceY: 324.526,

    totalX: 499.766,
    totalY: 324.526,
  },

  description: {
    x: 124.501,
    startY: 325.867,
    size: 12.32,
    lineHeight: 16.508,
    boldLines: [
      "Monatliche Betriebs- und",
      "Sicherungspauschale f\u00fcr",
      "\u201eWeissleder Immobilien \u201c \u2013",
      "Leistungszeitraum Juli 2026",
    ],
    regularLines: [
      "Serverbetrieb, technische",
      "Bereitstellung, regelm\u00e4\u00dfige",
      "Backups, Datensicherung und",
      "Systemerhalt f\u00fcr den laufenden",
      "Website- und Admin-Panel-",
      "Betrieb.",
    ],
  },

  total: {
    labelX: 358.866,
    valueX: 487.026,
    y: 525.369,
    size: 12,
    label: "Gesamtpreis:",
    value: "29,00\u20ac",
  },

  thankYou: {
    x: 70.866,
    y: 592.101,
    size: 10,
    lineHeight: 14,
    lines: [
      "Wir bedanken uns f\u00fcr die Zusammenarbeit und stehen Ihnen bei weiteren Anliegen gerne zur",
      "Verf\u00fcgung.",
    ],
  },

  closing: { x: 70.866, y: 630.101, text: "Mit freundlichen Gr\u00fc\u00dfen", size: 10 },

  legalNotice: {
    x: 87.302,
    y: 726.101,
    text:
      "Als Kleinunternehmer im Sinne von \u00a7 19 Abs. 1 UStG wird keine Umsatzsteuer berechnen.",
    size: 10,
  },

  hairlines: {
    x1: 18.142,
    x2: 25.242,
    stroke: 0.25,
    color: COLORS.black,
    yPositions: [246.614, 420.945, 544.252],
  },

  footer: {
    y: 767.128,
    height: 74.872,
    background: COLORS.primary,
    textY: 777.704,
    fontSize: 10,
    color: "#FFFFFF",
    columns: [
      {
        x: 14.0,
        y: 777.704,
        lines: [
          "Dienstleister im Bereich",
          "Marketing und Werbung",
          "Hansastra\u00dfe 34",
          "59525 Unna",
        ],
      },
      {
        x: 134.087,
        y: 778.068,
        lines: [
          "Telefon: +2303 3349877",
          "Handy:  +49 176 23250935",
          "Email: info@agiworks.de",
        ],
      },
      {
        x: 273.614,
        y: 777.704,
        lines: [
          "Inhaber: Kevin Blazevic",
          "Steuern.: 316/5024/3564",
        ],
      },
      {
        x: 406.681,
        y: 777.704,
        lines: [
          "Sparkasse UnnaKamen",
          "IBAN: DE26 4435 0060 1000 7538 79",
          "BIC: WELADE1UNN",
        ],
      },
    ],
  },
} as const;
