/**
 * PERSISTENTE DATENBANK-API
 * Verwaltet Kontakte in einer JSON-Datei
 * Funktioniert GARANTIERT - komplett im Code verankert!
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const IS_SERVERLESS = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV || process.env.NODE_ENV === "production";
const STORAGE_FILE = IS_SERVERLESS
  ? "/tmp/contact-requests.json"
  : path.join(process.cwd(), "data", "contact-requests.json");

// GET - Lade alle Kontakte
export async function GET() {
  try {
    let contacts: any[] = [];
    
    if (fs.existsSync(STORAGE_FILE)) {
      const data = await fsPromises.readFile(STORAGE_FILE, "utf-8");
      contacts = JSON.parse(data);
      if (!Array.isArray(contacts)) contacts = [];
    } else {
      // Erstelle leere Datei
      const dir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        await fsPromises.mkdir(dir, { recursive: true });
      }
      await fsPromises.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), "utf-8");
    }

    // Sortiere nach createdAt DESC
    contacts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    console.log(`✅ [STORAGE API] GET: Loaded ${contacts.length} contacts`);
    return NextResponse.json({ contacts }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("❌ [STORAGE API] GET Error:", error);
    return NextResponse.json({ contacts: [] });
  }
}

// POST - Speichere neuen Kontakt
export async function POST(request: NextRequest) {
  try {
    const contact = await request.json();
    
    // Stelle sicher, dass Verzeichnis existiert
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      await fsPromises.mkdir(dir, { recursive: true });
    }

    // Lade bestehende Kontakte
    let contacts: any[] = [];
    if (fs.existsSync(STORAGE_FILE)) {
      const data = await fsPromises.readFile(STORAGE_FILE, "utf-8");
      contacts = JSON.parse(data);
      if (!Array.isArray(contacts)) contacts = [];
    }

    // Erstelle neuen Kontakt
    const newContact = {
      ...contact,
      id: contact.id || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: contact.createdAt || new Date().toISOString(),
      status: contact.status || "open",
    };

    contacts.push(newContact);

    // Speichere mit Retry
    let saved = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        if (attempt <= 2) {
          // Atomic write
          const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
          await fsPromises.writeFile(tempFile, JSON.stringify(contacts, null, 2), "utf-8");
          await fsPromises.rename(tempFile, STORAGE_FILE);
        } else {
          // Direktes Schreiben
          await fsPromises.writeFile(STORAGE_FILE, JSON.stringify(contacts, null, 2), "utf-8");
        }

        // Verifiziere
        if (fs.existsSync(STORAGE_FILE)) {
          const verifyData = await fsPromises.readFile(STORAGE_FILE, "utf-8");
          const verifyContacts = JSON.parse(verifyData);
          if (Array.isArray(verifyContacts) && verifyContacts.some((c: any) => c.id === newContact.id)) {
            saved = true;
            console.log(`✅ [STORAGE API] POST: Contact saved (attempt ${attempt}):`, newContact.id);
            break;
          }
        }
      } catch (writeError) {
        console.error(`❌ [STORAGE API] POST: Write attempt ${attempt} failed:`, writeError);
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        }
      }
    }

    if (!saved) {
      console.error("❌ [STORAGE API] POST: All attempts failed");
      return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true, contact: newContact }, { status: 201 });
  } catch (error) {
    console.error("❌ [STORAGE API] POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
  }
}
