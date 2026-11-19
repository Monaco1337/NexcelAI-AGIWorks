import type { Metadata } from 'next';
import Link from 'next/link';
import InternalPricingWorkbench from '@/components/admin/sales/InternalPricingWorkbench';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Interne Kalkulation | NEXCEL AI × AGI Works',robots:{index:false,follow:false}};
export default function InternalPricingPage(){return <main className="min-h-screen bg-[#080d18] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs tracking-[0.25em] text-[#8dbdea]">INTERN · VERTRIEB</p><h1 className="mt-3 text-3xl font-semibold">Projektkalkulation</h1><p className="mt-2 text-sm text-slate-400">Nur für Inhaber. Preiskataloge benötigen die Freigabe der zweiten Person.</p></div><Link href="/admin" className="rounded-xl border border-white/20 px-4 py-3 text-sm hover:bg-white/5">Zurück zum Admin-Panel</Link></div><InternalPricingWorkbench /></div></main>}
