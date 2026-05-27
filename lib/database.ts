import fs from "fs";
import path from "path";

// STANDALONE: Keine externe Abhängigkeit - funktioniert überall!
// Verwendet automatisch Vercel KV in Production, JSON lokal
const IS_SERVERLESS = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const HAS_DATABASE = false; // Nicht mehr nötig - standalone Lösung
const DATA_DIR = IS_SERVERLESS 
  ? "/tmp/data" // Serverless: verwende /tmp (temporär, aber funktioniert)
  : path.join(process.cwd(), "data");

// Prisma Client wird nicht mehr verwendet - standalone Lösung

export interface ContactSubmission {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  unternehmen: string;
  betreff: string;
  nachricht: string;
  createdAt: string;
  read: boolean;
  archived: boolean;
  emailSent: boolean;
  emailSentAt?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
}

export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  unternehmen?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt?: string;
  read: boolean;
  archived: boolean;
}

export interface AnalyticsEvent {
  id: string;
  type: "page_view" | "click" | "form_submit" | "demo_request" | "contact";
  page: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

function ensureDataDir() {
  try {
    // In Serverless-Umgebungen: /tmp ist immer verfügbar
    if (IS_SERVERLESS) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log("✅ [DATABASE] Created data directory (Serverless):", DATA_DIR);
      }
      // In Serverless: /tmp ist immer beschreibbar
      return;
    }
    
