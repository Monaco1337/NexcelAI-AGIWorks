/**
 * HIGH-END Supabase PostgreSQL Datenbank-Verbindung
 * Direkte Verbindung ohne Prisma - funktioniert sofort in Production
 */

import postgres from 'postgres';

// Connection String aus Umgebungsvariablen
const connectionString = process.env.DATABASE_URL;

// Prüfe ob Datenbank-URL vorhanden ist
const HAS_DATABASE = !!connectionString;

// SQL Client (lazy initialization)
let sql: ReturnType<typeof postgres> | null = null;

/**
 * Initialisiert die Datenbank-Verbindung
 */
function getSqlClient() {
  if (!HAS_DATABASE) {
    return null;
  }

  if (!sql) {
    try {
      // URL-Encoding für spezielle Zeichen im Passwort
      const encodedUrl = connectionString!.replace(
        /([^:]+):([^@]+)@/,
        (match, user, password) => {
          const encodedPassword = encodeURIComponent(password);
          return `${user}:${encodedPassword}@`;
        }
      );

      sql = postgres(encodedUrl, {
        max: 10, // Maximum connections
        idle_timeout: 20, // Close idle clients after 20 seconds
        connect_timeout: 10, // Connection timeout
        ssl: { rejectUnauthorized: false }, // Supabase requires SSL
      });

      console.log('✅ [SUPABASE DB] Connection initialized');
    } catch (error) {
      console.error('❌ [SUPABASE DB] Failed to initialize connection:', error);
      return null;
    }
  }

  return sql;
}

/**
 * Erstellt die Tabelle automatisch falls sie nicht existiert
 */
