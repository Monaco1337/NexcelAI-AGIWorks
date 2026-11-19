'use client';
import {useCallback,useEffect,useState} from 'react';
import {LABELS,PROJECTS,MODULES,SCOPES,TIMEFRAMES,QUALITIES,type PriceRules,type QuoteInput,type Brand,type Range} from '@/lib/sales/pricingTypes';

type Version={id:string;brand:Brand;version:number;state:string;rules:PriceRules;created_by:string;approved_by:string|null;created_at:string};
type Quote={projectNet:Range;projectGross:Range;annualMaintenanceNet:Range;vat:Range;vatRate:number;items:{label:string;min:number;max:number}[];disclaimer:string};
const initialSelection:QuoteInput={projectTypes:['app'],scope:'growth',timeframe:'standard',quality:'professional',modules:[],apiCount:0,includesAi:false,includesMigration:false,includeAnnualMaintenance:false};
const fmt=(n:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const copy=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
const field='w-full min-w-0 rounded-lg border border-white/15 bg-[#111b2a] px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none';
const card='rounded-2xl border border-white/10 bg-white/[0.035] p-5';
const button='rounded-lg border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';

export default function InternalPricingWorkbench(){
 const [brand,setBrand]=useState<Brand>('agiworks');
 const [versions,setVersions]=useState<Version[]>([]);
 const [rules,setRules]=useState<PriceRules|null>(null);
 const [selection,setSelection]=useState<QuoteInput>(initialSelection);
 const [activeId,setActiveId]=useState<string|null>(null);
 const [defaults,setDefaults]=useState<PriceRules|null>(null);
 const [configured,setConfigured]=useState(false);
 const [quote,setQuote]=useState<Quote|null>(null);
 const [customerLabel,setCustomerLabel]=useState('');
 const [notes,setNotes]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  setError('');
  const r=await fetch('/api/admin/pricing?brand='+brand,{credentials:'same-origin',cache:'no-store'});
  const v=await r.json();
  if(!r.ok)throw new Error(v.error||'Preiskatalog nicht verfügbar');
  setVersions(v.versions||[]);setActiveId(v.active?.id||null);setConfigured(!!v.configured);
  const source=(v.versions as Version[]).find(x=>x.state==='draft')?.rules||v.active?.rules||v.defaults;
  setDefaults(v.defaults);setRules(copy(source));setQuote(null);
 },[brand]);
 useEffect(()=>{load().catch(e=>setError(String(e.message||e)));},[load]);
 const request=async(body:Record<string,unknown>)=>{
  setBusy(true);setError('');setMessage('');
  try{
   const r=await fetch('/api/admin/pricing',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({brand,...body})});
   const v=await r.json();if(!r.ok)throw new Error(v.error||'Aktion fehlgeschlagen');return v;
  }catch(e){setError(e instanceof Error?e.message:'Aktion fehlgeschlagen');return null;}finally{setBusy(false);}
 };
 const updateRange=(group:'base'|'modules',key:string,end:'min'|'max',value:string)=>setRules(prev=>{
  const next=copy(prev!);const item=(next[group] as unknown as Record<string,Range>)[key];item[end]=Number(value);return next;
 });
 const updateFactor=(group:'scope'|'timeframe'|'quality',key:string,value:string)=>setRules(prev=>{
  const next=copy(prev!);(next[group] as unknown as Record<string,number>)[key]=Number(value);return next;
 });
 const updateSelection=<K extends keyof QuoteInput>(key:K,value:QuoteInput[K])=>{setQuote(null);setSelection(prev=>({...prev,[key]:value}));};
 const switchChoice=<T extends string>(arr:T[],k:T):T[]=>arr.includes(k)?arr.filter(x=>x!==k):[...arr,k];
 const draft=versions.find(v=>v.state==='draft');
 const pending=versions.filter(v=>v.state==='pending');
 const stage=async(action:string,versionId:string)=>{const result=await request({action,versionId});if(result){setMessage('Aktion '+action+' bestätigt');await load();}};
 const preview=async()=>{if(!rules)return;const result=await request({action:'preview',rules,selection});if(result?.quote){setQuote(result.quote);setMessage('Interne Vorschau berechnet – nicht als Angebot verwenden.');}};
 const save=async()=>{if(!rules)return;const result=await request({action:'save',rules});if(result){setMessage('Neuer, unveränderlicher Entwurf gespeichert. Jetzt zur Freigabe einreichen.');await load();}};
 const saveQuote=async()=>{const result=await request({action:'saveQuote',selection,customerLabel,notes});if(result){setMessage('Interner Kalkulationssnapshot gespeichert: '+result.quoteId);setQuote(result.quote);}};
 if(!rules)return <div className={card}>Interne Preiskonfiguration wird geladen. {error}</div>;
 const row=({min,max}:Range)=><span className="font-semibold text-sky-300">{fmt(min)} – {fmt(max)}</span>;
 return <div className="space-y-5">
  <div className="flex flex-wrap justify-end gap-3"><a href="/admin/angebotsvorlagen" className={button}>Angebotsvorlagen & gemeinsames PDF-Design</a><a href="/admin/vertrieb" className={button}>Kunden / Angebote im Vertrieb</a></div>
  <section className={card}><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Marke und Freigabestand</h2><p className="mt-1 text-sm text-slate-400">Kein öffentlicher Preiszugriff. Änderungen sind versionsgebunden und zweistufig freizugeben.</p></div><select aria-label="Marke" className={field+' max-w-xs'} value={brand} onChange={e=>setBrand(e.target.value as Brand)}><option value="agiworks">AGI Works</option><option value="nexcel">NEXCEL AI</option></select></div><div className="mt-4 flex flex-wrap gap-3 text-sm"><span className="rounded-lg bg-white/10 px-3 py-2">{configured?'Aktiver Preisstand vorhanden':'Noch kein Preisstand freigegeben'}</span><span className="rounded-lg bg-white/10 px-3 py-2">{pending.length} Freigaben offen</span><span className="rounded-lg bg-white/10 px-3 py-2">{versions.length} Versionen im Verlauf</span></div></section>
  {error&&<div role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
  {message&&<div role="status" className="rounded-xl border border-sky-400/40 bg-sky-500/10 p-4 text-sm text-sky-100">{message}</div>}
  <section className={card}><h2 className="text-xl font-semibold">1. Preisbausteine gemeinsam festlegen</h2><p className="mt-2 text-sm text-slate-400">Die anfänglichen 0-€-Werte sind neutrale Platzhalter und ausdrücklich keine Preisempfehlung. Pro Marke alle Basisleistungen und Module mit positiven Min-/Max-Werten festlegen; erst danach kann die zweite Person freigeben.</p>
    <div className="mt-5 grid gap-6 xl:grid-cols-2">{([['Basisleistungen','base',PROJECTS],['Zusatzmodule','modules',MODULES]] as const).map(([title,group,keys])=><div key={group}><h3 className="mb-3 font-semibold">{title}</h3><div className="space-y-2">{keys.map(k=><div key={k} className="grid grid-cols-[minmax(95px,1fr)_minmax(0,115px)_minmax(0,115px)] items-center gap-2 rounded-lg bg-white/[0.04] p-2"><label className="text-xs text-slate-300">{LABELS[k]}</label>{(['min','max'] as const).map(end=><input key={end} type="number" min="0" step="100" aria-label={`${LABELS[k]} ${end}`} className={field} value={(rules[group] as Record<string, Range>)[k][end]} onChange={e=>updateRange(group,k,end,e.target.value)}/>)}</div>)}</div></div>)}</div>
    <div className="mt-6 grid gap-5 sm:grid-cols-3">{([['Projektumfang','scope',SCOPES],['Zeitrahmen','timeframe',TIMEFRAMES],['Qualität','quality',QUALITIES]] as const).map(([title,group,keys])=><div key={group}><h3 className="mb-2 font-semibold">{title} (Faktor)</h3><div className="space-y-2">{keys.map(k=><label key={k} className="flex items-center justify-between gap-2 text-xs text-slate-300">{k}<input aria-label={`${group} ${k}`} type="number" min="0.1" max="5" step="0.05" className={field+' max-w-[110px]'} value={(rules[group] as Record<string, number>)[k]} onChange={e=>updateFactor(group,k,e.target.value)}/></label>)}</div></div>)}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3">{([['Jahreswartung (%)','maintenanceAnnualRate',100],['Umsatzsteuer (%)','vatRate',100],['Mehrfach-Projekt-Faktor','multiProjectFactor',1]] as const).map(([label,key,mult])=><label key={key} className="text-sm">{label}<input type="number" step="0.01" min="0" className={field+' mt-2'} value={Number((rules[key]*mult).toFixed(4))} onChange={e=>setRules(v=>({...v!,[key]:Number(e.target.value)/mult}))}/></label>)}</div>
    <p className="mt-4 text-xs text-slate-500">Weitere Risikofaktoren aus dem bisherigen Kalkulator bleiben in den Regeln erhalten. Der veröffentlichte Kundenpreis ergibt sich daraus nicht automatisch.</p>
    <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={save}>Neue Preisversion als Entwurf speichern</button>{draft&&<button disabled={busy} className={button} onClick={()=>stage('submit',draft.id)}>Entwurf v{draft.version} dem Partner zur Freigabe vorlegen</button>}<button disabled={busy} className={button} onClick={()=>{setRules(copy(defaults!));setQuote(null);}}>Ausgangswerte laden (nicht speichern)</button></div>
    {pending.length>0&&<div className="mt-5 space-y-2"><h3 className="font-medium">Offene Freigaben</h3>{pending.map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.04] p-3"><span className="text-sm">Version {v.version} · eingereicht von {v.created_by.slice(0,24)}</span><div className="flex gap-2"><button className={button} disabled={busy} onClick={()=>{setRules(copy(v.rules));setMessage('Preisstand zur Prüfung geladen.');}}>Werte prüfen</button><button className={button} disabled={busy} onClick={()=>stage('approve',v.id)}>Als zweite Person freigeben</button><button className={button} disabled={busy} onClick={()=>stage('reject',v.id)}>Ablehnen</button></div></div>)}</div>}
  </section>
  <section className={card}><h2 className="text-xl font-semibold">2. Kundengespräch kalkulieren</h2><p className="mt-2 text-sm text-slate-400">Vorschau nutzt die gerade angezeigten Regeln. Ein nachvollziehbarer Kundensnapshot nutzt ausschließlich einen gemeinsam freigegebenen Preisstand.</p>
   <div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="text-sm">Umfang<select className={field+' mt-2'} value={selection.scope} onChange={e=>updateSelection('scope',e.target.value as QuoteInput['scope'])}>{SCOPES.map(k=><option key={k} value={k}>{k}</option>)}</select></label><label className="text-sm">Zeitrahmen<select className={field+' mt-2'} value={selection.timeframe} onChange={e=>updateSelection('timeframe',e.target.value as QuoteInput['timeframe'])}>{TIMEFRAMES.map(k=><option key={k} value={k}>{k}</option>)}</select></label><label className="text-sm">Qualitätsstufe<select className={field+' mt-2'} value={selection.quality} onChange={e=>updateSelection('quality',e.target.value as QuoteInput['quality'])}>{QUALITIES.map(k=><option key={k} value={k}>{k}</option>)}</select></label></div>
   <div className="mt-5 grid gap-5 sm:grid-cols-2"><div><h3 className="mb-2 font-medium">Projektarten</h3><div className="grid grid-cols-2 gap-2">{PROJECTS.map(k=><label key={k} className="flex items-center gap-2 rounded-lg bg-white/[0.05] p-3 text-sm"><input type="checkbox" checked={selection.projectTypes.includes(k)} onChange={()=>updateSelection('projectTypes',switchChoice(selection.projectTypes,k))}/>{LABELS[k]}</label>)}</div></div><div><h3 className="mb-2 font-medium">Zusatzmodule</h3><div className="grid grid-cols-2 gap-2">{MODULES.map(k=><label key={k} className="flex items-center gap-2 rounded-lg bg-white/[0.05] p-3 text-sm"><input type="checkbox" checked={selection.modules.includes(k)} onChange={()=>updateSelection('modules',switchChoice(selection.modules,k))}/>{LABELS[k]}</label>)}</div></div></div>
   <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm">API-Anzahl<select className={field+' mt-2'} value={selection.apiCount} onChange={e=>updateSelection('apiCount',Number(e.target.value) as QuoteInput['apiCount'])}><option value={0}>Keine</option><option value={2}>1–2</option><option value={4}>3–5</option><option value={8}>6+</option></select></label>{([['KI-Risiko berücksichtigen','includesAi'],['Datenmigration berücksichtigen','includesMigration'],['Jahreswartung separat','includeAnnualMaintenance']] as const).map(([label,key])=><label key={key} className="flex items-center gap-3 rounded-lg bg-white/[0.05] p-3 text-sm"><input type="checkbox" checked={selection[key]} onChange={e=>updateSelection(key,e.target.checked)}/>{label}</label>)}</div>
   <button disabled={busy} className={button+' mt-5'} onClick={preview}>Interne Kosten berechnen</button>
   {quote&&<div className="mt-5 rounded-xl border border-sky-400/20 bg-sky-500/[0.06] p-5"><p className="text-xs uppercase tracking-wider text-sky-300">Interner Nettobudgetkorridor</p><p className="my-3 text-2xl font-semibold">{row(quote.projectNet)}</p><p className="text-sm text-slate-400">Rechnerischer Bruttokorridor: {row(quote.projectGross)} · USt-Satz {Math.round(quote.vatRate*100)} % (im Einzelfall überprüfen)</p><p className="mt-2 text-sm text-slate-400">Jahreswartung netto (separat): {row(quote.annualMaintenanceNet)}</p><details className="mt-4"><summary className="cursor-pointer text-sm">Einzelposten ansehen</summary><div className="mt-2 space-y-1">{quote.items.map((x,i)=><div key={i} className="flex justify-between gap-2 text-xs"><span>{x.label}</span>{row(x)}</div>)}</div></details><p className="mt-4 text-xs text-slate-400">{quote.disclaimer}</p></div>}
   <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm">Kunde / Unternehmen<input value={customerLabel} className={field+' mt-2'} onChange={e=>setCustomerLabel(e.target.value)} placeholder="Kundenzuordnung intern"/></label><label className="text-sm">Gesprächsnotizen (max. 2.000 Zeichen)<textarea value={notes} className={field+' mt-2 min-h-[76px]'} maxLength={2000} onChange={e=>setNotes(e.target.value)} placeholder="Leistungsannahmen und nächste Schritte"/></label></div>
   <button disabled={busy||!configured||customerLabel.trim().length<2} className={button+' mt-4'} onClick={saveQuote}>Gesprächskalkulation mit freigegebenem Preisstand speichern</button>
  </section>
 </div>;
}
