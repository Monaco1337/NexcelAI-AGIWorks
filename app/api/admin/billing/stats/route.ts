/**
 * Kennzahlen für das Rechnungs-Dashboard.
 *
 * Liefert in einer Antwort die Zahlen für die KPI-Karten und die für die
 * Oberfläche zwingend benötigten Auswahllisten (Aussteller inkl. nächster
 * Nummer, Projekte). Damit lädt die Startseite eines Rechnungsbereichs mit
 * einem Roundtrip, nicht mit vier.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getInvoiceStats } from "@/lib/billing/invoicesStore";
import { listIssuers, peekNextInvoiceNumber } from "@/lib/billing/issuersStore";
import { listProjectOptions } from "@/lib/projects/projectsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;

  try {
    const [stats, issuers, projects] = await Promise.all([
      getInvoiceStats(),
      listIssuers(),
      listProjectOptions(),
    ]);

    const issuerInfo = await Promise.all(
      issuers.map(async (iss) => {
        const seq = await peekNextInvoiceNumber(iss.id);
        return {
          id: iss.id,
          key: iss.key,
          label: iss.brandLabel,
          accent: iss.accentColor,
          taxRegime: iss.taxRegime,
          currency: iss.defaultCurrency,
          templateKey: iss.templateKey,
          nextNumber: seq.next,
          lastNumber: seq.last,
          configWarnings: iss.configWarnings,
        };
      })
    );

    return NextResponse.json({ stats, issuers: issuerInfo, projects });
  } catch (error) {
    console.error("[BILLING] Stats fehlgeschlagen:", error);
    return NextResponse.json({ error: "stats_failed" }, { status: 500 });
  }
}
