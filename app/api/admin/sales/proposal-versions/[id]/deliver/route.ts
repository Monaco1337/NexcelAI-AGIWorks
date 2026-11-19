/** True transactional email delivery; never equate 'marked sent' with provider acceptance. */
import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { NextRequest,NextResponse } from 'next/server';
import { authorize } from '@/lib/auth/authorize';
import { db } from '@/lib/pg';
import { getProposal,getProposalVersion,saveProposalDocument } from '@/lib/sales/proposalsStore';
import { renderProposalPdf,type ProposalStructured } from '@/lib/sales/proposalPdf';
import { serviceMarkProposalSent } from '@/lib/sales/service';
export const runtime='nodejs';export const dynamic='force-dynamic';
const response=(o:object,status=200)=>NextResponse.json(o,{status,headers:{'Cache-Control':'private, no-store'}});
const safe=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const isMail=(s:unknown):s is string=>typeof s==='string'&&s.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[A-Za-z]{2,}$/.test(s);
function sender(brand:string):string|null{
 const configured=brand==='agiworks'?process.env.PROPOSAL_FROM_EMAIL_AGIWORKS:process.env.PROPOSAL_FROM_EMAIL_NEXCEL;
 // Fail closed: commercial offers must use the explicitly configured brand-verified sender.
 const v=configured;
 return v&&(/^[^\s@<>]+@[^\s@<>]+$/.test(v)||/^[^\r\n]+<[^<>\s@]+@[^<>\s@]+>$/.test(v))?v:null;
}
type Existing={id:string;recipient:string;sender:string;state:string;attempts:number;claimed_at:Date|null;created_at:Date};
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){
 const gate=await authorize('sales.proposal.send');if(!gate.ok)return gate.response;
 if(!gate.auth.user?.isActive||!['owner','admin'].includes(gate.auth.role))return response({error:'Aktives Admin-Konto erforderlich'},403);
 if(req.headers.get('origin')!==req.nextUrl.origin||req.headers.get('sec-fetch-site')==='cross-site')return response({error:'Origin nicht erlaubt'},403);
 if(Number(req.headers.get('content-length')||0)>2500)return response({error:'Zu große Anfrage'},413);
 const {id}=await ctx.params;
 const version=await getProposalVersion(id);if(!version)return response({error:'Angebotsversion nicht gefunden'},404);
 if(!version.approvedAt)return response({error:'Nur freigegebene Versionen dürfen versendet werden'},409);
 if(version.sentAt)return response({error:'Diese Version wurde bereits als versendet markiert'},409);
 const proposal=await getProposal(version.proposalId);if(!proposal)return response({error:'Angebot nicht gefunden'},404);
 if(proposal.brandContext!=='nexcel'&&proposal.brandContext!=='agiworks')return response({error:'Markenübergreifende Angebote nur nach gesonderter Freigabe'},422);
 const from=sender(proposal.brandContext);if(!from)return response({error:'Verifizierter markenspezifischer Absender fehlt'},503);
 if(!process.env.RESEND_API_KEY||process.env.PROPOSAL_EMAIL_SEND_ENABLED!=='1')return response({error:'Angebotsversand ist serverseitig noch nicht freigegeben'},503);
 let body:unknown;try{body=await req.json();}catch{return response({error:'Ungültiges JSON'},400);}
 const requested=(body as {recipient?:unknown} | null)?.recipient;
 if(!isMail(requested))return response({error:'Empfängeradresse ungültig'},400);
 const recipient=requested.trim().toLowerCase();
 if(process.env.VERCEL_ENV!=='production'){
  const allowed=(process.env.PREVIEW_PROPOSAL_TEST_RECIPIENTS||'').toLowerCase().split(/[;,]/).map(x=>x.trim()).filter(Boolean);
  if(!allowed.includes(recipient))return response({error:'Preview: nur freigegebene interne Test-Empfänger erlaubt'},403);
 }
 const sql=await db();if(!sql)return response({error:'Datenbank nicht verfügbar'},503);
 const claim=await sql.begin(async tx=>{
  await tx`SELECT pg_advisory_xact_lock(hashtext(${`sales-dispatch:${id}`}))`;
  const [old]=await tx<Existing[]>`SELECT id,recipient,sender,state,attempts,claimed_at,created_at
    FROM sales_proposal_email_dispatches WHERE proposal_version_id=${id} FOR UPDATE`;
  if(old){
    if(old.state==='sent')return{ok:false as const,message:'Provider hat Versand angenommen',alreadySent:true};
    if(old.recipient!==recipient||old.sender!==from)return{ok:false as const,message:'Empfänger oder Absender der begonnenen Versandsitzung ist unveränderlich'};
    if(old.created_at.getTime()<Date.now()-20*3600_000)return{ok:false as const,message:'Versand älter als 20 h: manuelle Provider-Reconciliation erforderlich'};
    if(old.claimed_at&&old.state==='sending'&&old.claimed_at.getTime()>Date.now()-10*60_000)return{ok:false as const,message:'Versand läuft bereits'};
    await tx`UPDATE sales_proposal_email_dispatches SET state='sending',attempts=attempts+1,claimed_at=NOW(),updated_at=NOW()
      WHERE id=${old.id}`;
    return{ok:true as const,id:old.id};
  }
  const rowId=`sd_${randomUUID()}`;
  await tx`INSERT INTO sales_proposal_email_dispatches(id,proposal_version_id,recipient,sender,state,attempts,claimed_at,created_by)
    VALUES(${rowId},${id},${recipient},${from},'sending',1,NOW(),${gate.auth.userId})`;
  return{ok:true as const,id:rowId};
 });
 if(!claim.ok){
  if('alreadySent' in claim && claim.alreadySent){
   try{await serviceMarkProposalSent(gate.auth,id);return response({ok:true,sent:true,reconciled:true});}
   catch{return response({error:'Provider-Versand ist bestätigt, aber CRM-Status muss manuell abgeglichen werden'},503);}
  }
  return response({error:claim.message},409);
 }
 try{
  // Regenerate the *approved* immutable structured snapshot, never attach the draft watermark.
  const bytes=await renderProposalPdf({brand:proposal.brandContext,structured:version.structured as ProposalStructured,
    proposalNumber:`${proposal.title}-v${version.version}`,generatedAt:new Date(version.generatedAt)});
  const resend=new Resend(process.env.RESEND_API_KEY);
  const result=await resend.emails.send({
   from,to:recipient,subject:`Ihr Projektangebot – ${proposal.brandContext==='agiworks'?'AGI Works':'NEXCEL AI'}`,
   html:`<div style="font-family:Arial,sans-serif;color:#182235;max-width:600px;margin:auto"><h1 style="font-size:23px">${proposal.brandContext==='agiworks'?'AGI Works':'NEXCEL AI'}</h1><p>Vielen Dank für das Gespräch.</p><p>Das individuell freigegebene Projektangebot <strong>${safe(proposal.title)}</strong> finden Sie als PDF im Anhang.</p><p>Bitte prüfen Sie alle Leistungen, Beträge und Bedingungen. Bei Rückfragen antworten Sie direkt auf diese E-Mail.</p><p>Mit freundlichen Grüßen<br>${proposal.brandContext==='agiworks'?'AGI Works':'NEXCEL AI'}</p></div>`,
   attachments:[{filename:`angebot-v${version.version}.pdf`,content:Buffer.from(bytes),contentType:'application/pdf'}],
  },{idempotencyKey:`proposal-version/${id}`});
  if(result.error||!result.data?.id)throw new Error('provider_delivery_not_accepted');
  await sql`UPDATE sales_proposal_email_dispatches SET state='sent',sent_at=NOW(),claimed_at=NULL,provider_id=${result.data.id},updated_at=NOW() WHERE id=${claim.id}`;
  await saveProposalDocument(version.id,bytes);
  await serviceMarkProposalSent(gate.auth,id);
  return response({ok:true,sent:true,providerAccepted:true,recipientMasked:recipient.replace(/^(.{2}).+(@.*)$/,'$1***$2')});
 }catch(e){
  // If provider accepted but DB update failed, keep same recipient and idempotency key for reconciliation.
  await sql`UPDATE sales_proposal_email_dispatches SET state='failed',claimed_at=NULL,last_error='provider_or_persistence_failure',updated_at=NOW()
    WHERE id=${claim.id} AND state<>'sent'`.catch(()=>{});
  console.error('[proposal delivery] failed without customer identifiers');
  return response({error:'Versand nicht bestätigt. Bitte Provider-/Delivery-Status prüfen; nicht erneut mit anderem Empfänger versenden.'},503);
 }
}
