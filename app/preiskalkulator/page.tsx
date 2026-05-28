"use client";

import { Suspense } from "react";
import PreiskalkulatorContent from "@/components/pricing/PreiskalkulatorContent";

export default function PreiskalkulatorPage() {
  return (
    <Suspense
      fallback={
        <main className="ds-app min-h-screen flex items-center justify-center text-white">
          <div
            className="rounded-2xl px-8 py-6 text-white/70"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Laden …
          </div>
        </main>
      }
    >
      <PreiskalkulatorContent />
    </Suspense>
  );
}
