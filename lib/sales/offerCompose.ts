import type { ProposalStructured } from './proposalPdf';
import {validateTemplate,type TemplateCopy} from './offerTemplates';
export type CommercialInput={
  brand:'nexcel'|'agiworks';customer:string;title:string;scope:string;deliverables:string[];
  netCents:number;vatRate:number;annualMaintenanceNetCents:number;validUntil:string;
};
const money=(v:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v/100);
function cleanText(x:unknown,max:number,label:string):string{
 if(typeof x!=='string'||!x.trim()||x.length>max)throw new Error(`${label} fehlt oder ist zu lang`);
 return x.trim();
}
export function validateCommercial(input:unknown):CommercialInput{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Angebotsdaten fehlen');
 const v=input as Record<string,unknown>;
 if(v.brand!=='nexcel'&&v.brand!=='agiworks')throw new Error('Marke ungültig');
 const amount=(n:unknown,max:number)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=max;
 if(!amount(v.netCents,500_000_000)||Number(v.netCents)<=0)throw new Error('Fester Netto-Angebotspreis erforderlich');
 if(!amount(v.annualMaintenanceNetCents,500_000_000))throw new Error('Wartungsbetrag ungültig');
 if(typeof v.vatRate!=='number'||!Number.isFinite(v.vatRate)||v.vatRate<0||v.vatRate>.3)throw new Error('Steuersatz ungültig');
 if(typeof v.validUntil!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.validUntil)||Number.isNaN(Date.parse(v.validUntil)))throw new Error('Gültigkeit ungültig');
 if(!Array.isArray(v.deliverables)||v.deliverables.length<1||v.deliverables.length>20||!v.deliverables.every(x=>typeof x==='string'&&x.length<=400))throw new Error('Mindestens ein Liefergegenstand nötig');
 return {brand:v.brand,customer:cleanText(v.customer,160,'Kunde'),title:cleanText(v.title,180,'Titel'),scope:cleanText(v.scope,2200,'Leistungsumfang'),deliverables:v.deliverables.map(x=>(x as string).trim()).filter(Boolean),netCents:v.netCents as number,vatRate:v.vatRate,annualMaintenanceNetCents:v.annualMaintenanceNetCents as number,validUntil:v.validUntil};
}
/** Builds a deterministic snapshot: source templates never influence an already approved version. */
export function offerStructured(commercial:CommercialInput,sharedInput:TemplateCopy,brandInput:TemplateCopy):ProposalStructured{
 const s=validateTemplate(sharedInput),b=validateTemplate(brandInput);
 const net=commercial.netCents,tax=Math.round(net*commercial.vatRate),gross=net+tax;
 const brand=commercial.brand==='nexcel'?'NEXCEL AI':'AGI Works';
 return {
  brandContext:commercial.brand,
  cover:{unternehmen:commercial.customer,projektbezeichnung:commercial.title,brand},
  aufEinenBlick:[s.introduction,b.introduction],
  wieHeute:{ausgangslage:commercial.scope},
  wieMorgen:{zielzustand:b.recommendation,wirkung:s.recommendation},
  empfehlung:{titel:b.heading,kern:b.implementation,warum:s.implementation},
  leistungsumfang:commercial.brand==='nexcel'?{nexcel:[...b.included,...s.included]}:{agiWorks:[...b.included,...s.included]},
  deliverables:commercial.deliverables,
  scope:{inScope:commercial.deliverables,outOfScope:[...s.excluded,...b.excluded],annahmen:[...s.assumptions,...b.assumptions]},
  investition:{
    einmalig:[{position:'Einmalige Projektleistung (netto)',betrag:money(net)},{position:`Umsatzsteuer (${Math.round(commercial.vatRate*100)} %; gesondert prüfen)`,betrag:money(tax)}],
    wiederkehrend:commercial.annualMaintenanceNetCents>0?[{position:'Wartung / SLA (netto)',betrag:money(commercial.annualMaintenanceNetCents),intervall:'jährlich, separat zu vereinbaren'}]:[],
    summeEinmalig:`${money(gross)} inkl. rechnerischer Umsatzsteuer`,
    hinweise:['Festpreis vorbehaltlich schriftlich vereinbartem Leistungsumfang; Drittanbieter-/Lizenzkosten nur enthalten, wenn ausdrücklich aufgeführt.','Steuerliche Behandlung und Vertragsgrundlagen vor Absendung kaufmännisch und rechtlich prüfen.'],
  },
  zeitrahmen:{gueltigBis:commercial.validUntil},
  naechsterSchritt:[...s.nextSteps,...b.nextSteps],
  absender:{brand,unternehmen:brand,kontakt:[s.closing,b.closing]},
 };
}
