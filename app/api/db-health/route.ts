import { NextResponse } from "next/server";
import { isDbEnabled, getSql, ensureSchema, getMigrationStatus } from "@/lib/pg";

export const dynamic = "force-dynamic";

/**
 * Leichter Verbindungs-Check. Gibt keine Secrets aus — nur Status und eine
 * sanitisierte Fehlermeldung, um Connection-Probleme schnell zu erkennen.
 */
export async function GET() {
  if (!isDbEnabled()) {
    return NextResponse.json(
      { envPresent: false, connected: false, schema: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json(
      { envPresent: true, connected: false, schema: false, error: "client_init_failed" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await sql`SELECT 1 AS ok`;
    const schema = await ensureSchema();
    const migrations = getMigrationStatus();
    return NextResponse.json(
      {
        envPresent: true,
        connected: true,
        schema,
        migrations: migrations
          ? {
              appliedCount: migrations.applied.length,
              pending: migrations.pending,
              complete: migrations.complete,
              // Nur ID und Name — die Fehlermeldung kann Schemadetails enthalten.
              failed: migrations.failed
                ? { id: migrations.failed.id, name: migrations.failed.name }
                : null,
            }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: any) {
    const msg = String(error?.message || error || "unknown");
    // Nur eine knappe, secret-freie Fehlerklasse zurückgeben.
    const sanitized = msg.slice(0, 160);
    return NextResponse.json(
      { envPresent: true, connected: false, schema: false, error: sanitized },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
