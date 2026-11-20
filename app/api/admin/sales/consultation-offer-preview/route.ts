import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/auth/authorize';
import { db } from '@/lib/pg';
import { INITIAL_TEMPLATES, validateTemplate, type TemplateCopy } from '@/lib/sales/offerTemplates';
import { offerStructured, validateCommercial } from '@/lib/sales/offerCompose';
import { renderBrandedOfferPdf } from '@/lib/sales/brandedOfferPdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } });

/** Strictly a watermarked design preview. This endpoint never creates a quote, proposal or email. */
export async function POST(req: NextRequest) {
  const gate = await authorize('sales.read');
  if (!gate.ok) return gate.response;
  if (!gate.auth.user?.isActive || !['owner','admin'].includes(gate.auth.role)) return error('Aktives Admin-Konto erforderlich', 403);
  if (req.headers.get('origin') !== req.nextUrl.origin || req.headers.get('sec-fetch-site') === 'cross-site') return error('Origin nicht erlaubt', 403);
  if (Number(req.headers.get('content-length') || 0) > 16000) return error('Anfrage zu groß', 413);
  try {
    const raw: unknown = await req.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || JSON.stringify(raw).length > 16000) return error('Ungültige Daten', 400);
    const body = raw as Record<string, unknown>;
    const commercial = validateCommercial(body.commercial);
    let shared: TemplateCopy = INITIAL_TEMPLATES.shared;
    let branded: TemplateCopy = INITIAL_TEMPLATES[commercial.brand];
    const sql = await db();
    if (sql) {
      const rows = await sql<{ template_brand: string; content: unknown }[]>`
        SELECT template_brand,content FROM sales_offer_template_versions
        WHERE state='active' AND template_brand IN ('shared',${commercial.brand})`;
      for (const row of rows) {
        if (row.template_brand === 'shared') shared = validateTemplate(row.content);
        if (row.template_brand === commercial.brand) branded = validateTemplate(row.content);
      }
    }
    const structured = offerStructured(commercial, shared, branded);
    structured.aufEinenBlick = [
      'Unverbindliche Entwurfsansicht – Leistungsumfang und Preise müssen intern freigegeben werden.',
      ...(structured.aufEinenBlick || []),
    ];
    const bytes = await renderBrandedOfferPdf({ brand: commercial.brand, structured, watermark: 'MUSTER - NICHT VERSENDEN' });
    return new NextResponse(new Uint8Array(bytes), { headers: {
      'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="angebotsentwurf.pdf"',
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch (e) {
    if (e instanceof Error && /ungültig|fehlt|lang|Liefergegenstand|Netto|Steuersatz|Gültigkeit/i.test(e.message)) return error(e.message, 400);
    console.error('[consultation-offer-preview] failed');
    return error('PDF-Vorschau aktuell nicht verfügbar', 503);
  }
}
