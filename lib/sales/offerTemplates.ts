/** Server/client-safe types. No commercial rates, credentials or customer data. */
export type TemplateBrand = 'shared' | 'nexcel' | 'agiworks';
export type TemplateCopy = {
  heading: string;
  introduction: string;
  recommendation: string;
  implementation: string;
  included: string[];
  excluded: string[];
  assumptions: string[];
  nextSteps: string[];
  closing: string;
};
export const TEMPLATE_BRANDS: TemplateBrand[] = ['shared','nexcel','agiworks'];
export const TEMPLATE_LABELS: Record<TemplateBrand,string> = {shared:'Gemeinsames Design',nexcel:'NEXCEL AI',agiworks:'AGI Works'};
export const INITIAL_TEMPLATES:Record<TemplateBrand, TemplateCopy> = {
  shared: {
    heading:'Ihr individuelles Projektangebot',
    introduction:'Vielen Dank für das persönliche Projektgespräch. Auf Basis der abgestimmten Anforderungen erhalten Sie eine individuell geprüfte Leistungs- und Budgetzusammenstellung.',
    recommendation:'Die Umsetzung erfolgt in nachvollziehbaren Meilensteinen mit gemeinsam definierten Abnahmekriterien.',
    implementation:'Analyse und Spezifikation; Implementierung mit regelmäßigen Reviews; Tests, Übergabe und Dokumentation.',
    included:['Technische Projektplanung und definierte Liefergegenstände','Gemeinsame Abnahme der vereinbarten Funktionen'],
    excluded:['Nicht ausdrücklich vereinbarte Drittanbieter- und Lizenzkosten','Unbegrenzt laufende Wartungsleistungen'],
    assumptions:['Projektumfang, Mitwirkungspflichten und Abnahmekriterien werden vor Beauftragung schriftlich fixiert'],
    nextSteps:['Fragen und Leistungsumfang im Termin abstimmen','Angebot bestätigen und Projektstart vereinbaren'],
    closing:'Wir freuen uns auf die Zusammenarbeit.',
  },
  nexcel: {
    heading:'KI- und Automatisierungslösung für Ihr Unternehmen',
    introduction:'NEXCEL AI entwickelt kontrollierbare KI- und Automatisierungssysteme passend zu Ihren Abläufen.',
    recommendation:'Wir empfehlen die schrittweise Implementierung mit klaren Qualitäts-, Datenschutz- und Erfolgskriterien.',
    implementation:'Discovery; Architektur und Integrationen; kontrollierte Umsetzung; Evaluation; Übergabe.',
    included:['Konkret definierte KI-/Automatisierungsleistungen'],
    excluded:['Verbrauchskosten externer KI-/API-Anbieter, sofern nicht ausdrücklich enthalten'],
    assumptions:['Datenzugänge und Rechte werden vor der Implementierung geklärt'],
    nextSteps:['Gemeinsames Scope-Review','Technischen und kaufmännischen Leistungsumfang freigeben'],
    closing:'NEXCEL AI – maßgeschneiderte KI-Systeme.',
  },
  agiworks: {
    heading:'Individuelle Softwareentwicklung',
    introduction:'AGI Works konzipiert und realisiert individuelle Softwarelösungen für verlässliche Geschäftsprozesse.',
    recommendation:'Wir setzen auf eine überprüfbare Architektur, transparente Meilensteine und reproduzierbare Qualitätssicherung.',
    implementation:'Anforderungsworkshop; Architektur; Entwicklung; Integrationstests; produktive Übergabe.',
    included:['Im Angebot spezifizierte Softwaremodule und Schnittstellen'],
    excluded:['Hosting, externe Lizenzen und Betriebsaufwand ohne gesonderte Vereinbarung'],
    assumptions:['Schnittstellendokumentation und Testzugänge werden vereinbart bereitgestellt'],
    nextSteps:['Funktionsumfang abstimmen','Projektplan, Budget und Vertragsgrundlagen finalisieren'],
    closing:'AGI Works – individuelle Software, verlässlich umgesetzt.',
  },
};
export function templateBrand(value:unknown):value is TemplateBrand{return value==='shared'||value==='nexcel'||value==='agiworks';}
export function validateTemplate(input:unknown):TemplateCopy{
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Vorlage ungültig');
  const r=input as Record<string,unknown>;
  const str=(k:keyof TemplateCopy,max=2200)=>{
    const v=r[k];if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error('Feld '+k+' fehlt oder ist zu lang');
    return v.trim();
  };
  const list=(k:keyof TemplateCopy)=>{
    const v=r[k];if(!Array.isArray(v)||v.length>14||!v.every(x=>typeof x==='string'&&x.length<=450))throw new Error('Liste '+k+' ungültig');
    return v.map(x=>(x as string).trim()).filter(Boolean);
  };
  return {heading:str('heading',180),introduction:str('introduction'),recommendation:str('recommendation'),implementation:str('implementation'),included:list('included'),excluded:list('excluded'),assumptions:list('assumptions'),nextSteps:list('nextSteps'),closing:str('closing',550)};
}
