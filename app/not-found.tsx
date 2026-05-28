"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: "linear-gradient(180deg, #0C0F1A 0%, #111622 100%)",
    }}>
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-white/70 mb-8">Diese Seite konnte nicht gefunden werden.</p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}

