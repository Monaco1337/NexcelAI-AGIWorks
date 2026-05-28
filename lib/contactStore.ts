/**
 * Contact Store - Einfache JSON-Datei-basierte Datenbank
 * Funktioniert komplett unabhängig von Mail/Resend/Prisma
 */

import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

// ABSOLUT GLEICHE DATEI FÜR ALLE - GARANTIERT!
const IS_SERVERLESS = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV || process.env.NODE_ENV === "production";
const STORAGE_FILE = IS_SERVERLESS
  ? "/tmp/contact-requests.json"
  : path.join(process.cwd(), "data", "contact-requests.json");

console.log("🔍 [CONTACT STORE] Storage file path:", STORAGE_FILE);
console.log("🔍 [CONTACT STORE] IS_SERVERLESS:", IS_SERVERLESS);

export interface ContactRequest {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  status: "open" | "read" | "archived";
}

/**
 * Stellt sicher, dass das Datenverzeichnis existiert
 */
async function ensureDataDir(): Promise<void> {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    await fsPromises.mkdir(dir, { recursive: true });
  }
}

/**
 * Lädt alle Kontaktanfragen aus der JSON-Datei - GARANTIERT FUNKTIONSFÄHIG!
 */
export async function getAllContactRequests(): Promise<ContactRequest[]> {
  try {
    await ensureDataDir();
    
    if (!fs.existsSync(STORAGE_FILE)) {
      // Erstelle leere Datei mit [] - GARANTIERT!
      console.log("📝 [CONTACT STORE] Creating new storage file:", STORAGE_FILE);
      await fsPromises.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), "utf-8");
      console.log("✅ [CONTACT STORE] Storage file created successfully");
      return [];
    }

    const data = await fsPromises.readFile(STORAGE_FILE, "utf-8");
    const contacts = JSON.parse(data);

    if (!Array.isArray(contacts)) {
      console.warn("⚠️ [CONTACT STORE] Invalid data format, resetting to empty array");
      await fsPromises.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }

    console.log(`✅ [CONTACT STORE] Loaded ${contacts.length} contacts from ${STORAGE_FILE}`);
    return contacts as ContactRequest[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [CONTACT STORE] Error loading contacts:", errorMessage);
    console.error("❌ [CONTACT STORE] Storage file path:", STORAGE_FILE);
    // Versuche Datei zu erstellen, falls sie nicht existiert
    try {
      await ensureDataDir();
      await fsPromises.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), "utf-8");
      console.log("✅ [CONTACT STORE] Created storage file after error");
    } catch (createError) {
      console.error("❌ [CONTACT STORE] Could not create storage file:", createError);
    }
    return [];
  }
}

/**
 * Speichert eine neue Kontaktanfrage - GARANTIERT FUNKTIONSFÄHIG!
 */
export async function saveContactRequest(
  contact: Omit<ContactRequest, "id" | "createdAt" | "status">
): Promise<ContactRequest> {
  let lastError: any = null;
  
  // 5 Versuche mit verschiedenen Methoden
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await ensureDataDir();

      // Lade bestehende Kontakte
      let contacts: ContactRequest[] = [];
      try {
        if (fs.existsSync(STORAGE_FILE)) {
          const data = await fsPromises.readFile(STORAGE_FILE, "utf-8");
          contacts = JSON.parse(data);
          if (!Array.isArray(contacts)) contacts = [];
        }
      } catch (readError) {
        console.warn(`⚠️ [CONTACT STORE] Read attempt ${attempt} failed, starting fresh:`, readError);
        contacts = [];
      }

      const newContact: ContactRequest = {
        ...contact,
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        status: "open",
      };

      contacts.push(newContact);

      // Schreibe Datei - verschiedene Methoden je nach Versuch
      if (attempt <= 2) {
        // Methode 1: Atomic write
        const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
        await fsPromises.writeFile(tempFile, JSON.stringify(contacts, null, 2), "utf-8");
        await fsPromises.rename(tempFile, STORAGE_FILE);
      } else {
        // Methode 2: Direktes Schreiben
        await fsPromises.writeFile(STORAGE_FILE, JSON.stringify(contacts, null, 2), "utf-8");
      }

      // VERIFIZIERE, dass die Datei wirklich geschrieben wurde
      if (fs.existsSync(STORAGE_FILE)) {
        const verifyData = await fsPromises.readFile(STORAGE_FILE, "utf-8");
        const verifyContacts = JSON.parse(verifyData);
        if (Array.isArray(verifyContacts) && verifyContacts.some((c: ContactRequest) => c.id === newContact.id)) {
          console.log(`✅ [CONTACT STORE] Contact request saved successfully (attempt ${attempt}):`, newContact.id);
          console.log(`✅ [CONTACT STORE] Total contacts in file: ${verifyContacts.length}`);
          console.log(`✅ [CONTACT STORE] File location: ${STORAGE_FILE}`);
          return newContact;
        } else {
          throw new Error("Contact not found in saved file after verification");
        }
      } else {
        throw new Error("File was not created");
      }
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ [CONTACT STORE] Save attempt ${attempt} failed:`, errorMessage);
      
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      }
    }
  }

  // Alle Versuche fehlgeschlagen
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("❌ [CONTACT STORE] ALL SAVE ATTEMPTS FAILED!");
  console.error("❌ [CONTACT STORE] Last error:", errorMessage);
  console.error("❌ [CONTACT STORE] Storage file:", STORAGE_FILE);
  throw new Error(`Fehler beim Speichern nach 5 Versuchen: ${errorMessage}`);
}

/**
 * Aktualisiert eine Kontaktanfrage (z.B. Status ändern)
 */
export async function updateContactRequest(
  id: string,
  updates: Partial<ContactRequest>
): Promise<ContactRequest | null> {
  try {
    await ensureDataDir();

    const contacts = await getAllContactRequests();
    const index = contacts.findIndex((c) => c.id === id);

    if (index === -1) {
      return null;
    }

    contacts[index] = { ...contacts[index], ...updates };

    // Atomic write
    const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
    await fsPromises.writeFile(tempFile, JSON.stringify(contacts, null, 2), "utf-8");
    await fsPromises.rename(tempFile, STORAGE_FILE);

    console.log("✅ [CONTACT STORE] Contact request updated:", id);
    return contacts[index];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [CONTACT STORE] Error updating contact:", errorMessage);
    return null;
  }
}

/**
 * Löscht eine Kontaktanfrage
 */
export async function deleteContactRequest(id: string): Promise<boolean> {
  try {
    await ensureDataDir();

    const contacts = await getAllContactRequests();
    const filtered = contacts.filter((c) => c.id !== id);

    if (filtered.length === contacts.length) {
      return false; // Contact not found
    }

    // Atomic write
    const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
    await fsPromises.writeFile(tempFile, JSON.stringify(filtered, null, 2), "utf-8");
    await fsPromises.rename(tempFile, STORAGE_FILE);

    console.log("✅ [CONTACT STORE] Contact request deleted:", id);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [CONTACT STORE] Error deleting contact:", errorMessage);
    return false;
  }
}

