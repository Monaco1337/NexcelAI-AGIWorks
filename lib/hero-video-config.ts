/**
 * Hero Video Pool — kuratierte, story-getriebene Enterprise-Automation-Szenen.
 *
 * Zielbild: echte Geschäftsprozesse & Transformation über Branchen hinweg
 * (keine Hacker-/Code-Ästhetik, kein „generisches Tech-Broll“).
 *
 * Erweiterung:
 * 1. MP4 nach /public/videos/hero/ legen (1080p bevorzugt, < ~25 MB pro Clip)
 * 2. Eintrag mit category + storyBeat + label ergänzen
 * 3. Optional: Mixkit-ID in Kommentar für Nachvollziehbarkeit der Lizenz
 *
 * Mixkit-Clips: Free-Tier 720p — bitte Nutzungsbedingungen für Production prüfen
 * (https://mixkit.co/license/). Pexels-Clips: Pexels License.
 */

/** Die sechs Säulen der Positionierung */
export type HeroStoryCategory =
  | "real_estate"
  | "construction"
  | "logistics"
  | "healthcare"
  | "office_enterprise"
  | "service";

export const HERO_STORY_CATEGORY_ORDER: HeroStoryCategory[] = [
  "real_estate",
  "construction",
  "logistics",
  "healthcare",
  "office_enterprise",
  "service",
];

export const HERO_STORY_CATEGORY_LABELS: Record<HeroStoryCategory, string> = {
  real_estate: "Immobilien — Akten, Kommunikation, Verwaltung, digitale Systeme",
  construction: "Bau — Koordination, Planung, digitale Einsatzsteuerung",
  logistics: "Logistik — Disposition, operative Abläufe, Steuerung",
  healthcare: "Gesundheit & Care — Dokumentation, Koordination, digitale Prozesse",
  office_enterprise: "Enterprise — Teams, Workflows, Automatisierung, Dashboards",
  service: "Dienstleister — Kundenkontakt, Planung, digitale Abläufe",
};

/**
 * Story-Beat für Rotation / Reihenfolge (nicht für UI):
 * - operations: operative Kernarbeit vor Ort / am Schreibtisch
 * - coordination: Abstimmung, Teams, Kundenkontakt
 * - digital_platform: Dashboards, Daten, Software-Oberflächen (seriös, kein „Hollywood-Hacking“)
 */
export type HeroStoryBeat = "operations" | "coordination" | "digital_platform";

export interface HeroVideoClip {
  src: string;
  category: HeroStoryCategory;
  storyBeat: HeroStoryBeat;
  /** Kurzbeschreibung für Redaktion / spätere Pflege */
  label: string;
}

export const HERO_MOBILE_POSTER = {
  nexcel: "/images/hero/nexcel-system-architecture.png",
  blaze: "/images/hero/blaze-system-architecture.png",
} as const;

/**
 * Kuratierter Pool — bewusst reduziert auf klare Business-Narrative.
 * (Große, generische „Enterprise“-Shots ohne Prozessbezug sind entfernt.)
 */
