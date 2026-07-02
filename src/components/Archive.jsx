import { useMemo, useState } from "react";
import { deleteTest } from "../utils/storage";

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return "—";
  }
}

export function Archive({ items = [], setItems, onOpen, onDuplicate, onExport }) {
  const [query, setQuery] = useState("");

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
          item.data?.outcome,
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

    setItems(deleteTest(item.id));
  }

  return (
    <div className="archive panel">
      <div className="panel-body">
        <div className="section-header">
          <div>F</div>
          <span>Archivio prove</span>
          <i />
        </div>

        <div className="archive-tools">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per ID, palo, committente, cantiere, esito..."
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
                  <th>Esito</th>
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
                    <td>{item.data?.outcome || "—"}</td>
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
