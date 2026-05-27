/**
 * STANDALONE Datenbank-Lösung - Keine Abhängigkeiten!
 * Funktioniert überall: Lokal, Production, Serverless
 */

import fs from "fs";
import path from "path";

// Prüfe ob wir in Production auf Vercel sind
const IS_SERVERLESS = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV || process.env.NODE_ENV === "production";
const DATA_DIR = IS_SERVERLESS 
  ? "/tmp/data" 
  : path.join(process.cwd(), "data");

// Database Client (lazy load) - unterstützt Vercel KV und Upstash Redis
let dbClient: any = null;

/**
 * Initialisiert Datenbank-Client (Vercel KV oder Upstash Redis)
 */
async function getDBClient() {
  if (!IS_SERVERLESS) {
    return null; // Nicht auf Vercel, verwende JSON
  }

  if (!dbClient) {
    // Versuche zuerst Vercel KV
    try {
      const { kv: vercelKV } = await import("@vercel/kv");
      dbClient = vercelKV;
      try {
        await dbClient.ping();
        console.log("✅ [STANDALONE DB] Vercel KV initialized and connected");
        return dbClient;
      } catch (pingError) {
        console.warn("⚠️ [STANDALONE DB] Vercel KV ping failed, trying Upstash:", pingError);
        dbClient = null;
      }
    } catch (error) {
      console.warn("⚠️ [STANDALONE DB] Vercel KV not available, trying Upstash:", error);
    }

    // Fallback: Versuche Upstash Redis
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = await import("@upstash/redis");
        dbClient = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        console.log("✅ [STANDALONE DB] Upstash Redis initialized");
        return dbClient;
      }
    } catch (error) {
      console.warn("⚠️ [STANDALONE DB] Upstash Redis not available, using JSON fallback:", error);
    }

    return null;
  }

  return dbClient;
}

