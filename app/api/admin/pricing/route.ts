import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authorize, type AuthResult } from '@/lib/auth/authorize';
import { db, jsonParam } from '@/lib/pg';
import { INITIAL_RULES, calculateInternalQuote, validateInput, validateRules, validateRulesForApproval, type Brand } from '@/lib/sales/internalPricing';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const response=(x:object,status=200)=>NextResponse.json(x,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
function isBrand(v:unknown):v is Brand{return v==='nexcel'||v==='agiworks';}
function sameOrigin(req:NextRequest):boolean{
  const origin=req.headers.get('origin');
  const site=req.headers.get('sec-fetch-site');
  return typeof origin==='string'&&origin===req.nextUrl.origin&&site!=='cross-site';
}
function gate(result:AuthResult){
  if(!result.ok)return {ok:false as const,response:result.response};
  if((result.auth.role!=='owner'&&result.auth.role!=='admin')||!result.auth.user?.isActive)return {ok:false as const,response:response({error:'Nur aktive Inhaber/Administratoren'},403)};
  return {ok:true as const,auth:result.auth};
}
export async function GET(req:NextRequest){
  const auth=gate(await authorize('sales.read'));if(!auth.ok)return auth.response;
  const brand=req.nextUrl.searchParams.get('brand');if(!isBrand(brand))return response({error:'Marke ungültig'},400);
  const sql=await db();if(!sql)return response({error:'Datenbank nicht verfügbar'},503);
  const rows=await sql`SELECT id,brand,version,state,rules,created_by,approved_by,created_at,submitted_at,activated_at
    FROM internal_pricing_versions WHERE brand=${brand} ORDER BY version DESC LIMIT 30`;
  const active=rows.find((r)=>r.state==='active');
  return response({brand,versions:rows,active:active??null,defaults:INITIAL_RULES,configured:!!active});
}
export async function POST(req:NextRequest){
  const auth=gate(await authorize('billing.manage'));if(!auth.ok)return auth.response;
  if(!sameOrigin(req))return response({error:'Origin nicht erlaubt'},403);
  const contentLength=Number(req.headers.get('content-length')||0);
  if(contentLength>35000)return response({error:'Anfrage zu groß'},413);
  let body:Record<string,unknown>;
  try{const value:unknown=await req.json();if(!value||typeof value!=='object'||Array.isArray(value))throw Error();body=value as Record<string,unknown>;}catch{return response({error:'Ungültiges JSON'},400);}
  if(JSON.stringify(body).length>35000)return response({error:'Anfrage zu groß'},413);
  const brand=body.brand,action=body.action;
  if(!isBrand(brand))return response({error:'Marke ungültig'},400);
  const sql=await db();if(!sql)return response({error:'Datenbank nicht verfügbar'},503);
  try{
    if(action==='preview'){
      const rules=validateRules(body.rules);
      const input=validateInput(body.selection);
      return response({quote:calculateInternalQuote(input,rules)});
    }
    if(action==='save'){
      const rules=validateRules(body.rules);
      const value=await sql.begin(async tx=>{
        await tx`SELECT pg_advisory_xact_lock(hashtext(${`internal_pricing:${brand}`}))`;
        const [row]=await tx<{last:number}[]>`SELECT COALESCE(MAX(version),0)::int AS last FROM internal_pricing_versions WHERE brand=${brand}`;
        const id=`price_${randomUUID()}`,version=row.last+1;
        await tx`INSERT INTO internal_pricing_versions(id,brand,version,state,rules,created_by)
          VALUES(${id},${brand},${version},'draft',${tx.json(jsonParam(rules))},${auth.auth.userId})`;
        return {id,version};
      });
      return response({ok:true,version:value},201);
    }
    const versionId=body.versionId;
    if(typeof versionId!=='string'||!/^price_[a-f0-9-]{36}$/.test(versionId))return response({error:'Version ungültig'},400);
    if(action==='submit'){
      const rows=await sql<{id:string}[]>`UPDATE internal_pricing_versions SET state='pending',submitted_at=NOW()
        WHERE id=${versionId} AND brand=${brand} AND state='draft' AND created_by=${auth.auth.userId} RETURNING id`;
      return rows.length?response({ok:true}):response({error:'Entwurf geändert, fremd oder nicht vorhanden'},409);
    }
    if(action==='reject'){
      const rows=await sql<{id:string}[]>`UPDATE internal_pricing_versions SET state='rejected'
        WHERE id=${versionId} AND brand=${brand} AND state='pending' AND created_by<>${auth.auth.userId} RETURNING id`;
      return rows.length?response({ok:true}):response({error:'Freigabe durch zweite Person erforderlich'},409);
    }
    if(action==='approve'){
      const activated=await sql.begin(async tx=>{
        await tx`SELECT pg_advisory_xact_lock(hashtext(${`internal_pricing:${brand}`}))`;
        const [row]=await tx<{id:string;created_by:string;state:string;rules:unknown}[]>`SELECT id,created_by,state,rules FROM internal_pricing_versions WHERE id=${versionId} AND brand=${brand} FOR UPDATE`;
        if(!row||row.state!=='pending'||row.created_by===auth.auth.userId)return false;
        validateRulesForApproval(row.rules);
        await tx`UPDATE internal_pricing_versions SET state='superseded' WHERE brand=${brand} AND state='active'`;
        await tx`UPDATE internal_pricing_versions SET state='active',approved_by=${auth.auth.userId},activated_at=NOW() WHERE id=${versionId}`;
        return true;
      });
      return activated?response({ok:true}):response({error:'Andere berechtigte Person muss freigeben'},409);
    }
    if(action==='saveQuote'){
      const [active]=await sql<{id:string;rules:unknown}[]>`SELECT id,rules FROM internal_pricing_versions WHERE brand=${brand} AND state='active'`;
      if(!active)return response({error:'Kein gemeinsam freigegebener Preisstand vorhanden'},409);
      const label=typeof body.customerLabel==='string'?body.customerLabel.trim():'';
      const notes=typeof body.notes==='string'?body.notes.trim():'';
      if(label.length<2||label.length>160||notes.length>2000)return response({error:'Kundennamen/Notizen prüfen'},400);
      const selection=validateInput(body.selection);
      const sourceType=body.sourceType===null||body.sourceType===undefined?null:body.sourceType;
      const sourceId=body.sourceId===null||body.sourceId===undefined?null:body.sourceId;
      if(sourceType!==null && sourceType!=='booking' && sourceType!=='lead') return response({error:'Kundenquelle ungültig'},400);
      if((sourceType===null)!==(sourceId===null) || (sourceId!==null && (typeof sourceId!=='string'||sourceId.length>150))) return response({error:'Kundenreferenz ungültig'},400);
      if(sourceType==='booking'){
        const rows=await sql<{id:string;name:string;company:string|null}[]>`SELECT id,name,company FROM consultation_bookings WHERE id=${sourceId as string} AND brand=${brand} AND status IN ('pending','confirmed') LIMIT 1`;
        if(!rows.length || (rows[0].company?.trim()||rows[0].name).toLocaleLowerCase('de-DE')!==label.toLocaleLowerCase('de-DE'))return response({error:'Termin/Kundenzuordnung nicht konsistent'},409);
      }
      if(sourceType==='lead'){
        const rows=await sql<{id:string;name:string;company:string|null}[]>`SELECT id,name,company FROM marketing_inbound_leads WHERE id=${sourceId as string} AND brand=${brand} AND status IN ('new','in_review','accepted') LIMIT 1`;
        if(!rows.length || (rows[0].company?.trim()||rows[0].name).toLocaleLowerCase('de-DE')!==label.toLocaleLowerCase('de-DE'))return response({error:'Lead/Kundenzuordnung nicht konsistent'},409);
      }
      const quote=calculateInternalQuote(selection,validateRules(active.rules));
      const id=`quote_${randomUUID()}`;
      await sql`INSERT INTO internal_pricing_quotes(id,brand,price_version_id,customer_label,notes,selection,calculation,created_by,source_type,source_id)
        VALUES(${id},${brand},${active.id},${label},${notes},${sql.json(jsonParam(selection))},${sql.json(jsonParam(quote))},${auth.auth.userId},${sourceType},${sourceId as string | null})`;
      return response({ok:true,quoteId:id,quote},201);
    }
    return response({error:'Aktion nicht unterstützt'},400);
  }catch(e){
    if(e instanceof Error && /Ungültig|fehlt|ungültig|kein Projekt|Wert|Preisstand unvollständig/.test(e.message))return response({error:e.message},400);
    console.error('[admin pricing] operation failed');return response({error:'Kalkulation konnte nicht verarbeitet werden'},503);
  }
}
