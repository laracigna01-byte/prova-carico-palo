// Etichette del certificato e campi opzionali dell'ufficio.
// Nessuna modifica ai dati originali del cantiere.
export function firmaLaboratorioLabel(office = {}) {
  // Compatibilita con i dati di ufficio salvati prima dello spostamento
  // della scelta dalla direzione lavori al blocco firme.
  const ruolo = office.ruoloFirmatarioLaboratorio ?? office.ruoloDirezioneLavori ?? 'direttore';
  return ruolo === 'vice' ? 'Il Vicedirettore del Laboratorio' : 'Il Direttore del Laboratorio';
}

export function firmaLaboratorioNome(office = {}) {
  // Nominativi fissi richiesti per la firma; non dipendono dai campi storici
  // eventualmente salvati dalla vecchia elaborazione.
  const ruolo = office.ruoloFirmatarioLaboratorio ?? office.ruoloDirezioneLavori ?? 'direttore';
  return ruolo === 'vice' ? 'Dott. Ing Giuseppe Navarra' : 'Dott. Ing. Elio Lo Giudice';
}

export function certificateRows(data = {}, office = {}) {
  const rows = [
    ['Oggetto dei lavori', 'oggettoLavori'],
    ['Ubicazione cantiere', 'localita'],
    ['Richiedente', 'richiedente'],
    ['Direttore dei lavori', 'direzioneLavori'],
    ['Impresa', 'impresa']
  ];
  if (office.mostraProprietario === true) {
    rows.push(['Proprietario / Ente appaltante', 'proprietario']);
  }
  rows.push(['Direttore di stabilimento/produzione', 'direttoreStabilimento']);
  rows.push(['Prova eseguita da', 'tecnico']);
  return rows.map(([label, key]) => ({
    label, key,
    value: office[key] ?? data[key] ?? (key === 'richiedente' ? data.committente : key === 'localita' ? data.cantiere : '')
  }));
}

export const LABORATORY_SHARED_KEYS=Object.freeze([
  'oggettoLavori','richiedente','direzioneLavori','impresa',
  'proprietario','mostraProprietario','direttoreStabilimento','ruoloFirmatarioLaboratorio'
]);

// Duplica esclusivamente dati comuni gia salvati in Elaborazioni.
// Nessun ID, data, carico, lettura, risultato o fotografia viene copiato.
export function latestLaboratoryData(records=[],targetId){
  const saved=records.filter(r=>r&&r.id!==targetId&&r.officeSavedAt&&r.office&&typeof r.office==='object')
    .sort((a,b)=>String(b.officeSavedAt).localeCompare(String(a.officeSavedAt)));
  for(const source of saved){
    const values={};
    for(const key of LABORATORY_SHARED_KEYS){
      const fromOffice=source.office[key];
      const value=fromOffice!==undefined&&fromOffice!==null?fromOffice:source.data?.[key];
      if(value!==undefined&&value!==null&&value!==''&&typeof value!=='object')values[key]=value;
    }
    if(Object.keys(values).length)return {source,values};
  }
  return null;
}
