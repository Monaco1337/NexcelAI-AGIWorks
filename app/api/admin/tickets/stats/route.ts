/** Kennzahlen für die Kopfzeile des Ticket Control Centers. */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getTicketStats } from "@/lib/tickets/ticketsStore";
import { listAssignableUsers } from "@/lib/identity/usersStore";
import { listProjectOptions } from "@/lib/projects/projectsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const brand = request.nextUrl.searchParams.get("brand") ?? undefined;

  // Kennzahlen, zuweisbare Personen und Projekte kommen gemeinsam: die
  // Oberfläche braucht alle drei beim ersten Aufbau, getrennte Aufrufe wären
  // nur zusätzliche Wartezeit.
  const [stats, users, projects] = await Promise.all([
    getTicketStats(brand),
    listAssignableUsers(),
    listProjectOptions(),
  ]);

  return NextResponse.json({ stats, users, projects });
}
