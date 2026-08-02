/** Kennzahlen für die Kopfzeile des Ticket Control Centers. */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getTicketStats } from "@/lib/tickets/ticketsStore";
import { listAssignableUsers } from "@/lib/identity/usersStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const brand = request.nextUrl.searchParams.get("brand") ?? undefined;

  // Kennzahlen und zuweisbare Personen kommen gemeinsam: die Oberfläche
  // braucht beides beim ersten Aufbau, zwei Aufrufe wären ein unnötiger
  // zweiter Roundtrip.
  const [stats, users] = await Promise.all([
    getTicketStats(brand),
    listAssignableUsers(),
  ]);

  return NextResponse.json({ stats, users });
}
