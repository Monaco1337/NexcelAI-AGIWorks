/**
 * Trockenlauf des NRW-Katalogs gegen die echte Overpass-API.
 *
 * Fährt dieselbe Segmentierung und denselben Provider wie der
 * Katalog-Runner, dedupliziert mit derselben Fingerprint-Funktion —
 * schreibt aber nichts. Damit laesst sich die Mengenerwartung
 * (mindestens 5.000 eindeutige Firmen) unabhaengig von der Datenbank
 * belegen und die Ausbeute je Segment messen.
 *
 * Aufruf: npx tsx scripts/sales/catalog-dryrun.ts [maxSegmente]
 */
import { OverpassProvider } from "../../lib/sales/targets/providers/overpassProvider";
import { buildSegments, NRW_SCOPE } from "../../lib/sales/targets/catalog/scope";
import { buildFingerprint } from "../../lib/sales/targets/entityResolution";
import { ALL_CATEGORIES } from "../../lib/sales/targets/categoryMap";
import { domainFromUrl } from "../../lib/sales/targets/websiteAudit";

const maxSegments = Number(process.argv[2] || "0") || Number.POSITIVE_INFINITY;

async function main(): Promise<void> {
  const segments = buildSegments(NRW_SCOPE).slice(0, maxSegments);
  const provider = new OverpassProvider();

  const unique = new Map<string, { name: string; phone: boolean; site: boolean; cat: string | null }>();
  const perAxis = new Map<string, number>();
  let received = 0;
  let failed = 0;

  console.log(`Trockenlauf: ${segments.length} Segmente über ${NRW_SCOPE.label}\n`);

  for (const [i, seg] of segments.entries()) {
    const t0 = Date.now();
    let n = 0;
    let err: string | null = null;
    try {
      const res = await provider.discover({
        city: null,
        country: NRW_SCOPE.country,
        centerLat: null,
        centerLng: null,
        radiusKm: 0,
        industries: [],
        categories: [],
        limit: 12_000,
        depth: "STANDARD",
        bbox: seg.bbox,
        tagAxis: seg.tagAxis,
      });
      n = res.companies.length;
      received += n;
      if (n === 0) err = res.providerLogs.find((l) => !l.ok)?.error ?? "leer";
      for (const stub of res.companies) {
        const fp = buildFingerprint({
          name: stub.name,
          website: stub.website ?? null,
          domain: stub.domain ?? domainFromUrl(stub.website ?? null),
          phone: stub.phone ?? null,
          addressLine: stub.addressLine ?? null,
          postalCode: stub.postalCode ?? null,
          city: stub.city ?? null,
          country: stub.country ?? "DE",
          googlePlaceId: stub.googlePlaceId ?? null,
        }).primary;
        if (!unique.has(fp)) {
          unique.set(fp, {
            name: stub.name,
            phone: Boolean(stub.phone),
            site: Boolean(stub.website),
            cat: stub.industry ?? null,
          });
        }
      }
      perAxis.set(seg.tagAxis, (perAxis.get(seg.tagAxis) ?? 0) + n);
    } catch (e) {
      err = (e as Error).message;
      failed += 1;
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(
      `[${String(i + 1).padStart(3)}/${segments.length}] ${seg.key.padEnd(28)} ` +
        `${String(n).padStart(5)} roh  ${String(unique.size).padStart(6)} eindeutig  ${secs}s` +
        (err ? `  — ${err.slice(0, 90)}` : ""),
    );
  }

  const all = [...unique.values()];
  const withPhone = all.filter((c) => c.phone).length;
  const withSite = all.filter((c) => c.site).length;
  const reachable = all.filter((c) => c.phone || c.site).length;
  // Das Quality Gate prueft Zugehoerigkeit zur kanonischen Liste; "Sonstige"
  // zaehlt dort mit. Der zweite Wert zeigt, wie viel davon wirklich trennscharf ist.
  const canonical = all.filter((c) => c.cat && (ALL_CATEGORIES as readonly string[]).includes(c.cat)).length;
  const categorized = all.filter((c) => c.cat && c.cat !== "Sonstige").length;
  const p = (n: number) => (all.length ? `${Math.round((n / all.length) * 100)}%` : "0%");

  console.log("\n=== Ergebnis ===");
  console.log(`Roh empfangen:   ${received}`);
  console.log(`Eindeutig:       ${all.length}`);
  console.log(`Dubletten:       ${received - all.length}`);
  console.log(`Segmente Fehler: ${failed}`);
  console.log(`Telefon:         ${withPhone} (${p(withPhone)})`);
  console.log(`Website:         ${withSite} (${p(withSite)})`);
  console.log(`Erreichbar:      ${reachable} (${p(reachable)})`);
  console.log(`Kanonisch:       ${canonical} (${p(canonical)})   <- Gate-Kriterium, Soll 95%`);
  console.log(`davon trennscharf: ${categorized} (${p(categorized)})`);
  console.log(`\nQuality Gate (>= 5.000 eindeutig): ${all.length >= 5000 ? "ERFUELLT" : "NICHT ERFUELLT"}`);

  console.log("\n=== Rohtreffer je Achse ===");
  for (const [axis, n] of [...perAxis.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`${axis.padEnd(14)} ${n}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
