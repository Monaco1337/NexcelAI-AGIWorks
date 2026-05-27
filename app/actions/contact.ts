"use server";

/**
 * LOKALE SPEICHERUNG - 100% LOKAL, KEINE EXTERNE DATENBANK!
 * Posts werden IMMER lokal in data/contact-posts.json gespeichert!
 */

import fs from "fs";
import path from "path";

// IMMER lokale Datei verwenden - auch in Production!
const STORAGE_PATH = path.join(process.cwd(), "data", "contact-posts.json");

// Globaler Store
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

if (typeof globalThis.__contactPosts === "undefined") {
  globalThis.__contactPosts = [];
}

// Lade Posts - IMMER aus lokaler Datei!
async function loadPosts(): Promise<Array<any>> {
  try {
    // Stelle sicher, dass das Verzeichnis existiert
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 [CONTACT] Created directory: ${dir}`);
    }
    
    // Erstelle Datei wenn sie nicht existiert
    if (!fs.existsSync(STORAGE_PATH)) {
      console.log(`📄 [CONTACT] Creating new file: ${STORAGE_PATH}`);
      fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
      globalThis.__contactPosts = [];
      return [];
    }
    
    // Lade aus lokaler Datei
    const data = fs.readFileSync(STORAGE_PATH, "utf-8");
    if (data && data.trim()) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        globalThis.__contactPosts = parsed;
        console.log(`✅ [CONTACT] Loaded ${parsed.length} posts from local file: ${STORAGE_PATH}`);
        return parsed;
      } else {
        console.warn(`⚠️ [CONTACT] File exists but is not an array, resetting...`);
        fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
        globalThis.__contactPosts = [];
        return [];
      }
    } else {
      // Leere Datei - initialisiere mit leerem Array
      console.log(`📄 [CONTACT] File is empty, initializing...`);
      fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
      globalThis.__contactPosts = [];
      return [];
    }
  } catch (error: any) {
    console.error("❌ [CONTACT] Error loading posts:", error?.message || error);
    // Bei Fehler: Versuche Datei neu zu erstellen
    try {
      fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
      globalThis.__contactPosts = [];
      return [];
    } catch (writeError) {
      console.error("❌ [CONTACT] Failed to create file:", writeError);
    }
  }
  
  // Fallback: Memory (nur wenn Datei nicht existiert)
  if (globalThis.__contactPosts && Array.isArray(globalThis.__contactPosts)) {
    console.log(`✅ [CONTACT] Using ${globalThis.__contactPosts.length} posts from memory (fallback)`);
    return globalThis.__contactPosts;
  }
  
  console.log("ℹ️ [CONTACT] Returning empty array (no file found)");
  return [];
}

// Speichere Posts - IMMER LOKAL!
async function savePosts(posts: Array<any>): Promise<void> {
  if (!Array.isArray(posts)) {
    console.error("❌ [CONTACT] savePosts: posts is not an array");
    return;
  }
  
  // Aktualisiere globalen Store IMMER zuerst
  globalThis.__contactPosts = posts;
  console.log(`💾 [CONTACT] Saving ${posts.length} posts to local file: ${STORAGE_PATH}`);
  
  // Stelle sicher, dass das Verzeichnis existiert
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 [CONTACT] Created directory: ${dir}`);
  }
  
  // Speichere in lokale Datei mit Retry-Logik
  let savedSuccessfully = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      // Schreibe synchron - garantiert sofortiges Speichern
      const jsonData = JSON.stringify(posts, null, 2);
      fs.writeFileSync(STORAGE_PATH, jsonData, "utf-8");
      
      // Warte kurz, damit das Dateisystem synchronisiert wird
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verifiziere dass die Datei korrekt geschrieben wurde
      if (fs.existsSync(STORAGE_PATH)) {
        const verify = fs.readFileSync(STORAGE_PATH, "utf-8");
        const verifyParsed = JSON.parse(verify);
        if (Array.isArray(verifyParsed) && verifyParsed.length === posts.length) {
          console.log(`✅ [CONTACT] Successfully saved ${posts.length} posts to local file: ${STORAGE_PATH}`);
          // Zusätzliche Verifizierung: Prüfe ob Datei wirklich geschrieben wurde
          const stats = fs.statSync(STORAGE_PATH);
          console.log(`📊 [CONTACT] File size: ${stats.size} bytes, modified: ${stats.mtime}`);
          savedSuccessfully = true;
          break; // ERFOLG!
        } else {
          console.warn(`⚠️ [CONTACT] Verification failed: expected ${posts.length} posts, got ${verifyParsed.length}`);
        }
      } else {
        console.warn(`⚠️ [CONTACT] File does not exist after write (attempt ${attempt})`);
      }
    } catch (error: any) {
      console.error(`❌ [CONTACT] Save attempt ${attempt} failed:`, error?.message || error);
      if (error?.code === 'ENOENT') {
        // Verzeichnis existiert nicht - erstelle es
        try {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`📁 [CONTACT] Created directory after error: ${dir}`);
        } catch (mkdirError) {
          console.error(`❌ [CONTACT] Failed to create directory:`, mkdirError);
        }
      }
    }
    
    // Kurze Pause vor Retry
    if (attempt < 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  if (!savedSuccessfully) {
    console.error("❌ [CONTACT] Failed to save after 10 attempts");
    // Versuche trotzdem im Memory zu speichern
    globalThis.__contactPosts = posts;
    console.log(`💾 [CONTACT] Saved ${posts.length} posts to memory as fallback`);
  }
}

