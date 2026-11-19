'use client';
import {useCallback,useEffect,useState} from 'react';
import {INITIAL_TEMPLATES,TEMPLATE_BRANDS,TEMPLATE_LABELS,type TemplateBrand,type TemplateCopy} from '@/lib/sales/offerTemplates';
type Row={id:string;template_brand:TemplateBrand;version:number;state:string;content:TemplateCopy;created_by:string;approved_by:string|null;created_at:string};
const copy=(x:TemplateCopy):TemplateCopy=>JSON.parse(JSON.stringify(x)) as TemplateCopy;
const card='rounded-2xl border border-white/10 bg-white/[.035] p-5';
const field='mt-2 w-full rounded-xl border border-white/15 bg-[#111b2a] px-3 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none';
const btn='rounded-xl border border-white/20 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-40';
const labels:Record<keyof TemplateCopy,string>={heading:'Überschrift',introduction:'Einleitung',recommendation:'Empfehlung',implementation:'Projektumsetzung',included:'Enthaltene Leistungen',excluded:'Nicht enthalten',assumptions:'Annahmen / Mitwirkung',nextSteps:'Nächste Schritte',closing:'Abschluss'};
const textKeys:(keyof TemplateCopy)[]=['heading','introduction','recommendation','implementation','closing'];
const listKeys:(keyof TemplateCopy)[]=['included','excluded','assumptions','nextSteps'];
export default function OfferTemplatesWorkbench(){
 const [brand,setBrand]=useState<TemplateBrand>('agiworks');
 const [rows,setRows]=useState<Row[]>([]);
 const [content,setContent]=useState<TemplateCopy>(copy(INITIAL_TEMPLATES.agiworks));
 const [shared,setShared]=useState<TemplateCopy>(copy(INITIAL_TEMPLATES.shared));
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const load=useCallback(async()=>{
  const [r,s]=await Promise.all([fetch('/api/admin/sales/offer-templates?brand='+brand,{cache:'no-store'}),fetch('/api/admin/sales/offer-templates?brand=shared',{cache:'no-store'})]);
  const [d,common]=await Promise.all([r.json(),s.json()]);if(!r.ok||!s.ok)throw new Error(d.error||common.error||'Vorlagen nicht erreichbar');
  setRows(d.versions||[]);
  setContent(copy((d.versions as Row[]).find(x=>x.state==='draft')?.content||d.active?.content||d.defaults));
  setShared(copy(common.active?.content||common.defaults));
 },[brand]);
 useEffect(()=>{load().catch(e=>setError(e.message||'Fehler'));},[load]);
 const action=async(body:Record<string,unknown>)=>{
  setBusy(true);setMessage('');setError('');
  try{
   const r=await fetch('/api/admin/sales/offer-templates',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({brand,...body})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||'Aktion fehlgeschlagen');
   await load();setMessage('Aktion ausgeführt. Änderungen sind versioniert.');
  }catch(e){setError(e instanceof Error?e.message:'Aktion fehlgeschlagen');}finally{setBusy(false);}
 };
 const updateText=(key:keyof TemplateCopy,value:string)=>setContent(x=>({...x,[key]:value}));
 const updateList=(key:keyof TemplateCopy,value:string[])=>setContent(x=>({...x,[key]:value}));
 const preview=async()=>{
  setBusy(true);setError('');
  try{
   const today=new Date();today.setUTCDate(today.getUTCDate()+21);
   const commercial={brand:brand==='agiworks'?'agiworks':'nexcel',customer:'BEISPIEL GmbH – DEMO',title:'Musterangebot – nur zur Designprüfung',scope:'Muster-Leistungsumfang für eine reine Layoutvorschau.',deliverables:['Muster-Liefergegenstand'],netCents:10000,vatRate:.19,annualMaintenanceNetCents:0,validUntil:today.toISOString().slice(0,10)};
   const payload={commercial,shared:brand==='shared'?content:shared,brand:brand==='shared'?INITIAL_TEMPLATES.nexcel:content};
   const r=await fetch('/api/admin/sales/offer-templates/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!r.ok)throw new Error('PDF-Vorschau fehlgeschlagen; Vorlagenfelder prüfen');
   const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='angebotsvorschau.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){setError(e instanceof Error?e.message:'Vorschau nicht verfügbar');}finally{setBusy(false);}
 };
 const active=rows.find(x=>x.state==='active'),pending=rows.filter(x=>x.state==='pending'),draft=rows.find(x=>x.state==='draft');
 return <div className="space-y-5">
  <section className={card}><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">1. Vorlage auswählen</h2><p className="mt-2 text-sm text-slate-400">Die gemeinsame Vorlage definiert das sprachliche Fundament; alle PDFs verwenden denselben PDF-Renderer mit markengerechten Kopf- und Fußzeilen.</p></div><select aria-label="Vorlage" className={field+' max-w-xs'} value={brand} onChange={e=>setBrand(e.target.value as TemplateBrand)}>{TEMPLATE_BRANDS.map(x=><option key={x} value={x}>{TEMPLATE_LABELS[x]}</option>)}</select></div><div className="mt-5 flex gap-2 text-xs"><span className="rounded-lg bg-white/10 p-3">{active?`Freigegeben: v${active.version}`:'Noch nicht freigegeben'}</span><span className="rounded-lg bg-white/10 p-3">{pending.length} offene Freigaben</span><span className="rounded-lg bg-white/10 p-3">{rows.length} Versionen</span></div></section>
  {error&&<p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}
  {message&&<p role="status" className="rounded-xl border border-sky-400/40 bg-sky-500/10 p-4 text-sm text-sky-100">{message}</p>}
  <section className={card}><h2 className="text-xl font-semibold">2. Text und Angebotsstruktur</h2><p className="mt-2 text-sm text-slate-400">Keine festen Preise oder echten Kundenangaben in Vorlagen speichern. Listen enthalten jeweils eine Position pro Zeile.</p><div className="mt-5 grid gap-5 lg:grid-cols-2">
   {textKeys.map(k=><label key={k} className={'block text-sm '+(k==='introduction'?'lg:col-span-2':'')}><span>{labels[k]}</span><textarea value={content[k] as string} className={field+' min-h-[98px]'} maxLength={2200} onChange={e=>updateText(k,e.target.value)}/></label>)}
   {listKeys.map(k=><label key={k} className="block text-sm"><span>{labels[k]}</span><textarea value={(content[k] as string[]).join('\n')} className={field+' min-h-[130px]'} onChange={e=>updateList(k,e.target.value.split('\n').map(x=>x.trim()).filter(Boolean))}/></label>)}
  </div><div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} onClick={()=>action({action:'save',content})} className={btn}>Neue Vorlage als Entwurf speichern</button><button disabled={busy} onClick={preview} className={btn}>PDF-Designvorschau herunterladen</button>{draft&&<button disabled={busy} onClick={()=>action({action:'submit',versionId:draft.id})} className={btn}>Entwurf v{draft.version} zur Partnerfreigabe</button>}</div></section>
  <section className={card}><h2 className="text-xl font-semibold">3. Vier-Augen-Freigabe</h2>{pending.length===0?<p className="mt-2 text-sm text-slate-400">Aktuell keine Vorlage zur Freigabe eingereicht.</p>:pending.map(v=><div key={v.id} className="mt-3 flex flex-wrap justify-between gap-3 rounded-xl border border-white/10 p-4"><div><strong>Version {v.version}</strong><p className="text-xs text-slate-400">Erstellt von {v.created_by.slice(0,30)}</p></div><div className="flex flex-wrap gap-2"><button className={btn} onClick={()=>setContent(copy(v.content))}>Prüfen</button><button className={btn} disabled={busy} onClick={()=>action({action:'approve',versionId:v.id})}>Als zweite Person freigeben</button><button className={btn} disabled={busy} onClick={()=>action({action:'reject',versionId:v.id})}>Ablehnen</button></div></div>)}<p className="mt-4 text-xs text-slate-500">Freigaben erfordern ein zweites aktives Administrationskonto. Vorlagen-Snapshots in bereits erzeugten Angeboten werden nicht rückwirkend geändert.</p></section>
 </div>;
}