/**
 * Stellt sicher, dass Datenverzeichnis existiert
 */
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log("✅ [STANDALONE DB] Created data directory:", DATA_DIR);
    }
    
    // Prüfe Schreibrechte (nur lokal, nicht in Serverless)
    if (!IS_SERVERLESS) {
      try {
        fs.accessSync(DATA_DIR, fs.constants.W_OK);
      } catch (accessError) {
        console.error("❌ [STANDALONE DB] Data directory not writable:", DATA_DIR);
        throw new Error(`Data directory is not writable: ${accessError instanceof Error ? accessError.message : String(accessError)}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [STANDALONE DB] Failed to ensure data directory:", errorMessage);
    throw new Error(`Cannot access data directory: ${errorMessage}`);
  }
}

/**
 * Lädt alle Kontakte - funktioniert überall
 */
export async function getAllContacts(): Promise<any[]> {
  // In Serverless: Versuche zuerst API-Storage (funktioniert ohne externe DB)
  if (IS_SERVERLESS) {
    try {
      // Versuche interne API-Route (funktioniert immer in Production)
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      try {
        const response = await fetch(`${baseUrl}/api/contacts-storage`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const contacts = data.contacts || [];
          console.log(`✅ [STANDALONE DB] Loaded ${contacts.length} contacts from API storage`);
          return Array.isArray(contacts) 
            ? contacts.sort((a: any, b: any) => 
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              )
            : [];
        }
      } catch (apiError) {
        console.warn("⚠️ [STANDALONE DB] API storage failed, trying database client:", apiError);
      }
      
      // Versuche Datenbank-Client (Vercel KV oder Upstash)
      try {
        const client = await getDBClient();
        if (client) {
          const contacts = await client.get("contacts") || [];
          console.log(`✅ [STANDALONE DB] Loaded ${contacts.length} contacts from database`);
          return Array.isArray(contacts) ? contacts : [];
        }
      } catch (error) {
        console.warn("⚠️ [STANDALONE DB] Database client failed, using JSON:", error);
      }
    } catch (error) {
      console.warn("⚠️ [STANDALONE DB] All storage methods failed, using JSON:", error);
    }
  }

  // Fallback: JSON-Datei (lokal oder wenn KV nicht verfügbar)
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, "contacts.json");
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const data = fs.readFileSync(filePath, "utf-8");
    const contacts = JSON.parse(data);
    
    return Array.isArray(contacts) 
      ? contacts.sort((a: any, b: any) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
      : [];
  } catch (error) {
    console.error("❌ [STANDALONE DB] Error reading contacts:", error);
    return [];
  }
}

/**
 * Speichert einen Kontakt - funktioniert überall
 */
export async function saveContactStandalone(contact: {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  unternehmen: string;
  betreff: string;
  nachricht: string;
}): Promise<any> {
  const newContact = {
    ...contact,
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    read: false,
    archived: false,
    emailSent: false,
    emailVerified: false,
  };

  // Versuche zuerst API-Route (funktioniert in Production ohne externe DB)
  if (IS_SERVERLESS) {
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      try {
        const response = await fetch(`${baseUrl}/api/contacts-storage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contact),
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("✅ [STANDALONE DB] Contact saved via API storage:", data.contact?.id);
          return data.contact || newContact;
        }
      } catch (apiError) {
        console.warn("⚠️ [STANDALONE DB] API storage failed, trying database client:", apiError);
      }
      
      // Versuche Datenbank-Client (Vercel KV oder Upstash)
      try {
        const client = await getDBClient();
        if (client) {
          const contacts = await getAllContacts();
          contacts.push(newContact);
          await client.set("contacts", contacts);
          console.log("✅ [STANDALONE DB] Contact saved to database:", newContact.id);
          return newContact;
        }
      } catch (error) {
        console.warn("⚠️ [STANDALONE DB] Database client failed, using JSON:", error);
      }
    } catch (error) {
      console.warn("⚠️ [STANDALONE DB] All storage methods failed, using JSON:", error);
    }
  }

  // Fallback: JSON-Datei (lokal) oder /tmp (Serverless)
  try {
    // In Serverless: /tmp ist immer verfügbar
    if (IS_SERVERLESS) {
      // Stelle sicher, dass /tmp/data existiert
      if (!fs.existsSync("/tmp/data")) {
        try {
          fs.mkdirSync("/tmp/data", { recursive: true });
          console.log("✅ [STANDALONE DB] Created /tmp/data directory");
        } catch (e) {
          console.warn("⚠️ [STANDALONE DB] Could not create /tmp/data:", e);
        }
      }
    } else {
      // Lokal: Stelle sicher, dass Verzeichnis existiert
      try {
        ensureDataDir();
      } catch (dirError) {
        console.warn("⚠️ [STANDALONE DB] ensureDataDir failed, trying anyway:", dirError);
      }
    }
    
    // Lade bestehende Kontakte
    const contacts = await getAllContacts();
    contacts.push(newContact);
    
    const filePath = path.join(DATA_DIR, "contacts.json");
    
    // Mehrere Versuche mit Retry
    let writeSuccess = false;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tempPath = `${filePath}.tmp.${Date.now()}`;
        const jsonData = JSON.stringify(contacts, null, 2);
        
        // Schreibe zuerst in temp-Datei
        fs.writeFileSync(tempPath, jsonData, "utf-8");
        
        // Prüfe ob temp-Datei existiert
        if (!fs.existsSync(tempPath)) {
          throw new Error("Temp file was not created");
        }
        
        // Rename (atomic)
        fs.renameSync(tempPath, filePath);
        
        // Prüfe ob finale Datei existiert
        if (!fs.existsSync(filePath)) {
          throw new Error("Final file was not created");
        }
        
        writeSuccess = true;
        console.log(`✅ [STANDALONE DB] Contact saved to JSON (attempt ${attempt}):`, newContact.id);
        console.log(`✅ [STANDALONE DB] File path: ${filePath}`);
        break;
      } catch (writeError: unknown) {
        lastError = writeError instanceof Error ? writeError : new Error(String(writeError));
        console.warn(`⚠️ [STANDALONE DB] Write attempt ${attempt} failed:`, lastError.message);
        console.warn(`⚠️ [STANDALONE DB] File path: ${filePath}, IS_SERVERLESS: ${IS_SERVERLESS}`);
        
        if (attempt < 3) {
          // Warte kurz und versuche Verzeichnis neu zu erstellen
          await new Promise(resolve => setTimeout(resolve, 100));
          try {
            if (IS_SERVERLESS) {
              fs.mkdirSync("/tmp/data", { recursive: true });
            } else {
              ensureDataDir();
            }
          } catch (e) {
            // Ignoriere
          }
        }
      }
    }
    
    if (!writeSuccess) {
      const errorMsg = lastError?.message || "Unknown error";
      console.error("❌ [STANDALONE DB] All write attempts failed:", errorMsg);
      console.error("❌ [STANDALONE DB] Environment:", {
        IS_SERVERLESS,
        DATA_DIR,
        filePath,
        cwd: process.cwd(),
      });
      throw new Error(`Speichern fehlgeschlagen: ${errorMsg}`);
    }
    
    return newContact;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [STANDALONE DB] CRITICAL Error saving contact:", errorMessage);
    console.error("  Contact data:", JSON.stringify(contact, null, 2));
    console.error("  DATA_DIR:", DATA_DIR);
    console.error("  IS_SERVERLESS:", IS_SERVERLESS);
    console.error("  process.cwd():", process.cwd());
    throw new Error(`Kontakt konnte nicht gespeichert werden: ${errorMessage}`);
  }
}

