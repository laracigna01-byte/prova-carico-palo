import test from 'node:test';
import assert from 'node:assert/strict';
import {calcPalo} from '../src/utils/calculations.js';
import {LOAD_STEPS,initialReadings} from '../src/config/testConfig.js';
import {parsePaloOfficeJson,toOfficeRecord} from '../src/office/paloOfficeData.js';

const project={exerciseLoad:267,testLoad:400.5,jackCapacityTon:100,tonToKn:9.81,pressureReferenceBar:700};
const readings=initialReadings();
readings.e0.c1[0]='10';readings.e0.c2[0]='10';
readings.e25a.c1[0]='9.90';readings.e25a.c1[1]='9.83';
readings.e25a.c2[0]='9.90';

test('i 31 gradini e le pressioni del Palo restano invariati',()=>{
 const r=calcPalo({...project,readings,loadSteps:LOAD_STEPS});
 assert.equal(r.rows.length,31);
 assert.equal(r.rows[1].load,66.75);
 assert.equal(r.rows[1].pressure,47.63);
 assert.equal(r.maxTestLoad,400.5);
 assert.equal(r.rows[24].load,400.5);
});

test('comparatore mancante non diventa zero e resta lultima lettura valida',()=>{
 const r=calcPalo({...project,readings,loadSteps:LOAD_STEPS});
 assert.equal(r.rows[1].comparatorValues.c1,0.17);
 assert.equal(r.rows[1].comparatorValues.c2,0.1);
 assert.equal(r.rows[1].comparatorValues.c3,null);
 assert.equal(r.rows[1].meanSettlement,0.135);
 assert.equal(r.rows[1].readings.c1.length,9);
});

test('il backup JSON Palo si importa come copia autonoma',()=>{
 const original={id:'PAL-2026-009',data:{...project,pileId:'PALO 15'},readings,photos:[{dataUrl:'data:image/png;base64,AA=='}]};
 const archive={format:'dismat-pali-archive',version:1,tests:[original]};
 const {records,ignored}=parsePaloOfficeJson(JSON.stringify(archive),'backup.json');
 assert.equal(records.length,1);
 assert.equal(ignored,0);
 assert.equal(records[0].data.pileId,'PALO 15');
 assert.equal(records[0].photos.length,1);
 records[0].data.pileId='COPIA UFFICIO';
 assert.equal(original.data.pileId,'PALO 15');
 assert.equal(toOfficeRecord(original).originalId,'PAL-2026-009');
});

test('JSON non Palo o incompleto viene rifiutato',()=>{
 assert.throws(()=>parsePaloOfficeJson('{"format":"altro","tests":[]}'),/altro tipo/);
 assert.throws(()=>parsePaloOfficeJson('{"format":"dismat-pali-archive","version":2,"tests":[]}'),/Versione/);
 assert.throws(()=>parsePaloOfficeJson('{"tests":[{"id":"x","data":{}}]}'),/Nessuna prova/);
});
