/**
 * Cold-Start-Bewertung und Spitzenklasse A++.
 *
 * Zwei zusammenhängende Änderungen:
 *
 * 1. `pre_score` / `pre_score_class` auf den Firmen. Das ausgereifte
 *    Scoring setzt Anreicherung voraus; bei einem Katalog dieser Größe
 *    bliebe damit praktisch jede Firma unbewertet und der Katalog
 *    unsortierbar. Der Pre-Score entsteht ohne externen Abruf direkt aus
 *    den Discovery-Daten und dient als Reihenfolge für die Anreicherung
 *    sowie als vorläufige Einstufung in der Liste.
 *
 * 2. Die Prüfbedingung auf `priority_class` kannte A++ nicht und hätte
 *    jeden Score dieser Klasse abgewiesen.
 */
import type { Migration } from "../migrationRunner";

export const migration0015: Migration = {
  id: "0015",
  name: "sales_target_prescore",
  up: async (sql) => {
    await sql`
      ALTER TABLE sales_target_companies
        ADD COLUMN IF NOT EXISTS pre_score INTEGER
    `;
    await sql`
      ALTER TABLE sales_target_companies
        ADD COLUMN IF NOT EXISTS pre_score_class TEXT
    `;

    // Sortierschlüssel der Liste, solange kein echter Lead Score
    // vorliegt. Der Teilindex deckt genau diesen Fall ab.
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_targets_prescore
        ON sales_target_companies (pre_score DESC NULLS LAST)
        WHERE deleted_at IS NULL AND is_chain = FALSE
    `;

    /* ── A++ zulassen ────────────────────────────────────────────────
     * Die alte Bedingung listete die erlaubten Klassen einzeln auf.
     * Ohne Anpassung schlägt jedes Speichern eines A++-Scores fehl.
     */
    await sql`
      ALTER TABLE sales_target_lead_scores
        DROP CONSTRAINT IF EXISTS sales_target_score_prio
    `;
    await sql`
      ALTER TABLE sales_target_lead_scores
        ADD CONSTRAINT sales_target_score_prio
        CHECK (priority_class IN ('A++','A+','A','B','C','D'))
    `;
  },
};
