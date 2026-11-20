import {NextRequest,NextResponse} from 'next/server';
import {authorize,type AuthResult} from '@/lib/auth/authorize';
import {db} from '@/lib/pg';
import {getProposal,saveProposalDocument} from '@/lib/sales/proposalsStore';
import {serviceAddProposalVersion} from '@/lib/sales/service';
import {renderBrandedOfferPdf} from '@/lib/sales/brandedOfferPdf';
import {offerStructured,validateCommercial} from '@/lib/sales/offerCompose';
import {validateTemplate} from '@/lib/sales/offerTemplates';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(x:object,status=200)=>NextResponse.json(x,{status,headers:{'Cache-Control':'private, no-store'}});
function check(g:AuthResult){
 if(!g.ok)return{ok:false as const,response:g.response};
 if(!g.auth.user?.isActive||!['owner','admin'].includes(g.auth.role))return{ok:false as const,response:reply({error:'Aktives CRM-Admin-Konto erforderlich'},403)};
 return{ok:true as const,auth:g.auth};
}
type QuoteRow={id:string;brand:'nexcel'|'agiworks';customer_label:string;calculation:{projectNet?:{min:number;max:number};annualMaintenanceNet?:{min:number;max:number};vatRate?:number};notes:string;price_version_id:string;created_at:string};
async function activeTemplate(sql:NonNullable<Awaited<ReturnType<typeof db>>>,brand:'shared'|'nexcel'|'agiworks'){
 const [row]=await sql<{content:unknown;id:string;version:number}[]>`SELECT id,version,content FROM sales_offer_template_versions WHERE template_brand=${brand} AND state='active'`;
 return row||null;
}
export async function GET(_:NextRequest,ctx:{params:Promise<{id:string}>}){
 const gate=check(await authorize('sales.read'));if(!gate.ok)return gate.response;
 const {id}=await ctx.params;const proposal=await getProposal(id);
 if(!proposal)return reply({error:'Angebot nicht gefunden'},404);
 if(proposal.brandContext!=='agiworks'&&proposal.brandContext!=='nexcel')return reply({error:'Gemeinsames Angebot erfordert individuelle Scope-Freigabe'},422);
 const sql=await db();if(!sql)return reply({error:'DB fehlt'},503);
 const [quotes,shared,brand]=await Promise.all([
  sql<QuoteRow[]>`SELECT id,brand,customer_label,calculation,notes,price_version_id,created_at FROM internal_pricing_quotes
    WHERE brand=${proposal.brandContext} ORDER BY created_at DESC LIMIT 30`,
  activeTemplate(sql,'shared'),activeTemplate(sql,proposal.brandContext),
 ]);
 return reply({proposalId:id,brand:proposal.brandContext,quotes,templatesReady:Boolean(shared&&brand)});
}
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){
 const gate=check(await authorize('sales.manage'));if(!gate.ok)return gate.response;
 if(req.headers.get('origin')!==req.nextUrl.origin||req.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origin nicht erlaubt'},403);
 if(Number(req.headers.get('content-length')||0)>15000)return reply({error:'Payload zu groß'},413);
 const {id}=await ctx.params;const proposal=await getProposal(id);
 if(!proposal)return reply({error:'Angebot nicht gefunden'},404);
 if(proposal.brandContext!=='nexcel'&&proposal.brandContext!=='agiworks')return reply({error:'Markenübergreifende Angebote benötigen gesonderte Prüfung'},422);
 let body:Record<string,unknown>;try{const v:unknown=await req.json();if(!v||typeof v!=='object'||Array.isArray(v))throw Error();body=v as Record<string,unknown>;}catch{return reply({error:'Ungültige JSON-Daten'},400);}
 if(JSON.stringify(body).length>15000)return reply({error:'Payload zu groß'},413);
 if(typeof body.quoteId!=='string'||!/^quote_[a-f0-9-]{36}$/.test(body.quoteId))return reply({error:'Gespeicherten Kalkulationssnapshot auswählen'},400);
 const sql=await db();if(!sql)return reply({error:'DB fehlt'},503);
 const [quote]=await sql<QuoteRow[]>`SELECT id,brand,customer_label,calculation,notes,price_version_id,created_at FROM internal_pricing_quotes WHERE id=${body.quoteId} AND brand=${proposal.brandContext}`;
 if(!quote)return reply({error:'Kein freigegebener Kalkulationssnapshot gefunden'},404);
 const [shared,business]=await Promise.all([activeTemplate(sql,'shared'),activeTemplate(sql,proposal.brandContext)]);
 if(!shared||!business)return reply({error:'Gemeinsame und markenspezifische Vorlage müssen durch zwei Personen freigegeben sein'},409);
 try{
  const vat=quote.calculation?.vatRate;
  if(typeof vat!=='number')return reply({error:'Kalkulationssnapshot ohne Steuerinformation'},409);
  const net=body.netCents;
  const commercial=validateCommercial({...body,brand:proposal.brandContext,customer:quote.customer_label,vatRate:vat,netCents:net});
  const min=quote.calculation?.projectNet?.min??0,max=quote.calculation?.projectNet?.max??0;
  if(min<=0||max<min)return reply({error:'Kalkulation ungültig'},409);
  const netEuros=commercial.netCents/100;
  const override=typeof body.outOfRangeReason==='string'?body.outOfRangeReason.trim():'';
  if((netEuros<min||netEuros>max)&&override.length<25)return reply({error:'Betrag außerhalb des Korridors: fundierte Begründung (min. 25 Zeichen) erforderlich'},422);
  const structured=offerStructured(commercial,validateTemplate(shared.content),validateTemplate(business.content));
  const version=await serviceAddProposalVersion(gate.auth,{
   proposalId:proposal.id,structured:structured as Record<string,unknown>,
   pricingSnapshot:{quoteId:quote.id,priceVersionId:quote.price_version_id,quoteCalculation:quote.calculation,netCents:commercial.netCents,vatRate:commercial.vatRate,overrideReason:override,templateIds:[shared.id,business.id]},
   timeframeSnapshot:{validUntil:commercial.validUntil},
  });
  const bytes=await renderBrandedOfferPdf({brand:proposal.brandContext,structured,proposalNumber:`${proposal.title}-v${version.version}`,watermark:'ENTWURF'});
  await saveProposalDocument(version.id,bytes);
  return reply({ok:true,versionId:version.id,number:version.version},201);
 }catch(e){
  if(e instanceof Error&&/fehl|ungültig|lang|Betrag|Liefergegenstand/i.test(e.message))return reply({error:e.message},400);
  console.error('[sales offer compose] failed');return reply({error:'Angebot konnte nicht erzeugt werden'},503);
 }
}