export const HERO_VIDEO_POOL: HeroVideoClip[] = [
  // ── Primary Hero Clip (immer an erster Stelle) ────────────
  {
    src: "/videos/hero/VcN9EnlG.mp4",
    category: "office_enterprise",
    storyBeat: "digital_platform",
    label: "Primary Hero — Hauptclip",
  },

  // ── Immobilien ────────────────────────────────────────────
  {
    src: "/videos/hero/mixkit-re-paperwork.mp4",
    category: "real_estate",
    storyBeat: "operations",
    label: "Akten / Dokumentation (Mixkit 45926)",
  },
  {
    src: "/videos/hero/mixkit-re-signing.mp4",
    category: "real_estate",
    storyBeat: "coordination",
    label: "Vertragsabschluss / Transaktion (Mixkit 46533)",
  },
  {
    src: "/videos/hero/realestate-1.mp4",
    category: "real_estate",
    storyBeat: "coordination",
    label: "Objekt- & Verwaltungskontext (Büro / Außen)",
  },

  // ── Bau / Handwerk ────────────────────────────────────────
  {
    src: "/videos/hero/mixkit-build-blueprint.mp4",
    category: "construction",
    storyBeat: "coordination",
    label: "Planung & Abstimmung auf der Baustelle (Mixkit 23170)",
  },
  {
    src: "/videos/hero/mixkit-build-site.mp4",
    category: "construction",
    storyBeat: "operations",
    label: "Baustelle / Einsatz (Mixkit 23511)",
  },
  {
    src: "/videos/hero/construct-b.mp4",
    category: "construction",
    storyBeat: "operations",
    label: "Bau / Koordination (Pexels)",
  },

  // ── Logistik / Transport ─────────────────────────────────
  {
    src: "/videos/hero/mixkit-log-forklift.mp4",
    category: "logistics",
    storyBeat: "operations",
    label: "Lager / Kommissionierung (Mixkit 45848)",
  },
  {
    src: "/videos/hero/mixkit-log-aerial.mp4",
    category: "logistics",
    storyBeat: "operations",
    label: "Logistik-Standorte / Netzwerk (Mixkit 36293)",
  },
  {
    src: "/videos/hero/logistics-c.mp4",
    category: "logistics",
    storyBeat: "operations",
    label: "Operative Logistik (Pexels)",
  },
  {
    src: "/videos/hero/logistics-b.mp4",
    category: "logistics",
    storyBeat: "coordination",
    label: "Disposition / Kommunikation (Pexels)",
  },

  // ── Healthcare / Care ─────────────────────────────────────
  {
    src: "/videos/hero/mixkit-care-nurse.mp4",
    category: "healthcare",
    storyBeat: "coordination",
    label: "Pflege / Patientenkontakt (Mixkit 5568)",
  },
  {
    src: "/videos/hero/mixkit-care-docs.mp4",
    category: "healthcare",
    storyBeat: "digital_platform",
    label: "Dokumentation & digitale Medien (Mixkit 9151)",
  },
  {
    src: "/videos/hero/mixkit-care-rounds.mp4",
    category: "healthcare",
    storyBeat: "coordination",
    label: "Runden / Teamkoordination (Mixkit 35956)",
  },

  // ── Office / Enterprise / Automation layer ────────────────
  {
    src: "/videos/hero/meeting-a.mp4",
    category: "office_enterprise",
    storyBeat: "coordination",
    label: "Meetings & Entscheidungsräume",
  },
  {
    src: "/videos/hero/teamwork-a.mp4",
    category: "office_enterprise",
    storyBeat: "coordination",
    label: "Teamarbeit / Zusammenarbeit",
  },
  {
    src: "/videos/hero/office-1.mp4",
    category: "office_enterprise",
    storyBeat: "operations",
    label: "Backoffice / operative Büroarbeit",
  },
  {
    src: "/videos/hero/office-3.mp4",
    category: "office_enterprise",
    storyBeat: "operations",
    label: "Moderne Büroprozesse",
  },
  {
    src: "/videos/hero/office-orig2.mp4",
    category: "office_enterprise",
    storyBeat: "digital_platform",
    label: "Digitale Workflows / Bildschirmarbeit",
  },
  {
    src: "/videos/hero/dashboard-a.mp4",
    category: "office_enterprise",
    storyBeat: "digital_platform",
    label: "Dashboard / Steuerungssicht",
  },
  {
    src: "/videos/hero/data-b.mp4",
    category: "office_enterprise",
    storyBeat: "digital_platform",
    label: "Datengetriebene Übersicht (seriös)",
  },
  {
    src: "/videos/hero/enterprise-h.mp4",
    category: "office_enterprise",
    storyBeat: "coordination",
    label: "Führung / strategischer Kontext",
  },
  {
    src: "/videos/hero/enterprise-j.mp4",
    category: "office_enterprise",
    storyBeat: "coordination",
    label: "Unternehmensumfeld / Professionalität",
  },

  // ── Dienstleistung / Kundenprozesse ──────────────────────
  {
    src: "/videos/hero/mixkit-svc-handshake.mp4",
    category: "service",
    storyBeat: "coordination",
    label: "Kundenbegrüßung / Vertrauen (Mixkit 5506)",
  },
  {
    src: "/videos/hero/mixkit-svc-meeting.mp4",
    category: "service",
    storyBeat: "coordination",
    label: "Kundengespräch / Beratung (Mixkit 5537)",
  },
  {
    src: "/videos/hero/service-orig3.mp4",
    category: "service",
    storyBeat: "coordination",
    label: "Service / Kommunikation (Pexels)",
  },
];

// ── Helpers ─────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Vermeidet direkt aufeinanderfolgende gleiche Kategorie oder Story-Beat (greedy). */
export function orderPlaylistForPacing(clips: HeroVideoClip[]): HeroVideoClip[] {
  if (clips.length <= 1) return clips;
  const remaining = [...clips];
  const out: HeroVideoClip[] = [];
  let lastCat: HeroStoryCategory | null = null;
  let lastBeat: HeroStoryBeat | null = null;

  while (remaining.length) {
    let bestI = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i]!;
      let score = Math.random() * 0.15;
      if (c.category !== lastCat) score += 4;
      if (c.storyBeat !== lastBeat) score += 2;
      if (score > bestScore) {
        bestScore = score;
        bestI = i;
      }
    }
    const [next] = remaining.splice(bestI, 1);
    out.push(next!);
    lastCat = next!.category;
    lastBeat = next!.storyBeat;
  }
  return out;
}

/** Src des primären Hero-Clips — steht immer an erster Stelle */
export const PRIMARY_HERO_SRC = "/videos/hero/VcN9EnlG.mp4";

/**
 * 1) Primary Hero Clip steht immer zuerst
 * 2) Pro Story-Säule mindestens ein zufälliger Clip
 * 3) Zusätzliche Clips aus dem Pool (andere Kategorie / Beat bevorzugt), bis `total` erreicht
 * 4) Pacing-Reihenfolge für die restlichen Clips
 */
export function selectCuratedHeroPlaylist(total = 8): HeroVideoClip[] {
  const primaryClip = HERO_VIDEO_POOL.find((c) => c.src === PRIMARY_HERO_SRC);

  const byCat = new Map<HeroStoryCategory, HeroVideoClip[]>();
  for (const c of HERO_VIDEO_POOL) {
    if (c.src === PRIMARY_HERO_SRC) continue;
    const list = byCat.get(c.category) ?? [];
    list.push(c);
    byCat.set(c.category, list);
  }

  const chosen = new Set<string>();
  if (primaryClip) chosen.add(primaryClip.src);
  const picks: HeroVideoClip[] = [];

  const shuffledCats = shuffle([...HERO_STORY_CATEGORY_ORDER]);
  for (const cat of shuffledCats) {
    const pool = byCat.get(cat);
    if (!pool?.length) continue;
    const clip = pickRandom(shuffle(pool));
    if (!chosen.has(clip.src)) {
      chosen.add(clip.src);
      picks.push(clip);
    }
  }

  const extras: HeroVideoClip[] = shuffle(
    HERO_VIDEO_POOL.filter((c) => !chosen.has(c.src)),
  );

  for (const clip of extras) {
    if (picks.length >= total - 1) break;
    picks.push(clip);
    chosen.add(clip.src);
  }

  const rest = orderPlaylistForPacing(picks.slice(0, total - 1));
  return primaryClip ? [primaryClip, ...rest] : rest;
}
