import test from 'node:test';
import assert from 'node:assert/strict';
import {certificateRows,direzioneLabel} from '../src/office/paloCertificateFields.js';

test('il ruolo di direzione lavori cambia solo la qualifica in stampa',()=>{
 const data={direzioneLavori:'Ing. Rossi',proprietario:'Ente pubblico',tecnico:'Ing. Bianchi'};
 const dirs=certificateRows(data,{ruoloDirezioneLavori:'direttore'});
 const vice=certificateRows(data,{ruoloDirezioneLavori:'vice'});
 assert.ok(dirs.some(r=>r.label==='Direttore dei lavori'&&r.value==='Ing. Rossi'));
 assert.ok(vice.some(r=>r.label==='Vicedirettore dei lavori'&&r.value==='Ing. Rossi'));
 assert.equal(direzioneLabel({ruoloDirezioneLavori:'vice'}),'Vicedirettore dei lavori');
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
