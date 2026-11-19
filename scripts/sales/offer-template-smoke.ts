import { strict as assert } from 'node:assert';
import { INITIAL_TEMPLATES, validateTemplate } from '@/lib/sales/offerTemplates';
import { offerStructured, validateCommercial } from '@/lib/sales/offerCompose';
import { renderProposalPdf } from '@/lib/sales/proposalPdf';
async function main(){
 for(const brand of ['nexcel','agiworks'] as const){
  const commercial=validateCommercial({brand,customer:'Beispiel GmbH',title:'Testangebot',scope:'Testprojekt',deliverables:['Modul A'],netCents:900000,vatRate:.19,annualMaintenanceNetCents:0,validUntil:'2027-01-10'});
  const document=offerStructured(commercial,validateTemplate(INITIAL_TEMPLATES.shared),validateTemplate(INITIAL_TEMPLATES[brand]));
  assert.equal(document.investition?.summeEinmalig?.includes('10.710'),true,'gross amount must include calculated VAT');
  assert.equal(document.brandContext,brand);
  const pdf=await renderProposalPdf({brand,structured:document,watermark:'TEST – NICHT SENDEN'});
  assert.equal(Buffer.from(pdf.subarray(0,5)).toString('ascii'),'%PDF-');
 }
 assert.throws(()=>validateCommercial({brand:'nexcel',customer:'X',title:'T',scope:'S',deliverables:[],netCents:0,vatRate:0,annualMaintenanceNetCents:0,validUntil:'2027-01-10'}));
 assert.throws(()=>validateTemplate({heading:'',introduction:'x'}));
 console.log('OFFER_TEMPLATE_SMOKE_OK: pdf nexcel + agiworks, VAT, invalid inputs');
}
main().catch(e=>{console.error(e);process.exit(1)});
