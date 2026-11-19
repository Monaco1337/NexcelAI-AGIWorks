import { randomUUID } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import { authorize,type AuthResult } from '@/lib/auth/authorize';
import { db } from '@/lib/pg';
import { INITIAL_TEMPLATES,templateBrand,validateTemplate } from '@/lib/sales/offerTemplates';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const originOK=(req:NextRequest)=>req.headers.get('origin')===req.nextUrl.origin&&req.headers.get('sec-fetch-site')!=='cross-site';
function secured(result:AuthResult){
 if(!result.ok)return{ok:false as const,response:result.response};
 if(!result.auth.user?.isActive||!['owner','admin'].includes(result.auth.role))return{ok:false as const,response:reply({error:'CRM-Admin-Konto erforderlich'},403)};
 return{ok:true as const,auth:result.auth};
}
export async function GET(req:NextRequest){
 const gate=secured(await authorize('sales.read'));if(!gate.ok)return gate.response;
 const brand=req.nextUrl.searchParams.get('brand');if(!templateBrand(brand))return reply({error:'Ungültige Vorlage'},400);
 const sql=await db();if(!sql)return reply({error:'Datenbank nicht verfügbar'},503);
 const rows=await sql`SELECT id,template_brand,version,state,content,created_by,approved_by,created_at,submitted_at,activated_at
   FROM sales_offer_template_versions WHERE template_brand=${brand} ORDER BY version DESC LIMIT 30`;
 return reply({brand,versions:rows,active:rows.find(x=>x.state==='active')||null,defaults:INITIAL_TEMPLATES[brand]});
}
export async function POST(req:NextRequest){
 const gate=secured(await authorize('sales.manage'));if(!gate.ok)return gate.response;
 if(!originOK(req))return reply({error:'Origin nicht erlaubt'},403);
 if(Number(req.headers.get('content-length')||0)>20000)return reply({error:'Anfrage zu groß'},413);
 let body:Record<string,unknown>;try{const x:unknown=await req.json();if(!x||typeof x!=='object'||Array.isArray(x))throw Error();body=x as Record<string,unknown>;}catch{return reply({error:'Ungültige Daten'},400);}
 if(JSON.stringify(body).length>20000)return reply({error:'Anfrage zu groß'},413);
 const {brand,action}=body;if(!templateBrand(brand))return reply({error:'Ungültige Vorlage'},400);
 const sql=await db();if(!sql)return reply({error:'Datenbank nicht verfügbar'},503);
 try{
  if(action==='save'){
   const content=validateTemplate(body.content);
   const version=await sql.begin(async tx=>{
    await tx`SELECT pg_advisory_xact_lock(hashtext(${`offer-template:${brand}`}))`;
    const [v]=await tx<{last:number}[]>`SELECT COALESCE(MAX(version),0)::int AS last FROM sales_offer_template_versions WHERE template_brand=${brand}`;
    const id=`tmpl_${randomUUID()}`;await tx`INSERT INTO sales_offer_template_versions(id,template_brand,version,state,content,created_by)
      VALUES(${id},${brand},${v.last+1},'draft',${tx.json(content)},${gate.auth.userId})`;
    return{id,version:v.last+1};
   });return reply({ok:true,version},201);
  }
  const id=body.versionId;if(typeof id!=='string'||!/^tmpl_[a-f0-9-]{36}$/.test(id))return reply({error:'Versions-ID ungültig'},400);
  if(action==='submit'){
   const rows=await sql`UPDATE sales_offer_template_versions SET state='pending',submitted_at=NOW()
     WHERE id=${id} AND template_brand=${brand} AND created_by=${gate.auth.userId} AND state='draft' RETURNING id`;
   return rows.length?reply({ok:true}):reply({error:'Nur eigene Entwürfe können eingereicht werden'},409);
  }
  if(action==='reject'){
   const a=secured(await authorize('sales.proposal.approve'));if(!a.ok)return a.response;
   const rows=await sql`UPDATE sales_offer_template_versions SET state='rejected'
     WHERE id=${id} AND template_brand=${brand} AND state='pending' AND created_by<>${a.auth.userId} RETURNING id`;
   return rows.length?reply({ok:true}):reply({error:'Andere freigabeberechtigte Person nötig'},409);
  }
  if(action==='approve'){
   const a=secured(await authorize('sales.proposal.approve'));if(!a.ok)return a.response;
   const ok=await sql.begin(async tx=>{
    await tx`SELECT pg_advisory_xact_lock(hashtext(${`offer-template:${brand}`}))`;
    const [v]=await tx<{id:string;created_by:string;state:string;content:unknown}[]>`SELECT id,created_by,state,content FROM sales_offer_template_versions
      WHERE id=${id} AND template_brand=${brand} FOR UPDATE`;
    if(!v||v.state!=='pending'||v.created_by===a.auth.userId)return false;
    validateTemplate(v.content);
    await tx`UPDATE sales_offer_template_versions SET state='superseded' WHERE template_brand=${brand} AND state='active'`;
    await tx`UPDATE sales_offer_template_versions SET state='active',approved_by=${a.auth.userId},activated_at=NOW() WHERE id=${id}`;
    return true;
   });return ok?reply({ok:true}):reply({error:'Freigabe durch zweite Person erforderlich'},409);
  }
  return reply({error:'Unbekannte Aktion'},400);
 }catch(e){
  if(e instanceof Error&&/ungültig|fehlt|lang|Vorlage|Feld|Liste/i.test(e.message))return reply({error:e.message},400);
  console.error('[offer templates] operation failed');return reply({error:'Vorlagenoperation nicht verfügbar'},503);
 }
}
