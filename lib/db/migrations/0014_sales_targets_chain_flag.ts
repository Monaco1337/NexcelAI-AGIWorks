/**
 * Kettenfilialen kennzeichnen.
 *
 * Der Zielkundenkatalog richtet sich an Mittelstand und kleine Betriebe.
 * Filialen überregionaler Ketten (Lidl, KiK, TEDi, dm …) entscheiden vor
 * Ort nichts: Budget, Website und Software kommen aus der Zentrale. Sie
 * machen rund 14 Prozent der OSM-Betriebe aus und verwässern jede
 * Priorisierung.
 *
 * Sie werden markiert statt gelöscht — die Zuordnung bleibt damit
 * nachvollziehbar und umkehrbar, und ein späterer Anwendungsfall
 * (etwa Franchisenehmer) kann sie wieder einbeziehen.
 *
 * Hinweis zur Korrektur: eine frühere Fassung dieser Migration griff auf
 * `sales_target_companies.lead_score` und `sales_target_sources.raw_payload`
 * zu. Beide Spalten gibt es nicht — Scores liegen in
 * `sales_target_lead_scores`, und die Quellentabelle führt kein
 * Rohpayload. Die Migration schlug deshalb bei jedem Anlauf fehl und
 * blockierte als Kettenglied alle folgenden. Sie war zu keinem Zeitpunkt
 * angewendet, weshalb die Datei korrigiert und nicht ersetzt wurde.
 */
import type { Migration } from "../migrationRunner";

export const migration0014: Migration = {
  id: "0014",
  name: "sales_target_chain_flag",
  up: async (sql) => {
    await sql`
      ALTER TABLE sales_target_companies
        ADD COLUMN IF NOT EXISTS is_chain BOOLEAN NOT NULL DEFAULT FALSE
    `;

    // Die Liste blendet Ketten standardmäßig aus; der Teilindex hält
    // genau diese Abfrage schnell, ohne den Schreibpfad zu belasten.
    // Sortiert nach updated_at, weil die Liste darauf zurückfällt.
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_targets_no_chain
        ON sales_target_companies (updated_at DESC)
        WHERE deleted_at IS NULL AND is_chain = FALSE
    `;

    /*
     * Bereits geladene Datensätze nachträglich kennzeichnen.
     *
     * Das Markensignal steht in `tags` als `brand:<name>`, geschrieben
     * beim Import aus den Quellmerkmalen. Bewusst kein Textvergleich
     * über den gesamten Datensatz: ein `ILIKE '%brand%'` würde auch
     * eine Adresse wie „Brandhofstraße" treffen und den Betrieb
     * fälschlich als Kette aus der Liste nehmen.
     *
     * Datensätze aus früheren Läufen tragen das Signal noch nicht; sie
     * bleiben FALSE, statt geraten zu werden.
     */
    await sql`
      UPDATE sales_target_companies t
         SET is_chain = TRUE
       WHERE t.deleted_at IS NULL
         AND t.is_chain = FALSE
         AND EXISTS (
           SELECT 1 FROM unnest(t.tags) AS tag
            WHERE tag LIKE 'brand:%'
         )
    `;
  },
};
