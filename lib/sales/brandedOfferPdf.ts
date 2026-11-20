/** One PDF renderer for preview, stored offer documents and safe version downloads. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb } from 'pdf-lib';
import { renderProposalPdf, type RenderProposalOptions } from './proposalPdf';

const LOGOS = {
  nexcel: 'public/images/logos/nexcel-logo.png',
  agiworks: 'public/images/logos/agiworks-logo-full.png',
} as const;

export async function renderBrandedOfferPdf(opts: RenderProposalOptions): Promise<Uint8Array> {
  const base = await renderProposalPdf(opts);
  if (opts.brand !== 'nexcel' && opts.brand !== 'agiworks') return base;
  // Fail closed if the published official logo is missing; no silent placeholder branding.
  const logoBytes = await readFile(path.join(process.cwd(), LOGOS[opts.brand]));
  const pdf = await PDFDocument.load(base);
  const logo = await pdf.embedPng(logoBytes);
  const maxW = 136;
  const maxH = 24;
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const width = logo.width * scale;
  const height = logo.height * scale;
  for (const page of pdf.getPages()) {
    // Replace only the prior wordmark header; keep the existing A4 layout, metadata and page footer.
    page.drawRectangle({ x: 52, y: 797, width: 153, height: 31, color: rgb(1, 1, 1) });
    page.drawImage(logo, { x: 54, y: 800 + (24 - height) / 2, width, height });
  }
  return new Uint8Array(await pdf.save());
}
