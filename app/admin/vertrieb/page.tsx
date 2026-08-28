import { redirect } from "next/navigation";

/**
 * Vertrieb lebt innerhalb des zusammengesetzten Admin-Dashboards
 * (Segmented Views statt eigener Routen). Der direkte Deep-Link
 * `/admin/vertrieb` bleibt stabil und leitet auf den Tab um.
 */
export default function VertriebPage() {
  redirect("/admin#vertrieb");
}
