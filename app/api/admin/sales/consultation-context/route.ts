import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/auth/authorize';
import { db } from '@/lib/pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (data: object, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });

type CustomerSource = {
  sourceType: 'booking' | 'lead'; sourceId: string; brand: 'nexcel' | 'agiworks';
  name: string; company: string; email: string; label: string; date: string;
  detail: string; status: string;
};

/** A brand-scoped customer picker. No email addresses are exposed outside the authenticated admin API. */
export async function GET(req: NextRequest) {
  const auth = await authorize('sales.read');
  if (!auth.ok) return auth.response;
  if (!auth.auth.user?.isActive || !['owner', 'admin'].includes(auth.auth.role)) return reply({ error: 'Aktives Admin-Konto erforderlich' }, 403);
  const brandParam = req.nextUrl.searchParams.get('brand');
  if (brandParam !== 'nexcel' && brandParam !== 'agiworks') return reply({ error: 'Marke ungültig' }, 400);
  const brand: CustomerSource['brand'] = brandParam;
  const sql = await db();
  if (!sql) return reply({ error: 'Datenbank nicht erreichbar' }, 503);
  try {
    const [bookings, leads] = await Promise.all([
      sql<{ id: string; brand: string; name: string; company: string | null; email: string; project_goal: string | null; project_type: string | null; starts_at: Date; status: string }[]>`
        SELECT id, brand, name, company, email, project_goal, project_type, starts_at, status
        FROM consultation_bookings
        WHERE brand=${brand} AND status IN ('pending','confirmed') AND starts_at >= NOW() - INTERVAL '45 days'
        ORDER BY starts_at ASC LIMIT 120`,
      sql<{ id: string; brand: string; name: string; company: string | null; email: string; subject: string | null; message: string | null; created_at: Date; status: string }[]>`
        SELECT id, brand, name, company, email, subject, message, created_at, status
        FROM marketing_inbound_leads
        WHERE brand=${brand} AND status IN ('new','in_review','accepted')
        ORDER BY created_at DESC LIMIT 80`,
    ]);
    const customers: CustomerSource[] = [
      ...bookings.map(b => ({ sourceType: 'booking' as const, sourceId: b.id, brand, name: b.name, company: b.company || '', email: b.email,
        label: b.company?.trim() || b.name, date: new Date(b.starts_at).toISOString(), detail: [b.project_type, b.project_goal].filter(Boolean).join(' · ').slice(0, 300), status: b.status })),
      ...leads.map(l => ({ sourceType: 'lead' as const, sourceId: l.id, brand, name: l.name, company: l.company || '', email: l.email,
        label: l.company?.trim() || l.name, date: new Date(l.created_at).toISOString(), detail: [l.subject, l.message].filter(Boolean).join(' · ').slice(0, 300), status: l.status })),
    ];
    return reply({ brand, customers });
  } catch {
    console.error('[consultation-context] failed');
    return reply({ error: 'Kunden/Termine momentan nicht verfügbar' }, 503);
  }
}
