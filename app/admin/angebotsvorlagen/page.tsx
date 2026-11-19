import type {Metadata} from 'next';
import Link from 'next/link';
import OfferTemplatesWorkbench from '@/components/admin/sales/OfferTemplatesWorkbench';
export const metadata:Metadata={title:'Angebotsvorlagen | Admin',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default function OfferTemplatesPage(){return <main className="min-h-screen bg-[#080e19] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-[.25em] text-sky-300">INTERN · ANGEBOTE</p><h1 className="mt-3 text-3xl font-semibold">Angebotsvorlagen</h1><p className="mt-2 text-sm text-slate-400">Gemeinsames Design und markenspezifische Texte. Freigabe durch zweite berechtigte Person.</p></div><nav className="flex items-center gap-3"><Link href="/admin/kalkulation" className="rounded-xl border border-white/20 px-4 py-3 text-sm">Interne Kalkulation</Link><Link href="/admin" className="rounded-xl border border-white/20 px-4 py-3 text-sm">Admin</Link></nav></header><OfferTemplatesWorkbench/></div></main>}
