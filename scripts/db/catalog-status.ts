/**
 * Katalogstand direkt aus PostgreSQL berichten.
 *
 * Dient der Abnahme des NRW-Zielkundenkatalogs: Firmenzahl, Publish-State,
 * Segmentfortschritt und die haeufigsten Segmentfehler. Liest nur, schreibt nie.
 *
 * Aufruf: DATABASE_URL=... npx tsx scripts/db/catalog-status.ts
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("DATABASE_URL fehlt");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", prepare: false, max: 2 });

function pct(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

async function main(): Promise<void> {
  const [companies] = await sql<{ total: string; phone: string; site: string; cat: string }[]>`
    SELECT COUNT(*)::text AS total,
           COUNT(*) FILTER (WHERE phone IS NOT NULL)::text AS phone,
           COUNT(*) FILTER (WHERE website IS NOT NULL)::text AS site,
           COUNT(*) FILTER (WHERE category IS NOT NULL AND category <> 'Sonstige')::text AS cat
      FROM sales_target_companies
     WHERE deleted_at IS NULL
  `;

  const total = Number(companies?.total ?? 0);
  console.log("=== Firmen in PostgreSQL ===");
  console.log(`Gesamt:     ${total}`);
  console.log(`Telefon:    ${companies?.phone} (${pct(Number(companies?.phone), total)})`);
  console.log(`Website:    ${companies?.site} (${pct(Number(companies?.site), total)})`);
  console.log(`Kategorie:  ${companies?.cat} (${pct(Number(companies?.cat), total)})`);

  const runs = await sql<Record<string, unknown>[]>`
    SELECT id, scope_key, status, publish_state, discovered_count, target_count,
           published_at, created_at
      FROM sales_target_area_scans
     WHERE scope_key IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 3
  `;
  console.log("\n=== Katalog-Laeufe ===");
  for (const r of runs) {
    console.log(
      `${String(r.scope_key)} | ${String(r.status)} | ${String(r.publish_state)} | ` +
        `gefunden ${String(r.discovered_count)} | ziel ${String(r.target_count)} | ` +
        `published ${r.published_at ? String(r.published_at) : "-"}`,
    );
  }

  const activeId = runs[0]?.id as string | undefined;
  if (activeId) {
    const jobs = await sql<{ status: string; n: string }[]>`
      SELECT status, COUNT(*)::text AS n
        FROM sales_target_search_jobs
       WHERE area_scan_id = ${activeId}
       GROUP BY status
       ORDER BY status
    `;
    console.log("\n=== Segmente ===");
    for (const j of jobs) console.log(`${j.status}: ${j.n}`);

    const errs = await sql<{ error: string; n: string }[]>`
      SELECT COALESCE(error, '(kein Text)') AS error, COUNT(*)::text AS n
        FROM sales_target_search_jobs
       WHERE area_scan_id = ${activeId} AND error IS NOT NULL
       GROUP BY error
       ORDER BY COUNT(*) DESC
       LIMIT 5
    `;
    if (errs.length > 0) {
      console.log("\n=== Haeufigste Segmentfehler ===");
      for (const e of errs) console.log(`${e.n}x  ${e.error.slice(0, 220)}`);
    }
  }

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
