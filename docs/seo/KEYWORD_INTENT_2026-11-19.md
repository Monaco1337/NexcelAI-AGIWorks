# NEXCEL AI × AGI Works — Suchintention und Implementierung

**Recherche:** 19. November 2026 · **Suchmarkt:** Deutschland · **Referenz:** OpenSEO-Keyword-Berichte vom 19.11.2026.

## Grundsatz

Zwei Marken teilen ein Repository, aber keine identische Kaufseite:
- **NEXCEL AI:** Strategische KI-Beratung, Prozessbewertung, Automatisierung, kontrollierte Agenten.
- **AGI Works:** Individualsoftware, Engineering, Schnittstellen, Web-App-Entwicklung und laufender Betrieb.

Bestehende URLs werden verbessert; es entstehen **keine neuen indexierbaren Seiten**. Es gibt keine automatischen Indexfreigaben, keine Veränderung an Canonicals, robots.txt, Sitemaps, Layout, Hero, Preislogik oder Buchung.

## Keyword → URL → Nutzerabsicht

| Marke | Hauptkeyword | geschätztes DE-Suchvolumen/Monat | Primäre URL | Suchintention |
| --- | --- | ---: | --- | --- |
| NEXCEL AI | KI-Beratung für Unternehmen | 170 | `/loesungen/ki-systeme` | Unternehmensprozess prüfen, KI-Einstieg planen |
| NEXCEL AI | KI-Beratung Mittelstand | 140 | `/loesungen/ki-systeme` | Priorisierung, Risiko, Pilot |
| NEXCEL AI | KI-Automatisierung | 880 | `/loesungen/automatisierung` | Regelabläufe und KI-Anteile bewerten |
| NEXCEL AI | Prozessautomatisierung | 720 | `/loesungen/automatisierung` | Manuelle Routinen digitalisieren |
| NEXCEL AI | KI-Agenten für Unternehmen | 90 | `/loesungen/ki-agenten` | Agenten und Kontrollrahmen auswählen |
| AGI Works | Individuelle Softwareentwicklung | 210 | `/leistungen/softwareentwicklung` | Entwicklungsdienstleister evaluieren |
| AGI Works | Software entwickeln lassen | 110 | `/leistungen/softwareentwicklung` | Angebot und technischen Leistungsumfang klären |
| AGI Works | ERP-Integration | 90 | `/leistungen/api-entwicklung` | Systeme verbinden und Datenflüsse absichern |
| AGI Works | Web-App entwickeln lassen | 40 | `/leistungen/web-app-entwicklung` | Browser-Anwendung beauftragen |
| AGI Works | Softwareentwicklung Kosten | 40 | `/wissen/was-kostet-softwareentwicklung` | Budget- und Projektumfang verstehen |

**Nicht addieren:** nahe Keyword-Varianten können in Schätzungen derselben Nachfrage entsprechen. Ein Suchvolumen ist kein Traffic-Versprechen.

## Verantwortlichkeiten der Seiten

- Die Leistungs-/Lösungsseiten beantworten fachlich das *Was, Warum, Wann, Wie und unter welchen Grenzen*.
- `/beratung` bleibt ein terminorientierter Conversion-Endpunkt. Bestehende CTA-Komponenten werden nicht verändert.
- Der Kostenratgeber ist informativ, verweist aber auf reale Dienstleistungen statt Fixpreise zu behaupten.
- Bestehende interne Navigationslinks können ergänzend auf `/beratung` zeigen. Keine neuen künstlichen Stadt-Unterseiten.
- Keine Kundenlogos, Fallzahlen, Einsparungen oder Datenschutz-Zertifikate ohne belegbare Grundlage erfinden.

## Freigabe- und Qualitätsgates

1. Änderungen in eigenem Branch; keine direkte Änderung an `main`.
2. `npm run seo:all` ohne Blocker.
3. `python3 scripts/seo/nonvisual-seo-guard.py`, `python3 scripts/seo/brand-megamenu-gate.py`, `python3 scripts/seo/dark-theme-gate.py`, `python3 scripts/seo/booking-brand-gate.py` erfolgreich.
4. `npx tsx scripts/consultations/selftest.ts`, `npm run check:api-auth`, `npx tsc --noEmit`, `npm run build` erfolgreich.
5. Pull Request prüfen, danach erst Merge und Vercel-Deployment gemäß bestehendem Freigabeprozess.
6. Live auf beiden Domains: HTTP 200, richtiger Canonical/Meta/Brand, interne Links, JSON-LD, `robots.txt`, `sitemap.xml`, Terminbuchung unverändert.
7. Google Search Console vier Wochen lang: **fachlich relevante** Impressionen, Query-Positionsverteilung, Klicks, qualifizierte Beratungsanfragen. Fachfremde Suchanfragen separat ausweisen.

## Grenzen

Die Auswertung vom 20.10.–16.11.2026 zeigte fachfremde Suchanfragen auf Standortseiten. Die 50-seitigen OpenSEO-Audits je Marke deckten nicht alle 82 Sitemap-URLs ab. Bei Formularen meldete der Crawler knappen HTML-Inhalt; das ist kein Beweis für eine Indexierungsstörung. Ein KI-Sichtbarkeitstracker wurde bislang nicht ausgeführt. Rankings und KI-Erwähnungen sind nicht garantiert.
