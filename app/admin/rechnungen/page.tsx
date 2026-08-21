import { redirect } from "next/navigation";

/**
 * Rechnungen leben innerhalb des zusammengesetzten Admin-Dashboards
 * (Segmented Views statt eigener Routen). Die dedizierten Pfade der
 * Anforderung leiten deshalb in die passende Ansicht um — der Deep-Link
 * bleibt so trotzdem stabil.
 */
export default function RechnungenPage() {
  redirect("/admin#rechnungen");
}
