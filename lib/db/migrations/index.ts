/**
 * Geordnete Liste aller Migrationen.
 *
 * Bewusst explizite Imports statt Verzeichnis-Scan: Next.js bündelt
 * Serverless-Funktionen, ein zur Laufzeit gelesenes Verzeichnis existiert im
 * Deployment nicht.
 *
 * Neue Migration hinzufügen:
 *  1. Datei `NNNN_kurzer_name.ts` anlegen, ID fortlaufend vergeben.
 *  2. Hier importieren und ans ENDE des Arrays hängen.
 *  3. Bestehende Migrationen niemals nachträglich bearbeiten — sie sind auf
 *     Produktivdatenbanken bereits angewendet und werden nicht erneut ausgeführt.
 */

import type { Migration } from "../migrationRunner";
import { migration0001 } from "./0001_baseline";
import { migration0002 } from "./0002_identity";
import { migration0003 } from "./0003_audit_log";
import { migration0004 } from "./0004_tickets";
import { migration0005 } from "./0005_projects";
import { migration0006 } from "./0006_billing";
import { migration0007 } from "./0007_billing_share_assets";

export const MIGRATIONS: Migration[] = [
  migration0001,
  migration0002,
  migration0003,
  migration0004,
  migration0005,
  migration0006,
  migration0007,
];
