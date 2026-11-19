import type { Metadata } from 'next';
import Link from 'next/link';
import InternalPricingWorkbench from '@/components/admin/sales/InternalPricingWorkbench';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Projektkalkulation | NEXCEL AI × AGI Works', robots: { index: false, follow: false } };

export default function InternalPricingPage() {
  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-8 sm:py-12">
    <div className="mx-auto max-w-[1360px]">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.24em] text-blue-700">NEXCEL AI <span className="mx-1 text-slate-300">/</span> AGI Works · Intern</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] text-[#14243f] sm:text-5xl">Projektkalkulation<span className="text-blue-600">.</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Ein Gespräch. Klare Leistungen. Nachvollziehbare Preise – mit sicherem Vier-Augen-Prinzip.</p>
        </div>
        <Link href="/admin" className="inline-flex min-h-[44px] items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">← Admin-Panel</Link>
      </header>
      <InternalPricingWorkbench />
    </div>
  </main>;
}
