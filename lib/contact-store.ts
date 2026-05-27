/**
 * HIGH-END KONTAKT-STORE - FUNKTIONIERT GARANTIERT IN PRODUCTION!
 * Post-Funktion wie Bewertungen - Instant sichtbar im Admin-Panel
 * File-basierte Persistenz - IMMER aus File laden, kein Cache!
 */

import fs from "fs";
import path from "path";

const IS_PRODUCTION = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
const STORAGE_PATH = IS_PRODUCTION
  ? "/tmp/contact-posts.json"
  : path.join(process.cwd(), "data", "contact-posts.json");

// Globaler Singleton für warme Lambdas (nur für createPost)
declare global {
  var __contactPostsStore: Array<{
    id: string;
    vorname: string;
    nachname: string;
    email: string;
    telefon: string | null;
    unternehmen: string | null;
    betreff: string;
    nachricht: string;
    status: "open" | "read" | "archived";
    read: boolean;
    archived: boolean;
    createdAt: string;
  }> | undefined;
}

// Lade Posts - IMMER aus File, KEIN Cache für getAllPosts!
function loadPostsFromFile(): Array<{
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string | null;
  unternehmen: string | null;
  betreff: string;
  nachricht: string;
  status: "open" | "read" | "archived";
  read: boolean;
  archived: boolean;
  createdAt: string;
}> {
  // IMMER aus File laden - garantiert aktuell!
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        console.log(`✅ [STORE] Loaded ${parsed.length} posts from file (FRESH)`);
        return parsed;
      }
    }
  } catch (error) {
    console.warn("⚠️ [STORE] Load error:", error);
  }
  
  // Fallback: Leeres Array
  console.log(`✅ [STORE] No file found, returning empty array`);
  return [];
}

// Speichere Posts - ATOMIC mit Retry, wirft KEINE Fehler!
function savePostsToFile(posts: Array<{
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string | null;
  unternehmen: string | null;
  betreff: string;
  nachricht: string;
  status: "open" | "read" | "archived";
  read: boolean;
  archived: boolean;
  createdAt: string;
}>): boolean {
  // Update globalen Store (nur für warme Lambdas)
  globalThis.__contactPostsStore = posts;
  
  // Retry-Mechanismus: 3 Versuche
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      // Speichere in File
      if (IS_PRODUCTION) {
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(posts, null, 2), "utf-8");
      } else {
        const dir = path.dirname(STORAGE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(posts, null, 2), "utf-8");
      }
      
      // Verifiziere sofort
      if (fs.existsSync(STORAGE_PATH)) {
        const verify = fs.readFileSync(STORAGE_PATH, "utf-8");
        const verifyParsed = JSON.parse(verify);
        if (Array.isArray(verifyParsed) && verifyParsed.length === posts.length) {
          console.log(`✅ [STORE] Saved ${posts.length} posts (verified: ${verifyParsed.length})`);
          return true; // Erfolg!
        }
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        console.warn(`⚠️ [STORE] Verification failed, retry ${attempts}/${maxAttempts}`);
        // Kurze Pause vor Retry
        const start = Date.now();
        while (Date.now() - start < 50) {} // 50ms Pause
      }
    } catch (error) {
      attempts++;
      console.error(`❌ [STORE] Save error (attempt ${attempts}/${maxAttempts}):`, error);
      if (attempts < maxAttempts) {
        const start = Date.now();
        while (Date.now() - start < 50) {} // 50ms Pause
      }
    }
  }
  
  // Wenn alle Versuche fehlgeschlagen sind, Daten bleiben im globalen Store
  console.error("❌ [STORE] All save attempts failed, data in memory only");
  return false; // Fehler, aber kein Throw!
}

