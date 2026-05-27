"use server";

import { verifySession } from "@/lib/auth";
import fs from "fs";
import path from "path";

// IMMER lokale Datei verwenden - auch in Production!
const STORAGE_PATH = path.join(process.cwd(), "data", "contact-posts.json");

declare global {
  var __contactPosts: Array<{
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

// Lade Posts - IMMER aus lokaler Datei! Sortiert nach createdAt DESC
async function loadPosts() {
  try {
    // Stelle sicher, dass das Verzeichnis existiert
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 [ADMIN] Created directory: ${dir}`);
    }
    
    // Erstelle Datei wenn sie nicht existiert
    if (!fs.existsSync(STORAGE_PATH)) {
      console.log(`📄 [ADMIN] Creating new file: ${STORAGE_PATH}`);
      fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
      globalThis.__contactPosts = [];
      return [];
    }
    
    // Lade aus lokaler Datei
    const data = fs.readFileSync(STORAGE_PATH, "utf-8");
    if (data && data.trim()) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Sortiere nach createdAt DESC (neueste zuerst)
        const sorted = parsed.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // DESC
        });
        globalThis.__contactPosts = sorted;
        console.log(`✅ [ADMIN] Loaded ${sorted.length} posts from local file: ${STORAGE_PATH}`);
        return sorted;
      } else {
        console.warn(`⚠️ [ADMIN] File exists but is not an array, resetting...`);
        fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
        globalThis.__contactPosts = [];
        return [];
      }
    } else {
      // Leere Datei - initialisiere mit leerem Array
      console.log(`📄 [ADMIN] File is empty, initializing...`);
      fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
      globalThis.__contactPosts = [];
      return [];
    }
  } catch (error: any) {
    console.error("❌ [ADMIN] Error loading posts:", error?.message || error);
    // Bei Fehler: Versuche Datei neu zu erstellen
    try {
      fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
      globalThis.__contactPosts = [];
      return [];
    } catch (writeError) {
      console.error("❌ [ADMIN] Failed to create file:", writeError);
    }
  }
  
  // Fallback: Memory (nur wenn Datei nicht existiert)
  if (globalThis.__contactPosts && Array.isArray(globalThis.__contactPosts)) {
    const sorted = globalThis.__contactPosts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // DESC
    });
    console.log(`✅ [ADMIN] Using ${sorted.length} posts from memory (fallback)`);
    return sorted;
  }
  
  console.log("ℹ️ [ADMIN] Returning empty array (no file found)");
  return [];
}

// Speichere Posts - IMMER LOKAL!
async function savePosts(posts: Array<any>): Promise<void> {
  if (!Array.isArray(posts)) {
    console.error("❌ [ADMIN] savePosts: posts is not an array");
    return;
  }
  
  globalThis.__contactPosts = posts;
  console.log(`💾 [ADMIN] Saving ${posts.length} posts to local file: ${STORAGE_PATH}`);
  
  // Stelle sicher, dass das Verzeichnis existiert
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 [ADMIN] Created directory: ${dir}`);
  }
  
  // Speichere in lokale Datei mit Retry-Logik
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      // Schreibe synchron - garantiert sofortiges Speichern
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(posts, null, 2), "utf-8");
      
      // Verifiziere dass die Datei korrekt geschrieben wurde
      if (fs.existsSync(STORAGE_PATH)) {
        const verify = fs.readFileSync(STORAGE_PATH, "utf-8");
        const verifyParsed = JSON.parse(verify);
        if (Array.isArray(verifyParsed) && verifyParsed.length === posts.length) {
          console.log(`✅ [ADMIN] Successfully saved ${posts.length} posts to local file: ${STORAGE_PATH}`);
          // Zusätzliche Verifizierung: Prüfe ob Datei wirklich geschrieben wurde
          const stats = fs.statSync(STORAGE_PATH);
          console.log(`📊 [ADMIN] File size: ${stats.size} bytes, modified: ${stats.mtime}`);
          return; // Erfolg!
        } else {
          console.warn(`⚠️ [ADMIN] Verification failed: expected ${posts.length} posts, got ${verifyParsed.length}`);
        }
      } else {
        console.warn(`⚠️ [ADMIN] File does not exist after write (attempt ${attempt})`);
      }
    } catch (error: any) {
      console.error(`❌ [ADMIN] Save attempt ${attempt} failed:`, error?.message || error);
      if (error?.code === 'ENOENT') {
        // Verzeichnis existiert nicht - erstelle es
        try {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`📁 [ADMIN] Created directory after error: ${dir}`);
        } catch (mkdirError) {
          console.error(`❌ [ADMIN] Failed to create directory:`, mkdirError);
        }
      }
    }
    
    // Kurze Pause vor Retry
    if (attempt < 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.error("❌ [ADMIN] Failed to save after 10 attempts");
  // Versuche trotzdem im Memory zu speichern
  globalThis.__contactPosts = posts;
  console.log(`💾 [ADMIN] Saved ${posts.length} posts to memory as fallback`);
}

