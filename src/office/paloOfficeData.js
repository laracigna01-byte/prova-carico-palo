// Copie ufficio: importazione di archivi e singole prove Palo senza scrivere nell'archivio cantiere.
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export const signature=record=>JSON.stringify([record.id||record.data?.reportId||'',record.savedAt||'',record.data||{},record.readings||{}]);
export function toOfficeRecord(record,sourceName='Archivio cantiere'){
 if(!object(record)||!object(record.data)||!object(record.readings))throw new Error('La prova Palo non contiene dati e letture validi.');
 const id=String(record.id||record.data.reportId||'prova').trim();
 const photos=Array.isArray(record.photos)?record.photos:(record.photo?.dataUrl?[record.photo]:[]);
 return {
  id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'palo-office-'+Date.now()+'-'+Math.random().toString(36).slice(2),
  originalId:id,sourceName,importedAt:new Date().toISOString(),
  fingerprint:signature(record),
  data:structuredClone(record.data),
  readings:structuredClone(record.readings),
  photos:structuredClone(photos),
  office:{}
 };
}
export function parsePaloOfficeJson(input,name='Archivio Palo.json'){
 let data;
 try{data=JSON.parse(String(input??'').replace(/^\uFEFF/,'').trim())}
 catch{throw new Error('Il file non contiene un JSON leggibile. Importa un backup esportato dall’app Palo.')}
 if(data?.format&&data.format!=='dismat-pali-archive')throw new Error('Il file appartiene a un altro tipo di prova.');
 if(data?.format==='dismat-pali-archive'&&data.version!==1)throw new Error('Versione del backup Palo non supportata.');
 const list=Array.isArray(data)?data:Array.isArray(data?.tests)?data.tests:Array.isArray(data?.records)?data.records:[data];
 const records=[],problems=[];
 for(const [i,r] of list.entries()){
  try{records.push(toOfficeRecord(r,name))}
  catch(e){problems.push('Prova '+(i+1)+': '+e.message)}
 }
 if(!records.length)throw new Error('Nessuna prova Palo utilizzabile. '+problems.slice(0,2).join(' | '));
 return {records,ignored:problems.length,problems};
}
