import test from 'node:test';
import assert from 'node:assert/strict';
import {certificateRows,firmaLaboratorioLabel,firmaLaboratorioNome,latestLaboratoryData,LABORATORY_SHARED_KEYS} from '../src/office/paloCertificateFields.js';

test('Direttore dei lavori resta sempre nei dati generali, anche se firma il vice in fondo',()=>{
 const data={direzioneLavori:'Ing. Rossi',proprietario:'Ente pubblico',tecnico:'Ing. Bianchi'};
 for(const role of ['direttore','vice']){
   const rows=certificateRows(data,{ruoloFirmatarioLaboratorio:role});
   assert.ok(rows.some(r=>r.label==='Direttore dei lavori'&&r.value==='Ing. Rossi'));
   assert.equal(rows.some(r=>r.label==='Vicedirettore dei lavori'),false);
 }
 assert.equal(firmaLaboratorioLabel({ruoloFirmatarioLaboratorio:'direttore'}),'Il Direttore del Laboratorio');
 assert.equal(firmaLaboratorioLabel({ruoloFirmatarioLaboratorio:'vice'}),'Il Vicedirettore del Laboratorio');
 assert.equal(firmaLaboratorioLabel({ruoloDirezioneLavori:'vice'}),'Il Vicedirettore del Laboratorio');
 assert.equal(firmaLaboratorioNome({ruoloFirmatarioLaboratorio:'direttore'}),'Dott. Ing. Elio Lo Giudice');
 assert.equal(firmaLaboratorioNome({ruoloFirmatarioLaboratorio:'vice'}),'Dott. Ing Giuseppe Navarra');
 assert.equal(firmaLaboratorioNome({ruoloFirmatarioLaboratorio:'vice',nomeDirettoreLaboratorio:'vecchio firmatario'}),'Dott. Ing Giuseppe Navarra');
});

test('proprietario ente appaltante compare solo se spuntato, senza perdere il dato originale',()=>{
 const data={proprietario:'ANAS SPA',committente:'ANAS SPA'};
 const no=certificateRows(data,{mostraProprietario:false});
 const yes=certificateRows(data,{mostraProprietario:true});
 assert.equal(no.some(r=>r.key==='proprietario'),false);
 assert.deepEqual(yes.find(r=>r.key==='proprietario'),{key:'proprietario',label:'Proprietario / Ente appaltante',value:'ANAS SPA'});
 assert.equal(data.proprietario,'ANAS SPA');
});

test('le righe da eliminare non vengono esportate',()=>{
 const fields=certificateRows({},{});
 assert.equal(fields.some(x=>/lettera di richiesta|collaudatore|consegna (in )?laboratorio/i.test(x.label)),false);
 assert.equal(fields.length,7);
});

test('duplica dati laboratorio fra pali senza copiare numeri, letture e fotografie',()=>{
 const source={id:'a',officeSavedAt:'2026-11-24T09:00:00Z',
   data:{pileId:'PALO 15',direzioneLavori:'Ing. Rossi',readings:{c1:[1]}},
   office:{oggettoLavori:'Ponte',richiedente:'ANAS',mostraProprietario:true,
     proprietario:'Ente',ruoloFirmatarioLaboratorio:'vice',numeroDocumento:'12345',
     protocollo:'PROTO',nomeDirettoreLaboratorio:'da non copiare',photo:[{dataUrl:'x'}]}};
 const target={id:'b',data:{pileId:'PALO 49',readings:{c1:[2]}}};
 const result=latestLaboratoryData([target,source],'b');
 assert.equal(result.source.id,'a');
 assert.deepEqual(result.values,{
   oggettoLavori:'Ponte',richiedente:'ANAS',direzioneLavori:'Ing. Rossi',
   proprietario:'Ente',mostraProprietario:true,ruoloFirmatarioLaboratorio:'vice'
 });
 for(const key of ['readings','photo','numeroDocumento','dataDocumento','protocollo','pileId','c1','loadSteps'])
   assert.equal(LABORATORY_SHARED_KEYS.includes(key),false);
 assert.equal(target.data.pileId,'PALO 49');
});
