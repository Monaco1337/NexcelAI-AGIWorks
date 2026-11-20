'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LABELS, PROJECTS, MODULES, SCOPES, TIMEFRAMES, QUALITIES,
  type PriceRules, type QuoteInput, type Brand, type Range,
} from '@/lib/sales/pricingTypes';

type Version = { id: string; brand: Brand; version: number; state: string; rules: PriceRules; created_by: string; approved_by: string | null; created_at: string };
type Quote = { projectNet: Range; projectGross: Range; annualMaintenanceNet: Range; vat: Range; vatRate: number; items: { label: string; min: number; max: number }[]; disclaimer: string };
type Panel = 'consult' | 'catalog' | 'approval';
type CustomerSource = { sourceType: 'booking'|'lead'; sourceId:string; brand: Brand; name:string; company:string; email:string; label:string; date:string; detail:string; status:string };
type SalesOpportunity = { id:string; title:string; companyName:string; brandContext: Brand; status:string };


const initialSelection: QuoteInput = {
  projectTypes: ['app'], scope: 'growth', timeframe: 'standard', quality: 'professional',
  modules: [], apiCount: 0, includesAi: false, includesMigration: false, includeAnnualMaintenance: false,
};
const euro = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const surface = 'sales-light-surface rounded-[24px] border border-[#dfe6ef] bg-white p-5 shadow-[0_12px_40px_-30px_rgba(16,36,65,.22)] sm:p-7';
const field = 'w-full rounded-2xl border border-[#ced8e5] bg-white px-4 py-3 text-[15px] font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10';
const primary = 'inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#165dce] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_#165dce] transition hover:bg-[#0d4eb7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40';
const badge = 'inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600';
const categoryName: Record<QuoteInput['scope'], string> = { mvp: 'Wachstum', growth: 'Standard', enterprise: 'Premium' };
const durationName: Record<QuoteInput['timeframe'], string> = { asap: 'Priorisiert', standard: 'Standard', relaxed: 'Flexibel' };
const qualityName: Record<QuoteInput['quality'], string> = { startup: 'Basis', professional: 'Professional', elite: 'Premium' };
const title: Record<Panel, string> = { consult: 'Gesprächskalkulation', catalog: 'Preise festlegen', approval: 'Freigaben' };

function PriceInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block min-w-0 flex-1">
    <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500">{label}</span>
    <div className="relative">
      <input type="text" inputMode="numeric" autoComplete="off" maxLength={9}
        value={String(value)} onFocus={e => e.currentTarget.select()}
        onChange={e => { const digits = e.currentTarget.value.replace(/\D/g, ''); onChange(digits ? Number(digits) : 0); }}
        aria-label={label} className={field + ' pr-10 tabular-nums'} />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">€</span>
    </div>
  </label>;
}

