import { deleteTest } from "../utils/storage";

export function Archive({ items, setItems, onOpen, onDuplicate, onExport }) {
  return (
    <div className="archive panel">
      <div className="panel-body">
        <div className="section-header"><div>F</div><span>Archivio prove</span><i /></div>
        {items.length === 0 ? <p className="hint">Nessuna prova salvata. Usa "Salva in archivio" dopo aver compilato la scheda.</p> : (
          <div className="scroll">
            <table>
              <thead><tr><th>ID</th><th>Data</th><th>Palo</th><th>Committente</th><th>Esito</th><th>Azioni</th></tr></thead>
              <tbody>{items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td><td>{item.data?.dataProva}</td><td>{item.data?.pileId}</td><td>{item.data?.committente}</td><td>{item.data?.outcome}</td>
                  <td className="row-actions"><button onClick={() => onOpen(item)}>Apri</button><button onClick={() => onDuplicate(item)}>Duplica</button><button onClick={() => onExport(item)}>PDF</button><button className="danger" onClick={() => setItems(deleteTest(item.id))}>Elimina</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
