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

test('il certificato Excel contiene 31 gradini, una pagina A4 e grafico/foto separati',async()=>{
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
  assert.equal(page.getImages().length,3);
  const embeds=page.getImages();
  assert.equal(embeds[1].range.ext.width,410,'Il grafico deve sfruttare la larghezza disponibile');
  assert.ok(Math.abs(embeds[1].range.ext.width/embeds[1].range.ext.height-(1200/740))<0.015,
    'L immagine del grafico non puo essere deformata');
  assert.ok(Math.abs(embeds[2].range.ext.width/embeds[2].range.ext.height-(1200/860))<0.015,
    'La fotografia deve mantenere le proprie proporzioni');
  assert.match(page.getCell('B15').value,/CERTIFICATO DI PROVA/);
  assert.match(page.getCell('G1').value,/L A B O R A T O R I O/);
  assert.equal(page.getCell('AA4').value,null,'La consegna in laboratorio deve essere eliminata');
  assert.equal(page.getCell('O5').alignment.wrapText,true,'L oggetto dei lavori deve andare a capo');
  assert.ok(page.getRow(5).height>=30);
  assert.equal(book.getWorksheet('LETTURE').rowCount,32);
  assert.equal(book.getWorksheet('LETTURE ORIGINALI').rowCount,94);
  const buf=await book.xlsx.writeBuffer();
  assert.ok(buf.byteLength>2000,'La cartella Excel deve essere esportabile');
  const reloaded=new ExcelJS.Workbook();
  await reloaded.xlsx.load(buf);
  assert.equal(reloaded.getWorksheet('CERTIFICATO').getImages().length,3);
  assert.equal(reloaded.getWorksheet('CERTIFICATO').getCell('V59').value,'Dott. Ing. Elio Lo Giudice');
  assert.equal(reloaded.getWorksheet('LETTURE').getRow(3).getCell(6).value,66.75);
  assert.equal(reloaded.getWorksheet('LETTURE').getRow(3).getCell(10).value,0.135);
  // Firma touchpad PNG importata dalla prova: e un'immagine in piu,
  // non altera tabella, grafico, foto, blocco firme, ne la prova originale.
  const signed=await buildPaloExcel({data:{...data,signature:png},result,photo:[],
    office:{numeroDocumento:'145000',tipoDocumento:'CERTIFICATO DI PROVA'}});
  const signedPage=signed.getWorksheet('CERTIFICATO');
  const imagesSigned=signedPage.getImages();
  assert.equal(imagesSigned.length,4,'La firma e la quarta immagine, senza sostituire le tre immagini tecniche');
  assert.equal(imagesSigned[0].range.br.nativeRow,55,'La tabella non si deve spostare');
  assert.equal(imagesSigned[1].range.ext.width,410,'Il grafico non cambia larghezza');
  assert.equal(imagesSigned[3].range.tl.nativeCol,7);
  assert.equal(imagesSigned[3].range.tl.nativeRow,55);
  assert.equal(imagesSigned[3].range.ext.width,170);
  assert.equal(imagesSigned[3].range.ext.height,Math.round(170*180/700));
  assert.equal(signedPage.getCell('B58').value,'Lo Sperimentatore');
  assert.equal(signedPage.getCell('B59').value,'Tecnico di prova');
  assert.equal(signedPage.getCell('V58').value,'Il Direttore del Laboratorio');
  assert.equal(signedPage.getCell('V59').value,'Dott. Ing. Elio Lo Giudice');
  assert.equal(signedPage.pageSetup.printArea,'A1:AN61');
  assert.equal(data.signature,undefined,'La firma non viene scritta sui dati sorgente');
  const signedBuffer=await signed.xlsx.writeBuffer();
  const signedReloaded=new ExcelJS.Workbook();
  await signedReloaded.xlsx.load(signedBuffer);
  assert.equal(signedReloaded.getWorksheet('CERTIFICATO').getImages().length,4,
    'Firma autografa incorporata anche nel file XLSX esportato');
  const alt=await buildPaloExcel({data:{...data,proprietario:'Ente originale'},result,photo:[],
    office:{numeroDocumento:'145000',tipoDocumento:'CERTIFICATO DI PROVA',
      ruoloFirmatarioLaboratorio:'vice',mostraProprietario:true,proprietario:'Ente ufficio'}});
  const altPage=alt.getWorksheet('CERTIFICATO');
  assert.equal(altPage.getCell('B8').value,'Direttore dei lavori');
  assert.equal(altPage.getCell('V58').value,'Il Vicedirettore del Laboratorio');
  assert.equal(page.getCell('V58').value,'Il Direttore del Laboratorio');
  assert.equal(page.getCell('V59').value,'Dott. Ing. Elio Lo Giudice');
  assert.equal(altPage.getCell('V59').value,'Dott. Ing Giuseppe Navarra');
  assert.equal(altPage.getCell('B10').value,'Proprietario / Ente appaltante');
  assert.equal(altPage.getCell('O10').value,'Ente ufficio');
  assert.equal(page.getCell('B10').value,'Direttore di stabilimento/produzione');
 }finally{
  globalThis.document=originalDocument;
  globalThis.fetch=originalFetch;
 }
});
