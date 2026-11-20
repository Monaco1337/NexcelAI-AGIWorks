'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { INITIAL_TEMPLATES, TEMPLATE_BRANDS, TEMPLATE_LABELS, type TemplateBrand, type TemplateCopy } from '@/lib/sales/offerTemplates';

type Row = { id: string; template_brand: TemplateBrand; version: number; state: string; content: TemplateCopy; created_by: string; approved_by: string | null; created_at: string };
type Panel = 'intro' | 'scope' | 'terms' | 'approval';
const clone = (value: TemplateCopy): TemplateCopy => JSON.parse(JSON.stringify(value)) as TemplateCopy;
const surface = 'sales-light-surface rounded-[24px] border border-[#dfe6ef] bg-white p-5 shadow-[0_12px_40px_-30px_rgba(16,36,65,.22)] sm:p-7';
const field = 'mt-2 w-full rounded-2xl border border-[#ced8e5] bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10';
const primary = 'inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#165dce] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_#165dce] transition hover:bg-[#0d4eb7] disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';
const panelNames: Record<Panel, string> = { intro: 'Einführung', scope: 'Leistungsumfang', terms: 'Umsetzung & Abschluss', approval: 'Freigabe' };
const labels: Record<keyof TemplateCopy, string> = {
  heading: 'Angebotstitel', introduction: 'Einleitung', recommendation: 'Empfehlung', implementation: 'Projektumsetzung',
  included: 'Enthaltene Leistungen', excluded: 'Nicht enthalten', assumptions: 'Annahmen und Mitwirkung', nextSteps: 'Nächste Schritte', closing: 'Abschlusstext',
};
const description: Partial<Record<keyof TemplateCopy, string>> = {
  heading: 'Die zentrale Überschrift auf jedem Angebot dieser Marke.',
  introduction: 'Kurze, persönliche Einordnung direkt nach der Anrede.',
  recommendation: 'Warum die vorgeschlagene Umsetzung sinnvoll ist.',
  included: 'Eine Leistung pro Zeile. Individuelle Angebotspositionen werden später im Vertrieb ergänzt.',
  excluded: 'Leistungen, die ausdrücklich nicht Teil des Angebots sind.',
  assumptions: 'Voraussetzungen und benötigte Kundenzuarbeit.',
  implementation: 'Projektphasen vom Erstgespräch bis zur Übergabe.',
  nextSteps: 'Was nach Erhalt des Angebots passieren soll.',
  closing: 'Professioneller letzter Absatz im PDF.',
};

