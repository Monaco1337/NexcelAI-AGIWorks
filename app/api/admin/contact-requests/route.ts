/**
 * GET /api/admin/contact-requests
 * 
 * BACKEND-DATENBANK - Komplett im Backend verankert
 * Lädt alle Kontaktanfragen aus Backend-DB (In-Memory + File)
 * 
 * Datenfluss:
 * Kontaktformular ➜ Server Action ➜ Backend-DB ➜ /api/admin/contact-requests ➜ Admin-Panel
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getAllPosts } from "@/lib/contact-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Admin-Authentifizierung prüfen
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lade alle Posts aus Contact-Store
    const contacts = getAllPosts();

    // Transformiere in Admin-Dashboard-Format
    const transformedContacts = contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.vorname} ${contact.nachname}`,
      email: contact.email,
      telefon: contact.telefon || undefined,
      unternehmen: contact.unternehmen || undefined,
      betreff: contact.betreff,
      nachricht: contact.nachricht,
      createdAt: contact.createdAt,
      read: contact.read,
      archived: contact.archived,
      status: contact.status,
    }));

    console.log(`✅ [CONTACT REQUESTS API] Loaded ${transformedContacts.length} contacts from Backend-DB`);

    return NextResponse.json(
      { contacts: transformedContacts },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [CONTACT REQUESTS API] Error fetching contacts:", errorMessage);
    console.error("❌ [CONTACT REQUESTS API] Full Error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch contact requests", contacts: [] },
      { status: 500 }
    );
  }
}

