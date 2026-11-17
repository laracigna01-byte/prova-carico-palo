import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { Header } from "./components/Header";
import { InfoPanel } from "./components/InfoPanel";
import { StepTable } from "./components/StepTable";
import { Results } from "./components/Results";
import { SectionHeader } from "./components/Inputs";
import { SignaturePad } from "./components/SignaturePad";
import { Archive } from "./components/Archive";
import { LOAD_STEPS, initialReadings, DEFAULT_PROJECT } from "./config/testConfig";
import { T } from "./config/theme";
import { calcPalo, validateTest } from "./utils/calculations";
import { exportReport } from "./pdf/exportReport";
import { exportCsv } from "./utils/exportCsv";
import { fmt } from "./utils/formatters";
import { listTests, nextReportId, updateReportCounter, loadServerTests, syncServerTests } from "./utils/storage";
import { LoginGate } from "./security/LoginGate";
export default function App() {
  const [data, setData] = useState(DEFAULT_PROJECT);
  const [readings, setReadings] = useState(initialReadings);
  const [photo, setPhoto] = useState([]);
  const [archive, setArchive] = useState(listTests());
  const chartRef = useRef(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [archiveReady, setArchiveReady] = useState(false);
  const persistenceQueue = useRef(Promise.resolve());

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    loadServerTests()
      .then((savedArchive) => {
        if (!active) return;
        setArchive(savedArchive);
        setArchiveReady(true);
      })
      .catch((error) => {
        console.error("Errore caricamento archivio pali:", error);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!archiveReady) return;
    persistenceQueue.current = persistenceQueue.current
      .catch(() => {})
      .then(() => syncServerTests(archive))
      .catch((error) => console.error("Errore salvataggio archivio pali:", error));
  }, [archive, archiveReady]);

  const result = useMemo(() => calcPalo({
    readings,
    loadSteps: LOAD_STEPS,
    exerciseLoad: data.exerciseLoad,
    testLoad: data.testLoad,
    jackCapacityTon: data.jackCapacityTon,
    pressureReferenceBar: data.pressureReferenceBar,
    tonToKn: data.tonToKn,
  }), [readings, data.exerciseLoad, data.testLoad, data.jackCapacityTon, data.pressureReferenceBar, data.tonToKn]);
  const errors = useMemo(() => validateTest({ data, result, photo }), [data, result, photo]);

  const setReading = (key, value) => setReadings((prev) => ({ ...prev, [key]: value }));

  const cycles = useMemo(() => {
    const groups = new Map();
    result.rows.forEach((step, index) => {
      if (!groups.has(step.cycle)) {
        groups.set(step.cycle, { id: step.cycle, label: step.cycleLabel, first: index, indices: [] });
      }
      groups.get(step.cycle).indices.push(index);
    });
    return [...groups.values()];
  }, [result.rows]);

  function hasReadings(stepKey) {
    const entry = readings[stepKey];
    if (!entry || typeof entry !== "object") return Boolean(entry);
    return Object.values(entry).some((values) =>
      (Array.isArray(values) ? values : [values]).some((value) => String(value ?? "").trim() !== "")
    );
  }

  function scrollToArea(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusStepReading(index) {
    const step = result.rows[index];
    if (!step) return;
    window.requestAnimationFrame(() => {
      const field = document.querySelector(`[data-step-id="${step.key}"] input[data-reading-input]`);
      field?.focus({ preventScroll: true });
      scrollToArea("palo-letture");
    });
  }

  function goToStep(index, focusInput = false) {
    const next = Math.min(Math.max(0, index), Math.max(0, result.rows.length - 1));
    setActiveStepIndex(next);
    if (focusInput) {
      focusStepReading(next);
    } else {
      scrollToArea("palo-letture");
    }
  }

  function nextFromReading(index) {
    if (index < result.rows.length - 1) {
      goToStep(index + 1, true);
    } else {
      window.requestAnimationFrame(() => {
        scrollToArea("palo-azioni");
        document.querySelector("#palo-azioni button")?.focus({ preventScroll: true });
      });
    }
  }

  function goToReadings() {
    focusStepReading(activeStepIndex);
  }


  function newTest() {
    if (!window.confirm("Creare una nuova prova? I dati non salvati verranno persi.")) return;
    setData({ ...DEFAULT_PROJECT, reportId: nextReportId() });
    setReadings(initialReadings());
    setPhoto([]);
    setActiveStepIndex(0);
    setShowAllSteps(false);
  }

  function saveCurrent() {
    const id = data.reportId || nextReportId();
    const nextData = { ...data, reportId: id };
    setData(nextData);
    const record = { id, savedAt: new Date().toISOString(), data: nextData, readings, photos: Array.isArray(photo) ? photo : photo ? [photo] : [] };
    setArchive((previous) => {
      const withoutOld = previous.filter((entry) => entry.id !== id);
      return [record, ...withoutOld];
    });
    window.alert(`Prova ${id} salvata in archivio.`);
  }

 function openRecord(record) {
  const restoredData = {
    ...DEFAULT_PROJECT,
    ...(record.data || {}),
  };

  const restoredReadings = {
    ...initialReadings(),
    ...(record.readings || {}),
  };

  setData(restoredData);
  setReadings(restoredReadings);
  setPhoto(record.photos || (record.photo?.dataUrl ? [record.photo] : []));
  setActiveStepIndex(0);
  setShowAllSteps(false);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function duplicateRecord(record) {
  const newId = nextReportId();

  const duplicatedData = {
    ...DEFAULT_PROJECT,
    ...(record.data || {}),
    reportId: newId,
    pileId: `${record.data?.pileId || "P"}-COPIA`,
  };

  const duplicatedReadings = {
    ...initialReadings(),
    ...(record.readings || {}),
  };

  setData(duplicatedData);
  setReadings(duplicatedReadings);
  setPhoto(record.photos || (record.photo?.dataUrl ? [record.photo] : []));
  setActiveStepIndex(0);
  setShowAllSteps(false);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

  function duplicateDataOnly(record) {
    const newId = nextReportId();
    // Nuova prova: mantiene anagrafica, dati del palo e attrezzature,
    // senza portare le letture o gli allegati specifici della prova originale.
    const duplicatedData = {
      ...DEFAULT_PROJECT,
      ...(record.data || {}),
      reportId: newId,
      signature: "",
    };
    setData(duplicatedData);
    setReadings(initialReadings());
    setPhoto([]);
    setActiveStepIndex(0);
    setShowAllSteps(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadArchive() {
    if (!archiveReady) throw new Error("L'archivio non ha ancora terminato il caricamento.");
    const payload = {
      format: "dismat-pali-archive",
      version: 1,
      exportedAt: new Date().toISOString(),
      tests: archive,
    };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dismat-pali-archivio-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    return { message: `Download avviato: ${archive.length} prove incluse nel file JSON.` };
  }

  async function importArchive(file) {
    if (!file || !archiveReady) throw new Error("L'archivio non è ancora pronto.");
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== "dismat-pali-archive" || parsed?.version !== 1 || !Array.isArray(parsed.tests)) {
      throw new Error("Questo non è un backup JSON valido dell'archivio Palo.");
    }
    const incoming = parsed.tests;
    const incomingIds = new Set();
    for (const record of incoming) {
      if (!record || typeof record !== "object" || Array.isArray(record) ||
          typeof record.id !== "string" || !record.id.trim() ||
          !record.data || typeof record.data !== "object" || Array.isArray(record.data) ||
          !record.readings || typeof record.readings !== "object" || Array.isArray(record.readings) ||
          (record.photos != null && !Array.isArray(record.photos)) || incomingIds.has(record.id)) {
        throw new Error("Il backup contiene prove non valide o ID ripetuti.");
      }
      incomingIds.add(record.id);
    }

    const existing = new Map(archive.map((item) => [item.id, item]));
    const reservedIds = new Set([...existing.keys(), ...incomingIds]);
    let sequence = Math.max(0, ...Array.from(reservedIds)
      .map((id) => /^PAL-(\d{4})-(\d+)$/.exec(id))
      .filter((match) => match && Number(match[1]) === new Date().getFullYear())
      .map((match) => Number(match[2])));
    function uniqueId() {
      let id;
      do {
        sequence += 1;
        id = `PAL-${new Date().getFullYear()}-${String(sequence).padStart(3, "0")}`;
      } while (reservedIds.has(id));
      reservedIds.add(id);
      return id;
    }

    const additions = [];
    let duplicates = 0;
    let renamed = 0;
    for (const record of incoming) {
      const previous = existing.get(record.id);
      if (!previous) {
        additions.push(record);
      } else if (JSON.stringify(previous) === JSON.stringify(record)) {
        duplicates += 1;
      } else {
        const id = uniqueId();
        additions.push({ ...record, id, data: { ...record.data, reportId: id } });
        renamed += 1;
      }
    }
    if (!additions.length) return { message: `Nessuna nuova prova da importare: ${duplicates} già presenti.` };

    const summary = [
      `Nuove prove da importare: ${additions.length}.`,
      renamed ? `${renamed} con ID diverso (conflitti tra PC): saranno conservate entrambe le prove.` : "",
      duplicates ? `${duplicates} prove già identiche saranno ignorate.` : "",
      "Le prove esistenti resteranno intatte. Procedere?",
    ].filter(Boolean).join("\n");
    if (!window.confirm(summary)) return { message: "Importazione annullata: nessuna modifica effettuata." };

    const merged = [...archive, ...additions];
    await persistenceQueue.current;
    await syncServerTests(merged);
    updateReportCounter(merged);
    setArchive(merged);
    return {
      message: `Importazione riuscita: ${additions.length} prove aggiunte` +
        (renamed ? `, ${renamed} ID rinominati` : "") +
        (duplicates ? `, ${duplicates} duplicati identici ignorati.` : "."),
    };
  }

  function exportCurrent() {
    exportReport({ data, result, photo });
  }

  function exportRecord(record) {
    const recResult = calcPalo({
      readings: record.readings,
      loadSteps: LOAD_STEPS,
      exerciseLoad: record.data.exerciseLoad,
      testLoad: record.data.testLoad,
      jackCapacityTon: record.data.jackCapacityTon,
      pressureReferenceBar: record.data.pressureReferenceBar,
      tonToKn: record.data.tonToKn,
    });
    exportReport({ data: record.data, result: recResult, photo: record.photos || record.photo, chartNode: null });
  }

  return (
  <LoginGate
    appName="Sistema Gestione Prove DISMAT"
    moduleName="Prova di carico su palo"
  >
    <main className="app-shell">
      <Header
        theme={theme}
        setTheme={setTheme}
      />
      <nav className="palo-quick-nav" aria-label="Vai a una sezione">
        <button type="button" onClick={() => scrollToArea("palo-dati")}>Dati prova</button>
        <button type="button" onClick={goToReadings}>Letture</button>
        <button type="button" onClick={() => scrollToArea("palo-risultati")}>Risultati e PDF</button>
        <button type="button" onClick={() => scrollToArea("palo-archivio")}>Archivio</button>
      </nav>
      <InfoPanel data={data} setData={setData} photo={photo} setPhoto={setPhoto} onGoToReadings={goToReadings} />

      <section className="summary-strip">
        <div><span>Ne esercizio</span><b>{fmt(Number(data.exerciseLoad || result.baseLoad || 0), 2)} kN</b></div>
        <div><span>Collaudo 150%</span><b>{fmt(Number(data.testLoad || result.maxTestLoad || 0), 2)} kN</b></div>
        <div><span>Portata martinetto</span><b>{fmt(result.pressureReferenceLoadKn, 2)} kN</b></div>
        <div><span>Martinetto</span><b>{fmt(result.jackCapacityTon, 2)} t / 700 bar</b></div>
        <div><span>Foto prova</span><b>{(Array.isArray(photo) ? photo.length : photo ? 1 : 0) + " foto"}</b></div>
      </section>

      {errors.length > 0 && <div className="warning-box"><b>Controlli prima del PDF:</b> {errors.join(" - ")}</div>}

      <section className="workbench" id="palo-letture">
        <div className="left-col">
          <SectionHeader label="Tabella prova - 3 comparatori" step="1" color={T.accentBlue} />
          <p className="hint">La tabella segue i cicli di esercizio e collaudo. La pressione è calcolata con la portata del martinetto; il tecnico inserisce almeno 9 letture per ciascuno dei 3 comparatori.</p>
          <div className="palo-step-workflow">
            <div className="palo-cycle-tabs" role="group" aria-label="Seleziona ciclo della prova">
              {cycles.map((cycle) => {
                const completed = cycle.indices.filter((index) => hasReadings(result.rows[index].key)).length;
                const active = result.rows[activeStepIndex]?.cycle === cycle.id;
                return (
                  <button key={cycle.id} type="button" className={active ? "is-active" : ""}
                    aria-pressed={active} onClick={() => goToStep(cycle.first, true)}>
                    <strong>{cycle.label}</strong>
                    <small>{completed}/{cycle.indices.length} gradini compilati</small>
                  </button>
                );
              })}
            </div>
            <div className="palo-step-nav">
              <div className="palo-step-nav-title">
                <b>Gradino {activeStepIndex + 1} di {result.rows.length}</b>
                <span>Invio = lettura successiva</span>
              </div>
              <select aria-label="Vai direttamente al gradino" value={activeStepIndex}
                onChange={(event) => goToStep(Number(event.target.value), true)}>
                {result.rows.map((step, index) => (
                  <option key={step.key} value={index}>
                    {index + 1}. {step.cycleLabel} - {step.label}{hasReadings(step.key) ? " ✓" : ""}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => goToStep(activeStepIndex - 1, true)} disabled={activeStepIndex === 0}>
                ← Precedente
              </button>
              <button type="button" onClick={() => goToStep(activeStepIndex + 1, true)}
                disabled={activeStepIndex === result.rows.length - 1}>
                Successivo →
              </button>
            </div>
            <label className="palo-show-all">
              <input type="checkbox" checked={showAllSteps} onChange={(event) => setShowAllSteps(event.target.checked)} />
              Mostra tutti i gradini (riepilogo completo)
            </label>
          </div>
          <div className="steps one-col palo-steps">
            {result.rows.map((row, index) => (
              (showAllSteps || index === activeStepIndex) && (
                <StepTable
                  key={row.key}
                  step={row}
                  load={row.load}
                  targetLoad={row.targetLoad}
                  pressure={row.pressure}
                  value={readings[row.key]}
                  onChange={(value) => setReading(row.key, value)}
                  onNextStep={() => nextFromReading(index)}
                  color={row.unload ? T.accentOrange : T.cycle2}
                />
              )
            ))}
          </div>
          {!showAllSteps && (
            <div className="palo-step-footer">
              <button type="button" onClick={() => goToStep(activeStepIndex - 1, true)} disabled={activeStepIndex === 0}>← Gradino precedente</button>
              <button type="button" onClick={() => nextFromReading(activeStepIndex)}>
                {activeStepIndex === result.rows.length - 1 ? "Vai al PDF e salvataggio →" : "Gradino successivo →"}
              </button>
            </div>
          )}
        </div>
        <aside className="right-col" id="palo-risultati">
          <SectionHeader label="Grafico, firma e report" step="2" color={T.accent} />
          <Results result={result} data={data} chartRef={chartRef} />
          <SectionHeader label="Firma tecnico" step="3" color={T.accentYellow} />
          <SignaturePad value={data.signature} onChange={(signature) => setData((prev) => ({ ...prev, signature }))} />
          <div className="actions" id="palo-azioni">
            <button onClick={exportCurrent}>Genera PDF</button>
            <button className="ghost" onClick={saveCurrent}>Salva in archivio</button>
            <button className="ghost" onClick={() => exportCsv({ data, result })}>CSV Excel</button>
            <button className="ghost danger" onClick={newTest}>Nuova prova</button>
          </div>
        </aside>
      </section>

      <div id="palo-archivio" className="palo-archive-anchor"><Archive items={archive} setItems={setArchive} onOpen={openRecord} onDuplicate={duplicateRecord} onDuplicateData={duplicateDataOnly} onExport={exportRecord} onBackup={downloadArchive} onRestore={importArchive} ready={archiveReady} /></div>
    </main>
  </LoginGate>
  );
}
