/**
 * Katalog-Scopes und deterministische bbox-Segmentierung.
 *
 * Ein Katalog-Scope ist eine benannte Region (aktuell Nordrhein-
 * Westfalen), die in Segmente zerlegt wird. Ein Segment ist genau ein
 * Arbeitspaket: eine Bounding-Box mal eine OSM-Tag-Achse. Genau ein
 * Segment wird pro `sales_target_search_jobs`-Zeile abgearbeitet, damit
 * jede einzelne Overpass-Query innerhalb des Worker-Zeitbudgets
 * zurückkommt.
 *
 * Die Zerlegung ist rein deterministisch: gleicher Scope erzeugt immer
 * dieselben Segmente mit denselben Schlüsseln. Dadurch ist der Aufbau
 * fortsetzbar (Checkpoint = Menge der erledigten Segment-Keys) und
 * idempotent (ein erneuter Aufruf erzeugt keine Duplikate).
 */

import { OVERPASS_TAG_AXES } from "../providers/overpassProvider";
import type { DiscoveryBBox } from "../providers/types";

export interface CatalogScope {
  key: string;
  label: string;
  country: string;
  region: string;
  bbox: DiscoveryBBox;
  /** Kantenlänge eines Segments in Grad. Kleiner = mehr, kleinere Queries. */
  stepLat: number;
  stepLng: number;
}

export interface CatalogSegment {
  /** Stabiler Schlüssel: scope + Gitterposition + Achse. */
  key: string;
  scopeKey: string;
  bbox: DiscoveryBBox;
  tagAxis: string;
  row: number;
  col: number;
}

/**
 * Nordrhein-Westfalen. Bounding-Box grob nach den Landesgrenzen; die
 * Ecken ragen leicht in Nachbarländer, was unkritisch ist: Treffer
 * ausserhalb NRW sind trotzdem valide DACH-Unternehmen und werden
 * ohnehin über Fingerprints dedupliziert.
 */
export const NRW_SCOPE: CatalogScope = {
  key: "de-nrw",
  label: "Nordrhein-Westfalen",
  country: "DE",
  region: "Nordrhein-Westfalen",
  bbox: { south: 50.32, west: 5.87, north: 52.53, east: 9.46 },
  // ~0.55° Breite x ~0.9° Länge ergibt ein 4x4-Gitter = 16 Kacheln.
  // Gemessen: eine Kachel dieser Größe liefert pro Achse in wenigen
  // Sekunden Ergebnisse und bleibt weit unter dem Overpass-Limit.
  stepLat: 0.5525,
  stepLng: 0.8975,
};

export const CATALOG_SCOPES: CatalogScope[] = [NRW_SCOPE];

export function findScope(key: string): CatalogScope | null {
  return CATALOG_SCOPES.find((s) => s.key === key) ?? null;
}

/**
 * Zerlegt eine Scope-bbox in ein regelmäßiges Gitter.
 *
 * Die Epsilon-Toleranz beim Aufrunden ist notwendig: teilt die
 * Kantenlänge die Scope-Breite exakt, liefert die Gleitkommadivision
 * minimal mehr als den ganzzahligen Wert und `Math.ceil` erzeugt eine
 * zusätzliche Spalte mit Breite null.
 */
const GRID_EPS = 1e-9;

export function tileBBox(scope: CatalogScope): Array<{ bbox: DiscoveryBBox; row: number; col: number }> {
  const tiles: Array<{ bbox: DiscoveryBBox; row: number; col: number }> = [];
  const { south, west, north, east } = scope.bbox;
  const rows = Math.max(1, Math.ceil((north - south) / scope.stepLat - GRID_EPS));
  const cols = Math.max(1, Math.ceil((east - west) / scope.stepLng - GRID_EPS));
  for (let r = 0; r < rows; r++) {
    const tileSouth = round6(south + r * scope.stepLat);
    const tileNorth = r === rows - 1 ? round6(north) : round6(Math.min(north, south + (r + 1) * scope.stepLat));
    if (tileNorth <= tileSouth) continue;
    for (let c = 0; c < cols; c++) {
      const tileWest = round6(west + c * scope.stepLng);
      const tileEast = c === cols - 1 ? round6(east) : round6(Math.min(east, west + (c + 1) * scope.stepLng));
      if (tileEast <= tileWest) continue;
      tiles.push({
        row: r,
        col: c,
        bbox: { south: tileSouth, north: tileNorth, west: tileWest, east: tileEast },
      });
    }
  }
  return tiles;
}

/**
 * Vollständige, deterministisch geordnete Segmentliste eines Scopes.
 * Reihenfolge: Achse-für-Achse über alle Kacheln. Dadurch liefert schon
 * der erste Durchlauf einer Achse landesweite Abdeckung statt nur eine
 * Ecke der Region — die Liste in der UI füllt sich gleichmäßig.
 */
export function buildSegments(scope: CatalogScope): CatalogSegment[] {
  const tiles = tileBBox(scope);
  const segments: CatalogSegment[] = [];
  for (const axis of OVERPASS_TAG_AXES) {
    for (const tile of tiles) {
      segments.push({
        key: segmentKey(scope.key, tile.row, tile.col, axis),
        scopeKey: scope.key,
        bbox: tile.bbox,
        tagAxis: axis,
        row: tile.row,
        col: tile.col,
      });
    }
  }
  return segments;
}

export function segmentKey(scopeKey: string, row: number, col: number, axis: string): string {
  return `${scopeKey}/r${row}c${col}/${axis}`;
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
