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
import { migration0008 } from "./0008_billing_snapshot_hardening";
import { migration0009 } from "./0009_sales";
import { migration0010 } from "./0010_sales_targets";
import { migration0011 } from "./0011_sales_targets_hardening";
import { migration0012 } from "./0012_sales_targets_geocache";
import { migration0013 } from "./0013_sales_targets_bulk_catalog";
import { migration0014 } from "./0014_sales_targets_chain_flag";
import { migration0015 } from "./0015_sales_targets_prescore";
import { migration0016 } from "./0016_revenue_raw_evidence";
import { migration0017 } from "./0017_revenue_identity_resolution";
import { migration0018 } from "./0018_revenue_orchestration_coverage";
import { migration0019 } from "./0019_revenue_qualification_config";
import { migration0020 } from "./0020_revenue_read_models_metrics";
import { migration0021 } from "./0021_revenue_list_projection_backfill";
import { migration0022 } from "./0022_revenue_provider_call_reservations";
import { migration0023 } from "./0023_revenue_rollout_controls";
import { migration0024 } from "./0024_revenue_merge_ledger";
import { migration0025 } from "./0025_revenue_contact_idempotency";
import { migration0026 } from "./0026_provider_acquisition_telemetry";
import { migration0027 } from "./0027_golden_dataset_reviews";

export const MIGRATIONS: Migration[] = [
  migration0001,
  migration0002,
  migration0003,
  migration0004,
  migration0005,
  migration0006,
  migration0007,
  migration0008,
  migration0009,
  migration0010,
  migration0011,
  migration0012,
  migration0013,
  migration0014,
  migration0015,
  migration0016,
  migration0017,
  migration0018,
  migration0019,
  migration0020,
  migration0021,
  migration0022,
  migration0023,
  migration0024,
  migration0025,
  migration0026,
  migration0027,
];
