/**
 * Prüft, dass jeder schreibende Handler unter /api/admin autorisiert.
 *
 * Anlass: `/api/admin/systems/*` und `/api/admin/references/*` waren
 * vollständig ungeschützt — kein Sessioncheck, keine Rollenprüfung, und die
 * Middleware greift nur bei Seiten, nicht bei API-Routen. Beliebige Dritte
 * konnten Systemkarten und Referenzen anlegen, ändern und löschen.
 *
 * Einmalig zu reparieren reicht nicht; die nächste neue Route würde denselben
 * Fehler wiederholen. Diese Prüfung läuft in der CI und bricht den Build ab.
 *
 * Ausnahmen sind einzeln aufzuführen und zu begründen — es gibt legitime
 * öffentliche GET-Endpunkte unter /api/admin (Bildauslieferung für die
 * öffentliche Website).
 *
 * Usage: npm run check:api-auth
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ADMIN_API = join(ROOT, "app", "api", "admin");

/** Handler, die Daten verändern und daher immer autorisieren müssen. */
const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const ALL_METHODS = ["GET", ...WRITE_METHODS];

/**
 * Bewusst öffentliche Handler. Schlüssel ist "<route>#<METHODE>".
 * Jeder Eintrag braucht eine Begründung.
 */
const ALLOWED_PUBLIC: Record<string, string> = {
  "app/api/admin/references/[id]/cover/route.ts#GET":
    "Bildquelle der öffentlichen Referenzdarstellung",
  "app/api/admin/references/[id]/images/route.ts#GET":
    "Metadaten der öffentlichen Projektgalerie (keine Binärdaten)",
  "app/api/admin/references/[id]/images/[imageId]/route.ts#GET":
    "Bildquelle der öffentlichen Projektgalerie",
  "app/api/admin/systems/[id]/cover/route.ts#GET":
    "Bildquelle der öffentlichen Systemkarten",
};

/** Zeichen, die eine Autorisierung belegen. */
const AUTH_MARKERS = ["authorize(", "authorizeAny(", "verifySession(", "requireAdmin("];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}

/**
 * Schneidet den Rumpf eines exportierten Handlers heraus, indem geschweifte
 * Klammern gezählt werden. Ausreichend für die vorliegenden Dateien und
 * verlässlicher als eine Regex über mehrere Zeilen.
 */
function handlerBody(source: string, method: string): string | null {
  const signature = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`);
  const match = signature.exec(source);
  if (!match) return null;

  // Erst die Parameterliste überspringen. Ein simples indexOf("{") würde die
  // Destrukturierung in `{ params }: { params: { id: string } }` treffen und
  // damit einen leeren Rumpf liefern — die Prüfung liefe ins Leere.
  let parenDepth = 0;
  let cursor = match.index + match[0].length - 1;
  for (; cursor < source.length; cursor++) {
    if (source[cursor] === "(") parenDepth++;
    else if (source[cursor] === ")") {
      parenDepth--;
      if (parenDepth === 0) break;
    }
  }

  const open = source.indexOf("{", cursor);
  if (open < 0) return null;

  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return source.slice(open);
}

function main(): void {
  let files: string[];
  try {
    files = walk(ADMIN_API);
  } catch {
    console.error("app/api/admin nicht gefunden.");
    process.exit(1);
  }

  const problems: string[] = [];
  const publicGets: string[] = [];
  let checked = 0;

  for (const file of files) {
    const rel = relative(ROOT, file);
    const source = readFileSync(file, "utf8");

    for (const method of ALL_METHODS) {
      const body = handlerBody(source, method);
      if (!body) continue;

      checked++;
      const key = `${rel}#${method}`;
      const authorized = AUTH_MARKERS.some((marker) => body.includes(marker));

      if (authorized) continue;

      if (ALLOWED_PUBLIC[key]) {
        publicGets.push(`${key} — ${ALLOWED_PUBLIC[key]}`);
        continue;
      }

      problems.push(
        WRITE_METHODS.includes(method)
          ? `${key} verändert Daten ohne Autorisierung`
          : `${key} liest ohne Autorisierung und ist nicht als öffentlich vermerkt`
      );
    }
  }

  console.log(`Geprüfte Handler unter /api/admin: ${checked}`);
  if (publicGets.length > 0) {
    console.log(`\nBewusst öffentlich (${publicGets.length}):`);
    publicGets.forEach((p) => console.log(`  · ${p}`));
  }

  if (problems.length > 0) {
    console.error(`\n❌ ${problems.length} ungeschützte Handler:`);
    problems.forEach((p) => console.error(`  · ${p}`));
    console.error(
      "\nEntweder authorize(...) ergänzen oder — falls wirklich öffentlich —\n" +
        "in ALLOWED_PUBLIC in scripts/security/check-api-auth.ts begründen."
    );
    process.exit(1);
  }

  console.log("\n✅ Alle Handler unter /api/admin sind abgesichert.");
}

main();
