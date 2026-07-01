import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { T } from "../config/theme";
import { ResultCard } from "./Inputs";
import { fmt } from "../utils/formatters";

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;

  return (
    <div className="tip">
      <b>{p.name}</b>
      <br />
      Pressione {fmt(p.pressure, 2)} bar
      <br />
      Cedimento {fmt(p.x, 3)} mm
      <br />
      Carico {fmt(p.y, 2)} kN
    </div>
  );
}

export function LoadDisplacementChart({ result }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 18, bottom: 24, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />

        <XAxis
          type="number"
          dataKey="x"
          name="Cedimento"
          unit=" mm"
          stroke={T.textMuted}
          domain={[0, "dataMax"]}
          label={{
            value: "Cedimento [mm]",
            position: "insideBottom",
            offset: -12,
          }}
        />

        <YAxis
          type="number"
          dataKey="y"
          name="Carico"
          unit=" kN"
          stroke={T.textMuted}
          domain={[0, "dataMax"]}
          label={{
            value: "Carico [kN]",
            angle: -90,
            position: "insideLeft",
          }}
        />

        <Tooltip content={<Tip />} />
        <Legend />

        <Scatter
          name="Comparatore 1"
          data={result.chartC1 || []}
          line={{ stroke: T.cycle1, strokeWidth: 2 }}
          fill={T.cycle1}
        />

        <Scatter
          name="Comparatore 2"
          data={result.chartC2 || []}
          line={{ stroke: T.cycle2, strokeWidth: 2 }}
          fill={T.cycle2}
        />

        <Scatter
          name="Comparatore 3"
          data={result.chartC3 || []}
          line={{ stroke: T.accentOrange, strokeWidth: 2 }}
          fill={T.accentOrange}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function Results({ result, data, setData, chartRef }) {
  return (
    <div>
      <div className="cards">
        <ResultCard
          label="Gradini rilevati"
          value={result.measuredCount}
          unit={`/${result.rows?.length || 0}`}
          color={T.accentBlue}
          sub="gradini con almeno una lettura utile"
        />

        <ResultCard
          label="Cedimento massimo"
          value={fmt(result.maxDisplacement, 3)}
          unit="mm"
          color={T.cycle1}
          sub="valore medio al carico massimo"
        />

        <ResultCard
          label="Residuo allo scarico"
          value={fmt(result.residual, 3)}
          unit="mm"
          color={T.accentOrange}
          sub="cedimento medio residuo"
        />

        <ResultCard
          label="Portata martinetto"
          value={fmt(data.jackCapacityTon || result.jackCapacityTon, 2)}
          unit="t"
          color={T.accentYellow}
          sub={`700 bar · ${fmt(result.pressureReferenceLoadKn, 2)} kN`}
        />

        <ResultCard
          label="Esito dichiarato"
          value={data.outcome || "—"}
          unit=""
          color={data.outcome === "Negativo" ? T.accentRed : T.accent}
          sub="scelto dal tecnico"
        />
      </div>

      <div className="outcome-box">
        <b>Esito della prova</b>

        <div className="outcome-options">
          {["Positivo", "Positivo con osservazioni", "Negativo"].map((item) => (
            <label key={item}>
              <input
                type="radio"
                name="outcome"
                checked={data.outcome === item}
                onChange={() =>
                  setData((p) => ({
                    ...p,
                    outcome: item,
                  }))
                }
              />{" "}
              {item}
            </label>
          ))}
        </div>

        <textarea
          value={data.outcomeNotes || ""}
          onChange={(e) =>
            setData((p) => ({
              ...p,
              outcomeNotes: e.target.value,
            }))
          }
          placeholder="Osservazioni sull'esito della prova"
        />
      </div>

      <div className="chart-box" ref={chartRef}>
        <div className="chart-title">
          <b>Grafico carico / cedimento</b>
          <span>
            Asse X = cedimento dei comparatori, asse Y = carico del gradino.
            Il grafico parte da origine 0.
          </span>
        </div>

        {result.chartAll?.length ? (
          <div className="chart">
            <LoadDisplacementChart result={result} />
          </div>
        ) : (
          <div className="empty">
            Inserisci almeno una lettura per generare il grafico.
          </div>
        )}
      </div>

      <div className="table-box">
        <div className="table-title">
          Tabella carichi, pressioni e cedimenti
        </div>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>N.</th>
                <th>Ciclo</th>
                <th>%</th>
                <th>Pressione bar</th>
                <th>Carico kN</th>
                <th>Portata martinetto kN</th>
                <th>Cedimento medio mm</th>
              </tr>
            </thead>

            <tbody>
              {result.rows.map((r) => (
                <tr key={r.key} className={r.unload ? "unload" : ""}>
                  <td>{r.stepNo}</td>
                  <td>{r.cycleLabel}</td>
                  <td>{r.label}</td>
                  <td>{fmt(r.pressure, 2)}</td>
                  <td>{fmt(r.load, 2)}</td>
                  <td>{fmt(result.pressureReferenceLoadKn, 2)}</td>
                  <td>{fmt(r.reading, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="note">
        <b>Nota tecnica:</b> la pressione viene calcolata automaticamente con
        la proporzione: portata del martinetto : 700 bar = carico del gradino :
        x. Le letture dei 3 comparatori sono manuali; il grafico utilizza le
        letture disponibili e considera stabile ogni comparatore quando le
        ultime 3 letture sono coerenti.
      </div>
    </div>
  );
}