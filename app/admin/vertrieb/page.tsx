import { redirect } from "next/navigation";

/**
 * Vertrieb lebt innerhalb des zusammengesetzten Admin-Dashboards
 * (Segmented Views statt eigener Routen). Der direkte Deep-Link
 * `/admin/vertrieb` bleibt stabil und öffnet direkt die Zielkunden.
 */
export default function VertriebPage() {
  redirect("/admin?salesView=targets#vertrieb");
}
