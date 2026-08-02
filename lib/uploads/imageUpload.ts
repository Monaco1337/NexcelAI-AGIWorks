/**
 * Gemeinsame Validierung für Bild-Uploads.
 *
 * Die Cover-Upload-Routen für Systemkarten und Referenzen nahmen bislang jede
 * Datei in beliebiger Größe entgegen und schrieben sie direkt als BYTEA in die
 * Datenbank. Ohne Grenze ist das sowohl ein Kostenrisiko als auch ein
 * Angriffsvektor: eine einzige große Datei kann die Funktionslaufzeit
 * ausreizen und die Tabelle aufblähen.
 *
 * Die Werte entsprechen denen, die die Logo-Route bereits verwendet — damit
 * verhalten sich alle Upload-Endpunkte gleich.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
] as const;

/**
 * Prüft eine hochgeladene Datei. Gibt `null` zurück, wenn sie in Ordnung ist,
 * sonst eine Meldung, die direkt an den Client gehen kann.
 */
export function validateImageUpload(file: File | null): string | null {
  if (!file) return "Keine Datei übermittelt";
  if (file.size === 0) return "Datei ist leer";
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
    return `Datei ist zu groß (maximal ${mb} MB)`;
  }
  const type = (file.type || "").toLowerCase();
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) {
    return "Nicht unterstütztes Dateiformat";
  }
  return null;
}
