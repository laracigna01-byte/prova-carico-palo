import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { T } from "../config/theme";
import { ResultCard } from "./Inputs";
import { fmt } from "../utils/formatters";

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <div className="tip"><b>{p.name}</b><br />Pressione {fmt(p.pressure, 2)} bar<br />Cedimento {fmt(p.x, 3)} mm<br />Carico {fmt(p.y, 2)} kN</div>;
}

export function LoadDisplacementChart({ result }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 18, bottom: 24, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
        <XAxis type="number" dataKey="x" name="Cedimento" unit=" mm" stroke={T.textMuted} label={{ value: "Cedimento [mm]", position: "insideBottom", offset: -12 }} />
        <YAxis type="number" dataKey="y" name="Carico" unit=" kN" stroke={T.textMuted} label={{ value: "Carico [kN]", angle: -90, position: "insideLeft" }} />
        <Tooltip content={<Tip />} />
        <Legend />
        <Scatter name="Esercizio" data={result.chartExercise || []} line={{ stroke: T.cycle1, strokeWidth: 2 }} fill={T.cycle1} />
        <Scatter name="Collaudo" data={result.chartCollaudo || []} line={{ stroke: T.cycle2, strokeWidth: 2 }} fill={T.cycle2} />
        <Scatter name="Scarico collaudo" data={result.chartUnload || []} line={{ stroke: T.accentOrange, strokeWidth: 2 }} fill={T.accentOrange} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function Results({ result, data, setData, chartRef }) {
  return (
    <div>
      <div className="cards">
        <ResultCard label="Gradini compilati" value={result.measuredCount} unit="/17" color={T.accentBlue} sub="carico e scarico" />
        <ResultCard label="Cedimento a 150%" value={fmt(result.maxDisplacement, 3)} unit="mm" color={T.cycle1} sub="cedimento medio" />
        <ResultCard label="Residuo allo scarico" value={fmt(result.residual, 3)} unit="mm" color={T.accentOrange} sub="cedimento medio" />
        <ResultCard label="Martinetto fisso" value="30" unit="ton" color={T.accentYellow} sub={`700 bar · ${fmt(result.pressureReferenceLoadKn, 2)} kN`} />
        <ResultCard label="Esito dichiarato" value={data.outcome || "—"} unit="" color={data.outcome === "Negativo" ? T.accentRed : T.accent} sub="scelto dal tecnico" />
      </div>

      <div className="outcome-box">
        <b>Esito della prova</b>
        <div className="outcome-options">
          {["Positivo", "Positivo con osservazioni", "Negativo"].map((item) => (
            <label key={item}><input type="radio" name="outcome" checked={data.outcome === item} onChange={() => setData((p) => ({ ...p, outcome: item }))} /> {item}</label>
          ))}
        </div>
        <textarea value={data.outcomeNotes || ""} onChange={(e) => setData((p) => ({ ...p, outcomeNotes: e.target.value }))} placeholder="Osservazioni sull'esito della prova" />
      </div>

      <div className="chart-box" ref={chartRef}>
        <div className="chart-title"><b>Grafico carico / cedimento</b><span>Asse X = cedimento medio dei 3 comparatori, asse Y = carico del gradino calcolato in automatico</span></div>
        {result.chartAll?.length ? <div className="chart"><LoadDisplacementChart result={result} /></div> : <div className="empty">Inserisci le letture per generare il grafico.</div>}
      </div>

      <div className="table-box">
        <div className="table-title">Tabella percentuali e letture</div>
        <div className="scroll">
          <table>
            <thead><tr><th>N.</th><th>Ciclo</th><th>%</th><th>Pressione auto bar</th><th>Carico kN</th><th>Martinetto fisso</th><th>Cedimento medio mm</th></tr></thead>
            <tbody>{result.rows.map((r) => <tr key={r.key} className={r.unload ? "unload" : ""}><td>{r.stepNo}</td><td>{r.cycleLabel}</td><td>{r.label}</td><td>{fmt(r.pressure, 2)}</td><td>{fmt(r.load, 2)}</td><td>{fmt(result.pressureReferenceLoadKn, 2)}</td><td>{fmt(r.reading, 3)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div className="note"><b>Nota tecnica:</b> l’app usa martinetto fisso 30 ton (= 294,30 kN) e manometro fisso 700 bar. I bar vengono calcolati con la proporzione: bar step = kN step × 700 / 294,30. Il tecnico inserisce solo le letture dei 3 comparatori.</div>
    </div>
  );
}