export default function InternalPricingWorkbench() {
  const [brand, setBrand] = useState<Brand>('agiworks');
  const [panel, setPanel] = useState<Panel>('consult');
  const [versions, setVersions] = useState<Version[]>([]);
  const [rules, setRules] = useState<PriceRules | null>(null);
  const [defaults, setDefaults] = useState<PriceRules | null>(null);
  const [selection, setSelection] = useState<QuoteInput>(initialSelection);
  const [configured, setConfigured] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customerLabel, setCustomerLabel] = useState('');
  const [customerSources, setCustomerSources] = useState<CustomerSource[]>([]);
  const [customerSourceKey, setCustomerSourceKey] = useState('manual');
  const [sourceError, setSourceError] = useState('');
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [opportunityId, setOpportunityId] = useState('');
  const [savedQuoteId, setSavedQuoteId] = useState('');
  const [createdProposalId, setCreatedProposalId] = useState('');
  const [offerTitle, setOfferTitle] = useState('Individuelles Projektangebot');
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10));
  const [maintenanceNet, setMaintenanceNet] = useState('');
  const [outOfRangeReason, setOutOfRangeReason] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const [notes, setNotes] = useState('');
  const [manualNet, setManualNet] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const loadVersion = useRef(0);

  useEffect(() => {
    let live = true;
    setCustomerSources([]);setSourceError('');setOpportunities([]);setOpportunityId('');
    const loadCustomers = async () => {
      const [customersResponse, opportunitiesResponse] = await Promise.all([
        fetch('/api/admin/sales/consultation-context?brand=' + brand,{credentials:'same-origin',cache:'no-store'}),
        fetch('/api/admin/sales/opportunities?brand=' + brand + '&open=1&limit=150',{credentials:'same-origin',cache:'no-store'}),
      ]);
      if(!live)return;
      const customersData=await customersResponse.json();
      const opportunitiesData=await opportunitiesResponse.json();
      if(!customersResponse.ok) throw new Error(customersData.error || 'Termine und Leads können nicht geladen werden');
      if(!opportunitiesResponse.ok) throw new Error(opportunitiesData.error || 'CRM kann nicht geladen werden');
      if(!live)return;
      setCustomerSources((customersData.customers || []) as CustomerSource[]);
      setOpportunities((opportunitiesData.opportunities || []) as SalesOpportunity[]);
    };
    loadCustomers().catch(e=>{if(live)setSourceError(e instanceof Error?e.message:'Kundenverwaltung nicht verfügbar');});
    return ()=>{live=false;};
  },[brand]);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    const response = await fetch('/api/admin/pricing?brand=' + brand, { credentials: 'same-origin', cache: 'no-store' });
    const data = await response.json();
    if (version !== loadVersion.current) return;
    if (!response.ok) throw new Error(data.error || 'Der Preiskatalog ist momentan nicht erreichbar.');
    const records = (data.versions || []) as Version[];
    setVersions(records);
    setConfigured(Boolean(data.active));
    const saved = records.find(item => item.state === 'draft')?.rules || data.active?.rules || data.defaults;
    setDefaults(data.defaults);
    setRules(clone(saved));
    setQuote(null);
  }, [brand]);
  useEffect(() => {
    let live = true;
    setError('');
    setLoading(true);
    load().catch(e => { if (live) setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [load]);

  const request = async (body: Record<string, unknown>) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, ...body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Aktion fehlgeschlagen');
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen');
      return null;
    } finally { setBusy(false); }
  };
  const rangeValid = (value: Range) => Number.isFinite(value.min) && Number.isFinite(value.max) && value.min >= 0 && value.max >= value.min && value.max <= 5000000;
  const allRanges = rules ? [...PROJECTS.map(k => rules.base[k]), ...MODULES.map(k => rules.modules[k])] : [];
  const invalidRanges = allRanges.filter(item => !rangeValid(item)).length;
  const unpriced = allRanges.filter(item => item.min <= 0 || item.max <= 0).length;
  const updateRange = (group: 'base' | 'modules', key: string, end: 'min' | 'max', value: number) => {
    setRules(previous => {
      if (!previous) return previous;
      const next = clone(previous);
      (next[group] as Record<string, Range>)[key][end] = value;
      return next;
    });
    setQuote(null);
  };
  const updateFactor = (group: 'scope' | 'timeframe' | 'quality', key: string, value: number) => {
    setRules(previous => {
      if (!previous) return previous;
      const next = clone(previous);
      (next[group] as Record<string, number>)[key] = value;
      return next;
    });
    setQuote(null);
  };
  const updateChoice = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setSelection(previous => ({ ...previous, [key]: value }));
    setQuote(null); setSavedQuoteId(''); setCreatedProposalId('');
  };
  const flip = <T extends string,>(items: T[], key: T): T[] => items.includes(key) ? items.filter(item => item !== key) : [...items, key];
  const pending = versions.filter(item => item.state === 'pending');
  const draft = versions.find(item => item.state === 'draft');
  const active = versions.find(item => item.state === 'active');
  const draftComplete = draft ? [...PROJECTS.map(k => draft.rules.base[k]), ...MODULES.map(k => draft.rules.modules[k])].every(item => item.min > 0 && item.max >= item.min) : false;

  const preview = async () => {
    if (!rules || invalidRanges) return;
    const data = await request({ action: 'preview', rules, selection });
    if (data?.quote) { setQuote(data.quote); setMessage('Interner Budgetkorridor berechnet. Noch kein verbindliches Angebot.'); }
  };
  const save = async () => {
    if (!rules || invalidRanges) return;
    const data = await request({ action: 'save', rules });
    if (data) { await load(); setMessage('Preisversion gespeichert. Zur Aktivierung muss eine zweite Person freigeben.'); }
  };
  const stage = async (action: 'submit' | 'approve' | 'reject', versionId: string) => {
    const data = await request({ action, versionId });
    if (data) { await load(); setMessage(action === 'approve' ? 'Preisversion freigegeben.' : action === 'submit' ? 'Zur Gegenfreigabe eingereicht.' : 'Preisversion abgelehnt.'); }
  };
  const saveQuote = async () => {
    const source = customerSources.find(x => `${x.sourceType}:${x.sourceId}` === customerSourceKey);
    const data = await request({ action: 'saveQuote', selection, customerLabel, notes, sourceType: source?.sourceType ?? null, sourceId: source?.sourceId ?? null });
    if (data) {
      setQuote(data.quote);setSavedQuoteId(data.quoteId);setCreatedProposalId('');
      setMessage('Kalkulationssnapshot gespeichert: ' + data.quoteId + '. Als nächstes die freigegebene CRM-Verkaufschance auswählen.');
    }
  };
  const createOffer = async () => {
    if(!savedQuoteId || !opportunityId || !validNet || !offerTitle.trim())return;
    const opp=opportunities.find(x=>x.id===opportunityId);
    if(!opp||opp.brandContext!==brand||opp.companyName.trim().toLocaleLowerCase('de-DE')!==customerLabel.trim().toLocaleLowerCase('de-DE')){setError('Die ausgewählte CRM-Verkaufschance muss exakt zu dieser Marke und diesem Kunden gehören. Bitte im Vertrieb die passende Kundenakte wählen.');return;}
    const deliverables=[...selection.projectTypes,...selection.modules].map(x=>LABELS[x]).slice(0,20);
    setBusy(true);setMessage('');setError('');
    try{
      // Before creating a CRM proposal, enforce both template approval gates.
      const gates=await Promise.all(['shared',brand].map(x=>fetch('/api/admin/sales/offer-templates?brand='+x,{credentials:'same-origin',cache:'no-store'})));
      const templates=await Promise.all(gates.map(x=>x.json()));
      if(gates.some(x=>!x.ok)||templates.some(x=>!x.active))throw new Error('Zuerst gemeinsame und markenspezifische Angebotsvorlage mit zwei Konten freigeben.');
      let proposalId=createdProposalId;
      if(!proposalId){
        const head=await fetch('/api/admin/sales/opportunities/'+encodeURIComponent(opportunityId)+'/proposals',{
          method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({title:offerTitle.trim(),brandContext:brand,customerSnapshot:{name:customerLabel.trim()}}),
        });
        const hd=await head.json();
        if(!head.ok)throw new Error(hd.error || 'CRM-Anlage verweigert. Die Lösung muss zuerst freigegeben werden.');
        proposalId=hd.proposal?.id;
        if(!proposalId)throw new Error('CRM-Antwort enthält keine Angebots-ID');
        setCreatedProposalId(proposalId);
      }
      const compose=await fetch('/api/admin/sales/proposals/'+encodeURIComponent(proposalId)+'/compose',{
        method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({quoteId:savedQuoteId,title:offerTitle.trim(),scope:notes.trim() || 'Im Beratungsgespräch abgestimmter Leistungsumfang',deliverables,
          netCents:Math.round(net*100),annualMaintenanceNetCents:Math.round(Number(maintenanceNet || 0)*100),validUntil,outOfRangeReason}),
      });
      const cd=await compose.json();
      if(!compose.ok)throw new Error(cd.error||'PDF konnte nicht erzeugt werden. Der CRM-Entwurf bleibt für einen erneuten Versuch erhalten.');
      setMessage('Angebotsentwurf v'+cd.number+' wurde samt PDF im CRM archiviert. Er ist NICHT versendet und benötigt eine Gegenfreigabe.');
    }catch(e){setError(e instanceof Error?e.message:'Angebotsanlage fehlgeschlagen');}
    finally{setBusy(false);}
  };
  const changeBrand = (next: Brand) => {
    if (brand === next) return;
    ++loadVersion.current;setError('');setMessage('');setRules(null);setLoading(true);
    setCustomerLabel('');setCustomerSourceKey('manual');setSavedQuoteId('');setCreatedProposalId('');setPdfUrl('');setBrand(next);
  };
  useEffect(() => {
    if (panel !== 'consult' || !rules || invalidRanges > 0) return;
    const controller = new AbortController();
    setPreviewBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/admin/pricing', {
          method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand, action: 'preview', rules, selection }), signal: controller.signal,
        });
        if (response.ok) {
          const result = await response.json();
          if (!controller.signal.aborted) setQuote(result.quote || null);
        }
      } catch { /* The explicit Calculate button provides actionable error feedback. */ }
      finally { if (!controller.signal.aborted) setPreviewBusy(false); }
    }, 650);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [brand, panel, rules, selection, invalidRanges]);

  const net = Number(manualNet);
  const validNet = manualNet.trim() !== '' && Number.isFinite(net) && net > 0 && net <= 5000000;
  const vat = rules?.vatRate ?? 0.19;
  const selectedSource=customerSources.find(x=>`${x.sourceType}:${x.sourceId}`===customerSourceKey);
  const deliverableLabels=[...selection.projectTypes,...selection.modules].map(x=>LABELS[x]).slice(0,20);
  const offerPreviewInput=JSON.stringify({
    brand,customer:customerLabel.trim()||'Musterkunde',title:offerTitle.trim()||'Individuelles Projektangebot',
    scope:notes.trim()||'Individuell abgestimmter Projektumfang',deliverables:deliverableLabels,
    netCents:validNet?Math.round(net*100):0,vatRate:vat,
    annualMaintenanceNetCents:Math.round(Number(maintenanceNet||0)*100),validUntil,
  });
  useEffect(()=>{
    if(!validNet || !offerTitle.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)){
      setPdfUrl('');setPdfError('');setPdfBusy(false);return;
    }
    const ctrl=new AbortController();
    let ownedUrl='';
    setPdfBusy(true);setPdfError('');setPdfUrl('');
    const timer=window.setTimeout(async()=>{
      try{
        const result=await fetch('/api/admin/sales/consultation-offer-preview',{
          method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({commercial:JSON.parse(offerPreviewInput)}),signal:ctrl.signal,
        });
        if(!result.ok){const e=await result.json().catch(()=>({}));throw new Error(e.error || 'Vorschau nicht verfügbar');}
        const blob=await result.blob();
        if(ctrl.signal.aborted)return;
        ownedUrl=URL.createObjectURL(blob);setPdfUrl(ownedUrl);
      }catch(e){if(!ctrl.signal.aborted)setPdfError(e instanceof Error?e.message:'PDF-Fehler');}
      finally{if(!ctrl.signal.aborted)setPdfBusy(false);}
    },850);
    return()=>{window.clearTimeout(timer);ctrl.abort();if(ownedUrl)URL.revokeObjectURL(ownedUrl);};
  },[offerPreviewInput,validNet,offerTitle,validUntil]);

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
    <div className={surface + ' flex flex-wrap items-center justify-between gap-4'}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-600">Mandant auswählen</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Marke wählen">
          {([['agiworks', 'AGI Works'], ['nexcel', 'NEXCEL AI']] as const).map(([key, name]) =>
            <button key={key} type="button" onClick={() => changeBrand(key)} aria-pressed={brand === key}
              className={'rounded-2xl px-5 py-2.5 text-sm font-semibold transition ' + (brand === key ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{name}</button>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={badge}>{configured ? 'Preisstand freigegeben' : 'Noch kein aktiver Preisstand'}</span>
        <span className={badge}>{pending.length} Freigabe{pending.length === 1 ? '' : 'n'} offen</span>
      </div>
    </div>

    <nav className="grid grid-cols-3 gap-2 rounded-[20px] border border-[#dfe6ef] bg-[#e9eef5] p-1.5" aria-label="Kalkulationsbereich">
      {(['consult', 'catalog', 'approval'] as const).map((key, index) =>
        <button key={key} type="button" aria-current={panel === key ? 'step' : undefined} onClick={() => setPanel(key)}
          className={'min-h-[50px] rounded-[18px] px-2 text-xs font-semibold transition sm:text-sm ' + (panel === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60')}>
          <span className="mr-2 hidden text-blue-600 sm:inline">0{index + 1}</span>{title[key]}
        </button>)}
    </nav>
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
    {message && <div role="status" className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-800">{message}</div>}
    {(loading || !rules) ? <div className={surface + ' text-slate-500'}>{error || 'Preisstand wird geladen …'}</div> : <>
      {panel === 'consult' && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]">
        <div className="space-y-6">
          <section className={surface}>
            <div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Schritt 1 · Projekt</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Was braucht dein Kunde?</h2><p className="mt-2 text-sm text-slate-500">Leistungen auswählen – die Berechnung folgt im nächsten Schritt.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROJECTS.map(key => <label key={key} className={'flex min-h-[64px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ' + (selection.projectTypes.includes(key) ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-slate-200 bg-slate-50 hover:border-slate-300')}>
                <input type="checkbox" className="h-5 w-5 accent-blue-600" checked={selection.projectTypes.includes(key)} onChange={() => {
                  const next = flip(selection.projectTypes, key);
                  if (next.length) updateChoice('projectTypes', next);
                }} /><span className="text-sm font-semibold">{LABELS[key]}</span>
              </label>)}
            </div>
            <h3 className="mb-3 mt-8 text-sm font-bold text-slate-800">Zusatzmodule <span className="font-normal text-slate-400">· optional</span></h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODULES.map(key => <label key={key} className={'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ' + (selection.modules.includes(key) ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300')}>
                <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={selection.modules.includes(key)} onChange={() => updateChoice('modules', flip(selection.modules, key))} />{LABELS[key]}
              </label>)}
            </div>
          </section>
          <section className={surface}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Schritt 2 · Rahmenbedingungen</p>
            <h2 className="mt-2 text-xl font-semibold">Projektparameter</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-semibold">Umfang<select className={field + ' mt-2'} value={selection.scope} onChange={e => updateChoice('scope', e.target.value as QuoteInput['scope'])}>{SCOPES.map(k => <option key={k} value={k}>{categoryName[k]}</option>)}</select></label>
              <label className="block text-sm font-semibold">Zeitrahmen<select className={field + ' mt-2'} value={selection.timeframe} onChange={e => updateChoice('timeframe', e.target.value as QuoteInput['timeframe'])}>{TIMEFRAMES.map(k => <option key={k} value={k}>{durationName[k]}</option>)}</select></label>
              <label className="block text-sm font-semibold">Qualität<select className={field + ' mt-2'} value={selection.quality} onChange={e => updateChoice('quality', e.target.value as QuoteInput['quality'])}>{QUALITIES.map(k => <option key={k} value={k}>{qualityName[k]}</option>)}</select></label>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Anzahl API-Anbindungen<select className={field + ' mt-2'} value={selection.apiCount} onChange={e => updateChoice('apiCount', Number(e.target.value) as QuoteInput['apiCount'])}><option value={0}>Keine</option><option value={2}>1–2</option><option value={4}>3–5</option><option value={8}>6+</option></select></label>
              <div className="grid gap-2 sm:pt-1">{([['KI-Risiko berücksichtigen', 'includesAi'], ['Datenmigration berücksichtigen', 'includesMigration'], ['Wartung separat ausweisen', 'includeAnnualMaintenance']] as const).map(([label, key]) =>
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input className="h-4 w-4 accent-blue-600" type="checkbox" checked={selection[key]} onChange={e => updateChoice(key, e.target.checked)} />{label}</label>)}</div>
            </div>
          </section>
          <section className={surface}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Schritt 3 · Dokumentation</p>
            <h2 className="mt-2 text-xl font-semibold">Kundengespräch</h2>
            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-semibold">Kunde aus Termin oder Lead auswählen
                <select className={field+' mt-2'} value={customerSourceKey} onChange={e=>{
                  const key=e.target.value;setCustomerSourceKey(key);setSavedQuoteId('');setCreatedProposalId('');
                  const item=customerSources.find(x=>`${x.sourceType}:${x.sourceId}`===key);
                  if(item){setCustomerLabel(item.label);setNotes(item.detail.slice(0,2000));}
                }}>
                  <option value="manual">Neuer Kunde / manuelle Eingabe</option>
                  {customerSources.map(x=><option key={x.sourceType+':'+x.sourceId} value={x.sourceType+':'+x.sourceId}>{x.sourceType==='booking'?'Termin':'Lead'} · {x.label} · {new Date(x.date).toLocaleDateString('de-DE')}</option>)}
                </select>
              </label>
              {sourceError&&<p role="status" className="text-xs text-amber-700">{sourceError}. Manuelle Kundeneingabe bleibt möglich.</p>}
              {selectedSource&&<div className="rounded-2xl bg-blue-50 p-3 text-xs text-blue-900"><strong>{selectedSource.name}</strong> · {selectedSource.email}<br/>{selectedSource.detail||'Keine Angaben zum Bedarf'}</div>}
              <label className="block text-sm font-semibold">Kunde / Unternehmen<input className={field + ' mt-2'} maxLength={160} placeholder="z. B. Muster GmbH" value={customerLabel} onChange={e => {setCustomerLabel(e.target.value);setCustomerSourceKey('manual');setSavedQuoteId('');setCreatedProposalId('');}} /></label>
            <label className="block text-sm font-semibold">Gesprächsnotizen<textarea className={field + ' mt-2 min-h-[100px] resize-y'} placeholder="Besprochener Umfang, Anforderungen, nächste Schritte" maxLength={2000} value={notes} onChange={e => {setNotes(e.target.value);setSavedQuoteId('');setCreatedProposalId('');}} /></label></div>
            <button type="button" className={primary + ' mt-5 w-full'} disabled={busy || !configured || customerLabel.trim().length < 2} onClick={saveQuote}>{busy?'Speichere …':'Kalkulationsversion speichern'}</button>
            {savedQuoteId&&<p role="status" className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">Gespeichert · {savedQuoteId} · Preisstand ist unveränderlich referenziert.</p>}
            {!configured && <p className="mt-3 text-xs leading-5 text-amber-700">Zum Speichern muss zuerst ein Preisstand von einer zweiten Person freigegeben werden. Die Vorschau ist trotzdem möglich.</p>}
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className="sales-light-surface overflow-hidden rounded-[24px] border border-[#c7daf6] bg-[#eaf2ff] p-6 text-slate-900 shadow-[0_12px_38px_-26px_rgba(30,74,142,.24)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-700">Interne Live-Kalkulation</p>
            <h2 className="mt-2 text-xl font-semibold text-[#142238]">Budgetrahmen</h2>
            <p className="mt-4 text-xs text-slate-600">Netto · Unverbindliche Orientierung</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-[#153d79] tabular-nums sm:text-4xl">{quote ? euro(quote.projectNet.min) : previewBusy ? 'Berechne …' : '–'}</div>
            {quote && <p className="mt-1 text-lg text-blue-700 tabular-nums">bis {euro(quote.projectNet.max)}</p>}
            <p className="mt-3 text-xs text-slate-600">{quote ? `Inkl. USt.: ${euro(quote.projectGross.min)} bis ${euro(quote.projectGross.max)}` : 'Preise lassen sich im Reiter „Preise festlegen“ eingeben.'}</p>
            <button type="button" className="mt-6 w-full rounded-2xl bg-[#1859c9] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#124ba9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-40" onClick={preview} disabled={busy || invalidRanges > 0}>{busy ? 'Berechne …' : 'Budget jetzt berechnen'}</button>
            {quote && <details className="mt-5 text-sm text-slate-700"><summary className="cursor-pointer font-semibold">Positionen anzeigen</summary><div className="mt-3 space-y-2">{quote.items.map((item, index) => <div key={index} className="flex items-start justify-between gap-3 border-b border-slate-200 py-2 text-xs"><span>{item.label}</span><span className="whitespace-nowrap text-right tabular-nums">{euro(item.min)}–{euro(item.max)}</span></div>)}</div></details>}
            {quote && <p className="mt-4 text-xs leading-5 text-slate-600">{quote.disclaimer}</p>}
          </section>
          <section className={surface}>
            <div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Echte PDF-Live-Vorschau</p><h3 className="mt-2 text-lg font-bold text-slate-900">So sieht das Kundenangebot aus</h3></div><span className={badge}>Nur Entwurf</span></div>
            {!validNet?<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Trage unten einen Netto-Angebotspreis ein. Die Vorschau erscheint automatisch und aktualisiert sich bei Änderungen.</p>
            :pdfBusy?<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">PDF wird aktualisiert …</p>
            :pdfError?<p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{pdfError}</p>
            :pdfUrl?<div><iframe title="Live-PDF-Angebotsentwurf" src={pdfUrl} className="h-[430px] w-full rounded-xl border border-slate-200 bg-white"/><a href={pdfUrl} download="angebotsentwurf.pdf" className={secondary+' mt-3 w-full'}>PDF-Entwurf herunterladen</a></div>:null}
            <p className="mt-3 text-xs text-slate-500">Vorschau und CRM-PDF verwenden denselben Renderer und die Logos der gewählten Marke. Die verbindliche Version wird erst nach Freigaben erstellt.</p>
          </section>
          <section className={surface}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Angebotspreis für diesen Kunden</p>
            <h3 className="mt-2 text-lg font-semibold">Angebotspreis netto</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Freier Gesprächswert. Er verändert weder den Preiskatalog noch einen gespeicherten Snapshot.</p>
            <div className="mt-4"><label className="text-xs font-semibold text-slate-500" htmlFor="manual-offer-amount">Betrag in Euro</label><div className="relative mt-2"><input id="manual-offer-amount" type="text" inputMode="numeric" autoComplete="off" maxLength={9} className={field + ' pr-10 text-xl tabular-nums'} placeholder="z. B. 12500" value={manualNet} onFocus={e => e.currentTarget.select()} onChange={e => setManualNet(e.currentTarget.value.replace(/\D/g, ''))} /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-bold text-slate-400">€</span></div></div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span className="text-slate-500">Brutto mit {Math.round(vat * 100)} % USt.</span><strong className="tabular-nums">{validNet ? euro(Math.round(net * (1 + vat))) : '–'}</strong></div>
            <label className="mt-4 block text-xs font-semibold text-slate-600">Angebotstitel<input className={field+' mt-2'} maxLength={180} value={offerTitle} onChange={e=>setOfferTitle(e.target.value)}/></label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Gültig bis<input type="date" className={field+' mt-2'} value={validUntil} onChange={e=>setValidUntil(e.target.value)}/></label>
              <label className="block text-xs font-semibold text-slate-600">Wartung netto / Jahr<input inputMode="numeric" className={field+' mt-2'} value={maintenanceNet} placeholder="0" onChange={e=>setMaintenanceNet(e.target.value.replace(/\D/g,''))}/></label>
            </div>
            <label className="mt-4 block text-xs font-semibold text-slate-600">Begründung bei Preis außerhalb des freigegebenen Rahmens<textarea className={field+' mt-2 min-h-[70px]'} maxLength={1000} value={outOfRangeReason} onChange={e=>setOutOfRangeReason(e.target.value)} placeholder="Nur erforderlich, wenn der Angebotspreis außerhalb des berechneten Korridors liegt"/></label>
            <div className="mt-4 rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">CRM-Übergabe</p>
              <label className="mt-3 block text-xs font-semibold text-slate-700">Freigegebene Verkaufschance
                <select value={opportunityId} className={field+' mt-2'} onChange={e=>{setOpportunityId(e.target.value);setCreatedProposalId('');}}>
                  <option value="">Bitte Verkaufschance auswählen</option>
                  {opportunities.filter(o=>o.companyName.trim().toLocaleLowerCase('de-DE')===customerLabel.trim().toLocaleLowerCase('de-DE')).map(o=><option key={o.id} value={o.id}>{o.companyName} · {o.title}</option>)}
                </select>
              </label>
              <p className="mt-2 text-xs leading-5 text-blue-900">Falls noch keine Verkaufschance existiert: Im Vertrieb eine Kundenakte anlegen und den Leistungsumfang durch eine zweite Person freigeben.</p>
              <Link className="mt-2 inline-block text-xs font-semibold text-blue-800 underline" href="/admin/vertrieb">Vertrieb öffnen</Link>
              <button type="button" className={primary+' mt-4 w-full'} disabled={busy||!savedQuoteId||!opportunityId||!validNet||!offerTitle.trim()} onClick={createOffer}>{busy?'Erstelle …':'Angebot aus gespeicherter Kalkulation erstellen'}</button>
              <p className="mt-2 text-xs text-blue-800">Erzeugt einen CRM-Entwurf samt gebrandeter PDF. Kein Versand; die Gegenfreigabe bleibt Pflicht.</p>
            </div>
          </section>
        </aside>
      </div>}

      {panel === 'catalog' && <div className="space-y-6">
        <section className={surface}>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Preisverwaltung · intern</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Preise in Euro eintragen</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Pro Leistung einen Mindest- und einen Höchstpreis eingeben. Zum Überschreiben einfach auf die Zahl klicken – sie wird vollständig markiert.</p></div><span className={badge}>Nur Admin / Inhaber</span></div>
          <div className="mt-7 grid gap-6 xl:grid-cols-2">
            {([['Basisleistungen', 'base', PROJECTS], ['Zusatzmodule', 'modules', MODULES]] as const).map(([heading, group, keys]) =>
              <div key={group}><h3 className="mb-3 text-base font-semibold">{heading}</h3><div className="space-y-3">{keys.map(key => {
                const value = (rules[group] as unknown as Record<string, Range>)[key];
                return <div key={key} className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2"><span className="font-semibold text-slate-800">{LABELS[key]}</span><span className="text-xs tabular-nums text-slate-400">{value.min || value.max ? `${euro(value.min)} – ${euro(value.max)}` : 'Noch offen'}</span></div>
                  <div className="flex gap-3"><PriceInput label={`${LABELS[key]} · ab (netto)`} value={value.min} onChange={n => updateRange(group, key, 'min', n)} /><PriceInput label={`${LABELS[key]} · bis (netto)`} value={value.max} onChange={n => updateRange(group, key, 'max', n)} /></div>
                  {!rangeValid(value) && <p className="mt-2 text-xs font-semibold text-red-600">Der Höchstpreis muss mindestens so hoch wie der Mindestpreis sein.</p>}
                </div>;
              })}</div></div>)}
          </div>
          <details className="mt-7 rounded-[20px] border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold text-slate-800">Erweiterte Regeln – Faktoren, Wartung und Steuer</summary>
            <p className="mt-3 text-xs text-slate-500">Bestehende Risikofaktoren bleiben erhalten. Faktoren verändern den errechneten Budgetrahmen, nicht die im Angebot festgelegte verbindliche Summe.</p>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">{([['Projektumfang', 'scope', SCOPES], ['Zeitrahmen', 'timeframe', TIMEFRAMES], ['Qualität', 'quality', QUALITIES]] as const).map(([heading, group, keys]) =>
              <div key={group}><h4 className="mb-3 text-sm font-semibold">{heading}</h4><div className="space-y-2">{keys.map(key => <label key={key} className="flex items-center justify-between gap-3 text-sm text-slate-600"><span>{key}</span><input type="number" inputMode="decimal" min={0.1} max={5} step={0.05} className={field + ' max-w-[115px] tabular-nums'} value={(rules[group] as unknown as Record<string, number>)[key]} onFocus={e => e.currentTarget.select()} onChange={e => updateFactor(group, key, Number(e.currentTarget.value || 0))} /></label>)}</div></div>)}</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">{([['Jahreswartung %', 'maintenanceAnnualRate', 100], ['Umsatzsteuer %', 'vatRate', 100], ['Mehrfachprojekt-Faktor', 'multiProjectFactor', 1]] as const).map(([name, key, factor]) =>
              <label key={key} className="text-sm font-semibold">{name}<input className={field + ' mt-2'} inputMode="decimal" type="number" min={0} step={key === 'multiProjectFactor' ? .05 : .1} value={Number((rules[key] * factor).toFixed(4))} onFocus={e => e.currentTarget.select()} onChange={e => setRules(old => old ? { ...old, [key]: Number(e.currentTarget.value || 0) / factor } : old)} /></label>)}</div>
          </details>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[20px] bg-blue-50 p-4">
            <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{invalidRanges ? `${invalidRanges} Preisbereich(e) korrigieren` : unpriced ? `${unpriced} von ${allRanges.length} Preisen fehlen noch` : 'Alle Preisbausteine sind ausgefüllt'}</p><p className="mt-1 text-xs text-slate-500">Entwürfe dürfen unvollständig sein. Die zweite Person kann erst vollständig positive Preisbereiche aktivieren.</p></div>
            <button type="button" className={primary} disabled={busy || invalidRanges > 0} onClick={save}>Preisversion speichern</button>
          </div>
          {defaults && <button type="button" className="mt-4 text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-900" onClick={() => { if (window.confirm('Nicht gespeicherte Preisänderungen durch neutrale Ausgangswerte ersetzen?')) setRules(clone(defaults)); }}>Neutrale Ausgangswerte wiederherstellen</button>}
        </section>
      </div>}

      {panel === 'approval' && <div className="grid gap-6 lg:grid-cols-2">
        <section className={surface}><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Eigene Entwürfe</p><h2 className="mt-2 text-2xl font-semibold">Zur Freigabe einreichen</h2><p className="mt-2 text-sm text-slate-500">Gespeicherte Preisversionen benötigen immer die Freigabe eines anderen berechtigten Kontos.</p>
          {draft ? <div className="mt-6 rounded-2xl border border-slate-200 p-5"><p className="text-sm font-semibold">Entwurf v{draft.version}</p><p className="mt-1 text-xs text-slate-500">Noch nicht aktiviert</p><button type="button" className={primary + ' mt-4 w-full'} disabled={busy || !draftComplete} onClick={() => stage('submit', draft.id)}>Zur Freigabe einreichen</button>{!draftComplete && <p className="mt-3 text-xs text-amber-700">Vor Freigabe alle Preisspannen prüfen und vollständig ausfüllen.</p>}</div> : <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Noch kein Entwurf. Im Reiter „Preise festlegen“ einen Preisstand anlegen.</p>}
        </section>
        <section className={surface}><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Vier-Augen-Prinzip</p><h2 className="mt-2 text-2xl font-semibold">Offene Gegenfreigaben</h2>
          {pending.length ? <div className="mt-5 space-y-3">{pending.map(item => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-semibold">Version {item.version}</p><p className="mt-1 text-xs text-slate-500">Eingereicht von {item.created_by.slice(0,24)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => { setRules(clone(item.rules)); setPanel('catalog'); setMessage('Preiskatalog aus Version ' + item.version + ' zur Prüfung geladen.'); }}>Werte prüfen</button><button type="button" className={primary} disabled={busy} onClick={() => stage('approve', item.id)}>Freigeben</button><button type="button" className={secondary} disabled={busy} onClick={() => stage('reject', item.id)}>Ablehnen</button></div></div>)}</div> : <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Keine Freigaben offen.</p>}
        </section>
        <section className={surface + ' lg:col-span-2'}><h2 className="text-lg font-semibold">Versionen und Status</h2><div className="mt-4 flex flex-wrap gap-2"><span className={badge}>{active ? 'Aktiv: Version ' + active.version : 'Kein aktiver Preisstand'}</span><span className={badge}>{versions.length} Versionen gesamt</span></div><p className="mt-4 text-xs text-slate-500">Jeder gespeicherte Kalkulationssnapshot bleibt an seinen genehmigten Preisstand gebunden.</p></section>
      </div>}
    </>}
    <div className="flex flex-wrap gap-3 pb-6"><Link href="/admin/angebotsvorlagen" className={secondary}>Angebotsvorlagen öffnen ↗</Link><Link href="/admin/vertrieb" className={secondary}>Vertrieb und Angebote ↗</Link></div>
  </div>;
}
