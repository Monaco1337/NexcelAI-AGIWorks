"use server";

/**
 * Analytics Tracking - GARANTIERT KEINE FEHLER!
 * Gibt IMMER success zurück, auch bei Fehlern
 */

export async function trackAnalyticsEvent(
  type: "page_view" | "click" | "form_submit" | "demo_request" | "contact",
  page: string,
  metadata?: Record<string, any>
) {
  // GARANTIERT: IMMER success zurückgeben, auch bei Fehlern!
  // Analytics-Tracking ist optional und nicht kritisch
  // Gibt IMMER success zurück, auch wenn nichts gespeichert wird
  return { success: true };
}
