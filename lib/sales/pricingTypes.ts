/** Public types only. NEVER place internal rates or price snapshots in this module. */
export const PROJECTS = ['web','app','automatisierung','ki','sonstiges'] as const;
export const MODULES = ['api','dashboard','auth','payments','admin_panel','reporting','ki_module','workflow','migration'] as const;
export const SCOPES = ['mvp','growth','enterprise'] as const;
export const TIMEFRAMES = ['asap','standard','relaxed'] as const;
export const QUALITIES = ['startup','professional','elite'] as const;
export type Project = typeof PROJECTS[number];
export type Module = typeof MODULES[number];
export type Brand = 'nexcel'|'agiworks';
export type Range = {min:number;max:number};
export type PriceRules = {
  base:Record<Project,Range>;
  modules:Record<Module,Range>;
  scope:Record<typeof SCOPES[number],number>;
  timeframe:Record<typeof TIMEFRAMES[number],number>;
  quality:Record<typeof QUALITIES[number],number>;
  multiProjectFactor:number;
  risk:{perApi:number;ai:number;migration:number;other:number;max:number};
  maintenanceAnnualRate:number;
  vatRate:number;
};
export type QuoteInput = {
  projectTypes:Project[];
  scope:typeof SCOPES[number];
  timeframe:typeof TIMEFRAMES[number];
  quality:typeof QUALITIES[number];
  modules:Module[];
  apiCount:0|2|4|8;
  includesAi:boolean;
  includesMigration:boolean;
  includeAnnualMaintenance:boolean;
};


export const LABELS:Record<Project|Module,string>={web:'Web',app:'App',automatisierung:'Automatisierung',ki:'KI-Integration',sonstiges:'Sonstiges',api:'API-Integration',dashboard:'Dashboard',auth:'Authentifizierung / Rollen',payments:'Zahlungen',admin_panel:'Admin-Panel',reporting:'Reporting',ki_module:'KI / RAG / Agent',workflow:'Workflow',migration:'Datenmigration'};
