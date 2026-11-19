# Internes Angebots- und Preismanagement — Freigabeprotokoll

## Warum
Preiskalkulator und öffentliche Euro-Korridore werden von NEXCEL AI und AGI Works entfernt. Öffentliche URLs `/preise` und `/preiskalkulator` führen mit HTTP 308 zur jeweiligen `/beratung`. Website-Besucher können stattdessen Beratung buchen oder über `/kontakt` anfragen.

## Intern
- `/admin/kalkulation` ist nur für aktive Administrationskonten erreichbar; API wird unabhängig vom Seiten-Guard geschützt.
- Die vollständigen Startpreise werden ausschließlich aus dem geschützten API-Endpunkt geliefert (nicht in öffentlich abrufbare JS-Bundles serialisiert).
- Jede Marke hat ihren eigenen Preisstand. Entwürfe sind versioniert. Eine zweite berechtigte Person muss den Entwurf freigeben; Selbstfreigabe wird abgewiesen.
- Angebotskalkulationen sind **unverbindliche interne** Budgetspannen; verbindliche Freigabe eines konkreten Kundenangebots bleibt Teil des bestehenden Vertriebs-/Angebotsprozesses.
- Ein erfasster Kunden-Kalkulationssnapshot nutzt immer den letzten freigegebenen Preisstand. Steuern und laufende Wartung sind getrennt.
- Inhaber/Partner müssen sich mit **zwei verschiedenen Nutzerkonten** anmelden. Ohne zweiten Admin ist keine Freigabe möglich (beabsichtigt).
- Bestehende Angebote, Rechnungen und alle Datenbankmigrationen 0001–0018 bleiben unverändert.

## Vor Go-live prüfen
1. Namentliche Admin-Konten, Rollen und aktive Identitäts-/CRM-Verfügbarkeit.
2. Preisvalidierung und Vier-Augen-Freigabe für beide Marken.
3. Netto-/Umsatzsteuerbehandlung mit Steuerberatung; SaaS-Lizenzen und Drittanbieter ausdrücklich in Angeboten.
4. Redirects der öffentlichen Kalkulator- und Preisseiten auf beiden Hosts einschließlich `/agiworks/` Preview.
5. Alle öffentlichen Menüs, interne Links, Sitemap und GSC-URL-Prüfungen.
6. `npm run seo:all`, Marken-/Booking-/Auth-Selbsttests, `npx tsc --noEmit`, `npm run build`.
7. Funnel in GSC und Analytics nach Marken unterscheiden: Klick Beratung, Klick Kontakt, tatsächliche gebuchte Termine, qualifizierte Anfragen, gewonnenes Angebot.

## Fehlerfall
Keinen Datenbank- oder Pricing-Fehler in einen anonymen Default-Preiskatalog umwandeln. Ohne bestätigte aktive Regeln lässt sich nur eine interne Vorschau berechnen; echte Kundenkalkulationen werden nicht gespeichert. Rollback durch Git-Revert; Migration 0019 bleibt als additive Tabelle bestehen und wird nicht rückwirkend gelöscht.
