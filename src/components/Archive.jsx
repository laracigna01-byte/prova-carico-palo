import { useMemo, useRef, useState } from "react";

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return "—";
  }
}

export function Archive({ items = [], setItems, onOpen, onDuplicate, onExport, onBackup, onRestore, ready = true }) {
  const [query, setQuery] = useState("");
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");
  const [transferError, setTransferError] = useState(false);

  async function handleExport() {
    setTransferMessage("");
    try {
      const result = await onBackup();
      setTransferError(false);
      setTransferMessage(result?.message || "Esportazione avviata.");
    } catch (error) {
      setTransferError(true);
      setTransferMessage(error.message || "Impossibile esportare l'archivio.");
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setTransferMessage("");
    try {
      const result = await onRestore(file);
      setTransferError(false);
      setTransferMessage(result?.message || "Importazione completata.");
    } catch (error) {
      setTransferError(true);
      setTransferMessage(error instanceof SyntaxError ? "Il file selezionato non contiene un JSON valido." : (error.message || "Importazione non riuscita."));
    } finally {
      event.target.value = "";
      setImporting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...items]
      .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
      .filter((item) => {
        if (!q) return true;

        const text = [
          item.id,
          item.data?.pileId,
          item.data?.committente,
          item.data?.cantiere,
          item.data?.localita,
          item.data?.tecnico,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(q);
      });
  }, [items, query]);

  function handleDelete(item) {
    const ok = window.confirm(
      `Eliminare definitivamente la prova ${item.id || item.data?.pileId || ""}?`
    );

    if (!ok) return;

    setItems((previous) => previous.filter((record) => record.id !== item.id));
  }

  return (
    <div className="archive panel">
      <div className="panel-body">
        <div className="section-header">
          <div>F</div>
          <span>Archivio prove</span>
          <i />
        </div>

        <div className="archive-transfer-tools">
          <button className="archive-transfer-button archive-transfer-button--export" type="button" onClick={handleExport} disabled={!ready || importing}>
            <span className="archive-transfer-symbol" aria-hidden="true">↓</span>
            <span className="archive-transfer-copy">
              <strong>Esporta archivio JSON</strong>
              <small>Scarica tutte le prove, le letture e le foto</small>
            </span>
          </button>
          <button className="archive-transfer-button archive-transfer-button--import" type="button" onClick={() => fileRef.current?.click()} disabled={!ready || importing}>
            <span className="archive-transfer-symbol" aria-hidden="true">↑</span>
            <span className="archive-transfer-copy">
              <strong>Importa archivio JSON</strong>
              <small>Carica un backup ricevuto da un altro PC</small>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            aria-label="Seleziona backup JSON archivio pali"
            className="archive-transfer-file"
            onChange={handleImport}
          />
        </div>
        {!ready && <p className="archive-transfer-status" role="status">Caricamento dell'archivio in corso...</p>}
        {importing && <p className="archive-transfer-status" role="status">Lettura e importazione del backup in corso...</p>}
        {transferMessage && <p className={`archive-transfer-status ${transferError ? "archive-transfer-status--error" : ""}`} role="status">{transferMessage}</p>}
        <div className="archive-tools">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per ID, palo, committente, cantiere..."
            aria-label="Cerca nell'archivio prove"
          />
          <small>
            {filtered.length} di {items.length} prove
          </small>
        </div>

        {items.length === 0 ? (
          <p className="hint">
            Nessuna prova salvata. Usa "Salva in archivio" dopo aver compilato
            la scheda.
          </p>
        ) : filtered.length === 0 ? (
          <p className="hint">Nessuna prova trovata con questa ricerca.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Salvata il</th>
                  <th>Palo</th>
                  <th>Committente</th>
                  <th>Cantiere</th>
                  <th>Azioni</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id || "—"}</td>
                    <td>{fmtDate(item.savedAt)}</td>
                    <td>{item.data?.pileId || "—"}</td>
                    <td>{item.data?.committente || "—"}</td>
                    <td>{item.data?.cantiere || "—"}</td>
                    <td className="row-actions">
                      <button type="button" onClick={() => onOpen(item)}>
                        Apri
                      </button>
                      <button type="button" onClick={() => onDuplicate(item)}>
                        Duplica
                      </button>
                      <button type="button" onClick={() => onExport(item)}>
                        PDF
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(item)}
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
