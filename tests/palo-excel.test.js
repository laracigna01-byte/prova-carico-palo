import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {buildPaloExcel} from '../src/excel/paloExcel.js';
import {calcPalo} from '../src/utils/calculations.js';
import {LOAD_STEPS, initialReadings} from '../src/config/testConfig.js';

const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+XKk64QAAAABJRU5ErkJggg==';

function fakeCanvas(){
 const noop=()=>{};
 const context=new Proxy({},{get(target,key){return target[key]??noop},set(target,key,value){target[key]=value;return true}});
 return {width:1,height:1,getContext:()=>context,toDataURL:()=>png};
}

test('il certificato Excel contiene 31 gradini, una pagina A4 e le due immagini tecniche',async()=>{
 const originalDocument=globalThis.document,originalFetch=globalThis.fetch;
 globalThis.document={createElement:tag=>{assert.equal(tag,'canvas');return fakeCanvas()}};
 globalThis.fetch=async()=>({ok:false});
 try{
  const data={reportId:'PAL-2026-009',pileId:'PALO 15',cantiere:'PONTE MINISSALE',localita:'SS 114',tecnico:'Tecnico di prova',exerciseLoad:267,testLoad:400.5,jackCapacityTon:100,pressureReferenceBar:700,tonToKn:9.81};
  const readings=initialReadings();
  readings.e0.c1[0]=10;readings.e0.c2[0]=10;
  readings.e25a.c1[0]=9.83;readings.e25a.c2[0]=9.90;
  const result=calcPalo({readings,loadSteps:LOAD_STEPS,...data});
  const book=await buildPaloExcel({data,result,photo:[],office:{numeroDocumento:'145000',tipoDocumento:'CERTIFICATO DI PROVA',nomeDirettoreLaboratorio:'Direttore'}});
  assert.deepEqual(book.worksheets.map(w=>w.name),['CERTIFICATO','LETTURE','LETTURE ORIGINALI']);
  const page=book.getWorksheet('CERTIFICATO');
  assert.equal(page.pageSetup.paperSize,9);
  assert.equal(page.pageSetup.orientation,'portrait');
  assert.equal(page.pageSetup.fitToWidth,1);
  assert.equal(page.pageSetup.fitToHeight,1);
  assert.equal(page.pageSetup.printArea,'A1:AN61');
  assert.equal(page.getImages().length,2);
  assert.match(page.getCell('B15').value,/CERTIFICATO DI PROVA/);
  assert.match(page.getCell('G1').value,/L A B O R A T O R I O/);
  assert.equal(book.getWorksheet('LETTURE').rowCount,32);
  assert.equal(book.getWorksheet('LETTURE ORIGINALI').rowCount,94);
  const buf=await book.xlsx.writeBuffer();
  assert.ok(buf.byteLength>2000,'La cartella Excel deve essere esportabile');
  const reloaded=new ExcelJS.Workbook();
  await reloaded.xlsx.load(buf);
  assert.equal(reloaded.getWorksheet('CERTIFICATO').getImages().length,2);
  assert.equal(reloaded.getWorksheet('LETTURE').getRow(3).getCell(6).value,66.75);
  assert.equal(reloaded.getWorksheet('LETTURE').getRow(3).getCell(10).value,0.135);
 }finally{
  globalThis.document=originalDocument;
  globalThis.fetch=originalFetch;
 }
});
