/** Internal only: never import into public client components or expose via public routes. */
import { PROJECTS, MODULES, SCOPES, TIMEFRAMES, QUALITIES, LABELS, type PriceRules, type QuoteInput, type Range } from './pricingTypes';
export type {PriceRules,QuoteInput,Brand,Range} from './pricingTypes';
/** Seed prices are unapproved starting hypotheses, not promises to customers. */
/** Public repository: NO internal price assumptions in source control.
 * Owners must set every base and module range and obtain independent approval.
 * Approved prices and quote snapshots live only in the protected database.
 */
export const INITIAL_RULES:PriceRules = {
  base:Object.fromEntries(PROJECTS.map(k=>[k,{min:0,max:0}])) as PriceRules['base'],
  modules:Object.fromEntries(MODULES.map(k=>[k,{min:0,max:0}])) as PriceRules['modules'],
  scope:{mvp:1,growth:1,enterprise:1},
  timeframe:{asap:1,standard:1,relaxed:1},
  quality:{startup:1,professional:1,elite:1},
  multiProjectFactor:1,
  risk:{perApi:0,ai:0,migration:0,other:0,max:0},
  maintenanceAnnualRate:0,
  vatRate:.19,
};


export function validateRules(value:unknown):PriceRules {
  if (!value || typeof value!=='object' || Array.isArray(value)) throw new Error('Ungültige Preiskonfiguration');
  const v=value as Record<string,any>;
  const amount=(n:unknown,min:number,max:number,field:string):number => {
    if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max) throw new Error('Ungültiger Wert: '+field);
    return n;
  };
  const range=(x:unknown,field:string):Range=>{
    if(!x||typeof x!=='object'||Array.isArray(x)) throw new Error('Ungültige Preisspanne: '+field);
    const r=x as Record<string,unknown>;
    const min=amount(r.min,0,5_000_000,field+'.min');
    const max=amount(r.max,min,5_000_000,field+'.max');
    return {min,max};
  };
  const dictionary=<T extends string>(raw:unknown,keys:readonly T[],f:(x:unknown,k:string)=>any):Record<T,any>=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw)) throw new Error('Ungültige Kategorie');
    const o=raw as Record<string,unknown>; const result={} as Record<T,any>;
    for(const key of keys) result[key]=f(o[key],key);
    return result;
  };
  const risk=v.risk;
  if(!risk||typeof risk!=='object'||Array.isArray(risk)) throw new Error('Risiko fehlt');
  return {
    base:dictionary(v.base,PROJECTS,range),
    modules:dictionary(v.modules,MODULES,range),
    scope:dictionary(v.scope,SCOPES,(x,k)=>amount(x,.1,5,'scope.'+k)),
    timeframe:dictionary(v.timeframe,TIMEFRAMES,(x,k)=>amount(x,.1,5,'timeframe.'+k)),
    quality:dictionary(v.quality,QUALITIES,(x,k)=>amount(x,.1,5,'quality.'+k)),
    multiProjectFactor:amount(v.multiProjectFactor,.1,1,'multiProjectFactor'),
    risk:{perApi:amount(risk.perApi,0,20,'risk.perApi'),ai:amount(risk.ai,0,50,'risk.ai'),migration:amount(risk.migration,0,50,'risk.migration'),other:amount(risk.other,0,50,'risk.other'),max:amount(risk.max,0,100,'risk.max')},
    maintenanceAnnualRate:amount(v.maintenanceAnnualRate,0,1,'maintenanceAnnualRate'),
    vatRate:amount(v.vatRate,0,.3,'vatRate'),
  };
}
/** Zero-valued placeholders may be saved as drafts, but never approved.
 * Fail closed: all pricing dimensions require intentional positive minimums.
 */
