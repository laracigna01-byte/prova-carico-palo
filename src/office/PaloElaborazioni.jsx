import {useEffect,useMemo,useRef,useState} from 'react';
import {LOAD_STEPS} from '../config/testConfig';
import {calcPalo} from '../utils/calculations';
import {exportPaloExcel} from '../excel/paloExcel';
import {loadOfficeRecords,saveOfficeRecord} from './paloOfficeStore';
import {parsePaloOfficeJson,toOfficeRecord} from './paloOfficeData';
import {firmaLaboratorioLabel,firmaLaboratorioNome,latestLaboratoryData} from './paloCertificateFields';
import './paloOffice.css';

const PROJECT_FIELDS=[
  ['dataProva','Data della prova'],['cantiere','Cantiere'],['pileId','Identificativo palo'],
  ['localita','Ubicazione cantiere'],['committente','Committente'],['direzioneLavori','Direttore dei lavori'],
  ['impresa','Impresa'],['tecnico','Tecnico esecutore']
];
const OFFICE_FIELDS=[
  ['numeroDocumento','Numero documento'],['dataDocumento','Data documento'],
  ['naturaCampioni','Natura dei campioni'],['protocollo','Protocollo'],['dataProtocollo','Data protocollo'],
  ['verbaleAccettazione','Verbale di accettazione nr.'],['dataAccettazione','Data accettazione'],
  ['oggettoLavori','Oggetto dei lavori'],
  ['richiedente','Richiedente'],
  ['direttoreStabilimento','Direttore di stabilimento / produzione'],
  ['nomeSperimentatore','Nome sperimentatore']
];
function defaultOffice(data={}){
  return {naturaCampioni:'PALO',richiedente:data.committente||'',nomeSperimentatore:data.tecnico||''};
}
function documentType(office){
  if(office.modalitaDocumento==='certificato')return 'CERTIFICATO DI PROVA';
  if(office.modalitaDocumento==='rapporto')return 'RAPPORTO DI PROVA';
  const number=String(office.numeroDocumento??'').trim(),threshold=Number(office.sogliaDocumento??135000);
  if(!/^\d+$/.test(number))return 'DA DEFINIRE';
  return Number(number)<(Number.isFinite(threshold)?threshold:135000)?'RAPPORTO DI PROVA':'CERTIFICATO DI PROVA';
}
function calc(data,readings){
  return calcPalo({readings:readings||{},loadSteps:LOAD_STEPS,exerciseLoad:data?.exerciseLoad,
    testLoad:data?.testLoad,jackCapacityTon:data?.jackCapacityTon,
    pressureReferenceBar:data?.pressureReferenceBar,tonToKn:data?.tonToKn});
}
export function PaloElaborazioni({current,onClose}){
  const fileRef=useRef(null);
  const [records,setRecords]=useState([]);
  const [selectedId,setSelectedId]=useState('');
  const [draft,setDraft]=useState({});
  const [dirty,setDirty]=useState(false);
  const [loading,setLoading]=useState(true);
  const [importing,setImporting]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [search,setSearch]=useState('');
  const [showTechnical,setShowTechnical]=useState(false);
  const selected=useMemo(()=>records.find(x=>x.id===selectedId)||null,[records,selectedId]);
  const merged=useMemo(()=>selected?{...defaultOffice(selected.data),...selected.office,...draft}:null,[selected,draft]);
  const result=useMemo(()=>selected?calc(selected.data,selected.readings):null,[selected]);
  const docType=merged?documentType(merged):'DA DEFINIRE';
  const visible=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return records.filter(r=>!q||[r.originalId,r.data?.pileId,r.data?.cantiere,r.data?.committente,r.sourceName]
      .some(value=>String(value??'').toLowerCase().includes(q)));
  },[records,search]);
  useEffect(()=>{
    let active=true;
    loadOfficeRecords().then(list=>{
      if(!active)return;
      setRecords(list);if(list.length)setSelectedId(list[0].id);setLoading(false);
    }).catch(error=>{if(active){setMessage('Archivio ufficio non disponibile: '+error.message);setLoading(false)}});
    return ()=>{active=false};
  },[]);
  function select(r){
    if(dirty&&!window.confirm('Ci sono modifiche ufficio non salvate. Cambiare prova senza salvarle?'))return;
    setSelectedId(r.id);setDraft({});setDirty(false);setMessage('');setShowTechnical(false);
  }
  function edit(name,value){setDraft(prev=>({...prev,[name]:value}));setDirty(true)}
  function reset(name){
    setDraft(prev=>{
      const next={...prev};next[name]=selected?.data?.[name]??defaultOffice(selected?.data)[name]??'';
      return next;
    });
    setDirty(true);
  }
  async function importFileList(files){
    if(!files.length)return;
    if(dirty&&!window.confirm('Ci sono modifiche ufficio non salvate. Importare senza salvare?'))return;
    setImporting(true);setMessage('');
    let added=0,duplicates=0,invalid=0;const errors=[];
    try{
      const previous=await loadOfficeRecords();
      const fingerprints=new Set(previous.map(x=>x.fingerprint));
      const incoming=[];
      for(const file of files){
        try{
          const parsed=parsePaloOfficeJson(await file.text(),file.name);
          invalid+=parsed.ignored;
          errors.push(...parsed.problems.slice(0,2).map(x=>file.name+': '+x));
          for(const rec of parsed.records){
            if(fingerprints.has(rec.fingerprint)){duplicates++;continue}
            await saveOfficeRecord(rec);
            fingerprints.add(rec.fingerprint);incoming.push(rec);added++;
          }
        }catch(error){errors.push(file.name+': '+error.message)}
      }
      const next=[...incoming.reverse(),...previous];
      setRecords(next);
      if(incoming.length){setSelectedId(incoming[0].id);setDraft({});setDirty(false)}
      setMessage(added+' prove importate nell’archivio ufficio; '+duplicates+' già presenti, '+invalid+' record non validi.'
        +(errors.length?' Dettagli: '+errors.slice(0,3).join(' | '):''));
    }catch(error){setMessage('Importazione non riuscita: '+error.message)}
    finally{setImporting(false)}
  }
  async function importCurrent(){
    if(dirty&&!window.confirm('Ci sono modifiche ufficio non salvate. Importare la prova aperta?'))return;
    try{
      const record=toOfficeRecord({
        id:current?.data?.reportId||'prova-aperta',data:current?.data,readings:current?.readings,
        photos:current?.photo
      },'Prova attualmente aperta');
      const previous=await loadOfficeRecords();
      const already=previous.find(p=>p.fingerprint===record.fingerprint);
      if(already){select(already);setMessage('Questa prova è già presente nell’archivio ufficio.');return}
      await saveOfficeRecord(record);
      setRecords([record,...previous]);setSelectedId(record.id);setDraft({});setDirty(false);
      setMessage('Copia della prova aperta importata: i dati del cantiere non sono stati modificati.');
    }catch(error){setMessage('Copia prova non riuscita: '+error.message)}
  }
  function duplicateLaboratoryData(){
    if(!selected)return;
    const reusable=latestLaboratoryData(records,selected.id);
    if(!reusable){
      setMessage('Completa e salva prima una prova in Elaborazioni per riutilizzare i dati di laboratorio.');
      return;
    }
    const from=reusable.source.data?.pileId||reusable.source.originalId||'prova precedente';
    if(!window.confirm('Copiare soltanto i dati comuni di laboratorio dal palo '+from+'? Numeri documento, date, letture e fotografie non saranno copiati.'))return;
    setDraft(prev=>({...prev,...reusable.values}));
    setDirty(true);
    setMessage('Dati di laboratorio copiati da '+from+'. Controlla i campi e salva l’elaborazione.');
  }
  async function save(){
    if(!selected)throw new Error('Seleziona una prova prima di salvare.');
    const next={...selected,office:{...defaultOffice(selected.data),...selected.office,...draft},officeSavedAt:new Date().toISOString()};
    await saveOfficeRecord(next);
    setRecords(prev=>prev.map(x=>x.id===next.id?next:x));
    setDraft({});setDirty(false);
    setMessage('Dati della copia ufficio salvati. JSON e archivio cantiere invariati.');
    return next;
  }
  async function generate(){
    if(!selected||busy)return;
    setBusy(true);setMessage('');
    try{
      const record=dirty?await save():selected;
      const office={...defaultOffice(record.data),...record.office};
      const tipo=documentType(office);
      if(tipo==='DA DEFINIRE')throw new Error('Indica il numero documento o seleziona esplicitamente Rapporto/Certificato.');
      await exportPaloExcel({data:record.data,result:calc(record.data,record.readings),
        photo:record.photos,office:{...office,tipoDocumento:tipo}});
      setMessage('Excel generato: prima dell’emissione controlla l’anteprima di stampa A4.');
    }catch(error){setMessage('Esportazione non riuscita: '+error.message)}
    finally{setBusy(false)}
  }
  return <main className="office-root">
    <header className="office-header">
      <div className="office-brand"><img src="/logo-dismat.jpg" alt="Logo DISMAT"/>
        <div><strong>LABORATORIO DISMAT</strong><span>Elaborazioni Palo · certificati e minute Excel A4</span></div>
      </div>
      <div className="office-header-actions"><button type="button" onClick={()=>{
        if(!dirty||window.confirm('Ci sono modifiche non salvate. Tornare al cantiere?'))onClose();
      }}>Torna all'app Palo</button></div>
    </header>
    <div className="office-layout">
      <aside className="office-sidebar">
        <div className="office-section-caption">AREA UFFICIO · ARCHIVIO SEPARATO</div>
        <h1>Elaborazioni</h1>
        <p>Importa il JSON del cantiere, completa i dati del certificato e genera l’Excel per la stampa.</p>
        <button type="button" className="office-import" disabled={importing||loading} onClick={()=>fileRef.current?.click()}>
          {importing?'Importazione...':'Importa JSON dal cantiere'}
        </button>
        <input ref={fileRef} hidden multiple type="file" accept=".json,.txt,application/json,text/plain"
          onChange={event=>{const files=[...event.target.files];event.target.value='';void importFileList(files)}}/>
        <button type="button" className="office-import-secondary" disabled={importing||loading} onClick={()=>void importCurrent()}>
          Copia la prova attualmente aperta
        </button>
        <label className="office-search-label">Cerca tra le prove importate
          <input type="search" value={search} placeholder="Palo, ID, committente, cantiere…" onChange={event=>setSearch(event.target.value)}/>
        </label>
        <div className="office-record-count">{visible.length} prove nell'archivio ufficio</div>
        <div className="office-records">{loading?<p>Caricamento archivio...</p>:visible.length===0?<p>Nessuna prova importata.</p>:
          visible.map(rec=><button type="button" key={rec.id} className={'office-record '+(rec.id===selectedId?'selected':'')}
            onClick={()=>select(rec)}><strong>{rec.data?.pileId||rec.originalId}</strong><span>{rec.data?.cantiere||'Cantiere non indicato'}</span>
            <small>{rec.originalId} · {rec.officeSavedAt?'Elaborazione salvata':'Da completare'}</small></button>)
        }</div>
      </aside>
      <section className="office-main">
        <div className="office-banner"><span className="office-banner-dot"/>Letture, fotografie e dati di origine vengono conservati in una copia autonoma. Nessuna modifica all'app o all'archivio cantiere.</div>
        {message&&<div className="office-message" role="status">{message}</div>}
        {!selected?<div className="office-empty"><h2>Seleziona o importa una prova Palo</h2><p>Puoi importare un backup JSON dell'archivio o la prova attualmente aperta.</p></div>:<>
          <div className="office-titleline"><div><span className="office-section-caption">ELABORAZIONE DOCUMENTALE</span>
            <h2>{selected.data?.pileId||'Palo'} · {selected.originalId}</h2>
            <p>Origine: {selected.sourceName} · importata il {new Date(selected.importedAt).toLocaleString('it-IT')}</p>
          </div><span className="office-status">{dirty?'Modifiche non salvate':'Copia ufficio'}</span></div>
          <div className="office-card">
            <div className="office-cardhead"><h3>01 · Dati del cantiere</h3><span>Precompilati e modificabili</span></div>
            <div className="office-fields">{PROJECT_FIELDS.map(([key,label])=><label key={key}>{label}
              <div className="office-inputrow"><input type="text" value={draft[key]??selected.office?.[key]??selected.data?.[key]??''}
                onChange={e=>edit(key,e.target.value)}/>
                {Object.prototype.hasOwnProperty.call(draft,key)&&<button type="button" className="office-reset" title="Ripristina valore cantiere" onClick={()=>reset(key)}>↶</button>}
              </div></label>)}</div>
            <div className="office-resultstrip" style={{marginTop:16}}>
              <div><span>Carico di esercizio</span><strong>{result?.baseLoad?.toLocaleString('it-IT')??'—'}</strong><small>kN</small></div>
              <div><span>Carico massimo di collaudo</span><strong>{result?.maxTestLoad?.toLocaleString('it-IT')??'—'}</strong><small>kN</small></div>
              <div><span>Gradini di carico / scarico</span><strong>{result?.rows?.length??0}</strong><small>letture conservate</small></div>
            </div>
          </div>
          <div className="office-card">
            <div className="office-cardhead"><h3>02 · Dati di laboratorio</h3><span>Modificabili e riutilizzabili</span></div>
            <div className="office-fields">{OFFICE_FIELDS.map(([key,label])=><label key={key}>{label}
              <input type="text" value={merged?.[key]??''} onChange={e=>edit(key,e.target.value)}/></label>)}</div>
            <fieldset className="office-document-choice office-optional-fields">
              <legend>Firmatario in calce al certificato</legend>
              <p className="office-small">La direzione dei lavori nei dati generali non cambia. Qui scegli chi firma per il laboratorio.</p>
              <div className="office-document-options office-document-options--two">
                {[['direttore','Il Direttore del Laboratorio'],['vice','Il Vicedirettore del Laboratorio']].map(([value,label])=>
                  <label key={value} className={'office-document-option '+((merged?.ruoloFirmatarioLaboratorio??merged?.ruoloDirezioneLavori??'direttore')===value?'selected':'')}>
                    <input type="radio" name="qualificaFirmaLaboratorioPalo"
                      checked={(merged?.ruoloFirmatarioLaboratorio??merged?.ruoloDirezioneLavori??'direttore')===value}
                      onChange={()=>edit('ruoloFirmatarioLaboratorio',value)}/>
                    <span>{label}</span>
                  </label>
                )}
              </div>
              <p className="office-small" role="status" style={{marginTop:12,fontWeight:700}}>
                {firmaLaboratorioLabel(merged)} {firmaLaboratorioNome(merged)}
              </p>
            </fieldset>
            <div className="office-optional-fields">
              <label className="office-check-row">
                <input type="checkbox" checked={merged?.mostraProprietario===true}
                  onChange={e=>edit('mostraProprietario',e.target.checked)}/>
                <span>Includi la riga «Proprietario / Ente appaltante» nel certificato</span>
              </label>
              {merged?.mostraProprietario===true&&
                <label className="office-owner-entry">Proprietario / Ente appaltante
                  <input type="text" value={merged?.proprietario??selected.data?.proprietario??''}
                    onChange={e=>edit('proprietario',e.target.value)}/>
                </label>}
            </div>
            <div style={{marginTop:14}}>
              <button type="button" className="office-save" onClick={duplicateLaboratoryData}>Duplica dati laboratorio</button>
              <p className="office-small" style={{marginTop:8}}>
                Copia soltanto i dati amministrativi da una prova gia salvata. Non copia letture, identificativi, date, grafici o fotografie.
              </p>
            </div>
            <fieldset className="office-document-choice">
              <legend>Tipo di documento</legend>
              <div className="office-document-options">{[
                ['auto','Automatico in base al numero'],['rapporto','Rapporto di prova'],['certificato','Certificato di prova']
              ].map(([mode,label])=><label key={mode} className={'office-document-option '+((merged?.modalitaDocumento||'auto')===mode?'selected':'')}>
                <input type="radio" name="tipoDocumentoPalo" value={mode} checked={(merged?.modalitaDocumento||'auto')===mode} onChange={()=>edit('modalitaDocumento',mode)}/><span>{label}</span>
              </label>)}</div>
            </fieldset>
            <div className="office-type"><span>Documento che verrà generato</span><strong>{docType}</strong></div>
            <details className="office-document-advanced"><summary>Impostazioni avanzate · soglia automatica</summary>
              <label>Soglia per la classificazione automatica
                <input type="number" min="0" step="1" value={merged?.sogliaDocumento??135000}
                  onChange={e=>edit('sogliaDocumento',e.target.value)}/></label>
            </details>
          </div>
          <div className="office-card">
            <details className="office-technical-reads" open={showTechnical} onToggle={e=>setShowTechnical(e.currentTarget.open)}>
              <summary>03 · Riepilogo letture tecniche ({result?.rows?.length??0} gradini)</summary>
              <p className="office-small">Letture originali conservate integralmente in Excel, compresi i 9 valori previsti per ogni comparatore. I dati tecnici non vengono modificati qui.</p>
              <div style={{maxHeight:340,overflow:'auto',marginTop:12}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>{['N','Ciclo','Carico kN','C1 mm','C2 mm','C3 mm','Ced. medio'].map(x=><th key={x} style={{padding:6,textAlign:'left',background:'#eee'}}>{x}</th>)}</tr></thead>
                  <tbody>{(result?.rows||[]).map(r=><tr key={r.key}>{[r.stepNo,r.cycleLabel,r.load,r.comparatorValues?.c1,r.comparatorValues?.c2,r.comparatorValues?.c3,r.meanSettlement].map((v,i)=>
                    <td key={i} style={{padding:6,borderBottom:'1px solid #eee'}}>{v===null||v===undefined?'—':v}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </details>
          </div>
          <div className="office-actions">
            <button type="button" className="office-save" disabled={busy} onClick={()=>void save().catch(e=>setMessage('Salvataggio non riuscito: '+e.message))}>Salva elaborazione</button>
            <button type="button" className="office-export" disabled={busy} onClick={()=>void generate()}>{busy?'Generazione...':'Genera certificato Excel A4'}</button>
          </div>
          <p className="office-small">Il foglio principale è impostato su un A4 verticale; l'ufficio può controllare l'anteprima e stampare da Excel. Foto e grafico occupano la colonna destra. Le firme non vengono inventate.</p>
        </>}
      </section>
    </div>
  </main>;
}