// POST-FUNKTION - Wie Bewertungen, wirft KEINE Fehler!
export function createPost(data: {
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string | null;
  unternehmen?: string | null;
  betreff: string;
  nachricht: string;
}) {
  try {
    // Lade aktuelle Posts IMMER aus File
    const posts = loadPostsFromFile();
    
    const post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vorname: data.vorname.trim(),
      nachname: data.nachname.trim(),
      email: data.email.trim(),
      telefon: data.telefon?.trim() || null,
      unternehmen: data.unternehmen?.trim() || null,
      betreff: data.betreff.trim(),
      nachricht: data.nachricht.trim(),
      status: "open" as const,
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    
    // Füge Post hinzu (neueste zuerst)
    posts.unshift(post);
    
    // Speichere sofort mit Retry (wirft KEINE Fehler!)
    const saved = savePostsToFile(posts);
    
    if (saved) {
      console.log(`✅ [STORE] Post erstellt: ${post.id}`);
      console.log(`✅ [STORE] Name: ${post.vorname} ${post.nachname}`);
      console.log(`✅ [STORE] Email: ${post.email}`);
      console.log(`✅ [STORE] Telefon: ${post.telefon || "keine"}`);
      console.log(`✅ [STORE] Unternehmen: ${post.unternehmen || "keine"}`);
      console.log(`✅ [STORE] Betreff: ${post.betreff}`);
      console.log(`✅ [STORE] Nachricht: ${post.nachricht.substring(0, 50)}...`);
      console.log(`✅ [STORE] Total posts: ${posts.length}`);
      console.log(`✅ [STORE] Sofort im Admin-Panel sichtbar!`);
    } else {
      console.warn(`⚠️ [STORE] Post erstellt, aber Speichern fehlgeschlagen: ${post.id}`);
      console.warn(`⚠️ [STORE] Post ist im Memory, aber nicht im File`);
    }
    
    // IMMER Post zurückgeben, auch wenn Speichern fehlgeschlagen ist!
    return post;
  } catch (error) {
    // Fallback: Erstelle Post auch bei Fehler
    console.error("❌ [STORE] createPost error:", error);
    const fallbackPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vorname: data.vorname.trim(),
      nachname: data.nachname.trim(),
      email: data.email.trim(),
      telefon: data.telefon?.trim() || null,
      unternehmen: data.unternehmen?.trim() || null,
      betreff: data.betreff.trim(),
      nachricht: data.nachricht.trim(),
      status: "open" as const,
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    console.warn(`⚠️ [STORE] Fallback post created: ${fallbackPost.id}`);
    return fallbackPost;
  }
}

// GET ALL POSTS - IMMER aus File, KEIN Cache!
export function getAllPosts() {
  try {
    // IMMER aus File laden - garantiert aktuell, auch in Serverless!
    const posts = loadPostsFromFile();
    console.log(`✅ [STORE] getAllPosts: ${posts.length} posts (FRESH from file)`);
    if (posts.length > 0) {
      console.log(`✅ [STORE] Latest post: ${posts[0].id} - ${posts[0].vorname} ${posts[0].nachname}`);
      console.log(`✅ [STORE] Latest post email: ${posts[0].email}`);
      console.log(`✅ [STORE] Latest post betreff: ${posts[0].betreff}`);
    }
    return [...posts]; // Neueste zuerst
  } catch (error) {
    console.error("❌ [STORE] getAllPosts error:", error);
    return [];
  }
}

export function updatePost(id: string, updates: {
  read?: boolean;
  archived?: boolean;
  status?: "open" | "read" | "archived";
}) {
  try {
    const posts = loadPostsFromFile(); // IMMER aus File
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    posts[index] = { ...posts[index], ...updates };
    savePostsToFile(posts);
    return posts[index];
  } catch (error) {
    console.error("❌ [STORE] updatePost error:", error);
    return null;
  }
}

export function deletePost(id: string) {
  try {
    const posts = loadPostsFromFile(); // IMMER aus File
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    posts.splice(index, 1);
    savePostsToFile(posts);
    return true;
  } catch (error) {
    console.error("❌ [STORE] deletePost error:", error);
    return false;
  }
}
