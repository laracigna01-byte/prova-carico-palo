import { T } from "../config/theme";
import { fmt } from "../utils/formatters";

const keys = ["c1", "c2", "c3"];
const labels = { c1: "Comparatore 1", c2: "Comparatore 2", c3: "Comparatore 3" };

function normalizeList(value) {
  if (Array.isArray(value)) return Array.from({ length: 9 }, (_, i) => value[i] ?? "");
  if (value === null || value === undefined || value === "") return Array(9).fill("");
  return [value, ...Array(8).fill("")];
}

function normalize(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(keys.map((key) => [key, normalizeList(value[key])]));
  }
  return { c1: normalizeList(value), c2: Array(9).fill(""), c3: Array(9).fill("") };
}

function numericCount(values) {
  return values
    .map((v) => Number(String(v || "").replace(",", ".")))
    .filter(Number.isFinite).length;
}

export function StepTable({ step, load, targetLoad, pressure, value = {}, onChange, color }) {
  const readings = normalize(value);
  const counts = Object.fromEntries(keys.map((key) => [key, numericCount(readings[key])]));
  const complete = keys.every((key) => counts[key] >= 9);
  const overLimit = Number(pressure) > 700;

  const updateReading = (compKey, index, nextValue) => {
    const nextComp = [...readings[compKey]];
    nextComp[index] = nextValue;
    onChange({ ...readings, [compKey]: nextComp });
  };

  return (
    <div className={`step-table ${step.unload ? "is-unload" : ""}`} style={{ borderColor: step.unload ? T.accentOrange : T.border }}>
      <div className="step-head">
        <div>
          <b style={{ color }}>{fmt(load, 2)} kN</b>
          <span>{step.cycleLabel} · {step.label}</span>
          <small className="target-load">carico gradino calcolato sul carico di esercizio</small>
        </div>
        <div className="step-status"><mark className={complete ? "ok" : "pending"}>{complete ? "LETTURE OK" : "9 LETTURE / COMP."}</mark></div>
      </div>

      <div className="pressure-row auto-pressure">
        <label>Pressione calcolata [bar]</label>
        <output style={{ color: overLimit ? "#f85149" : undefined, fontWeight: overLimit ? 900 : undefined }}>
          {pressure === null ? "—" : `${fmt(pressure, 2)} bar`}
        </output>
      </div>

      {overLimit && (
        <div className="step-warning">⚠ Pressione superiore a 700 bar: verificare la portata del martinetto.</div>
      )}

      <div className="multi-comparator-grid">
        {keys.map((key) => (
          <div className="comparator-block" key={key}>
            <div className="comparator-title">
              <b>{labels[key]}</b>
              <span>{counts[key]}/9 letture</span>
            </div>
            <div className="reading-nine-grid">
              {readings[key].map((reading, index) => (
                <label key={`${key}-${index}`}>
                  <small>{index + 1}</small>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={reading || ""}
                    onChange={(e) => updateReading(key, index, e.target.value)}
                    placeholder="0,00"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
