import {useMemo,useState} from 'react';
import {LOAD_STEPS} from '../config/testConfig';
import {calcPalo} from '../utils/calculations';
import {exportPaloExcel} from '../excel/paloExcel';
const fields=[
 ['numeroDocumento','Numero certificato'],['dataDocumento','Data certificato'],
 ['naturaCampioni','Natura dei campioni'],['protocollo','Protocollo'],
 ['dataProtocollo','Data protocollo'],['verbaleAccettazione','Verbale accettazione'],
 ['dataAccettazione','Data accettazione'],['consegnaLaboratorio','Consegna in laboratorio'],
 ['oggettoLavori','Oggetto dei lavori'],['localita','Ubicazione cantiere'],
 ['richiedente','Richiedente'],['direzioneLavori','Direttore dei lavori'],
 ['impresa','Impresa'],['proprietario','Proprietario / Ente appaltante'],
 ['collaudatore','Collaudatore'],['tecnico','Tecnico esecutore'],
 ['letteraRichiesta','Lettera di richiesta'],['nomeSperimentatore','Nome sperimentatore'],
 ['nomeDirettoreLaboratorio','Direttore laboratorio']
];
const key=id=>'dismat-palo-elaborazioni-v1:'+id;
function load(id){
 try{const parsed=JSON.parse(localStorage.getItem(key(id))||'{}');return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{}}catch{return {}}
}
const defaults=(data={})=>({
 dataProva:data.dataProva||'',naturaCampioni:'Palo',
 localita:data.localita||'',richiedente:data.committente||'',
 direzioneLavori:data.direzioneLavori||'',impresa:data.impresa||'',
 tecnico:data.tecnico||'',nomeSperimentatore:data.tecnico||''
});
export function PaloElaborazioni({archive,current,onClose}){
 const choices=useMemo(()=>[
   {id:'__current',data:current.data,readings:current.readings,photos:current.photo},
   ...archive.map(item=>({id:item.id,data:item.data,readings:item.readings,photos:item.photos||item.photo}))
 ],[archive,current]);
 const [id,setId]=useState('__current');
 const selected=choices.find(x=>x.id===id)||choices[0];
 const [office,setOffice]=useState(()=>({...defaults(selected.data),...load(id)}));
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const calculated=useMemo(()=>{
   const d=selected.data||{};
   return calcPalo({readings:selected.readings,loadSteps:LOAD_STEPS,
    exerciseLoad:d.exerciseLoad,testLoad:d.testLoad,jackCapacityTon:d.jackCapacityTon,
    pressureReferenceBar:d.pressureReferenceBar,tonToKn:d.tonToKn});
 },[selected]);
 function choose(next){
   const record=choices.find(x=>x.id===next);
   if(!record)return;
   setId(next);setOffice({...defaults(record.data),...load(next)});setStatus('');
 }
 function save(){localStorage.setItem(key(id),JSON.stringify(office));setStatus('Dati ufficio salvati su questo dispositivo; archivio cantiere invariato.')}
 async function generate(){
   if(!selected?.data)return;
   setBusy(true);setStatus('');
   try{
     localStorage.setItem(key(id),JSON.stringify(office));
     await exportPaloExcel({data:selected.data,result:calculated,photo:selected.photos,office});
     setStatus('Certificato Excel generato. Controllare l’anteprima di stampa A4 prima dell’emissione.');
   }catch(error){setStatus('Esportazione non riuscita: '+error.message)}
   finally{setBusy(false)}
 }
 return <section className="palo-office" style={{padding:'22px',maxWidth:1140,margin:'auto'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
     <div><h1>Elaborazioni · Palo</h1><p>Copia ufficio per certificato Excel A4. Le prove e i PDF originali non vengono modificati.</p></div>
     <button type="button" onClick={onClose}>Torna alla prova</button>
   </div>
   <div style={{background:'var(--panel, #242424)',padding:18,borderRadius:10,marginBottom:16}}>
     <label>Seleziona prova da elaborare
       <select value={id} onChange={e=>choose(e.target.value)} style={{display:'block',width:'100%',padding:10,marginTop:8}}>
         {choices.map((item,i)=><option key={item.id||i} value={item.id}>{item.id==='__current'?'Prova aperta (non necessariamente salvata)':item.id} · {item.data?.pileId||'Palo'} · {item.data?.cantiere||''}</option>)}
       </select>
     </label>
     <p>{calculated.rows.length} gradini di carico/scarico · {selected.data?.pileId||'Palo senza identificativo'} · grafico e prima fotografia inclusi nell'A4</p>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:14}}>
     {fields.map(([name,label])=><label key={name} style={{display:'flex',flexDirection:'column',gap:6}}>
       <span>{label}</span><input style={{padding:10,width:'100%',boxSizing:'border-box'}} type="text"
       value={office[name]??''} onChange={e=>setOffice(p=>({...p,[name]:e.target.value}))}/>
     </label>)}
   </div>
   <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:22}}>
     <button type="button" onClick={save} disabled={busy}>Salva elaborazione</button>
     <button type="button" onClick={generate} disabled={busy}>{busy?'Genero Excel...':'Genera certificato Excel A4'}</button>
   </div>
   {status&&<p role="status" style={{marginTop:12}}>{status}</p>}
   <p style={{marginTop:14,fontSize:13}}>Il primo foglio contiene intestazione compilabile, tabella completa a sinistra, grafico e fotografia a destra. I fogli successivi conservano letture e risultati per verifica. Nessuna firma viene inventata.</p>
 </section>;
}