export async function getAdminContacts() {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      console.log("❌ [ADMIN] Unauthorized access");
      return { error: "Unauthorized", contacts: [] };
    }

    console.log("✅ [ADMIN] Loading posts from:", STORAGE_PATH);
    const posts = await loadPosts();
    console.log(`✅ [ADMIN] Loaded ${posts.length} posts from file`);
    
    // Prüfe auch den globalen Store als Fallback
    if (posts.length === 0 && globalThis.__contactPosts && Array.isArray(globalThis.__contactPosts) && globalThis.__contactPosts.length > 0) {
      console.log(`⚠️ [ADMIN] File is empty but memory has ${globalThis.__contactPosts.length} posts - using memory`);
      // Versuche Memory-Daten in Datei zu speichern
      await savePosts(globalThis.__contactPosts);
      const memoryPosts = globalThis.__contactPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // DESC
      });
      
      const transformedContacts = memoryPosts.map((post) => ({
        id: post.id,
        name: `${post.vorname} ${post.nachname}`,
        email: post.email,
        telefon: post.telefon || undefined,
        unternehmen: post.unternehmen || undefined,
        betreff: post.betreff,
        nachricht: post.nachricht,
        createdAt: post.createdAt,
        read: post.read,
        archived: post.archived,
        status: post.status,
      }));
      
      console.log(`✅ [ADMIN] Returning ${transformedContacts.length} contacts from memory`);
      return { contacts: transformedContacts };
    }
    
    // Transformiere Posts - KEINE Filterung, ALLE Posts werden zurückgegeben!
    const transformedContacts = posts.map((post) => ({
      id: post.id,
      name: `${post.vorname} ${post.nachname}`,
      email: post.email,
      telefon: post.telefon || undefined,
      unternehmen: post.unternehmen || undefined,
      betreff: post.betreff,
      nachricht: post.nachricht,
      createdAt: post.createdAt,
      read: post.read,
      archived: post.archived,
      status: post.status,
    }));

    console.log(`✅ [ADMIN] Returning ${transformedContacts.length} contacts`);
    return { contacts: transformedContacts };
  } catch (error: any) {
    console.error("❌ [ADMIN] Error in getAdminContacts:", error);
    return { error: `Failed to fetch posts: ${error?.message || String(error)}`, contacts: [] };
  }
}

export async function markContactAsRead(id: string) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { error: "Unauthorized" };
    }

    const posts = await loadPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return { error: "Post not found" };
    
    posts[index] = { ...posts[index], read: true, status: "read" };
    await savePosts(posts);
    
    return { success: true, contact: posts[index] };
  } catch (error) {
    return { error: "Failed to update post" };
  }
}

export async function archiveContact(id: string) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { error: "Unauthorized" };
    }

    const posts = await loadPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return { error: "Post not found" };
    
    posts[index] = { ...posts[index], archived: true, status: "archived" };
    await savePosts(posts);
    
    return { success: true, contact: posts[index] };
  } catch (error) {
    return { error: "Failed to archive post" };
  }
}

export async function deleteAdminContact(id: string) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { error: "Unauthorized" };
    }

    const posts = await loadPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return { error: "Post not found" };
    
    posts.splice(index, 1);
    await savePosts(posts);
    
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete post" };
  }
}
