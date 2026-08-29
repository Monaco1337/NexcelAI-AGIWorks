/**
 * Abnahme der Cold-Start-Bewertung direkt aus PostgreSQL.
 *
 * Wendet ausstehende Migrationen an und berichtet, ob die Spalten
 * vorhanden sind, A++ erlaubt ist und wie sich die Firmen auf die
 * Prioritaetsklassen verteilen.
 *
 * Aufruf: DATABASE_URL=... npx tsx scripts/db/prescore-status.ts
 */
import postgres from "postgres";
import { runMigrations } from "../../lib/db/migrationRunner";
import { MIGRATIONS } from "../../lib/db/migrations";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("DATABASE_URL fehlt");
  process.exit(1);
}
const sql = postgres(url, { ssl: "require", prepare: false, max: 2 });

async function main() {
  const status = await runMigrations(sql, MIGRATIONS);
  console.log(`Migrationen: ${status.applied.length} neu angewendet`);
  if (status.applied.length) console.log(`  ${status.applied.join(", ")}`);

  const cols = await sql<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
     WHERE table_name = 'sales_target_companies'
       AND column_name IN ('pre_score', 'pre_score_class')
  `;
  console.log(`Spalten: ${cols.map((c) => c.column_name).join(", ") || "FEHLEN"}`);

  const chk = await sql<Array<{ d: string }>>`
    SELECT pg_get_constraintdef(oid) AS d
      FROM pg_constraint WHERE conname = 'sales_target_score_prio'
  `;
  console.log(`A++ zulaessig: ${String(chk[0]?.d ?? "").includes("A++") ? "ja" : "nein"}`);

  const tot = await sql<Array<{ n: number; scored: number; chains: number }>>`
    SELECT COUNT(*)::int AS n,
           COUNT(pre_score)::int AS scored,
           COUNT(*) FILTER (WHERE is_chain)::int AS chains
      FROM sales_target_companies WHERE deleted_at IS NULL
  `;
  console.log(
    `Firmen: ${tot[0].n} gesamt, ${tot[0].scored} bewertet, ${tot[0].chains} Ketten`
  );

  const dist = await sql<Array<{ cls: string | null; n: number }>>`
    SELECT pre_score_class AS cls, COUNT(*)::int AS n
      FROM sales_target_companies
     WHERE deleted_at IS NULL AND is_chain = FALSE
     GROUP BY 1 ORDER BY 1
  `;
  if (dist.length) {
    console.log("Verteilung (ohne Ketten):");
    for (const r of dist) console.log(`  ${(r.cls ?? "offen").padEnd(6)} ${r.n}`);
  }
  await sql.end();
}

main().catch((e) => {
  console.error("FEHLER:", e instanceof Error ? e.message : e);
  process.exit(1);
});
