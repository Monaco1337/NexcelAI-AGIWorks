import {NextRequest,NextResponse} from 'next/server';
import {authorize} from '@/lib/auth/authorize';
import {renderProposalPdf} from '@/lib/sales/proposalPdf';
import {offerStructured,validateCommercial} from '@/lib/sales/offerCompose';
import {validateTemplate} from '@/lib/sales/offerTemplates';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 const gate=await authorize('sales.read');if(!gate.ok)return gate.response;
 if(!gate.auth.user?.isActive||!['owner','admin'].includes(gate.auth.role))return NextResponse.json({error:'CRM-Admin-Konto erforderlich'},{status:403});
 if(req.headers.get('origin')!==req.nextUrl.origin||req.headers.get('sec-fetch-site')==='cross-site')return NextResponse.json({error:'Origin nicht erlaubt'},{status:403});
 if(Number(req.headers.get('content-length')||0)>30000)return NextResponse.json({error:'Zu große Anfrage'},{status:413});
 try{
  const body=await req.json();
  const commercial=validateCommercial(body.commercial);
  const shared=validateTemplate(body.shared),brand=validateTemplate(body.brand);
  const bytes=await renderProposalPdf({brand:commercial.brand,structured:offerStructured(commercial,shared,brand),watermark:'ENTWURF – NICHT VERSENDEN'});
  return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="angebotsvorschau.pdf"','Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Ungültige Angebotsvorschau'},{status:400});}
}
