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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_targets_no_chain
        ON sales_target_companies (lead_score DESC)
        WHERE deleted_at IS NULL AND is_chain = FALSE
    `;

    // Bereits geladene Datensätze nachträglich kennzeichnen. Das
    // Markensignal steckt bei ihnen im Rohpayload der Quelle.
    await sql`
      UPDATE sales_target_companies t
         SET is_chain = TRUE
       WHERE t.deleted_at IS NULL
         AND t.is_chain = FALSE
         AND EXISTS (
           SELECT 1 FROM sales_target_sources s
            WHERE s.target_id = t.id
              AND s.raw_payload::text ILIKE '%brand%'
         )
    `;
  },
};