/**
 * Aktualisiert einen Kontakt
 */
export async function updateContactStandalone(
  id: string,
  updates: Partial<{ read: boolean; archived: boolean }>
): Promise<any | null> {
  // Versuche zuerst Datenbank-Client
  if (IS_SERVERLESS) {
    try {
      const client = await getDBClient();
      if (client) {
        const contacts = await getAllContacts();
        const index = contacts.findIndex((c: any) => c.id === id);
        if (index === -1) return null;
        
        contacts[index] = { ...contacts[index], ...updates };
        await client.set("contacts", contacts);
        console.log("✅ [STANDALONE DB] Contact updated in database:", id);
        return contacts[index];
      }
    } catch (error) {
      console.warn("⚠️ [STANDALONE DB] Database client failed, using JSON:", error);
    }
  }

  // Fallback: JSON
  try {
    const contacts = await getAllContacts();
    const index = contacts.findIndex((c: any) => c.id === id);
    if (index === -1) return null;
    
    contacts[index] = { ...contacts[index], ...updates };
    
    ensureDataDir();
    const filePath = path.join(DATA_DIR, "contacts.json");
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    
    fs.writeFileSync(tempPath, JSON.stringify(contacts, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
    
    console.log("✅ [STANDALONE DB] Contact updated in JSON:", id);
    return contacts[index];
  } catch (error) {
    console.error("❌ [STANDALONE DB] Error updating contact:", error);
    return null;
  }
}

/**
 * Löscht einen Kontakt
 */
export async function deleteContactStandalone(id: string): Promise<boolean> {
  // Versuche zuerst Vercel KV
  if (IS_SERVERLESS) {
    try {
      const client = await getDBClient();
      if (client) {
        const contacts = await getAllContacts();
        const filtered = contacts.filter((c: any) => c.id !== id);
        if (filtered.length === contacts.length) return false;
        
        await client.set("contacts", filtered);
        console.log("✅ [STANDALONE DB] Contact deleted from database:", id);
        return true;
      }
    } catch (error) {
      console.warn("⚠️ [STANDALONE DB] Database client failed, using JSON:", error);
    }
  }

  // Fallback: JSON
  try {
    const contacts = await getAllContacts();
    const filtered = contacts.filter((c: any) => c.id !== id);
    if (filtered.length === contacts.length) return false;
    
    ensureDataDir();
    const filePath = path.join(DATA_DIR, "contacts.json");
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    
    fs.writeFileSync(tempPath, JSON.stringify(filtered, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
    
    console.log("✅ [STANDALONE DB] Contact deleted from JSON:", id);
    return true;
  } catch (error) {
    console.error("❌ [STANDALONE DB] Error deleting contact:", error);
    return false;
  }
}

