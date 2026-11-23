// Etichette del certificato e campi opzionali dell'ufficio.
// Nessuna modifica ai dati originali del cantiere.
export function direzioneLabel(office = {}) {
  return office.ruoloDirezioneLavori === 'vice' ? 'Vicedirettore dei lavori' : 'Direttore dei lavori';
}

export function certificateRows(data = {}, office = {}) {
  const rows = [
    ['Oggetto dei lavori', 'oggettoLavori'],
    ['Ubicazione cantiere', 'localita'],
    ['Richiedente', 'richiedente'],
    [direzioneLabel(office), 'direzioneLavori'],
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