export default function OfferTemplatesWorkbench() {
  const [brand, setBrand] = useState<TemplateBrand>('agiworks');
  const [panel, setPanel] = useState<Panel>('intro');
  const [rows, setRows] = useState<Row[]>([]);
  const [content, setContent] = useState<TemplateCopy>(clone(INITIAL_TEMPLATES.agiworks));
  const [shared, setShared] = useState<TemplateCopy>(clone(INITIAL_TEMPLATES.shared));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    const [response, commonResponse] = await Promise.all([
      fetch('/api/admin/sales/offer-templates?brand=' + brand, { credentials: 'same-origin', cache: 'no-store' }),
      fetch('/api/admin/sales/offer-templates?brand=shared', { credentials: 'same-origin', cache: 'no-store' }),
    ]);
    const [data, common] = await Promise.all([response.json(), commonResponse.json()]);
    if (version !== loadVersion.current) return;
    if (!response.ok || !commonResponse.ok) throw new Error(data.error || common.error || 'Die Vorlagen konnten nicht geladen werden.');
    const versions = (data.versions || []) as Row[];
    setRows(versions);
    setContent(clone(versions.find(item => item.state === 'draft')?.content || data.active?.content || data.defaults));
    setShared(clone(common.active?.content || common.defaults));
  }, [brand]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    load().catch(e => { if (live) setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [load]);

  const action = async (body: Record<string, unknown>) => {
    setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/sales/offer-templates', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, ...body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');
      await load();
      setMessage(body.action === 'save' ? 'Entwurf gespeichert. Änderungen werden erst nach Gegenfreigabe aktiv.' : body.action === 'submit' ? 'Zur zweiten Freigabe eingereicht.' : body.action === 'approve' ? 'Vorlage freigegeben.' : 'Aktion abgeschlossen.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen'); }
    finally { setBusy(false); }
  };
  const change = (key: keyof TemplateCopy, value: string | string[]) => setContent(old => ({ ...old, [key]: value }));
  const preview = async () => {
    setBusy(true); setError('');
    try {
      const deadline = new Date(); deadline.setUTCDate(deadline.getUTCDate() + 21);
      const commercial = {
        brand: brand === 'agiworks' ? 'agiworks' : 'nexcel', customer: 'BEISPIEL GmbH – DEMO',
        title: 'Musterangebot – reine Designvorschau', scope: 'Muster-Leistungsumfang zur Layoutprüfung',
        deliverables: ['Muster-Liefergegenstand'], netCents: 10000, vatRate: 0.19,
        annualMaintenanceNetCents: 0, validUntil: deadline.toISOString().slice(0, 10),
      };
      const payload = { commercial, shared: brand === 'shared' ? content : shared, brand: brand === 'shared' ? INITIAL_TEMPLATES.nexcel : content };
      const response = await fetch('/api/admin/sales/offer-templates/preview', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('PDF-Vorschau fehlgeschlagen. Bitte die Pflichtfelder prüfen.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'angebotsvorschau.pdf'; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage('PDF-Designvorschau heruntergeladen. Es wurde kein Angebot versendet.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Vorschau fehlgeschlagen'); }
    finally { setBusy(false); }
  };

  const active = rows.find(item => item.state === 'active');
  const draft = rows.find(item => item.state === 'draft');
  const pending = rows.filter(item => item.state === 'pending');
  const updateBrand = (value: TemplateBrand) => { if (brand !== value) { ++loadVersion.current; setLoading(true); setBrand(value); setError(''); setMessage(''); } };
  const textField = (key: keyof TemplateCopy, height = 'min-h-[115px]') => <label key={key} className="block text-sm font-semibold text-slate-800">
    {labels[key]}{description[key] && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{description[key]}</span>}
    <textarea className={field + ' ' + height + ' resize-y'} maxLength={2200} value={content[key] as string} onChange={e => change(key, e.currentTarget.value)} />
  </label>;
  const listField = (key: keyof TemplateCopy) => <label key={key} className="block text-sm font-semibold text-slate-800">
    {labels[key]}<span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{description[key]}</span>
    <textarea className={field + ' min-h-[150px] resize-y'} value={(content[key] as string[]).join('\n')} onChange={e => change(key, e.currentTarget.value.split('\n').map(x => x.trim()).filter(Boolean))} />
  </label>;

  return <div className="sales-calm-ui space-y-6 rounded-[26px] bg-[#f5f7fa] p-3 text-[#1c293d] sm:p-5 lg:p-6">
    <style jsx global>
      {`
      .sales-calm-ui {
        color-scheme: light;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-body), "Segoe UI", sans-serif;
        color: #1c293d;
        -webkit-font-smoothing: antialiased;
      }
      :where(.sales-calm-ui .sales-light-surface) :is(h1,h2,h3,h4,h5,h6) {
        color: #142238 !important;
        text-shadow: none !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", var(--font-headline), sans-serif;
        line-height: 1.27;
        letter-spacing: -0.025em;
      }
      :where(.sales-calm-ui .sales-light-surface) :is(p,span,div,label,li,strong,small,summary,td,th) {
        color: #344256;
        text-shadow: none;
      }
      :where(.sales-calm-ui .sales-light-surface) :is(input,textarea,select) {
        color: #19273d;
        background-color: #ffffff;
      }
      :where(.sales-calm-ui .sales-light-surface) :is(input,textarea)::placeholder { color: #67768b; opacity: 1; }
      :where(.sales-calm-ui .sales-light-surface) :is(button,a,input,textarea,select):focus-visible {
        outline: 2px solid #2563eb;
        outline-offset: 3px;
      }
      :where(.sales-calm-ui .sales-light-surface) [class~="text-slate-400"] { color: #64748b; }
      :where(.sales-calm-ui .sales-light-surface) input[type="checkbox"] {
        accent-color: #2563eb;
        color-scheme: light;
      }
      @media (prefers-reduced-motion: reduce) {
        .sales-calm-ui :is(button,a,input,textarea,select) { transition-duration: 0.01ms !important; }
      }
      `}
    </style>
    <div className={surface}>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Vorlagenbibliothek</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3" role="group" aria-label="Angebotsmarke">
        {TEMPLATE_BRANDS.map(item => <button key={item} type="button" aria-pressed={brand === item} onClick={() => updateBrand(item)}
          className={'min-h-[70px] rounded-2xl border px-4 py-3 text-left transition ' + (brand === item ? 'border-blue-400 bg-blue-50 text-blue-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white')}>
          <span className="block text-sm font-bold text-slate-900">{TEMPLATE_LABELS[item]}</span><span className="mt-1 block text-xs text-slate-600">{item === 'shared' ? 'Markenübergreifende Texte' : 'Eigene Sprache und Positionierung'}</span>
        </button>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{active ? 'Freigegeben: v' + active.version : 'Noch keine Freigabe'}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{pending.length} offen</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{rows.length} Versionen</span></div>
    </div>

    <nav className="grid grid-cols-2 gap-2 rounded-[20px] border border-[#dfe6ef] bg-[#e9eef5] p-1.5 md:grid-cols-4" aria-label="Vorlagen bearbeiten">
      {(['intro', 'scope', 'terms', 'approval'] as const).map((key, index) => <button key={key} type="button" onClick={() => setPanel(key)} aria-current={panel === key ? 'step' : undefined}
        className={'min-h-[48px] rounded-[18px] px-2 text-xs font-semibold transition sm:text-sm ' + (panel === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60')}><span className="mr-2 hidden text-blue-600 sm:inline">0{index + 1}</span>{panelNames[key]}</button>)}
    </nav>
    {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">{message}</p>}

    {loading ? <div className={surface + ' text-slate-500'}>Vorlage wird geladen …</div> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(290px,365px)]">
      <div className="space-y-6">
        {panel === 'intro' && <section className={surface}>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Schritt 1 · Basis</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Die richtige Ansprache</h2>
          <p className="mb-6 mt-2 text-sm text-slate-500">Nur die wichtigsten Texte. Du musst nicht das komplette Angebot auf einmal ausfüllen.</p>
          <div className="space-y-5">{textField('heading', 'min-h-[70px]')}{textField('introduction')}{textField('recommendation')}</div>
        </section>}
        {panel === 'scope' && <section className={surface}>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Schritt 2 · Leistungen</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Was ist im Angebot?</h2>
          <p className="mb-6 mt-2 text-sm text-slate-500">Eine Leistung pro Zeile. Keine Preise und keine echten Kundenangaben in der Vorlage hinterlegen.</p>
          <div className="space-y-5">{listField('included')}{listField('excluded')}</div>
        </section>}
        {panel === 'terms' && <section className={surface}>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Schritt 3 · Projektablauf</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Umsetzung und Abschluss</h2>
          <div className="mt-6 space-y-5">{textField('implementation')}{listField('assumptions')}{listField('nextSteps')}{textField('closing')}</div>
        </section>}
        {panel === 'approval' && <section className={surface}>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Schritt 4 · Freigabe</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Versionen sicher freigeben</h2>
          <p className="mt-2 text-sm text-slate-500">Eine andere berechtigte Person muss die Vorlage freigeben. Eigene Änderungen werden nicht automatisch aktiv.</p>
          <div className="mt-6 space-y-3">{draft ? <div className="rounded-2xl border border-slate-200 p-5"><strong>Entwurf v{draft.version}</strong><p className="mt-1 text-xs text-slate-500">Noch nicht für neue Angebote aktiv</p><button type="button" className={primary + ' mt-4 w-full'} disabled={busy} onClick={() => action({ action: 'submit', versionId: draft.id })}>Zur Gegenfreigabe einreichen</button></div> : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Noch kein Entwurf. Zuerst die Vorlage speichern.</p>}
            {pending.map(item => <div key={item.id} className="rounded-2xl border border-slate-200 p-5"><strong>Offen: v{item.version}</strong><p className="mt-1 text-xs text-slate-500">Erstellt von {item.created_by.slice(0, 28)}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => { setContent(clone(item.content)); setPanel('intro'); }}>Prüfen</button><button type="button" className={primary} disabled={busy} onClick={() => action({ action: 'approve', versionId: item.id })}>Freigeben</button><button type="button" className={secondary} disabled={busy} onClick={() => action({ action: 'reject', versionId: item.id })}>Ablehnen</button></div></div>)}
            {!pending.length && <p className="text-sm text-slate-500">Keine Gegenfreigaben offen.</p>}</div>
        </section>}
        {panel !== 'approval' && <div className={surface + ' flex flex-wrap items-center justify-between gap-3'}><div><strong className="text-sm">Noch nicht veröffentlicht</strong><p className="mt-1 text-xs text-slate-500">Speichern legt einen neuen Entwurf an. Die Freigabe ist separat.</p></div><button type="button" className={primary} disabled={busy} onClick={() => action({ action: 'save', content })}>Entwurf speichern</button></div>}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6">
        <section className={surface}>
          <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Vorschau</p><h3 className="mt-1 text-lg font-semibold">So wirkt dein Angebot</h3></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Entwurf</span></div>
          <div className="rounded-[20px] border border-slate-200 bg-[#fdfefe] px-5 py-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,.28)]">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-blue-700">{TEMPLATE_LABELS[brand]}</p>
            <div className="mt-4 h-1 w-10 rounded-full bg-blue-600" />
            <h4 className="mt-5 break-words text-lg font-semibold leading-6 tracking-tight text-slate-900">{content.heading || 'Dein Angebotstitel'}</h4>
            <p className="mt-4 whitespace-pre-line text-xs leading-5 text-slate-600">{content.introduction || 'Einleitung hier eingeben …'}</p>
            <div className="my-5 h-px bg-slate-100" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Empfehlung</p>
            <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{content.recommendation || 'Kurzempfehlung hier eingeben …'}</p>
            <div className="mt-5 rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Leistungsumfang</p><ul className="mt-2 space-y-1 text-xs text-slate-600">{content.included.slice(0, 4).map((item, index) => <li key={index}>• {item}</li>)}</ul></div>
            <p className="mt-5 border-t border-slate-100 pt-3 text-[10px] text-slate-400">PDF-Vorschau nur zur Gestaltung. Preise und Kundendaten werden separat im Vertrieb festgelegt.</p>
          </div>
          <button type="button" className={secondary + ' mt-5 w-full'} disabled={busy} onClick={preview}>PDF herunterladen ↗</button>
        </section>
        <div className="sales-light-surface rounded-[24px] border border-[#c7daf6] bg-[#eaf2ff] p-6 text-slate-900"><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Ein System · zwei Marken</p><p className="mt-3 text-sm leading-6 text-slate-700">Gestaltung und Textvorlagen zentral verwalten. Der feste Kundenpreis wird erst beim konkreten Angebot hinterlegt.</p><Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 underline underline-offset-4" href="/admin/kalkulation">Zur Preiskalkulation →</Link></div>
      </aside>
    </div>}
  </div>;
}
