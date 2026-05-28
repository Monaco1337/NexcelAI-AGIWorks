"use client";

import React from "react";
import MinimalNavFallback from "./MinimalNavFallback";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ERROR BOUNDARIES – NICHT ENTFERNEN ODER ABSCHWÄCHEN
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Wenn eine Section (z.B. TechVisionLab, Features) einen Fehler wirft, fällt
 * NUR diese Section aus – Navigation, Hero, Karussell und alle anderen Sections
 * bleiben sichtbar und funktionsfähig.
 *
 * Regeln für künftige Änderungen:
 * - Jede neue Section auf der Homepage MUSS in <SectionErrorBoundary> gewickelt werden.
 * - Die Reihenfolge Navigation → Hero → … in page.tsx NICHT ändern.
 * - RootErrorBoundary in layout.tsx um {children} NICHT entfernen.
 */

type SectionErrorBoundaryProps = {
  sectionName: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type SectionErrorBoundaryState = {
  hasError: boolean;
};

export class SectionErrorBoundary extends React.Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[SectionErrorBoundary] "${this.props.sectionName}" ist fehlgeschlagen:`, error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <section className="py-12 lg:py-16" role="alert" aria-live="polite">
          <p className="text-center text-white/30 text-sm">
            Sektion &quot;{this.props.sectionName}&quot; temporär nicht verfügbar.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}

type RootErrorBoundaryProps = { children: React.ReactNode };
type RootErrorBoundaryState = { hasError: boolean };

export class RootErrorBoundary extends React.Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (typeof console !== "undefined" && console.error) {
      console.error("[RootErrorBoundary] Seite ist fehlgeschlagen:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col"
          style={{ background: "#0B0D12", color: "#fff" }}
        >
          <MinimalNavFallback />
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
            <h1 className="text-xl font-medium mb-2">Seite temporär nicht verfügbar</h1>
            <p className="text-white/60 text-sm mb-6">Bitte laden Sie die Seite neu.</p>
            <a href="/" className="text-[#B78CFF] hover:underline">
              Zur Startseite
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