async function ensureTable() {
  const client = getSqlClient();
  if (!client) return false;

  try {
    await client`
      CREATE TABLE IF NOT EXISTS contact_requests (
        id TEXT PRIMARY KEY,
        vorname TEXT NOT NULL,
        nachname TEXT NOT NULL,
        email TEXT NOT NULL,
        telefon TEXT NOT NULL,
        unternehmen TEXT NOT NULL,
        betreff TEXT NOT NULL,
        nachricht TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Erstelle Indexe für bessere Performance
    await client`
      CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at 
      ON contact_requests(created_at DESC)
    `;

    await client`
      CREATE INDEX IF NOT EXISTS idx_contact_requests_read 
      ON contact_requests(read)
    `;

    await client`
      CREATE INDEX IF NOT EXISTS idx_contact_requests_archived 
      ON contact_requests(archived)
    `;

    console.log('✅ [SUPABASE DB] Table ensured');
    return true;
  } catch (error) {
    console.error('❌ [SUPABASE DB] Failed to ensure table:', error);
    return false;
  }
}

/**
 * Lädt alle Kontakte aus der Datenbank
 */
export async function getContactsFromDB(): Promise<any[]> {
  if (!HAS_DATABASE) {
    return [];
  }

  const client = getSqlClient();
  if (!client) {
    console.warn('⚠️ [SUPABASE DB] No database connection, returning empty array');
    return [];
  }

  try {
    await ensureTable();
    
    const contacts = await client`
      SELECT 
        id,
        vorname,
        nachname,
        email,
        telefon,
        unternehmen,
        betreff,
        nachricht,
        read,
        archived,
        created_at,
        updated_at
      FROM contact_requests
      ORDER BY created_at DESC
    `;

    // Transformiere zu ContactSubmission-Format
    return contacts.map((contact: any) => ({
      id: contact.id,
      vorname: contact.vorname,
      nachname: contact.nachname,
      email: contact.email,
      telefon: contact.telefon,
      unternehmen: contact.unternehmen,
      betreff: contact.betreff,
      nachricht: contact.nachricht,
      read: contact.read || false,
      archived: contact.archived || false,
      createdAt: contact.created_at?.toISOString() || new Date().toISOString(),
      emailSent: false,
      emailVerified: false,
    }));
  } catch (error) {
    console.error('❌ [SUPABASE DB] Error fetching contacts:', error);
    return [];
  }
}

/**
 * Speichert einen neuen Kontakt in der Datenbank
 */
export async function saveContactToDB(contact: {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  unternehmen: string;
  betreff: string;
  nachricht: string;
}): Promise<any> {
  if (!HAS_DATABASE) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = getSqlClient();
  if (!client) {
    throw new Error('Database connection failed');
  }

  try {
    await ensureTable();

    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const [saved] = await client`
      INSERT INTO contact_requests (
        id, vorname, nachname, email, telefon, unternehmen, 
        betreff, nachricht, read, archived, created_at, updated_at
      )
      VALUES (
        ${id},
        ${contact.vorname},
        ${contact.nachname},
        ${contact.email},
        ${contact.telefon},
        ${contact.unternehmen},
        ${contact.betreff},
        ${contact.nachricht},
        FALSE,
        FALSE,
        ${now},
        ${now}
      )
      RETURNING *
    `;

    console.log('✅ [SUPABASE DB] Contact saved:', id);

    return {
      id: saved.id,
      vorname: saved.vorname,
      nachname: saved.nachname,
      email: saved.email,
      telefon: saved.telefon,
      unternehmen: saved.unternehmen,
      betreff: saved.betreff,
      nachricht: saved.nachricht,
      read: saved.read || false,
      archived: saved.archived || false,
      createdAt: saved.created_at?.toISOString() || now.toISOString(),
      emailSent: false,
      emailVerified: false,
    };
  } catch (error) {
    console.error('❌ [SUPABASE DB] Error saving contact:', error);
    throw error;
  }
}

/**
 * Aktualisiert einen Kontakt
 */
export async function updateContactInDB(
  id: string,
  updates: Partial<{
    read: boolean;
    archived: boolean;
  }>
): Promise<any | null> {
  if (!HAS_DATABASE) {
    return null;
  }

  const client = getSqlClient();
  if (!client) {
    return null;
  }

  try {
    // Baue Update-Query dynamisch auf
    if (updates.read !== undefined && updates.archived !== undefined) {
      const [updated] = await client`
        UPDATE contact_requests
        SET 
          read = ${updates.read},
          archived = ${updates.archived},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (!updated) return null;
      
      return {
        id: updated.id,
        vorname: updated.vorname,
        nachname: updated.nachname,
        email: updated.email,
        telefon: updated.telefon,
        unternehmen: updated.unternehmen,
        betreff: updated.betreff,
        nachricht: updated.nachricht,
        read: updated.read || false,
        archived: updated.archived || false,
        createdAt: updated.created_at?.toISOString() || new Date().toISOString(),
        emailSent: false,
        emailVerified: false,
      };
    } else if (updates.read !== undefined) {
      const [updated] = await client`
        UPDATE contact_requests
        SET 
          read = ${updates.read},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (!updated) return null;
      
      return {
        id: updated.id,
        vorname: updated.vorname,
        nachname: updated.nachname,
        email: updated.email,
        telefon: updated.telefon,
        unternehmen: updated.unternehmen,
        betreff: updated.betreff,
        nachricht: updated.nachricht,
        read: updated.read || false,
        archived: updated.archived || false,
        createdAt: updated.created_at?.toISOString() || new Date().toISOString(),
        emailSent: false,
        emailVerified: false,
      };
    } else if (updates.archived !== undefined) {
      const [updated] = await client`
        UPDATE contact_requests
        SET 
          archived = ${updates.archived},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (!updated) return null;
      
      return {
        id: updated.id,
        vorname: updated.vorname,
        nachname: updated.nachname,
        email: updated.email,
        telefon: updated.telefon,
        unternehmen: updated.unternehmen,
        betreff: updated.betreff,
        nachricht: updated.nachricht,
        read: updated.read || false,
        archived: updated.archived || false,
        createdAt: updated.created_at?.toISOString() || new Date().toISOString(),
        emailSent: false,
        emailVerified: false,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ [SUPABASE DB] Error updating contact:', error);
    return null;
  }
}

/**
 * Löscht einen Kontakt
 */
export async function deleteContactFromDB(id: string): Promise<boolean> {
  if (!HAS_DATABASE) {
    return false;
  }

  const client = getSqlClient();
  if (!client) {
    return false;
  }

  try {
    const result = await client`
      DELETE FROM contact_requests
      WHERE id = ${id}
    `;

    return true;
  } catch (error) {
    console.error('❌ [SUPABASE DB] Error deleting contact:', error);
    return false;
  }
}

/**
 * Testet die Datenbank-Verbindung
 */
export async function testConnection(): Promise<boolean> {
  if (!HAS_DATABASE) {
    console.log('⚠️ [SUPABASE DB] No DATABASE_URL configured');
    return false;
  }

  const client = getSqlClient();
  if (!client) {
    console.error('❌ [SUPABASE DB] Failed to create client');
    return false;
  }

  try {
    await client`SELECT 1 as test`;
    console.log('✅ [SUPABASE DB] Connection test successful');
    return true;
  } catch (error) {
    console.error('❌ [SUPABASE DB] Connection test failed:', error);
    return false;
  }
}

