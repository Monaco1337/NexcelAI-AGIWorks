# NEXCEL AI Website

Eine hochwertige, futuristische Business-Webseite mit VisionOS-Ästhetik und Glassmorphism-Design.

## Technologie-Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS**
- **Framer Motion** (Animationen)

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

Die Webseite läuft dann auf [http://localhost:3001](http://localhost:3001) (Port 3000 ist für Immostripe belegt)

## Build

```bash
npm run build
npm start
```

## Design-Features

- **VisionOS-Ästhetik**: Moderne, schwebende UI-Elemente
- **Glassmorphism**: Transparente Glas-Effekte mit Backdrop-Blur
- **Premium-Farben**: Primärfarbe #1B8F6A (Deep Emerald), Sekundärfarbe #29DFA8 (Crystal Emerald), Weiß, Silber
- **Sanfte Animationen**: Professionelle, weiche Übergänge
- **Responsive Design**: Optimiert für Mobile, Tablet und Desktop

## Projektstruktur

```
├── app/
│   ├── globals.css       # Globale Styles und Tailwind-Utilities
│   ├── layout.tsx        # Root-Layout
│   └── page.tsx          # Hauptseite
├── components/
│   ├── Hero.tsx          # Hero-Sektion
│   ├── Features.tsx      # Features-Grid
│   ├── SystemModules.tsx # Systemfunktionen
│   ├── TargetAudience.tsx # Zielgruppen
│   ├── WhyMe.tsx         # Warum-Ich-Sektion
│   ├── DemoGallery.tsx   # Demo-Galerie
│   ├── Pricing.tsx       # Pricing-Karten
│   ├── Contact.tsx        # Kontakt-Formular
│   └── Footer.tsx         # Footer
└── ...
```

## Anpassungen

Alle Komponenten sind modular aufgebaut und leicht anpassbar. Die Farben, Texte und Inhalte können einfach in den jeweiligen Komponenten-Dateien geändert werden.