export function validateRulesForApproval(value:unknown):PriceRules {
  const rules=validateRules(value);
  for(const k of PROJECTS){
    if(rules.base[k].min<=0 || rules.base[k].max<=0)
      throw new Error('Preisstand unvollständig: Basis '+LABELS[k]+' benötigt positive Min-/Max-Werte');
  }
  for(const k of MODULES){
    if(rules.modules[k].min<=0 || rules.modules[k].max<=0)
      throw new Error('Preisstand unvollständig: Modul '+LABELS[k]+' benötigt positive Min-/Max-Werte');
  }
  return rules;
}

export function validateInput(value:unknown):QuoteInput {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Projektangaben fehlen');
  const v=value as Record<string,any>;
  const inSet=<T extends string>(x:unknown,a:readonly T[])=>typeof x==='string'&&a.includes(x as T);
  if(!Array.isArray(v.projectTypes)||v.projectTypes.length<1||v.projectTypes.length>PROJECTS.length||!v.projectTypes.every((x:unknown)=>inSet(x,PROJECTS))||new Set(v.projectTypes).size!==v.projectTypes.length)throw new Error('Projektart ungültig');
  if(!Array.isArray(v.modules)||v.modules.length>MODULES.length||!v.modules.every((x:unknown)=>inSet(x,MODULES))||new Set(v.modules).size!==v.modules.length)throw new Error('Module ungültig');
  if(!inSet(v.scope,SCOPES)||!inSet(v.timeframe,TIMEFRAMES)||!inSet(v.quality,QUALITIES))throw new Error('Auswahl ungültig');
  if(![0,2,4,8].includes(v.apiCount))throw new Error('API-Zahl ungültig');
  for(const k of ['includesAi','includesMigration','includeAnnualMaintenance'])if(typeof v[k]!=='boolean')throw new Error('Ungültiges Feld: '+k);
  return v as QuoteInput;
}

export function calculateInternalQuote(input:QuoteInput,rules:PriceRules){
  const i=validateInput(input),r=validateRules(rules);
  const items:{label:string;min:number;max:number}[]=[];
  const add=(label:string,min:number,max:number)=>items.push({label,min:Math.round(min),max:Math.round(max)});
  const sum=(end:'min'|'max')=>i.projectTypes.reduce((n,k)=>n+r.base[k][end],0)*(i.projectTypes.length>1?r.multiProjectFactor:1);
  const baseMin=sum('min'),baseMax=sum('max');
  add('Basis',baseMin,baseMax);
  let min=baseMin*r.scope[i.scope]*r.timeframe[i.timeframe]*r.quality[i.quality];
  let max=baseMax*r.scope[i.scope]*r.timeframe[i.timeframe]*r.quality[i.quality];
  add('Umfang, Zeit und Qualität (Differenz)',min-baseMin,max-baseMax);
  for(const k of i.modules){add('Modul: '+LABELS[k],r.modules[k].min,r.modules[k].max);min+=r.modules[k].min;max+=r.modules[k].max;}
  const riskPct=Math.min(r.risk.max,i.apiCount*r.risk.perApi+(i.includesAi?r.risk.ai:0)+(i.includesMigration?r.risk.migration:0)+(i.projectTypes.includes('sonstiges')?r.risk.other:0));
  const riskMin=min*riskPct/100,riskMax=max*riskPct/100;
  add('Risikopuffer ('+riskPct+' %)',riskMin,riskMax);
  min+=riskMin;max+=riskMax;
  const projectNet={min:Math.round(min),max:Math.round(max)};
  const annualMaintenanceNet=i.includeAnnualMaintenance?{min:Math.round(projectNet.min*r.maintenanceAnnualRate),max:Math.round(projectNet.max*r.maintenanceAnnualRate)}:{min:0,max:0};
  const tax={min:Math.round(projectNet.min*r.vatRate),max:Math.round(projectNet.max*r.vatRate)};
  return {projectNet,vat:tax,projectGross:{min:projectNet.min+tax.min,max:projectNet.max+tax.max},annualMaintenanceNet,riskPct,items,vatRate:r.vatRate,disclaimer:'Nur interne, unverbindliche Orientierung. Leistungsumfang, USt-Behandlung, Drittanbieter, Lizenzkosten und Vertragsbedingungen vor Angebot prüfen.'};
}
