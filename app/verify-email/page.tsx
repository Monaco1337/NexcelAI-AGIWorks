import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="relative overflow-hidden min-h-screen">
          <div className="relative py-24 md:py-32 px-6 overflow-hidden min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-spin">
                <svg
                  className="w-10 h-10 text-[#A45CFF]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <p className="text-[#E5E7EB] text-lg">Lade...</p>
            </div>
          </div>
        </main>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