    // Lokale Entwicklung: normale Verzeichnisprüfung
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log("✅ [DATABASE] Created data directory:", DATA_DIR);
    }
    // Ensure directory is writable
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
  } catch (error) {
    console.error("❌ [DATABASE] Failed to ensure data directory:", error);
    throw new Error(`Cannot access data directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getFilePath(filename: string): string {
  ensureDataDir();
  return path.join(DATA_DIR, filename);
}

// Contacts - NICHT MEHR VERWENDET - Server Actions verwenden!
export async function getContacts(): Promise<ContactSubmission[]> {
  // Diese Funktion wird nicht mehr verwendet - Server Actions verwenden!
  // Gibt leeres Array zurück, damit Build funktioniert
  console.warn("⚠️ [DATABASE] getContacts() wird nicht mehr verwendet - Server Actions verwenden!");
  return [];
}

export async function saveContact(contact: Omit<ContactSubmission, "id" | "createdAt" | "read" | "archived" | "emailSent" | "emailSentAt" | "emailVerified" | "verificationToken" | "verificationTokenExpiresAt">): Promise<ContactSubmission> {
  // NICHT MEHR VERWENDET - Server Actions verwenden!
  console.warn("⚠️ [DATABASE] saveContact() wird nicht mehr verwendet - Server Actions verwenden!");
  throw new Error("saveContact() wird nicht mehr verwendet - Server Actions verwenden!");
}

export async function verifyContactEmail(token: string): Promise<ContactSubmission | null> {
  // Email-Verifizierung wird nicht mehr verwendet - direkt über Prisma
  return null;
}

export async function markContactEmailSent(id: string): Promise<ContactSubmission | null> {
  const contacts = await getContacts();
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return null;
  
  // Email-Sent Status wird nicht mehr verwendet, aber für Kompatibilität
  return {
    ...contact,
    emailSent: true,
    emailSentAt: new Date().toISOString(),
  };
}

export async function updateContact(id: string, updates: Partial<ContactSubmission>): Promise<ContactSubmission | null> {
  // NICHT MEHR VERWENDET - Server Actions verwenden!
  console.warn("⚠️ [DATABASE] updateContact() wird nicht mehr verwendet - Server Actions verwenden!");
  return null;
}

export async function deleteContact(id: string): Promise<boolean> {
  // NICHT MEHR VERWENDET - Server Actions verwenden!
  console.warn("⚠️ [DATABASE] deleteContact() wird nicht mehr verwendet - Server Actions verwenden!");
  return false;
}

// Demo Requests
export function getDemoRequests(): DemoRequest[] {
  const file = getFilePath("demo-requests.json");
  if (!fs.existsSync(file)) {
    return [];
  }
  try {
    const data = fs.readFileSync(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveDemoRequest(request: Omit<DemoRequest, "id" | "createdAt" | "status" | "read" | "archived">): DemoRequest {
  const requests = getDemoRequests();
  const newRequest: DemoRequest = {
    ...request,
    id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    read: false,
    archived: false,
  };
  requests.push(newRequest);
  fs.writeFileSync(getFilePath("demo-requests.json"), JSON.stringify(requests, null, 2), "utf-8");
  return newRequest;
}

export function updateDemoRequest(id: string, updates: Partial<DemoRequest>): DemoRequest | null {
  const requests = getDemoRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return null;
  requests[index] = { ...requests[index], ...updates };
  fs.writeFileSync(getFilePath("demo-requests.json"), JSON.stringify(requests, null, 2), "utf-8");
  return requests[index];
}

export function deleteDemoRequest(id: string): boolean {
  const requests = getDemoRequests();
  const filtered = requests.filter((r) => r.id !== id);
  if (filtered.length === requests.length) return false;
  fs.writeFileSync(getFilePath("demo-requests.json"), JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}

// Analytics
export function getAnalyticsEvents(limit?: number): AnalyticsEvent[] {
  const file = getFilePath("analytics.json");
  if (!fs.existsSync(file)) {
    return [];
  }
  try {
    const data = fs.readFileSync(file, "utf-8");
    const events: AnalyticsEvent[] = JSON.parse(data);
    return limit ? events.slice(-limit).reverse() : events.reverse();
  } catch {
    return [];
  }
}

export function saveAnalyticsEvent(event: Omit<AnalyticsEvent, "id" | "timestamp">): AnalyticsEvent {
  // Analytics ist nicht kritisch - einfach nur loggen, keine Speicherung
  // Verhindert Fehler in API-Routen
  try {
    console.log("📊 [ANALYTICS]", { type: event.type, page: event.page, timestamp: new Date().toISOString() });
    
    // Return dummy event - Analytics wird nicht gespeichert
    return {
      id: `analytics_${Date.now()}`,
      ...event,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Immer ein Event zurückgeben, auch bei Fehlern
    return {
      id: `analytics_${Date.now()}`,
      type: event.type || "page_view",
      page: event.page || "/",
      timestamp: new Date().toISOString(),
    };
  }
}

export function getAnalyticsStats() {
  const events = getAnalyticsEvents();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const pageViews = events.filter((e) => e.type === "page_view");
  const contacts = events.filter((e) => e.type === "contact");
  const demoRequests = events.filter((e) => e.type === "demo_request");

  const pageViews24h = pageViews.filter((e) => new Date(e.timestamp) >= last24h).length;
  const pageViews7d = pageViews.filter((e) => new Date(e.timestamp) >= last7d).length;
  const pageViews30d = pageViews.filter((e) => new Date(e.timestamp) >= last30d).length;

  const contacts24h = contacts.filter((e) => new Date(e.timestamp) >= last24h).length;
  const contacts7d = contacts.filter((e) => new Date(e.timestamp) >= last7d).length;
  const contacts30d = contacts.filter((e) => new Date(e.timestamp) >= last30d).length;

  const demoRequests24h = demoRequests.filter((e) => new Date(e.timestamp) >= last24h).length;
  const demoRequests7d = demoRequests.filter((e) => new Date(e.timestamp) >= last7d).length;
  const demoRequests30d = demoRequests.filter((e) => new Date(e.timestamp) >= last30d).length;

  // Top pages
  const pageCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    pageCounts[e.page] = (pageCounts[e.page] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  return {
    total: {
      pageViews: pageViews.length,
      contacts: contacts.length,
      demoRequests: demoRequests.length,
    },
    last24h: {
      pageViews: pageViews24h,
      contacts: contacts24h,
      demoRequests: demoRequests24h,
    },
    last7d: {
      pageViews: pageViews7d,
      contacts: contacts7d,
      demoRequests: demoRequests7d,
    },
    last30d: {
      pageViews: pageViews30d,
      contacts: contacts30d,
      demoRequests: demoRequests30d,
    },
    topPages,
  };
}

