"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: "linear-gradient(180deg, #0C0F1A 0%, #111622 100%)",
    }}>
      <div className="text-center px-4">
        <h2 className="text-4xl font-bold text-white mb-4">Etwas ist schiefgelaufen</h2>
        <p className="text-lg text-white/70 mb-8">
          {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}

