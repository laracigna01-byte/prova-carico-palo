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
import { listTests, nextReportId, saveTest, writeTests, loadServerTests, syncServerTests } from "./utils/storage";

export default function App() {
  const [data, setData] = useState(DEFAULT_PROJECT);
  const [readings, setReadings] = useState(initialReadings);
  const [photo, setPhoto] = useState(null);
  const [archive, setArchive] = useState(listTests());
  const chartRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      const savedArchive = await loadServerTests();
      if (savedArchive.length) setArchive(savedArchive);
    })();
  }, []);

  useEffect(() => {
    writeTests(archive);
    syncServerTests(archive);
  }, [archive]);

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

  function newTest() {
    if (!window.confirm("Creare una nuova prova? I dati non salvati verranno persi.")) return;
    setData({ ...DEFAULT_PROJECT, reportId: nextReportId() });
    setReadings(initialReadings());
    setPhoto(null);
  }

  function saveCurrent() {
    const id = data.reportId || nextReportId();
    const nextData = { ...data, reportId: id };
    setData(nextData);
    const record = { id, savedAt: new Date().toISOString(), data: nextData, readings, photo };
    setArchive(saveTest(record));
    window.alert(`Prova ${id} salvata in archivio.`);
  }

  function openRecord(record) {
    setData(record.data);
    setReadings(record.readings || initialReadings());
    setPhoto(record.photo || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function duplicateRecord(record) {
    setData({ ...record.data, reportId: nextReportId(), pileId: `${record.data.pileId || "P"}-COPIA` });
    setReadings(record.readings || initialReadings());
    setPhoto(record.photo || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    exportReport({ data: record.data, result: recResult, photo: record.photo, chartNode: null });
  }

  return (
    <main className="app-shell">
      <Header
  theme={theme}
  setTheme={setTheme}
/>
      <InfoPanel data={data} setData={setData} photo={photo} setPhoto={setPhoto} />

      <section className="summary-strip">
        <div><span>Ne esercizio</span><b>{fmt(Number(data.exerciseLoad || result.baseLoad || 0), 2)} kN</b></div>
        <div><span>Collaudo 150%</span><b>{fmt(Number(data.testLoad || result.maxTestLoad || 0), 2)} kN</b></div>
        <div><span>Portata martinetto</span><b>{fmt(result.pressureReferenceLoadKn, 2)} kN</b></div>
        <div><span>Martinetto</span><b>{fmt(result.jackCapacityTon, 2)} t / 700 bar</b></div>
        <div><span>Foto prova</span><b>{photo ? "Presente" : "Mancante"}</b></div>
      </section>

      {errors.length > 0 && <div className="warning-box"><b>Controlli prima del PDF:</b> {errors.join(" - ")}</div>}

      <section className="workbench">
        <div className="left-col">
          <SectionHeader label="Tabella prova - 3 comparatori" step="1" color={T.accentBlue} />
          <p className="hint">La tabella segue i cicli di esercizio e collaudo. La pressione è calcolata con la portata del martinetto; il tecnico inserisce almeno 9 letture per ciascuno dei 3 comparatori.</p>
          <div className="steps one-col">
            {result.rows.map((row, index) => (
              <StepTable
                key={row.key}
                step={row}
                load={row.load}
                targetLoad={row.targetLoad}
                pressure={row.pressure}
                value={readings[row.key]}
                onChange={(value) => setReading(row.key, value)}
                color={row.unload ? T.accentOrange : T.cycle2}
              />
            ))}
          </div>
        </div>
        <aside className="right-col">
          <SectionHeader label="Grafico, esito, firma e report" step="2" color={T.accent} />
          <Results result={result} data={data} setData={setData} chartRef={chartRef} />
          <SectionHeader label="Firma tecnico" step="3" color={T.accentYellow} />
          <SignaturePad value={data.signature} onChange={(signature) => setData((prev) => ({ ...prev, signature }))} />
          <div className="actions">
            <button onClick={exportCurrent}>Genera PDF</button>
            <button className="ghost" onClick={saveCurrent}>Salva in archivio</button>
            <button className="ghost" onClick={() => exportCsv({ data, result })}>CSV Excel</button>
            <button className="ghost danger" onClick={newTest}>Nuova prova</button>
          </div>
        </aside>
      </section>

      <Archive items={archive} setItems={setArchive} onOpen={openRecord} onDuplicate={duplicateRecord} onExport={exportRecord} />
    </main>
  );
}