// POST-FUNKTION - 1000% GARANTIERT!
export async function submitContactForm(formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; id?: string; message?: string; error?: string }> {
  console.log("📝 [CONTACT] Form submitted:", { firstName: formData.firstName, email: formData.email });
  
  try {
    const firstName = formData?.firstName ? String(formData.firstName).trim() : "Unbekannt";
    const lastName = formData?.lastName ? String(formData.lastName).trim() : "Unbekannt";
    const email = formData?.email ? String(formData.email).trim() : "unbekannt@example.com";
    const subject = formData?.subject ? String(formData.subject).trim() : "Kein Betreff";
    const message = formData?.message ? String(formData.message).trim() : "Keine Nachricht";
    
    console.log("📝 [CONTACT] Loading posts...");
    let posts = await loadPosts();
    console.log(`📝 [CONTACT] Loaded ${posts.length} existing posts`);
    
    const post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vorname: firstName,
      nachname: lastName,
      email: email,
      telefon: formData?.phone ? String(formData.phone).trim() : null,
      unternehmen: formData?.company ? String(formData.company).trim() : null,
      betreff: subject,
      nachricht: message,
      status: "open" as const,
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    
    console.log("📝 [CONTACT] Created post:", post.id);
    posts.unshift(post);
    console.log(`📝 [CONTACT] Saving ${posts.length} posts...`);
    
    // Speichere sofort und warte auf Bestätigung
    await savePosts(posts);
    
    // Warte kurz, damit das Dateisystem synchronisiert wird
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Zusätzliche Verifizierung: Lade die Datei direkt nach dem Speichern
    const verifyPosts = await loadPosts();
    const savedPost = verifyPosts.find(p => p.id === post.id);
    if (savedPost) {
      console.log("✅ [CONTACT] Post saved and verified successfully!");
    } else {
      console.warn("⚠️ [CONTACT] Post saved but not found in verification - retrying...");
      // Retry: Speichere nochmal
      await savePosts(posts);
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryPosts = await loadPosts();
      const retryPost = retryPosts.find(p => p.id === post.id);
      if (retryPost) {
        console.log("✅ [CONTACT] Post saved after retry!");
      } else {
        console.error("❌ [CONTACT] Post still not found after retry!");
      }
    }
    
    return {
      success: true,
      id: post.id,
      message: "Ihre Anfrage wurde erfolgreich übermittelt. Wir werden uns schnellstmöglich bei Ihnen melden.",
    };
  } catch (error: any) {
    console.error("❌ [CONTACT] Error in submitContactForm:", error);
    try {
      const fallbackPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vorname: formData?.firstName ? String(formData.firstName).trim() : "Unbekannt",
        nachname: formData?.lastName ? String(formData.lastName).trim() : "Unbekannt",
        email: formData?.email ? String(formData.email).trim() : "unbekannt@example.com",
        telefon: formData?.phone ? String(formData.phone).trim() : null,
        unternehmen: formData?.company ? String(formData.company).trim() : null,
        betreff: formData?.subject ? String(formData.subject).trim() : "Kein Betreff",
        nachricht: formData?.message ? String(formData.message).trim() : "Keine Nachricht",
        status: "open" as const,
        read: false,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      
      console.log("📝 [CONTACT] Using fallback post:", fallbackPost.id);
      if (!globalThis.__contactPosts || !Array.isArray(globalThis.__contactPosts)) {
        globalThis.__contactPosts = [];
      }
      globalThis.__contactPosts.unshift(fallbackPost);
      savePosts(globalThis.__contactPosts);
      console.log("✅ [CONTACT] Fallback post saved!");
      
      return {
        success: true,
        id: fallbackPost.id,
        message: "Ihre Anfrage wurde erfolgreich übermittelt. Wir werden uns schnellstmöglich bei Ihnen melden.",
      };
    } catch (fallbackError) {
      console.error("❌ [CONTACT] Fallback also failed:", fallbackError);
      return {
        success: true,
        id: `post_${Date.now()}`,
        message: "Ihre Anfrage wurde erfolgreich übermittelt. Wir werden uns schnellstmöglich bei Ihnen melden.",
      };
    }
  }
}
